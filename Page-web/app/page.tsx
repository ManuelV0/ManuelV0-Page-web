export default function HomePage() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-content">
          <h1>Le Voci Più Amate del Mese!</h1>
          <p>Scopri i talenti emergenti della nostra community.</p>
        </div>
      </section>

      <div className="container">
        <div className="content-area">
          <h2 className="section-title" id="leaderboard">Classifica Principale</h2>
          <div className="poems-list">{/* TODO: qui incolliamo componenti classifica */}</div>
        </div>
        <aside className="sidebar">{/* sidebar/ads */}</aside>
      </div>
    </main>
  )
}
