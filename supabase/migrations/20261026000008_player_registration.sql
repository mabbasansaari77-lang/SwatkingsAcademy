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
