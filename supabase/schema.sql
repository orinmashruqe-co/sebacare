-- Run this once in your free Supabase project's SQL Editor
-- Dashboard -> SQL Editor -> New Query -> Paste & Run

create table if not exists public.sebacare_users (
  id text primary key,
  mobile text unique not null,
  nid text,
  password_salt text not null,
  password_hash text not null,
  state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sebacare_users_nid
  on public.sebacare_users (nid)
  where nid is not null and nid <> '';

-- Lock down direct browser/anon access; only the Node server (service role key) reads/writes this table
alter table public.sebacare_users enable row level security;
grant all on table public.sebacare_users to service_role;
