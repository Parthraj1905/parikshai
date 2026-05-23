import { useState } from 'react'
import { generateMCQ, submitMCQ } from '../lib/api'

const TOPICS = {
  GPSC: ['Random', 'Gujarat History', 'Gujarat Geography', 'Polity', 'Economy', 'Science'],
  SSC: ['Random', 'Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness', 'Current Affairs'],
  RRB: ['Random', 'Railway GK', 'Reasoning', 'Mathematics', 'General Science', 'Current Affairs'],
  UPSC: ['Random', 'History', 'Polity', 'Geography', 'Economy', 'Environment', 'Science & Tech'],
}

const BATCH_SIZE = 10

function createQuestionId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function MCQ({ exam, lang }) {
  const topics = TOPICS[exam] || TOPICS.GPSC
  const [topic, setTopic] = useState('Random')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const question = questions[currentIndex] || null
  const isLast = question && currentIndex + 1 >= questions.length
  const progress = questions.length ? ((currentIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100 : 0

  async function loadBatch() {
    setLoading(true); setError(''); setQuestions([]); setCurrentIndex(0); setSelectedAnswer('')
    try {
      const data = await generateMCQ(exam, lang, topic === 'Random' ? null : topic, BATCH_SIZE)
      const loaded = (data.questions || [data]).map(item => ({ ...item, id: createQuestionId(), topic }))
      setQuestions(loaded)
    } catch (e) { setError(e.response?.data?.detail || 'Could not load questions. Try again.') }
    setLoading(false)
  }

  async function chooseAnswer(option) {
    if (!question || selectedAnswer) return
    const isCorrect = option === question.correct
    setSelectedAnswer(option)
    setScore(p => ({ correct: p.correct + (isCorrect ? 1 : 0), total: p.total + 1 }))
    submitMCQ({ questionId: question.id, selectedAnswer: option, correctAnswer: question.correct, exam, topic: question.topic }).catch(() => {})
  }

  function nextQuestion() {
    setSelectedAnswer(''); setError('')
    if (currentIndex + 1 < questions.length) setCurrentIndex(p => p + 1)
  }

  const optionStyle = (option) => {
    const base = { width: '100%', textAlign: 'left', padding: '14px 18px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'all 0.15s', border: '1px solid', fontFamily: 'inherit' }
    if (!selectedAnswer) return { ...base, background: '#2a2b2d', borderColor: '#3c3c3e', color: '#e3e3e3' }
    if (option === question.correct) return { ...base, background: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.4)', color: '#4ade80' }
    if (option === selectedAnswer) return { ...base, background: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#f87171' }
    return { ...base, background: '#1e1f20', borderColor: '#3c3c3e', color: '#5f6368' }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1e1f20', overflowY: 'auto', fontFamily: "'Google Sans', sans-serif" }}>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px', width: '100%', boxSizing: 'border-box' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#e3e3e3', margin: '0 0 4px' }}>MCQ Practice</h2>
            <p style={{ fontSize: '13px', color: '#9aa0a6', margin: 0 }}>{exam} · {topic}</p>
          </div>
          <div style={{ background: '#2a2b2d', border: '1px solid #3c3c3e', borderRadius: '100px', padding: '8px 18px', fontSize: '14px', fontWeight: '600', color: '#e3e3e3' }}>
            {score.correct}/{score.total}
          </div>
        </div>

        {/* Progress */}
        {questions.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9aa0a6', marginBottom: '8px' }}>
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div style={{ height: '3px', background: '#3c3c3e', borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #8ab4f8, #c084fc)', borderRadius: '100px', width: `${progress}%`, transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {/* Topic chips */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: '600', color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>Topic</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {topics.map(t => (
              <button key={t} onClick={() => { setTopic(t); setQuestions([]); setSelectedAnswer('') }}
                disabled={loading || (question && !selectedAnswer)}
                style={{
                  padding: '7px 16px', borderRadius: '100px', fontSize: '13px', fontWeight: '500',
                  cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit', border: '1px solid',
                  background: topic === t ? 'rgba(138,180,248,0.15)' : 'transparent',
                  borderColor: topic === t ? 'rgba(138,180,248,0.4)' : '#3c3c3e',
                  color: topic === t ? '#8ab4f8' : '#9aa0a6',
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '12px 16px', color: '#f87171', fontSize: '14px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* Start button */}
        {!question && (
          <button onClick={loadBatch} disabled={loading} style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
            background: loading ? '#2a2b2d' : 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)',
            color: loading ? '#9aa0a6' : '#131314', fontSize: '15px', fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          }}>
            {loading ? (
              <>
                <div style={{ width: '18px', height: '18px', border: '2px solid #5f6368', borderTopColor: '#9aa0a6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Generating {BATCH_SIZE} questions...
              </>
            ) : `Start ${BATCH_SIZE} Questions`}
          </button>
        )}

        {/* Question card */}
        {question && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#2a2b2d', borderRadius: '16px', padding: '24px', border: '1px solid #3c3c3e' }}>
              <p style={{ color: '#e3e3e3', fontSize: '15px', fontWeight: '500', lineHeight: '1.6', margin: 0 }}>{question.question}</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                borderRadius: '12px', padding: '16px',
                background: selectedAnswer === question.correct ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${selectedAnswer === question.correct ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}>
                <p style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: selectedAnswer === question.correct ? '#4ade80' : '#f87171' }}>
                  {selectedAnswer === question.correct ? '✓ Correct!' : `✗ Correct: ${question.correct}`}
                </p>
                <p style={{ fontSize: '13px', color: '#9aa0a6', lineHeight: '1.55', margin: 0 }}>{question.explanation}</p>
              </div>
            )}

            {selectedAnswer && !isLast && (
              <button onClick={nextQuestion} style={{
                padding: '14px', borderRadius: '100px', border: 'none',
                background: 'linear-gradient(135deg, #8ab4f8 0%, #c084fc 100%)',
                color: '#131314', fontSize: '14px', fontWeight: '600',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Next Question →
              </button>
            )}

            {selectedAnswer && isLast && (
              <div style={{ background: '#2a2b2d', borderRadius: '16px', padding: '28px', textAlign: 'center', border: '1px solid #3c3c3e' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>{score.correct / score.total >= 0.8 ? '🏆' : score.correct / score.total >= 0.5 ? '👍' : '💪'}</div>
                <p style={{ color: '#e3e3e3', fontWeight: '600', fontSize: '16px', margin: '0 0 8px' }}>Set Complete!</p>
                <p style={{ color: '#9aa0a6', fontSize: '14px', margin: '0 0 20px' }}>{score.correct} / {score.total} correct</p>
                <button onClick={loadBatch} disabled={loading} style={{
                  padding: '12px 28px', borderRadius: '100px', border: 'none',
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
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}