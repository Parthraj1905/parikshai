import { useState, useRef, useEffect, useMemo } from 'react'
import { getChat, sendMessage } from '../lib/api'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import PaywallModal from '../components/PaywallModal'

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
          width: '7px', height: '7px', borderRadius: '50%',
          background: '#8ab4f8',
          animation: 'bounceDot 1.2s infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  )
}

const IconCopy = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const IconMic = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
const IconSend = () => <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
const IconVol = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>

// Large pool — 3 random ones are picked on each new chat render
const SUGGESTION_POOL = {
  en: [
    'Explain the Indian Constitution briefly',
    'Important topics for GK & Current Affairs',
    'How to improve my MCQ score?',
    'Differences between Rajya Sabha and Lok Sabha',
    'What are Fundamental Rights?',
    'Explain Directive Principles of State Policy',
    'How does the President of India get elected?',
    'What is the role of CAG of India?',
    'Explain Emergency provisions in the Constitution',
    'Key facts about Indian geography for exams',
    'Important environmental topics for govt exams',
    'Explain the Five-Year Plans briefly',
  ],
  hi: [
    'भारतीय संविधान की मुख्य विशेषताएं',
    'सामान्य ज्ञान की तैयारी कैसे करें?',
    'MCQ practice के लिए best topics',
    'राज्यसभा और लोकसभा में क्या अंतर है?',
    'मौलिक अधिकार क्या हैं?',
    'राष्ट्रपति चुनाव कैसे होता है?',
    'भारत की पंचवर्षीय योजनाएं',
    'CAG का क्या काम है?',
    'भारत की नदियां और पहाड़',
    'आपातकाल का संविधान में प्रावधान',
    'पर्यावरण से जुड़े मुख्य तथ्य',
    'संसद की कार्यप्रणाली समझाएं',
  ],
  gu: [
    'ભારતીય બંધારણ વિશે સમજાવો',
    'સરકારી પરીક્ષા માટે મુખ્ય વિષયો',
    'MCQ practice ક્યાંથી શરૂ કરવી?',
    'રાજ્યસભા અને લોકસભા વચ્ચે શો ફર્ક?',
    'મૂળભૂત અધિકારો શું છે?',
    'ભારતના રાષ્ટ્રપતિ કેવી રીતે ચૂંટાય છે?',
    'ભારતની નદીઓ અને પર્વતો',
    'GPSC પરીક્ષા માટે ટોચના 5 વિષયો',
    'CAG ની ભૂમિકા સમજવો',
    'ભારતના આઝાદી આંદોળની ઘટનાઓ',
    'પંચવર્ષીય યોજનાઓ વિશે સમજાવો',
    'પર્યાવરણ માટેના મુખ્ય તથ્યો',
  ],
}

const EMPTY_PROMPT = {
  en: 'Ask me anything about Government exam preparation.',
  hi: 'सरकारी परीक्षा की तैयारी के बारे में कुछ भी पूछें।',
  gu: 'સરકારી પરીક્ષા માટે કોઈ પણ સવાલ પૂછો.',
}

const PLACEHOLDER = {
  en: 'Ask ParikshAI anything...',
  hi: 'ParikshAI से पूछें...',
  gu: 'ParikshAI ને સવાલ પૂછો...',
}

// We pass a generic exam identifier so the backend still works
const EXAM = 'GENERAL'

export default function Chat({ lang, onLangChange, langs, messages, setMessages, activeChatId, onChatLoaded, onChatSaved, onStartNewChat, onOpenSidebar, menuIcon }) {
  // messages & setMessages are lifted to AppShell so they survive route changes
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [listening, setListening] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState(null)
  const [showPaywall, setShowPaywall] = useState(false)
  const bottomRef = useRef()
  const textareaRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Load a saved chat from backend when activeChatId is set.
  // Does NOT clear messages when lang changes — that caused the data loss bug.

  useEffect(() => {
    if (!activeChatId) return
    let alive = true
    async function loadSavedChat() {
      setLoadingChat(true)
      try {
        const data = await getChat(activeChatId)
        if (!alive) return
        onChatLoaded?.(data.chat)
        setMessages((data.messages || []).map(m => ({ role: m.role, content: m.content })))
      } catch (e) {
        if (!alive) return
        setMessages([{ role: 'model', content: e.response?.data?.detail || 'Could not load this chat.', error: true }])
      } finally {
        if (alive) setLoadingChat(false)
      }
    }
    loadSavedChat()
    return () => { alive = false }
  }, [activeChatId, onChatLoaded])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    if (textareaRef.current) { textareaRef.current.style.height = 'auto' }
    setLoading(true)
    try {
      const data = await sendMessage(EXAM, lang, newMessages, activeChatId)
      setMessages(prev => [...prev, { role: 'model', content: data.reply }])
      onChatSaved?.(data.session_id)
    } catch (e) {
      if (e.response?.status === 429) {
        setShowPaywall(true)
        setMessages(messages) // Revert the optimistic user message
        setInput(input) // Restore the input so they don't lose it
      } else {
        setMessages(prev => [...prev, { role: 'model', content: e.response?.data?.detail || 'Something went wrong. Please try again.', error: true }])
      }
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

  // Pick 3 random suggestions from the pool each time messages are cleared (new chat)
  const suggestions = useMemo(() => {
    const pool = SUGGESTION_POOL[lang] || SUGGESTION_POOL.en
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 3)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, messages.length === 0])
  const emptyPrompt = EMPTY_PROMPT[lang] || EMPTY_PROMPT.en
  const placeholder = PLACEHOLDER[lang] || PLACEHOLDER.en

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, background: '#1e1f20' }}>
      {/* Topbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', height: '54px',
        borderBottom: '1px solid #3c3c3e',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <button onClick={onOpenSidebar} className="md:hidden text-[#e3e3e3] p-1" style={{ flexShrink: 0 }}>
            {menuIcon}
          </button>
          <SparkleIcon size={18} />
          <span style={{ fontSize: '15px', fontWeight: '600', color: '#e3e3e3', whiteSpace: 'nowrap' }}>
            Govt. Exam AI Tutor
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Language toggle */}
          <div style={{ display: 'flex', background: '#2a2b2d', borderRadius: '8px', border: '1px solid #3c3c3e', overflow: 'hidden' }}>
            {(langs || []).map(l => (
              <button
                key={l.code}
                onClick={() => onLangChange?.(l.code)}
                title={l.full}
                style={{
                  padding: '5px 10px', fontSize: '12px', fontWeight: '600',
                  border: 'none', cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
                  background: lang === l.code ? '#3c3c3e' : 'transparent',
                  color: lang === l.code ? '#e3e3e3' : '#9aa0a6',
                  fontFamily: 'inherit',
                }}
              >
                {l.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { speechSynthesis.cancel(); onStartNewChat?.() }}
            style={{ fontSize: '12px', color: '#9aa0a6', background: 'transparent', border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: '8px', fontFamily: 'inherit' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2a2b2d'; e.currentTarget.style.color = '#e3e3e3' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa0a6' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 0', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto', padding: '0 20px' }}>

          {loadingChat && (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '20vh' }}>
              <ThinkingDots />
            </div>
          )}

          {!loadingChat && messages.length === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', animation: 'fadeIn 0.3s ease' }}>
              <SparkleIcon size={44} />
              <h2 style={{ fontSize: '26px', fontWeight: '600', color: '#e3e3e3', margin: '16px 0 8px', textAlign: 'center' }}>
                {lang === 'gu' ? 'હેલો! ✨' : lang === 'hi' ? 'नमस्ते! ✨' : 'Hello! ✨'}
              </h2>
              <p style={{ color: '#9aa0a6', fontSize: '14px', marginBottom: '28px', textAlign: 'center', maxWidth: '380px', lineHeight: '1.6' }}>
                {emptyPrompt}
              </p>
              {/* Suggestion chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '560px' }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setInput(s); textareaRef.current?.focus() }}
                    style={{
                      padding: '9px 16px', borderRadius: '20px',
                      background: '#2a2b2d', border: '1px solid #3c3c3e',
                      color: '#e3e3e3', fontSize: '13px', fontWeight: '500',
                      cursor: 'pointer', transition: 'background 0.15s', fontFamily: 'inherit',
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
              gap: '10px',
              marginBottom: '20px',
              animation: 'slideUp 0.2s ease',
            }}>
              {m.role === 'model' && (
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  <SparkleIcon size={24} />
                </div>
              )}
              <div style={{ maxWidth: m.role === 'user' ? '70%' : '85%' }}>
                <div style={{
                  padding: m.role === 'user' ? '11px 15px' : '4px 0',
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

                {m.role === 'model' && !m.error && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                    {[
                      { icon: <IconCopy />, label: copiedIdx === i ? 'Copied!' : 'Copy', action: () => copyMsg(m.content, i) },
                      { icon: <IconVol />, label: 'Read aloud', action: () => speak(m.content) },
                    ].map((btn, bi) => (
                      <button key={bi} onClick={btn.action} title={btn.label}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '4px 8px', borderRadius: '6px',
                          background: 'transparent', border: 'none',
                          color: '#5f6368', fontSize: '11px', cursor: 'pointer',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#2a2b2d'; e.currentTarget.style.color = '#e3e3e3' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#5f6368' }}
                      >
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', animation: 'fadeIn 0.2s ease' }}>
              <SparkleIcon size={24} />
              <div style={{ paddingTop: '4px' }}><ThinkingDots /></div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div style={{ padding: '10px 16px max(10px, env(safe-area-inset-bottom))', flexShrink: 0, background: '#1e1f20' }}>
        <div style={{ maxWidth: '740px', margin: '0 auto' }}>
          <div style={{
            background: '#2a2b2d',
            borderRadius: '16px',
            border: '1px solid #3c3c3e',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            overflow: 'hidden',
          }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = '#8ab4f8'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(138,180,248,0.10)' }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = '#3c3c3e'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => {
                setInput(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'
              }}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder={placeholder}
              rows={1}
              style={{
                width: '100%', padding: '14px 18px 6px',
                background: 'transparent', border: 'none', outline: 'none', resize: 'none',
                color: '#e3e3e3', fontSize: '14px', lineHeight: '1.6',
                fontFamily: 'inherit',
                maxHeight: '160px',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 10px 8px' }}>
              <button
                onClick={voiceInput}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: listening ? 'rgba(239,68,68,0.15)' : 'transparent', border: 'none',
                  color: listening ? '#f87171' : '#9aa0a6', cursor: 'pointer', transition: 'all 0.15s',
                }}
                title="Voice input"
                onMouseEnter={e => { if (!listening) { e.currentTarget.style.background = '#35363a'; e.currentTarget.style.color = '#e3e3e3' } }}
                onMouseLeave={e => { if (!listening) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9aa0a6' } }}
              >
                <IconMic />
              </button>
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                style={{
                  width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#5f6368', marginTop: '6px' }}>
            ParikshAI may make mistakes. Verify important info.
          </p>
        </div>
      </div>
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
