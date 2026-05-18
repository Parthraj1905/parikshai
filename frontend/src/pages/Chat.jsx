import { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../lib/api'

export default function Chat({ exam, lang }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [typingProgress, setTypingProgress] = useState(0)
  const bottomRef = useRef()
  const inputRef = useRef()
  const textareaRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    setMessages([])
  }, [exam, lang])

  // Typing indicator animation
  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setTypingProgress(prev => (prev >= 100 ? 0 : prev + 10))
      }, 100)
      return () => clearInterval(interval)
    } else {
      setTypingProgress(0)
    }
  }, [loading])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    try {
      const reply = await sendMessage(exam, lang, newMessages)
      setMessages(prev => [...prev, { role: 'model', content: reply }])
      const utterance = new SpeechSynthesisUtterance(reply)
      utterance.lang = lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-US'
      speechSynthesis.speak(utterance)
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', content: e.response?.data?.detail || 'Error. Try again.', error: true }])
    }
    setLoading(false)
  }

  function voiceInput() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    const recognition = new SR()
    recognition.lang = lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-US'
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onresult = e => {
      setInput(e.results[0][0].transcript)
      inputRef.current?.focus()
    }
    recognition.start()
  }

  async function copyMessage(content) {
    try {
      await navigator.clipboard.writeText(content)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  function regenerateMessage(index) {
    if (index < 0 || index >= messages.length) return
    // Remove the AI message at index and send a new request
    const prevMessages = messages.slice(0, index)
    const userMessages = prevMessages.filter(m => m.role === 'user')
    if (userMessages.length === 0) return
    
    const lastUserMsg = userMessages[userMessages.length - 1].content
    setLoading(true)
    sendMessage(exam, lang, [...prevMessages.filter(m => m.role === 'user'), { role: 'user', content: lastUserMsg }])
      .then(reply => {
        setMessages(prev => {
          const newMsgs = [...prev]
          newMsgs[index] = { role: 'model', content: reply }
          return newMsgs
        })
      })
      .catch(() => {
        setMessages(prev => {
          const newMsgs = [...prev]
          newMsgs[index] = { role: 'model', content: 'Error. Try again.', error: true }
          return newMsgs
        })
      })
      .finally(() => setLoading(false))
  }

  const langLabel = lang === 'gu' ? 'ગુજરાતી' : lang === 'hi' ? 'हिंदी' : 'English'

  const suggestions = lang === 'gu'
    ? ['GPSC ના મુખ્ય વિષયો શું છે?', 'ભારતનો ઇતિહાસ સમજાવો', 'MCQ quiz start કરો']
    : lang === 'hi'
    ? [`${exam} के मुख्य विषय क्या हैं?`, 'भारत का इतिहास बताओ', 'MCQ practice शुरू करो']
    : [`What are key topics for ${exam}?`, 'Explain Indian Constitution', 'Give me a practice quiz']

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-[#121212]">
      {/* Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 bg-white dark:bg-[#1a1a1a] border-b border-gray-100 dark:border-gray-800">
        <div>
          <h2 className="text-gray-900 dark:text-gray-100 font-bold text-sm">{exam} AI Tutor</h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs">{langLabel} · Powered by Gemini</p>
        </div>
        <button
          onClick={() => { setMessages([]); speechSynthesis.cancel() }}
          className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 12H5"/><path d="M19 18H5"/>
          </svg>
          Clear chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-10 animate-fade-in">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl mb-4 shadow-lg shadow-orange-500/20">
              P
            </div>
            <h3 className="text-gray-900 dark:text-gray-100 font-bold text-lg mb-1">{exam} Tutor</h3>
            <p className="text-gray-400 dark:text-gray-500 text-sm mb-8 max-w-xs">
              {lang === 'gu'
                ? `${exam} પરીક્ષા માટે કોઈ પણ સવાલ પૂછો.`
                : lang === 'hi'
                ? `${exam} परीक्षा के बारे में कुछ भी पूछें।`
                : `Ask me anything about ${exam} exam preparation.`}
            </p>
            <div className="space-y-2 w-full max-w-sm">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(s); inputRef.current?.focus() }}
                  className="w-full text-left px-4 py-3 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#262626] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm rounded-xl transition-all border border-gray-100 dark:border-gray-800 hover:border-orange-200 dark:hover:border-orange-800 hover:shadow-sm"
                >
                  <span className="text-orange-500 mr-2">→</span>{s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
            {m.role === 'model' && (
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5 shadow-sm">
                P
              </div>
            )}
              <div className={`max-w-[78%] ${m.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-orange-600 text-white rounded-tr-sm shadow-sm'
                    : m.error
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-tl-sm border border-red-100 dark:border-red-800'
                    : 'bg-white dark:bg-[#1a1a1a] text-gray-800 dark:text-gray-200 rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-800'
                }`}>
                <span dangerouslySetInnerHTML={{
                  __html: m.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br/>')
                }} />
              </div>
              {/* Message actions for AI responses */}
              {m.role === 'model' && !m.error && (
                <div className="flex items-center gap-2 mt-1.5 ml-1">
                  <button
                    onClick={() => copyMessage(m.content)}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    title="Copy message"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => regenerateMessage(i)}
                    disabled={loading}
                    className="text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                    title="Regenerate response"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-bold shrink-0 mt-0.5">
                {sessionStorage.getItem('userInitial') || 'U'}
              </div>
            )}
          </div>
        ))}

        {loading && messages.filter(m => m.role === 'model').length === messages.filter(m => m.role === 'user').length && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 shadow-sm">P</div>
            <div className="bg-white dark:bg-[#1a1a1a] px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex gap-1.5 items-center h-5">
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-0.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden w-24">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-100" 
                  style={{ width: `${typingProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 py-4">
        <div className="flex gap-2 items-end bg-white dark:bg-[#1a1a1a] rounded-2xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-800">
          <button
            onClick={voiceInput}
            className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl text-sm transition-all ${
              listening ? 'bg-red-50 dark:bg-red-900/20 text-red-500 animate-pulse' : 'text-gray-400 dark:text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
            }`}
            title="Voice input"
          >
            🎤
          </button>
          <textarea
            ref={el => { inputRef.current = el; textareaRef.current = el }}
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none max-h-32 min-h-[24px] py-2"
            placeholder={lang === 'gu' ? 'સવાલ લખો...' : lang === 'hi' ? 'सवाल लिखें...' : 'Ask a question...'}
            value={input}
            rows={1}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="shrink-0 w-9 h-9 bg-orange-600 hover:bg-orange-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center transition-all text-white text-sm font-bold shadow-sm hover:shadow-md"
            title="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}