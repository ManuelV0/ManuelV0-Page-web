import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { author_id, dry_run } = body || {}

  if (!author_id) {
    return NextResponse.json({ error: 'author_id mancante' }, { status: 400 })
  }

  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/.netlify/functions/forza-analisi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author_id, dry_run })
  })

  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}