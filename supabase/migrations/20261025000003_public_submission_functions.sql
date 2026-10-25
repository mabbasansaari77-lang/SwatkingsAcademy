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
