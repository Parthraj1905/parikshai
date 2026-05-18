import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
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

export default function MCQ() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { exam, lang } = state || { exam: 'GPSC', lang: 'gu' }
  const topics = TOPICS[exam] || TOPICS.GPSC

  const [topic, setTopic] = useState(state?.topic || 'Random')
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [score, setScore] = useState({ correct: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingSaves, setPendingSaves] = useState(0)
  const [saveError, setSaveError] = useState('')
  const question = questions[currentIndex] || null
  const isLastQuestion = question && currentIndex + 1 >= questions.length

  async function loadBatch() {
    setLoading(true)
    setError('')
    setQuestions([])
    setCurrentIndex(0)
    setSelectedAnswer('')
    setSaveError('')

    try {
      const questionTopic = topic === 'Random' ? 'Random' : topic
      const data = await generateMCQ(exam, lang, questionTopic === 'Random' ? null : questionTopic, BATCH_SIZE)
      const loadedQuestions = (data.questions || [data]).map(item => ({
        ...item,
        id: createQuestionId(),
        topic: questionTopic,
      }))
      setQuestions(loadedQuestions)
    } catch (e) {
      setError(e.response?.data?.detail || 'Could not load questions. Try again.')
    }

    setLoading(false)
  }

  function nextQuestion() {
    setError('')
    setSelectedAnswer('')
    setSaveError('')

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  function changeTopic(value) {
    setTopic(value)
    setQuestions([])
    setCurrentIndex(0)
    setSelectedAnswer('')
    setError('')
    setSaveError('')
  }

  async function chooseAnswer(option) {
    if (!question || selectedAnswer) return

    const isCorrect = option === question.correct
    setSelectedAnswer(option)
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }))

    setPendingSaves(prev => prev + 1)
    submitMCQ({
        questionId: question.id,
        selectedAnswer: option,
        correctAnswer: question.correct,
        exam,
        topic: question.topic,
      })
      .then(() => setSaveError(''))
      .catch(e => {
        console.error(e)
        setSaveError('Progress is syncing in the background. Practice can continue.')
      })
      .finally(() => setPendingSaves(prev => Math.max(0, prev - 1)))
  }

  function optionClass(option) {
    if (!selectedAnswer) {
      return 'bg-white text-gray-800 border-gray-200 hover:border-black'
    }

    if (option === question.correct) {
      return 'bg-green-50 text-green-900 border-green-500 ring-1 ring-green-500'
    }

    if (option === selectedAnswer) {
      return 'bg-red-50 text-red-900 border-red-500 ring-1 ring-red-500'
    }

    return 'bg-white text-gray-400 border-gray-100 opacity-50'
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-md mx-auto mt-4">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="text-gray-400 hover:text-black transition-colors">←</button>
            <div>
              <h2 className="text-sm font-bold text-gray-900">MCQ Practice</h2>
              <p className="text-xs text-gray-500">{exam}</p>
            </div>
          </div>
          <div className="bg-gray-100 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700">
            {score.correct} / {score.total} Correct
          </div>
        </div>

        <div className="mb-6">
          <select
            id="topic"
            value={topic}
            onChange={e => changeTopic(e.target.value)}
            disabled={loading || (question && !selectedAnswer)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-sm text-gray-800 outline-none transition-all disabled:opacity-50"
          >
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-sm mb-6">
            {error}
          </div>
        )}

        {!question && (
          <button
            onClick={loadBatch}
            disabled={loading}
            className="w-full bg-black text-white py-4 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating Content...' : 'Start Session'}
          </button>
        )}

        {question && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Question {currentIndex + 1} of {questions.length}</span>
              </div>
              <p className="text-base font-medium text-gray-900 leading-relaxed">{question.question}</p>
            </div>

            <div className="space-y-3">
              {question.options.map(option => (
                <button
                  key={option}
                  onClick={() => chooseAnswer(option)}
                  disabled={Boolean(selectedAnswer)}
                  className={`w-full text-left border rounded-xl p-4 text-sm font-medium transition-all ${optionClass(option)}`}
                >
                  {option}
                </button>
              ))}
            </div>

            {selectedAnswer && (
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">
                  {selectedAnswer === question.correct ? 'Correct' : 'Explanation'}
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">{question.explanation}</p>
              </div>
            )}

            {selectedAnswer && !isLastQuestion && (
              <button
                onClick={nextQuestion}
                disabled={loading}
                className="w-full bg-black text-white py-4 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Next Question
              </button>
            )}

            {selectedAnswer && isLastQuestion && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mt-8">
                <div className="text-center mb-6">
                  <p className="text-lg font-bold text-gray-900">Session Complete</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Final Score: {score.correct} / {score.total}
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full bg-black text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    View Analytics
                  </button>
                  <button
                    onClick={loadBatch}
                    disabled={loading}
                    className="w-full bg-white text-gray-900 py-3 rounded-xl text-sm font-medium border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Generating...' : 'New Session'}
                  </button>
                </div>
              </div>
            )}

            {pendingSaves > 0 && <p className="text-center text-xs text-gray-400">Syncing data...</p>}
            {saveError && <p className="text-center text-xs text-red-500">{saveError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}