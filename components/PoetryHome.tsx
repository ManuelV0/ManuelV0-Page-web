// components/PoetryHome.tsx
export default function PoetryHome() {
  return (
    <main>
      <section className="hero-section">
        <div className="hero-content">
          <h1>Le Voci Più Amate del Mese!</h1>
          <p>Scopri i talenti emergenti della community.</p>
        </div>
      </section>

      <div className="container">
        <div className="content-area">
          {/* qui puoi innestare i pezzi della tua home, liste, widget, ecc. */}
          <section className="card-section">
            <div className="card-content">
              <h2>Benvenuto su TheItalianPoetry</h2>
              <p>Porta qui il markup che avevi in index.html.</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
