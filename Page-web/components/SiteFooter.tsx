export default function SiteFooter() {
  return (
    <footer className="main-footer">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} TheItalianPoetry. Tutti i diritti riservati.</p>
        <div className="footer-links">
          <a href="#">Privacy Policy</a>
          <a href="#">Termini di Servizio</a>
          <a href="#">Disclaimer</a>
        </div>
        <div className="footer-social">
          <a aria-label="Instagram" href="https://www.instagram.com/theitalianpoetry/" target="_blank"><i className="fab fa-instagram" /></a>
          <a aria-label="Facebook" href="#"><i className="fab fa-facebook" /></a>
          <a aria-label="Twitter" href="#"><i className="fab fa-twitter" /></a>
        </div>
      </div>
    </footer>
  )
}
