const packages = {
  coach: { id: 'coach', name: 'Coach Pass', price: 1 },
  performance: { id: 'performance', name: 'Performance Pass', price: 249 },
  federation: { id: 'federation', name: 'Federation Pass', price: 499 },
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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const { packageId, customer } = JSON.parse(event.body || '{}')
    const selectedPackage = packages[packageId]

    if (!selectedPackage) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid package selected.' }),
      }
    }

    if (!process.env.SUMUP_API_KEY || !process.env.SUMUP_MERCHANT_CODE || !process.env.APP_URL) {
      throw new Error('Missing required SumUp or app environment variables.')
    }

    const bookingReference = `EACS-${Date.now()}`
    const attendeeName = [customer?.firstName, customer?.lastName].filter(Boolean).join(' ').trim()

    const payload = {
      checkout_reference: bookingReference,
      amount: selectedPackage.price,
      currency: 'EUR',
      description: `${selectedPackage.name} registration${attendeeName ? ` for ${attendeeName}` : ''}`,
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      redirect_url: `${process.env.APP_URL}?status=success&ref=${encodeURIComponent(bookingReference)}`,
      hosted_checkout: { enabled: true },
      // TODO: Verify whether your SumUp account supports a dedicated cancel_url field for hosted checkout.
      // TODO: Confirm whether customer details can be sent in a nested customer object for your account.
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
      console.error('SumUp checkout response missing hosted URL', data)
      throw new Error('Checkout was created but no hosted checkout URL was returned.')
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
