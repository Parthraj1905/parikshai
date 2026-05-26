import { useState } from 'react'
import { generateMCQ, submitMCQ } from '../lib/api'
import PaywallModal from '../components/PaywallModal'
import MCQSkeleton from '../components/MCQSkeleton'

// Generic topics applicable to all Government exams
const TOPICS = [
  'Random',
  'Indian History',
  'Indian Polity & Constitution',
  'Geography',
  'Indian Economy',
  'Science & Technology',
  'Current Affairs',
  'Reasoning & Aptitude',
  'English Language',
  'Environment & Ecology',
]

const BATCH_SIZE = 10

// We use a generic exam identifier for the API
const EXAM = 'GENERAL'

function createQuestionId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function MCQ({ lang }) {
  const [topic, setTopic] = useState('Random')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)

  const question = questions[currentIndex] || null
  const isLast = question && currentIndex + 1 >= questions.length
  const progress = questions.length ? ((currentIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100 : 0

  async function loadBatch() {
    setLoading(true); setError(''); setQuestions([]); setCurrentIndex(0); setSelectedAnswer('')
    try {
      const data = await generateMCQ(EXAM, lang, topic === 'Random' ? null : topic, BATCH_SIZE)
      const loaded = (data.questions || [data]).map(item => ({ ...item, id: createQuestionId(), topic }))
      setQuestions(loaded)
    } catch (e) {
      if (e.response?.status === 429) {
        setShowPaywall(true)
      } else {
        setError(e.response?.data?.detail || 'Could not load questions. Try again.')
      }
    }
    setLoading(false)
  }

  async function chooseAnswer(option) {
    if (!question || selectedAnswer) return
    const isCorrect = option === question.correct
    setSelectedAnswer(option)
    setScore(p => ({ correct: p.correct + (isCorrect ? 1 : 0), total: p.total + 1 }))
    submitMCQ({ questionId: question.id, selectedAnswer: option, correctAnswer: question.correct, exam: EXAM, topic: question.topic }).catch(() => {})
  }

  function nextQuestion() {
    setSelectedAnswer(''); setError('')
    if (currentIndex + 1 < questions.length) setCurrentIndex(p => p + 1)
  }

  const optionStyle = (option) => {
    const base = {
      width: '100%', textAlign: 'left', padding: '13px 18px', borderRadius: '10px',
      fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s',
      border: '1px solid', fontFamily: 'inherit',
    }
    if (!selectedAnswer) return { ...base, background: '#2a2b2d', borderColor: '#3c3c3e', color: '#e3e3e3' }
    if (option === question.correct) return { ...base, background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.4)', color: '#4ade80' }
    if (option === selectedAnswer) return { ...base, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }
    return { ...base, background: '#1e1f20', borderColor: '#3c3c3e', color: '#5f6368' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1f20', overflowY: 'auto', fontFamily: "'Google Sans', sans-serif" }}>
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '28px 20px', width: '100%', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#e3e3e3', margin: '0 0 3px' }}>MCQ Practice</h2>
            <p style={{ fontSize: '12px', color: '#9aa0a6', margin: 0 }}>Government Exams · {topic}</p>
          </div>
          <div style={{ background: '#2a2b2d', border: '1px solid #3c3c3e', borderRadius: '8px', padding: '7px 16px', fontSize: '14px', fontWeight: '600', color: '#e3e3e3' }}>
            {score.correct}/{score.total}
          </div>
        </div>

        {/* Progress bar */}
        {questions.length > 0 && (
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9aa0a6', marginBottom: '6px' }}>
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: '3px', background: '#3c3c3e', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #8ab4f8, #c084fc)', borderRadius: '100px', width: `${progress}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Topic chips */}
        <div style={{ marginBottom: '22px' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Topic</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {TOPICS.map(t => (
              <button key={t} onClick={() => { setTopic(t); setQuestions([]); setSelectedAnswer('') }}
                disabled={loading || (question && !selectedAnswer)}
                style={{
                  padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '500',
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit', border: '1px solid',
                  background: topic === t ? 'rgba(138,180,248,0.12)' : 'transparent',
                  borderColor: topic === t ? 'rgba(138,180,248,0.35)' : '#3c3c3e',
                  color: topic === t ? '#8ab4f8' : '#9aa0a6',
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#f87171', fontSize: '14px', marginBottom: '18px' }}>
            {error}
          </div>
        )}

        {/* Start button or Skeleton */}
        {!question && !loading && (
          <button onClick={loadBatch} style={{
            width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
            background: 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)',
            color: '#131314', fontSize: '14px', fontWeight: '600',
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            Start {BATCH_SIZE} Questions
          </button>
        )}

        {!question && loading && (
          <MCQSkeleton />
        )}

        {/* Question card */}
        {question && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: '#2a2b2d', borderRadius: '12px', padding: '22px', border: '1px solid #3c3c3e' }}>
              <p style={{ color: '#e3e3e3', fontSize: '15px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>{question.question}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {question.options.map(option => (
                <button key={option} onClick={() => chooseAnswer(option)} disabled={Boolean(selectedAnswer)} style={optionStyle(option)}
                  onMouseEnter={e => { if (!selectedAnswer) e.currentTarget.style.background = '#35363a' }}
                  onMouseLeave={e => { if (!selectedAnswer) e.currentTarget.style.background = '#2a2b2d' }}
                >
                  {option}
                </button>
              ))}
            </div>

            {selectedAnswer && (
              <div style={{
                borderRadius: '10px', padding: '14px 16px',
                background: selectedAnswer === question.correct ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${selectedAnswer === question.correct ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}>
                <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: selectedAnswer === question.correct ? '#4ade80' : '#f87171', margin: '0 0 6px' }}>
                  {selectedAnswer === question.correct ? '✓ Correct!' : `✗ Correct: ${question.correct}`}
                </p>
                <p style={{ fontSize: '13px', color: '#9aa0a6', lineHeight: '1.55', margin: 0 }}>{question.explanation}</p>
              </div>
            )}

            {selectedAnswer && !isLast && (
              <button onClick={nextQuestion} style={{
                padding: '13px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)',
                color: '#131314', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Next Question →
              </button>
            )}

            {selectedAnswer && isLast && (
              <div style={{ background: '#2a2b2d', borderRadius: '14px', padding: '28px', textAlign: 'center', border: '1px solid #3c3c3e' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px' }}>
                  {score.correct / score.total >= 0.8 ? '🏆' : score.correct / score.total >= 0.5 ? '👍' : '💪'}
                </div>
                <p style={{ color: '#e3e3e3', fontWeight: '600', fontSize: '16px', margin: '0 0 6px' }}>Set Complete!</p>
                <p style={{ color: '#9aa0a6', fontSize: '14px', margin: '0 0 20px' }}>{score.correct} / {score.total} correct</p>
                <button onClick={loadBatch} disabled={loading} style={{
                  padding: '11px 26px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)',
                  color: '#131314', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Load Another {BATCH_SIZE}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <PaywallModal isOpen={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}