-- TestExcel contact/service-request form: schema + security policies.
-- Run this once in the Supabase SQL editor (Project → SQL Editor → New query).

create extension if not exists pgcrypto;

create table if not exists public.contact_submissions (
  id               uuid primary key default gen_random_uuid(),
  request_ref      text not null unique,          -- client-generated idempotency key, blocks duplicate inserts from double-click/retry
  full_name        text not null,
  company          text,
  email            text not null,
  role             text,
  service_interest text,
  message          text not null,
  source_page      text,
  status           text not null default 'New' check (status in ('New', 'Contacted', 'In Progress', 'Closed')),
  submitted_at     timestamptz not null default now()
);

create index if not exists contact_submissions_submitted_at_idx on public.contact_submissions (submitted_at desc);

-- Row Level Security: the frontend uses Supabase's public "anon" key. That key is
-- meant to be shipped to the browser (Supabase's own security model), but only if
-- RLS locks down exactly what it's allowed to do. Without these policies, RLS
-- defaults to deny-all once enabled, which is the safe starting point.
alter table public.contact_submissions enable row level security;

-- Anyone (anon key) may INSERT a new lead — this is the public contact form.
create policy "public can submit a contact request"
  on public.contact_submissions
  for insert
  to anon
  with check (true);

-- Nobody using the anon key may SELECT, UPDATE or DELETE.
-- (No select/update/delete policy is created for the anon role, so those
-- operations are denied by default — this is what stops a visitor or anyone
-- reading the frontend JS from browsing other people's submitted leads.)
-- Review and manage leads via the Supabase Table Editor / dashboard while
-- signed in as the project owner (service_role bypasses RLS), not via the
-- public anon key.
