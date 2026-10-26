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
  if v_comment ~* '(https?://|www\.|\.com\y|\.net\y|\.xyz\y)' or v_name ~* '(https?://|www\.)' then
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
