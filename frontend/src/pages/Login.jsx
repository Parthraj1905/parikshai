import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')
    setLoading(true)
    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-600 rounded-2xl mb-4">
            <span className="text-white font-black text-lg">P</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ParikshAI</h1>
          <p className="text-gray-500 mt-1 text-sm">સરકારી પરીક્ષા માટે AI ટ્યુટર</p>
        </div>

        <div className="bg-white rounded-2xl p-6">
          <h2 className="text-gray-900 font-bold text-base mb-5">
            {isSignup ? 'Create account' : 'Welcome back'}
          </h2>

          <div className="space-y-3">
            <input
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:bg-gray-100 transition-colors"
              placeholder="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
            <input
              className="w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:bg-gray-100 transition-colors"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          {error && (
            <div className="mt-3 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
          >
            {loading ? '...' : isSignup ? 'Sign Up' : 'Login'}
          </button>

          <p
            className="text-center text-xs text-gray-400 mt-4 cursor-pointer hover:text-gray-600 transition-colors"
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? 'Already have account? Login' : "Don't have account? Sign Up"}
          </p>
        </div>
      </div>
    </div>
  )
}