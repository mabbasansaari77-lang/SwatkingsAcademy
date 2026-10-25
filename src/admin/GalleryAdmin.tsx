import { Eye, EyeOff, Loader2, Pencil, Play, Trash2, Upload, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { ErrorState, Loading } from '../components/ui/States';
import { GALLERY_CATEGORIES, labelFor } from '../lib/labels';
import { deleteMedia, mediaUrl, uploadMedia, validateMediaFile, VIDEO_TYPES, youtubeThumb } from '../lib/media';
import { requireSupabase } from '../lib/supabase';
import type { GalleryItem } from '../lib/types';
import { unwrap, useAsync } from '../lib/useAsync';
import { parseYouTubeId } from '../lib/validation';
import { friendlyDbError } from './errors';
import { AdminPageHeader, NoticeBar, Panel, type Notice } from './ui';

interface FormState {
  source: 'file' | 'youtube';
  file: File | null;
  youtube: string;
  title: string;
  caption: string;
  alt_text: string;
  category: GalleryItem['category'];
  sort_order: string;
  is_published: boolean;
}

const EMPTY_FORM: FormState = {
  source: 'file',
  file: null,
  youtube: '',
  title: '',
  caption: '',
  alt_text: '',
  category: 'training',
  sort_order: '0',
  is_published: true,
};

function ItemForm({ item, onDone, onCancel }: { item: GalleryItem | null; onDone: (text: string) => void; onCancel: () => void }) {
  const [form, setForm] = useState<FormState>(
    item
      ? {
          ...EMPTY_FORM,
          source: item.youtube_id ? 'youtube' : 'file',
          youtube: item.youtube_id ?? '',
          title: item.title ?? '',
          caption: item.caption ?? '',
          alt_text: item.alt_text,
          category: item.category,
          sort_order: String(item.sort_order),
          is_published: item.is_published,
        }
      : EMPTY_FORM,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const alt = form.alt_text.trim();
    if (alt.length < 3) return setError('Describe the photo or video in the “Description (alt text)” field.');

    const meta = {
      title: form.title.trim() || null,
      caption: form.caption.trim() || null,
      alt_text: alt.slice(0, 200),
      category: form.category,
      sort_order: Number.parseInt(form.sort_order, 10) || 0,
      is_published: form.is_published,
    };

    setBusy(true);
    let uploadedPath: string | null = null;
    try {
      const client = requireSupabase();
      if (item) {
        const res = await client.from('gallery_items').update(meta).eq('id', item.id).select('id');
        if (res.error || !res.data?.length) throw new Error(res.error?.message ?? 'permission denied');
        onDone('Gallery item updated.');
        return;
      }

      let source: { media_type: 'image' | 'video'; storage_path: string | null; youtube_id: string | null };
      if (form.source === 'youtube') {
        const id = parseYouTubeId(form.youtube);
        if (!id) throw new Error('Paste a valid YouTube link, for example https://youtu.be/abc123XYZ00');
        source = { media_type: 'video', storage_path: null, youtube_id: id };
      } else {
        if (!form.file) throw new Error('Choose a photo or video to upload.');
        const problem = validateMediaFile(form.file, true);
        if (problem) throw new Error(problem);
        uploadedPath = await uploadMedia(form.file, 'gallery');
        source = {
          media_type: VIDEO_TYPES.includes(form.file.type) ? 'video' : 'image',
          storage_path: uploadedPath,
          youtube_id: null,
        };
      }
      const res = await client.from('gallery_items').insert({ ...meta, ...source }).select('id');
      if (res.error || !res.data?.length) throw new Error(res.error?.message ?? 'permission denied');
      onDone('Added to the gallery.');
    } catch (err) {
      if (uploadedPath) void deleteMedia(uploadedPath).catch(() => {});
      setError(friendlyDbError(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="mb-6">
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-navy-900">{item ? 'Edit gallery item' : 'Add to gallery'}</h2>
          <button type="button" onClick={onCancel} className="rounded p-1 hover:bg-chalk">
            <X aria-hidden="true" />
            <span className="sr-only">Close form</span>
          </button>
        </div>

        {!item && (
          <fieldset>
            <legend className="mb-2 font-semibold">Source</legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="source" checked={form.source === 'file'} onChange={() => set('source', 'file')} className="accent-navy-800" />
                Upload a photo or short video
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="source" checked={form.source === 'youtube'} onChange={() => set('source', 'youtube')} className="accent-navy-800" />
                YouTube link (best for longer videos)
              </label>
            </div>
          </fieldset>
        )}

        {!item && form.source === 'file' && (
          <div>
            <label htmlFor="gallery-file" className="mb-1.5 block font-semibold">
              File <span className="text-cherry">*</span>
            </label>
            <input
              id="gallery-file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
              onChange={(e) => set('file', e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-navy-800 file:px-4 file:py-2 file:font-semibold file:text-crease"
            />
            <p className="mt-1 text-sm text-charcoal-600">
              Photos: JPG, PNG, WebP or AVIF up to 5 MB (resize large phone photos first). Videos: MP4 or WebM up to 25
              MB. Only upload media approved for public display, with consent from anyone clearly shown.
            </p>
          </div>
        )}

        {!item && form.source === 'youtube' && (
          <div>
            <label htmlFor="gallery-youtube" className="mb-1.5 block font-semibold">
              YouTube link <span className="text-cherry">*</span>
            </label>
            <input id="gallery-youtube" className="field-input" value={form.youtube} onChange={(e) => set('youtube', e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
          </div>
        )}

        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="gallery-alt" className="mb-1.5 block font-semibold">
              Description (alt text) <span className="text-cherry">*</span>
            </label>
            <input
              id="gallery-alt"
              className="field-input"
              maxLength={200}
              value={form.alt_text}
              onChange={(e) => set('alt_text', e.target.value)}
              placeholder="e.g. Under-14 players practising catches in the nets"
            />
            <p className="mt-1 text-sm text-charcoal-600">Read aloud by screen readers. Describe what is shown.</p>
          </div>
          <div>
            <label htmlFor="gallery-title" className="mb-1.5 block font-semibold">Title</label>
            <input id="gallery-title" className="field-input" maxLength={160} value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label htmlFor="gallery-category" className="mb-1.5 block font-semibold">Category</label>
            <select id="gallery-category" className="field-input" value={form.category} onChange={(e) => set('category', e.target.value as FormState['category'])}>
              {GALLERY_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="gallery-caption" className="mb-1.5 block font-semibold">Caption</label>
            <textarea id="gallery-caption" rows={2} maxLength={500} className="field-input" value={form.caption} onChange={(e) => set('caption', e.target.value)} />
          </div>
          <div>
            <label htmlFor="gallery-order" className="mb-1.5 block font-semibold">Display order</label>
            <input id="gallery-order" type="number" min={0} className="field-input" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} />
          </div>
          <label className="flex items-center gap-3 self-end pb-2">
            <input type="checkbox" className="h-5 w-5 accent-navy-800" checked={form.is_published} onChange={(e) => set('is_published', e.target.checked)} />
            <span className="font-semibold">Show on website</span>
          </label>
        </div>

        {error && <NoticeBar notice={{ kind: 'error', text: error }} />}
        <div className="flex gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
            {busy ? 'Saving…' : item ? 'Save changes' : 'Add to gallery'}
          </Button>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
    </Panel>
  );
}

export default function GalleryAdmin() {
  const [editing, setEditing] = useState<GalleryItem | 'new' | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const list = useAsync(async () => {
    const res = await requireSupabase()
      .from('gallery_items')
      .select('*')
      .order('sort_order')
      .order('created_at', { ascending: false })
      .limit(500);
    return unwrap(res) as GalleryItem[];
  });

  const togglePublished = async (item: GalleryItem) => {
    const res = await requireSupabase().from('gallery_items').update({ is_published: !item.is_published }).eq('id', item.id).select('id');
    if (res.error || !res.data?.length) setNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
    else list.reload();
  };

  const remove = async (item: GalleryItem) => {
    if (!window.confirm('Delete this gallery item? The uploaded file will also be deleted.')) return;
    const res = await requireSupabase().from('gallery_items').delete().eq('id', item.id).select('id');
    if (res.error || !res.data?.length) {
      setNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
      return;
    }
    if (item.storage_path) {
      try {
        await deleteMedia(item.storage_path);
      } catch {
        setNotice({ kind: 'error', text: 'The item was removed, but its file could not be deleted from storage. Delete it in Supabase Storage.' });
        list.reload();
        return;
      }
    }
    setNotice({ kind: 'success', text: 'Gallery item deleted.' });
    list.reload();
  };

  return (
    <div>
      <AdminPageHeader
        title="Gallery"
        intro="Photos and videos for the public gallery. Supabase’s free plan includes limited storage, so keep files small and use YouTube for longer videos."
        action={
          <Button onClick={() => setEditing('new')}>
            <Upload className="h-4 w-4" aria-hidden="true" /> Add media
          </Button>
        }
      />
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      {editing && (
        <ItemForm
          key={editing === 'new' ? 'new' : editing.id}
          item={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onDone={(text) => {
            setEditing(null);
            setNotice({ kind: 'success', text });
            list.reload();
          }}
        />
      )}
      {list.loading && !list.data ? (
        <Loading />
      ) : list.error ? (
        <ErrorState error={list.error} onRetry={list.reload} />
      ) : !list.data?.length ? (
        <Panel>
          <p className="py-6 text-center text-charcoal-600">The gallery is empty. Use “Add media” to upload the first photo.</p>
        </Panel>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.data.map((item) => {
            const thumb = item.youtube_id ? youtubeThumb(item.youtube_id) : item.media_type === 'image' ? mediaUrl(item.storage_path) : null;
            return (
              <li key={item.id} className="overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
                <div className="relative aspect-video bg-navy-900">
                  {thumb ? (
                    <img src={thumb} alt={item.alt_text} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <video src={mediaUrl(item.storage_path) ?? undefined} className="h-full w-full object-cover" muted preload="metadata" aria-label={item.alt_text} />
                  )}
                  {item.media_type === 'video' && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-charcoal-950/80 px-2 py-0.5 text-xs font-semibold text-crease">
                      <Play className="h-3 w-3" aria-hidden="true" /> Video
                    </span>
                  )}
                  {!item.is_published && (
                    <span className="absolute right-2 top-2 rounded bg-accent-500 px-2 py-0.5 text-xs font-bold text-charcoal-950">Hidden</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate font-semibold">{item.title || item.alt_text}</p>
                  <p className="text-sm text-charcoal-600">{labelFor(GALLERY_CATEGORIES, item.category)}</p>
                  <div className="mt-2 flex flex-wrap gap-1 text-sm">
                    <button type="button" onClick={() => setEditing(item)} className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-navy-800 hover:bg-navy-800/10">
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                    </button>
                    <button type="button" onClick={() => void togglePublished(item)} className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-navy-800 hover:bg-navy-800/10">
                      {item.is_published ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
                      {item.is_published ? 'Hide' : 'Show'}
                    </button>
                    <button type="button" onClick={() => void remove(item)} className="inline-flex items-center gap-1 rounded px-2 py-1 font-semibold text-cherry hover:bg-cherry/10">
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
