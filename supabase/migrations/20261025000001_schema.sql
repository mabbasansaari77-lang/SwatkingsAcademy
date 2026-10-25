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
