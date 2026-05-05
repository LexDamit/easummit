import Hero from '../components/Hero'

function Home({ heroContent, content, navigate, onSelectPackage }) {
  return (
    <div className="page">
      <Hero content={heroContent} navigate={navigate} onSelectPackage={onSelectPackage} />

      <section className="section">
        <div className="shell-section section-stack">
          <div className="section-intro">
            <span className="section-label">{content.objectivesLabel}</span>
            <h2 className="section-heading">{content.objectivesTitle}</h2>
            <p className="section-copy">{content.objectivesText}</p>
          </div>
          <div className="feature-grid">
            {content.highlights.map((item) => (
              <article className="feature-card" key={item.title}>
                <span className="meta-chip">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-section two-column">
          <div className="content-panel content-panel--accent">
            <span className="section-label">{content.contentLabel}</span>
            <h2 className="section-heading">{content.contentTitle}</h2>
          </div>
          <div className="stack-list">
            {content.contentBlocks.map((block) => (
              <article className="info-card" key={block.title}>
                <h3>{block.title}</h3>
                <p>{block.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-section section-stack">
          <div className="section-intro">
            <span className="section-label">{content.experienceLabel}</span>
            <h2 className="section-heading">{content.experienceTitle}</h2>
          </div>
          <div className="feature-grid">
            {content.experienceItems.map((item) => (
              <article className="feature-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-section section-stack">
          <div className="section-intro">
            <span className="section-label">{content.timelineLabel}</span>
            <h2 className="section-heading">{content.timelineTitle}</h2>
          </div>
          <div className="timeline-grid">
            {content.programme.map((item) => (
              <article className="timeline-card" key={item.title}>
                <span className="timeline-card__time">{item.time}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell-section two-column">
          <article className="info-card">
            <span className="section-label">{content.sponsorLabel}</span>
            <h2 className="section-heading">{content.sponsorTitle}</h2>
            <p className="section-copy">{content.sponsorText}</p>
          </article>
          <article className="partner-strip">
            <span className="section-label">Emplacements prevus</span>
            <div className="partner-grid">
              {content.sponsorSlots.map((slot) => (
                <span key={slot}>{slot}</span>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="shell-section cta-banner">
          <span className="section-label">{content.ctaLabel}</span>
          <h2 className="section-heading">{content.ctaTitle}</h2>
          <p className="section-copy">{content.ctaText}</p>
          <div className="cta-row">
            <button className="button button--primary" onClick={() => navigate('packages')}>
              {content.ctaPrimary}
            </button>
            <button className="button button--ghost" onClick={onSelectPackage}>
              {content.ctaSecondary}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
