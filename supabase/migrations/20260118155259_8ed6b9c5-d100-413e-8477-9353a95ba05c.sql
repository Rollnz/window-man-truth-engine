-- ================================
-- PhoneCall.bot Queue System (V1) - FIXED
-- Safe, idempotent Supabase migration
-- ================================

create extension if not exists pgcrypto;

-- ----------------
-- 1) Roles System
-- ----------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'moderator', 'user');
  end if;
end$$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Security definer role-check function
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  );
$$;

-- Lock down execute privileges
revoke all on function public.has_role(uuid, public.app_role) from public;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;

-- user_roles policies
drop policy if exists "admin_manage_user_roles" on public.user_roles;
create policy "admin_manage_user_roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "read_own_roles" on public.user_roles;
create policy "read_own_roles"
on public.user_roles
for select
to authenticated
using (user_id = auth.uid());

-- ---------------------------------
-- 2) Phone call enums (idempotent)
-- ---------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pending_call_status') then
    create type public.pending_call_status as enum
      ('pending','processing','called','completed','no_answer','failed','dead_letter','suppressed');
  end if;

  if not exists (select 1 from pg_type where typname = 'phone_call_status') then
    create type public.phone_call_status as enum
      ('pending','in_progress','completed','no_answer','failed','canceled');
  end if;

  if not exists (select 1 from pg_type where typname = 'phone_call_sentiment') then
    create type public.phone_call_sentiment as enum
      ('positive','neutral','negative');
  end if;
end$$;

-- ---------------------------------
-- 3) call_agents (routing config)
-- ---------------------------------
create table if not exists public.call_agents (
  id uuid primary key default gen_random_uuid(),
  source_tool text not null unique,
  agent_id text not null,
  first_message_template text not null,
  enabled boolean not null default true,
  webhook_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_call_agents_updated_at on public.call_agents;
create trigger trg_call_agents_updated_at
before update on public.call_agents
for each row execute function public.set_updated_at();

alter table public.call_agents enable row level security;

drop policy if exists "admin_read_call_agents" on public.call_agents;
create policy "admin_read_call_agents"
on public.call_agents
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

drop policy if exists "admin_manage_call_agents" on public.call_agents;
create policy "admin_manage_call_agents"
on public.call_agents
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- Seed placeholder agents (idempotent)
insert into public.call_agents (source_tool, agent_id, first_message_template, enabled)
values
  ('quote-scanner', 'PLACEHOLDER_AGENT_ID',
   'Hi, this is Window Man. I saw you just ran the Quote Scanner. Do you have a quick minute so I can explain what I found?',
   true),
  ('beat-your-quote', 'PLACEHOLDER_AGENT_ID',
   'Hi, Window Man here. We just received the quote you uploaded. I noticed a couple red flags—do you have 60 seconds?',
   true),
  ('consultation-booking', 'PLACEHOLDER_AGENT_ID',
   'Hi, this is Window Man. I saw you requested a free estimate/measurement. I can help you get this handled—do you have a minute?',
   true),
  ('fair-price-quiz', 'PLACEHOLDER_AGENT_ID',
   'Hi, Window Man here. I saw you used the Fair Price Quiz. Want me to sanity-check what that result means?',
   true)
on conflict (source_tool) do update
set
  agent_id = excluded.agent_id,
  first_message_template = excluded.first_message_template,
  enabled = excluded.enabled,
  updated_at = now();

-- ---------------------------------
-- 4) pending_calls (queue)
-- Uses created_date stored column for IMMUTABLE index
-- ---------------------------------
create table if not exists public.pending_calls (
  id uuid primary key default gen_random_uuid(),
  call_request_id uuid not null unique default gen_random_uuid(),
  lead_id uuid null,
  source_tool text not null,
  phone_e164 text not null,
  phone_hash text not null,
  agent_id text not null,
  first_message text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.pending_call_status not null default 'pending',
  scheduled_for timestamptz not null,
  next_attempt_at timestamptz not null default now(),
  attempt_count int not null default 0,
  provider_call_id text null,
  last_error text null,
  triggered_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Generated column for immutable date-based idempotency
  created_date date generated always as ((created_at at time zone 'UTC')::date) stored
);

drop trigger if exists trg_pending_calls_updated_at on public.pending_calls;
create trigger trg_pending_calls_updated_at
before update on public.pending_calls
for each row execute function public.set_updated_at();

alter table public.pending_calls enable row level security;

drop policy if exists "admin_read_pending_calls" on public.pending_calls;
create policy "admin_read_pending_calls"
on public.pending_calls
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

-- Idempotency: if lead_id exists, do not enqueue twice for same tool
create unique index if not exists ux_pending_calls_lead_source
on public.pending_calls (lead_id, source_tool)
where lead_id is not null;

-- Idempotency for lead_id null: prevent same phone/tool spamming in same day
-- Uses created_date stored column (immutable)
create unique index if not exists ux_pending_calls_phone_tool_day
on public.pending_calls (phone_hash, source_tool, created_date);

create index if not exists ix_pending_calls_due
on public.pending_calls (status, scheduled_for, next_attempt_at);

create index if not exists ix_pending_calls_call_request
on public.pending_calls (call_request_id);

-- ---------------------------------
-- 5) phone_call_logs (analytics)
-- ---------------------------------
create table if not exists public.phone_call_logs (
  id uuid primary key default gen_random_uuid(),
  call_request_id uuid not null references public.pending_calls(call_request_id) on delete restrict,
  lead_id uuid null,
  source_tool text not null,
  agent_id text not null,
  provider_call_id text null,
  call_status public.phone_call_status not null default 'pending',
  call_duration_sec int null,
  call_sentiment public.phone_call_sentiment null,
  recording_url text null,
  ai_notes text null,
  raw_outcome_payload jsonb null,
  triggered_at timestamptz not null default now(),
  ended_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_phone_call_logs_updated_at on public.phone_call_logs;
create trigger trg_phone_call_logs_updated_at
before update on public.phone_call_logs
for each row execute function public.set_updated_at();

alter table public.phone_call_logs enable row level security;

drop policy if exists "admin_read_phone_call_logs" on public.phone_call_logs;
create policy "admin_read_phone_call_logs"
on public.phone_call_logs
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create index if not exists ix_phone_call_logs_recent
on public.phone_call_logs (triggered_at desc);

create index if not exists ix_phone_call_logs_source
on public.phone_call_logs (source_tool);