import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { sendMessage } from '../lib/api'

export default function Chat() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { exam, lang } = state || { exam: 'GPSC', lang: 'gu' }

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim()) return
    const userMsg = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
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
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
    recognition.lang = lang === 'gu' ? 'gu-IN' : lang === 'hi' ? 'hi-IN' : 'en-US'
    recognition.onresult = e => setInput(e.results[0][0].transcript)
    recognition.start()
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b border-gray-100 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black transition-colors">←</button>
          <div>
            <p className="font-bold text-sm text-gray-900">{exam} Tutor</p>
            <p className="text-xs text-gray-500">{lang === 'gu' ? 'ગુજરાતી' : lang === 'hi' ? 'हिंदी' : 'English'}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-10 text-sm">How can I help you prepare?</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-black text-white rounded-br-sm'
                : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm'
            }`}>
              <span dangerouslySetInnerHTML={{ 
                __html: m.content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br/>')
              }} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-sm shadow-sm text-gray-400 text-sm">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
        <button onClick={voiceInput} className="bg-gray-50 p-3 rounded-xl text-gray-500 hover:text-black transition-colors">🎤</button>
        <input
          className="flex-1 border border-gray-200 rounded-xl px-4 text-sm outline-none transition-all"
          placeholder="Ask a question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="bg-black text-white px-5 py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">→</button>
      </div>
    </div>
  )
}