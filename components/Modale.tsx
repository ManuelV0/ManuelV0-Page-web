'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type ModalName = 'how-to' | 'about' | 'submission' | null

export default function Modals() {
  const [open, setOpen] = useState<ModalName>(null)

  // form stato
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [insta, setInsta] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // listener globale per aprire le modali
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as ModalName
      setOpen(detail)
    }
    window.addEventListener('open-modal' as any, handler)
    return () => window.removeEventListener('open-modal' as any, handler)
  }, [])

  // chiudi su ESC / backdrop
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  async function submitPoem(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    const { data: u } = await supabase.auth.getUser()
    if (!u.user) {
      setMsg('Devi effettuare l’accesso per inviare una poesia.')
      return
    }
    if (!title.trim() || !content.trim()) {
      setMsg('Titolo e testo sono obbligatori.')
      return
    }

    try {
      setSending(true)
      const { error } = await supabase.from('poesie').insert({
        title,
        content,
        author_name: u.user.user_metadata?.name || u.user.email,
        instagram_handle: insta?.replace(/^@/, '') || null,
        user_id: u.user.id,
      })
      if (error) throw error

      setMsg('Poesia inviata! Grazie ✨')
      setTitle(''); setContent(''); setInsta('')
      // opzionale: chiudi dopo poco
      setTimeout(() => setOpen(null), 1200)
    } catch (err: any) {
      setMsg(err.message || 'Errore durante l’invio.')
    } finally {
      setSending(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={(e) => e.currentTarget === e.target && setOpen(null)}>
      <div className="modal-content" role="dialog" aria-modal="true">
        <button className="modal-close-btn" aria-label="Chiudi" onClick={() => setOpen(null)}>×</button>

        {open === 'how-to' && (
          <>
            <h2>Come Partecipare</h2>
            <ol style={{ lineHeight: 1.6 }}>
              <li><strong>Accedi con Google</strong> (per evitare abusi).</li>
              <li><strong>Invia la tua poesia</strong> con titolo e testo.</li>
              <li><strong>Fatti votare</strong>: le più amate vanno in classifica e su IG.</li>
            </ol>
            <button className="button-primary full-width-btn" onClick={() => setOpen('submission')}>
              Invia la mia Poesia Ora!
            </button>
          </>
        )}

        {open === 'about' && (
          <>
            <h2>Chi Siamo</h2>
            <p><strong>TheItalianPoetry</strong> è una community libera dove il merito conta.
              Manteniamo la piattaforma gratuita grazie a sponsorizzazioni non invasive.</p>
            <p>Segui i canali social per novità e selezioni di curatela.</p>
          </>
        )}

        {open === 'submission' && (
          <>
            <h2>Invia la Tua Poesia</h2>
            <form onSubmit={submitPoem}>
              <div className="form-group">
                <label htmlFor="p-title">Titolo</label>
                <input id="p-title" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="p-content">Testo</label>
                <textarea id="p-content" rows={10} value={content} onChange={e => setContent(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="p-insta">Instagram (opzionale)</label>
                <input id="p-insta" placeholder="handle senza @" value={insta} onChange={e => setInsta(e.target.value)} />
              </div>
              <button className="button-primary" type="submit" disabled={sending}>
                {sending ? 'Invio…' : 'Invia la mia Poesia'}
              </button>
              {msg && <p aria-live="polite" style={{ marginTop: 8 }}>{msg}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
