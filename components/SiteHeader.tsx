'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string) => (pathname === href ? 'is-active' : '')

  return (
    <header className="main-header">
      <div className="logo">
        <i className="fa-solid fa-feather-pointed" aria-hidden /> <span>TheItalianPoetry</span>
      </div>

      <button
        className="mobile-nav-toggle"
        aria-controls="primary-navigation"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        <i className="fas fa-bars" aria-hidden />
        <span className="sr-only">Menu</span>
      </button>

      <div id="primary-navigation" className="nav-wrapper" data-visible={open}>
        <nav className="main-nav">
          <a className={isActive('/#leaderboard')} href="/#leaderboard">Classifica</a>
          <a href="#" id="how-to-link">Come Partecipare</a>
          <a href="#" id="about-us-link">Chi Siamo</a>
          <a href="#" id="author-link">Autore</a>
          <Link className={isActive('/diario')} href="/diario">Diario</Link>
        </nav>

        <div className="header-actions">
          <div id="auth-buttons">
            <button className="button-social google" id="login-google-btn">
              <i className="fab fa-google" /> Accedi con Google
            </button>
          </div>
          <div className="hidden" id="user-info">
            <span id="user-email"></span>
            <button className="button-secondary" id="logout-btn">Logout</button>
          </div>
          <button className="button-primary" id="open-submission-modal-btn" disabled>Partecipa!</button>
        </div>
      </div>
    </header>
  )
}
