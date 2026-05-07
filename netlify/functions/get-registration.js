const { cert, getApps, initializeApp } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

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
