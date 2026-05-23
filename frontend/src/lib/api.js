import axios from 'axios'
import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return { Authorization: `Bearer ${token}` }
}

export async function sendMessage(exam, language, messages, sessionId) {
  const headers = await authHeaders()
  const res = await axios.post(`${BASE}/api/chat`, {
    exam,
    language,
    messages,
    session_id: sessionId
  }, { headers })
  return res.data
}

export async function listChats() {
  const headers = await authHeaders()
  const res = await axios.get(`${BASE}/api/chats`, { headers })
  return res.data.chats
}

export async function getChat(sessionId) {
  const headers = await authHeaders()
  const res = await axios.get(`${BASE}/api/chats/${sessionId}`, { headers })
  return res.data
}

export async function createChat(exam, language, title) {
  const headers = await authHeaders()
  const res = await axios.post(`${BASE}/api/chats`, {
    exam,
    language,
    title
  }, { headers })
  return res.data.chat
}

export async function updateChat(sessionId, updates) {
  const headers = await authHeaders()
  const res = await axios.patch(`${BASE}/api/chats/${sessionId}`, updates, { headers })
  return res.data.chat
}

export async function deleteChat(sessionId) {
  const headers = await authHeaders()
  const res = await axios.delete(`${BASE}/api/chats/${sessionId}`, { headers })
  return res.data
}

export async function getProgress() {
  const headers = await authHeaders()

  const res = await axios.get(`${BASE}/api/progress`, {
    headers
  })
  return res.data
}

export async function generateMCQ(exam, language, topic, count = 1) {
  const headers = await authHeaders()

  const res = await axios.post(`${BASE}/api/mcq/generate`, {
    exam,
    language,
    topic,
    count
  }, {
    headers
  })
  return res.data
}

export async function submitMCQ({ questionId, selectedAnswer, correctAnswer, exam, topic }) {
  const { data: { session } } = await supabase.auth.getSession()
  const headers = await authHeaders()

  const res = await axios.post(`${BASE}/api/mcq/submit`, {
    user_id: session?.user?.id,
    question_id: questionId,
    selected_answer: selectedAnswer,
    correct_answer: correctAnswer,
    exam,
    topic
  }, {
    headers
  })
  return res.data
}
