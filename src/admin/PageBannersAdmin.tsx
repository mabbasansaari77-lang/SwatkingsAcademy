import { ExternalLink, ImageUp, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ErrorState, Loading } from '../components/ui/States';
import { BANNER_PAGES, loadBanners, type BannerPage, type PageBanner } from '../lib/banners';
import { deleteMedia, mediaUrl, uploadMedia, validateMediaFile, VIDEO_TYPES } from '../lib/media';
import { requireSupabase } from '../lib/supabase';
import { unwrap, useAsync } from '../lib/useAsync';
import { friendlyDbError } from './errors';
import { AdminPageHeader, NoticeBar, Panel, type Notice } from './ui';

const PAGE_PATHS: Record<BannerPage, string> = {
  home: '/',
  about: '/about',
  programmes: '/programmes',
  coaches: '/coaches',
  teams: '/teams',
  fixtures: '/fixtures',
  news: '/news',
  gallery: '/gallery',
  register: '/register',
  contact: '/contact',
};

function BannerRow({
  page,
  label,
  banner,
  onChanged,
  onNotice,
}: {
  page: BannerPage;
  label: string;
  banner: PageBanner | undefined;
  onChanged: () => void;
  onNotice: (n: Notice) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [alt, setAlt] = useState(banner?.alt_text ?? '');
  const src = banner ? mediaUrl(banner.storage_path) : null;

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const problem = validateMediaFile(file, true);
    if (problem) {
      onNotice({ kind: 'error', text: `${label}: ${problem}` });
      return;
    }
    setBusy(true);
    try {
      const path = await uploadMedia(file, 'pages');
      const description = alt.trim().length >= 3 ? alt.trim() : `${label} banner — Swat Kings Cricket Academy`;
      const res = await requireSupabase()
        .from('page_banners')
        .upsert({
          page,
          media_type: VIDEO_TYPES.includes(file.type) ? 'video' : 'image',
          storage_path: path,
          alt_text: description.slice(0, 200),
        })
        .select('page');
      if (res.error || !res.data?.length) {
        void deleteMedia(path).catch(() => {});
        throw new Error(res.error?.message ?? 'permission denied');
      }
      if (banner?.storage_path) void deleteMedia(banner.storage_path).catch(() => {});
      onNotice({ kind: 'success', text: `${label}: banner updated. It is live now.` });
      onChanged();
    } catch (err) {
      onNotice({ kind: 'error', text: friendlyDbError(err instanceof Error ? err.message : String(err)) });
    } finally {
      setBusy(false);
    }
  };

  const saveAlt = async () => {
    if (!banner || alt.trim().length < 3) return;
    const res = await requireSupabase().from('page_banners').update({ alt_text: alt.trim().slice(0, 200) }).eq('page', page).select('page');
    if (res.error || !res.data?.length) onNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
    else onNotice({ kind: 'success', text: `${label}: description saved.` });
  };

  const remove = async () => {
    if (!banner || !window.confirm(`Remove the ${label} banner? The page will go back to the plain sky-blue design.`)) return;
    const res = await requireSupabase().from('page_banners').delete().eq('page', page).select('page');
    if (res.error || !res.data?.length) {
      onNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
      return;
    }
    void deleteMedia(banner.storage_path).catch(() => {});
    onNotice({ kind: 'success', text: `${label}: banner removed.` });
    onChanged();
  };

  return (
    <li className="grid gap-4 border-b border-charcoal-400/15 py-5 last:border-0 md:grid-cols-[260px_1fr]">
      <div className="relative aspect-video overflow-hidden rounded-md bg-navy-900">
        {src && banner?.media_type === 'video' && (
          <video src={src} muted loop playsInline autoPlay className="h-full w-full object-cover" aria-label={banner.alt_text} />
        )}
        {src && banner?.media_type === 'image' && <img src={src} alt={banner.alt_text} className="h-full w-full object-cover" />}
        {!src && (
          <span className="flex h-full w-full items-center justify-center p-3 text-center text-sm text-crease/80">
            No banner — uses the standard sky-blue design
          </span>
        )}
        {banner && (
          <span className="absolute left-2 top-2 rounded bg-navy-950/85 px-2 py-0.5 text-xs font-semibold text-crease">
            {banner.media_type === 'video' ? 'Video' : 'Photo'}
          </span>
        )}
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-2xl font-extrabold text-navy-900">{label}</h2>
          <a
            href={PAGE_PATHS[page]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-semibold text-navy-800 hover:underline"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> View page
          </a>
        </div>
        <div>
          <label htmlFor={`alt-${page}`} className="mb-1 block text-sm font-semibold">
            Description (for visually impaired visitors)
          </label>
          <div className="flex gap-2">
            <input
              id={`alt-${page}`}
              className="field-input"
              maxLength={200}
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="e.g. Players training in the nets at sunset"
            />
            {banner && (
              <button type="button" onClick={() => void saveAlt()} className="shrink-0 rounded-md border-2 border-navy-800 px-3 text-sm font-semibold text-navy-800 hover:bg-navy-800 hover:text-crease">
                Save
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-crease hover:bg-navy-600">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ImageUp className="h-4 w-4" aria-hidden="true" />}
            {busy ? 'Uploading…' : banner ? 'Replace photo or video' : 'Upload photo or video'}
            <input
              type="file"
              className="sr-only"
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
              disabled={busy}
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {banner && (
            <button
              type="button"
              onClick={() => void remove()}
              className="inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-semibold text-cherry hover:bg-cherry/10"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

export default function PageBannersAdmin() {
  const [notice, setNotice] = useState<Notice>(null);
  const state = useAsync(async () => {
    const res = await requireSupabase().from('page_banners').select('*');
    const rows = unwrap(res) as PageBanner[];
    return Object.fromEntries(rows.map((b) => [b.page, b])) as Record<string, PageBanner>;
  });

  const changed = () => {
    void loadBanners(true);
    state.reload();
  };

  return (
    <div>
      <AdminPageHeader
        title="Page banners"
        intro="Add a background photo or short video to the top of the home page and other pages. Text stays readable because a sky-blue shade is placed over it."
      />
      <Panel className="mb-6 text-sm text-charcoal-800">
        <p className="font-semibold text-navy-900">Tips for good banners</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>Use wide, landscape photos (at least 1600 pixels wide). Photos up to 5 MB.</li>
          <li>Videos: short MP4 clips (10–20 seconds) up to 25 MB. They play silently on a loop.</li>
          <li>Keep the main subject on the right side — the page title sits on the left.</li>
          <li>Only use photos and videos the people shown (and parents of under-19s) have agreed to publish.</li>
        </ul>
        <p className="mt-2">
          To choose which photos and videos appear lower on the home page, use <strong>Gallery → Show on home</strong>.
        </p>
      </Panel>
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      {state.loading && !state.data ? (
        <Loading />
      ) : state.error ? (
        <ErrorState error={state.error} onRetry={state.reload} />
      ) : (
        <Panel>
          <ul>
            {BANNER_PAGES.map((p) => (
              <BannerRow
                key={`${p.value}-${state.data?.[p.value]?.updated_at ?? 'none'}`}
                page={p.value}
                label={p.label}
                banner={state.data?.[p.value]}
                onChanged={changed}
                onNotice={setNotice}
              />
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
