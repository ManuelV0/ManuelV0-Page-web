#!/usr/bin/env python3
import os
import sys
import argparse
import pathlib
import subprocess
from typing import List
from openai import OpenAI

# ---- Config base ----
EXCLUDE_DIRS = {".git","node_modules",".next","out","build","dist","coverage",".yarn",".venv","vendor"}
ALLOWED_EXT  = {".ts",".tsx",".js",".jsx",".css",".scss",".md",".mdx",".json",".toml",".yml",".yaml",".mjs",".cjs",".html"}
MAX_FILE_SIZE = 200_000  # 200 KB

def run(cmd: List[str], check=True, cwd=None, capture=False) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, check=check, cwd=cwd, text=True,
                          stdout=(subprocess.PIPE if capture else None),
                          stderr=(subprocess.PIPE if capture else None))

def ensure_git_repo():
    try:
        run(["git","rev-parse","--is-inside-work-tree"])
    except subprocess.CalledProcessError:
        print("❌ Non sei dentro una repo git. Esegui dentro la repo.")
        sys.exit(1)

def resolve_targets(root: pathlib.Path, target_path: str, max_files: int) -> List[pathlib.Path]:
    tgt = (root / (target_path.strip() or ".")).resolve()
    files: List[pathlib.Path] = []
    def allowed(p: pathlib.Path) -> bool:
        if not p.is_file(): return False
        if any(part in EXCLUDE_DIRS for part in p.parts): return False
        if p.suffix.lower() not in ALLOWED_EXT: return False
        try:
            if p.stat().st_size > MAX_FILE_SIZE: return False
            p.read_text(encoding="utf-8")
        except Exception:
            return False
        return True

    if tgt.is_file():
        if allowed(tgt): files = [tgt]
    elif tgt.is_dir():
        for p in tgt.rglob("*"):
            if allowed(p):
                files.append(p)
                if len(files) >= max_files: break
    else:
        print(f"❌ Path non trovato: {tgt}")
        sys.exit(1)

    return files

def get_file_diff(paths: List[pathlib.Path], root: pathlib.Path) -> str:
    paths_rel = [p.relative_to(root).as_posix() for p in paths]
    if not paths_rel:
        return ""
    cp = run(["git","diff","--no-color","--"]+paths_rel, check=False, capture=True)
    return cp.stdout or ""

def ai_review_gate(diff_text: str, api_key: str) -> str:
    if not diff_text.strip():
        return "OK"
    client = OpenAI(api_key=api_key)
    prompt = (
        "Sei un reviewer severo.\n"
        "Rispondi SOLO con: OK | PR | BLOCK\n"
        "- OK se il diff NON altera logica base (routing, auth, modelli dati, contratti API, stato globale/store, config core)\n"
        "  e non introduce segreti/credenziali.\n"
        "- PR se il cambio è ampio/rischioso o tocca logica base.\n"
        "- BLOCK se vedi codice potenzialmente dannoso o credenziali.\n\n"
        f"DIFF:\n{diff_text}"
    )
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"system","content":"Rispondi con una sola parola: OK | PR | BLOCK"},
                  {"role":"user","content":prompt}],
        temperature=0.0,
        max_tokens=5
    )
    return (r.choices[0].message.content or "").strip()

def apply_codex_to_file(path: pathlib.Path, prompt: str, api_key: str, root: pathlib.Path):
    old = path.read_text(encoding="utf-8")
    system = (
        "Sei un assistente che modifica file (TS/JS/React/Next).\n"
        "- NON toccare LOGICA BASE: routing, auth, modelli dati, contratti API, stato globale/store, config core.\n"
        "- Interventi ammessi: UI/UX, accessibilità, performance leggere, refactor non funzionali, fix lint/warning, typo/doc.\n"
        "- Output: SOLO il contenuto finale del file target (niente markdown né spiegazioni)."
    )
    user = (
        f"File: {path.relative_to(root).as_posix()}\n"
        "Stato attuale:\n<<OLD_FILE>>\n"
        f"{old}\n<<END_OLD_FILE>>\n\n"
        f"Obiettivo:\n{prompt}\n\n"
        "Requisiti:\n"
        "- Coerenza import/tipi/stile; nessun breaking change della logica core.\n"
        "- Output: SOLO contenuto finale del file."
    )
    client = OpenAI(api_key=api_key)
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role":"system","content":system},
                  {"role":"user","content":user}],
        temperature=0.1,
        max_tokens=4000
    )
    new_content = r.choices[0].message.content or ""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(new_content, encoding="utf-8")
    print(f"✅ Aggiornato: {path.relative_to(root).as_posix()}")

def main():
    parser = argparse.ArgumentParser(description="Codex safe commit (script, no YAML).")
    parser.add_argument("--path", required=True, help="File O cartella (es: app/diario/page.tsx o app/diario o .)")
    parser.add_argument("--prompt", required=True, help="Cosa deve fare Codex")
    parser.add_argument("--mode", choices=["direct","guarded"], default="guarded", help="direct=commit diretto, guarded=PR se rischioso")
    parser.add_argument("--max-files", type=int, default=5, help="Se è cartella, max file da processare")
    parser.add_argument("--branch", default="main", help="Branch di destinazione")
    parser.add_argument("--push", action="store_true", help="Se impostato, esegue git push")
    parser.add_argument("--open-pr", action="store_true", help="Se impostato e mode=guarded/PR richiesto, crea PR su nuovo branch")
    parser.add_argument("--pr-branch-prefix", default="codex/auto-", help="Prefisso branch per PR")
    args = parser.parse_args()

    ensure_git_repo()
    root = pathlib.Path(".").resolve()
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("❌ Mancante OPENAI_API_KEY nell'ambiente.")
        sys.exit(1)

    # Assicurati di essere sul branch corretto e aggiornato
    run(["git","fetch","origin",args.branch], check=False)
    run(["git","checkout",args.branch])
    run(["git","pull","--ff-only","origin",args.branch], check=False)

    targets = resolve_targets(root, args.path, args.max_files)
    if not targets:
        print("ℹ️ Nessun file eleggibile trovato (controlla path/estensioni/limite).")
        return

    # Applica GPT file per file
    for p in targets:
        apply_codex_to_file(p, args.prompt, api_key, root)

    # Mostra diff
    run(["git","status"], check=False)
    diff_text = get_file_diff(targets, root)
    if not diff_text.strip():
        print("ℹ️ Nessuna differenza da committare.")
        return

    # Gate euristico
    stats = run(["bash","-lc","git diff --numstat | awk '{ins+=$1; del+=$2} END{print ins+0, del+0}'"], check=False, capture=True)
    ins, dele = (stats.stdout.strip().split() if stats.stdout.strip() else ["0","0"])
    ins, dele = int(ins), int(dele)
    need_pr = (ins > 1200 or dele > 600 or len(targets) > 8)

    # Gate AI (solo in guarded)
    gate_res = "OK"
    if args.mode == "guarded":
        gate_res = ai_review_gate(diff_text, api_key)
        need_pr = need_pr or (gate_res == "PR")

    print(f"Gate: {gate_res} | need_pr={need_pr}")

    # Commit
    run(["git","config","user.name","github-actions[bot]"], check=False)
    run(["git","config","user.email","41898282+github-actions[bot]@users.noreply.github.com"], check=False)
    run(["git","add","-A"])
    # Se nessuna staged change, esci
    staged = run(["bash","-lc","git diff --cached --quiet || echo CHANGED"], check=False, capture=True)
    if "CHANGED" not in (staged.stdout or ""):
        print("ℹ️ Nessuna modifica staged.")
        return

    commit_msg = f"chore(codex): {args.prompt} [skip ci]"
    if args.mode == "guarded":
        commit_msg += " [guarded]"
    run(["git","commit","-m",commit_msg])

    # Push / PR
    if args.push:
        # direct
        if args.mode == "direct" and not need_pr:
            run(["git","push","origin",args.branch])
            print("🚀 Push diretto eseguito.")
            return

        # guarded → se serve PR, crea branch e push
        if need_pr or args.mode == "guarded":
            import time
            new_branch = f"{args.pr_branch_prefix}{int(time.time())}"
            run(["git","checkout","-b",new_branch])
            run(["git","push","-u","origin",new_branch])
            print(f"🔀 PR suggerita dal branch: {new_branch}")
            if args.open_pr:
                # prova con GitHub CLI se presente
                try:
                    pr = run([
                        "gh","pr","create",
                        "-B",args.branch,"-H",new_branch,
                        "-t",f"Codex: {args.prompt}",
                        "-b","PR generata automaticamente (guarded)."
                    ], check=False, capture=True)
                    print(pr.stdout or pr.stderr)
                except FileNotFoundError:
                    print("ℹ️ gh CLI non trovato: apri la PR manualmente dalla pagina GitHub.")
    else:
        print("ℹ️ Push non eseguito (usa --push per push/PR).")

if __name__ == "__main__":
    main()
