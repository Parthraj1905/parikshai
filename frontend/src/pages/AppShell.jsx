import { useState, useRef, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTheme } from '../lib/ThemeContext'
import { useToast } from '../lib/ToastContext'
import Chat from './Chat'
import MCQ from './MCQ'
import Dashboard from './Dashboard'
import Settings from './Settings'

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
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const profileRef = useRef()
  const navigate = useNavigate()
  const location = useLocation()
  const { darkMode, toggleTheme } = useTheme()
  const toast = useToast()

  // Close profile menu on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Load chat history from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('chatHistory') || '[]')
      setChatHistory(saved)
    } catch (e) {
      setChatHistory([])
    }
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
  }

  function saveChatHistory(newEntry) {
    const updated = [newEntry, ...chatHistory].slice(0, 50)
    setChatHistory(updated)
    localStorage.setItem('chatHistory', JSON.stringify(updated))
  }

  const navItems = [
    { path: '/', label: 'Chat', icon: '💬' },
    { path: '/mcq', label: 'MCQ Practice', icon: '📝' },
    { path: '/dashboard', label: 'Progress', icon: '📊' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full px-3 py-5">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-sm text-white font-black shadow-sm">P</div>
        <span className="text-gray-900 dark:text-gray-100 font-black text-base tracking-tight">ParikshAI</span>
      </div>

      {/* Exam Selector */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 px-2">Exam</p>
        <div className="grid grid-cols-2 gap-1">
          {EXAMS.map(e => (
            <button key={e} onClick={() => setExam(e)}
              className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                exam === e 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
              }`}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Language Selector */}
      <div className="mb-5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 px-2">Language</p>
        <div className="flex gap-1">
          {LANGS.map(l => (
            <button key={l.code} onClick={() => setLang(l.code)} title={l.full}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                lang === l.code 
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-200'
              }`}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5 px-2">Menu</p>
        <div className="space-y-0.5">
          {navItems.map(item => (
            <button key={item.path}
              onClick={() => { navigate(item.path); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive(item.path) 
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-semibold' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Dark Mode Toggle */}
      <div className="mb-4 px-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <span>{darkMode ? '☀️' : '🌙'}</span>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>

      {/* User Profile */}
      <div className="relative" ref={profileRef}>
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
            {session?.user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {session?.user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[10px] text-gray-400 truncate">{session?.user?.email}</p>
          </div>
        </button>

        {/* Profile Dropdown */}
        {showProfileMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 py-1 animate-scale-in">
            <button
              onClick={() => { navigate('/settings'); setShowProfileMenu(false) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              <span>⚙️</span> Settings
            </button>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            >
              <span>🚪</span> Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-[#fafafa] dark:bg-[#0a0a0a] overflow-hidden">
      {/* Mobile sidebar drawer */}
      {sidebarOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.4)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: '240px', zIndex: 999, background: 'dark', overflowY: 'auto' }}
            className="dark:bg-[#0f0f0f]">
            <SidebarContent />
          </div>
        </>
      )}

      {/* Chat History Sidebar */}
      {showHistory && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(0,0,0,0.2)' }}
            onClick={() => setShowHistory(false)}
          />
          <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '280px', zIndex: 999, background: 'white', overflowY: 'auto' }}
            className="dark:bg-[#0f0f0f] shadow-lg animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100">Chat History</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="px-4 py-3">
              {chatHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">No chat history yet</p>
                  <p className="text-gray-400 text-xs mt-1">Start a conversation to see it here</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {chatHistory.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { navigate('/'); setShowHistory(false) }}
                      className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all"
                    >
                      <p className="truncate font-medium">{item.topic || 'New Chat'}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{item.time || 'Just now'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-white dark:bg-[#1a1a1a] shrink-0 border-r border-gray-100 dark:border-gray-800">
        <SidebarContent />
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-gray-800">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-400 p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory(true)} className="text-gray-500 dark:text-gray-400 p-1">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
            <span className="text-gray-900 dark:text-gray-100 font-black text-base">ParikshAI</span>
          </div>
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-2 py-1 rounded-lg">{exam}</span>
        </div>

        <Routes>
          <Route path="/" element={<Chat exam={exam} lang={lang} onSaveHistory={saveChatHistory} />} />
          <Route path="/mcq" element={<MCQ exam={exam} lang={lang} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}