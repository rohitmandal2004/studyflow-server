-- =============================================
-- StudyFlow Database Schema
-- Run this ONCE in your Supabase SQL Editor
-- (Dashboard > SQL Editor > New Query > Paste & Run)
-- =============================================

-- 1. Profiles
CREATE TABLE IF NOT EXISTS profiles (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id   text UNIQUE NOT NULL,
  name            text NOT NULL DEFAULT '',
  institution     text DEFAULT '',
  goal            text DEFAULT '',
  subjects        jsonb DEFAULT '[]'::jsonb,
  daily_target_hours numeric DEFAULT 4,
  target_date     date,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 2. Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id   text NOT NULL,
  title           text NOT NULL,
  subject         text DEFAULT '',
  priority        boolean DEFAULT false,
  done            boolean DEFAULT false,
  task_date       date DEFAULT CURRENT_DATE,
  created_at      timestamptz DEFAULT now()
);

-- 3. Habits
CREATE TABLE IF NOT EXISTS habits (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id   text NOT NULL,
  name            text NOT NULL,
  emoji           text DEFAULT '📖',
  target_days     int DEFAULT 7,
  color           text DEFAULT '#d4ff36',
  streak          int DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

-- 4. Habit Completions
CREATE TABLE IF NOT EXISTS habit_completions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id        uuid REFERENCES habits(id) ON DELETE CASCADE,
  clerk_user_id   text NOT NULL,
  completed_date  date NOT NULL,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

-- 5. Sessions (Deep Work)
CREATE TABLE IF NOT EXISTS sessions (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id     text NOT NULL,
  subject           text NOT NULL,
  topic             text DEFAULT '',
  duration_minutes  int NOT NULL DEFAULT 0,
  session_date      date DEFAULT CURRENT_DATE,
  notes             text DEFAULT '',
  created_at        timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON tasks(clerk_user_id, task_date);
CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_completions_habit ON habit_completions(habit_id, completed_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(clerk_user_id, session_date);
CREATE INDEX IF NOT EXISTS idx_profiles_clerk ON profiles(clerk_user_id);
