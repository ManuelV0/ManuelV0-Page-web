// app/chi-siamo/page.tsx
import Link from 'next/link'

export const metadata = {
  title: 'Chi siamo — TheItalianPoetry',
  description:
    'TheItalianPoetry è una community meritocratica di scrittura creativa: valorizziamo testi originali, intensi e ben scritti.',
  openGraph: {
    title: 'Chi siamo — TheItalianPoetry',
    description:
      'TheItalianPoetry è una community meritocratica di scrittura creativa: valorizziamo testi originali, intensi e ben scritti.',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Chi siamo — TheItalianPoetry',
    description:
      'TheItalianPoetry è una community meritocratica di scrittura creativa: valorizziamo testi originali, intensi e ben scritti.',
  },
}

export default function ChiSiamoPage() {
  return (
    <main className="container">
      {/* Sezione introduttiva */}
      <section className="card-section" aria-labelledby="chi-siamo-title">
        <div className="card-content">
          <h2 id="chi-siamo-title">Chi Siamo</h2>

          <p className="mt-sm">
            <strong>TheItalianPoetry</strong> è una community meritocratica di scrittura creativa:
            valorizziamo testi originali, intensi e ben scritti. La classifica è popolare e i
            migliori vengono celebrati sui nostri canali.
          </p>

          <p className="mt-sm">
            Crediamo nella <strong>cura del testo</strong>, nel confronto costruttivo e in una
            <strong> selezione trasparente</strong> che metta al centro la voce dell’autore.
          </p>
        </div>
      </section>

      {/* Valori/mission (sempre lato server, HTML puro) */}
      <section className="card-section" aria-labelledby="valori-title">
        <div className="card-content">
          <h2 id="valori-title">I nostri valori</h2>
          <ul style={{ textAlign: 'left', lineHeight: 1.8, marginTop: '1rem' }}>
            <li><strong>Merito</strong>: premiamo qualità e partecipazione reale.</li>
            <li><strong>Rispetto</strong>: ogni testo è letto, ogni autore ascoltato.</li>
            <li><strong>Comunità</strong>: spazio aperto a chi scrive e a chi legge.</li>
          </ul>
        </div>
      </section>

      {/* CTA di navigazione (accessibile e responsive) */}
      <section className="card-section" aria-labelledby="cta-title">
        <div className="card-content">
          <h2 id="cta-title" className="text-center">Vuoi partecipare?</h2>
          <p className="mt-sm text-center">
            Scopri come inviare i tuoi testi e come funziona la classifica.
          </p>
          <div className="flex-center mt-sm">
            <Link href="/come-partecipare" className="button-primary" aria-label="Vai a Come partecipare">
              Come partecipare
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
