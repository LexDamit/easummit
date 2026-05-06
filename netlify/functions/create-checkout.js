const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')

const fallbackCatalog = {
  variants: [
    {
      id: 'local',
      pageLabel: 'Local',
      title: 'Local participants',
      description:
        'The packages below are reserved for participants from Luxembourg who hold an FLA or INAPS licence. All packages include full conference access, coffee breaks and lunch on Saturday.',
      packageOptions: [
        {
          id: 'single',
          name: 'Base package 1 person',
          participantCount: 1,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday.',
          price: 62,
        },
        {
          id: 'double',
          name: 'Base package 2 people',
          participantCount: 2,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday for 2 participants.',
          price: 124,
        },
      ],
    },
    {
      id: 'partners',
      pageLabel: 'Partners',
      title: 'Partners',
      description:
        'Packages for partner delegates. All packages include full conference access, coffee breaks and lunch on Saturday.',
      packageOptions: [
        {
          id: 'single',
          name: 'Base package 1 person',
          participantCount: 1,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday.',
          price: 130,
        },
        {
          id: 'double',
          name: 'Base package 2 people',
          participantCount: 2,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday for 2 participants.',
          price: 260,
        },
      ],
    },
    {
      id: 'international',
      pageLabel: 'International',
      title: 'International',
      description:
        'Packages for international participants. All packages include full conference access, coffee breaks and lunch on Saturday.',
      packageOptions: [
        {
          id: 'single',
          name: 'Base package 1 person',
          participantCount: 1,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday.',
          price: 240,
        },
        {
          id: 'double',
          name: 'Base package 2 people',
          participantCount: 2,
          baseItemName: 'Conference Access',
          baseDescription:
            'Includes full conference access, coffee breaks and lunch on Saturday for 2 participants.',
          price: 480,
        },
      ],
    },
  ],
  addonsByPackage: {
    single: [
      { id: 'networking-dinner', name: 'Networking dinner (Saturday evening)', price: 60 },
      { id: 'hotel-09-10', name: 'Hotel stay 1 night (09-10 October)', price: 130 },
      { id: 'hotel-10-11', name: 'Hotel stay 1 night (10-11 October)', price: 130 },
      { id: 'hotel-09-11', name: 'Hotel stay 2 nights (09-11 October)', price: 260 },
    ],
    double: [
      { id: 'networking-dinner', name: 'Networking dinner (Saturday evening)', price: 120 },
      { id: 'hotel-09-10', name: 'Hotel stay 1 night (09-10 October)', price: 150 },
      { id: 'hotel-10-11', name: 'Hotel stay 1 night (10-11 October)', price: 150 },
      { id: 'hotel-09-11', name: 'Hotel stay 2 nights (09-11 October)', price: 300 },
    ],
  },
}

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

const loadTrustedCatalog = async () => {
  const db = getAdminDb()

  if (!db) {
    return fallbackCatalog
  }

  try {
    const snapshot = await db.collection('cms').doc('registrationCatalog').get()

    if (!snapshot.exists) {
      return fallbackCatalog
    }

    const value = snapshot.data().value
    return value?.variants?.length ? value : fallbackCatalog
  } catch (error) {
    console.error('Unable to load registration catalog from Firestore', error)
    return fallbackCatalog
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
        paymentStage: 'checkout_created',
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
      redirect_url: `${process.env.APP_URL}?status=success&ref=${encodeURIComponent(
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
