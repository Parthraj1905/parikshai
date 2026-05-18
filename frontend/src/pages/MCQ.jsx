import { useState } from 'react'
import { generateMCQ, submitMCQ } from '../lib/api'

const TOPICS = {
  GPSC: ['Random', 'Gujarat History', 'Gujarat Geography', 'Polity', 'Economy', 'Science'],
  SSC: ['Random', 'Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness', 'Current Affairs'],
  RRB: ['Random', 'Railway GK', 'Reasoning', 'Mathematics', 'General Science', 'Current Affairs'],
  UPSC: ['Random', 'History', 'Polity', 'Geography', 'Economy', 'Environment', 'Science and Technology'],
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
  const [pendingSaves, setPendingSaves] = useState(0)

  const question = questions[currentIndex] || null
  const isLastQuestion = question && currentIndex + 1 >= questions.length
  const progress = questions.length ? ((currentIndex + (selectedAnswer ? 1 : 0)) / questions.length) * 100 : 0

  async function loadBatch() {
    setLoading(true)
    setError('')
    setQuestions([])
    setCurrentIndex(0)
    setSelectedAnswer('')
    try {
      const data = await generateMCQ(exam, lang, topic === 'Random' ? null : topic, BATCH_SIZE)
      const loaded = (data.questions || [data]).map(item => ({
        ...item,
        id: createQuestionId(),
        topic,
      }))
      setQuestions(loaded)
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not load questions. Try again.')
    }
    setLoading(false)
  }

  async function chooseAnswer(option) {
    if (!question || selectedAnswer) return
    const isCorrect = option === question.correct
    setSelectedAnswer(option)
    setScore(prev => ({ correct: prev.correct + (isCorrect ? 1 : 0), total: prev.total + 1 }))
    setPendingSaves(p => p + 1)
    submitMCQ({
      questionId: question.id,
      selectedAnswer: option,
      correctAnswer: question.correct,
      exam,
      topic: question.topic,
    }).finally(() => setPendingSaves(p => Math.max(0, p - 1)))
  }

  function nextQuestion() {
    setSelectedAnswer('')
    setError('')
    if (currentIndex + 1 < questions.length) setCurrentIndex(p => p + 1)
  }

  function optionStyle(option) {
    if (!selectedAnswer) return 'bg-white text-gray-700 hover:bg-gray-50'
    if (option === question.correct) return 'bg-green-50 text-green-800'
    if (option === selectedAnswer) return 'bg-red-50 text-red-700'
    return 'bg-white text-gray-400'
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f7f7f5]">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-gray-900 font-bold text-base">MCQ Practice</h2>
            <p className="text-gray-400 text-xs">{exam} · {topic}</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-2 text-sm font-bold text-gray-700">
            {score.correct}/{score.total}
          </div>
        </div>

        {questions.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-orange-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="mb-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2.5">Topic</p>
          <div className="flex flex-wrap gap-2">
            {topics.map(t => (
              <button key={t} onClick={() => { setTopic(t); setQuestions([]); setSelectedAnswer('') }}
                disabled={loading || (question && !selectedAnswer)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  topic === t ? 'bg-orange-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
        )}

        {!question && (
          <button onClick={loadBatch} disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold transition-all">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading {BATCH_SIZE} questions...
              </span>
            ) : `Start ${BATCH_SIZE} Questions`}
          </button>
        )}

        {question && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-5">
              <p className="text-gray-900 font-semibold leading-relaxed">{question.question}</p>
            </div>

            <div className="space-y-2">
              {question.options.map(option => (
                <button key={option} onClick={() => chooseAnswer(option)} disabled={Boolean(selectedAnswer)}
                  className={`w-full text-left rounded-xl px-4 py-3.5 text-sm font-medium transition-all ${optionStyle(option)}`}>
                  {option}
                </button>
              ))}
            </div>

            {selectedAnswer && (
              <div className={`rounded-2xl p-4 ${selectedAnswer === question.correct ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`text-xs font-bold mb-1.5 ${selectedAnswer === question.correct ? 'text-green-700' : 'text-red-600'}`}>
                  {selectedAnswer === question.correct ? '✓ Correct!' : `✗ Correct answer: ${question.correct}`}
                </p>
                <p className="text-gray-600 text-sm leading-relaxed">{question.explanation}</p>
              </div>
            )}

            {selectedAnswer && !isLastQuestion && (
              <button onClick={nextQuestion}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3.5 rounded-xl font-bold transition-all">
                Next Question →
              </button>
            )}

            {selectedAnswer && isLastQuestion && (
              <div className="bg-white rounded-2xl p-5 space-y-4 text-center">
                <div className="text-3xl mb-1">{score.correct / score.total >= 0.8 ? '🏆' : score.correct / score.total >= 0.5 ? '👍' : '💪'}</div>
                <p className="text-gray-900 font-bold">Set Complete</p>
                <p className="text-gray-400 text-sm">{score.correct} / {score.total} correct</p>
                <button onClick={loadBatch} disabled={loading}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all">
                  Load Another {BATCH_SIZE}
                </button>
              </div>
            )}

            {pendingSaves > 0 && <p className="text-center text-xs text-gray-400">Saving...</p>}
          </div>
        )}
      </div>
    </div>
  )
}