
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function SiteHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  // bootstrap auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => sub?.subscription.unsubscribe()
  }, [])

  const is = (p: string) => pathname === p
  const isStarts = (p: string) => pathname?.startsWith(p)

  const openModal = (name: 'how-to' | 'about' | 'author' | 'submission') => {
    // layout o pagina possono ascoltare questo evento per aprire le modali
    window.dispatchEvent(new CustomEvent('open-modal', { detail: name }))
  }

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: typeof window !== 'undefined' ? location.origin : undefined }
    })
  }

  const signOut = async () => { await supabase.auth.signOut() }

  return (
    <header className="main-header">
      <div className="logo">
        <i className="fa-solid fa-feather-pointed" aria-hidden />
        <span>TheItalianPoetry</span>
      </div>

      <button
        className="mobile-nav-toggle"
        aria-controls="primary-navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Menu"
      >
        <i className="fas fa-bars" aria-hidden />
        <span className="sr-only">Menu</span>
      </button>

      <div id="primary-navigation" className="nav-wrapper" data-visible={mobileOpen}>
        <nav className="main-nav">
          <Link href="/" className={is('/') ? 'is-active' : ''}>Home</Link>
          <a href="/#leaderboard" className={is('/#leaderboard') ? 'is-active' : ''}>Classifica</a>
          <button type="button" onClick={() => openModal('how-to')}>Come Partecipare</button>
          <button type="button" onClick={() => openModal('about')}>Chi Siamo</button>
          {/* “Autore” = pagina del proprietario; “Diario” = elenco autori/diari */}
          <Link href="/autore" className={isStarts('/autore') ? 'is-active' : ''}>Autore</Link>
          <Link href="/diario" className={isStarts('/diario') ? 'is-active' : ''}>Diario</Link>
        </nav>

        <div className="header-actions">
          {!email ? (
            <button className="button-social google" onClick={signInWithGoogle}>
              <i className="fab fa-google" /> Accedi con Google
            </button>
          ) : (
            <div className="user-chip">
              <span className="chip-email">{email}</span>
              <button className="button-secondary" onClick={signOut}>Logout</button>
            </div>
          )}

          <button
            className="button-primary"
            disabled={!email}
            aria-disabled={!email}
            title={!email ? 'Accedi per partecipare' : 'Invia la tua poesia'}
            onClick={() => openModal('submission')}
          >
            Partecipa!
          </button>
        </div>
      </div>
    </header>
  )
}
