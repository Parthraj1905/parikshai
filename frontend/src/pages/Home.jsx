import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const EXAMS = ['GPSC', 'SSC', 'RRB', 'UPSC']

export default function Home() {
  const [exam, setExam] = useState('GPSC')
  const [lang, setLang] = useState('gu')
  const navigate = useNavigate()

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-orange-600">ParikshAI</h1>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-500">Logout</button>
        </div>

        <p className="text-gray-600 mb-4 font-medium">પરીક્ષા પસંદ કરો</p>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {EXAMS.map(e => (
            <button
              key={e}
              onClick={() => setExam(e)}
              className={`py-4 rounded-xl font-bold text-lg border-2 transition-all ${
                exam === e
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <p className="text-gray-600 mb-4 font-medium">ભાષા પસંદ કરો</p>
        <div className="flex gap-3 mb-8">
          {[['gu','ગુજરાતી'], ['hi','हिंदी'], ['en','English']].map(([code, label]) => (
            <button
              key={code}
              onClick={() => setLang(code)}
              className={`flex-1 py-3 rounded-xl font-semibold border-2 transition-all ${
                lang === code
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/chat', { state: { exam, lang } })}
          className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600"
        >
          AI સાથે ભણો →
        </button>

        <button
          onClick={() => navigate('/mcq', { state: { exam, lang } })}
          className="w-full mt-3 bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600"
        >
          MCQ Practice →
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full mt-3 bg-white text-orange-500 py-4 rounded-xl font-bold text-lg border-2 border-orange-300 hover:bg-orange-50"
        >
          Progress જુઓ
        </button>
      </div>
    </div>
  )
}
