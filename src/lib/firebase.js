import { initializeApp } from 'firebase/app'
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
)

const maskValue = (value, visible = 6) => {
  if (!value) {
    return 'missing'
  }

  const text = String(value)

  if (text.length <= visible * 2) {
    return `${text.slice(0, visible)}...`
  }

  return `${text.slice(0, visible)}...${text.slice(-visible)}`
}

export const firebaseDebugInfo = {
  enabled: firebaseEnabled,
  apiKeyPresent: Boolean(firebaseConfig.apiKey),
  authDomainPresent: Boolean(firebaseConfig.authDomain),
  projectIdPresent: Boolean(firebaseConfig.projectId),
  appIdPresent: Boolean(firebaseConfig.appId),
  storageBucketPresent: Boolean(firebaseConfig.storageBucket),
  messagingSenderIdPresent: Boolean(firebaseConfig.messagingSenderId),
  projectId: firebaseConfig.projectId || 'missing',
  authDomain: firebaseConfig.authDomain || 'missing',
  apiKeyPreview: maskValue(firebaseConfig.apiKey, 5),
  appIdPreview: maskValue(firebaseConfig.appId, 8),
}

let firebaseInitError = ''
let app = null
let auth = null
let db = null

if (firebaseEnabled) {
  try {
    app = initializeApp(firebaseConfig)
    auth = getAuth(app)
    db = getFirestore(app)
  } catch (error) {
    firebaseInitError = error.message || 'Firebase initialization failed.'
    console.error('Firebase initialization error', error)
  }
}

export const firebaseInitializationError = firebaseInitError

export function subscribeToAdminAuth(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }

  return onAuthStateChanged(auth, callback)
}

export async function signInAdmin(email, password) {
  if (!auth) {
    throw new Error(firebaseInitError || 'Firebase auth is not configured.')
  }

  return signInWithEmailAndPassword(auth, email, password)
}

export async function signOutAdmin() {
  if (!auth) {
    return
  }

  await signOut(auth)
}

export async function loadRegistrationCatalog() {
  if (!db) {
    return null
  }

  const snapshot = await getDoc(doc(db, 'cms', 'registrationCatalog'))
  return snapshot.exists() ? snapshot.data().value ?? null : null
}

export async function loadHotelSettings() {
  if (!db) {
    return null
  }

  const snapshot = await getDoc(doc(db, 'cms', 'hotelSettings'))
  return snapshot.exists() ? snapshot.data().value ?? null : null
}

export async function saveRegistrationCatalog(catalog) {
  if (!db) {
    throw new Error(firebaseInitError || 'Firebase firestore is not configured.')
  }

  await setDoc(
    doc(db, 'cms', 'registrationCatalog'),
    {
      value: catalog,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export async function saveHotelSettings(hotelSettings) {
  if (!db) {
    throw new Error(firebaseInitError || 'Firebase firestore is not configured.')
  }

  await setDoc(
    doc(db, 'cms', 'hotelSettings'),
    {
      value: hotelSettings,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function subscribeRegistrations(callback) {
  if (!db) {
    callback([])
    return () => {}
  }

  const registrationsQuery = query(
    collection(db, 'registrations'),
    orderBy('createdAt', 'desc'),
  )

  return onSnapshot(registrationsQuery, (snapshot) => {
    callback(
      snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
      })),
    )
  })
}

export async function updateRegistrationAdmin(registrationId, payload) {
  if (!db) {
    throw new Error(firebaseInitError || 'Firebase firestore is not configured.')
  }

  await updateDoc(doc(db, 'registrations', registrationId), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}
