function Footer({ navigate, t }) {
  return (
    <footer className="site-footer">
      <div className="shell-section site-footer__inner">
        <p>{t.footerText}</p>
        <button className="text-link" onClick={() => navigate('admin')}>
          {t.adminLogin}
        </button>
      </div>
    </footer>
  )
}

export default Footer
