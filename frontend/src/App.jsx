import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState, lazy, Suspense } from 'react'
import { supabase } from './lib/supabase'
import { keepAliveBackend } from './lib/api'

// Lazy load heavy pages — only downloaded when the user actually needs them
const Login = lazy(() => import('./pages/Login'))
const AppShell = lazy(() => import('./pages/AppShell'))

function LoadingSpinner() {
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#1e1f20', gap: '12px' }}>
      <div style={{ width: '40px', height: '40px', border: '3px solid rgba(138,180,248,0.2)', borderTopColor: '#8ab4f8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p style={{ color: '#9aa0a6', fontSize: '13px', fontFamily: "'Google Sans', sans-serif", margin: 0 }}>Loading ParikshAI...</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wake up the backend immediately + keep it alive every 10 min
    keepAliveBackend()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route path="/*" element={session ? <AppShell session={session} /> : <Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}