'use client'

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Poem = {
  id: number;
  title: string;
  content: string;
  author_name: string;
  instagram_handle: string | null;
  created_at: string;
  vote_count: number | null;
};

type Order = 'recent' | 'popular' | 'title-asc' | 'title-desc';

export default function PoetryHome() {
  const [poems, setPoems] = useState<Poem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // UI state
  const [search, setSearch] = useState('');
  const [order, setOrder] = useState<Order>('recent');
  const [selected, setSelected] = useState<Poem | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [voteMsg, setVoteMsg] = useState<string | null>(null);

  // Caricamento poesie via RPC: get_poems_with_votes
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const { data, error } = await supabase.rpc('get_poems_with_votes');
        if (error) throw error;
        setPoems(data || []);
      } catch (e: any) {
        setErr(e.message || 'Errore nel caricamento');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // filtro + ordinamento + top10
  const topTen = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = poems.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.author_name.toLowerCase().includes(term)
    );

    switch (order) {
      case 'popular':
        list = list.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
        break;
      case 'title-asc':
        list = list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        list = list.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        list = list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return list.slice(0, 10);
  }, [poems, search, order]);

  // poesie del mese corrente
  const monthly = useMemo(() => {
    const now = new Date();
    const m = now.getUTCMonth();
    const y = now.getUTCFullYear();
    const term = search.trim().toLowerCase();

    let list = poems.filter(p => {
      const d = new Date(p.created_at);
      return d.getUTCMonth() === m && d.getUTCFullYear() === y;
    });

    list = list.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.author_name.toLowerCase().includes(term)
    );

    switch (order) {
      case 'popular':
        list = list.sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
        break;
      case 'title-asc':
        list = list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        list = list.sort((a, b) => b.title.localeCompare(a.title));
        break;
      default:
        list = list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    }

    return list;
  }, [poems, search, order]);

  // voto
  async function submitVote() {
    if (!selected) return;
    if (rating < 1 || rating > 5) {
      setVoteMsg('Seleziona da 1 a 5 stelle');
      return;
    }
    // blocco “già votato” lato client (cookie semplice)
    if (typeof document !== 'undefined' && document.cookie.includes(`voted-poem-${selected.id}=true`)) {
      setVoteMsg('Hai già votato questa poesia. Grazie!');
      return;
    }

    try {
      setSubmittingVote(true);
      setVoteMsg('Invio in corso...');
      const { error } = await supabase.functions.invoke('invia-voto', {
        body: { poemId: selected.id, rating }
      });
      if (error) throw error;

      // cookie 1 anno
      if (typeof document !== 'undefined') {
        document.cookie = `voted-poem-${selected.id}=true; max-age=31536000; path=/`;
      }
      setVoteMsg('Grazie per aver votato!');
      // ricarico classifica soft
      const { data } = await supabase.rpc('get_poems_with_votes');
      setPoems(data || []);
      setTimeout(() => {
        setSelected(null);
        setRating(0);
        setVoteMsg(null);
      }, 1200);
    } catch (e: any) {
      setVoteMsg(e.message || 'Errore durante la votazione');
    } finally {
      setSubmittingVote(false);
    }
  }

  const rankEmoji = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '');

  return (
    <main>
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Le Voci Più Amate del Mese!</h1>
          <p>Scopri i talenti emergenti della community.</p>
        </div>
      </section>

      <div className="container">
        <div className="content-area">
          <h2 className="section-title" id="leaderboard">Classifica Principale</h2>

          {/* Toolbar */}
          <div className="diario-toolbar" style={{ marginBottom: '1rem' }}>
            <input
              className="search-input"
              placeholder="Cerca titolo o autore..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Cerca poesie"
            />
            <select
              className="filter-select"
              value={order}
              onChange={e => setOrder(e.target.value as Order)}
              aria-label="Ordina poesie per"
            >
              <option value="recent">Più Recenti</option>
              <option value="popular">Più Votate</option>
              <option value="title-asc">Titolo (A–Z)</option>
              <option value="title-desc">Titolo (Z–A)</option>
            </select>
          </div>

          {/* Stato */}
          {err && <div className="diario-error" role="alert">{err}</div>}
          {loading && <p>Caricamento…</p>}

          {/* Top 10 */}
          {!loading && !err && (
            <div className="poems-list">
              {topTen.length === 0 ? (
                <p>Non ci sono ancora poesie. Sii il primo a partecipare!</p>
              ) : (
                topTen.map((p, i) => (
                  <article className="poem-row" key={p.id}>
                    <div
                      className={`poem-info ${i < 3 ? 'glow-rank' : ''}`}
                      onClick={() => setSelected(p)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Seleziona poesia: ${p.title} di ${p.author_name}`}
                    >
                      <span className="poem-rank">{rankEmoji(i)}</span>
                      <span className="poem-title">{p.title}</span>
                      <span className="poem-author golden-author">di {p.author_name}</span>
                    </div>
                    <div className="poem-actions">
                      {p.instagram_handle && (
                        <a
                          href={`https://www.instagram.com/${p.instagram_handle}`}
                          target="_blank"
                          rel="noreferrer"
                          className="social-icon"
                          aria-label={`Instagram di ${p.author_name}`}
                        >
                          <i className="fab fa-instagram" />
                          <span className="sr-only">Instagram di {p.author_name}</span>
                        </a>
                      )}
                      <span className="poem-votes">{p.vote_count || 0} Voti</span>
                      <button className="button-vote" onClick={() => setSelected(p)}>
                        Vota
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {/* Sezione: Poesie del mese */}
          <div className="sidebar-box" style={{ marginTop: '2rem' }}>
            <h3>Poesie del Mese</h3>
            <div id="monthly-poems-list" className="mini-poems-list">
              {monthly.length === 0 ? (
                <p style={{ fontSize: '.9rem', color: '#777' }}>Nessuna poesia per questo mese.</p>
              ) : (
                monthly.map(p => {
                  const d = new Date(p.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' });
                  return (
                    <div
                      className="mini-poem-item"
                      key={p.id}
                      onClick={() => setSelected(p)}
                      role="button"
                      tabIndex={0}
                      aria-label={`Seleziona poesia: ${p.title} di ${p.author_name}`}
                    >
                      <span className="mini-poem-title">{p.title}</span>
                      <span className="mini-poem-author">di {p.author_name}</span>
                      <span className="mini-poem-date">{d}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modale voto / dettaglio */}
      {selected && (
        <div className="modal-backdrop" onClick={(e) => e.currentTarget === e.target && setSelected(null)}>
          <div className="modal-content" role="dialog" aria-modal="true">
            <button className="modal-close-btn" onClick={() => setSelected(null)} aria-label="Chiudi modale">×</button>
            <div id="vote-poem-details">
              <h2 id="vote-poem-title">{selected.title}</h2>
              <p className="poem-author" id="vote-poem-author">di {selected.author_name}</p>
              <div
                className="poem-text-container"
                id="vote-poem-content"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {selected.content}
              </div>
            </div>
            <div className="voting-area" style={{ marginTop: '1rem' }}>
              <h3>Il tuo voto:</h3>
              <div className="star-rating" role="radiogroup" aria-label="Valuta questa poesia con le stelle">
                {[1, 2, 3, 4, 5].map(n => (
                  <label key={n} className="star" aria-label={`${n} stella${n > 1 ? 'e' : ''}`}>
                    <input
                      type="radio"
                      name="rating"
                      className="sr-only"
                      value={n}
                      onChange={() => setRating(n)}
                      checked={rating === n}
                    />
                    <i className={n <= rating ? 'fa-solid fa-star selected' : 'fa-regular fa-star'} />
                  </label>
                ))}
              </div>
              <button
                className="button-primary"
                onClick={submitVote}
                disabled={submittingVote}
              >
                {submittingVote ? 'Invio…' : 'Invia Voto'}
              </button>
              {voteMsg && (
                <p id="vote-form-message" role="status" aria-live="polite" style={{ marginTop: '.5rem' }}>
                  {voteMsg}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}