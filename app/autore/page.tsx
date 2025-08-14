export const metadata = {
  title: 'Autore — TheItalianPoetry',
  description:
    'Pagina autore ufficiale di TheItalianPoetry: temi ricorrenti, diario poetico ed evoluzione.',
  openGraph: {
    title: 'Autore — TheItalianPoetry',
    description:
      'Pagina autore ufficiale di TheItalianPoetry: temi ricorrenti, diario poetico ed evoluzione.',
  },
}

export default function AutorePage() {
  return (
    <main className="container">
      <section className="diario-section" aria-labelledby="autore-title">
        <h1 id="autore-title" className="section-title">Autore</h1>

        <div className="author-card" style={{ marginTop: '1rem' }}>
          <div className="author-card__header">
            <div
              className="author-card__avatar"
              style={{ backgroundImage: "url('/avatar.jpg')" }}
              aria-hidden="true"
              role="img"
              aria-label="Avatar di TheItalianPoetry"
            />
            <div>
              <div className="author-card__name" role="heading" aria-level={2}>TheItalianPoetry</div>
              <div className="author-card__id">owner</div>
            </div>
            <div className="author-card__badges">
              <span className="badge" role="note">Founder</span>
            </div>
          </div>

          <div className="journal-preview">
            <div className="journal-preview__text">
              Pagina di poesia e frammenti emotivi. Scrivo di assenze, identità, silenzi e desideri…
            </div>
          </div>

          <div className="journal-details is-open">
            <div className="journal-details__inner">
              <div className="journal-block">
                <h4>Temi ricorrenti</h4>
                <div className="journal-tags">
                  <span className="journal-tag" role="note">Identità</span>
                  <span className="journal-tag" role="note">Assenze</span>
                  <span className="journal-tag" role="note">Desiderio</span>
                </div>
              </div>

              <div className="journal-block">
                <h4>Evoluzione</h4>
                <p>Ricerca di una lingua che inciampa e dice l’indicibile.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}