'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function AuthCallback() {
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')

  useEffect(() => {
    const run = async () => {
      try {
        // Forza il parsing dei parametri e la creazione sessione
        await supabase.auth.getSession()
        setStatus('ok')
      } catch {
        setStatus('error')
      }
    }
    run()
  }, [])

  return (
    <main className="container">
      <section className="card-section">
        <div className="card-content">
          <h2>Accesso</h2>
          {status === 'loading' && <p>Verifica in corso…</p>}
          {status === 'ok' && <p>Accesso completato! Torna alla <Link href="/">Home</Link>.</p>}
          {status === 'error' && <p>Qualcosa è andato storto. Riprova dalla <Link href="/login">pagina di accesso</Link>.</p>}
        </div>
      </section>
    </main>
  )
}
