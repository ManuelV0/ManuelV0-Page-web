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
    <main className="container" role="main">
      <section className="card-section" aria-labelledby="login-heading">
        <div className="card-content">
          <h2 id="login-heading">Accedi</h2>
          <p className="mb-sm">Accedi per inviare e votare poesie.</p>
          <button 
            className="button button-primary" 
            onClick={signIn} 
            aria-label="Accedi con Google"
          >
            <i className="fab fa-google" style={{ marginRight: 8 }} aria-hidden="true" /> 
            Accedi con Google
          </button>
        </div>
      </section>
    </main>
  )
}