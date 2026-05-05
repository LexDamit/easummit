const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')

const fallbackCatalog = {
  variants: [
    {
      id: 'local',
      pageLabel: 'Local',
      title: 'Local registration',
      description: 'Conference access for local participants.',
      baseItemName: 'Conference Access',
      price: 120,
    },
    {
      id: 'partners',
      pageLabel: 'Partners',
      title: 'Partners registration',
      description: 'Conference access for partners and invited guests.',
      baseItemName: 'Conference Access',
      price: 220,
    },
    {
      id: 'international',
      pageLabel: 'International',
      title: 'International registration',
      description: 'Conference access for international delegates.',
      baseItemName: 'Conference Access',
      price: 320,
    },
  ],
  addons: [
    { id: 'networking-dinner', name: 'Networking Dinner', price: 75 },
    { id: 'single-10-11', name: 'Accommodation Single 10-11.10.2026', price: 160 },
    { id: 'single-11-12', name: 'Accommodation Single 11-12.10.2026', price: 160 },
    { id: 'double-10-11', name: 'Accommodation Double 10-11.10.2026', price: 115 },
    { id: 'double-11-12', name: 'Accommodation Double 11-12.10.2026', price: 115 },
  ],
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { variantId, addonIds = [], customer } = JSON.parse(event.body || '{}')
    const catalog = await loadTrustedCatalog()
    const variant = catalog.variants.find((item) => item.id === variantId)

    if (!variant) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid registration page selected.' }),
      }
    }

    const addons = catalog.addons.filter((item) => addonIds.includes(item.id))
    const totalAmount =
      Number(variant.price) + addons.reduce((sum, item) => sum + Number(item.price || 0), 0)

    if (
      !process.env.SUMUP_API_KEY ||
      !process.env.SUMUP_MERCHANT_CODE ||
      !process.env.APP_URL
    ) {
      throw new Error('Missing required SumUp or app environment variables.')
    }

    const bookingReference = `FLA-${Date.now()}`
    const db = getAdminDb()

    if (db) {
      await db.collection('registrations').doc(bookingReference).set({
        bookingReference,
        variantId: variant.id,
        variantName: variant.title,
        baseItem: {
          name: variant.baseItemName,
          price: Number(variant.price),
        },
        addons,
        totalAmount,
        currency: 'EUR',
        customer,
        paymentStatus: 'pending',
        paymentStage: 'checkout_created',
        hotelRoom: '',
        adminNotes: '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
    }

    const attendeeName = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ').trim()
    const payload = {
      checkout_reference: bookingReference,
      amount: totalAmount,
      currency: 'EUR',
      description: `${variant.title}${attendeeName ? ` for ${attendeeName}` : ''}`,
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      redirect_url: `${process.env.APP_URL}?status=success&ref=${encodeURIComponent(bookingReference)}`,
      hosted_checkout: { enabled: true },
      customer_email: customer?.email,
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
