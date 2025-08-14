export const metadata = {
  title: 'Come partecipare — TheItalianPoetry',
  description:
    'Accedi con Google, invia la tua poesia e raccogli voti: i più votati entrano in classifica.',
}

export default function ComeParteciparePage() {
  return (
    <main className="container" role="main">
      <section className="card-section" aria-labelledby="come-partecipare-heading">
        <h1 id="come-partecipare-heading" className="visually-hidden">Come Partecipare</h1>
        <div className="card-content">
          <ol style={{ textAlign: 'left', lineHeight: 1.8, marginTop: '1rem' }}>
            <li>
              Accedi con Google dalla pagina <strong>Accedi</strong> (o dal pulsante in header).
            </li>
            <li>Invia la tua poesia dalla Home con il pulsante “Partecipa!”.</li>
            <li>Condividi il link e raccogli voti: i più votati entreranno in classifica.</li>
          </ol>
        </div>
      </section>
    </main>
  )
}