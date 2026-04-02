function Hero({ navigate, onSelectPackage }) {
  return (
    <section className="hero">
      <div className="shell-section">
        <div className="hero__panel">
          <div className="hero__content">
            <div>
              <span className="hero__eyebrow">European Athletics Coaching Summit</span>
              <h1>Sharper coaching conversations for the next performance cycle.</h1>
              <p className="hero__lede">
                A fictional premium summit for coaches, technical directors, and performance staff who want a more
                modern, practical, and collaborative approach to athletics education.
              </p>
              <div className="hero__actions">
                <button className="button button--primary" onClick={onSelectPackage}>
                  View registration packages
                </button>
                <button className="button button--ghost" onClick={() => navigate('home')}>
                  Explore the summit
                </button>
              </div>
            </div>

            <aside className="hero__aside">
              <div className="info-card">
                <span className="meta-chip">Date</span>
                <div className="meta-value">18-19 October 2026</div>
              </div>
              <div className="info-card">
                <span className="meta-chip">Location</span>
                <div className="meta-value">Lausanne, Switzerland</div>
              </div>
              <div className="hero__meta">
                <div className="info-card">
                  <span className="meta-chip">Audience</span>
                  <div className="meta-value">Coaches and leaders</div>
                </div>
                <div className="info-card">
                  <span className="meta-chip">Format</span>
                  <div className="meta-value">Hosted summit + labs</div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
