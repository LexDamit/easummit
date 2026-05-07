const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')

const getAdminDb = () => {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    return null
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    })
  }

  return getFirestore()
}

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
    const bookingReference =
      payload.checkout_reference ||
      payload.checkoutReference ||
      payload.reference ||
      null
    const db = getAdminDb()

    console.log('Incoming SumUp webhook payload:', payload)

    if (db && bookingReference) {
      const normalizedState = normalizePaymentState(payload)

      await db.collection('registrations').doc(bookingReference).set(
        {
          paymentStatus: normalizedState.paymentStatus,
          paymentConfirmed: normalizedState.paymentConfirmed,
          orderStatus: normalizedState.orderStatus,
          paymentStage: 'webhook_received',
          paidAt: normalizedState.paidAt,
          webhookPayload: payload,
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      )
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
