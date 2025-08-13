'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type ModalName = 'how-to' | 'about' | 'submission'

export default function SiteHeader() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  // Auth status
  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data }) => { if (active) setEmail(data.user?.email ?? null) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null))
    return () => { active = false; sub?.subscription.unsubscribe() }
  }, [])

  // Chiudi il menu quando cambi route
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Chiudi con ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const is = (p: string) => pathname === p
  const starts = (p: string) => pathname?.startsWith(p)

  const openModal = (name: ModalName) =>
    window.dispatchEvent(new CustomEvent('open-modal', { detail: name }))

  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: typeof window !== 'undefined' ? location.origin : undefined }
      })
    } catch {}
  }
  const signOut = async () => { try { await supabase.auth.signOut() } catch {} }

  return (
    <header className="main-header main-header--stacked" role="banner">
      {/* Riga 1: brand */}
      <div className="header-brand">
        <i className="fa-solid fa-feather-pointed" aria-hidden="true" />
        <span className="brand-title">TheItalianPoetry</span>
      </div>

      {/* Toggle mobile */}
      <button
        className="mobile-nav-toggle"
        aria-controls="primary-navigation primary-actions"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(v => !v)}
        aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'}
      >
        <i className="fas fa-bars" aria-hidden="true" />
        <span className="sr-only">Menu</span>
      </button>

      {/* Riga 2: nav */}
      <nav
        id="primary-navigation"
        className="main-nav main-nav--centered"
        data-visible={mobileOpen}
        aria-label="Navigazione principale"
      >
        <Link href="/" className={is('/') ? 'is-active' : ''} aria-current={is('/') ? 'page' : undefined}>Home</Link>
        <Link href="/#leaderboard" className={is('/') ? 'is-active' : ''}>Classifica</Link>
        <button type="button" onClick={() => openModal('how-to')}>Come Partecipare</button>
        <button type="button" onClick={() => openModal('about')}>Chi Siamo</button>
        <Link href="/autore" className={starts('/autore') ? 'is-active' : ''} aria-current={starts('/autore') ? 'page' : undefined}>Autore</Link>
        <Link href="/diario" className={starts('/diario') ? 'is-active' : ''} aria-current={starts('/diario') ? 'page' : undefined}>Diario</Link>
      </nav>

      {/* Riga 3: actions */}
      <div
        id="primary-actions"
        className="header-actions header-actions--centered"
        data-visible={mobileOpen}
      >
        {!email ? (
          <button className="button-social google" onClick={signInWithGoogle}>
            <i className="fab fa-google" aria-hidden="true" /> Accedi con Google
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
          onClick={() => openModal('submission')}
          aria-disabled={!email}
          title={!email ? 'Accedi per partecipare' : 'Invia la tua poesia'}
        >
          Partecipa!
        </button>
      </div>
    </header>
  )
}