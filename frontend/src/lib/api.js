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