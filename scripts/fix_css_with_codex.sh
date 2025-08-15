#!/usr/bin/env bash
set -euo pipefail

BASE="${BASE:-$(pwd)}"
CODEX_ALL="${CODEX_ALL:-$BASE/scripts/codex_all.sh}"

echo "▶ avvio fix_css_with_codex.sh"
echo "BASE=$BASE"
echo "CODEX_ALL=$CODEX_ALL"

# 0) Precondizioni
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Working tree non pulita. Committa o stasha prima."
  echo "Suggerimento: git add -A && git commit -m 'WIP: prima di fix css' || git stash -u"
  exit 1
fi

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "❌ OPENAI_API_KEY non impostata"
  exit 1
fi
echo "✅ OPENAI_API_KEY presente"

# 1) Lista rapida file potenzialmente problematici
echo "🔎 Scansione pattern sospetti (commenti rotti e code fences)…"
grep -RIn --include='*.css' --include='*.ts' --include='*.tsx' --include='*.js' \
  -e '^[[:space:]]*/[[:space:]]\*' \
  -e '^```' -e "^'''" \
  -e '/ \*' \
  app css || true

# 2) PROMPT per Codex: correzioni sintassi/formatting, nessun cambio logica
read -r -d '' PROMPT <<'EOF'
Correggi SOLO i file forniti applicando:
- Rimozione di residui di blocchi ``` o ''' all'inizio/fine dei file.
- Normalizzazione dei commenti CSS: niente "/ *" o "* /", usa /* ... */ validi.
- NIENTE modifiche di logica o UI sostanziale; non toccare routing, auth, API, store, config o dipendenze.
- Mantieni nomi pubblici, firme, tipi e import invariati; ok solo ordinamenti import e fix lint banali.
- In TSX/JSX: non usare "alt" su elementi non <img>; mantieni aria-label/role corretti.

Output richiesto: SOLO il contenuto finale completo del file, senza testo extra né markdown.
EOF
export PROMPT

# 3) Esegui codex_all su app/ e css/ con verifica e build-check
echo "🔧 LANCIO codex_all su app/…"
VERIFY=1 BUILD_CHECK=1 BATCH=200 MODE=guarded PUSH=1 PATH_ROOT=app \
bash "$CODEX_ALL"

echo "🔧 LANCIO codex_all su css/…"
VERIFY=1 BUILD_CHECK=1 BATCH=200 MODE=guarded PUSH=1 PATH_ROOT=css \
bash "$CODEX_ALL"

# 4) Fallback locale anti-sporcizia: rimuove code fences e commenti CSS rotti
echo "🧽 Fallback locale (sed) su CSS/TS/TSX/JS…"
# Rimuovi fence ``` / ''' SOLO se in prima riga
find app css -type f \( -name '*.css' -o -name '*.ts' -o -name '*.tsx' -o -name '*.js' \) -print0 \
| xargs -0 -I{} bash -c "sed -i '1{/^```/d}' '{}' ; sed -i \"1{/^'''/d}\" '{}' "

# Commenti CSS: converte "/ *" -> "/*" e "* /" -> "*/"
find app css -type f -name '*.css' -print0 \
| xargs -0 sed -i \
  -e 's@[[:space:]]/ \*@ /*@g' \
  -e 's@/\s\*@/*@g' \
  -e 's@\*\s/ @*/ @g' \
  -e 's@\*\s/@*/@g'

# 5) Pulisci build vecchia e prova build
echo "🧹 Pulizia .next/"
rm -rf .next

echo "🏗️ Provo build…"
npm run build

echo "✅ Fine. Se la build è ok, puoi runnare: npm start"
