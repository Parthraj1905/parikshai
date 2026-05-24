-- MCQ Practice Progress and Weak Topics Tables

create table if not exists public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text,
  selected_answer text not null,
  correct_answer text not null,
  exam text not null,
  topic text not null default 'Random',
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.weak_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null,
  topic text not null,
  wrong_count integer not null default 1,
  created_at timestamptz not null default now(),
  constraint weak_topics_user_exam_topic_key unique (user_id, exam, topic)
);

-- Indexes for efficient queries
create index if not exists user_progress_user_id_idx
  on public.user_progress (user_id, created_at desc);

create index if not exists weak_topics_user_wrong_idx
  on public.weak_topics (user_id, wrong_count desc);

-- Enable RLS
alter table public.user_progress enable row level security;
alter table public.weak_topics enable row level security;

-- Policies for user_progress
drop policy if exists "Users can read own progress" on public.user_progress;
create policy "Users can read own progress"
  on public.user_progress for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own progress" on public.user_progress;
create policy "Users can insert own progress"
  on public.user_progress for insert
  with check (auth.uid() = user_id);

-- Policies for weak_topics
drop policy if exists "Users can read own weak topics" on public.weak_topics;
create policy "Users can read own weak topics"
  on public.weak_topics for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own weak topics" on public.weak_topics;
create policy "Users can insert own weak topics"
  on public.weak_topics for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own weak topics" on public.weak_topics;
create policy "Users can update own weak topics"
  on public.weak_topics for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
