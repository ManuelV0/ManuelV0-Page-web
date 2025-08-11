
export const metadata = { title: 'Come partecipare — TheItalianPoetry' }

export default function ComeParteciparePage() {
  return (
    <main className="container">
      <section className="card-section">
        <div className="card-content">
          <h2>Come Partecipare</h2>
          <ol style={{ textAlign: 'left', lineHeight: 1.8, marginTop: '1rem' }}>
            <li>Accedi con Google dalla pagina <strong>Accedi</strong>.</li>
            <li>Invia la tua poesia dalla Home con “Partecipa!”.</li>
            <li>Condividi il link e raccogli voti: i più votati entrano in classifica.</li>
          </ol>
        </div>
      </section>
    </main>
  )
}
