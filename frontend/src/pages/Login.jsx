import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  useEffect(() => {
    // Store user initial for chat avatar
    if (email) {
      sessionStorage.setItem('userInitial', email.charAt(0).toUpperCase())
    }
  }, [email])

  useEffect(() => {
    // Calculate password strength
    if (isSignup && password) {
      let strength = 0
      if (password.length >= 6) strength += 25
      if (password.length >= 8) strength += 25
      if (/[A-Z]/.test(password)) strength += 25
      if (/[0-9]/.test(password)) strength += 25
      setPasswordStrength(strength)
    } else {
      setPasswordStrength(0)
    }
  }, [password, isSignup])

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

  const getStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500'
    if (passwordStrength <= 50) return 'bg-orange-500'
    if (passwordStrength <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStrengthLabel = () => {
    if (passwordStrength <= 25) return 'Weak'
    if (passwordStrength <= 50) return 'Fair'
    if (passwordStrength <= 75) return 'Good'
    return 'Strong'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-gray-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl mb-4 shadow-lg shadow-orange-500/20">
            <span className="text-white font-black text-2xl">P</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">ParikshAI</h1>
          <p className="text-gray-500 mt-1 text-sm">सरकारी परीक्षा AI ट्युटर</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-slide-up">
          <h2 className="text-gray-900 font-bold text-base mb-5">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
              <input
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all duration-200"
                placeholder="you@example.com"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete="email"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Password</label>
              <input
                className="w-full bg-gray-50 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:bg-white transition-all duration-200"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
              />
              
              {/* Password strength indicator */}
              {isSignup && password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getStrengthColor()} rounded-full transition-all duration-300`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 ml-2">{getStrengthLabel()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 text-red-600 rounded-xl px-4 py-3 text-xs flex items-center gap-2 animate-slide-up">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-3.5 rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:shadow-orange-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isSignup ? 'Create account' : 'Sign in'}</span>
            )}
          </button>

          <div className="mt-4 text-center">
            <p
              className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
              onClick={() => { setIsSignup(!isSignup); setError('') }}
            >
              {isSignup ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-400 mt-6">
          Powered by Google Gemini AI
        </p>
      </div>
    </div>
  )
}