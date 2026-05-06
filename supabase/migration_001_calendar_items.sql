-- Migration 001: Calendar Items (Tasks + Events + Birthdays)
-- Run this against your Supabase project SQL editor.

-- 1. Add `kind` column (backfill existing rows as 'task')
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'task';

UPDATE public.tasks SET kind = 'task' WHERE kind IS NULL OR kind = '';

ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_kind_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_kind_check CHECK (kind IN ('task', 'event', 'birthday'));

-- 2. Add `birth_year` column (nullable; birthdays only)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS birth_year integer;

-- 3. Extend `repeat` to support 'yearly' (needed for birthdays and yearly events)
ALTER TABLE public.tasks
  DROP CONSTRAINT IF EXISTS tasks_repeat_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_repeat_check
  CHECK (repeat IN ('none', 'daily', 'weekly', 'monthly', 'yearly'));

-- 4. Optional composite index for kind-scoped queries
CREATE INDEX IF NOT EXISTS tasks_user_kind_start_idx
  ON public.tasks (user_id, kind, start_at);
