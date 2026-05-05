import PackageCard from '../components/PackageCard'

function Packages({ content, packages, navigate, onSelectPackage }) {
  return (
    <div className="page">
      <section className="section">
        <div className="shell-section section-stack">
          <div className="section-intro">
            <span className="section-label">{content.label}</span>
            <h1 className="page-title">{content.title}</h1>
            <p className="page-intro">{content.intro}</p>
          </div>

          <div className="packages-grid">
            {packages.map((eventPackage) => (
              <PackageCard
                key={eventPackage.id}
                packageItem={eventPackage}
                onSelect={onSelectPackage}
              />
            ))}
          </div>

          <div className="cta-row">
            <button className="button button--ghost" onClick={() => navigate('home')}>
              {content.backLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Packages
