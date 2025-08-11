// app/chi-siamo/page.tsx
export const metadata = {
  title: 'Chi siamo — TheItalianPoetry',
  description:
    'TheItalianPoetry è una community meritocratica di scrittura creativa: valorizziamo testi originali, intensi e ben scritti.',
}

export default function ChiSiamoPage() {
  return (
    <main className="container">
      <section className="card-section">
        <div className="card-content">
          <h2>Chi Siamo</h2>
          <p className="mt-sm">
            <strong>TheItalianPoetry</strong> è una community meritocratica di scrittura creativa:
            valorizziamo testi originali, intensi e ben scritti. La classifica è popolare e i
            migliori vengono celebrati sui nostri canali.
          </p>
        </div>
      </section>
    </main>
  )
}
