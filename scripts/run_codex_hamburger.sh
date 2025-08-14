#!/usr/bin/env bash
set -uo pipefail   # tolgo -e così vediamo gli errori senza uscire muto
# attiva TRACE se vuoi: set -x

BASE="/home/manuel/Scrivania/Page-web"
CODEX_ALL="$BASE/scripts/codex_all.sh"

echo "▶ avvio run_codex_hamburger.sh"
echo "BASE=$BASE"
echo "CODEX_ALL=$CODEX_ALL"

# Check file e permessi
if [[ ! -f "$CODEX_ALL" ]]; then
  echo "❌ Manca $CODEX_ALL"
  exit 1
fi
if [[ ! -x "$CODEX_ALL" ]]; then
  echo "ℹ Rendo eseguibile $CODEX_ALL"
  chmod +x "$CODEX_ALL" || { echo "❌ chmod fallito"; exit 1; }
fi

# Check API key
if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "❌ OPENAI_API_KEY non impostata. Esempio:"
  echo "   export OPENAI_API_KEY='sk-...'"
  exit 1
fi
echo "✅ OPENAI_API_KEY presente"

read -r -d '' MAIN_PROMPT <<'EOF'
Implementa nell'header un hamburger menu per il titolo "The Italian Poetry" e, nei file CSS/TS/TSX/JS toccati, applica anche correzioni di sintassi e formattazione (commenti non validi, residui ``` o ''', slash iniziali), uniforma import/order e fix lint banali.
Vincoli: NON modificare logica base (routing, auth, API, store), né deps/config; mantieni nomi pubblici e tipi invariati. Output: solo contenuto finale dei file aggiornati.

SPECIFICHE HAMBURGER MENU
- Su mobile (<768px) il titolo diventa pulsante hamburger (☰) che apre/chiude un menu con le voci esistenti (Home, Diario, Autori, Come partecipare, Login, Chi siamo).
- Su desktop l’header resta com’è ora.
- Accessibilità: <button> con aria-expanded true/false, aria-controls="site-mobile-menu", aria-label dinamico; ESC e click fuori chiudono; focus sul primo link all’apertura.
- Struttura: <nav id="site-mobile-menu" role="menu"> con <li role="menuitem"> e <Link>. Non cambiare i path.
- CSS: aggiungi SOLO nuove classi (non rinominare esistenti) es. .hamburger, .hamburger-line, .mobile-menu(.open), .sr-only. Nessuna nuova dipendenza.
EOF

read -r -d '' FIX_PROMPT <<'EOF'
Correggi errori di sintassi e formattazione su CSS/TS/TSX/JS (commenti non validi, residui ``` o ''', slash iniziali), uniforma import/order e fix lint banali.
Vincoli: NON modificare logica base (routing, auth, API, store), né deps/config; mantieni nomi pubblici e tipi invariati.
Output: solo contenuto finale del file.
EOF

cd "$BASE" || { echo "❌ cd $BASE fallito"; exit 1; }
echo "📁 pwd=$(pwd)"

echo "🔧 LANCIO CODEX_ALL (MAIN_PROMPT)…"
VERIFY=1 BUILD_CHECK=0 BATCH=200 MODE=direct PUSH=1 PATH_ROOT="$BASE" \
"$CODEX_ALL" <<<"$MAIN_PROMPT"
RC1=$?
echo "ℹ codex_all (main) exit=$RC1"

echo "🔍 npm run build (test build)…"
npm run build
RCB=$?
echo "ℹ build exit=$RCB"

if [[ $RCB -ne 0 ]]; then
  echo "❌ Build fallita: avvio correzione (FIX_PROMPT)…"
  VERIFY=1 BUILD_CHECK=0 BATCH=200 MODE=direct PUSH=1 PATH_ROOT="$BASE" \
  "$CODEX_ALL" <<<"$FIX_PROMPT"
  RCF=$?
  echo "ℹ codex_all (fix) exit=$RCF"

  echo "🔁 Riprovo build…"
  npm run build
  RCB2=$?
  echo "ℹ build (seconda) exit=$RCB2"
  if [[ $RCB2 -ne 0 ]]; then
    echo "⛔ Build ancora fallita. Controlla log sopra."
    exit 1
  fi
fi

echo "✅ Tutto ok. Avvia pure: npm start"
