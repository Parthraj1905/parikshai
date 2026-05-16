import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProgress } from '../lib/api'

function accuracyTone(accuracy) {
  if (accuracy >= 80) return 'text-green-600'
  if (accuracy >= 50) return 'text-orange-600'
  return 'text-red-500'
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getProgress()
      .then(setData)
      .catch(() => setError('Could not load progress right now.'))
  }, [])

  const wrong = data?.wrong || 0
  const total = data?.total_answered || 0
  const accuracy = data?.accuracy || 0

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/')} className="text-xl">←</button>
          <h2 className="text-xl font-bold text-orange-600">Progress Dashboard</h2>
        </div>

        {error && <p className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">{error}</p>}

        {!data ? <p className="text-center text-gray-400">Loading...</p> : (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Overall Accuracy</p>
                  <p className={`text-5xl font-bold mt-1 ${accuracyTone(accuracy)}`}>{accuracy}%</p>
                  <p className="text-sm text-gray-500 mt-2">{data.recommendation}</p>
                </div>

                <div className="w-full md:w-72">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
                    <span>{data.correct} correct</span>
                    <span>{wrong} wrong</span>
                  </div>
                  <div className="h-4 bg-red-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white rounded-2xl p-4 shadow text-center">
                <p className="text-3xl font-bold text-orange-500">{total}</p>
                <p className="text-gray-500 text-sm">Answered</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow text-center">
                <p className="text-3xl font-bold text-green-500">{data.correct}</p>
                <p className="text-gray-500 text-sm">Correct</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow text-center">
                <p className="text-3xl font-bold text-red-400">{wrong}</p>
                <p className="text-gray-500 text-sm">Wrong</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl p-4 shadow">
                <p className="font-bold text-gray-700 mb-3">Weak Topics</p>
                {data.weak_topics.length === 0
                  ? <p className="text-gray-400 text-sm">No weak topics yet. Keep practicing!</p>
                  : data.weak_topics.map((t, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 py-3 border-b last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{t.topic || 'Random'}</p>
                        <p className="text-xs text-gray-400">{t.exam || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm font-bold text-red-400">{t.wrong_count} wrong</p>
                        <button
                          onClick={() => navigate('/mcq', { state: { exam: t.exam || 'GPSC', lang: 'gu', topic: t.topic || 'Random' } })}
                          className="text-xs font-bold text-orange-600 border border-orange-200 rounded-lg px-3 py-2 hover:bg-orange-50"
                        >
                          Practice
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>

              <div className="bg-white rounded-2xl p-4 shadow">
                <p className="font-bold text-gray-700 mb-3">Exam Focus</p>
                {data.weak_by_exam.length === 0
                  ? <p className="text-gray-400 text-sm">Weak exam areas will appear after wrong answers.</p>
                  : data.weak_by_exam.map(item => (
                    <div key={item.exam} className="py-3 border-b last:border-0">
                      <div className="flex justify-between text-sm mb-2">
                        <p className="font-semibold text-gray-700">{item.exam}</p>
                        <p className="text-red-400 font-bold">{item.wrong_count} wrong</p>
                      </div>
                      <div className="h-2 bg-orange-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full"
                          style={{ width: `${Math.min(100, item.wrong_count * 12)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">{item.topics} weak topic{item.topics === 1 ? '' : 's'}</p>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-white rounded-2xl p-4 shadow">
                <p className="font-bold text-gray-700 mb-3">Recent Attempts</p>
                {data.recent_attempts.length === 0
                  ? <p className="text-gray-400 text-sm">No attempts yet.</p>
                  : data.recent_attempts.map((attempt, i) => (
                    <div key={attempt.id || i} className="flex justify-between py-2 border-b last:border-0">
                      <p className="text-sm text-gray-600">Attempt {data.recent_attempts.length - i}</p>
                      <p className={`text-sm font-bold ${attempt.is_correct ? 'text-green-500' : 'text-red-400'}`}>
                        {attempt.is_correct ? 'Correct' : 'Wrong'}
                      </p>
                    </div>
                  ))
                }
              </div>

              <div className="bg-white rounded-2xl p-4 shadow">
                <p className="font-bold text-gray-700 mb-3">Practice Plan</p>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>1. Warm up with 10 random MCQs.</p>
                  <p>2. Practice your top weak topic.</p>
                  <p>3. Return to random practice and aim for 80% accuracy.</p>
                </div>
                <button
                  onClick={() => navigate('/mcq', { state: { exam: data.weak_topics[0]?.exam || 'GPSC', lang: 'gu', topic: data.weak_topics[0]?.topic || 'Random' } })}
                  className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600"
                >
                  Start Recommended Practice
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
