
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
    supabase.auth.getUser().then(({ data }) => {
      if (active) setEmail(data.user?.email ?? null)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) =>
      setEmail(s?.user?.email ?? null)
    )
    return () => {
      active = false
      sub?.subscription.unsubscribe()
    }
  }, [])

  // Chiudi il drawer quando cambi route
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const is = (p: string) => pathname === p
  const starts = (p: string) => pathname?.startsWith(p)

  const openModal = (name: ModalName) =>
    window.dispatchEvent(new CustomEvent<ModalName>('open-modal', { detail: name }))

  const signInWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: typeof window !== 'undefined' ? location.origin : undefined }
      })
    } catch {
      /* noop: puoi mostrare un toast qui */
    }
  }
  const signOut = async () => {
    try { await supabase.auth.signOut() } catch {}
  }

  return (
    <header className="main-header">
      <div className="logo">
        <i className="fa-solid fa-feather-pointed" aria-hidden /> <span>TheItalianPoetry</span>
      </div>

      <button
        className="mobile-nav-toggle"
        aria-controls="primary-navigation"
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen(v => !v)}
        aria-label="Apri/chiudi menu"
      >
        <i className="fas fa-bars" aria-hidden />
        <span className="sr-only">Menu</span>
      </button>

      <div id="primary-navigation" className="nav-wrapper" data-visible={mobileOpen}>
        <nav className="main-nav">
          <Link href="/" className={is('/') ? 'is-active' : ''} aria-current={is('/') ? 'page' : undefined}>
            Home
          </Link>

          {/* L’ancora usa Link: attivo quando sei in homepage */}
          <Link href="/#leaderboard" className={is('/') ? 'is-active' : ''}>
            Classifica
          </Link>

          <button type="button" onClick={() => openModal('how-to')}>
            Come Partecipare
          </button>
          <button type="button" onClick={() => openModal('about')}>
            Chi Siamo
          </button>

          {/* Pagina Autore (tua) */}
          <Link
            href="/autore"
            className={starts('/autore') ? 'is-active' : ''}
            aria-current={starts('/autore') ? 'page' : undefined}
          >
            Autore
          </Link>

          {/* Diario (lista autori + diari) */}
          <Link
            href="/diario"
            className={starts('/diario') ? 'is-active' : ''}
            aria-current={starts('/diario') ? 'page' : undefined}
          >
            Diario
          </Link>
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
            onClick={() => openModal('submission')}
            aria-disabled={!email}
            title={!email ? 'Accedi per partecipare' : 'Invia la tua poesia'}
          >
            Partecipa!
          </button>
        </div>
      </div>
    </header>
  )
}
