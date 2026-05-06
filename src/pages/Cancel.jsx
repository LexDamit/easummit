function Cancel({ navigate, t }) {
  return (
    <div className="page">
      <section className="shell-section ticket-page">
        <div className="ticket-summary-card">
          <span className="section-chip">{t.cancel.chip}</span>
          <h1 className="checkout-title">{t.cancel.title}</h1>
          <p className="checkout-copy">{t.cancel.copy}</p>
          <div className="cta-row">
            <button className="button button--primary" onClick={() => navigate('local')}>
              {t.cancel.back}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Cancel
