import flaLogo from '../assets/fla-logo.svg'

function Header({ currentPage, navigate, variants }) {
  const activeVariant =
    variants.find((item) => item.id === currentPage) ?? variants[0] ?? null
  const pageLabel =
    currentPage === 'admin'
      ? 'Admin'
      : currentPage === 'success'
        ? 'Confirmation'
        : currentPage === 'cancel'
          ? 'Payment cancelled'
          : activeVariant?.pageLabel

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
        {pageLabel ? (
          <div className="site-header__status">
            <span className="site-header__eyebrow">Current page</span>
            <span className="site-header__name">{pageLabel}</span>
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default Header
