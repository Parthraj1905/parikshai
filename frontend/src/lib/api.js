import axios from 'axios'
import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL

export async function sendMessage(exam, language, messages) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await axios.post(`${BASE}/api/chat`, {
    exam,
    language,
    messages
  }, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.data.reply
}

export async function getProgress() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await axios.get(`${BASE}/api/progress`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.data
}

export async function generateMCQ(exam, language, topic, count = 1) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await axios.post(`${BASE}/api/mcq/generate`, {
    exam,
    language,
    topic,
    count
  }, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.data
}

export async function submitMCQ({ questionId, selectedAnswer, correctAnswer, exam, topic }) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  const res = await axios.post(`${BASE}/api/mcq/submit`, {
    user_id: session?.user?.id,
    question_id: questionId,
    selected_answer: selectedAnswer,
    correct_answer: correctAnswer,
    exam,
    topic
  }, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return res.data
}
