-- =====================================================================
-- Security self-test for Swat Kings Cricket Academy
--
-- Paste this whole file into Supabase → SQL Editor and click Run.
-- It creates temporary test users and rows INSIDE A TRANSACTION and rolls
-- everything back at the end, so nothing is saved.
--
-- Expected result: the final output says "ALL SECURITY CHECKS PASSED".
-- If any check fails, the script stops with an error starting "FAIL:".
-- =====================================================================

begin;

-- Test fixtures (as the database owner)
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-0000000000a1', 'test-admin@example.invalid'),
  ('00000000-0000-4000-8000-0000000000b2', 'test-user@example.invalid');
update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000000a1';

insert into public.programmes (id, slug, name, category, is_published, status)
values ('00000000-0000-4000-8000-00000000c001', 'zz-test-published', 'ZZ Test Published', 'batting', true, 'open'),
       ('00000000-0000-4000-8000-00000000c002', 'zz-test-hidden', 'ZZ Test Hidden', 'bowling', false, 'open');

insert into public.player_profiles (display_name, is_public, consent_confirmed)
values ('ZZ Hidden Player', false, false);

-- ---------------------------------------------------------------------
-- 1. Visitors (anon)
-- ---------------------------------------------------------------------
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

do $$
declare n int; ok boolean;
begin
  -- 1a. cannot read registrations
  begin
    perform 1 from public.registrations limit 1;
    raise exception 'FAIL: anon can read registrations';
  exception when insufficient_privilege then raise notice 'PASS: anon cannot read registrations';
  end;

  -- 1b. cannot read contact messages
  begin
    perform 1 from public.contact_messages limit 1;
    raise exception 'FAIL: anon can read contact_messages';
  exception when insufficient_privilege then raise notice 'PASS: anon cannot read contact messages';
  end;

  -- 1c. cannot insert directly into registrations
  begin
    insert into public.registrations (reference, player_name, age_group, phone, experience_level, preferred_schedule, privacy_acknowledged)
    values ('X', 'Bot', 'adult', '0300 0000000', 'none', 'flexible', true);
    raise exception 'FAIL: anon inserted into registrations directly';
  exception when insufficient_privilege then raise notice 'PASS: anon cannot insert registrations directly';
  end;

  -- 1d. sees published programmes only
  select count(*) into n from public.programmes where slug like 'zz-test-%';
  if n <> 1 then raise exception 'FAIL: anon sees % test programmes (expected 1)', n; end if;
  raise notice 'PASS: anon sees only published programmes';

  -- 1e. cannot modify content
  begin
    update public.programmes set name = 'Hacked' where slug = 'zz-test-published';
    raise exception 'FAIL: anon could run UPDATE on programmes';
  exception when insufficient_privilege then raise notice 'PASS: anon cannot modify programmes';
  end;

  -- 1f. hidden player profile not visible
  select count(*) into n from public.player_profiles where display_name = 'ZZ Hidden Player';
  if n <> 0 then raise exception 'FAIL: anon can see a non-public player profile'; end if;
  raise notice 'PASS: anon cannot see non-public player profiles';

  -- 1g. cannot read profiles (roles)
  begin
    perform 1 from public.profiles limit 1;
    raise exception 'FAIL: anon can read profiles';
  exception when insufficient_privilege then raise notice 'PASS: anon cannot read profiles';
  end;

  -- 1h. CAN submit a registration through the function
  perform public.submit_registration(jsonb_build_object(
    'player_name', 'Test Player', 'guardian_name', 'Test Guardian', 'age_group', 'under_14',
    'phone', '+92 300 0000000', 'programme_id', '00000000-0000-4000-8000-00000000c001',
    'experience_level', 'none', 'preferred_schedule', 'weekends',
    'guardian_consent', true, 'privacy_acknowledged', true));
  raise notice 'PASS: anon can submit a valid registration via submit_registration()';

  -- 1i. invalid registration rejected by server-side validation
  ok := false;
  begin
    perform public.submit_registration(jsonb_build_object(
      'player_name', 'Minor Without Consent', 'age_group', 'under_12', 'phone', '0300 0000000',
      'experience_level', 'none', 'preferred_schedule', 'weekends', 'privacy_acknowledged', true));
  exception when others then ok := true;
  end;
  if not ok then raise exception 'FAIL: minor registration without guardian consent was accepted'; end if;
  raise notice 'PASS: server rejects a minor registration without guardian consent';

  -- 1j. hidden programme cannot be chosen
  ok := false;
  begin
    perform public.submit_registration(jsonb_build_object(
      'player_name', 'Adult Player', 'age_group', 'adult', 'phone', '0300 0000000',
      'programme_id', '00000000-0000-4000-8000-00000000c002',
      'experience_level', 'club', 'preferred_schedule', 'weekends', 'privacy_acknowledged', true));
  exception when others then ok := true;
  end;
  if not ok then raise exception 'FAIL: registration accepted for an unpublished programme'; end if;
  raise notice 'PASS: server rejects registrations for unpublished programmes';

  -- 1k. contact form works through the function
  perform public.submit_contact_message(jsonb_build_object(
    'name', 'Test Visitor', 'contact', 'visitor@example.invalid', 'subject', 'Test subject',
    'message', 'This is a test message from the security script.'));
  raise notice 'PASS: anon can send a contact message via submit_contact_message()';

  -- 1l. cannot call internal helpers
  begin
    perform public.enforce_rate_limit('contact', 1000, 1000);
    raise exception 'FAIL: anon can call enforce_rate_limit()';
  exception when insufficient_privilege then raise notice 'PASS: anon cannot call internal helper functions';
  end;

  -- 1m. (migration 008) visitors cannot accept registrations or see uploaded photos
  if to_regprocedure('public.accept_registration(uuid,text,text[])') is not null then
    begin
      perform public.accept_registration('00000000-0000-4000-8000-000000000000'::uuid);
      raise exception 'FAIL: anon can call accept_registration()';
    exception when insufficient_privilege then raise notice 'PASS: anon cannot accept registrations';
    end;
    perform 1 from storage.objects where bucket_id = 'registration-photos';
    if found then raise exception 'FAIL: anon can list registration photos'; end if;
    raise notice 'PASS: anon cannot see registration photos';
  end if;
end;
$$;

reset role;

-- ---------------------------------------------------------------------
-- 2. Signed-in NON-admin user
-- ---------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b2","role":"authenticated"}', true);

do $$
declare n int;
begin
  select count(*) into n from public.registrations;
  if n <> 0 then raise exception 'FAIL: non-admin can read % registrations', n; end if;
  raise notice 'PASS: non-admin user cannot read registrations';

  update public.programmes set name = 'Hacked' where slug = 'zz-test-published';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: non-admin updated a programme'; end if;
  raise notice 'PASS: non-admin user cannot modify programmes';

  begin
    insert into public.announcements (slug, title, status) values ('zz-hack', 'Hack', 'draft');
    raise exception 'FAIL: non-admin inserted an announcement';
  exception when insufficient_privilege then raise notice 'PASS: non-admin user cannot create announcements';
  end;

  begin
    update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-0000000000b2';
    raise exception 'FAIL: user could run UPDATE on profiles';
  exception when insufficient_privilege then raise notice 'PASS: user cannot make themselves admin';
  end;

  if public.is_admin() then raise exception 'FAIL: non-admin reported as admin'; end if;
  raise notice 'PASS: is_admin() is false for a normal user';
end;
$$;

reset role;

-- ---------------------------------------------------------------------
-- 3. Admin user
-- ---------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);

do $$
declare n int; v_status text;
begin
  if not public.is_admin() then raise exception 'FAIL: admin not recognised by is_admin()'; end if;

  select count(*) into n from public.registrations where player_name = 'Test Player';
  if n <> 1 then raise exception 'FAIL: admin cannot read the test registration'; end if;

  select status into v_status from public.registrations where player_name = 'Test Player';
  if v_status <> 'pending' then raise exception 'FAIL: new registration status is % (expected pending)', v_status; end if;
  raise notice 'PASS: admin can read registrations; new ones start as pending';

  update public.registrations set status = 'contacted' where player_name = 'Test Player';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: admin cannot update registration status'; end if;
  raise notice 'PASS: admin can update registration status';

  select count(*) into n from public.programmes where slug like 'zz-test-%';
  if n <> 2 then raise exception 'FAIL: admin should see unpublished programmes too'; end if;
  raise notice 'PASS: admin can see unpublished content';

  select count(*) into n from public.contact_messages where name = 'Test Visitor';
  if n <> 1 then raise exception 'FAIL: admin cannot read contact messages'; end if;
  raise notice 'PASS: admin can read contact messages';
end;
$$;

reset role;

select 'ALL SECURITY CHECKS PASSED' as result;

rollback;
