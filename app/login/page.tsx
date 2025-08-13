'use client'

import { supabase } from '@/lib/supabaseClient'

export default function LoginPage() {
  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`
      }
    })
  }

  return (
    <main className="container">
      <section className="card-section">
        <div className="card-content">
          <h2>Accedi</h2>
          <p className="mb-sm">Accedi per inviare e votare poesie.</p>
          <button className="button button-primary" onClick={signIn}>
            <i className="fab fa-google" style={{ marginRight: 8 }} /> Accedi con Google
          </button>
        </div>
      </section>
    </main>
  )
}
