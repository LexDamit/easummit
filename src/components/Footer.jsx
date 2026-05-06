function Footer({ navigate }) {
  return (
    <footer className="site-footer">
      <div className="shell-section site-footer__inner">
        <p>Conference registration, add-ons, tickets and live admin tracking.</p>
        <button className="text-link" onClick={() => navigate('admin')}>
          Admin login
        </button>
      </div>
    </footer>
  )
}

export default Footer
