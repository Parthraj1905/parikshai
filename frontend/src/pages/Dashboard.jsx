import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProgress } from '../lib/api'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    getProgress()
      .then(setData)
      .catch(error => {
        if (error.response?.status === 402) {
          setLocked(true)
          return
        }
        setError('Could not load progress.')
      })
  }, [])

  const wrong = data?.wrong || 0
  const total = data?.total_answered || 0
  const accuracy = data?.accuracy || 0
  const barColor = accuracy >= 80 ? 'linear-gradient(90deg, #4ade80, #22c55e)' : accuracy >= 50 ? 'linear-gradient(90deg, #8ab4f8, #c084fc)' : 'linear-gradient(90deg, #f87171, #ef4444)'
  const badge = accuracy >= 80 ? { emoji: '🏆', label: 'Excellent', color: '#4ade80' } : accuracy >= 50 ? { emoji: '📈', label: 'Good Progress', color: '#8ab4f8' } : { emoji: '💪', label: 'Keep Practicing', color: '#f87171' }

  const card = () => ({ background: '#2a2b2d', borderRadius: '16px', padding: '24px', border: '1px solid #3c3c3e', marginBottom: '16px' })

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#1e1f20', fontFamily: "'Google Sans', sans-serif" }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#e3e3e3', margin: '0 0 4px' }}>Progress</h2>
          <p style={{ fontSize: '13px', color: '#9aa0a6', margin: 0 }}>Track your exam preparation</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '14px 18px', color: '#f87171', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {locked && (
          <div style={{ background: '#2a2b2d', border: '1px solid #3c3c3e', borderRadius: '16px', padding: '28px', textAlign: 'center' }}>
            <h3 style={{ color: '#e3e3e3', fontSize: '18px', fontWeight: '700', margin: '0 0 8px' }}>Progress is a Pro feature</h3>
            <p style={{ color: '#9aa0a6', fontSize: '14px', lineHeight: '1.55', margin: '0 0 20px' }}>Upgrade to unlock progress charts, weak topics, recent attempts, and higher daily AI limits.</p>
            <button onClick={() => navigate('/billing')} style={{
              padding: '13px 22px',
              borderRadius: '100px',
              border: 'none',
              background: 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)',
              color: '#131314',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Upgrade to Pro
            </button>
          </div>
        )}

        {!data && !error && !locked && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <div style={{ width: '32px', height: '32px', border: '2px solid #3c3c3e', borderTopColor: '#8ab4f8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {data && !locked && (
          <>
            {/* Accuracy */}
            <div style={card()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <p style={{ fontSize: '12px', color: '#9aa0a6', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Overall Accuracy</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{ fontSize: '52px', fontWeight: '700', color: badge.color, lineHeight: 1 }}>{accuracy}%</span>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: badge.color, background: `${badge.color}18`, padding: '4px 12px', borderRadius: '100px' }}>
                      {badge.emoji} {badge.label}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#9aa0a6', marginTop: '8px' }}>{data.recommendation}</p>
                </div>
              </div>
              <div style={{ height: '4px', background: '#3c3c3e', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: barColor, borderRadius: '100px', width: `${accuracy}%`, transition: 'width 0.7s ease' }} />
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              {[
                { val: total, label: 'Answered', color: '#e3e3e3' },
                { val: data.correct, label: 'Correct', color: '#4ade80' },
                { val: wrong, label: 'Wrong', color: '#f87171' },
              ].map((s, i) => (
                <div key={i} style={{ background: '#2a2b2d', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid #3c3c3e' }}>
                  <p style={{ fontSize: '32px', fontWeight: '700', color: s.color, margin: '0 0 4px' }}>{s.val}</p>
                  <p style={{ fontSize: '12px', color: '#9aa0a6', margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Weak topics */}
            <div style={card()}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e3e3e3', margin: '0 0 16px' }}>⚠️ Weak Topics</h3>
              {data.weak_topics.length === 0
                ? <p style={{ color: '#9aa0a6', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>No weak topics yet. Keep it up!</p>
                : data.weak_topics.map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < data.weak_topics.length - 1 ? '1px solid #3c3c3e' : 'none' }}>
                    <div>
                      <p style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '500', margin: '0 0 2px' }}>{t.topic || 'Random'}</p>
                      <p style={{ color: '#9aa0a6', fontSize: '12px', margin: 0 }}>{t.exam}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ color: '#f87171', fontSize: '13px', fontWeight: '600' }}>{t.wrong_count} ✗</span>
                      <button onClick={() => navigate('/mcq')} style={{
                        padding: '6px 14px', borderRadius: '100px', border: 'none',
                        background: 'rgba(138,180,248,0.12)', color: '#8ab4f8', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      }}>
                        Practice
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Recent */}
            <div style={card()}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#e3e3e3', margin: '0 0 16px' }}>🕐 Recent Attempts</h3>
              {data.recent_attempts.length === 0
                ? <p style={{ color: '#9aa0a6', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>No attempts yet.</p>
                : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {data.recent_attempts.slice(-30).map((a, i) => (
                      <div key={i} style={{
                        width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: a.is_correct ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
                        color: a.is_correct ? '#4ade80' : '#f87171',
                        fontSize: '12px', fontWeight: '700',
                      }}>
                        {a.is_correct ? '✓' : '✗'}
                      </div>
                    ))}
                  </div>
                )
              }
            </div>

            <button onClick={() => navigate('/mcq')} style={{
              width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)',
              color: '#131314', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              ▶ Start Recommended Practice
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
