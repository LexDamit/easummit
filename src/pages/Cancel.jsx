function Cancel({ navigate }) {
  return (
    <div className="page">
      <section className="section">
        <div className="shell-section">
          <div className="status-card">
            <div className="status-card__badge status-card__badge--cancel">!</div>
            <h1>Payment was not completed.</h1>
            <p>
              Your registration has not been confirmed yet. You can return to the packages page, choose your pass again,
              and restart the hosted payment flow whenever you&apos;re ready.
            </p>
            <div className="cta-row" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="button button--primary" onClick={() => navigate('packages')}>
                Return to packages
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Cancel
