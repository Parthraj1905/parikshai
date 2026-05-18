import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProgress } from '../lib/api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getProgress()
      .then(setData)
      .catch(() => setError('Could not load progress data.'))
  }, [])

  const wrong = data?.wrong || 0
  const total = data?.total_answered || 0
  const accuracy = data?.accuracy || 0

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto mt-4">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black transition-colors">←</button>
          <h2 className="text-lg font-bold text-gray-900">Analytics</h2>
        </div>

        {error && <p className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-sm mb-6">{error}</p>}

        {!data ? <p className="text-center text-sm text-gray-400 mt-20">Retrieving metrics...</p> : (
          <div className="space-y-6">
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Global Accuracy</p>
                  <p className="text-6xl font-bold text-gray-900 tracking-tight">{accuracy}%</p>
                  <p className="text-sm text-gray-500 mt-3">{data.recommendation}</p>
                </div>

                <div className="w-full md:w-80">
                  <div className="flex justify-between text-xs font-semibold text-gray-500 mb-3">
                    <span className="text-green-600">{data.correct} Correct</span>
                    <span className="text-red-500">{wrong} Incorrect</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-all duration-1000 ease-out"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Volume</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-1">Hits</p>
                <p className="text-2xl font-bold text-gray-900">{data.correct}</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Misses</p>
                <p className="text-2xl font-bold text-gray-900">{wrong}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Vulnerability Matrix</p>
                {data.weak_topics.length === 0
                  ? <p className="text-gray-500 text-sm">Insufficient data points.</p>
                  : <div className="space-y-4">
                      {data.weak_topics.map((t, i) => (
                        <div key={i} className="flex items-center justify-between group">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{t.topic || 'Random'}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{t.exam || 'General'}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-gray-400">{t.wrong_count} errors</span>
                            <button
                              onClick={() => navigate('/mcq', { state: { exam: t.exam || 'GPSC', lang: 'gu', topic: t.topic || 'Random' } })}
                              className="text-xs font-medium bg-gray-50 text-gray-900 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-black hover:text-white hover:border-black transition-all opacity-0 group-hover:opacity-100"
                            >
                              Target
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <p className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Exam Deviation</p>
                {data.weak_by_exam.length === 0
                  ? <p className="text-gray-500 text-sm">Insufficient data points.</p>
                  : <div className="space-y-5">
                      {data.weak_by_exam.map(item => (
                        <div key={item.exam}>
                          <div className="flex justify-between text-xs mb-2">
                            <span className="font-medium text-gray-900">{item.exam}</span>
                            <span className="text-gray-500">{item.wrong_count} errors across {item.topics} nodes</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gray-400"
                              style={{ width: `${Math.min(100, item.wrong_count * 10)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-4 border-b border-gray-100 pb-4">Event Log</p>
              {data.recent_attempts.length === 0
                ? <p className="text-gray-500 text-sm">No recorded events.</p>
                : <div className="space-y-3">
                    {data.recent_attempts.map((attempt, i) => (
                      <div key={attempt.id || i} className="flex justify-between text-sm py-1">
                        <span className="text-gray-500">Instance {data.recent_attempts.length - i}</span>
                        <span className={`font-medium ${attempt.is_correct ? 'text-green-600' : 'text-red-500'}`}>
                          {attempt.is_correct ? 'Success' : 'Failure'}
                        </span>
                      </div>
                    ))}
                  </div>
              }
            </div>

          </div>
        )}
      </div>
    </div>
  )
}