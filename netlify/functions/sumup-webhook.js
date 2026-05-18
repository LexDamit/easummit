const { Timestamp } = require('firebase-admin/firestore')
const { getAdminDb } = require('./_lib/firebase-admin')
const { sendConfirmationEmail } = require('./_lib/resend')

const normalizePaymentState = (payload) => {
  const rawStatus = String(
    payload.status ||
      payload.transaction_status ||
      payload.payment_status ||
      payload.state ||
      'webhook_received',
  ).toLowerCase()

  const isPaid =
    rawStatus.includes('paid') ||
    rawStatus.includes('success') ||
    rawStatus.includes('completed') ||
    rawStatus.includes('settled')

  const isCancelled =
    rawStatus.includes('cancel') || rawStatus.includes('expired')

  const isFailed =
    rawStatus.includes('fail') ||
    rawStatus.includes('declin') ||
    rawStatus.includes('error')

  return {
    paymentStatus: rawStatus,
    paymentConfirmed: isPaid,
    orderStatus: isPaid
      ? 'confirmed'
      : isCancelled
        ? 'cancelled'
        : isFailed
          ? 'failed'
          : 'pending_payment',
    paidAt: isPaid ? Timestamp.now() : null,
  }
}

const fetchCheckoutFromSumUp = async (checkoutId) => {
  if (!checkoutId || !process.env.SUMUP_API_KEY) {
    return null
  }

  const response = await fetch(
    `https://api.sumup.com/v0.1/checkouts/${encodeURIComponent(checkoutId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.SUMUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
    },
  )

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(
      data.message || data.error || 'Unable to verify SumUp checkout status.',
    )
  }

  return data
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const payload = JSON.parse(event.body || '{}')
    const payloadReference =
      payload.checkout_reference ||
      payload.checkoutReference ||
      payload.reference ||
      null
    const checkoutId = payload.id || payload.checkout_id || payload.checkoutId || null
    const db = getAdminDb()

    console.log('Incoming SumUp webhook payload:', payload)

    if (db) {
      const verifiedCheckout =
        payload.event_type === 'CHECKOUT_STATUS_CHANGED' || checkoutId
          ? await fetchCheckoutFromSumUp(checkoutId)
          : null
      const bookingReference =
        verifiedCheckout?.checkout_reference || payloadReference || null
      const normalizedState = normalizePaymentState(verifiedCheckout || payload)

      if (!bookingReference) {
        throw new Error('Webhook payload could not be matched to a booking reference.')
      }

      const docRef = db.collection('registrations').doc(bookingReference)
      let snapshot = await docRef.get()
      let existingRegistration = snapshot.exists ? snapshot.data() : null

      if (!existingRegistration && checkoutId) {
        const byCheckoutQuery = await db
          .collection('registrations')
          .where('sumupCheckoutId', '==', checkoutId)
          .limit(1)
          .get()

        if (!byCheckoutQuery.empty) {
          snapshot = byCheckoutQuery.docs[0]
          existingRegistration = snapshot.data()
        }
      }

      if (!existingRegistration) {
        throw new Error('Webhook received for an unknown registration.')
      }

      const registrationRef =
        snapshot.ref || db.collection('registrations').doc(bookingReference)
      const updatePayload = {
        paymentStatus: normalizedState.paymentStatus,
        paymentConfirmed: normalizedState.paymentConfirmed,
        orderStatus: normalizedState.orderStatus,
        paymentStage: 'webhook_received',
        paidAt:
          normalizedState.paidAt ||
          existingRegistration?.paidAt ||
          null,
        sumupCheckoutId:
          verifiedCheckout?.id ||
          checkoutId ||
          existingRegistration?.sumupCheckoutId ||
          null,
        transactionId:
          verifiedCheckout?.transaction_id ||
          payload.transaction_id ||
          existingRegistration?.transactionId ||
          null,
        webhookPayload: payload,
        verifiedCheckoutPayload: verifiedCheckout || null,
        updatedAt: Timestamp.now(),
      }

      await registrationRef.set(updatePayload, { merge: true })

      const canSendConfirmation =
        normalizedState.paymentConfirmed &&
        existingRegistration &&
        !existingRegistration?.confirmationEmail?.sentAt

      if (canSendConfirmation) {
        const mergedRegistration = {
          ...existingRegistration,
          ...updatePayload,
          bookingReference,
        }

        try {
          const emailResult = await sendConfirmationEmail({
            registration: mergedRegistration,
            baseUrl: process.env.APP_URL,
          })

          await registrationRef.set(
            {
              confirmationEmail: {
                deliveryState: emailResult.skipped ? 'skipped' : 'sent',
                sentAt: emailResult.skipped ? null : Timestamp.now(),
                lastAttemptAt: Timestamp.now(),
                emailId: emailResult.emailId || null,
                to: emailResult.to || null,
                skippedReason: emailResult.reason || null,
                error: null,
              },
              updatedAt: Timestamp.now(),
            },
            { merge: true },
          )
        } catch (emailError) {
          console.error('confirmation-email error', emailError)

          await registrationRef.set(
            {
              confirmationEmail: {
                deliveryState: 'failed',
                sentAt: null,
                lastAttemptAt: Timestamp.now(),
                emailId: null,
                to:
                  existingRegistration?.primaryParticipant?.email ||
                  existingRegistration?.participants?.[0]?.email ||
                  null,
                skippedReason: null,
                error:
                  emailError.message ||
                  'Unable to send confirmation email.',
              },
              updatedAt: Timestamp.now(),
            },
            { merge: true },
          )
        }
      }
    }

    // TODO: Verify the SumUp webhook signature or signing secret for production.
    // TODO: Map the exact payload status values from your SumUp account to paid/failed/refunded labels.

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true }),
    }
  } catch (error) {
    console.error('sumup-webhook error', error)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received: true }),
    }
  }
}
