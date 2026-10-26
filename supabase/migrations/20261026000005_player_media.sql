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
