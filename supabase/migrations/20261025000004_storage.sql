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
