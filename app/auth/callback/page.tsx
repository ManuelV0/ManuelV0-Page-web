'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    const run = async () => {
      try {
        await supabase.auth.getSession()
        setStatus('ok')
      } catch {
        setStatus('error')
      }
    }
    run()
  }, [])

  return (
    <main className="container" role="main">
      <section className="card-section" aria-labelledby="auth-heading">
        <div className="card-content">
          <h1 id="auth-heading" className="visually-hidden">Accesso</h1>
          {status === 'loading' && <p aria-live="polite">Verifica in corso…</p>}
          {status === 'ok' && <p>Accesso completato! Torna alla <Link href="/">Home</Link>.</p>}
          {status === 'error' && <p>Qualcosa è andato storto. Riprova dalla <Link href="/login">pagina di accesso</Link>.</p>}
        </div>
      </section>
    </main>
  )
}