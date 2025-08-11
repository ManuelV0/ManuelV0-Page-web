import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'TheItalianPoetry',
  description: 'La tua dashboard artistica',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
