// app/diario/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

/* ---------- Tipi ---------- */
type PoeticJournal = any // struttura aperta: { descrizione_autore, profilo_poetico:{temi_ricorrenti,evoluzione}, ... }
type PoeticProfile = any // struttura aperta: { temi_ricorrenti: string[], ... }

type Profile = {
  id: string
  username: string | null
  poetic_journal: PoeticJournal | null
  poetic_profile: PoeticProfile | null
  qr_code_url: string | null
  public_page_url: string | null
  last_updated: string | null
}

type ProfileWithCount = Profile & { poems_count: number }

/* =========================================================
   Diario Autore:
   - se loggato: mostra "Il tuo Diario", Match-making, e (se vuoi) Esplora autori
   - se non loggato: CTA di login
   ========================================================= */
export default function DiarioPage() {
  const [authEmail, setAuthEmail] = useState<string | null>(null)
  const [me, setMe] = useState<ProfileWithCount | null>(null)

  const [others, setOthers] = useState<ProfileWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  // Esplora
  const [exploreOpen, setExploreOpen] = useState(false)
  const [q, setQ] = useState('')
  const [order, setOrder] = useState<'recenti' | 'piu-poesie'>('recenti')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setErr(null)

    ;(async () => {
      // 1) Stato auth
      const { data: u1 } = await supabase.auth.getUser()
      const user = u1.user ?? null
      setAuthEmail(user?.email ?? null)

      if (!user) {
        setMe(null)
        setOthers([])
        setLoading(false)
        return
      }

      // 2) Mio profilo
      const { data: myProfile, error: pErr } = await supabase
        .from('profiles')
        .select('id,username,poetic_journal,poetic_profile,qr_code_url,public_page_url,last_updated')
        .eq('id', user.id)
        .single()

      if (pErr) {
        if (alive) { setErr(pErr.message); setLoading(false) }
        return
      }

      // 3) Conteggio mie poesie
      const { count: myCount, error: cErr } = await supabase
        .from('poesie')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)

      if (cErr) {
        if (alive) { setErr(cErr.message); setLoading(false) }
        return
      }

      if (alive) {
        setMe({ ...(myProfile as Profile), poems_count: myCount ?? 0 })
      }

      // 4) Altri profili (per match + esplora) — richiede login
      const { data: othersRaw, error: oErr } = await supabase
        .from('profiles')
        .select('id,username,poetic_journal,poetic_profile,qr_code_url,public_page_url,last_updated')
        .neq('id', user.id)

      if (oErr) {
        if (alive) { setErr(oErr.message); setLoading(false) }
        return
      }

      const otherIds = (othersRaw ?? []).map(p => p.id)
      let countsMap = new Map<string, number>()

      if (otherIds.length) {
        const { data: rows } = await supabase
          .from('poesie')
          .select('profile_id')
          .in('profile_id', otherIds)

        rows?.forEach(r => {
          const k = (r as any).profile_id as string
          countsMap.set(k, (countsMap.get(k) || 0) + 1)
        })
      }

      const mergedOthers: ProfileWithCount[] = (othersRaw ?? []).map(p => ({
        ...(p as Profile),
        poems_count: countsMap.get(p.id) || 0
      }))

      if (alive) {
        setOthers(mergedOthers)
        setLoading(false)
      }
    })()

    return () => { alive = false }
  }, [])

  /* ---------- Match-making (semplice sui temi ricorrenti) ---------- */
  const matches = useMemo(() => {
    if (!me) return []
    const myThemes = new Set<string>(
      ((me.poetic_profile as any)?.temi_ricorrenti ?? []).map((s: string) => s.toLowerCase())
    )

    if (myThemes.size === 0) return []

    const scored = others
      .map(o => {
        const oThemes: string[] = ((o.poetic_profile as any)?.temi_ricorrenti ?? []).map((s: string) =>
          String(s).toLowerCase()
        )
        const inter = oThemes.filter(t => myThemes.has(t))
        const union = new Set<string>([...Array.from(myThemes), ...oThemes])
        const jaccard = inter.length / Math.max(1, union.size)
        // Punteggio 0..100, più “bonus” per numero assoluto di match
        const score = Math.round(jaccard * 80 + inter.length * 5)
        return { prof: o, themesInCommon: inter, score }
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)

    return scored
  }, [me, others])

  /* ---------- Esplora filtrato ---------- */
  const explore = useMemo(() => {
    let v = [...others]
    if (q.trim()) {
      const term = q.trim().toLowerCase()
      v = v.filter(a =>
        (a.username || '').toLowerCase().includes(term) ||
        ((a.poetic_journal as any)?.descrizione_autore || '').toLowerCase().includes(term)
      )
    }
    if (order === 'recenti') {
      v.sort(
        (a, b) =>
          new Date(b.last_updated || 0).getTime() -
          new Date(a.last_updated || 0).getTime()
      )
    } else {
      v.sort((a, b) => (b.poems_count || 0) - (a.poems_count || 0))
    }
    return v
  }, [others, q, order])

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <main className="container">
        <section className="diario-section">
          <h1 className="section-title">Diario Autore</h1>
          <p>Caricamento…</p>
        </section>
      </main>
    )
  }

  if (!authEmail) {
    return (
      <main className="container">
        <section className="diario-section">
          <h1 className="section-title">Diario Autore</h1>
          <div className="card-section text-center">
            <p className="mb-sm">
              Per vedere il tuo diario e scoprire gli altri autori devi effettuare l’accesso.
            </p>
            <button
              className="button-primary"
              onClick={() =>
                supabase.auth.signInWithOAuth({
                  provider: 'google',
                  options: { redirectTo: typeof window !== 'undefined' ? location.origin + '/diario' : undefined }
                })
              }
            >
              Accedi con Google
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="container">
      <section className="diario-section" aria-labelledby="diario-title">
        <h1 id="diario-title" className="section-title">Il tuo Diario</h1>

        {err && <div className="diario-error">{err}</div>}

        {/* --- Il tuo profilo --- */}
        {me && <AuthorCard author={me} isMe />}

        {/* --- Match-making --- */}
        <div className="card-section" style={{ marginTop: '1rem' }}>
          <div className="card-content">
            <h2 className="green-title">Match-making poetico</h2>
            {(!me?.poetic_profile || !(me.poetic_profile as any)?.temi_ricorrenti?.length) ? (
              <p className="mb-0">
                Aggiungi i <strong>temi ricorrenti</strong> nel tuo profilo per vedere i match con altri autori.
              </p>
            ) : matches.length === 0 ? (
              <p className="mb-0">Nessun match trovato al momento.</p>
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  display: 'grid',
                  gap: '12px',
                  maxHeight: '240px',
                  overflowY: 'auto'
                }}
              >
                {matches.map(({ prof, themesInCommon, score }) => (
                  <li key={prof.id} className="author-card" style={{ padding: '12px' }}>
                    <div className="author-card__header">
                      <div className="author-card__avatar" aria-hidden />
                      <div>
                        <div className="author-card__name">{prof.username || 'Senza nome'}</div>
                        <div className="author-card__id">{prof.id}</div>
                      </div>
                      <div className="author-card__badges">
                        <span className="badge">Match {score}%</span>
                      </div>
                    </div>
                    <div className="journal-block">
                      <strong>Temi in comune:</strong>{' '}
                      {themesInCommon.length ? themesInCommon.join(', ') : '—'}
                    </div>
                    <div className="author-card__meta">
                      {prof.public_page_url && (
                        <Link className="btn" href={prof.public_page_url} target="_blank">
                          Pagina
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* --- Esplora autori (richiede login) --- */}
        <div className="card-section">
          <div className="card-content">
            <h2>Esplora autori</h2>
            <div className="diario-toolbar" style={{ marginBottom: '1rem' }}>
              <input
                className="search-input"
                placeholder="Cerca autore o descrizione…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                disabled={!exploreOpen}
                aria-disabled={!exploreOpen}
                aria-label="Cerca autori"
              />
              <select
                className="filter-select"
                value={order}
                onChange={(e) => setOrder(e.target.value as any)}
                disabled={!exploreOpen}
                aria-disabled={!exploreOpen}
              >
                <option value="recenti">Più recenti</option>
                <option value="piu-poesie">Con più opere</option>
              </select>
              <button
                className="button-secondary"
                onClick={() => setExploreOpen(v => !v)}
                aria-pressed={exploreOpen}
              >
                {exploreOpen ? 'Chiudi Esplora' : 'Apri Esplora'}
              </button>
            </div>

            {!exploreOpen ? (
              <p className="mb-0">Apri “Esplora” per cercare e trovare altri autori.</p>
            ) : explore.length === 0 ? (
              <p className="mb-0">Nessun autore trovato.</p>
            ) : (
              <div className="authors-grid" aria-live="polite">
                {explore.map(a => <AuthorCard key={a.id} author={a} />)}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

/* =========================================================
   Componenti interni
   ========================================================= */

function AuthorCard({ author, isMe = false }: { author: ProfileWithCount, isMe?: boolean }) {
  const j = author.poetic_journal || {}
  const descrizione = (j as any).descrizione_autore || '(nessuna descrizione)'
  const temi = (j as any)?.profilo_poetico?.temi_ricorrenti || []
  const evol = (j as any)?.profilo_poetico?.evoluzione
  const opere = (j as any)?.ultime_opere_rilevanti || []

  const [open, setOpen] = useState(false)

  // placeholder avatar (non esiste avatar_url in schema)
  const initials = (author.username || 'A').slice(0, 2).toUpperCase()

  return (
    <div className="author-card">
      <div className="author-card__header">
        <div className="author-card__avatar" aria-hidden>
          <span style={{
            display: 'grid', placeItems: 'center', width: '100%', height: '100%', color: '#fff',
            fontWeight: 700
          }}>{initials}</span>
        </div>
        <div>
          <div className="author-card__name">
            {author.username || 'Senza nome'} {isMe && <span style={{ color: 'var(--c-primario)', fontWeight: 700 }}>(tu)</span>}
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
          <a className="btn" href={author.public_page_url} target="_blank" rel="noreferrer">
            Pagina
          </a>
        )}
      </div>

      <div className="journal-preview">
        <div className="journal-preview__text">{descrizione}</div>
      </div>

      {(temi.length || evol || (opere?.length ?? 0)) ? (
        <>
          <div className="author-card__footer">
            <div className="author-card__actions">
              <button className="btn btn--primary" onClick={() => setOpen(o => !o)}>
                {open ? 'Chiudi dettagli' : 'Espandi dettagli'}
              </button>
            </div>
          </div>
          <div className={`journal-details ${open ? 'is-open' : ''}`}>
            <div className="journal-details__inner">
              <div className="journal-block">
                <h4>Temi ricorrenti</h4>
                <div className="journal-tags">
                  {temi.length ? temi.map((t: string, i: number) => <span className="journal-tag" key={i}>{t}</span>) : '—'}
                </div>
              </div>
              {evol && (
                <div className="journal-block">
                  <h4>Evoluzione</h4>
                  <p>{evol}</p>
                </div>
              )}
              {(opere?.length ?? 0) > 0 && (
                <div className="journal-block">
                  <h4>Ultime opere</h4>
                  <ul>{opere.map((o: any, i: number) => <li key={i}>{o.titolo}</li>)}</ul>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
