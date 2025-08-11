
// app/layout.tsx

import '../css/style.css'
import '../css/diario.css'
import '../css/poetry-widget.css'
import './globals.css'
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
            <Link href="/diario">Diario</Link>{/* 👈 nuovo */}
            <Link href="/autori">Autori</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  )
}
