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
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">ParikshAI</h1>
        <p className="text-gray-500 mb-8 text-sm">સરકારી પરીક્ષા માટે AI ટ્યુટર</p>

        <div className="space-y-4">
          <input
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-red-500 text-xs mt-3">{error}</p>}

        <button
          onClick={handleSubmit}
          className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium mt-6 hover:bg-gray-800 transition-colors"
        >
          {isSignup ? 'Sign Up' : 'Login'}
        </button>

        <button
          type="button"
          className="w-full text-center text-xs text-gray-500 mt-6 cursor-pointer hover:text-black transition-colors bg-transparent border-none"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  )
}