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
