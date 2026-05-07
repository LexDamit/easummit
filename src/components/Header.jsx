import flaLogo from '../assets/fla-logo.svg'

function Header({ currentPage, language, navigate, setLanguage, t, variants }) {
  const activeVariant =
    variants.find((item) => item.id === currentPage) ?? variants[0] ?? null
  const pageLabel =
    currentPage === 'admin'
      ? t.currentPageAdmin
      : currentPage === 'success'
        ? t.currentPageSuccess
        : currentPage === 'cancel'
          ? t.currentPageCancel
          : activeVariant?.pageLabel

  return (
    <header className="site-header">
      <div className="shell-section site-header__inner">
        <button className="site-header__brand" onClick={() => navigate('local')}>
          <img className="site-header__logo" src={flaLogo} alt="FLA logo" />
          <span>
            {t.headerEyebrow ? (
              <span className="site-header__eyebrow">{t.headerEyebrow}</span>
            ) : null}
            <span className="site-header__name">{t.headerTitle}</span>
          </span>
        </button>
        <div className="site-header__meta">
          {pageLabel ? (
            <div className="site-header__status">
              <span className="site-header__eyebrow">{t.currentPage}</span>
              <span className="site-header__name">{pageLabel}</span>
            </div>
          ) : null}
          <div className="language-switch" aria-label={t.languageLabel}>
            <button
              className={`language-switch__button ${language === 'fr' ? 'is-active' : ''}`}
              onClick={() => setLanguage('fr')}
              type="button"
            >
              {t.french}
            </button>
            <button
              className={`language-switch__button ${language === 'en' ? 'is-active' : ''}`}
              onClick={() => setLanguage('en')}
              type="button"
            >
              {t.english}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
