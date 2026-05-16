import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    setError('')
    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-orange-600 mb-2">ParikshAI</h1>
        <p className="text-gray-500 mb-6">સરકારી પરીક્ષા માટે AI ટ્યુટર</p>

        <input
          className="w-full border rounded-lg p-3 mb-3 focus:outline-orange-400"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded-lg p-3 mb-3 focus:outline-orange-400"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600"
        >
          {isSignup ? 'Sign Up' : 'Login'}
        </button>

        <p
          className="text-center text-sm text-gray-500 mt-4 cursor-pointer hover:text-orange-500"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup ? 'Already have account? Login' : "Don't have account? Sign Up"}
        </p>
      </div>
    </div>
  )
}