import flaLogo from '../assets/fla-logo.svg'

function Hero({ content, navigate, onSelectPackage }) {
  return (
    <section className="hero">
      <div className="shell-section">
        <div className="hero__panel">
          <div className="hero__content">
            <div className="hero__main">
              <div className="hero__brandline">
                <img className="hero__logo" src={flaLogo} alt="FLA logo" />
                <span className="hero__eyebrow">{content.label}</span>
              </div>
              <h1>{content.title}</h1>
              <p className="hero__lede">{content.description}</p>
              <div className="hero__actions">
                <button className="button button--primary" onClick={onSelectPackage}>
                  {content.primaryCta}
                </button>
                <button className="button button--ghost" onClick={() => navigate('packages')}>
                  {content.secondaryCta}
                </button>
              </div>
            </div>

            <aside className="hero__aside">
              <div className="hero-visual" aria-hidden="true">
                <div className="hero-visual__figure hero-visual__figure--large" />
                <div className="hero-visual__figure hero-visual__figure--small" />
                <div className="hero-visual__tile hero-visual__tile--blue">
                  <span />
                </div>
                <div className="hero-visual__tile hero-visual__tile--sky" />
                <div className="hero-visual__tile hero-visual__tile--dark" />
                <div className="hero-visual__ribbon">FLA EVENT</div>
              </div>
              <div className="hero-stats-grid">
                {content.stats.map((item) => (
                  <div className="hero-stat" key={`${item.label}-${item.value}`}>
                    <span className="meta-chip">{item.label}</span>
                    <div className="meta-value">{item.value}</div>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
