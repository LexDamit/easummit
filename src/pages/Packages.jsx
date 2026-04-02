import PackageCard from '../components/PackageCard'

function Packages({ packages, navigate, onSelectPackage }) {
  return (
    <div className="page">
      <section className="section">
        <div className="shell-section section-stack">
          <div>
            <span className="section-label">Packages</span>
            <h1 className="page-title">Choose the registration package that matches your coaching role.</h1>
            <p className="page-intro">
              Every pass includes access to the hosted payment flow after you complete the attendee form. No account creation,
              no database setup, and no frontend pricing trust.
            </p>
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
            <button className="button button--secondary" onClick={() => navigate('home')}>
              Back to home
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Packages
