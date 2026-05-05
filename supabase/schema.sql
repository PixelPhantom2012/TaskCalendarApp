-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Tasks table
create table if not exists public.tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text,
  start_at timestamptz not null default now(),
  end_at timestamptz not null default now(),
  all_day boolean not null default false,
  repeat text not null default 'none' check (repeat in ('none', 'daily', 'weekly', 'monthly')),
  location text,
  color text not null default '#4A6FE3',
  tags text[] not null default '{}',
  notify_before_minutes integer not null default 10,
  deleted_dates text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.tasks enable row level security;

-- RLS Policies: users can only access their own tasks
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Index for faster queries by user and date
create index if not exists tasks_user_id_start_at_idx on public.tasks(user_id, start_at);

-- Existing deployments: add column if missing
-- alter table public.tasks add column if not exists deleted_dates text[] not null default '{}';
