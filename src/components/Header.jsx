import flaLogo from '../assets/fla-logo.svg'

function Header({ currentPage, navigate, variants }) {
  return (
    <header className="site-header">
      <div className="shell-section site-header__inner">
        <button className="site-header__brand" onClick={() => navigate('local')}>
          <img className="site-header__logo" src={flaLogo} alt="FLA logo" />
          <span>
            <span className="site-header__eyebrow">Event registration</span>
            <span className="site-header__name">FLA Checkout</span>
          </span>
        </button>

        <nav className="site-header__nav" aria-label="Registration pages">
          {variants.map((item) => (
            <button
              key={item.id}
              className={`nav-link ${currentPage === item.id ? 'is-active' : ''}`}
              onClick={() => navigate(item.id)}
            >
              {item.pageLabel}
            </button>
          ))}
          <button
            className={`nav-link ${currentPage === 'admin' ? 'is-active' : ''}`}
            onClick={() => navigate('admin')}
          >
            Admin
          </button>
        </nav>
      </div>
    </header>
  )
}

export default Header
