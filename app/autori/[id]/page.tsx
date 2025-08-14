import type { Metadata } from 'next'
import { supabaseServer } from '@/lib/supabaseServer'

type Journal = {
  descrizione_autore?: string
  profilo_poetico?: { temi_ricorrenti?: string[]; evoluzione?: string }
  ultime_opere_rilevanti?: { id?: string; titolo?: string }[]
}

async function getData(id: string) {
  const supabase = supabaseServer()

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, poetic_journal, qr_code_url, public_page_url, last_updated')
    .eq('id', id)
    .single()
  if (pErr || !profile) throw new Error('Autore non trovato')

  const { count, error: cntErr } = await supabase
    .from('poesie')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', id)
  if (cntErr) throw cntErr

  const { data: recentPoems } = await supabase
    .from('poesie')
    .select('id, title, titolo, created_at')
    .eq('profile_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return { profile, poemsCount: count || 0, recentPoems: recentPoems || [] }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const { profile } = await getData(params.id)
    const title = profile?.username ? `${profile.username} — Diario Autore` : 'Diario Autore'
    const desc =
      ((profile?.poetic_journal as Journal | null)?.descrizione_autore) ||
      'Profilo autore e diario poetico.'
    return { title, description: desc, openGraph: { title, description: desc } }
  } catch {
    return { title: 'Autore', description: 'Profilo autore' }
  }
}

export default async function AutorePage({ params }: { params: { id: string } }) {
  const { profile, poemsCount, recentPoems } = await getData(params.id)
  const j = (profile.poetic_journal as Journal | null) || {}
  const temi = j.profilo_poetico?.temi_ricorrenti || []
  const evol = j.profilo_poetico?.evoluzione
  const opere = j.ultime_opere_rilevanti || []

  return (
    <main className="container">
      <section className="diario-section" aria-labelledby="autore-title">
        <h1 id="autore-title" className="section-title">{profile.username || 'Senza nome'}</h1>

        <div className="author-card" style={{ marginTop: '1rem' }}>
          <div className="author-card__header">
            <div
              className="author-card__avatar"
              style={{ backgroundImage: `url('${profile.avatar_url || ''}')` }}
              role="img"
              aria-label={`Avatar di ${profile.username || 'Senza nome'}`}
              alt={`Avatar di ${profile.username || 'Senza nome'}`}
            />
            <div>
              <div className="author-card__name">{profile.username || 'Senza nome'}</div>
              <div className="author-card__id">{profile.id}</div>
            </div>
            <div className="author-card__badges">
              <span className="badge">{poemsCount} opere</span>
            </div>
          </div>

          <div className="author-card__meta">
            <div className="meta-row">
              <span className="meta-pill">
                Agg.: {profile.last_updated ? new Date(profile.last_updated).toLocaleDateString() : '-'}
              </span>
            </div>
            {profile.public_page_url && (
              <a className="btn" href={profile.public_page_url} target="_blank" rel="noreferrer">Pagina pubblica</a>
            )}
          </div>

          <div className="journal-preview">
            <div className="journal-preview__text">{j.descrizione_autore || '(nessuna descrizione)'}</div>
          </div>

          <div className="author-card__footer">
            <div className="author-card__actions" />
            {profile.qr_code_url && (
              <div
                className="author-card__qr"
                style={{ backgroundImage: `url('${profile.qr_code_url}')` }}
                role="img"
                aria-label="Codice QR"
                alt="Codice QR"
              />
            )}
          </div>

          <div className="journal-details is-open">
            <div className="journal-details__inner">
              <div className="journal-block">
                <h4>Temi ricorrenti</h4>
                <div className="journal-tags">
                  {temi.length ? temi.map((t, i) => <span className="journal-tag" key={i}>{t}</span>) : <span className="journal-tag">—</span>}
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

              {recentPoems.length > 0 && (
                <div className="journal-block">
                  <h4>Poesie recenti</h4>
                  <ul>
                    {recentPoems.map((p) => (
                      <li key={p.id}>
                        {(p.title as string) || (p.titolo as string) || 'Senza titolo'} — {new Date(p.created_at as string).toLocaleDateString()}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}