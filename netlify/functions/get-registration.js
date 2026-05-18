const { getAdminDb } = require('./_lib/firebase-admin')

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    }
  }

  try {
    const reference = event.queryStringParameters?.ref

    if (!reference) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing booking reference.' }),
      }
    }

    const db = getAdminDb()

    if (!db) {
      throw new Error('Firebase admin is not configured.')
    }

    const snapshot = await db.collection('registrations').doc(reference).get()

    if (!snapshot.exists) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Registration not found.' }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration: snapshot.data(),
      }),
    }
  } catch (error) {
    console.error('get-registration error', error)

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message || 'Unable to load registration.' }),
    }
  }
}
