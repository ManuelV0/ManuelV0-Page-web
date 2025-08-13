export default function HomePage() {
  return (
    <main>
      <section className="hero-section" aria-label="Sezione Eroica">
        <div className="hero-content">
          <h1>Le Voci Più Amate del Mese!</h1>
          <p>Scopri i talenti emergenti della nostra community.</p>
        </div>
      </section>

      <div className="container">
        <div className="content-area">
          <h2 className="section-title" id="leaderboard" tabIndex={0}>Classifica Principale</h2>
          <div className="poems-list" aria-live="polite" role="region" aria-labelledby="leaderboard">{/* TODO: qui incolliamo componenti classifica */}</div>
        </div>
        <aside className="sidebar" aria-label="Informazioni e annunci">{/* sidebar/ads */}</aside>
      </div>
    </main>
  )
}