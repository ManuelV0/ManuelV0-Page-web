// js/diario-autore.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ------- ENV (solo browser/Netlify) -------
const SUPABASE_URL     = (typeof window !== 'undefined' && window.ENV?.SUPABASE_URL_PUBLIC) || ''
const SUPABASE_ANON_KEY= (typeof window !== 'undefined' && window.ENV?.SUPABASE_ANON_KEY)    || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('⚠️ Mancano le ENV di Supabase (SUPABASE_URL_PUBLIC, SUPABASE_ANON_KEY)')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ------- DOM -------
const grid         = document.getElementById('authorsGrid')
const searchInput  = document.getElementById('searchInput')
const filterSelect = document.getElementById('filterSelect')
const emptyEl      = document.getElementById('diarioEmpty')
const errorEl      = document.getElementById('diarioError')

// Stato
let allAuthors = []
let viewAuthors = []

// ------- Util -------
const esc = (s) =>
  String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const fmtDate = (iso) => {
  if (!iso) return '-'
  try { return new Date(iso).toLocaleDateString() } catch { return '-' }
}

function showSkeleton(count = 6) {
  grid.innerHTML = ''
  for (let i = 0; i < count; i++) {
    const wrap = document.createElement('div')
    wrap.className = 'author-card'
    wrap.innerHTML = `
      <div class="author-card__header">
        <div class="author-card__avatar skel"></div>
        <div style="width:100%">
          <div class="skel" style="height:16px; width:60%; margin-bottom:8px;"></div>
          <div class="skel" style="height:12px; width:40%;"></div>
        </div>
        <div class="author-card__badges">
          <span class="badge skel" style="width:64px; height:22px;"></span>
        </div>
      </div>
      <div class="author-card__meta">
        <div class="meta-row">
          <span class="meta-pill skel" style="width:110px; height:24px;"></span>
        </div>
        <span class="btn skel" style="width:80px; height:36px;"></span>
      </div>
      <div class="journal-preview">
        <div class="journal-preview__text skel" style="height:48px;"></div>
      </div>
      <div class="author-card__footer">
        <div class="author-card__actions">
          <span class="btn skel" style="width:90px; height:36px;"></span>
        </div>
        <div class="author-card__qr skel"></div>
      </div>
    `
    grid.appendChild(wrap)
  }
}

// ------- Data fetch -------
async function loadAuthors() {
  try {
    showSkeleton()

    // Profili
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, poetic_journal, qr_code_url, public_page_url, last_updated')
      .order('last_updated', { ascending: false })
    if (pErr) throw pErr

    // Conteggio poesie per autore (author_poem)
    const { data: apRows, error: apErr } = await supabase
      .from('author_poem')
      .select('author_id')
    if (apErr) throw apErr

    const counts = new Map()
    apRows?.forEach(r => counts.set(r.author_id, (counts.get(r.author_id) || 0) + 1))

    allAuthors = (profiles || []).map(a => ({ ...a, poems_count: counts.get(a.id) || 0 }))
    viewAuthors = [...allAuthors]
    renderAuthors(viewAuthors)
  } catch (err) {
    console.error('Errore Supabase:', err)
    grid.innerHTML = ''
    errorEl.style.display = 'grid'
  }
}

// ------- Render -------
function renderAuthors(authors) {
  grid.innerHTML = ''

  if (!authors.length) {
    emptyEl.style.display = 'grid'
    return
  }
  emptyEl.style.display = 'none'

  authors.forEach(author => {
    const j = author.poetic_journal || {}
    const descrizione = j.descrizione_autore || '(nessuna descrizione)'
    const temi = j.profilo_poetico?.temi_ricorrenti || []
    const evoluzione = j.profilo_poetico?.evoluzione || ''
    const opere = j.ultime_opere_rilevanti || []
    const badgeCount = author.poems_count ?? opere.length ?? 0

    const card = document.createElement('div')
    card.className = 'author-card'
    card.innerHTML = `
      <div class="author-card__header">
        <div class="author-card__avatar" style="background-image:url('${author.avatar_url || ''}')"></div>
        <div>
          <div class="author-card__name">${esc(author.username) || 'Senza nome'}</div>
          <div class="author-card__id">${esc(author.id)}</div>
        </div>
        <div class="author-card__badges">
          <span class="badge">${badgeCount} opere</span>
        </div>
      </div>

      <div class="author-card__meta">
        <div class="meta-row">
          <span class="meta-pill">Agg.: ${fmtDate(author.last_updated)}</span>
        </div>
        ${author.public_page_url ? `<a href="${esc(author.public_page_url)}" target="_blank" class="btn">Pagina</a>` : ''}
      </div>

      <div class="journal-preview">
        <div class="journal-preview__text">${esc(descrizione)}</div>
      </div>

      <div class="author-card__footer">
        <div class="author-card__actions">
          <button class="btn btn--primary btn-expand">Espandi</button>
        </div>
        ${author.qr_code_url ? `<div class="author-card__qr" style="background-image:url('${author.qr_code_url}')"></div>` : ''}
      </div>

      <div class="journal-details">
        <div class="journal-details__inner">
          <div class="journal-block">
            <h4>Temi ricorrenti</h4>
            <div class="journal-tags">
              ${temi.map(t => `<span class="journal-tag">${esc(t)}</span>`).join('')}
            </div>
          </div>
          ${evoluzione ? `<div class="journal-block"><h4>Evoluzione</h4><p>${esc(evoluzione)}</p></div>` : ''}
          ${opere.length ? `<div class="journal-block"><h4>Ultime opere</h4><ul>${opere.map(o => `<li>${esc(o.titolo)}</li>`).join('')}</ul></div>` : ''}
        </div>
      </div>
    `
    grid.appendChild(card)
  })

  attachExpandHandlers()
}

// ------- Interazioni -------
function attachExpandHandlers() {
  document.querySelectorAll('.btn-expand').forEach(btn => {
    btn.addEventListener('click', () => {
      const details = btn.closest('.author-card').querySelector('.journal-details')
      details.classList.toggle('is-open')
      btn.textContent = details.classList.contains('is-open') ? 'Chiudi' : 'Espandi'
    })
  })
}

searchInput?.addEventListener('input', () => {
  const term = searchInput.value.toLowerCase()
  const filtered = allAuthors.filter(a =>
    (a.username || '').toLowerCase().includes(term) ||
    (a.poetic_journal?.descrizione_autore || '').toLowerCase().includes(term)
  )
  renderAuthors(filtered)
})

filterSelect?.addEventListener('change', () => {
  let filtered = [...allAuthors]
  if (filterSelect.value === 'recenti') {
    filtered.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated))
  } else if (filterSelect.value === 'piu-poesie') {
    filtered.sort((a, b) => (b.poems_count || 0) - (a.poems_count || 0))
  }
  renderAuthors(filtered)
})

// ------- Start -------
loadAuthors()