import { useState } from 'react'
import { supabase } from './lib/supabaseClient'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSignIn = async (e) => {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    })
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  if (sent) {
    return <p>Check your email for a sign-in link.</p>
  }

  return (
    <form onSubmit={handleSignIn}>
      <h1>Sign in to Fused</h1>
      <input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <button type="submit">Send magic link</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  )
}