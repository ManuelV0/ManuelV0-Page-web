'use client';

import { useState } from 'react';

type Journal = {
  descrizione_autore?: string;
  profilo_poetico?: { temi_ricorrenti?: string[]; evoluzione?: string };
  ultime_opere_rilevanti?: { titolo: string }[];
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

  return (
    <div className="author-card">
      <div className="author-card__header">
        <div className="author-card__avatar" style={{ backgroundImage: `url('${avatar_url || ''}')` }} />
        <div>
          <div className="author-card__name">{username || 'Senza nome'}</div>
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
          <a className="btn" href={public_page_url} target="_blank">Pagina</a>
        )}
      </div>

      <div className="journal-preview">
        <div className="journal-preview__text">{j.descrizione_autore || '(nessuna descrizione)'}</div>
      </div>

      <div className="author-card__footer">
        <div className="author-card__actions">
          <button className="btn btn--primary" onClick={() => setOpen(!open)}>
            {open ? 'Chiudi' : 'Espandi'}
          </button>
        </div>
        {qr_code_url && <div className="author-card__qr" style={{ backgroundImage: `url('${qr_code_url}')` }} />}
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
          {!!opere.length && (
            <div className="journal-block">
              <h4>Ultime opere</h4>
              <ul>{opere.map((o, i) => <li key={i}>{o.titolo}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}