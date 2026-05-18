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
  const barColor = accuracy >= 80 ? 'from-green-500 to-green-600' : accuracy >= 50 ? 'from-orange-500 to-orange-600' : 'from-red-500 to-red-600'

  const getAccuracyBadge = () => {
    if (accuracy >= 80) return { emoji: '🏆', label: 'Excellent', color: 'bg-green-100 text-green-700' }
    if (accuracy >= 50) return { emoji: '📈', label: 'Good Progress', color: 'bg-orange-100 text-orange-700' }
    return { emoji: '💪', label: 'Keep Practicing', color: 'bg-red-100 text-red-700' }
  }

  const badge = getAccuracyBadge()

  return (
    <div className="flex-1 overflow-y-auto bg-[#fafafa] dark:bg-[#121212]">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* Header */}
        <div className="mb-2">
          <h2 className="text-gray-900 dark:text-gray-100 font-bold text-lg">Your Progress</h2>
          <p className="text-gray-400 dark:text-gray-500 text-xs">Track your exam preparation journey</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2 animate-slide-up">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {!data && !error && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-orange-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {data && (
          <>
            {/* Main Accuracy Card */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 animate-slide-up">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Overall Accuracy</p>
                  <div className="flex items-center gap-3">
                    <p className={`text-5xl font-black ${accuracyColor}`}>{accuracy}%</p>
                    <span className={`badge ${badge.color} dark:bg-opacity-10 px-3 py-1 text-xs font-semibold`}>
                      {badge.emoji} {badge.label}
                    </span>
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-3">{data.recommendation}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-3xl shadow-lg shadow-orange-500/20">
                  {badge.emoji}
                </div>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`} style={{ width: `${accuracy}%` }} />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                <p className="text-3xl font-black text-gray-900 dark:text-gray-100">{total}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Answered</p>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                <p className="text-3xl font-black text-green-600">{data.correct}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Correct</p>
              </div>
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 text-center shadow-sm border border-gray-100 dark:border-gray-800">
                <p className="text-3xl font-black text-red-500">{wrong}</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Wrong</p>
              </div>
            </div>

            {/* Weak Topics & Exam Focus */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Weak Topics</p>
                </div>
                {data.weak_topics.length === 0
                  ? (
                    <div className="flex items-center justify-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                      <span>No weak topics yet. Keep it up!</span>
                    </div>
                  )
                  : data.weak_topics.map((t, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm font-medium">{t.topic || 'Random'}</p>
                        <p className="text-gray-400 dark:text-gray-500 text-xs">{t.exam}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-500 text-xs font-bold">{t.wrong_count} ✗</span>
                        <button onClick={() => navigate('/mcq')}
                          className="text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg px-2.5 py-1.5 font-semibold transition-all">
                          Practice
                        </button>
                      </div>
                    </div>
                  ))
                }
              </div>

              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Exam Focus</p>
                </div>
                {data.weak_by_exam.length === 0
                  ? (
                    <div className="flex items-center justify-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                      <span>Practice more to see breakdown.</span>
                    </div>
                  )
                  : data.weak_by_exam.map(item => (
                    <div key={item.exam} className="py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                      <div className="flex justify-between text-sm mb-2">
                        <p className="text-gray-700 dark:text-gray-300 font-medium">{item.exam}</p>
                        <p className="text-red-500 font-bold text-xs">{item.wrong_count} ✗</p>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full" style={{ width: `${Math.min(100, item.wrong_count * 12)}%` }} />
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>

            {/* Recent Attempts */}
            <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">Recent Attempts</p>
              </div>
              {data.recent_attempts.length === 0
                ? (
                  <div className="flex items-center justify-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                    <span>No attempts yet. Start practicing!</span>
                  </div>
                )
                : (
                  <div className="flex flex-wrap gap-2">
                    {data.recent_attempts.slice(-20).map((a, i) => (
                      <div key={a.id || i}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all hover:scale-110 ${
                          a.is_correct ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400'
                        }`}>
                        {a.is_correct ? '✓' : '✗'}
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            {/* CTA Button */}
            <button onClick={() => navigate('/mcq')}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white py-4 rounded-xl font-bold transition-all shadow-sm hover:shadow-md hover:shadow-orange-500/20 flex items-center justify-center gap-2">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Start Recommended Practice
            </button>
          </>
        )}
      </div>
    </div>
  )
}