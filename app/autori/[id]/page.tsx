// app/autori/[id]/page.tsx
import { notFound } from 'next/navigation'
import { supabaseServer } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic' // sempre fresco su Netlify; rimuovi se vuoi caching

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

// (opzionale) SEO dinamico
export async function generateMetadata({ params }: { params: { id: string } }) {
  const supabase = supabaseServer()
  const { data } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', params.id)
    .single()

  const name = data?.username || 'Autore'
  return {
    title: `${name} | Diario autore`,
    description: `Profilo poetico di ${name}`,
  }
}

export default async function AutorePage({ params }: { params: { id: string } }) {
  const supabase = supabaseServer()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id,username,avatar_url,poetic_journal,qr_code_url,public_page_url,last_updated')
    .eq('id', params.id)
    .single()

  if (error) {
    // In caso di ID malformato/errore DB mostriamo 404
    notFound()
  }
  if (!profile) {
    notFound()
  }

  const j = (profile.poetic_journal || {}) as Journal
  const descr = j.descrizione_autore || '(nessuna descrizione)'
  const temi = j.profilo_poetico?.temi_ricorrenti || []
  const evol = j.profilo_poetico?.evoluzione
  const opere = j.ultime_opere_rilevanti || []

  return (
    <main className="container">
      <section className="diario-section" aria-labelledby="autore-title">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div
            className="author-card__avatar"
            style={{ backgroundImage: `url('${profile.avatar_url || ''}')` }}
          />
          <div>
            <h1 id="autore-title" className="section-title" style={{ margin: 0 }}>
              {profile.username || 'Senza nome'}
            </h1>
            <p style={{ color: 'var(--c-testo-leggero)', marginTop: '.25rem' }}>
              Agg.: {profile.last_updated ? new Date(profile.last_updated).toLocaleDateString() : '-'}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '.5rem' }}>
            {profile.public_page_url && (
              <a className="btn" href={profile.public_page_url} target="_blank" rel="noreferrer">
                Pagina pubblica
              </a>
            )}
            {profile.qr_code_url && (
              <div
                className="author-card__qr"
                aria-label="QR per pagina pubblica"
                style={{ backgroundImage: `url('${profile.qr_code_url}')` }}
              />
            )}
          </div>
        </div>

        <div className="journal-block">
          <h4>Descrizione autore</h4>
          <p>{descr}</p>
        </div>

        <div className="journal-details is-open" style={{ borderTop: 'none' }}>
          <div className="journal-details__inner">
            <div className="journal-block">
              <h4>Temi ricorrenti</h4>
              <div className="journal-tags">
                {temi.length
                  ? temi.map((t, i) => (
                      <span className="journal-tag" key={i}>
                        {t}
                      </span>
                    ))
                  : <span className="journal-tag">—</span>}
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
                <ul>
                  {opere.map((o, i) => (
                    <li key={o.id ?? i}>{o.titolo}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}
