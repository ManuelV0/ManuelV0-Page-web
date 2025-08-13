import '../app/globals.css'
import Link from 'next/link'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="main-header" role="banner">
          <div className="logo" aria-label="Logo di The Italian Poetry">
            <i className="fa-solid fa-feather-pointed" aria-hidden="true" />
            <span>The Italian Poetry</span>
          </div>

          <nav className="main-nav" aria-label="Navigazione principale">
            <ul>
              <li>
                <Link href="/">Home</Link>
              </li>
              <li>
                <Link href="/#leaderboard">Classifica</Link>
              </li>
              <li>
                <Link href="/diario">Diario</Link>
              </li>
              <li>
                <Link href="/autore">Autore</Link>
              </li>
              <li>
                <Link href="/come-partecipare">Come Partecipare</Link>
              </li>
              <li>
                <Link href="/chi-siamo">Chi Siamo</Link>
              </li>
              <li>
                <Link href="/login">Accedi</Link>
              </li>
            </ul>
          </nav>
        </header>

        <main role="main">
          {children}
        </main>
      </body>
    </html>
  )
}