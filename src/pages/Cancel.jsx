function Cancel({ navigate }) {
  return (
    <div className="page">
      <section className="shell-section ticket-page">
        <div className="ticket-summary-card">
          <span className="section-chip">Payment cancelled</span>
          <h1 className="checkout-title">The payment was not completed.</h1>
          <p className="checkout-copy">
            The registration is still incomplete. You can return to one of the registration pages and try again.
          </p>
          <div className="cta-row">
            <button className="button button--primary" onClick={() => navigate('local')}>
              Back to registrations
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Cancel
