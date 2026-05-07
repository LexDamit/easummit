import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import RegistrationCheckout from './pages/RegistrationCheckout'
import Success from './pages/Success'
import Cancel from './pages/Cancel'
import Admin from './pages/Admin'
import { defaultRegistrationCatalog } from './data/registrationCatalog'
import { defaultHotelSettings } from './data/hotelSettings'
import { getUiTranslations, localizeCatalog } from './data/translations'
import {
  firebaseDebugInfo,
  firebaseEnabled,
  firebaseInitializationError,
  loadHotelSettings,
  loadRegistrationCatalog,
  saveHotelSettings,
  saveRegistrationCatalog,
  signInAdmin,
  signOutAdmin,
  subscribeRegistrations,
  subscribeToAdminAuth,
  updateRegistrationAdmin,
} from './lib/firebase'

const LANGUAGE_KEY = 'fla-registration-language'

const PAGE_PATHS = {
  local: '/local',
  partners: '/partners',
  international: '/international',
  admin: '/admin',
}

const getPageFromLocation = () => {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('status')
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/local'

  if (status === 'success') return 'success'
  if (status === 'cancel') return 'cancel'
  if (pathname === PAGE_PATHS.admin) return 'admin'
  if (pathname === PAGE_PATHS.partners) return 'partners'
  if (pathname === PAGE_PATHS.international) return 'international'

  return 'local'
}

function App() {
  const [page, setPage] = useState(getPageFromLocation)
  const [language, setLanguage] = useState(
    () => window.localStorage.getItem(LANGUAGE_KEY) || 'en',
  )
  const [catalog, setCatalog] = useState(defaultRegistrationCatalog)
  const [adminUser, setAdminUser] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [hotelSettings, setHotelSettings] = useState(defaultHotelSettings)
  const [catalogNotice, setCatalogNotice] = useState('')
  const showFirebaseDebug = useMemo(
    () => new URLSearchParams(window.location.search).get('debugFirebase') === '1',
    [],
  )

  const localizedCatalog = useMemo(
    () => localizeCatalog(catalog, language),
    [catalog, language],
  )
  const t = useMemo(() => getUiTranslations(language), [language])
  const variantsById = useMemo(
    () => Object.fromEntries(localizedCatalog.variants.map((item) => [item.id, item])),
    [localizedCatalog.variants],
  )
  const adminRegistrations = adminUser ? registrations : []

  useEffect(() => subscribeToAdminAuth(setAdminUser), [])
  useEffect(() => {
    if (!adminUser) {
      return () => {}
    }

    return subscribeRegistrations(setRegistrations)
  }, [adminUser])
  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_KEY, language)
  }, [language])
  useEffect(() => {
    const handlePopState = () => {
      setPage(getPageFromLocation())
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadAdminContent = async () => {
      try {
        const [remoteCatalog, remoteHotelSettings] = await Promise.all([
          loadRegistrationCatalog(),
          loadHotelSettings(),
        ])

        if (!cancelled && remoteCatalog?.variants?.length) {
          setCatalog(remoteCatalog)
        }

        if (!cancelled && remoteHotelSettings?.hotels) {
          setHotelSettings(remoteHotelSettings)
        }
      } catch (error) {
        const message = String(error?.message || '')

        if (!cancelled && message.toLowerCase().includes('offline')) {
          setCatalogNotice(
            t.notices.offline,
          )
          return
        }

        if (!cancelled) {
          setCatalogNotice(
            t.notices.unavailable,
          )
        }
      }
    }

    loadAdminContent()

    return () => {
      cancelled = true
    }
  }, [t.notices.offline, t.notices.unavailable])

  const navigate = (nextPage) => {
    setPage(nextPage)

    const currentBasePath =
      PAGE_PATHS[page] ||
      PAGE_PATHS[getPageFromLocation()] ||
      PAGE_PATHS.local
    const nextUrl =
      nextPage === 'success' || nextPage === 'cancel'
        ? `${currentBasePath}?status=${nextPage}`
        : PAGE_PATHS[nextPage] || PAGE_PATHS.local

    window.history.pushState({}, '', nextUrl)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveCatalog = async (nextCatalog) => {
    await saveRegistrationCatalog(nextCatalog)
    setCatalog(nextCatalog)
  }

  const handleSaveHotelSettings = async (nextHotelSettings) => {
    await saveHotelSettings(nextHotelSettings)
    setHotelSettings(nextHotelSettings)
  }

  const renderPage = () => {
    if (page === 'success') {
      return <Success language={language} navigate={navigate} t={t} />
    }

    if (page === 'cancel') {
      return <Cancel navigate={navigate} t={t} />
    }

    if (page === 'admin') {
      return (
        <Admin
          adminUser={adminUser}
          catalog={catalog}
          firebaseEnabled={firebaseEnabled}
          language={language}
          onLogin={signInAdmin}
          onLogout={signOutAdmin}
          onSaveCatalog={handleSaveCatalog}
          hotelSettings={hotelSettings}
          onSaveHotelSettings={handleSaveHotelSettings}
          onUpdateRegistration={updateRegistrationAdmin}
          registrations={adminRegistrations}
          t={t}
        />
      )
    }

    const selectedVariant = variantsById[page] ?? localizedCatalog.variants[0]

    return (
      <RegistrationCheckout
        addonsByPackage={localizedCatalog.addonsByPackage ?? {}}
        language={language}
        variant={selectedVariant}
        t={t}
      />
    )
  }

  return (
    <div className="app-shell">
      <Header
        currentPage={page}
        language={language}
        navigate={navigate}
        setLanguage={setLanguage}
        t={t}
        variants={localizedCatalog.variants}
      />
      {catalogNotice ? (
        <div className="shell-section app-notice">
          {catalogNotice}
        </div>
      ) : null}
      {showFirebaseDebug ? (
        <div className="shell-section app-debug">
          <strong>Firebase debug</strong>
          <div>enabled: {String(firebaseDebugInfo.enabled)}</div>
          <div>apiKeyPresent: {String(firebaseDebugInfo.apiKeyPresent)}</div>
          <div>authDomainPresent: {String(firebaseDebugInfo.authDomainPresent)}</div>
          <div>projectIdPresent: {String(firebaseDebugInfo.projectIdPresent)}</div>
          <div>appIdPresent: {String(firebaseDebugInfo.appIdPresent)}</div>
          <div>storageBucketPresent: {String(firebaseDebugInfo.storageBucketPresent)}</div>
          <div>messagingSenderIdPresent: {String(firebaseDebugInfo.messagingSenderIdPresent)}</div>
          <div>projectId: {firebaseDebugInfo.projectId}</div>
          <div>authDomain: {firebaseDebugInfo.authDomain}</div>
          <div>apiKeyPreview: {firebaseDebugInfo.apiKeyPreview}</div>
          <div>appIdPreview: {firebaseDebugInfo.appIdPreview}</div>
          <div>initializationError: {firebaseInitializationError || 'none'}</div>
        </div>
      ) : null}
      <main>{renderPage()}</main>
      <Footer navigate={navigate} t={t} />
    </div>
  )
}

export default App
