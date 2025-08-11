// app/layout.tsx

import './app/globals.css'
import Link from 'next/link'
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="main-header">
          <div className="logo">
            <i className="fa-solid fa-feather-pointed" aria-hidden="true" />
            <span>TheItalianPoetry</span>
          </div>

          <nav className="main-nav">
            <Link href="/">Home</Link>
            <a href="/#leaderboard">Classifica</a>
            <Link href="/diario">Diario</Link>
            <Link href="/autore">Autore</Link>
            <Link href="/come-partecipare">Come Partecipare</Link>
            <Link href="/chi-siamo">Chi Siamo</Link>
            <Link href="/login">Accedi</Link>
          </nav>
        </header>

        {children}
      </body>
    </html>
  )
}
