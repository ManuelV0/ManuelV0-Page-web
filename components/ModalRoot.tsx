'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type ModalName = 'how-to' | 'about' | 'submission' | null

export default function ModalRoot() {
  const [open, setOpen] = useState<ModalName>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<ModalName>
      setOpen(ce.detail || null)
    }
    window.addEventListener('open-modal', handler as EventListener)
    return () => window.removeEventListener('open-modal', handler as EventListener)
  }, [])

  return (
    <>
      {/* HOW TO */}
      <Backdrop open={open === 'how-to'} onClose={() => setOpen(null)}>
        <h2 className="modal-title" id="how-to-title">Come partecipare</h2>
        <p className="mb-sm">
          1) Accedi con Google. 2) Vai su “Partecipa!” e invia titolo + testo.
          3) La poesia compare nella classifica e nel tuo Diario Autore.  
        </p>
        <ul className="mb-sm" style={{ paddingLeft: '1rem' }}>
          <li>Max 1 invio al giorno per autore</li>
          <li>Testo originale, niente plagio</li>
          <li>Niente hate o contenuti offensivi</li>
        </ul>
        <button className="button button-primary" onClick={() => setOpen('submission')}>
          Inizia ora
        </button>
      </Backdrop>

      {/* ABOUT */}
      <Backdrop open={open === 'about'} onClose={() => setOpen(null)}>
        <h2 className="modal-title" id="about-title">Chi siamo</h2>
        <p className="mb-sm">
          TheItalianPoetry è una community che valorizza voci nuove e autori emergenti.
          Condividi i tuoi versi, scopri affinità tematiche con altri autori e fatti leggere.
        </p>
        <p className="mb-sm">Seguici: @theitalianpoetry</p>
        <button className="button button-secondary" onClick={() => setOpen(null)} aria-label="Chiudi modal">Chiudi</button>
      </Backdrop>

      {/* SUBMISSION */}
      <SubmissionModal open={open === 'submission'} onClose={() => setOpen(null)} />
    </>
  )
}

/* ---------- Componenti interni ---------- */

function Backdrop({
  open, onClose, children,
}: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className={`modal-backdrop ${open ? '' : 'hidden'}`}
      onClick={(e) => e.currentTarget === e.target && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-content">
        <button className="modal-close-btn" aria-label="Chiudi" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  )
}

function SubmissionModal({
  open, onClose,
}: { open: boolean; onClose: () => void }) {
  const [email, setEmail] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [instagram, setInstagram] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  const submit = async () => {
    setMsg(null)
    if (!email) { setMsg('Devi accedere per inviare.'); return }
    if (title.trim().length < 2 || content.trim().length < 10) {
      setMsg('Titolo o testo troppo corti.'); return
    }

    try {
      setBusy(true)
      const { data: u } = await supabase.auth.getUser()
      const user = u.user
      if (!user) throw new Error('Utente non valido')
      const authorId = user.id

      const { data: ins, error: insErr } = await supabase
        .from('poems')
        .insert({
          title: title.trim(),
          content: content.trim(),
          author_name: user.email,
          instagram_handle: instagram.trim() || null,
        })
        .select('id')
        .single()
      if (insErr) throw insErr

      await supabase.from('author_poem').insert({ author_id: authorId, poem_id: ins.id })
      await supabase.from('profiles').update({ last_updated: new Date().toISOString() }).eq('id', authorId)

      setMsg('Poesia inviata! Grazie ✨')
      setTitle(''); setContent(''); setInstagram('')
      setTimeout(onClose, 900)
    } catch (e: any) {
      setMsg(e.message || 'Errore durante l’invio')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Backdrop open={open} onClose={onClose}>
      <h2 className="modal-title" id="submission-title">Invia la tua poesia</h2>
      {!email ? (
        <p className="mb-sm">Accedi per inviare la poesia.</p>
      ) : null}

      <div className="form-group">
        <label htmlFor="p-title">Titolo</label>
        <input id="p-title" className="comp-input" value={title} onChange={e => setTitle(e.target.value)} maxLength={120} />
      </div>
      <div className="form-group">
        <label htmlFor="p-content">Testo</label>
        <textarea id="p-content" className="comp-textarea" value={content} onChange={e => setContent(e.target.value)} />
      </div>
      <div className="form-group">
        <label htmlFor="p-ig">Instagram (opzionale)</label>
        <input id="p-ig" className="comp-input" value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="nome utente" />
      </div>

      <button className="button button-primary" onClick={submit} disabled={busy || !email}>
        {busy ? 'Invio…' : 'Invia'}
      </button>
      {msg && <p id="form-message" className="mt-sm" role="status">{msg}</p>}
    </Backdrop>
  )
}