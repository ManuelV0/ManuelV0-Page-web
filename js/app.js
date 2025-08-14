```javascript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==== ENV (iniettate in pagina da Netlify/edge) ====
const SUPABASE_URL = window.ENV?.SUPABASE_URL_PUBLIC || '';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Mancano le ENV di Supabase (SUPABASE_URL_PUBLIC, SUPABASE_ANON_KEY)');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ==== DOM ====
const grid = document.getElementById('authorsGrid');
const searchInput = document.getElementById('searchInput');
const filterSelect = document.getElementById('filterSelect');
const emptyEl = document.getElementById('diarioEmpty');
const errorEl = document.getElementById('diarioError');

let allAuthors = [];
let viewAuthors = [];

// ==== Utils ====
const esc = (s) => String(s ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const fmtDate = (iso) => {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return '-';
  }
};

function showSkeleton(count = 6) {
  grid.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'author-card';
    wrap.innerHTML = `
      <div class="author-card__header">
        <div class="author-card__avatar skel" aria-hidden="true"></div>
        <div style="width:100%">
          <div class="skel" style="height:16px; width:60%; margin-bottom:8px;" aria-hidden="true"></div>
          <div class="skel" style="height:12px; width:40%;" aria-hidden="true"></div>
        </div>
        <div class="author-card__badges">
          <span class="badge skel" style="width:64px; height:22px;" aria-hidden="true"></span>
        </div>
      </div>
      <div class="author-card__meta">
        <div class="meta-row">
          <span class="meta-pill skel" style="width:120px; height:24px;" aria-hidden="true"></span>
        </div>
        <span class="btn skel" style="width:80px; height:36px;" aria-hidden="true"></span>
      </div>
      <div class="journal-preview">
        <div class="journal-preview__text skel" style="height:48px;" aria-hidden="true"></div>
      </div>
      <div class="author-card__footer">
        <div class="author-card__actions">
          <span class="btn skel" style="width:90px; height:36px;" aria-hidden="true"></span>
        </div>
        <div class="author-card__qr skel" aria-hidden="true"></div>
      </div>
    `;
    grid.appendChild(wrap);
  }
}

// ==== Load authors (profiles) ====
async function loadAuthors() {
  try {
    showSkeleton();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, poetic_journal, qr_code_url, public_page_url, last_updated')
      .order('last_updated', { ascending: false });

    if (error) throw error;

    allAuthors = data || [];
    viewAuthors = [...allAuthors];
    renderAuthors(viewAuthors);
  } catch (err) {
    console.error('Errore Supabase:', err);
    grid.innerHTML = '';
    errorEl.style.display = 'grid';
  }
}

// ==== Load history for an author (lazy) ====
async function fetchHistory(authorId) {
  const { data, error } = await supabase
    .from('diario_autore_history')
    .select('id, contenuto, source, created_at')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })
    .limit(10); // limitiamo per UI

  if (error) {
    console.error('Errore storico:', error);
    return { data: [], error };
  }
  return { data, error: null };
}

function renderHistoryList(list = []) {
  if (!list.length) {
    return `<div class="diario-empty" style="min-height:auto">Nessuna revisione trovata</div>`;
  }
  return `
    <ul class="journal-history" role="list">
      ${list.map(item => {
        const j = item?.contenuto || {};
        const descr = esc(j.descrizione_autore || '');
        const temi = (j.profilo_poetico?.temi_ricorrenti || []).slice(0, 5);
        return `
          <li class="journal-block" style="list-style:none; margin:0 0 .75rem 0">
            <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; margin-bottom:.35rem">
              <strong>${fmtDate(item.created_at)}</strong>
              ${item.source ? `<span class="journal-tag">${esc(item.source)}</span>` : ''}
            </div>
            ${descr ? `<p style="margin:.25rem 0 .5rem 0">${descr}</p>` : ''}
            ${temi.length ? `<div class="journal-tags">${temi.map(t => `<span class="journal-tag">${esc(t)}</span>`).join('')}</div>` : ''}
          </li>
        `;
      }).join('')}
    </ul>
  `;
}

// ==== Render authors grid ====
function renderAuthors(authors) {
  grid.innerHTML = '';

  if (!authors.length) {
    emptyEl.style.display = 'grid';
    return;
  }
  emptyEl.style.display = 'none';

  authors.forEach(author => {
    const j = author.poetic_journal || {};
    const descr = j.descrizione_autore || '(nessuna descrizione)';
    const temi = j.profilo_poetico?.temi_ricorrenti || [];
    const evoluzione = j.profilo_poetico?.evoluzione || '';
    const opere = j.ultime_opere_rilevanti || [];

    const card = document.createElement('div');
    card.className = 'author-card';
    card.setAttribute('data-author-id', author.id);

    card.innerHTML = `
      <div class="author-card__header">
        <div class="author-card__avatar" style="background-image:url('${author.avatar_url || ''}')" alt="${esc(author.username || 'Avatar')}" role="img"></div>
        <div>
          <div class="author-card__name">${esc(author.username) || 'Senza nome'}</div>
          <div class="author-card__id">${esc(author.id)}</div>
        </div>
        <div class="author-card__badges">
          <span class="badge">${opere.length} opere</span>
        </div>
      </div>

      <div class="author-card__meta">
        <div class="meta-row">
          <span class="meta-pill">Agg.: ${fmtDate(author.last_updated)}</span>
        </div>
        ${author.public_page_url ? `<a href="${esc(author.public_page_url)}" target="_blank" class="btn">Pagina</a>` : ''}
      </div>

      <div class="journal-preview">
        <div class="journal-preview__text">${esc(descr)}</div>
      </div>

      <div class="author-card__footer">
        <div class="author-card__actions">
          <button class="btn btn--primary btn-expand" aria-expanded="false">Espandi</button>
        </div>
        ${author.qr_code_url ? `<div class="author-card__qr" style="background-image:url('${author.qr_code_url}')" alt="QR Code di ${esc(author.username || 'autore')}" role="img"></div>` : ''}
      </div>

      <div class="journal-details" aria-hidden="true">
        <div class="journal-details__inner">
          <div class="journal-block">
            <h4>Temi ricorrenti</h4>
            <div class="journal-tags">
              ${temi.map(t => `<span class="journal-tag">${esc(t)}</span>`).join('')}
            </div>
          </div>

          ${evoluzione ? `
          <div class="journal-block">
            <h4>Evoluzione</h4>
            <p>${esc(evoluzione)}</p>
          </div>` : ''}

          ${opere.length ? `
          <div class="journal-block">
            <h4>Ultime opere</h4>
            <ul>${opere.map(o => `<li>${esc(o.titolo)}</li>`).join('')}</ul>
          </div>` : ''}

          <div class="journal-block journal-history-block">
            <h4>Cronologia aggiornamenti</h4>
            <div class="journal-history-body">
              <div class="skel" style="height:24px; width:60%; margin-bottom:.5rem;" aria-hidden="true"></div>
              <div class="skel" style="height:80px;" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });

  attachExpandHandlers();
}

// ==== Expand handlers + lazy history ====
function attachExpandHandlers() {
  document.querySelectorAll('.btn-expand').forEach(btn => {
    btn.addEventListener('click', async () => {
      const card = btn.closest('.author-card');
      const details = card.querySelector('.journal-details');
      const body = card.querySelector('.journal-history-body');
      const authorId = card.getAttribute('data-author-id');

      const opening = !details.classList.contains('is-open');
      details.classList.toggle('is-open');
      btn.textContent = opening ? 'Chiudi' : 'Espandi';
      btn.setAttribute('aria-expanded', opening);

      // Lazy-load una volta sola
      if (opening && body && !body.dataset.loaded) {
        const { data, error } = await fetchHistory(authorId);
        body.innerHTML = renderHistoryList(data);
        body.dataset.loaded = '1';
        if (error) {
          body.innerHTML = `<div class="diario-error" style="min-height:auto">Errore nel caricamento storico</div>`;
        }
      }
    });
  });
}

// ==== Search & filter ====
searchInput?.addEventListener('input', () => {
  const term = (searchInput.value || '').toLowerCase();
  const filtered = allAuthors.filter(a =>
    (a.username || '').toLowerCase().includes(term) ||
    (a.poetic_journal?.descrizione_autore || '').toLowerCase().includes(term)
  );
  renderAuthors(filtered);
});

filterSelect?.addEventListener('change', () => {
  let filtered = [...allAuthors];
  if (filterSelect.value === 'recenti') {
    filtered.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
  } else if (filterSelect.value === 'piu-poesie') {
    filtered.sort((a, b) =>
      (b.poetic_journal?.ultime_opere_rilevanti?.length || 0) -
      (a.poetic_journal?.ultime_opere_rilevanti?.length || 0)
    );
  }
  renderAuthors(filtered);
});

// ==== Init ====
loadAuthors();
```