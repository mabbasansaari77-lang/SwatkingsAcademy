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
