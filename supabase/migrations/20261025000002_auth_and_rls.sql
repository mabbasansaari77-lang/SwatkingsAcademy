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
