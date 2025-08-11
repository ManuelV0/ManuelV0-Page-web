// lib/supabaseServer.ts
import { createClient } from '@supabase/supabase-js'

export function supabaseServer() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  // Per letture pubbliche è sufficiente l'anon key (niente service role su Netlify)
  return createClient(url, anon, { auth: { persistSession: false } })
}
