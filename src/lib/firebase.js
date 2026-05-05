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

const app = firebaseEnabled ? initializeApp(firebaseConfig) : null
const auth = app ? getAuth(app) : null
const db = app ? getFirestore(app) : null

export function subscribeToAdminAuth(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }

  return onAuthStateChanged(auth, callback)
}

export async function signInAdmin(email, password) {
  if (!auth) {
    throw new Error('Firebase auth is not configured.')
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

export async function saveRegistrationCatalog(catalog) {
  if (!db) {
    throw new Error('Firebase firestore is not configured.')
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
    throw new Error('Firebase firestore is not configured.')
  }

  await updateDoc(doc(db, 'registrations', registrationId), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}
