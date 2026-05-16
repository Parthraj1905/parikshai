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
      return
    }

    loadBatch()
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
      return 'bg-white text-gray-800 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
    }

    if (option === question.correct) {
      return 'bg-green-100 text-green-800 border-green-400'
    }

    if (option === selectedAnswer) {
      return 'bg-red-100 text-red-800 border-red-400'
    }

    return 'bg-white text-gray-500 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-orange-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="text-xl">←</button>
            <div>
              <h2 className="text-xl font-bold text-orange-600">MCQ Practice</h2>
              <p className="text-xs text-gray-500">{exam}</p>
            </div>
          </div>
          <div className="bg-white border border-orange-200 rounded-xl px-3 py-2 text-sm font-bold text-orange-600">
            {score.correct}/{score.total} correct
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow mb-4">
          <label className="block text-sm font-semibold text-gray-600 mb-2" htmlFor="topic">
            Topic
          </label>
          <select
            id="topic"
            value={topic}
            onChange={e => changeTopic(e.target.value)}
            disabled={loading || (question && !selectedAnswer)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-800 focus:outline-orange-400"
          >
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-4">
            {error}
          </div>
        )}

        {!question && (
          <button
            onClick={loadBatch}
            disabled={loading}
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 disabled:opacity-60"
          >
            {loading ? 'Loading 10 questions...' : 'Load 10 Questions'}
          </button>
        )}

        {question && (
          <div className="space-y-4">
            <p className="text-center text-xs font-semibold text-gray-400">
              Question {currentIndex + 1} of {questions.length}
            </p>

            <div className="bg-white rounded-2xl p-4 shadow">
              <p className="font-bold text-gray-800 leading-6">{question.question}</p>
            </div>

            <div className="space-y-3">
              {question.options.map(option => (
                <button
                  key={option}
                  onClick={() => chooseAnswer(option)}
                  disabled={Boolean(selectedAnswer)}
                  className={`w-full text-left border-2 rounded-xl p-4 font-semibold transition-all ${optionClass(option)}`}
                >
                  {option}
                </button>
              ))}
            </div>

            {selectedAnswer && (
              <div className="bg-white rounded-2xl p-4 shadow">
                <p className="text-sm font-bold text-gray-700 mb-2">
                  {selectedAnswer === question.correct ? 'Correct answer' : `Correct answer: ${question.correct}`}
                </p>
                <p className="text-sm text-gray-600 leading-6">{question.explanation}</p>
              </div>
            )}

            {selectedAnswer && (
              <button
                onClick={nextQuestion}
                disabled={loading}
                className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-600 disabled:opacity-60"
              >
                {loading
                  ? 'Loading 10 questions...'
                  : currentIndex + 1 < questions.length
                    ? 'Next Question'
                    : 'Load 10 More'}
              </button>
            )}

            {pendingSaves > 0 && <p className="text-center text-xs text-gray-400">Saving progress...</p>}
            {saveError && <p className="text-center text-xs text-amber-600">{saveError}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
