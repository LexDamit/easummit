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

    console.log('Incoming SumUp webhook payload:', payload)

    // TODO: Verify the webhook signature or signing secret if your SumUp webhook setup supports it.
    // TODO: Match the incoming checkout reference or SumUp checkout id back to a booking once persistence exists.
    // TODO: Persist paid or failed state when a database is added and treat the webhook as source of truth.

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
