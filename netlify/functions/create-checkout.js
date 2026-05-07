const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')

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

const normalizePrivateKey = (value) => {
  if (!value) {
    return value
  }

  return String(value)
    .trim()
    .replace(/^"(.*)"$/s, '$1')
    .replace(/^'(.*)'$/s, '$1')
    .replace(/\\n/g, '\n')
}

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
        privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      }),
    })
  }

  return getFirestore()
}

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

const getBaseAppUrl = () => String(process.env.APP_URL || '').replace(/\/+$/, '')

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
    } = JSON.parse(event.body || '{}')

    const catalog = await loadTrustedCatalog()
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

    const availableAddons = catalog.addonsByPackage?.[packageType] ?? []
    const addons = availableAddons.filter((item) => addonIds.includes(item.id))
    const totalAmount =
      Number(selectedPackage.price) +
      addons.reduce((sum, item) => sum + Number(item.price || 0), 0)

    if (
      !process.env.SUMUP_API_KEY ||
      !process.env.SUMUP_MERCHANT_CODE ||
      !process.env.APP_URL
    ) {
      throw new Error('Missing required SumUp or app environment variables.')
    }

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
        participants: sanitizedParticipants,
        primaryParticipant,
        paymentStatus: 'pending',
        paymentConfirmed: false,
        orderStatus: getOrderStatusFromPayment('pending', false),
        paymentStage: 'checkout_created',
        paidAt: null,
        hotelRoom: '',
        adminNotes: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    }

    const payload = {
      checkout_reference: bookingReference,
      amount: totalAmount,
      currency: 'EUR',
      description: `${variant.title} - ${selectedPackage.name}${attendeeName ? ` for ${attendeeName}` : ''}`,
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      redirect_url: `${getBaseAppUrl()}/${variant.id}?status=success&ref=${encodeURIComponent(
        bookingReference,
      )}`,
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
      await db.collection('registrations').doc(bookingReference).set(
        {
          paymentStage: 'checkout_redirected',
          sumupCheckoutId: data.id || data.checkout_id || null,
          hostedCheckoutUrl: checkoutUrl,
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
