import { useState } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Chat from './Chat'
import MCQ from './MCQ'
import Dashboard from './Dashboard'

const EXAMS = ['GPSC', 'SSC', 'RRB', 'UPSC']
const LANGS = [
  { code: 'gu', label: 'ગુ', full: 'ગુજરાતી' },
  { code: 'hi', label: 'हि', full: 'हिंदी' },
  { code: 'en', label: 'En', full: 'English' },
]

export default function AppShell({ session }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [exam, setExam] = useState('GPSC')
  const [lang, setLang] = useState('gu')
  const navigate = useNavigate()
  const location = useLocation()

  async function logout() {
    await supabase.auth.signOut()
  }

  const navItems = [
    { path: '/', label: 'Chat', icon: '💬' },
    { path: '/mcq', label: 'MCQ Practice', icon: '📝' },
    { path: '/dashboard', label: 'Progress', icon: '📊' },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const Sidebar = () => (
    <div className="flex flex-col h-full px-3 py-5">
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-xs text-white font-black">P</div>
        <span className="text-gray-900 font-black text-base tracking-tight">ParikshAI</span>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 px-2">Exam</p>
        <div className="grid grid-cols-2 gap-1">
          {EXAMS.map(e => (
            <button key={e} onClick={() => setExam(e)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                exam === e ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 px-2">Language</p>
        <div className="flex gap-1">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} title={l.full}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                lang === l.code ? 'bg-orange-600 text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
              }`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <nav className="flex-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 px-2">Menu</p>
        <div className="space-y-0.5">
          {navItems.map(item => (
            <button key={item.path} onClick={() => { navigate(item.path); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path) ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-4">
        <div className="flex items-center gap-2.5 px-2 mb-2">
          <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
            {session?.user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <p className="text-gray-400 text-xs truncate">{session?.user?.email}</p>
        </div>
        <button onClick={logout} className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors py-1.5 px-2 text-left rounded-lg hover:bg-gray-50">
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#f7f7f5] overflow-hidden">
      <aside className="hidden md:flex flex-col w-56 bg-white shrink-0">
        <Sidebar />
      </aside>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-[200] flex">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 bg-white flex flex-col shadow-2xl z-[100]">
            <Sidebar />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <span className="text-gray-900 font-black text-base">ParikshAI</span>
          <span className="bg-orange-50 text-orange-600 text-xs font-bold px-2 py-1 rounded-lg">{exam}</span>
        </div>

        <Routes>
          <Route path="/" element={<Chat exam={exam} lang={lang} />} />
          <Route path="/mcq" element={<MCQ exam={exam} lang={lang} />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  )
}