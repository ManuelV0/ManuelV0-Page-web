export const metadata = { title: 'TheItalianPoetry' }

import './globals.css'
import '../styles/style.css'   // il tuo design system
import '../styles/diario.css'  // css della sezione diario

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        <header className="main-header">
          <div className="logo">
            <i className="fa-solid fa-feather-pointed" />
            <span>TheItalianPoetry</span>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}