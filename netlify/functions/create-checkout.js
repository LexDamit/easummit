const { Timestamp } = require('firebase-admin/firestore')
const { getAdminDb } = require('./_lib/firebase-admin')

const getHostedCheckoutUrl = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  return (
    payload.hosted_checkout_url ||
    payload.hostedCheckoutUrl ||
    payload.checkout_url ||
    payload.checkoutUrl ||
    payload.url ||
    payload.links?.payment ||
    payload.links?.checkout
  )
}

const getOrderStatusFromPayment = (paymentStatus, paymentConfirmed) => {
  if (paymentConfirmed) {
    return 'confirmed'
  }

  if (String(paymentStatus || '').toLowerCase().includes('cancel')) {
    return 'cancelled'
  }

  if (String(paymentStatus || '').toLowerCase().includes('fail')) {
    return 'failed'
  }

  return 'pending_payment'
}

const isAttendanceConfirmedFromStatus = (paymentStatus, paymentConfirmed) => {
  const normalized = String(paymentStatus || '').toLowerCase()

  return (
    Boolean(paymentConfirmed) ||
    normalized.includes('paid') ||
    normalized.includes('success') ||
    normalized.includes('complete') ||
    normalized.includes('settled') ||
    normalized.includes('invite') ||
    normalized.includes('guest') ||
    normalized.includes('complimentary') ||
    normalized.includes('free')
  )
}

const buildParticipantFingerprint = (participants = []) =>
  participants
    .map((participant) =>
      [
        participant?.firstName,
        participant?.lastName,
        participant?.email,
        participant?.country,
        participant?.memberFederation,
        participant?.role,
        participant?.gender,
      ]
        .map((value) => String(value || '').trim().toLowerCase())
        .join('|'),
    )
    .join('||')

const loadTrustedCatalog = async () => {
  const db = getAdminDb()

  if (!db) {
    throw new Error(
      'Server catalog unavailable. Firebase Admin environment variables are required for checkout pricing.',
    )
  }

  const snapshot = await db.collection('cms').doc('registrationCatalog').get()

  if (!snapshot.exists) {
    throw new Error(
      'Server catalog unavailable. Firestore document cms/registrationCatalog was not found.',
    )
  }

  const value = snapshot.data().value

  if (!value?.variants?.length) {
    throw new Error(
      'Server catalog unavailable. Firestore registration catalog is empty or invalid.',
    )
  }

  return value
}

const ensureAddon = (addons = [], addon) => {
  if (addons.some((item) => item.id === addon.id)) {
    return addons
  }

  return [...addons, addon]
}

const normalizeTrustedCatalog = (catalog) => {
  const variants = (catalog?.variants || []).map((variant) => {
    if (variant.id !== 'local') {
      return variant
    }

    return {
      ...variant,
      packageOptions: (variant.packageOptions || []).map((option) => ({
        ...option,
        price: 0,
      })),
    }
  })

  return {
    ...catalog,
    variants,
    addonsByVariant: {
      ...(catalog?.addonsByVariant || {}),
      local: {
        ...(catalog?.addonsByVariant?.local || {}),
        single: ensureAddon(catalog?.addonsByVariant?.local?.single || [], {
          id: 'lunches-coffee-breaks',
          name: 'Lunches & Coffee Breaks',
          price: 62,
        }),
        double: ensureAddon(catalog?.addonsByVariant?.local?.double || [], {
          id: 'lunches-coffee-breaks',
          name: 'Lunches & Coffee Breaks',
          price: 124,
        }),
      },
    },
  }
}

const validateParticipants = (participants, participantCount) => {
  if (!Array.isArray(participants) || participants.length !== participantCount) {
    return false
  }

  return participants.every((participant) =>
    ['firstName', 'lastName', 'email', 'country', 'memberFederation', 'role', 'gender'].every(
      (field) => String(participant?.[field] || '').trim(),
    ),
  )
}

const getBaseAppUrl = (event) => {
  const forwardedProto =
    event.headers['x-forwarded-proto'] || event.headers['X-Forwarded-Proto']
  const forwardedHost =
    event.headers['x-forwarded-host'] ||
    event.headers['X-Forwarded-Host'] ||
    event.headers.host ||
    event.headers.Host

  if (forwardedHost) {
    const protocol = forwardedProto || (forwardedHost.includes('localhost') ? 'http' : 'https')
    return `${protocol}://${forwardedHost}`.replace(/\/+$/, '')
  }

  return String(process.env.APP_URL || '').replace(/\/+$/, '')
}

const getWebhookBaseUrl = (event) => {
  const baseUrl = getBaseAppUrl(event)
  const forcedUrl = String(process.env.WEBHOOK_BASE_URL || '').replace(/\/+$/, '')

  if (forcedUrl) {
    return forcedUrl
  }

  return baseUrl
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
    const {
      variantId,
      packageType = 'single',
      addonIds = [],
      participants = [],
      language = 'en',
      clientSubmissionId = '',
    } = JSON.parse(event.body || '{}')

    const catalog = normalizeTrustedCatalog(await loadTrustedCatalog())
    const variant = catalog.variants.find((item) => item.id === variantId)
    const selectedPackage = variant?.packageOptions?.find(
      (item) => item.id === packageType,
    )

    if (!variant || !selectedPackage) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid registration page selected.' }),
      }
    }

    const participantCount = Number(selectedPackage.participantCount || 1)
    const sanitizedParticipants = Array.isArray(participants)
      ? participants.slice(0, participantCount)
      : []

    if (!validateParticipants(sanitizedParticipants, participantCount)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Participant information is incomplete.' }),
      }
    }

    const availableAddons = [
      ...(catalog.addonsByPackage?.[packageType] ?? []),
      ...(catalog.addonsByVariant?.[variant.id]?.[packageType] ?? []),
    ]
    const addons = availableAddons.filter((item) => addonIds.includes(item.id))
    const totalAmount =
      Number(selectedPackage.price) +
      addons.reduce((sum, item) => sum + Number(item.price || 0), 0)

    const bookingReference = `FLA-${Date.now()}`
    const db = getAdminDb()
    const primaryParticipant = sanitizedParticipants[0] || {}
    const attendeeName = [
      primaryParticipant.firstName,
      primaryParticipant.lastName,
    ]
      .filter(Boolean)
      .join(' ')
      .trim()

    const normalizedSubmissionId = String(clientSubmissionId || '').trim()
    const requestFingerprint = [
      variant.id,
      packageType,
      [...addonIds].sort().join(','),
      buildParticipantFingerprint(sanitizedParticipants),
    ].join('::')
    const redirectUrl = `${getBaseAppUrl(event)}/${variant.id}?status=success&ref=${encodeURIComponent(
      bookingReference,
    )}`

    let requestRef = null
    if (db && normalizedSubmissionId) {
      requestRef = db.collection('checkoutRequests').doc(normalizedSubmissionId)

      try {
        await requestRef.create({
          clientSubmissionId: normalizedSubmissionId,
          requestFingerprint,
          variantId: variant.id,
          packageType,
          participantEmail: primaryParticipant.email || '',
          createdAt: Timestamp.now(),
          status: 'started',
        })
      } catch (error) {
        const existing = await requestRef.get()
        const existingData = existing.exists ? existing.data() : null

        if (existingData?.checkoutUrl && existingData?.bookingReference) {
          return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              success: true,
              checkoutUrl: existingData.checkoutUrl,
              bookingReference: existingData.bookingReference,
              duplicate: true,
            }),
          }
        }

        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: 'This registration is already being created. Please wait a moment.',
          }),
        }
      }
    }

   if (totalAmount <= 0) {
      if (!db) {
        throw new Error(
          'Server catalog unavailable. Firebase Admin environment variables are required for free registrations.',
        )
      }

      const freePaymentStatus = 'free'
      const freePaymentConfirmed = true

      await db.collection('registrations').doc(bookingReference).set({
        bookingReference,
        variantId: variant.id,
        variantName: variant.title,
        packageType,
        packageName: selectedPackage.name,
        participantCount,
        baseItem: {
          name: selectedPackage.baseItemName,
          price: Number(selectedPackage.price),
        },
        addons,
        totalAmount,
        currency: 'EUR',
        language: language === 'fr' ? 'fr' : 'en',
        participants: sanitizedParticipants,
        primaryParticipant,
        paymentStatus: freePaymentStatus,
        paymentConfirmed: freePaymentConfirmed,
        orderStatus: getOrderStatusFromPayment(
          freePaymentStatus,
          freePaymentConfirmed,
        ),
        paymentStage: 'free_registration',
        paidAt: Timestamp.now(),
        hotelRoom: '',
        adminNotes: '',
        hostedCheckoutUrl: redirectUrl,
        clientSubmissionId: normalizedSubmissionId || null,
        requestFingerprint,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      if (requestRef) {
        await requestRef.set(
          {
            bookingReference,
            checkoutUrl: redirectUrl,
            status: 'free_registration_created',
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        )
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          success: true,
          checkoutUrl: redirectUrl,
          bookingReference,
          freeRegistration: true,
        }),
      }
    }

    if (
      !process.env.SUMUP_API_KEY ||
      !process.env.SUMUP_MERCHANT_CODE ||
      !process.env.APP_URL
    ) {
      throw new Error('Missing required SumUp or app environment variables.')
    }

    const payload = {
      checkout_reference: bookingReference,
      amount: totalAmount,
      currency: 'EUR',
      description: `${variant.title} - ${selectedPackage.name}${attendeeName ? ` for ${attendeeName}` : ''}`,
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      return_url: `${getWebhookBaseUrl(event)}/.netlify/functions/sumup-webhook`,
      redirect_url: redirectUrl,
      hosted_checkout: { enabled: true },
      customer_email: primaryParticipant.email,
      customer_name: attendeeName || undefined,
    }

    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SUMUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(data.message || data.error || 'SumUp checkout creation failed.')
    }

    const checkoutUrl = getHostedCheckoutUrl(data)

    if (!checkoutUrl) {
      throw new Error('Checkout was created but no hosted checkout URL was returned.')
    }

    if (db) {
      await db.collection('registrations').doc(bookingReference).set({
        bookingReference,
        variantId: variant.id,
        variantName: variant.title,
        packageType,
        packageName: selectedPackage.name,
        participantCount,
        baseItem: {
          name: selectedPackage.baseItemName,
          price: Number(selectedPackage.price),
        },
        addons,
        totalAmount,
        currency: 'EUR',
        language: language === 'fr' ? 'fr' : 'en',
        participants: sanitizedParticipants,
        primaryParticipant,
        paymentStatus: 'pending',
        paymentConfirmed: false,
        orderStatus: getOrderStatusFromPayment('pending', false),
        paymentStage: 'checkout_redirected',
        paidAt: null,
        hotelRoom: '',
        adminNotes: '',
        sumupCheckoutId: data.id || data.checkout_id || null,
        hostedCheckoutUrl: checkoutUrl,
        clientSubmissionId: normalizedSubmissionId || null,
        requestFingerprint,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      if (requestRef) {
        await requestRef.set(
          {
            bookingReference,
            checkoutUrl,
            sumupCheckoutId: data.id || data.checkout_id || null,
            status: 'checkout_redirected',
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        )
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        checkoutUrl,
        bookingReference,
      }),
    }
  } catch (error) {
    console.error('create-checkout error', error)

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message || 'Unable to create checkout.',
      }),
    }
  }
}
