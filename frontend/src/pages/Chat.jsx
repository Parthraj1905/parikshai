import { useState, useRef, useEffect } from 'react'
import { sendMessage } from '../lib/api'

export default function Chat({ exam, lang }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef()
  const inputRef = useRef()
  const textareaRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setMessages([])
  }, [exam, lang])

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
      setMessages(prev => [...prev, { role: 'model', content: e.response?.data?.detail || 'Error. Try again.' }])
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

  const langLabel = lang === 'gu' ? 'ગુજરાતી' : lang === 'hi' ? 'हिंदी' : 'English'

  const suggestions = lang === 'gu'
    ? ['GPSC ના મુખ્ય વિષયો શું છે?', 'ભારતનો ઇતિહાસ સમજાવો', 'MCQ quiz start કરો']
    : lang === 'hi'
    ? [`${exam} के मुख्य विषय क्या हैं?`, 'भारत का इतिहास बताओ', 'MCQ practice शुरू करो']
    : [`What are key topics for ${exam}?`, 'Explain Indian Constitution', 'Give me a practice quiz']

  return (
    <div className="flex flex-col h-full bg-[#f7f7f5]">
      {/* Header */}
      <div className="hidden md:flex items-center justify-between px-6 py-4 bg-[#f7f7f5]">
        <div>
          <h2 className="text-gray-900 font-bold text-sm">{exam} AI Tutor</h2>
          <p className="text-gray-400 text-xs">{langLabel} · Powered by Gemini</p>
        </div>
        <button
          onClick={() => { setMessages([]); speechSynthesis.cancel() }}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          Clear chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center pb-10">
            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white font-black text-xl mb-4">
              P
            </div>
            <h3 className="text-gray-900 font-bold text-lg mb-1">{exam} Tutor</h3>
            <p className="text-gray-400 text-sm mb-8 max-w-xs">
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
                  className="w-full text-left px-4 py-3 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-sm rounded-xl transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'model' && (
              <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 mt-0.5">
                P
              </div>
            )}
            <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-orange-600 text-white rounded-tr-sm'
                : 'bg-white text-gray-800 rounded-tl-sm'
            }`}>
              <span dangerouslySetInnerHTML={{
                __html: m.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
              }} />
            </div>
            {m.role === 'user' && (
              <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-xs font-bold shrink-0 mt-0.5">
                U
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0">P</div>
            <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm">
              <div className="flex gap-1 items-center h-4">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 md:px-6 py-4">
        <div className="flex gap-2 items-end bg-white rounded-2xl px-4 py-3">
          <button
            onClick={voiceInput}
            className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-sm transition-all ${
              listening ? 'text-red-500 animate-pulse' : 'text-gray-400 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            🎤︎︎
          </button>
          <textarea
            ref={el => { inputRef.current = el; textareaRef.current = el }}
            className="flex-1 bg-transparent text-gray-900 text-sm placeholder-gray-400 resize-none focus:outline-none max-h-32 min-h-[24px]"
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
            className="shrink-0 w-7 h-7 bg-orange-600 hover:bg-orange-700 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg flex items-center justify-center transition-all text-white text-xs font-bold"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}