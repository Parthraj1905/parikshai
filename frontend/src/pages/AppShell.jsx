import { useState, useRef, useEffect, useCallback } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/ToastContext'
import { listChats } from '../lib/api'
import Chat from './Chat'
import MCQ from './MCQ'
import Dashboard from './Dashboard'
import Settings from './Settings'
import Billing from './Billing'

const LANGS = [
  { code: 'gu', label: 'ગુ', full: 'ગુજરાતી' },
  { code: 'hi', label: 'हि', full: 'हिंदी' },
  { code: 'en', label: 'En', full: 'English' },
]

const Icons = {
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  chat: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  mcq: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
  progress: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  billing: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>,
  logout: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  plus: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
}

function SparkleIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8" />
          <stop offset="50%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
      </defs>
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" fill="url(#g1)" />
    </svg>
  )
}

const navItems = [
  { path: '/', label: 'Chat', icon: Icons.chat },
  { path: '/mcq', label: 'MCQ Practice', icon: Icons.mcq },
  { path: '/dashboard', label: 'Progress', icon: Icons.progress },
  { path: '/billing', label: 'Billing', icon: Icons.billing },
  { path: '/settings', label: 'Settings', icon: Icons.settings },
]

export default function AppShell({ session }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [lang, setLang] = useState('gu')

  // messages lifted here so they survive route changes (billing, settings, etc.)
  const [messages, setMessages] = useState([])
  // track which saved chat's messages are currently loaded (to avoid unnecessary clears)
  const lastLoadedChatId = useRef(null)

  const [chatHistory, setChatHistory] = useState([])
  const [loadingChats, setLoadingChats] = useState(false)
  const sidebarRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()

  async function logout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
  }

  useEffect(() => {
    if (sidebarOpen) return
    const hideTimer = setTimeout(() => setSidebarVisible(false), 220)
    return () => clearTimeout(hideTimer)
  }, [sidebarOpen])

  useEffect(() => {
    if (!sidebarOpen) return
    function handleOutsidePointerDown(event) {
      const isMobile = window.matchMedia('(max-width: 767px)').matches
      if (!isMobile || sidebarRef.current?.contains(event.target)) return
      setSidebarOpen(false)
    }
    document.addEventListener('pointerdown', handleOutsidePointerDown)
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown)
  }, [sidebarOpen])

  function openSidebar() {
    setSidebarVisible(true)
    requestAnimationFrame(() => setSidebarOpen(true))
  }

  const refreshChats = useCallback(async () => {
    setLoadingChats(true)
    try {
      setChatHistory(await listChats())
    } catch (error) {
      if (error.response?.status !== 402) {
        toast.error(error.response?.data?.detail || 'Could not load saved chats')
      }
      setChatHistory([])
    } finally {
      setLoadingChats(false)
    }
  }, [toast])

  useEffect(() => {
    const timer = setTimeout(() => { refreshChats() }, 0)
    return () => clearTimeout(timer)
  }, [refreshChats])

  useEffect(() => {
    function updateAppHeight() {
      const viewportHeight = window.visualViewport?.height || window.innerHeight
      document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`)
    }
    updateAppHeight()
    window.addEventListener('resize', updateAppHeight)
    window.visualViewport?.addEventListener('resize', updateAppHeight)
    window.visualViewport?.addEventListener('scroll', updateAppHeight)
    return () => {
      window.removeEventListener('resize', updateAppHeight)
      window.visualViewport?.removeEventListener('resize', updateAppHeight)
      window.visualViewport?.removeEventListener('scroll', updateAppHeight)
      document.documentElement.style.removeProperty('--app-height')
    }
  }, [])

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  const isChatRoute = location.pathname === '/'
  const activeChatId = new URLSearchParams(location.search).get('chat') || null

  function startNewChat() {
    setMessages([])         // intentional clear — user asked for a new chat
    lastLoadedChatId.current = null
    navigate('/')
    if (window.matchMedia('(max-width: 767px)').matches) setSidebarOpen(false)
  }

  function selectChat(chat) {
    if (chat.language) setLang(chat.language)
    // Only clear messages if switching to a genuinely different saved chat
    if (chat.id !== lastLoadedChatId.current) {
      setMessages([])
    }
    lastLoadedChatId.current = chat.id
    navigate(`/?chat=${chat.id}`)
    if (window.matchMedia('(max-width: 767px)').matches) setSidebarOpen(false)
  }

  function changeLang(nextLang) {
    setLang(nextLang)
    navigate('/')
  }

  function handleChatSaved(sessionId) {
    if (sessionId && sessionId !== activeChatId) {
      navigate(`/?chat=${sessionId}`, { replace: true })
    }
    refreshChats()
  }

  function handleChatLoaded(chat) {
    if (!chat) return
    if (chat.language) setLang(chat.language)
    lastLoadedChatId.current = chat.id || null
  }

  const userEmail = session?.user?.email || ''
  const userInitial = userEmail?.[0]?.toUpperCase() || 'U'
  const userName = userEmail.split('@')[0] || 'User'

  // Sidebar width constants
  const SIDEBAR_EXPANDED = 240
  const SIDEBAR_COLLAPSED = 64

  return (
    <div style={{ position: 'relative', display: 'flex', height: 'var(--app-height, 100dvh)', background: '#1e1f20', overflow: 'hidden', fontFamily: "'Google Sans', sans-serif" }}>

      {/* Sidebar: on mobile → overlay, on desktop → collapsible icon rail */}
      <div
        ref={sidebarRef}
        className={`
          fixed md:relative z-50
          md:translate-x-0 md:opacity-100
          ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}
        `}
        style={{
          width: sidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
          minWidth: sidebarOpen ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
          background: '#131314',
          borderRight: '1px solid #3c3c3e',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          transition: 'transform 0.22s ease, opacity 0.22s ease, width 0.22s ease, min-width 0.22s ease',
          overflow: 'hidden',
        }}
      >
        {/* Top: logo + hamburger */}
        <div style={{ padding: '14px 10px 8px', display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={() => sidebarOpen ? setSidebarOpen(false) : openSidebar()}
            style={{ width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'transparent', border: 'none', color: '#9aa0a6', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2a2b2d'; e.currentTarget.style.color = '#e3e3e3' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa0a6' }}
            title="Toggle sidebar"
          >
            {Icons.menu}
          </button>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <SparkleIcon size={20} />
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#e3e3e3', letterSpacing: '-0.2px' }}>ParikshAI</span>
            </div>
          )}
        </div>

        {/* New Chat button */}
        <div style={{ padding: '4px 10px 8px', flexShrink: 0 }}>
          <button
            onClick={startNewChat}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 12px',
              borderRadius: '10px',
              background: 'transparent',
              border: '1px solid #3c3c3e',
              color: '#e3e3e3',
              fontSize: '13px', fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.15s, border-color 0.15s',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              width: '100%',
              boxSizing: 'border-box',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2a2b2d'; e.currentTarget.style.borderColor = '#5f6368' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = '#3c3c3e' }}
            title="New chat"
          >
            {Icons.plus}
            {sidebarOpen && <span>New chat</span>}
          </button>
        </div>

        {/* Nav items */}
        <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '2px', flexShrink: 0 }}>
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={!sidebarOpen ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '9px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: isActive(item.path) ? '#2a2b2d' : 'transparent',
                color: isActive(item.path) ? '#e3e3e3' : '#9aa0a6',
                fontSize: '13px', fontWeight: '500',
                border: 'none',
                transition: 'background 0.15s, color 0.15s',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                width: '100%',
                boxSizing: 'border-box',
              }}
              onMouseEnter={e => { if (!isActive(item.path)) { e.currentTarget.style.background = '#1e1f20'; e.currentTarget.style.color = '#e3e3e3' } }}
              onMouseLeave={e => { if (!isActive(item.path)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa0a6' } }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#3c3c3e', margin: '10px 10px 6px', flexShrink: 0 }} />

        {/* Saved chats */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
          {sidebarOpen && (
            <p style={{ fontSize: '10px', fontWeight: '600', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 6px 6px', margin: 0, flexShrink: 0 }}>
              Saved Chats
            </p>
          )}
          {loadingChats && sidebarOpen && (
            <p style={{ color: '#5f6368', fontSize: '12px', padding: '6px' }}>Loading...</p>
          )}
          {!loadingChats && chatHistory.length === 0 && sidebarOpen && (
            <p style={{ color: '#5f6368', fontSize: '12px', padding: '6px', lineHeight: '1.4' }}>No saved chats yet</p>
          )}
          {!loadingChats && chatHistory.map(chat => (
            <button
              key={chat.id}
              onClick={() => selectChat(chat)}
              title={chat.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                background: activeChatId === chat.id ? '#2a2b2d' : 'transparent',
                color: activeChatId === chat.id ? '#e3e3e3' : '#9aa0a6',
                fontSize: '13px',
                fontWeight: '400',
                border: 'none',
                transition: 'background 0.15s, color 0.15s',
                width: '100%',
                textAlign: 'left',
                boxSizing: 'border-box',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
              }}
              onMouseEnter={e => { if (activeChatId !== chat.id) { e.currentTarget.style.background = '#1e1f20'; e.currentTarget.style.color = '#e3e3e3' } }}
              onMouseLeave={e => { if (activeChatId !== chat.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa0a6' } }}
            >
              <span style={{ flexShrink: 0, opacity: 0.6 }}>{Icons.chat}</span>
              {sidebarOpen && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</span>}
            </button>
          ))}
        </div>

        {/* Bottom: user → navigate to billing */}
        <div style={{ padding: '8px 8px 10px', borderTop: '1px solid #3c3c3e', flexShrink: 0 }}>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
            onClick={() => navigate('/billing')}
            onMouseEnter={e => e.currentTarget.style.background = '#1e1f20'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="View plan & billing"
          >
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8ab4f8, #c084fc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '700', fontSize: '12px', flexShrink: 0,
            }}>
              {userInitial}
            </div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#e3e3e3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{userName}</p>
                <p style={{ fontSize: '11px', color: '#5f6368', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>View plan</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="md:hidden"
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        className={`${isChatRoute ? '' : 'pt-[53px]'} md:pt-0`}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e1f20', minWidth: 0 }}
      >
        {/* Mobile Header for non-chat routes */}
        {!isChatRoute && (
          <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 p-3 bg-[#1e1f20] border-b border-[#3c3c3e]">
            <button onClick={openSidebar} className="text-[#e3e3e3] p-1">
              {Icons.menu}
            </button>
            <SparkleIcon size={18} />
            <span className="text-[#e3e3e3] font-bold text-[16px] tracking-tight">ParikshAI</span>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Chat lang={lang} onLangChange={changeLang} langs={LANGS} messages={messages} setMessages={setMessages} activeChatId={activeChatId} onChatLoaded={handleChatLoaded} onChatSaved={handleChatSaved} onStartNewChat={startNewChat} onOpenSidebar={openSidebar} menuIcon={Icons.menu} />} />
          <Route path="/mcq" element={<MCQ lang={lang} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/billing" element={<Billing session={session} />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
