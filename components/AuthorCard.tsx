'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Journal = {
  descrizione_autore?: string;
  profilo_poetico?: { temi_ricorrenti?: string[]; evoluzione?: string };
  ultime_opere_rilevanti?: { titolo: string }[];
};

type Poem = {
  id: string | number;
  title: string;
  content: string;
  categoria?: 'origine' | 'frammenti' | string; // usiamo 'origine' e 'frammenti'
  ordine?: number | null;
  author_id?: string | null;   // adattalo se usi profile_id / user_id
  profile_id?: string | null;
  user_id?: string | null;
};

export default function AuthorCard({
  id, username, avatar_url, poetic_journal, qr_code_url, public_page_url, last_updated, poems_count
}: {
  id: string;
  username?: string | null;
  avatar_url?: string | null;
  poetic_journal?: Journal | null;
  qr_code_url?: string | null;
  public_page_url?: string | null;
  last_updated?: string | null;
  poems_count?: number;
}) {
  const [open, setOpen] = useState(false);
  const j = poetic_journal || {};
  const temi = j.profilo_poetico?.temi_ricorrenti || [];
  const evol = j.profilo_poetico?.evoluzione || '';
  const opere = j.ultime_opere_rilevanti || [];

  // ---- POESIE DELL’AUTORE ----
  const [poems, setPoems] = useState<Poem[] | null>(null);
  const [pErr, setPErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setPErr(null);
        const { data, error } = await supabase
          .from('poems')
          .select('id,title,content,categoria,ordine,author_id,profile_id,user_id')
          .eq('author_id', id)
          .order('ordine', { ascending: true });

        if (error) throw error;
        if (!alive) return;
        setPoems(data || []);
      } catch (e: any) {
        if (!alive) return;
        setPErr(e.message || 'Errore nel caricamento delle poesie');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const origine = useMemo(() => (poems || []).filter(p => (p.categoria || '') === 'origine'), [poems]);
  const frammenti = useMemo(() => (poems || []).filter(p => (p.categoria || '') === 'frammenti'), [poems]);

  return (
    <div className="author-card" role="region" aria-labelledby={`author-${id}`}>
      <div className="author-card__header">
        <div className="author-card__avatar" style={{ backgroundImage: `url('${avatar_url || ''}')` }} aria-label="Avatar dell'autore" />
        <div>
          <div className="author-card__name" id={`author-${id}`}>{username || 'Senza nome'}</div>
          <div className="author-card__id">{id}</div>
        </div>
        <div className="author-card__badges">
          <span className="badge">{poems_count ?? opere.length ?? 0} opere</span>
        </div>
      </div>

      <div className="author-card__meta">
        <div className="meta-row">
          <span className="meta-pill">Agg.: {last_updated ? new Date(last_updated).toLocaleDateString() : '-'}</span>
        </div>
        {public_page_url && (
          <a className="btn" href={public_page_url} target="_blank" rel="noreferrer" aria-label="Visita la pagina pubblica dell'autore">Pagina</a>
        )}
      </div>

      <div className="journal-preview">
        <div className="journal-preview__text">{j.descrizione_autore || '(nessuna descrizione)'}</div>
      </div>

      <div className="author-card__footer">
        <div className="author-card__actions">
          <button className="btn btn--primary" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={`journal-details-${id}`}>
            {open ? 'Chiudi' : 'Espandi'}
          </button>
        </div>
        {qr_code_url && <div className="author-card__qr" style={{ backgroundImage: `url('${qr_code_url}')` }} aria-label="Codice QR dell'autore" />}
      </div>

      <div className={`journal-details ${open ? 'is-open' : ''}`} id={`journal-details-${id}`}>
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
          {!!opere.length && (
            <div className="journal-block">
              <h4>Ultime opere</h4>
              <ul>{opere.map((o, i) => <li key={i}>{o.titolo}</li>)}</ul>
            </div>
          )}
        </div>
      </div>

      {/* --- POESIE (due sezioni) --- */}
      <div className="poems-section">
        <h3 className="section-title">L’origine del Male</h3>
        {loading && <p>Caricamento…</p>}
        {pErr && <p className="diario-error">{pErr}</p>}
        {!loading && !pErr && (
          origine.length ? (
            <div className="poems-grid">
              {origine.map(p => <PoemCard key={p.id} poem={p} highlightInitials />)}
            </div>
          ) : <p>Nessuna poesia in questa sezione.</p>
        )}
      </div>

      <div className="poems-section">
        <h3 className="section-title">Frammenti</h3>
        {!loading && !pErr && (
          frammenti.length ? (
            <div className="poems-grid">
              {frammenti.map(p => <PoemCard key={p.id} poem={p} />)}
            </div>
          ) : <p>Nessuna poesia in questa sezione.</p>
        )}
      </div>
    </div>
  );
}

/* ---------------- PoemCard con “iniziale che si illumina” ---------------- */

function PoemCard({ poem, highlightInitials = false }: { poem: Poem; highlightInitials?: boolean }) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!highlightInitials || !cardRef.current) return;

    const node = cardRef.current;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const letters = node.querySelectorAll<HTMLSpanElement>('.initial-letter');
        letters.forEach((el, i) => {
          setTimeout(() => el.classList.add('visible'), i * 120);
        });
        observer.unobserve(node);
      });
    }, { threshold: 0.4 });

    observer.observe(node);
    return () => observer.disconnect();
  }, [highlightInitials]);

  const verses = (poem.content || '').split('\n');

  return (
    <article ref={cardRef} className="poem-card" aria-labelledby={`poem-${poem.id}`}>
      <h4 id={`poem-${poem.id}`}>{poem.title}</h4>
      <p className="poem-text">
        {verses.map((line, i) => {
          const first = line.charAt(0);
          const rest = line.slice(1);
          return (
            <span key={i} className="verse-line">
              {highlightInitials && first
                ? <><span className="initial-letter">{first}</span>{rest}</>
                : line}
            </span>
          );
        })}
      </p>
    </article>
  );
}