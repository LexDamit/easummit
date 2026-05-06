import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import RegistrationCheckout from './pages/RegistrationCheckout'
import Success from './pages/Success'
import Cancel from './pages/Cancel'
import Admin from './pages/Admin'
import { defaultRegistrationCatalog } from './data/registrationCatalog'
import {
  firebaseEnabled,
  loadRegistrationCatalog,
  saveRegistrationCatalog,
  signInAdmin,
  signOutAdmin,
  subscribeRegistrations,
  subscribeToAdminAuth,
  updateRegistrationAdmin,
} from './lib/firebase'

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
  const [catalog, setCatalog] = useState(defaultRegistrationCatalog)
  const [adminUser, setAdminUser] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [catalogNotice, setCatalogNotice] = useState('')

  const variantsById = useMemo(
    () => Object.fromEntries(catalog.variants.map((item) => [item.id, item])),
    [catalog.variants],
  )

  useEffect(() => subscribeToAdminAuth(setAdminUser), [])
  useEffect(() => subscribeRegistrations(setRegistrations), [])
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

    const loadCatalog = async () => {
      try {
        const remoteCatalog = await loadRegistrationCatalog()

        if (!cancelled && remoteCatalog?.variants?.length) {
          setCatalog(remoteCatalog)
        }
      } catch (error) {
        const message = String(error?.message || '')

        if (!cancelled && message.toLowerCase().includes('offline')) {
          setCatalogNotice(
            'Firebase catalog unavailable right now. The app is using local fallback prices until the connection is restored.',
          )
          return
        }

        if (!cancelled) {
          setCatalogNotice(
            'Firebase catalog could not be loaded. The app is using local fallback prices.',
          )
        }
      }
    }

    loadCatalog()

    return () => {
      cancelled = true
    }
  }, [])

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

  const renderPage = () => {
    if (page === 'success') {
      return <Success navigate={navigate} />
    }

    if (page === 'cancel') {
      return <Cancel navigate={navigate} />
    }

    if (page === 'admin') {
      return (
        <Admin
          adminUser={adminUser}
          catalog={catalog}
          firebaseEnabled={firebaseEnabled}
          onLogin={signInAdmin}
          onLogout={signOutAdmin}
          onSaveCatalog={handleSaveCatalog}
          onUpdateRegistration={updateRegistrationAdmin}
          registrations={registrations}
        />
      )
    }

    const selectedVariant = variantsById[page] ?? catalog.variants[0]

    return (
      <RegistrationCheckout
        addonsByPackage={catalog.addonsByPackage ?? {}}
        navigate={navigate}
        variant={selectedVariant}
      />
    )
  }

  return (
    <div className="app-shell">
      <Header
        currentPage={page}
        navigate={navigate}
        variants={catalog.variants}
      />
      {catalogNotice ? (
        <div className="shell-section app-notice">
          {catalogNotice}
        </div>
      ) : null}
      <main>{renderPage()}</main>
      <Footer navigate={navigate} />
    </div>
  )
}

export default App
