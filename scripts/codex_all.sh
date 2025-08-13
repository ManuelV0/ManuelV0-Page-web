
#!/usr/bin/env bash
set -euo pipefail

# --- CONFIG ---
PROMPT=${PROMPT:-"Manutenzione non-funzionale: a11y (aria-*, headings, alt), leggibilità, piccoli fix lint. Non cambiare logica core, routing, auth, contratti API, store o config. Mantieni import e tipi; nessuna nuova dipendenza. Output: solo contenuto file."}
BRANCH=${BRANCH:-main}
PATH_ROOT=${PATH_ROOT:-.}
BATCH=${BATCH:-50}         # grande ma ragionevole
MODE=${MODE:-direct}       # o "guarded"
PUSH=${PUSH:-1}            # 1=push, 0=no push

# --- SAFETY: working tree deve essere pulita ---
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "❌ Working tree non pulita. Committa/stasha prima di procedere."
  exit 1
fi

# --- Assicurati di essere sul branch giusto e aggiornato ---
CUR=$(git rev-parse --abbrev-ref HEAD)
[ "$CUR" != "$BRANCH" ] && git checkout "$BRANCH"
git fetch origin "$BRANCH" || true
git pull --ff-only origin "$BRANCH" || true

# --- Loop fino a esaurimento modifiche ---
ITER=0
while true; do
  ITER=$((ITER+1))
  echo "▶️  Iterazione #$ITER — batch=$BATCH"

  python scripts/codex_safe_commit.py \
    --path "$PATH_ROOT" \
    --prompt "$PROMPT" \
    --mode "$MODE" \
    --max-files "$BATCH" \
    $([ "$PUSH" = "1" ] && echo --push || true) || true

  # se non restano differenze, usciamo
  if git diff --quiet && git diff --cached --quiet; then
    echo "✅ Nessun altro file da aggiornare. Finito."
    break
  fi
done


