function Success({ navigate }) {
  return (
    <div className="page">
      <section className="section">
        <div className="shell-section">
          <div className="status-card">
            <div className="status-card__badge status-card__badge--success">OK</div>
            <h1>Thank you for your registration.</h1>
            <p>
              Your payment flow has been completed. Final confirmation still depends on successful payment processing,
              and the summit team will follow up if anything needs attention on your booking.
            </p>
            <div className="cta-row" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
              <button className="button button--primary" onClick={() => navigate('home')}>
                Return to home
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Success
