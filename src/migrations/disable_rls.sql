-- =============================================
-- Disable RLS on all StudyFlow tables
-- Run this in Supabase SQL Editor
-- (Your server handles auth via Clerk, so RLS is not needed)
-- =============================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
