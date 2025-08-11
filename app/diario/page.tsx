'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type Journal = {
  descrizione_autore?: string
  profilo_poetico?: { temi_ricorrenti?: string[]; evoluzione?: string }
  ultime_opere_rilevanti?: { id?: string; titolo?: string }[]
}
type Profile = {
  id: string
  username: string | null
  avatar_url: string | null
  poetic_journal: Journal | null
  qr_code_url: string | null
  public_page_url: string | null
  last_updated: string | null
}
type ProfileWithCount = Profile & { poems_count: number }

export default function DiarioPage() {
  const [allAuthors, setAllAuthors] = useState<ProfileWithCount[]>([])
  const [view, setView] = useState<ProfileWithCount[]>([])
  const [q, setQ] = useState('')
  const [order, setOrder] = useState<'recenti' | 'piu-poesie'>('recenti')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true); setErr(null)

        const { data: profiles, error: pErr } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, poetic_journal, qr_code_url, public_page_url, last_updated')
          .order('last_updated', { ascending: false })
        if (pErr) throw pErr

        const { data: poemsRows, error: cErr } = await supabase
          .from('poesie')
          .select('profile_id')
        if (cErr) throw cErr

        const countMap = new Map<string, number>()
        poemsRows?.forEach(r => {
          const k = r.profile_id as string | null
          if (k) countMap.set(k, (countMap.get(k) || 0) + 1)
        })

        const merged: ProfileWithCount[] = (profiles || []).map(p => ({
          ...p,
          poems_count: countMap.get(p.id) || 0,
        }))

        setAllAuthors(merged)
        setView(merged)
      } catch (e: any) {
        setErr(e.message || 'Errore di caricamento')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    let v = allAuthors.filter(a =>
      (a.username || '').toLowerCase().includes(q.toLowerCase()) ||
      (a.poetic_journal?.descrizione_autore || '').toLowerCase().includes(q.toLowerCase())
    )
    if (order === 'recenti') {
      v.sort((a, b) =>
        new Date(b.last_updated || 0).getTime() - new Date(a.last_updated || 0).getTime()
      )
    } else {
      v.sort((a, b) => (b.poems_count || 0) - (a.poems_count || 0))
    }
    setView(v)
  }, [q, order, allAuthors])

  return (
    <main className="container">
      <section className="diario-section" aria-labelledby="diario-title">
        <h1 id="diario-title" className="section-title">Diario Autore</h1>

        <div className="diario-toolbar">
          <input
            className="search-input"
            placeholder="Cerca autore o descrizione..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="filter-select"
            value={order}
            onChange={(e) => setOrder(e.target.value as any)}
          >
            <option value="recenti">Più recenti</option>
            <option value="piu-poesie">Con più opere</option>
          </select>
        </div>

        {err && <div className="diario-error">{err}</div>}

        {loading ? (
          <div className="authors-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div className="author-card" key={i}>
                <div className="author-card__header">
                  <div className="author-card__avatar skel" />
                  <div style={{ width: '100%' }}>
                    <div className="skel" style={{ height: 16, width: '60%', marginBottom: 8 }} />
                    <div className="skel" style={{ height: 12, width: '40%' }} />
                  </div>
                  <span className="badge skel" style={{ width: 64, height: 22 }} />
                </div>
                <div className="journal-preview">
                  <div className="journal-preview__text skel" style={{ height: 48 }} />
                </div>
              </div>
            ))}
          </div>
        ) : view.length === 0 ? (
          <div className="diario-empty">Nessun autore trovato.</div>
        ) : (
          <div className="authors-grid" aria-live="polite">
            {view.map(a => <AuthorCard key={a.id} author={a} />)}
          </div>
        )}
      </section>
    </main>
  )
}

function AuthorCard({ author }: { author: ProfileWithCount }) {
  const [open, setOpen] = useState(false)
  const j = author.poetic_journal || {}
  const descrizione = j.descrizione_autore || '(nessuna descrizione)'
  const temi = j.profilo_poetico?.temi_ricorrenti || []
  const evol = j.profilo_poetico?.evoluzione
  const opere = j.ultime_opere_rilevanti || []

  return (
    <div className="author-card">
      <div className="author-card__header">
        <div className="author-card__avatar" style={{ backgroundImage: `url('${author.avatar_url || ''}')` }} />
        <div>
          <div className="author-card__name">
            <Link href={`/autori/${author.id}`}>{author.username || 'Senza nome'}</Link>
          </div>
          <div className="author-card__id">{author.id}</div>
        </div>
        <div className="author-card__badges">
          <span className="badge">{author.poems_count} opere</span>
        </div>
      </div>

      <div className="author-card__meta">
        <div className="meta-row">
          <span className="meta-pill">
            Agg.: {author.last_updated ? new Date(author.last_updated).toLocaleDateString() : '-'}
          </span>
        </div>
        {author.public_page_url && (
          <a className="btn" href={author.public_page_url} target="_blank" rel="noreferrer">Pagina</a>
        )}
      </div>

      <div className="journal-preview">
        <div className="journal-preview__text">{descrizione}</div>
      </div>

      <div className="author-card__footer">
        <div className="author-card__actions">
          <button className="btn btn--primary" onClick={() => setOpen(v => !v)}>
            {open ? 'Chiudi' : 'Espandi'}
          </button>
        </div>
        {author.qr_code_url && (
          <div className="author-card__qr" style={{ backgroundImage: `url('${author.qr_code_url}')` }} />
        )}
      </div>

      <div className={`journal-details ${open ? 'is-open' : ''}`}>
        <div className="journal-details__inner">
          <div className="journal-block">
            <h4>Temi ricorrenti</h4>
            <div className="journal-tags">
              {temi.map((t, i) => <span className="journal-tag" key={i}>{t}</span>)}
            </div>
          </div>
          {evol && (
            <div className="journal-block">
              <h4>Evoluzione</h4>
              <p>{evol}</p>
            </div>
          )}
          {opere.length > 0 && (
            <div className="journal-block">
              <h4>Ultime opere</h4>
              <ul>{opere.map((o, i) => <li key={i}>{o.titolo}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
