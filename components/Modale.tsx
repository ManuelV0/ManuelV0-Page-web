'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type ModalName = 'how-to' | 'about' | 'submission' | null

export default function Modals() {
  const [open, setOpen] = useState<ModalName>(null)

  // form state
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [insta, setInsta] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const dialogRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  // listener globale per aprire modali
  useEffect(() => {
    const onOpen = (e: Event) => {
      const ce = e as CustomEvent<ModalName>
      setOpen(ce.detail)
    }
    window.addEventListener('open-modal', onOpen as EventListener)
    return () => window.removeEventListener('open-modal', onOpen as EventListener)
  }, [])

  // chiudi su ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  // focus al bottone chiudi quando si apre
  useEffect(() => {
    if (open && closeBtnRef.current) closeBtnRef.current.focus()
  }, [open])

  async function submitPoem(e: React.FormEvent) {
    e.preventDefault()
    if (sending) return
    setMsg(null)

    const { data: u } = await supabase.auth.getUser()
    if (!u.user) {
      setMsg('Devi effettuare l’accesso per inviare una poesia.')
      return
    }

    const t = title.trim()
    const c = content.trim()
    const ig = insta.trim().replace(/^@/, '')
    if (!t || !c) {
      setMsg('Titolo e testo sono obbligatori.')
      return
    }
    if (t.length > 160) {
      setMsg('Il titolo è troppo lungo (max 160 caratteri).')
      return
    }

    try {
      setSending(true)
      const { error } = await supabase.from('poesie').insert({
        title: t,
        content: c,
        author_name: u.user.user_metadata?.name || u.user.email,
        instagram_handle: ig || null,
        user_id: u.user.id,
      })
      if (error) throw error

      setMsg('Poesia inviata! Grazie ✨')
      setTitle(''); setContent(''); setInsta('')
      setTimeout(() => setOpen(null), 1200)
    } catch (err: any) {
      setMsg(err?.message || 'Errore durante l’invio.')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => e.currentTarget === e.target && setOpen(null)}
    >
      <div
        ref={dialogRef}
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <button
          ref={closeBtnRef}
          className="modal-close-btn"
          aria-label="Chiudi"
          onClick={() => setOpen(null)}
        >
          ×
        </button>

        {open === 'how-to' && (
          <>
            <h2 id="modal-title" className="modal-title">Come Partecipare</h2>
            <ol style={{ lineHeight: 1.6, marginBottom: '1rem' }}>
              <li><strong>Accedi con Google</strong> (per evitare abusi).</li>
              <li><strong>Invia la tua poesia</strong> con titolo e testo.</li>
              <li><strong>Fatti votare</strong>: le più amate vanno in classifica e su IG.</li>
            </ol>
            <button className="button-primary" style={{ width: '100%' }} onClick={() => setOpen('submission')}>
              Invia la mia Poesia Ora!
            </button>
          </>
        )}

        {open === 'about' && (
          <>
            <h2 id="modal-title" className="modal-title">Chi Siamo</h2>
            <p><strong>TheItalianPoetry</strong> è una community libera dove il merito conta.
              Manteniamo la piattaforma gratuita grazie a sponsorizzazioni non invasive.</p>
            <p style={{ marginTop: '.5rem' }}>Segui i canali social per novità e selezioni di curatela.</p>
          </>
        )}

        {open === 'submission' && (
          <>
            <h2 id="modal-title" className="modal-title">Invia la Tua Poesia</h2>
            <form onSubmit={submitPoem}>
              <div className="form-group">
                <label htmlFor="p-title">Titolo</label>
                <input
                  id="p-title"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  maxLength={160}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="p-content">Testo</label>
                <textarea
                  id="p-content"
                  rows={10}
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="p-insta">Instagram (opzionale)</label>
                <input
                  id="p-insta"
                  placeholder="handle senza @"
                  value={insta}
                  onChange={e => setInsta(e.target.value)}
                />
              </div>
              <button className="button-primary" type="submit" disabled={sending}>
                {sending ? 'Invio…' : 'Invia la mia Poesia'}
              </button>
              {msg && (
                <p id="form-message" aria-live="polite" style={{ marginTop: 8 }}>
                  {msg}
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
