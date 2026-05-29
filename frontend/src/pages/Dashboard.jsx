import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProgress } from '../lib/api'
import DashboardSkeleton from '../components/DashboardSkeleton'

function FlameIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 8px rgba(249, 171, 0, 0.4))' }}>
      <defs>
        <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ea4335" />
          <stop offset="40%" stopColor="#f9ab00" />
          <stop offset="100%" stopColor="#fef7e0" />
        </linearGradient>
      </defs>
      <path d="M12 2C12 2 17 6.5 17 11.5C17 14.5 14.8 17 12 17C9.2 17 7 14.5 7 11.5C7 9.8 8 7 8 7C8 7 9.5 9 10 9.5C10.5 10 11.5 9 11.5 8C11.5 7 10 5.5 10 3.5C10 2.8 10.8 2.2 12 2Z" fill="url(#flameGrad)" />
      <path d="M12 9C12 9 14.5 11 14.5 13C14.5 14.5 13.4 15.5 12 15.5C10.6 15.5 9.5 14.5 9.5 13C9.5 12.2 10.2 11.2 10.5 11C10.8 10.8 11.2 10.2 11.2 9.8C11.2 9.4 12 9 12 9Z" fill="#ffefc3" />
    </svg>
  )
}

// Mock data for beautiful paywall backdrop representation
const mockData = {
  total_answered: 142,
  correct: 118,
  wrong: 24,
  accuracy: 83,
  weak_topics: [
    { topic: 'Indian Polity & Constitution', exam: 'GENERAL', wrong_count: 8 },
    { topic: 'Geography', exam: 'GENERAL', wrong_count: 5 },
    { topic: 'Current Affairs', exam: 'GENERAL', wrong_count: 3 },
  ],
  recent_attempts: [
    { is_correct: true },
    { is_correct: true },
    { is_correct: false },
    { is_correct: true },
    { is_correct: true },
  ],
  recommendation: 'Target Indian Polity & Constitution next to boost your accuracy to 90%+'
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [locked, setLocked] = useState(false)
  const [streak, setStreak] = useState(3)
  const [completedQuests, setCompletedQuests] = useState({ q1: false, q2: false, q3: false })
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

  // Manage Streak state
  useEffect(() => {
    const savedStreak = localStorage.getItem('study_streak')
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10))
    } else {
      localStorage.setItem('study_streak', '3')
    }
  }, [])

  const displayData = locked ? mockData : data
  const accuracy = displayData?.accuracy || 0
  const total = displayData?.total_answered || 0
  const correct = displayData?.correct || 0
  const wrong = displayData?.wrong || 0
  const weakTopics = displayData?.weak_topics || []
  const recentAttempts = displayData?.recent_attempts || []

  // Manage quests completion
  useEffect(() => {
    if (!displayData) return
    const q1Status = total >= 10
    const q3Status = accuracy >= 75

    const savedQuests = localStorage.getItem('daily_quests_completed')
    if (savedQuests) {
      try {
        const parsed = JSON.parse(savedQuests)
        setCompletedQuests({
          q1: q1Status || parsed.q1,
          q2: parsed.q2,
          q3: q3Status || parsed.q3
        })
      } catch (e) {
        setCompletedQuests({ q1: q1Status, q2: false, q3: q3Status })
      }
    } else {
      setCompletedQuests({ q1: q1Status, q2: false, q3: q3Status })
    }
  }, [displayData, total, accuracy])

  const toggleQuest = (key) => {
    if (locked) return
    const updated = { ...completedQuests, [key]: !completedQuests[key] }
    setCompletedQuests(updated)
    localStorage.setItem('daily_quests_completed', JSON.stringify(updated))
  }

  // Get Accuracy Tier Badge
  const getBadge = (acc) => {
    if (acc >= 80) return { emoji: '🏆', label: 'Elite Mastery', color: '#4ade80', bg: 'rgba(74,222,128,0.12)' }
    if (acc >= 50) return { emoji: '📈', label: 'High Competence', color: '#8ab4f8', bg: 'rgba(138,180,248,0.12)' }
    return { emoji: '💪', label: 'Grit & Grind', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
  }
  const badge = getBadge(accuracy)

  // Get Topic Priority Pill
  const getTopicPriority = (wrongCount) => {
    if (wrongCount >= 6) return { text: 'Critical', color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.25)', effort: '🎯 10 targeted MCQs ~ 15m' }
    if (wrongCount >= 3) return { text: 'High Alert', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', effort: '🎯 5 targeted MCQs ~ 8m' }
    return { text: 'Attention', color: '#8ab4f8', bg: 'rgba(138,180,248,0.12)', border: '1px solid rgba(138,180,248,0.25)', effort: '🎯 3 review questions ~ 5m' }
  }

  // Circular gauge config
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (accuracy / 100) * circumference

  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#1e1f20', fontFamily: "'Google Sans', sans-serif", position: 'relative' }}>
      {/* Dynamic Keyframe & Hover CSS Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fillGauge {
          from { stroke-dashoffset: ${circumference}; }
          to { stroke-dashoffset: ${strokeDashoffset}; }
        }
        .glass-card {
          background: rgba(30, 31, 32, 0.6) !important;
          backdrop-filter: blur(16px) !important;
          -webkit-backdrop-filter: blur(16px) !important;
          border-radius: 20px !important;
          padding: 24px !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .glass-card:hover {
          transform: translateY(-4px);
          border-color: rgba(255, 255, 255, 0.16) !important;
          box-shadow: 0 12px 40px 0 rgba(138, 180, 248, 0.12) !important;
        }
        .streak-card {
          background: linear-gradient(135deg, rgba(234, 67, 53, 0.12) 0%, rgba(249, 171, 0, 0.08) 100%) !important;
          border: 1px solid rgba(249, 171, 0, 0.2) !important;
          box-shadow: 0 8px 32px 0 rgba(249, 171, 0, 0.05) !important;
        }
        .streak-card:hover {
          border-color: rgba(249, 171, 0, 0.4) !important;
          box-shadow: 0 12px 40px 0 rgba(249, 171, 0, 0.15) !important;
        }
        .btn-primary {
          background: linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%) !important;
          box-shadow: 0 4px 15px rgba(138, 180, 248, 0.25) !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(138, 180, 248, 0.4) !important;
          filter: brightness(1.1);
        }
        .attempts-node {
          transition: all 0.25s ease;
        }
        .attempts-node:hover {
          transform: scale(1.18);
          box-shadow: 0 0 12px currentColor;
        }
      `}} />

      <div style={{ maxWidth: '820px', margin: '0 auto', padding: '32px 24px', position: 'relative' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#e3e3e3', margin: '0 0 6px', letterSpacing: '-0.4px' }}>Diagnostic Analytics</h2>
            <p style={{ fontSize: '14px', color: '#9aa0a6', margin: 0 }}>Review and reinforce your core subject competence</p>
          </div>
          {!locked && data && (
            <div style={{ fontSize: '13px', color: '#8ab4f8', background: 'rgba(138,180,248,0.1)', padding: '6px 14px', borderRadius: '100px', fontWeight: '600', border: '1px solid rgba(138,180,248,0.2)' }}>
              ⚡ Pro Member
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', padding: '14px 20px', color: '#f87171', fontSize: '14px', marginBottom: '24px' }}>
            ⚠️ {error}
          </div>
        )}

        {!displayData && !error && (
          <DashboardSkeleton />
        )}

        {/* Backdrop Content (Blurred if locked) */}
        {displayData && (
          <div style={{ filter: locked ? 'blur(5px) grayscale(30%)' : 'none', pointerEvents: locked ? 'none' : 'auto', transition: 'filter 0.3s ease' }}>
            
            {/* Top Row: Hero Circular Progress + Study Streak & Daily Quests */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }} className="grid-cols-1 md:grid-cols-2">
              
              {/* Circular Gauge Card */}
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
                  <svg width="130" height="130" viewBox="0 0 130 130">
                    <defs>
                      <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8ab4f8" />
                        <stop offset="100%" stopColor="#c084fc" />
                      </linearGradient>
                    </defs>
                    {/* Background Track */}
                    <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                    {/* Animated Stroke */}
                    <circle 
                      cx="65" 
                      cy="65" 
                      r={radius} 
                      fill="none" 
                      stroke="url(#gaugeGrad)" 
                      strokeWidth="10" 
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 65 65)"
                      style={{ animation: 'fillGauge 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards' }}
                    />
                  </svg>
                  {/* Center Text */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '28px', fontWeight: '700', color: badge.color, lineHeight: 1 }}>{accuracy}%</span>
                    <span style={{ fontSize: '10px', color: '#9aa0a6', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accuracy</span>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: badge.color, background: badge.bg, padding: '4px 10px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'inline-block', marginBottom: '10px' }}>
                    {badge.emoji} {badge.label}
                  </span>
                  <h4 style={{ color: '#e3e3e3', fontSize: '15px', fontWeight: '600', margin: '0 0 6px' }}>Diagnostic Tip</h4>
                  <p style={{ fontSize: '13px', color: '#9aa0a6', lineHeight: '1.5', margin: 0 }}>
                    {displayData.recommendation}
                  </p>
                </div>
              </div>

              {/* Study Streak & Daily Quests Card */}
              <div className="glass-card streak-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FlameIcon size={32} />
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffb300', margin: 0 }}>{streak} Day Study Streak!</h3>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>Complete quests daily to grow your momentum</p>
                  </div>
                </div>

                {/* Quests */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                  {[
                    { key: 'q1', text: `Practice 10 MCQs (${Math.min(total, 10)}/10)`, done: completedQuests.q1 },
                    { key: 'q2', text: 'Tackle a critical weak topic today', done: completedQuests.q2 },
                    { key: 'q3', text: 'Maintain accuracy above 75%', done: completedQuests.q3 },
                  ].map((q, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => toggleQuest(q.key)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '10px', 
                        cursor: 'pointer', 
                        padding: '6px 10px', 
                        borderRadius: '8px', 
                        background: q.done ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${q.done ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.04)'}`,
                        transition: 'all 0.2s ease'
                      }}
                      className="quest-checkbox"
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '4px',
                        border: `2px solid ${q.done ? '#4ade80' : '#5f6368'}`,
                        background: q.done ? '#4ade80' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#131314',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        transition: 'all 0.15s ease'
                      }}>
                        {q.done && '✓'}
                      </div>
                      <span style={{ fontSize: '13px', color: q.done ? '#e3e3e3' : '#9aa0a6', textDecoration: q.done ? 'line-through' : 'none' }}>
                        {q.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Middle Row: Stats Cards Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '24px' }}>
              {[
                { count: total, label: 'Questions Attempted', color: '#8ab4f8', bg: 'rgba(138,180,248,0.06)', icon: '📝' },
                { count: correct, label: 'Correct Solutions', color: '#4ade80', bg: 'rgba(74,222,128,0.06)', icon: '✅' },
                { count: wrong, label: 'Incorrect Solutions', color: '#f87171', bg: 'rgba(248,113,113,0.06)', icon: '❌' },
              ].map((s, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '20px !important', display: 'flex', flexDirection: 'column', alignItems: 'center', background: s.bg, border: `1px solid rgba(255,255,255,0.04)` }}>
                  <span style={{ fontSize: '24px', marginBottom: '8px' }}>{s.icon}</span>
                  <span style={{ fontSize: '32px', fontWeight: '700', color: s.color, lineHeight: 1, margin: '4px 0' }}>{s.count}</span>
                  <span style={{ fontSize: '12px', color: '#9aa0a6', textAlign: 'center', marginTop: '4px' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Bottom Row: Actionable Weak Topics & Recent Attempts Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px' }} className="grid-cols-1 md:grid-cols-[1.2fr_0.8fr]">
              
              {/* Actionable Weak Topics Panel */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#e3e3e3', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚠️</span> Competence Reinforcement
                  </h3>
                  <span style={{ fontSize: '11px', color: '#9aa0a6' }}>Prioritized by error rate</span>
                </div>

                {weakTopics.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 20px', color: '#9aa0a6' }}>
                    <p style={{ fontSize: '14px', margin: '0 0 8px' }}>No weak topics registered yet!</p>
                    <p style={{ fontSize: '12px', margin: 0 }}>Maintain accuracy to keep this diagnostic clean.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {weakTopics.map((t, idx) => {
                      const priority = getTopicPriority(t.wrong_count)
                      return (
                        <div 
                          key={idx} 
                          style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px', 
                            padding: '14px 16px', 
                            border: '1px solid rgba(255,255,255,0.04)',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <p style={{ color: '#e3e3e3', fontSize: '14px', fontWeight: '600', margin: '0 0 2px' }}>{t.topic || 'Random'}</p>
                              <p style={{ color: '#9aa0a6', fontSize: '12px', margin: 0 }}>Category: {t.exam}</p>
                            </div>
                            <span style={{ 
                              fontSize: '11px', 
                              fontWeight: '600', 
                              color: priority.color, 
                              background: priority.bg, 
                              padding: '4px 10px', 
                              borderRadius: '100px',
                              border: priority.border
                            }}>
                              {priority.text} ({t.wrong_count} errors)
                            </span>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', marginTop: '2px' }}>
                            <span style={{ fontSize: '12px', color: '#9aa0a6' }}>
                              {priority.effort}
                            </span>
                            <button 
                              onClick={() => navigate(`/mcq?topic=${encodeURIComponent(t.topic)}`)} 
                              style={{
                                padding: '6px 14px', 
                                borderRadius: '100px', 
                                border: 'none',
                                background: 'rgba(138,180,248,0.12)', 
                                color: '#8ab4f8', 
                                fontSize: '12px', 
                                fontWeight: '600', 
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(138,180,248,0.2)'; e.currentTarget.style.color = '#fff' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(138,180,248,0.12)'; e.currentTarget.style.color = '#8ab4f8' }}
                            >
                              Targeted Practice
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Recent Attempts Activity Panel */}
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#e3e3e3', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🕐</span> Attempt Timeline
                </h3>

                {recentAttempts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: '#9aa0a6', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    No recent attempts registered yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, paddingLeft: '8px', position: 'relative' }}>
                    {/* Vertical timeline connector */}
                    <div style={{ position: 'absolute', top: '10px', bottom: '10px', left: '17px', width: '2px', background: 'rgba(255,255,255,0.06)' }} />

                    {recentAttempts.map((a, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
                        <div 
                          className="attempts-node"
                          style={{
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            background: a.is_correct ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)',
                            border: `2px solid ${a.is_correct ? '#4ade80' : '#f87171'}`,
                            color: a.is_correct ? '#4ade80' : '#f87171',
                            fontWeight: 'bold',
                            fontSize: '10px'
                          }}
                        >
                          {a.is_correct ? '✓' : '✗'}
                        </div>
                        <div style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                          <p style={{ color: '#e3e3e3', fontSize: '13px', fontWeight: '500', margin: 0 }}>
                            {a.is_correct ? 'Correct Attempt' : 'Incorrect Attempt'}
                          </p>
                          <p style={{ color: '#9aa0a6', fontSize: '11px', margin: '2px 0 0' }}>
                            Question ID: {a.question_id?.slice(0, 8) || 'Gen-Q'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  onClick={() => navigate('/mcq')} 
                  style={{
                    width: '100%', 
                    padding: '14px', 
                    borderRadius: '12px', 
                    border: 'none',
                    marginTop: '20px',
                    color: '#131314', 
                    fontSize: '14px', 
                    fontWeight: '700', 
                    cursor: 'pointer',
                    fontFamily: 'inherit'
                  }}
                  className="btn-primary"
                >
                  Start Practice Session
                </button>
              </div>

            </div>

          </div>
        )}

        {/* Upgrade Paywall Overlay over Blurred Backdrop */}
        {locked && (
          <div style={{
            position: 'absolute',
            top: '80px',
            left: '24px',
            right: '24px',
            bottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'auto'
          }}>
            <div style={{
              background: 'rgba(42, 43, 45, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '24px',
              padding: '36px 32px',
              textAlign: 'center',
              maxWidth: '450px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(138, 180, 248, 0.15) 0%, rgba(192, 132, 252, 0.15) 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                border: '1px solid rgba(192, 132, 252, 0.35)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 22H22L12 2ZM12 6.85L18.8 18H5.2L12 6.85ZM11 10V14H13V10H11ZM11 15V17H13V15H11Z" fill="#c084fc" stroke="#c084fc" strokeWidth="0.5" />
                </svg>
              </div>
              <h3 style={{ color: '#e3e3e3', fontSize: '22px', fontWeight: '700', margin: '0 0 10px', letterSpacing: '-0.3px' }}>Unlock Advanced Analytics</h3>
              <p style={{ color: '#9aa0a6', fontSize: '14px', lineHeight: '1.6', margin: '0 0 28px' }}>
                Upgrade to ParikshAI Pro to view your weakness diagnosis, interactive prep gauges, study consistency streaks, and personalized daily challenges.
              </p>
              <button 
                onClick={() => navigate('/billing')} 
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  borderRadius: '100px',
                  border: 'none',
                  color: '#131314',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
                className="btn-primary"
              >
                Upgrade to Pro Plan
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
