-- Fix: Add missing columns to user_progress table
-- Run this in your Supabase SQL Editor

-- Add missing columns to user_progress
ALTER TABLE public.user_progress
  ADD COLUMN IF NOT EXISTS selected_answer TEXT,
  ADD COLUMN IF NOT EXISTS correct_answer TEXT,
  ADD COLUMN IF NOT EXISTS exam TEXT NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS topic TEXT NOT NULL DEFAULT 'Random';

-- Fix weak_topics table (remove 'subject' if present, ensure correct schema)
-- The code expects: user_id, exam, topic, wrong_count
-- Already existing columns are fine, just ensure the unique constraint exists
ALTER TABLE public.weak_topics
  DROP CONSTRAINT IF EXISTS weak_topics_user_exam_topic_key;

ALTER TABLE public.weak_topics
  ADD CONSTRAINT weak_topics_user_exam_topic_key UNIQUE (user_id, exam, topic);

-- Also apply the new gamification columns for the Study Path feature
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS target_exam TEXT DEFAULT 'GENERAL',
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS completed_modules INT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS current_streak INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date DATE;
