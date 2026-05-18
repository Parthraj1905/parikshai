import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import AppShell from './pages/AppShell'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#171717]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm animate-pulse">Loading ParikshAI...</p>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/*" element={session ? <AppShell session={session} /> : <Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}