// app/layout.tsx
import type { Metadata } from 'next'
import '../css/style.css'
import '../css/diario.css'

export const metadata: Metadata = {
  title: 'TheItalianPoetry',
  description: '…',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
