import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const EXAMS = ['GPSC', 'SSC', 'RRB', 'UPSC']

export default function Home() {
  const [exam, setExam] = useState(localStorage.getItem('parikshai_exam') || 'GPSC')
  const [lang, setLang] = useState(localStorage.getItem('parikshai_lang') || 'gu')

  useEffect(() => {
    localStorage.setItem('parikshai_exam', exam)
  }, [exam])

  useEffect(() => {
    localStorage.setItem('parikshai_lang', lang)
  }, [lang])
  const navigate = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen p-6 flex flex-col items-center">
      <div className="w-full max-w-md mt-4">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-xl font-bold text-gray-900">ParikshAI</h1>
          <button onClick={logout} className="text-xs text-gray-500 hover:text-black transition-colors">Logout</button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <p className="text-sm text-gray-900 font-medium mb-3">Select Exam</p>
          <div className="grid grid-cols-2 gap-2">
            {EXAMS.map(e => (
              <button
                key={e}
                onClick={() => setExam(e)}
                className={`py-3 rounded-lg text-sm font-medium border transition-all ${
                  exam === e
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
          <p className="text-sm text-gray-900 font-medium mb-3">Select Language</p>
          <div className="flex gap-2">
            {[['gu','ગુજરાતી'], ['hi','हिंदी'], ['en','English']].map(([code, label]) => (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`flex-1 py-3 rounded-lg text-sm font-medium border transition-all ${
                  lang === code
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/chat', { state: { exam, lang } })}
            className="w-full bg-black text-white py-4 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex justify-between px-6 items-center"
          >
            <span>AI Tutor</span>
            <span>→</span>
          </button>

          <button
            onClick={() => navigate('/mcq', { state: { exam, lang } })}
            className="w-full bg-white text-gray-900 py-4 rounded-xl text-sm font-medium border border-gray-200 hover:border-gray-300 transition-all flex justify-between px-6 items-center shadow-sm"
          >
            <span>MCQ Practice</span>
            <span>→</span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-white text-gray-900 py-4 rounded-xl text-sm font-medium border border-gray-200 hover:border-gray-300 transition-all flex justify-between px-6 items-center shadow-sm"
          >
            <span>Progress Dashboard</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}