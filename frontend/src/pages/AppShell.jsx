import { useState, useRef, useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useToast } from '../lib/ToastContext'
import { listChats } from '../lib/api'
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

// Gemini-style SVG icons
const Icons = {
  menu: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  edit: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  chat: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  mcq: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
  progress: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  settings: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  sun: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  logout: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
}

function SparkleIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8"/>
          <stop offset="50%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#f472b6"/>
        </linearGradient>
      </defs>
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" fill="url(#g1)"/>
    </svg>
  )
}

export default function AppShell({ session }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarVisible, setSidebarVisible] = useState(true)
  const [exam, setExam] = useState('GPSC')
  const [lang, setLang] = useState('gu')
  const [showExamMenu, setShowExamMenu] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
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

  async function refreshChats() {
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
  }

  useEffect(() => {
    refreshChats()
  }, [])

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

  const navItems = [
    { path: '/', label: 'Chat', icon: Icons.chat },
    { path: '/mcq', label: 'MCQ Practice', icon: Icons.mcq },
    { path: '/dashboard', label: 'Progress', icon: Icons.progress },
    { path: '/settings', label: 'Settings', icon: Icons.settings },
  ]

  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  const isChatRoute = location.pathname === '/'
  const selectedChatId = new URLSearchParams(location.search).get('chat')

  useEffect(() => {
    setActiveChatId(selectedChatId)
  }, [selectedChatId])

  function startNewChat() {
    setActiveChatId(null)
    navigate('/')
    if (window.matchMedia('(max-width: 767px)').matches) setSidebarOpen(false)
  }

  function selectChat(chat) {
    setActiveChatId(chat.id)
    setExam(chat.exam)
    setLang(chat.language)
    navigate(`/?chat=${chat.id}`)
    if (window.matchMedia('(max-width: 767px)').matches) setSidebarOpen(false)
  }

  function changeExam(nextExam) {
    setExam(nextExam)
    setActiveChatId(null)
    navigate('/')
  }

  function changeLang(nextLang) {
    setLang(nextLang)
    setActiveChatId(null)
    navigate('/')
  }

  function handleChatSaved(sessionId) {
    if (sessionId && sessionId !== activeChatId) {
      setActiveChatId(sessionId)
      navigate(`/?chat=${sessionId}`, { replace: true })
    }
    refreshChats()
  }

  function handleChatLoaded(chat) {
    if (!chat) return
    setExam(chat.exam)
    setLang(chat.language)
  }

  const userEmail = session?.user?.email || ''
  const userInitial = userEmail?.[0]?.toUpperCase() || 'U'
  const userName = userEmail.split('@')[0] || 'User'

  return (
    <div style={{ position: 'relative', display: 'flex', height: 'var(--app-height, 100dvh)', background: '#1e1f20', overflow: 'hidden', fontFamily: "'Google Sans', sans-serif" }}>

      {/* Sidebar */}
      <div ref={sidebarRef} className={`absolute md:relative z-50 transition-[transform,opacity,width,min-width] duration-200 ease-out ${sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 md:translate-x-0 md:opacity-100'} ${!sidebarOpen && !sidebarVisible ? '!hidden md:!flex' : ''}`}
      style={{
        width: sidebarOpen ? '256px' : '72px',
        minWidth: sidebarOpen ? '256px' : '72px',
        background: '#131314',
        borderRight: '1px solid #3c3c3e',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        transition: 'transform 0.2s ease, opacity 0.2s ease, width 0.2s ease, min-width 0.2s ease',
        overflow: 'hidden',
      }}>
        {/* Sidebar top */}
        <div style={{ padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {/* Hamburger + Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', marginBottom: '4px' }}>
            <button
              onClick={() => sidebarOpen ? setSidebarOpen(false) : openSidebar()}
              style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'transparent', border: 'none', color: '#e3e3e3', cursor: 'pointer', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.background = '#35363a'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {Icons.menu}
            </button>
            {sidebarOpen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SparkleIcon size={22} />
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#e3e3e3', letterSpacing: '-0.3px' }}>ParikshAI</span>
              </div>
            )}
          </div>

          {/* New Chat button */}
          <button
            onClick={startNewChat}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: sidebarOpen ? '10px 14px' : '10px',
              borderRadius: '100px',
              background: '#2a2b2d',
              border: '1px solid #3c3c3e',
              color: '#e3e3e3',
              fontSize: '14px', fontWeight: '500',
              cursor: 'pointer',
              transition: 'background 0.15s',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
              margin: '0 4px',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#35363a'}
            onMouseLeave={e => e.currentTarget.style.background = '#2a2b2d'}
          >
            {Icons.plus}
            {sidebarOpen && <span>New chat</span>}
          </button>
        </div>

        {/* Exam & Lang selectors - only when expanded */}
        {sidebarOpen && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid #3c3c3e' }}>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Exam</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '10px' }}>
              {EXAMS.map(e => (
                <button key={e} onClick={() => changeExam(e)} style={{
                  padding: '6px 10px', borderRadius: '100px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                  background: exam === e ? 'rgba(138,180,248,0.15)' : 'transparent',
                  color: exam === e ? '#8ab4f8' : '#9aa0a6',
                  outline: exam === e ? '1px solid rgba(138,180,248,0.4)' : '1px solid transparent',
                }}>
                  {e}
                </button>
              ))}
            </div>
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Language</p>
            <div style={{ display: 'flex', gap: '4px' }}>
              {LANGS.map(l => (
                <button key={l.code} onClick={() => changeLang(l.code)} title={l.full} style={{
                  flex: 1, padding: '6px 0', borderRadius: '100px', fontSize: '12px', fontWeight: '600',
                  cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                  background: lang === l.code ? 'rgba(138,180,248,0.15)' : 'transparent',
                  color: lang === l.code ? '#8ab4f8' : '#9aa0a6',
                  outline: lang === l.code ? '1px solid rgba(138,180,248,0.4)' : '1px solid transparent',
                }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nav items */}
        <div style={{ flex: 1, padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {sidebarOpen && (
            <p style={{ fontSize: '11px', fontWeight: '600', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '8px 8px 4px' }}>Recent</p>
          )}
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={!sidebarOpen ? item.label : undefined}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px',
                paddingLeft: sidebarOpen ? '12px' : '10px',
                borderRadius: '100px',
                cursor: 'pointer',
                background: isActive(item.path) ? '#35363a' : 'transparent',
                color: isActive(item.path) ? '#e3e3e3' : '#9aa0a6',
                fontSize: '14px', fontWeight: '500',
                border: 'none',
                transition: 'background 0.15s',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                margin: '0 0px',
                width: '100%',
              }}
              onMouseEnter={e => { if (!isActive(item.path)) e.currentTarget.style.background = '#35363a' }}
              onMouseLeave={e => { if (!isActive(item.path)) e.currentTarget.style.background = 'transparent' }}
            >
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </button>
          ))}

          {sidebarOpen && (
            <>
              <p style={{ fontSize: '11px', fontWeight: '600', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '14px 8px 4px' }}>Saved chats</p>
              {loadingChats && (
                <p style={{ color: '#5f6368', fontSize: '12px', padding: '6px 12px' }}>Loading...</p>
              )}
              {!loadingChats && chatHistory.length === 0 && (
                <p style={{ color: '#5f6368', fontSize: '12px', padding: '6px 12px', lineHeight: '1.4' }}>No saved chats yet</p>
              )}
              {!loadingChats && chatHistory.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  title={chat.title}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '9px 12px',
                    borderRadius: '100px',
                    cursor: 'pointer',
                    background: activeChatId === chat.id ? '#35363a' : 'transparent',
                    color: activeChatId === chat.id ? '#e3e3e3' : '#9aa0a6',
                    fontSize: '13px',
                    fontWeight: '500',
                    border: 'none',
                    transition: 'background 0.15s',
                    width: '100%',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = '#35363a' }}
                  onMouseLeave={e => { if (activeChatId !== chat.id) e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ flexShrink: 0 }}>{Icons.chat}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.title}</span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Bottom: theme + user */}
        <div style={{ padding: '8px', borderTop: '1px solid #3c3c3e' }}>
          {/* User profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
            onClick={logout}
            onMouseEnter={e => e.currentTarget.style.background = '#35363a'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            title="Sign out"
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #8ab4f8, #c084fc)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: '700', fontSize: '13px', flexShrink: 0,
            }}>
              {userInitial}
            </div>
            {sidebarOpen && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: '500', color: '#e3e3e3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</p>
                <p style={{ fontSize: '11px', color: '#5f6368', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className={`${isChatRoute ? '' : 'pt-[53px]'} md:pt-0`}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#1e1f20' }}>
        {/* Mobile Header */}
        {!isChatRoute && (
          <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-3 p-3 bg-[#1e1f20] border-b border-[#3c3c3e]">
            <button onClick={openSidebar} className="text-[#e3e3e3] p-1">
              {Icons.menu}
            </button>
            <span className="text-[#e3e3e3] font-bold text-[18px] tracking-tight">ParikshAI</span>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Chat exam={exam} lang={lang} activeChatId={activeChatId} onChatLoaded={handleChatLoaded} onChatSaved={handleChatSaved} onStartNewChat={startNewChat} onOpenSidebar={openSidebar} menuIcon={Icons.menu} />} />
          <Route path="/mcq" element={<MCQ exam={exam} lang={lang} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
