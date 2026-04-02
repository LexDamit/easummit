import { useMemo, useState } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Packages from './pages/Packages'
import Checkout from './pages/Checkout'
import Success from './pages/Success'
import Cancel from './pages/Cancel'
import { packages } from './data/packages'

const getStatusPage = () => {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('status')

  if (status === 'success') return 'success'
  if (status === 'cancel') return 'cancel'

  return 'home'
}

function App() {
  const [page, setPage] = useState(getStatusPage)
  const [selectedPackage, setSelectedPackage] = useState(null)

  const packageMap = useMemo(
    () => Object.fromEntries(packages.map((item) => [item.id, item])),
    [],
  )

  const navigate = (nextPage) => {
    setPage(nextPage)

    const nextUrl =
      nextPage === 'success' || nextPage === 'cancel'
        ? `${window.location.pathname}?status=${nextPage}`
        : window.location.pathname

    window.history.replaceState({}, '', nextUrl)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectPackage = (packageId) => {
    setSelectedPackage(packageMap[packageId] ?? null)
    navigate('checkout')
  }

  const renderPage = () => {
    if (page === 'checkout' && !selectedPackage) {
      return (
        <Packages
          packages={packages}
          navigate={navigate}
          onSelectPackage={handleSelectPackage}
        />
      )
    }

    switch (page) {
      case 'packages':
        return (
          <Packages
            packages={packages}
            navigate={navigate}
            onSelectPackage={handleSelectPackage}
          />
        )
      case 'checkout':
        return <Checkout navigate={navigate} selectedPackage={selectedPackage} />
      case 'success':
        return <Success navigate={navigate} />
      case 'cancel':
        return <Cancel navigate={navigate} />
      case 'home':
      default:
        return (
          <Home
            navigate={navigate}
            onSelectPackage={() => navigate('packages')}
          />
        )
    }
  }

  return (
    <div className="site-shell">
      <Header navigate={navigate} currentPage={page} />
      <main>{renderPage()}</main>
      <Footer />
    </div>
  )
}

export default App
