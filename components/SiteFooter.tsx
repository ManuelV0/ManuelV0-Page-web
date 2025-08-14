export default function SiteFooter() {
  return (
    <footer className="main-footer" role="contentinfo">
      <div className="footer-content">
        <p>© {new Date().getFullYear()} TheItalianPoetry. Tutti i diritti riservati.</p>
        <nav className="footer-links" aria-label="Link utili">
          <a href="#">Privacy Policy</a>
          <a href="#">Termini di Servizio</a>
          <a href="#">Disclaimer</a>
        </nav>
        <div className="footer-social" aria-label="Seguici sui social media">
          <a
            aria-label="Instagram"
            href="https://www.instagram.com/theitalianpoetry/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fab fa-instagram" />
            <span className="visually-hidden">Instagram</span>
          </a>
          <a aria-label="Facebook" href="#" rel="noopener noreferrer">
            <i className="fab fa-facebook" />
            <span className="visually-hidden">Facebook</span>
          </a>
          <a aria-label="Twitter" href="#" rel="noopener noreferrer">
            <i className="fab fa-twitter" />
            <span className="visually-hidden">Twitter</span>
          </a>
        </div>
      </div>
    </footer>
  );
}