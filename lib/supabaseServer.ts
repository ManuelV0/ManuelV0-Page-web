// lib/supabaseServer.ts
import { cookies } from 'next/headers'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export function supabaseServer() {
  const cookieStore = cookies()

  // NB: usa le env pubbliche già presenti su Netlify
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      // In Server Components puri non si possono settare cookie.
      // Queste try/catch evitano errori quando non siamo in Server Action/Route.
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set({ name, value, ...options }) } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set({ name, value: '', ...options, maxAge: 0 }) } catch {}
      },
    },
  })

  return supabase
}
