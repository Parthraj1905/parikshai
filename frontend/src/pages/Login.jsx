import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function SparkleIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8"/>
          <stop offset="50%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#f472b6"/>
        </linearGradient>
      </defs>
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" fill="url(#lg1)"/>
    </svg>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (email) sessionStorage.setItem('userInitial', email.charAt(0).toUpperCase())
  }, [email])

  async function handleSubmit() {
    setError('')
    setSuccessMsg('')
    
    if (isSignup && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        if (!data.session) {
          setSuccessMsg('Account created! Please check your email for a verification link.')
        }
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#131314', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Google Sans', 'Segoe UI', sans-serif", padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <SparkleIcon size={56} />
          </div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#e3e3e3', margin: '0 0 8px', letterSpacing: '-0.5px' }}>ParikshAI</h1>
          <p style={{ color: '#9aa0a6', fontSize: '14px', margin: 0 }}>Powered by Gemini · Govt Exam Tutor</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#1e1f20', borderRadius: '16px', padding: '32px',
          border: '1px solid #3c3c3e',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#e3e3e3', margin: '0 0 24px' }}>
            {isSignup ? 'Create account' : 'Sign in'}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#9aa0a6', marginBottom: '8px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
                autoComplete="email"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  background: '#2a2b2d', border: '1px solid #3c3c3e',
                  color: '#e3e3e3', fontSize: '14px', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#8ab4f8'}
                onBlur={e => e.target.style.borderColor = '#3c3c3e'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#9aa0a6', marginBottom: '8px' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: '10px',
                  background: '#2a2b2d', border: '1px solid #3c3c3e',
                  color: '#e3e3e3', fontSize: '14px', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#8ab4f8'}
                onBlur={e => e.target.style.borderColor = '#3c3c3e'}
              />
            </div>
            {isSignup && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '500', color: '#9aa0a6', marginBottom: '8px' }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    background: '#2a2b2d', border: '1px solid #3c3c3e',
                    color: '#e3e3e3', fontSize: '14px', outline: 'none',
                    fontFamily: 'inherit', boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#8ab4f8'}
                  onBlur={e => e.target.style.borderColor = '#3c3c3e'}
                />
              </div>
            )}
          </div>

          {error && (
            <div style={{
              marginTop: '16px', padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              color: '#f87171', fontSize: '13px',
            }}>
              {error}
            </div>
          )}

          {successMsg && (
            <div style={{
              marginTop: '16px', padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
              color: '#4ade80', fontSize: '13px',
            }}>
              {successMsg}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%', marginTop: '24px', padding: '13px',
              borderRadius: '100px', border: 'none',
              background: loading ? '#3c3c3e' : 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)',
              color: loading ? '#9aa0a6' : '#131314',
              fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'opacity 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}
          >
            {loading ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid #5f6368', borderTopColor: '#9aa0a6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Please wait...
              </>
            ) : (isSignup ? 'Create account' : 'Sign in')}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#9aa0a6' }}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <span 
              style={{ color: '#8ab4f8', fontWeight: '500', cursor: 'pointer' }}
              onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMsg(''); setConfirmPassword(''); }}
            >
              {isSignup ? 'Sign in' : 'Sign up'}
            </span>
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: '#5f6368' }}>
          Powered by Google Gemini AI
        </p>

        <style>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  )
}