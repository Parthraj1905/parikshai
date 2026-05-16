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

      // TTS
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
    <div className="flex flex-col h-screen bg-orange-50">
      <div className="bg-orange-500 text-white p-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-xl">←</button>
        <div>
          <p className="font-bold">{exam} Tutor</p>
          <p className="text-xs opacity-80">{lang === 'gu' ? 'ગુજરાતી' : lang === 'hi' ? 'हिंदी' : 'English'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 mt-10">કોઈ પણ સવાલ પૂછો...</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              m.role === 'user'
                ? 'bg-orange-500 text-white rounded-br-none'
                : 'bg-white text-gray-800 shadow rounded-bl-none'
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
            <div className="bg-white p-3 rounded-2xl shadow text-gray-400 text-sm">વિચારી રહ્યો છું...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-white border-t flex gap-2">
        <button onClick={voiceInput} className="bg-orange-100 p-3 rounded-xl text-orange-600 text-lg">🎤</button>
        <input
          className="flex-1 border rounded-xl px-4 focus:outline-orange-400"
          placeholder="સવાલ લખો..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={send} className="bg-orange-500 text-white px-4 py-3 rounded-xl font-bold">→</button>
      </div>
    </div>
  )
}