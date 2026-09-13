-- Run this in the Supabase SQL editor.
-- Also create a public Storage bucket named `logos`.

create extension if not exists pgcrypto;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  company_name text not null,
  pitch text not null,
  description text not null default '',
  website_url text not null,
  logo_url text,
  email text not null,
  location text not null default '',
  founded_year text not null default '',
  team_size text not null default '',
  batch text not null default 'The Other 99%',
  activity_status text not null default 'Active',
  industries text[] not null default '{}',
  linkedin_url text not null default '',
  twitter_url text not null default '',
  primary_partner text not null default '',
  founders jsonb not null default '[]'::jsonb,
  jobs jsonb not null default '[]'::jsonb,
  hq_region text not null default 'Remote',
  is_nonprofit boolean not null default false,
  created_at timestamptz not null default now(),
  status text not null default 'live' check (status = 'live'),
  stripe_session_id text unique
);

alter table public.companies add column if not exists slug text;
alter table public.companies add column if not exists description text not null default '';
alter table public.companies add column if not exists location text not null default '';
alter table public.companies add column if not exists founded_year text not null default '';
alter table public.companies add column if not exists team_size text not null default '';
alter table public.companies add column if not exists batch text not null default 'The Other 99%';
alter table public.companies add column if not exists activity_status text not null default 'Active';
alter table public.companies add column if not exists industries text[] not null default '{}';
alter table public.companies add column if not exists linkedin_url text not null default '';
alter table public.companies add column if not exists twitter_url text not null default '';
alter table public.companies add column if not exists primary_partner text not null default '';
alter table public.companies add column if not exists founders jsonb not null default '[]'::jsonb;
alter table public.companies add column if not exists jobs jsonb not null default '[]'::jsonb;
alter table public.companies add column if not exists hq_region text not null default 'Remote';
alter table public.companies add column if not exists is_nonprofit boolean not null default false;

create unique index if not exists companies_slug_idx on public.companies (slug);
create index if not exists companies_created_at_idx on public.companies (created_at desc);

create table if not exists public.pending_listings (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  consumed_at timestamptz
);

alter table public.companies enable row level security;
alter table public.pending_listings enable row level security;

drop policy if exists "Public can read live companies" on public.companies;
create policy "Public can read live companies"
  on public.companies
  for select
  using (status = 'live');

insert into storage.buckets (id, name, public, file_size_limit)
values ('logos', 'logos', true, 2097152)
on conflict (id) do update set public = true, file_size_limit = 2097152;

drop policy if exists "Public read logos" on storage.objects;
create policy "Public read logos"
  on storage.objects
  for select
  using (bucket_id = 'logos');

-- Uploads use the service role key. Do not allow public inserts.
