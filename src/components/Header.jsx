function Header({ navigate, currentPage }) {
  const isPackages = currentPage === 'packages' || currentPage === 'checkout'

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <button className="site-header__brand text-button" onClick={() => navigate('home')}>
          <span className="site-header__eyebrow">Fictional event</span>
          <span className="site-header__name">European Athletics Coaching Summit</span>
        </button>

        <nav className="site-header__nav" aria-label="Primary">
          <button
            className={`nav-link ${currentPage === 'home' ? 'is-active' : ''}`}
            onClick={() => navigate('home')}
          >
            Home
          </button>
          <button
            className={`nav-link ${isPackages ? 'is-active' : ''}`}
            onClick={() => navigate('packages')}
          >
            Packages
          </button>
        </nav>

        <div className="site-header__actions">
          <button className="button button--secondary" onClick={() => navigate('packages')}>
            Register now
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
