import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProgress } from '../lib/api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getProgress().then(setData).catch(() => setError('Could not load progress right now.'))
  }, [])

  const wrong = data?.wrong || 0
  const total = data?.total_answered || 0
  const accuracy = data?.accuracy || 0
  const accuracyColor = accuracy >= 80 ? 'text-green-600' : accuracy >= 50 ? 'text-orange-600' : 'text-red-500'
  const barColor = accuracy >= 80 ? 'bg-green-500' : accuracy >= 50 ? 'bg-orange-600' : 'bg-red-500'

  return (
    <div className="flex-1 overflow-y-auto bg-[#f7f7f5]">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        <div className="mb-6">
          <h2 className="text-gray-900 font-bold text-base">Progress</h2>
          <p className="text-gray-400 text-xs">Your exam preparation stats</p>
        </div>

        {error && <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>}

        {!data && !error && (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Overall Accuracy</p>
                  <p className={`text-4xl font-black ${accuracyColor}`}>{accuracy}%</p>
                  <p className="text-gray-400 text-xs mt-2">{data.recommendation}</p>
                </div>
                <span className="text-4xl">{accuracy >= 80 ? '🏆' : accuracy >= 50 ? '📈' : '💪'}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${accuracy}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Answered', value: total, color: 'text-gray-900' },
                { label: 'Correct', value: data.correct, color: 'text-green-600' },
                { label: 'Wrong', value: wrong, color: 'text-red-500' },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-2xl p-4 text-center">
                  <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-gray-400 text-xs mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-5">
                <p className="text-gray-900 font-bold text-sm mb-4">Weak Topics</p>
                {data.weak_topics.length === 0
                  ? <p className="text-gray-400 text-sm">No weak topics yet.</p>
                  : data.weak_topics.map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-3 last:pb-0">
                      <div>
                        <p className="text-gray-700 text-sm font-medium">{t.topic || 'Random'}</p>
                        <p className="text-gray-400 text-xs">{t.exam}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 text-xs font-bold">{t.wrong_count} ✗</span>
                        <button onClick={() => navigate('/mcq')}
                          className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg px-2.5 py-1.5 font-semibold transition-all">
                          Practice
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>

              <div className="bg-white rounded-2xl p-5">
                <p className="text-gray-900 font-bold text-sm mb-4">Exam Focus</p>
                {data.weak_by_exam.length === 0
                  ? <p className="text-gray-400 text-sm">Practice more to see breakdown.</p>
                  : data.weak_by_exam.map(item => (
                    <div key={item.exam} className="py-3 last:pb-0">
                      <div className="flex justify-between text-sm mb-2">
                        <p className="text-gray-700 font-medium">{item.exam}</p>
                        <p className="text-red-500 font-bold text-xs">{item.wrong_count} ✗</p>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-600 rounded-full" style={{ width: `${Math.min(100, item.wrong_count * 12)}%` }} />
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5">
              <p className="text-gray-900 font-bold text-sm mb-4">Recent Attempts</p>
              {data.recent_attempts.length === 0
                ? <p className="text-gray-400 text-sm">No attempts yet.</p>
                : (
                  <div className="flex flex-wrap gap-2">
                    {data.recent_attempts.map((a, i) => (
                      <div key={a.id || i}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          a.is_correct ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                        }`}>
                        {a.is_correct ? '✓' : '✗'}
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            <button onClick={() => navigate('/mcq')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-xl font-bold transition-all">
              Start Recommended Practice →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}