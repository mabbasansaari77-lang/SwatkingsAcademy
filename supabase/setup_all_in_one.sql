-- ============================================================
-- Swat Kings Cricket Academy — COMPLETE DATABASE SETUP (all-in-one)
-- For a NEW project only. Paste into Supabase → SQL Editor → New query → Run.
-- Contains migrations 001–009 in order.
-- ============================================================

-- >>> migrations/20261025000001_schema.sql
-- =====================================================================
-- Swat Kings Cricket Academy — 001: core schema
-- Tables, constraints, indexes and timestamp triggers.
-- Security (RLS + grants) is in 002, functions in 003, storage in 004.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Shared helper: keep updated_at current
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- profiles: one row per Supabase Auth user. role decides admin access.
-- Rows are created by a trigger (003); role can only be changed by an
-- existing admin or from the Supabase SQL editor.
-- ---------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (char_length(full_name) <= 120),
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- site_settings: a single editable row of public academy information.
-- Everything here is intended for public display.
-- ---------------------------------------------------------------------
create table public.site_settings (
  id                 smallint primary key default 1 check (id = 1),
  academy_name       text not null default 'Swat Kings Cricket Academy' check (char_length(academy_name) between 2 and 120),
  hero_headline      text not null default 'BUILD YOUR GAME. OWN YOUR FUTURE.' check (char_length(hero_headline) <= 120),
  hero_subheading    text not null default 'Develop your cricket skills, discipline, confidence, and teamwork with Swat Kings Cricket Academy.' check (char_length(hero_subheading) <= 300),
  intro_text         text check (char_length(intro_text) <= 2000),
  about_text         text check (char_length(about_text) <= 8000),
  mission_text       text check (char_length(mission_text) <= 2000),
  philosophy_text    text check (char_length(philosophy_text) <= 4000),
  address            text check (char_length(address) <= 300),
  phone              text check (char_length(phone) <= 30),
  whatsapp           text check (char_length(whatsapp) <= 30),
  email              text check (char_length(email) <= 254),
  facebook_url       text check (facebook_url ~ '^https://'),
  instagram_url      text check (instagram_url ~ '^https://'),
  youtube_url        text check (youtube_url ~ '^https://'),
  tiktok_url         text check (tiktok_url ~ '^https://'),
  map_url            text check (map_url ~ '^https://'),
  training_schedule  text check (char_length(training_schedule) <= 2000),
  registration_open  boolean not null default true,
  updated_at         timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- coaches
-- qualifications may only be stored once an admin has ticked
-- qualifications_verified — enforced by a CHECK constraint.
-- ---------------------------------------------------------------------
create table public.coaches (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null check (char_length(name) between 2 and 120),
  role_title              text check (char_length(role_title) <= 120),
  specialisation          text check (char_length(specialisation) <= 200),
  bio                     text check (char_length(bio) <= 4000),
  qualifications          text check (char_length(qualifications) <= 2000),
  qualifications_verified boolean not null default false,
  photo_url               text check (char_length(photo_url) <= 1000),
  is_published            boolean not null default false,
  sort_order              integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint coaches_qualifications_must_be_verified
    check (qualifications is null or qualifications = '' or qualifications_verified)
);

-- ---------------------------------------------------------------------
-- programmes
-- Fees are optional free text; when empty the site shows
-- "Contact us for details".
-- ---------------------------------------------------------------------
create table public.programmes (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text not null check (char_length(name) between 2 and 120),
  category          text not null check (category in
                      ('beginner','intermediate','advanced','batting','bowling','wicketkeeping','fielding','fitness')),
  summary           text check (char_length(summary) <= 300),
  description       text check (char_length(description) <= 4000),
  age_group         text check (char_length(age_group) <= 80),
  schedule          text check (char_length(schedule) <= 300),
  location          text check (char_length(location) <= 200),
  coach_id          uuid references public.coaches (id) on delete set null,
  capacity          integer check (capacity is null or capacity between 0 and 1000),
  spots_available   integer check (spots_available is null or spots_available between 0 and 1000),
  fee_text          text check (char_length(fee_text) <= 120),
  status            text not null default 'open' check (status in ('open','waitlist','full','closed','coming_soon')),
  is_published      boolean not null default false,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint programmes_spots_within_capacity
    check (capacity is null or spots_available is null or spots_available <= capacity)
);
create index programmes_published_idx on public.programmes (is_published, sort_order);
create index programmes_coach_idx on public.programmes (coach_id);

-- ---------------------------------------------------------------------
-- teams
-- ---------------------------------------------------------------------
create table public.teams (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 120),
  age_group     text check (char_length(age_group) <= 80),
  description   text check (char_length(description) <= 2000),
  coach_id      uuid references public.coaches (id) on delete set null,
  is_published  boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index teams_coach_idx on public.teams (coach_id);

-- ---------------------------------------------------------------------
-- player_profiles: OPTIONAL public profiles.
-- Deliberately has NO date of birth, address, phone, email or link to
-- registrations. A profile can be public only after guardian/player
-- consent is recorded.
-- ---------------------------------------------------------------------
create table public.player_profiles (
  id                   uuid primary key default gen_random_uuid(),
  team_id              uuid references public.teams (id) on delete set null,
  display_name         text not null check (char_length(display_name) between 2 and 80),
  playing_role         text check (playing_role in ('batter','bowler','all_rounder','wicketkeeper')),
  batting_style        text check (char_length(batting_style) <= 60),
  bowling_style        text check (char_length(bowling_style) <= 60),
  approved_achievements text check (char_length(approved_achievements) <= 2000),
  photo_url            text check (char_length(photo_url) <= 1000),
  consent_confirmed    boolean not null default false,
  is_public            boolean not null default false,
  sort_order           integer not null default 0,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint player_profiles_public_requires_consent check (not is_public or consent_confirmed)
);
create index player_profiles_team_idx on public.player_profiles (team_id);

-- ---------------------------------------------------------------------
-- fixtures and match_results (one result per fixture)
-- ---------------------------------------------------------------------
create table public.fixtures (
  id            uuid primary key default gen_random_uuid(),
  team_id       uuid references public.teams (id) on delete set null,
  tournament    text check (char_length(tournament) <= 160),
  opponent      text not null check (char_length(opponent) between 2 and 160),
  venue         text check (char_length(venue) <= 200),
  match_date    timestamptz not null,
  match_format  text check (char_length(match_format) <= 60),
  home_away     text check (home_away in ('home','away','neutral')),
  status        text not null default 'scheduled' check (status in ('scheduled','postponed','cancelled','completed','abandoned')),
  notes         text check (char_length(notes) <= 1000),
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index fixtures_date_idx on public.fixtures (is_published, match_date);
create index fixtures_team_idx on public.fixtures (team_id);

create table public.match_results (
  id                 uuid primary key default gen_random_uuid(),
  fixture_id         uuid not null unique references public.fixtures (id) on delete cascade,
  outcome            text not null check (outcome in ('won','lost','tied','draw','no_result')),
  our_score          text check (char_length(our_score) <= 60),
  opponent_score     text check (char_length(opponent_score) <= 60),
  result_summary     text check (char_length(result_summary) <= 300),
  scorecard_summary  text check (char_length(scorecard_summary) <= 4000),
  player_of_match    text check (char_length(player_of_match) <= 80),
  is_published       boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- announcements (news)
-- ---------------------------------------------------------------------
create table public.announcements (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null check (char_length(title) between 3 and 200),
  excerpt          text check (char_length(excerpt) <= 400),
  body             text check (char_length(body) <= 20000),
  category         text not null default 'news' check (category in ('news','trials','fixtures','training','events','notice')),
  cover_image_url  text check (char_length(cover_image_url) <= 1000),
  cover_image_alt  text check (char_length(cover_image_alt) <= 200),
  status           text not null default 'draft' check (status in ('draft','published')),
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint announcements_published_needs_date check (status = 'draft' or published_at is not null)
);
create index announcements_public_idx on public.announcements (status, published_at desc);

-- ---------------------------------------------------------------------
-- gallery_items
-- Either an uploaded file in Storage (storage_path) or a YouTube link.
-- ---------------------------------------------------------------------
create table public.gallery_items (
  id                 uuid primary key default gen_random_uuid(),
  title              text check (char_length(title) <= 160),
  caption            text check (char_length(caption) <= 500),
  alt_text           text not null check (char_length(alt_text) between 3 and 200),
  category           text not null default 'training' check (category in ('training','matches','events','facilities','awards')),
  media_type         text not null check (media_type in ('image','video')),
  storage_path       text check (char_length(storage_path) <= 500),
  youtube_id         text check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  is_published       boolean not null default false,
  sort_order         integer not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint gallery_items_has_source check (
    (storage_path is not null and youtube_id is null)
    or (storage_path is null and youtube_id is not null and media_type = 'video')
  )
);
create index gallery_items_public_idx on public.gallery_items (is_published, sort_order, created_at desc);

-- ---------------------------------------------------------------------
-- registrations: PRIVATE. Inserted only through submit_registration().
-- No date of birth, ID documents or passwords are collected.
-- ---------------------------------------------------------------------
create table public.registrations (
  id                  uuid primary key default gen_random_uuid(),
  reference           text not null unique,
  player_name         text not null check (char_length(player_name) between 2 and 120),
  guardian_name       text check (char_length(guardian_name) <= 120),
  age_group           text not null check (age_group in ('under_10','under_12','under_14','under_16','under_19','adult')),
  phone               text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  email               text check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  programme_id        uuid references public.programmes (id) on delete set null,
  experience_level    text not null check (experience_level in ('none','school','club','district','higher')),
  experience_details  text check (char_length(experience_details) <= 1000),
  preferred_schedule  text not null check (preferred_schedule in ('weekday_mornings','weekday_evenings','weekends','flexible')),
  additional_info     text check (char_length(additional_info) <= 1500),
  guardian_consent    boolean not null default false,
  privacy_acknowledged boolean not null check (privacy_acknowledged),
  status              text not null default 'pending' check (status in ('pending','contacted','accepted','rejected')),
  admin_notes         text check (char_length(admin_notes) <= 2000),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint registrations_minor_needs_guardian check (
    age_group = 'adult' or (guardian_consent and guardian_name is not null and char_length(guardian_name) >= 2)
  )
);
create index registrations_status_idx on public.registrations (status, created_at desc);
create index registrations_programme_idx on public.registrations (programme_id);
create index registrations_created_idx on public.registrations (created_at desc);

-- ---------------------------------------------------------------------
-- contact_messages: PRIVATE. Inserted only through submit_contact_message().
-- ---------------------------------------------------------------------
create table public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 120),
  contact     text not null check (char_length(contact) between 5 and 254),
  subject     text not null check (char_length(subject) between 3 and 160),
  message     text not null check (char_length(message) between 10 and 4000),
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index contact_messages_created_idx on public.contact_messages (is_read, created_at desc);

-- ---------------------------------------------------------------------
-- submission_log: used only for rate limiting. Stores a one-way hash of
-- the visitor's IP, never the IP itself. Not readable through the API.
-- ---------------------------------------------------------------------
create table public.submission_log (
  id           bigint generated always as identity primary key,
  kind         text not null check (kind in ('registration','contact')),
  fingerprint  text not null,
  created_at   timestamptz not null default now()
);
create index submission_log_lookup_idx on public.submission_log (kind, fingerprint, created_at desc);
create index submission_log_created_idx on public.submission_log (created_at);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','site_settings','coaches','programmes','teams','player_profiles',
    'fixtures','match_results','announcements','gallery_items','registrations'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t
    );
  end loop;
end;
$$;

-- >>> migrations/20261025000002_auth_and_rls.sql
-- =====================================================================
-- Swat Kings Cricket Academy — 002: admin role, grants and Row Level Security
--
-- Principles
--  * Admin status lives in public.profiles.role and is checked on the
--    server with public.is_admin(). The browser can never supply a role.
--  * No API policy lets anyone insert or update a profile, so nobody can
--    grant themselves admin. Roles are changed in the Supabase SQL editor.
--  * Visitors (anon) can only SELECT rows that are explicitly published.
--  * registrations, contact_messages and submission_log are never
--    readable by visitors. Visitors submit through SECURITY DEFINER
--    functions in migration 003 instead of direct inserts.
-- =====================================================================

-- ---------------------------------------------------------------------
-- is_admin(): true only for a signed-in user whose profile role = 'admin'
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------
-- Create a 'user' profile automatically when someone is added in Auth.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120), 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill profiles for any users that existed before this migration.
insert into public.profiles (id, role)
select u.id, 'user' from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- Enable RLS on every table in the public schema
-- ---------------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.site_settings     enable row level security;
alter table public.coaches           enable row level security;
alter table public.programmes        enable row level security;
alter table public.teams             enable row level security;
alter table public.player_profiles   enable row level security;
alter table public.fixtures          enable row level security;
alter table public.match_results     enable row level security;
alter table public.announcements     enable row level security;
alter table public.gallery_items     enable row level security;
alter table public.registrations     enable row level security;
alter table public.contact_messages  enable row level security;
alter table public.submission_log    enable row level security;

-- ---------------------------------------------------------------------
-- Table privileges (defence in depth; RLS still applies on top)
-- Start from nothing, then grant only what is needed.
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

-- Public content: visitors may read (RLS limits them to published rows)
grant select on
  public.site_settings, public.coaches, public.programmes, public.teams,
  public.player_profiles, public.fixtures, public.match_results,
  public.announcements, public.gallery_items
to anon, authenticated;

-- Signed-in users may attempt writes; RLS allows them only for admins
grant insert, update, delete on
  public.coaches, public.programmes, public.teams, public.player_profiles,
  public.fixtures, public.match_results, public.announcements, public.gallery_items
to authenticated;
grant update on public.site_settings to authenticated;
grant select, update, delete on public.registrations to authenticated;
grant select, update, delete on public.contact_messages to authenticated;
grant select on public.profiles to authenticated;
-- submission_log: no grants at all for anon/authenticated.

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "profiles: users read own, admins read all"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
-- No insert/update/delete policies: roles change only via the SQL editor.

-- ---------------------------------------------------------------------
-- site_settings
-- ---------------------------------------------------------------------
create policy "site_settings: public read"
  on public.site_settings for select to anon, authenticated
  using (true);
create policy "site_settings: admin update"
  on public.site_settings for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- ---------------------------------------------------------------------
-- Helper macro for content tables: public read of published rows,
-- admin full access.
-- ---------------------------------------------------------------------

-- coaches
create policy "coaches: public read published"
  on public.coaches for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy "coaches: admin insert" on public.coaches for insert to authenticated
  with check ((select public.is_admin()));
create policy "coaches: admin update" on public.coaches for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "coaches: admin delete" on public.coaches for delete to authenticated
  using ((select public.is_admin()));

-- programmes
create policy "programmes: public read published"
  on public.programmes for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy "programmes: admin insert" on public.programmes for insert to authenticated
  with check ((select public.is_admin()));
create policy "programmes: admin update" on public.programmes for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "programmes: admin delete" on public.programmes for delete to authenticated
  using ((select public.is_admin()));

-- teams
create policy "teams: public read published"
  on public.teams for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy "teams: admin insert" on public.teams for insert to authenticated
  with check ((select public.is_admin()));
create policy "teams: admin update" on public.teams for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "teams: admin delete" on public.teams for delete to authenticated
  using ((select public.is_admin()));

-- player_profiles: public only when consented AND marked public AND team published (or no team)
create policy "player_profiles: public read approved"
  on public.player_profiles for select to anon, authenticated
  using (
    (is_public and consent_confirmed and (
      team_id is null or exists (select 1 from public.teams t where t.id = team_id and t.is_published)
    ))
    or (select public.is_admin())
  );
create policy "player_profiles: admin insert" on public.player_profiles for insert to authenticated
  with check ((select public.is_admin()));
create policy "player_profiles: admin update" on public.player_profiles for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "player_profiles: admin delete" on public.player_profiles for delete to authenticated
  using ((select public.is_admin()));

-- fixtures
create policy "fixtures: public read published"
  on public.fixtures for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy "fixtures: admin insert" on public.fixtures for insert to authenticated
  with check ((select public.is_admin()));
create policy "fixtures: admin update" on public.fixtures for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "fixtures: admin delete" on public.fixtures for delete to authenticated
  using ((select public.is_admin()));

-- match_results: public only when result AND its fixture are published
create policy "match_results: public read published"
  on public.match_results for select to anon, authenticated
  using (
    (is_published and exists (select 1 from public.fixtures f where f.id = fixture_id and f.is_published))
    or (select public.is_admin())
  );
create policy "match_results: admin insert" on public.match_results for insert to authenticated
  with check ((select public.is_admin()));
create policy "match_results: admin update" on public.match_results for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "match_results: admin delete" on public.match_results for delete to authenticated
  using ((select public.is_admin()));

-- announcements: public only when published and the publish date has arrived
create policy "announcements: public read published"
  on public.announcements for select to anon, authenticated
  using ((status = 'published' and published_at <= now()) or (select public.is_admin()));
create policy "announcements: admin insert" on public.announcements for insert to authenticated
  with check ((select public.is_admin()));
create policy "announcements: admin update" on public.announcements for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "announcements: admin delete" on public.announcements for delete to authenticated
  using ((select public.is_admin()));

-- gallery_items
create policy "gallery_items: public read published"
  on public.gallery_items for select to anon, authenticated
  using (is_published or (select public.is_admin()));
create policy "gallery_items: admin insert" on public.gallery_items for insert to authenticated
  with check ((select public.is_admin()));
create policy "gallery_items: admin update" on public.gallery_items for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "gallery_items: admin delete" on public.gallery_items for delete to authenticated
  using ((select public.is_admin()));

-- registrations: admins only. No insert policy — inserts go through
-- public.submit_registration() (SECURITY DEFINER) in migration 003.
create policy "registrations: admin read" on public.registrations for select to authenticated
  using ((select public.is_admin()));
create policy "registrations: admin update" on public.registrations for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "registrations: admin delete" on public.registrations for delete to authenticated
  using ((select public.is_admin()));

-- contact_messages: admins only. Inserts go through submit_contact_message().
create policy "contact_messages: admin read" on public.contact_messages for select to authenticated
  using ((select public.is_admin()));
create policy "contact_messages: admin update" on public.contact_messages for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "contact_messages: admin delete" on public.contact_messages for delete to authenticated
  using ((select public.is_admin()));

-- submission_log: RLS enabled with no policies = no API access at all.

-- ---------------------------------------------------------------------
-- Make sure tables created later are NOT automatically exposed.
-- ---------------------------------------------------------------------
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

-- >>> migrations/20261025000003_public_submission_functions.sql
-- =====================================================================
-- Swat Kings Cricket Academy — 003: public submission functions
--
-- Visitors cannot INSERT into registrations or contact_messages directly
-- (there is no insert grant or policy). Instead they call these RPC
-- functions, which run with the owner's rights (SECURITY DEFINER) and:
--   1. re-validate every field on the server,
--   2. silently drop bot submissions caught by the honeypot field,
--   3. rate-limit by a SHA-256 hash of the caller's IP address,
--   4. insert a row with status 'pending' and return only a reference.
-- They never return any stored data.
--
-- Trade-off vs. an Edge Function: no extra service or secret to deploy
-- (works on the free tier with zero config). IP-based limits rely on
-- request headers set by Supabase's gateway; a determined attacker with
-- many IPs can still submit spam, so there is also a global hourly cap.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Internal helper: hashed caller fingerprint (never stores the raw IP)
-- ---------------------------------------------------------------------
create or replace function public.request_fingerprint()
returns text
language plpgsql
stable
set search_path = ''
as $$
declare
  headers json;
  ip text;
begin
  begin
    headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    headers := null;
  end;

  ip := coalesce(
    headers ->> 'cf-connecting-ip',
    headers ->> 'x-real-ip',
    split_part(coalesce(headers ->> 'x-forwarded-for', ''), ',', 1),
    ''
  );
  ip := nullif(trim(ip), '');

  return encode(sha256(convert_to('skca:' || coalesce(ip, 'unknown'), 'UTF8')), 'hex');
end;
$$;

revoke all on function public.request_fingerprint() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Internal helper: rate limit check + log. Raises an error when blocked.
-- ---------------------------------------------------------------------
create or replace function public.enforce_rate_limit(p_kind text, p_per_hour integer, p_global_per_hour integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  fp text := public.request_fingerprint();
  recent integer;
  global_recent integer;
begin
  -- housekeeping: keep the log small
  delete from public.submission_log where created_at < now() - interval '2 days';

  select count(*) into recent
  from public.submission_log
  where kind = p_kind and fingerprint = fp and created_at > now() - interval '1 hour';

  if recent >= p_per_hour then
    raise exception 'Too many submissions. Please wait an hour and try again.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;

  select count(*) into global_recent
  from public.submission_log
  where kind = p_kind and created_at > now() - interval '1 hour';

  if global_recent >= p_global_per_hour then
    raise exception 'We are receiving a lot of submissions right now. Please try again later.'
      using errcode = 'P0001', hint = 'rate_limited';
  end if;

  insert into public.submission_log (kind, fingerprint) values (p_kind, fp);
end;
$$;

revoke all on function public.enforce_rate_limit(text, integer, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Internal helper: trim text, convert empty to null, cap length
-- ---------------------------------------------------------------------
create or replace function public.clean_text(p_value text, p_max integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(left(btrim(coalesce(p_value, '')), p_max), '');
$$;

revoke all on function public.clean_text(text, integer) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- submit_registration(payload jsonb) → { reference }
-- ---------------------------------------------------------------------
create or replace function public.submit_registration(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player_name    text := public.clean_text(payload ->> 'player_name', 121);
  v_guardian_name  text := public.clean_text(payload ->> 'guardian_name', 121);
  v_age_group      text := public.clean_text(payload ->> 'age_group', 20);
  v_phone          text := public.clean_text(payload ->> 'phone', 21);
  v_email          text := lower(public.clean_text(payload ->> 'email', 255));
  v_programme_text text := public.clean_text(payload ->> 'programme_id', 40);
  v_programme_id   uuid;
  v_experience     text := public.clean_text(payload ->> 'experience_level', 20);
  v_exp_details    text := public.clean_text(payload ->> 'experience_details', 1001);
  v_schedule       text := public.clean_text(payload ->> 'preferred_schedule', 30);
  v_additional     text := public.clean_text(payload ->> 'additional_info', 1501);
  v_consent        boolean := coalesce((payload ->> 'guardian_consent')::boolean, false);
  v_privacy        boolean := coalesce((payload ->> 'privacy_acknowledged')::boolean, false);
  v_honeypot       text := public.clean_text(payload ->> 'website', 200);
  v_open           boolean;
  v_reference      text;
  v_attempt        integer := 0;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Invalid submission.' using errcode = '22023';
  end if;

  -- Honeypot: real people never see or fill this field. Pretend success.
  if v_honeypot is not null then
    return jsonb_build_object('reference', 'SK-' || upper(substr(md5(random()::text), 1, 8)));
  end if;

  select s.registration_open into v_open from public.site_settings s where s.id = 1;
  if not coalesce(v_open, true) then
    raise exception 'Registrations are currently closed.' using errcode = 'P0001', hint = 'closed';
  end if;

  -- Field validation (mirrors the browser rules; never trust the client)
  if v_player_name is null or char_length(v_player_name) < 2 or char_length(v_player_name) > 120 then
    raise exception 'Please enter the player''s full name (2–120 characters).' using errcode = '22023';
  end if;
  if v_age_group is null or v_age_group not in ('under_10','under_12','under_14','under_16','under_19','adult') then
    raise exception 'Please choose a valid age group.' using errcode = '22023';
  end if;
  if v_phone is null or v_phone !~ '^\+?[0-9 ()-]{7,20}$' then
    raise exception 'Please enter a valid contact phone number.' using errcode = '22023';
  end if;
  if v_email is not null and (v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254) then
    raise exception 'Please enter a valid email address or leave it empty.' using errcode = '22023';
  end if;
  if v_experience is null or v_experience not in ('none','school','club','district','higher') then
    raise exception 'Please choose your previous cricket experience.' using errcode = '22023';
  end if;
  if v_schedule is null or v_schedule not in ('weekday_mornings','weekday_evenings','weekends','flexible') then
    raise exception 'Please choose a preferred training schedule.' using errcode = '22023';
  end if;
  if v_exp_details is not null and char_length(v_exp_details) > 1000 then
    raise exception 'Experience details are too long (max 1000 characters).' using errcode = '22023';
  end if;
  if v_additional is not null and char_length(v_additional) > 1500 then
    raise exception 'Additional information is too long (max 1500 characters).' using errcode = '22023';
  end if;
  if v_age_group <> 'adult' then
    if v_guardian_name is null or char_length(v_guardian_name) < 2 or char_length(v_guardian_name) > 120 then
      raise exception 'A parent or guardian name is required for players under 19.' using errcode = '22023';
    end if;
    if not v_consent then
      raise exception 'Parent or guardian consent is required for players under 19.' using errcode = '22023';
    end if;
  end if;
  if not v_privacy then
    raise exception 'Please confirm you have read the privacy notice.' using errcode = '22023';
  end if;

  if v_programme_text is not null then
    begin
      v_programme_id := v_programme_text::uuid;
    exception when invalid_text_representation then
      raise exception 'Please choose a valid programme.' using errcode = '22023';
    end;
    if not exists (
      select 1 from public.programmes p
      where p.id = v_programme_id and p.is_published and p.status <> 'closed'
    ) then
      raise exception 'The selected programme is not accepting registrations.' using errcode = '22023';
    end if;
  end if;

  -- Rate limit: 3 per hour per visitor, 120 per hour overall
  perform public.enforce_rate_limit('registration', 3, 120);

  loop
    v_attempt := v_attempt + 1;
    v_reference := 'SK-' || to_char(now() at time zone 'Asia/Karachi', 'YYMM') || '-'
                   || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.registrations (
        reference, player_name, guardian_name, age_group, phone, email, programme_id,
        experience_level, experience_details, preferred_schedule, additional_info,
        guardian_consent, privacy_acknowledged, status
      ) values (
        v_reference, v_player_name,
        v_guardian_name,
        v_age_group, v_phone, v_email, v_programme_id,
        v_experience, v_exp_details, v_schedule, v_additional,
        v_consent, v_privacy, 'pending'
      );
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise;
      end if;
    end;
  end loop;

  return jsonb_build_object('reference', v_reference);
end;
$$;

revoke all on function public.submit_registration(jsonb) from public;
grant execute on function public.submit_registration(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- submit_contact_message(payload jsonb) → { ok: true }
-- ---------------------------------------------------------------------
create or replace function public.submit_contact_message(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name     text := public.clean_text(payload ->> 'name', 121);
  v_contact  text := public.clean_text(payload ->> 'contact', 255);
  v_subject  text := public.clean_text(payload ->> 'subject', 161);
  v_message  text := public.clean_text(payload ->> 'message', 4001);
  v_honeypot text := public.clean_text(payload ->> 'website', 200);
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Invalid submission.' using errcode = '22023';
  end if;

  if v_honeypot is not null then
    return jsonb_build_object('ok', true);
  end if;

  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'Please enter your name (2–120 characters).' using errcode = '22023';
  end if;
  if v_contact is null or char_length(v_contact) < 5 or char_length(v_contact) > 254
     or not (v_contact ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or v_contact ~ '^\+?[0-9 ()-]{7,20}$') then
    raise exception 'Please enter a valid email address or phone number.' using errcode = '22023';
  end if;
  if v_subject is null or char_length(v_subject) < 3 or char_length(v_subject) > 160 then
    raise exception 'Please enter a subject (3–160 characters).' using errcode = '22023';
  end if;
  if v_message is null or char_length(v_message) < 10 or char_length(v_message) > 4000 then
    raise exception 'Please enter a message (10–4000 characters).' using errcode = '22023';
  end if;

  -- Rate limit: 5 per hour per visitor, 200 per hour overall
  perform public.enforce_rate_limit('contact', 5, 200);

  insert into public.contact_messages (name, contact, subject, message)
  values (v_name, v_contact, v_subject, v_message);

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.submit_contact_message(jsonb) from public;
grant execute on function public.submit_contact_message(jsonb) to anon, authenticated;

-- >>> migrations/20261025000004_storage.sql
-- =====================================================================
-- Swat Kings Cricket Academy — 004: Supabase Storage for public media
--
-- Bucket "public-media" holds ONLY media approved for the public website:
-- gallery photos/videos, coach photos, news cover images and consented
-- player photos. Never upload registration documents here.
--
-- * Public bucket: files are served by URL so pages load fast without
--   signed URLs. Files are stored under random UUID names, and there is
--   no SELECT policy for visitors, so the bucket cannot be listed.
--   Trade-off: anyone who has a file's exact URL can view it, even if the
--   gallery item is unpublished. Delete files you do not want public.
-- * Only admins (public.is_admin()) may upload, replace or delete.
-- * Allowed types: JPEG, PNG, WebP, AVIF, MP4, WebM. Max 25 MB per file
--   (free tier storage is limited, so keep videos short or use YouTube).
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-media',
  'public-media',
  true,
  26214400,
  array['image/jpeg','image/png','image/webp','image/avif','video/mp4','video/webm']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Admins can see the bucket contents in the dashboard / API (needed for
-- update & delete). Visitors get no SELECT policy => no listing.
create policy "public-media: admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'public-media' and (select public.is_admin()));

create policy "public-media: admin upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-media'
    and (select public.is_admin())
    and (storage.foldername(name))[1] in ('gallery','coaches','news','players')
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','avif','mp4','webm')
  );

create policy "public-media: admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'public-media' and (select public.is_admin()))
  with check (bucket_id = 'public-media' and (select public.is_admin()));

create policy "public-media: admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'public-media' and (select public.is_admin()));

-- >>> migrations/20261026000005_player_media.sql
-- =====================================================================
-- Swat Kings Cricket Academy — 005: player profile pages with photos & videos
--
-- * player_profiles.bio: an approved "about the player" text.
-- * player_media: photos/videos for a player's public profile page.
--   Media is public ONLY when the player profile itself is public,
--   consent is confirmed, and the player's team (if any) is published —
--   exactly the same rule as the profile. Admins manage everything.
-- Safe to run more than once.
-- =====================================================================

alter table public.player_profiles
  add column if not exists bio text check (char_length(bio) <= 3000);

create table if not exists public.player_media (
  id            uuid primary key default gen_random_uuid(),
  player_id     uuid not null references public.player_profiles (id) on delete cascade,
  media_type    text not null check (media_type in ('image','video')),
  storage_path  text check (char_length(storage_path) <= 500),
  youtube_id    text check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  caption       text check (char_length(caption) <= 300),
  alt_text      text not null check (char_length(alt_text) between 3 and 200),
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  constraint player_media_has_source check (
    (storage_path is not null and youtube_id is null)
    or (storage_path is null and youtube_id is not null and media_type = 'video')
  )
);
create index if not exists player_media_player_idx on public.player_media (player_id, sort_order, created_at);

alter table public.player_media enable row level security;

revoke all on public.player_media from anon, authenticated;
grant select on public.player_media to anon, authenticated;
grant insert, update, delete on public.player_media to authenticated;

drop policy if exists "player_media: public read approved" on public.player_media;
create policy "player_media: public read approved"
  on public.player_media for select to anon, authenticated
  using (
    exists (
      select 1 from public.player_profiles p
      where p.id = player_id
        and p.is_public and p.consent_confirmed
        and (p.team_id is null or exists (select 1 from public.teams t where t.id = p.team_id and t.is_published))
    )
    or (select public.is_admin())
  );

drop policy if exists "player_media: admin insert" on public.player_media;
create policy "player_media: admin insert" on public.player_media for insert to authenticated
  with check ((select public.is_admin()));
drop policy if exists "player_media: admin update" on public.player_media;
create policy "player_media: admin update" on public.player_media for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "player_media: admin delete" on public.player_media;
create policy "player_media: admin delete" on public.player_media for delete to authenticated
  using ((select public.is_admin()));

-- >>> migrations/20261026000006_page_banners.sql
-- =====================================================================
-- Swat Kings Cricket Academy — 006: page banners + home page media
--
-- * page_banners: one optional background photo or video per public page
--   (home hero, about, programmes, ...). Public can read; admins manage.
-- * gallery_items.featured: choose which gallery photos/videos appear
--   on the home page.
-- * Storage: allow admin uploads into a new "pages/" folder.
-- Safe to run more than once.
-- =====================================================================

create table if not exists public.page_banners (
  page          text primary key check (page in
                  ('home','about','programmes','coaches','teams','fixtures','news','gallery','register','contact')),
  media_type    text not null check (media_type in ('image','video')),
  storage_path  text not null check (char_length(storage_path) <= 500),
  alt_text      text not null check (char_length(alt_text) between 3 and 200),
  updated_at    timestamptz not null default now()
);

alter table public.page_banners enable row level security;
revoke all on public.page_banners from anon, authenticated;
grant select on public.page_banners to anon, authenticated;
grant insert, update, delete on public.page_banners to authenticated;

drop policy if exists "page_banners: public read" on public.page_banners;
create policy "page_banners: public read" on public.page_banners for select to anon, authenticated using (true);
drop policy if exists "page_banners: admin insert" on public.page_banners;
create policy "page_banners: admin insert" on public.page_banners for insert to authenticated
  with check ((select public.is_admin()));
drop policy if exists "page_banners: admin update" on public.page_banners;
create policy "page_banners: admin update" on public.page_banners for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "page_banners: admin delete" on public.page_banners;
create policy "page_banners: admin delete" on public.page_banners for delete to authenticated
  using ((select public.is_admin()));

drop trigger if exists page_banners_set_updated_at on public.page_banners;
create trigger page_banners_set_updated_at before update on public.page_banners
  for each row execute function public.set_updated_at();

-- Home page selection for gallery items
alter table public.gallery_items add column if not exists featured boolean not null default false;
create index if not exists gallery_items_featured_idx on public.gallery_items (featured, is_published, sort_order);

-- Storage: allow the new "pages" folder for admin uploads
drop policy if exists "public-media: admin upload" on storage.objects;
create policy "public-media: admin upload"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'public-media'
    and (select public.is_admin())
    and (storage.foldername(name))[1] in ('gallery','coaches','news','players','pages')
    and lower(storage.extension(name)) in ('jpg','jpeg','png','webp','avif','mp4','webm')
  );

-- >>> migrations/20261026000007_faqs.sql
-- =====================================================================
-- Swat Kings Cricket Academy — 007: Frequently asked questions
-- Admin-editable questions and answers shown on the home page and /faq,
-- and published as FAQ structured data for search engines and AI assistants.
-- Safe to run more than once.
-- =====================================================================

create table if not exists public.faqs (
  id            uuid primary key default gen_random_uuid(),
  question      text not null check (char_length(question) between 5 and 200),
  answer        text not null check (char_length(answer) between 5 and 2000),
  is_published  boolean not null default false,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists faqs_public_idx on public.faqs (is_published, sort_order);

alter table public.faqs enable row level security;
revoke all on public.faqs from anon, authenticated;
grant select on public.faqs to anon, authenticated;
grant insert, update, delete on public.faqs to authenticated;

drop policy if exists "faqs: public read published" on public.faqs;
create policy "faqs: public read published" on public.faqs for select to anon, authenticated
  using (is_published or (select public.is_admin()));
drop policy if exists "faqs: admin insert" on public.faqs;
create policy "faqs: admin insert" on public.faqs for insert to authenticated with check ((select public.is_admin()));
drop policy if exists "faqs: admin update" on public.faqs;
create policy "faqs: admin update" on public.faqs for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "faqs: admin delete" on public.faqs;
create policy "faqs: admin delete" on public.faqs for delete to authenticated using ((select public.is_admin()));

drop trigger if exists faqs_set_updated_at on public.faqs;
create trigger faqs_set_updated_at before update on public.faqs
  for each row execute function public.set_updated_at();

-- >>> migrations/20261026000008_player_registration.sql
-- =====================================================================
-- Swat Kings Cricket Academy — 008: Player Registration with photos,
-- and "Accept" adds the player to the public players page.
--
-- * registrations gets cricket-profile fields, up to 3 photo paths, and
--   public_profile_consent ("show this player on the website if accepted").
-- * New PRIVATE bucket "registration-photos": visitors may only UPLOAD new
--   images under pending/. Nobody but admins can list, view or delete them.
-- * submit_registration() now accepts and checks the new fields/photos.
-- * accept_registration() (admins only) marks the registration accepted
--   and, ONLY when public consent was given (and guardian consent for
--   under-19s), creates/updates a player_profiles row with public-safe
--   fields: name, photo, role, styles, achievements, bio. Never phone,
--   email, guardian name or age group.
-- Safe to run more than once.
-- =====================================================================

alter table public.registrations
  add column if not exists playing_role text check (playing_role in ('batter','bowler','all_rounder','wicketkeeper')),
  add column if not exists batting_style text check (char_length(batting_style) <= 60),
  add column if not exists bowling_style text check (char_length(bowling_style) <= 60),
  add column if not exists achievements text check (char_length(achievements) <= 2000),
  add column if not exists about_player text check (char_length(about_player) <= 1000),
  add column if not exists photo_paths text[] not null default '{}' check (cardinality(photo_paths) <= 3),
  add column if not exists public_profile_consent boolean not null default false,
  add column if not exists player_profile_id uuid references public.player_profiles (id) on delete set null;

-- ---------------------------------------------------------------------
-- Private bucket for registration photos (5 MB, images only)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('registration-photos', 'registration-photos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "registration-photos: visitor upload" on storage.objects;
create policy "registration-photos: visitor upload"
  on storage.objects for insert to anon, authenticated
  with check (
    bucket_id = 'registration-photos'
    and (storage.foldername(name))[1] = 'pending'
    and lower(storage.extension(name)) in ('jpg','png','webp')
  );

drop policy if exists "registration-photos: admin read" on storage.objects;
create policy "registration-photos: admin read"
  on storage.objects for select to authenticated
  using (bucket_id = 'registration-photos' and (select public.is_admin()));

drop policy if exists "registration-photos: admin delete" on storage.objects;
create policy "registration-photos: admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'registration-photos' and (select public.is_admin()));

-- ---------------------------------------------------------------------
-- submit_registration(payload jsonb) → { reference }   (replaces 003)
-- ---------------------------------------------------------------------
create or replace function public.submit_registration(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_player_name    text := public.clean_text(payload ->> 'player_name', 121);
  v_guardian_name  text := public.clean_text(payload ->> 'guardian_name', 121);
  v_age_group      text := public.clean_text(payload ->> 'age_group', 20);
  v_phone          text := public.clean_text(payload ->> 'phone', 21);
  v_email          text := lower(public.clean_text(payload ->> 'email', 255));
  v_programme_text text := public.clean_text(payload ->> 'programme_id', 40);
  v_programme_id   uuid;
  v_experience     text := public.clean_text(payload ->> 'experience_level', 20);
  v_exp_details    text := public.clean_text(payload ->> 'experience_details', 1001);
  v_schedule       text := public.clean_text(payload ->> 'preferred_schedule', 30);
  v_additional     text := public.clean_text(payload ->> 'additional_info', 1501);
  v_consent        boolean := coalesce((payload ->> 'guardian_consent')::boolean, false);
  v_privacy        boolean := coalesce((payload ->> 'privacy_acknowledged')::boolean, false);
  v_honeypot       text := public.clean_text(payload ->> 'website', 200);
  v_role           text := public.clean_text(payload ->> 'playing_role', 20);
  v_batting        text := public.clean_text(payload ->> 'batting_style', 61);
  v_bowling        text := public.clean_text(payload ->> 'bowling_style', 61);
  v_achievements   text := public.clean_text(payload ->> 'achievements', 2001);
  v_about          text := public.clean_text(payload ->> 'about_player', 1001);
  v_public_consent boolean := coalesce((payload ->> 'public_profile_consent')::boolean, false);
  v_photos         text[] := '{}';
  v_photo          text;
  v_open           boolean;
  v_reference      text;
  v_attempt        integer := 0;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Invalid submission.' using errcode = '22023';
  end if;

  -- Honeypot: real people never see or fill this field. Pretend success.
  if v_honeypot is not null then
    return jsonb_build_object('reference', 'SK-' || upper(substr(md5(random()::text), 1, 8)));
  end if;

  select s.registration_open into v_open from public.site_settings s where s.id = 1;
  if not coalesce(v_open, true) then
    raise exception 'Registrations are currently closed.' using errcode = 'P0001', hint = 'closed';
  end if;

  -- Field validation (mirrors the browser rules; never trust the client)
  if v_player_name is null or char_length(v_player_name) < 2 or char_length(v_player_name) > 120 then
    raise exception 'Please enter the player''s full name (2–120 characters).' using errcode = '22023';
  end if;
  if v_age_group is null or v_age_group not in ('under_10','under_12','under_14','under_16','under_19','adult') then
    raise exception 'Please choose a valid age group.' using errcode = '22023';
  end if;
  if v_phone is null or v_phone !~ '^\+?[0-9 ()-]{7,20}$' then
    raise exception 'Please enter a valid contact phone number.' using errcode = '22023';
  end if;
  if v_email is not null and (v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 254) then
    raise exception 'Please enter a valid email address or leave it empty.' using errcode = '22023';
  end if;
  if v_experience is null or v_experience not in ('none','school','club','district','higher') then
    raise exception 'Please choose your previous cricket experience.' using errcode = '22023';
  end if;
  if v_schedule is null or v_schedule not in ('weekday_mornings','weekday_evenings','weekends','flexible') then
    raise exception 'Please choose a preferred training schedule.' using errcode = '22023';
  end if;
  if v_exp_details is not null and char_length(v_exp_details) > 1000 then
    raise exception 'Experience details are too long (max 1000 characters).' using errcode = '22023';
  end if;
  if v_additional is not null and char_length(v_additional) > 1500 then
    raise exception 'Additional information is too long (max 1500 characters).' using errcode = '22023';
  end if;
  if v_age_group <> 'adult' then
    if v_guardian_name is null or char_length(v_guardian_name) < 2 or char_length(v_guardian_name) > 120 then
      raise exception 'A parent or guardian name is required for players under 19.' using errcode = '22023';
    end if;
    if not v_consent then
      raise exception 'Parent or guardian consent is required for players under 19.' using errcode = '22023';
    end if;
  end if;
  if not v_privacy then
    raise exception 'Please confirm you have read the privacy notice.' using errcode = '22023';
  end if;

  if v_role is not null and v_role not in ('batter','bowler','all_rounder','wicketkeeper') then
    raise exception 'Please choose a valid playing role.' using errcode = '22023';
  end if;
  if (v_batting is not null and char_length(v_batting) > 60) or (v_bowling is not null and char_length(v_bowling) > 60) then
    raise exception 'Batting or bowling style is too long (max 60 characters).' using errcode = '22023';
  end if;
  if v_achievements is not null and char_length(v_achievements) > 2000 then
    raise exception 'Achievements are too long (max 2000 characters).' using errcode = '22023';
  end if;
  if v_about is not null and char_length(v_about) > 1000 then
    raise exception 'About the player is too long (max 1000 characters).' using errcode = '22023';
  end if;

  -- Photos: up to 3 files the visitor has just uploaded to the PRIVATE
  -- registration-photos bucket under pending/<uuid>.<ext>. Each must exist
  -- and must not already belong to another registration.
  if payload ? 'photo_paths' and jsonb_typeof(payload -> 'photo_paths') = 'array' then
    if jsonb_array_length(payload -> 'photo_paths') > 3 then
      raise exception 'You can upload up to 3 photos.' using errcode = '22023';
    end if;
    for v_photo in select jsonb_array_elements_text(payload -> 'photo_paths') loop
      if v_photo !~ '^pending/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
         or v_photo = any (v_photos)
         or not exists (select 1 from storage.objects o where o.bucket_id = 'registration-photos' and o.name = v_photo)
         or exists (select 1 from public.registrations r where v_photo = any (r.photo_paths)) then
        raise exception 'A photo could not be attached. Please upload it again.' using errcode = '22023';
      end if;
      v_photos := v_photos || v_photo;
    end loop;
  end if;

  if v_programme_text is not null then
    begin
      v_programme_id := v_programme_text::uuid;
    exception when invalid_text_representation then
      raise exception 'Please choose a valid programme.' using errcode = '22023';
    end;
    if not exists (
      select 1 from public.programmes p
      where p.id = v_programme_id and p.is_published and p.status <> 'closed'
    ) then
      raise exception 'The selected programme is not accepting registrations.' using errcode = '22023';
    end if;
  end if;

  -- Rate limit: 3 per hour per visitor, 120 per hour overall
  perform public.enforce_rate_limit('registration', 3, 120);

  loop
    v_attempt := v_attempt + 1;
    v_reference := 'SK-' || to_char(now() at time zone 'Asia/Karachi', 'YYMM') || '-'
                   || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.registrations (
        reference, player_name, guardian_name, age_group, phone, email, programme_id,
        experience_level, experience_details, preferred_schedule, additional_info,
        guardian_consent, privacy_acknowledged, status,
        playing_role, batting_style, bowling_style, achievements, about_player,
        photo_paths, public_profile_consent
      ) values (
        v_reference, v_player_name,
        v_guardian_name,
        v_age_group, v_phone, v_email, v_programme_id,
        v_experience, v_exp_details, v_schedule, v_additional,
        v_consent, v_privacy, 'pending',
        v_role, v_batting, v_bowling, v_achievements, v_about,
        v_photos, v_public_consent
      );
      exit;
    exception when unique_violation then
      if v_attempt >= 5 then
        raise;
      end if;
    end;
  end loop;

  return jsonb_build_object('reference', v_reference);
end;
$$;

revoke all on function public.submit_registration(jsonb) from public;
grant execute on function public.submit_registration(jsonb) to anon, authenticated;

-- ---------------------------------------------------------------------
-- accept_registration(id, photo, extra photos) → player profile id or null
-- Admins only. Photos must already be copied by the admin panel into the
-- public bucket under players/ (the admin panel does this automatically).
-- ---------------------------------------------------------------------
create or replace function public.accept_registration(
  p_id uuid,
  p_photo_path text default null,
  p_extra_photos text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  r       public.registrations%rowtype;
  v_pid   uuid;
  v_path  text;
  v_n     integer := 0;
  v_show  boolean;
begin
  if not public.is_admin() then
    raise exception 'Only academy admins can accept registrations.' using errcode = '42501';
  end if;

  select * into r from public.registrations where id = p_id for update;
  if not found then
    raise exception 'Registration not found.' using errcode = '22023';
  end if;

  foreach v_path in array (array[p_photo_path] || coalesce(p_extra_photos, '{}')) loop
    if v_path is not null and v_path !~ '^players/[0-9a-f-]{36}\.(jpg|png|webp)$' then
      raise exception 'Invalid photo path.' using errcode = '22023';
    end if;
  end loop;

  v_show := r.public_profile_consent and (r.age_group = 'adult' or r.guardian_consent);

  if v_show then
    if r.player_profile_id is not null and exists (select 1 from public.player_profiles p where p.id = r.player_profile_id) then
      v_pid := r.player_profile_id;
      update public.player_profiles p set
        display_name = left(r.player_name, 80),
        playing_role = r.playing_role,
        batting_style = r.batting_style,
        bowling_style = r.bowling_style,
        approved_achievements = r.achievements,
        bio = r.about_player,
        photo_url = coalesce(p_photo_path, p.photo_url),
        consent_confirmed = true,
        is_public = true
      where p.id = v_pid;
    else
      insert into public.player_profiles (
        display_name, playing_role, batting_style, bowling_style,
        approved_achievements, bio, photo_url, consent_confirmed, is_public
      ) values (
        left(r.player_name, 80), r.playing_role, r.batting_style, r.bowling_style,
        r.achievements, r.about_player, p_photo_path, true, true
      ) returning id into v_pid;
    end if;

    foreach v_path in array coalesce(p_extra_photos, '{}') loop
      v_n := v_n + 1;
      if not exists (select 1 from public.player_media m where m.player_id = v_pid and m.storage_path = v_path) then
        insert into public.player_media (player_id, media_type, storage_path, alt_text, sort_order)
        values (v_pid, 'image', v_path, left('Photo of ' || r.player_name, 200), v_n);
      end if;
    end loop;
  end if;

  update public.registrations
     set status = 'accepted', player_profile_id = coalesce(v_pid, player_profile_id)
   where id = p_id;

  return v_pid;
end;
$$;

revoke all on function public.accept_registration(uuid, text, text[]) from public, anon;
grant execute on function public.accept_registration(uuid, text, text[]) to authenticated;

-- >>> migrations/20261026000009_reviews.sql
-- =====================================================================
-- Swat Kings Cricket Academy — 009: visitor reviews
-- Real visitors leave a 1–5 star rating and a comment on /reviews.
--   * Visitors cannot insert directly: submit_review() validates the input,
--     drops honeypot (bot) submissions and rate-limits by hashed IP.
--   * Every review starts as 'pending'. Only an admin can approve it, and
--     only approved reviews are visible to the public.
--   * No contact details are stored, so approved rows are safe to show.
-- Safe to run more than once.
-- =====================================================================

create table if not exists public.reviews (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 80),
  relationship  text not null default 'other'
                check (relationship in ('parent', 'player', 'former_player', 'visitor', 'other')),
  rating        smallint not null check (rating between 1 and 5),
  comment       text not null check (char_length(comment) between 10 and 1500),
  status        text not null default 'pending' check (status in ('pending', 'approved', 'hidden')),
  approved_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists reviews_public_idx on public.reviews (status, created_at desc);

alter table public.reviews enable row level security;
revoke all on public.reviews from anon, authenticated;
grant select on public.reviews to anon, authenticated;
grant update, delete on public.reviews to authenticated;

drop policy if exists "reviews: public read approved" on public.reviews;
create policy "reviews: public read approved" on public.reviews for select to anon, authenticated
  using (status = 'approved' or (select public.is_admin()));
drop policy if exists "reviews: admin update" on public.reviews;
create policy "reviews: admin update" on public.reviews for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "reviews: admin delete" on public.reviews;
create policy "reviews: admin delete" on public.reviews for delete to authenticated
  using ((select public.is_admin()));

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

-- Allow 'review' in the rate-limit log.
alter table public.submission_log drop constraint if exists submission_log_kind_check;
alter table public.submission_log add constraint submission_log_kind_check
  check (kind in ('registration', 'contact', 'review'));

-- ---------------------------------------------------------------------
-- submit_review(payload jsonb) → { ok: true }
-- ---------------------------------------------------------------------
create or replace function public.submit_review(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name         text := public.clean_text(payload ->> 'name', 81);
  v_relationship text := coalesce(public.clean_text(payload ->> 'relationship', 20), 'other');
  v_rating_text  text := public.clean_text(payload ->> 'rating', 2);
  v_rating       smallint;
  v_comment      text := public.clean_text(payload ->> 'comment', 1501);
  v_honeypot     text := public.clean_text(payload ->> 'website', 200);
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Invalid submission.' using errcode = '22023';
  end if;

  -- Honeypot: real people never see or fill this field. Pretend success.
  if v_honeypot is not null then
    return jsonb_build_object('ok', true);
  end if;

  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Please enter your name (2–80 characters).' using errcode = '22023';
  end if;
  if v_relationship not in ('parent', 'player', 'former_player', 'visitor', 'other') then
    raise exception 'Please choose who you are.' using errcode = '22023';
  end if;
  if v_rating_text is null or v_rating_text !~ '^[1-5]$' then
    raise exception 'Please choose a star rating from 1 to 5.' using errcode = '22023';
  end if;
  v_rating := v_rating_text::smallint;
  if v_comment is null or char_length(v_comment) < 10 or char_length(v_comment) > 1500 then
    raise exception 'Please write a comment (10–1500 characters).' using errcode = '22023';
  end if;
  -- Links are the usual sign of spam; genuine reviews do not need them.
  if v_comment ~* '(https?://|www\.|\.com\b|\.net\b|\.xyz\b)' or v_name ~* '(https?://|www\.)' then
    raise exception 'Please remove web links from your review.' using errcode = '22023';
  end if;
  if exists (
    select 1 from public.reviews r
    where lower(r.comment) = lower(v_comment) and r.created_at > now() - interval '30 days'
  ) then
    raise exception 'This review has already been received. Thank you!' using errcode = 'P0001';
  end if;

  -- Rate limit: 2 per hour per visitor, 30 per hour overall
  perform public.enforce_rate_limit('review', 2, 30);

  insert into public.reviews (name, relationship, rating, comment, status)
  values (v_name, v_relationship, v_rating, v_comment, 'pending');

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.submit_review(jsonb) from public;
grant execute on function public.submit_review(jsonb) to anon, authenticated;
