import { useState, useRef, useEffect } from 'react'
import { getChat, sendMessage } from '../lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function SparkleIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <defs>
        <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8ab4f8"/>
          <stop offset="50%" stopColor="#c084fc"/>
          <stop offset="100%" stopColor="#f472b6"/>
        </linearGradient>
      </defs>
      <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5L12 2z" fill="url(#sg)"/>
    </svg>
  )
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', padding: '4px 0' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: '#8ab4f8',
          animation: 'bounceDot 1.2s infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  )
}

const IconCopy = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const IconRegen = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
const IconMic = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
const IconSend = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
const IconAdd = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
const IconVol = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>

export default function Chat({ exam, lang, activeChatId, onChatLoaded, onChatSaved, onStartNewChat, onOpenSidebar, menuIcon }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [listening, setListening] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const bottomRef = useRef()
  const textareaRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (!activeChatId) setMessages([])
  }, [exam, lang, activeChatId])

  useEffect(() => {
    if (!activeChatId) return

    let alive = true
    async function loadSavedChat() {
      setLoadingChat(true)
      try {
        const data = await getChat(activeChatId)
        if (!alive) return
        onChatLoaded?.(data.chat)
        setMessages((data.messages || []).map(m => ({
          role: m.role,
          content: m.content,
        })))
      } catch (e) {
        if (!alive) return
        setMessages([{ role: 'model', content: e.response?.data?.detail || 'Could not load this chat.', error: true }])
      } finally {
        if (alive) setLoadingChat(false)
      }
    }

    loadSavedChat()
    return () => { alive = false }
  }, [activeChatId])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    setLoading(true)
    try {
      const data = await sendMessage(exam, lang, newMessages, activeChatId)
      setMessages(prev => [...prev, { role: 'model', content: data.reply }])
      onChatSaved?.(data.session_id)
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', content: e.response?.data?.detail || 'Something went wrong. Please try again.', error: true }])
    }
    setLoading(false)
  }

  function voiceInput() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const r = new SR()
    r.lang = lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-US'
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = e => { setInput(e.results[0][0].transcript); textareaRef.current?.focus() }
    r.start()
  }

  async function copyMsg(content, idx) {
    await navigator.clipboard.writeText(content).catch(() => {})
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  function speak(content) {
    const u = new SpeechSynthesisUtterance(content)
    u.lang = lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-US'
    speechSynthesis.speak(u)
  }

  const langLabel = lang === 'gu' ? 'ગુજરાતી' : lang === 'hi' ? 'हिंदी' : 'English'

  const suggestions = lang === 'gu'
    ? ['GPSC ના મુખ્ય વિષયો શું છે?', 'ભારતનો ઇતિહાસ સમજાવો', 'MCQ quiz start કરો']
    : lang === 'hi'
    ? [`${exam} के मुख्य विषय क्या हैं?`, 'भारत का इतिहास बताओ', 'MCQ practice शुरू करो']
    : [`What are key topics for ${exam}?`, 'Explain Indian Constitution', 'Start a practice quiz']

  const emptyPrompt = lang === 'gu'
    ? `${exam} પરીક્ષા માટે કોઈ પણ સવાલ પૂછો.`
    : lang === 'hi'
    ? `${exam} परीक्षा के बारे में कुछ भी पूछें।`
    : `Ask me anything about ${exam} exam preparation.`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: '#1e1f20' }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', height: '56px',
        borderBottom: '1px solid #3c3c3e',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <button onClick={onOpenSidebar} className="md:hidden text-[#e3e3e3] p-1" style={{ flexShrink: 0 }}>
            {menuIcon}
          </button>
          <SparkleIcon size={20} />
          <span style={{ fontSize: '16px', fontWeight: '600', color: '#e3e3e3', whiteSpace: 'nowrap' }}>{exam} AI Tutor</span>
          <span className="hidden sm:inline-flex" style={{ fontSize: '12px', color: '#5f6368', background: '#2a2b2d', padding: '3px 10px', borderRadius: '100px', border: '1px solid #3c3c3e', whiteSpace: 'nowrap' }}>
            {langLabel} · Gemini
          </span>
        </div>
        <button
          onClick={() => { setMessages([]); speechSynthesis.cancel(); onStartNewChat?.() }}
          style={{ fontSize: '13px', color: '#9aa0a6', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 12px', borderRadius: '100px' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#35363a'; e.currentTarget.style.color = '#e3e3e3' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa0a6' }}
        >
          Clear chat
        </button>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 0', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto', padding: '0 24px' }}>

          {/* Empty state */}
          {loadingChat && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '20vh' }}>
              <ThinkingDots />
            </div>
          )}

          {!loadingChat && messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', animation: 'fadeIn 0.3s ease' }}>
              <SparkleIcon size={48} />
              <h2 style={{ fontSize: '28px', fontWeight: '600', color: '#e3e3e3', margin: '16px 0 8px', textAlign: 'center' }}>
                {lang === 'gu' ? 'હેલો! ✨' : lang === 'hi' ? 'नमस्ते! ✨' : 'Hello! ✨'}
              </h2>
              <p style={{ color: '#9aa0a6', fontSize: '15px', marginBottom: '32px', textAlign: 'center', maxWidth: '400px', lineHeight: '1.5' }}>
                {emptyPrompt}
              </p>
              {/* Suggestion chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '580px' }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); textareaRef.current?.focus() }}
                    style={{
                      padding: '10px 18px', borderRadius: '100px',
                      background: '#2a2b2d', border: '1px solid #3c3c3e',
                      color: '#e3e3e3', fontSize: '13px', fontWeight: '500',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#35363a'}
                    onMouseLeave={e => e.currentTarget.style.background = '#2a2b2d'}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {!loadingChat && messages.map((m, i) => (
            <div key={i} style={{
              display: 'flex',
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
              gap: '12px',
              marginBottom: '20px',
              animation: 'slideUp 0.2s ease',
            }}>
              {/* Avatar */}
              {m.role === 'model' && (
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  <SparkleIcon size={28} />
                </div>
              )}

              <div style={{ maxWidth: m.role === 'user' ? '70%' : '85%' }}>
                {/* Bubble */}
                <div style={{
                  padding: m.role === 'user' ? '12px 16px' : '4px 0',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '0',
                  background: m.role === 'user' ? '#2a2b2d' : 'transparent',
                  color: m.error ? '#f87171' : '#e3e3e3',
                  fontSize: '14px', lineHeight: '1.65',
                }}>
                  {m.role === 'model' ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({children}) => <p style={{ margin: '0 0 8px', color: '#e3e3e3' }}>{children}</p>,
                        strong: ({children}) => <strong style={{ color: '#fff', fontWeight: '600' }}>{children}</strong>,
                        code: ({children, className}) => className
                          ? <pre style={{ background: '#2a2b2d', padding: '12px', borderRadius: '8px', overflowX: 'auto', margin: '8px 0', fontSize: '13px' }}><code style={{ color: '#8ab4f8' }}>{children}</code></pre>
                          : <code style={{ background: '#2a2b2d', padding: '2px 6px', borderRadius: '4px', color: '#8ab4f8', fontSize: '13px' }}>{children}</code>,
                        ul: ({children}) => <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>{children}</ul>,
                        ol: ({children}) => <ol style={{ paddingLeft: '20px', margin: '4px 0' }}>{children}</ol>,
                        li: ({children}) => <li style={{ color: '#e3e3e3', marginBottom: '4px' }}>{children}</li>,
                        h1: ({children}) => <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', margin: '12px 0 6px' }}>{children}</h1>,
                        h2: ({children}) => <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '600', margin: '10px 0 4px' }}>{children}</h2>,
                        h3: ({children}) => <h3 style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '600', margin: '8px 0 4px' }}>{children}</h3>,
                      }}
                    >
                      {m.content}
                    </ReactMarkdown>
                  ) : m.content}
                </div>

                {/* AI action row */}
                {m.role === 'model' && !m.error && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    {[
                      { icon: <IconCopy />, label: copiedIdx === i ? 'Copied!' : 'Copy', action: () => copyMsg(m.content, i) },
                      { icon: <IconVol />, label: 'Read aloud', action: () => speak(m.content) },
                    ].map((btn, bi) => (
                      <button key={bi} onClick={btn.action}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '5px 10px', borderRadius: '100px',
                          background: 'transparent', border: 'none',
                          color: '#9aa0a6', fontSize: '12px', cursor: 'pointer',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#35363a'; e.currentTarget.style.color = '#e3e3e3' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa0a6' }}
                      >
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', animation: 'fadeIn 0.2s ease' }}>
              <SparkleIcon size={28} />
              <div style={{ paddingTop: '4px' }}><ThinkingDots /></div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area - Gemini style */}
      <div style={{ padding: '12px 16px max(12px, env(safe-area-inset-bottom))', flexShrink: 0, background: '#1e1f20' }}>
        <div style={{ maxWidth: '768px', margin: '0 auto' }}>
          <div style={{
            background: '#2a2b2d',
            borderRadius: '24px',
            border: '1px solid #3c3c3e',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            overflow: 'hidden',
          }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = '#8ab4f8'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(138,180,248,0.12)' }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = '#3c3c3e'; e.currentTarget.style.boxShadow = 'none' }}
          >
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={lang === 'gu' ? 'ParikshAI ને સવાલ પૂછો...' : lang === 'hi' ? 'ParikshAI से पूछें...' : `Ask ${exam} AI Tutor...`}
              rows={1}
              style={{
                width: '100%', padding: '16px 20px 8px',
                background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                color: '#e3e3e3', fontSize: '14px', lineHeight: '1.6',
                fontFamily: 'inherit',
                maxHeight: '160px',
                boxSizing: 'border-box',
              }}
            />
            {/* Bottom toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 10px' }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={voiceInput}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: listening ? 'rgba(239,68,68,0.15)' : 'transparent', border: 'none',
                    color: listening ? '#f87171' : '#9aa0a6', cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  title="Voice input"
                  onMouseEnter={e => { if (!listening) { e.currentTarget.style.background = '#35363a'; e.currentTarget.style.color = '#e3e3e3' } }}
                  onMouseLeave={e => { if (!listening) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa0a6' } }}
                >
                  <IconMic />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: '#5f6368' }}>Shift+Enter for new line</span>
                <button
                  onClick={send}
                  disabled={!input.trim() || loading}
                  style={{
                    width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: input.trim() && !loading ? '#8ab4f8' : '#3c3c3e',
                    border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                    color: input.trim() && !loading ? '#1e1f20' : '#5f6368',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  title="Send"
                >
                  <IconSend />
                </button>
              </div>
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#5f6368', marginTop: '8px' }}>
            ParikshAI may make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  )
}
