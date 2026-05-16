import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProgress } from '../lib/api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    getProgress().then(setData).catch(console.error)
  }, [])

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-xl">←</button>
          <h2 className="text-xl font-bold text-orange-600">Progress Dashboard</h2>
        </div>

        {!data ? <p className="text-center text-gray-400">Loading...</p> : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow text-center">
                <p className="text-3xl font-bold text-orange-500">{data.total_answered}</p>
                <p className="text-gray-500 text-sm">Total Answered</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow text-center">
                <p className="text-3xl font-bold text-green-500">{data.correct}</p>
                <p className="text-gray-500 text-sm">Correct</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow">
              <p className="font-bold text-gray-700 mb-3">Weak Topics</p>
              {data.weak_topics.length === 0
                ? <p className="text-gray-400 text-sm">No weak topics yet. Keep practicing!</p>
                : data.weak_topics.map((t, i) => (
                  <div key={i} className="flex justify-between py-2 border-b last:border-0">
                    <p className="text-sm text-gray-700">{t.topic}</p>
                    <p className="text-sm text-red-400">{t.wrong_count} wrong</p>
                  </div>
                ))
              }
            </div>
          </>
        )}
      </div>
    </div>
  )
}