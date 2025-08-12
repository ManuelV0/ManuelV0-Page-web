#!/usr/bin/env bash
set -euo pipefail

# USO:
#   ./codex_commit.sh "PERCORSO/DEL/FILE" "PROMPT PER CODEX" [branch]
#
# Esempio:
#   ./codex_commit.sh app/diario/page.tsx \
#     "Aggiungi sezioni collassabili con scroll su pagina diario, mantieni stile esistente" \
#     main

FILE_PATH="${1:-}"
PROMPT="${2:-}"
BRANCH="${3:-main}"

if [[ -z "${OPENAI_API_KEY:-}" ]]; then
  echo "Errore: imposta OPENAI_API_KEY nell'ambiente" >&2
  exit 1
fi
if [[ -z "$FILE_PATH" || -z "$PROMPT" ]]; then
  echo "Uso: $0 <file_path> <prompt> [branch]" >&2
  exit 1
fi

# Crea cartella file se non esiste
mkdir -p "$(dirname "$FILE_PATH")"

# Contenuto attuale (se esiste)
OLD_CONTENT=""
if [[ -f "$FILE_PATH" ]]; then
  OLD_CONTENT="$(cat "$FILE_PATH")"
fi

# Prompt di sistema: obbliga a restituire SOLO il contenuto del file, niente markdown
SYSTEM_MSG="Sei un assistente che modifica file di progetto.
Rispondi SOLO con il contenuto finale completo del file da salvare in '${FILE_PATH}'.
Nessuna spiegazione, nessun markdown, nessun backtick."

USER_MSG=$(cat <<EOF
Repo context:
Percorso file: ${FILE_PATH}
Contenuto ATTUALE (può essere vuoto):
<<OLD_FILE>>
${OLD_CONTENT}
<<END_OLD_FILE>>

Richiesta:
${PROMPT}

Requisiti:
- Mantieni stile e dipendenze consistenti.
- Il risultato deve essere un file valido e completo.
- Non aggiungere spiegazioni fuori dal codice necessario.
EOF
)

# Chiamata OpenAI (chat completions) e salvataggio file
TMP_JSON="$(mktemp)"
curl -sS https://api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer ${OPENAI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n \
        --arg sys "$SYSTEM_MSG" \
        --arg usr "$USER_MSG" \
        --arg model "gpt-4o-mini" \
        '{model:$model,messages:[{role:"system",content:$sys},{role:"user",content:$usr}],temperature:0.2}')" \
  > "$TMP_JSON"

NEW_CONTENT="$(jq -r '.choices[0].message.content' "$TMP_JSON")"
rm -f "$TMP_JSON"

# Scrivi il file generato
printf "%s" "$NEW_CONTENT" > "$FILE_PATH"

# Commit & push su BRANCH (default: main)
git checkout -B "$BRANCH" || true
git add "$FILE_PATH"

if git diff --cached --quiet; then
  echo "Nessuna modifica da committare."
  exit 0
fi

MSG="chore(codex): ${PROMPT}"
git commit -m "$MSG"
git push -u origin "$BRANCH"

echo "✅ Commit e push completati su ${BRANCH}: $FILE_PATH"
