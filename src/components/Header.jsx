import flaLogo from '../assets/fla-logo.svg'

function Header({ language, setLanguage, t }) {
  return (
    <header className="site-header">
      <div className="shell-section site-header__inner">
        <div className="site-header__brand">
          <img className="site-header__logo" src={flaLogo} alt="FLA logo" />
          <div className="site-header__brand-copy">
            {t.headerEyebrow ? (
              <span className="site-header__eyebrow">{t.headerEyebrow}</span>
            ) : null}
            <span className="site-header__name">{t.headerTitle}</span>
            {t.headerSubtitle ? (
              <span className="site-header__subtitle">{t.headerSubtitle}</span>
            ) : null}
          </div>
        </div>
        <div className="site-header__meta">
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
