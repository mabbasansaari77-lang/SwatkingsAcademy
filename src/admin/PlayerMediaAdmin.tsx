import { ArrowLeft, ExternalLink, Loader2, Play, Trash2, Upload, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { Button } from '../components/ui/Button';
import { ErrorState, Loading } from '../components/ui/States';
import { deleteMedia, mediaUrl, uploadMedia, validateMediaFile, VIDEO_TYPES, youtubeThumb } from '../lib/media';
import { requireSupabase } from '../lib/supabase';
import type { PlayerMedia, PlayerProfile } from '../lib/types';
import { unwrap, useAsync } from '../lib/useAsync';
import { parseYouTubeId } from '../lib/validation';
import { friendlyDbError } from './errors';
import { AdminPageHeader, NoticeBar, Panel, type Notice } from './ui';

function AddMediaForm({ player, onDone, onCancel }: { player: PlayerProfile; onDone: (text: string) => void; onCancel: () => void }) {
  const [source, setSource] = useState<'file' | 'youtube'>('file');
  const [files, setFiles] = useState<File[]>([]);
  const [youtube, setYoutube] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const client = requireSupabase();
    const alt = caption.trim() || `${player.display_name} playing cricket`;
    setBusy(true);
    try {
      if (source === 'youtube') {
        const id = parseYouTubeId(youtube);
        if (!id) throw new Error('Paste a valid YouTube link, for example https://youtu.be/abc123XYZ00');
        const res = await client
          .from('player_media')
          .insert({ player_id: player.id, media_type: 'video', youtube_id: id, caption: caption.trim() || null, alt_text: alt.slice(0, 200) })
          .select('id');
        if (res.error || !res.data?.length) throw new Error(res.error?.message ?? 'permission denied');
        onDone('Video added.');
        return;
      }
      if (!files.length) throw new Error('Choose at least one photo or video.');
      for (const f of files) {
        const problem = validateMediaFile(f, true);
        if (problem) throw new Error(`${f.name}: ${problem}`);
      }
      let added = 0;
      for (const f of files) {
        setProgress(`Uploading ${added + 1} of ${files.length}…`);
        const path = await uploadMedia(f, 'players');
        const res = await client
          .from('player_media')
          .insert({
            player_id: player.id,
            media_type: VIDEO_TYPES.includes(f.type) ? 'video' : 'image',
            storage_path: path,
            caption: caption.trim() || null,
            alt_text: alt.slice(0, 200),
            sort_order: added,
          })
          .select('id');
        if (res.error || !res.data?.length) {
          void deleteMedia(path).catch(() => {});
          throw new Error(res.error?.message ?? 'permission denied');
        }
        added++;
      }
      onDone(`${added} ${added === 1 ? 'file' : 'files'} added.`);
    } catch (err) {
      setError(friendlyDbError(err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
      setProgress('');
    }
  };

  return (
    <Panel className="mb-6">
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-navy-900">Add photos or videos</h2>
          <button type="button" onClick={onCancel} className="rounded p-1 hover:bg-chalk">
            <X aria-hidden="true" />
            <span className="sr-only">Close form</span>
          </button>
        </div>
        <fieldset>
          <legend className="mb-2 font-semibold">Source</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" name="src" checked={source === 'file'} onChange={() => setSource('file')} className="accent-navy-800" />
              Upload photos / short videos (you can choose several)
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" name="src" checked={source === 'youtube'} onChange={() => setSource('youtube')} className="accent-navy-800" />
              YouTube link (best for long videos)
            </label>
          </div>
        </fieldset>
        {source === 'file' ? (
          <div>
            <label htmlFor="pm-files" className="mb-1.5 block font-semibold">
              Files <span className="text-cherry">*</span>
            </label>
            <input
              id="pm-files"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-navy-800 file:px-4 file:py-2 file:font-semibold file:text-crease"
            />
            <p className="mt-1 text-sm text-charcoal-600">
              Photos up to 5 MB each (JPG, PNG, WebP). Videos up to 25 MB (MP4/WebM). Longer videos: upload to YouTube and use the link option.
            </p>
          </div>
        ) : (
          <div>
            <label htmlFor="pm-yt" className="mb-1.5 block font-semibold">
              YouTube link <span className="text-cherry">*</span>
            </label>
            <input id="pm-yt" className="field-input" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
          </div>
        )}
        <div>
          <label htmlFor="pm-caption" className="mb-1.5 block font-semibold">
            Caption
          </label>
          <input
            id="pm-caption"
            className="field-input"
            maxLength={200}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="e.g. 52 runs v Mardan, U-17 Peshawar Region 2025"
          />
          <p className="mt-1 text-sm text-charcoal-600">Also used as the description for visually impaired visitors.</p>
        </div>
        <p className="rounded-md bg-accent-300/40 p-3 text-sm">
          Only upload media the player — and for under-19s a parent or guardian — has agreed to publish.
        </p>
        {error && <NoticeBar notice={{ kind: 'error', text: error }} />}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
            {busy ? progress || 'Saving…' : 'Add to profile'}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Panel>
  );
}

export default function PlayerMediaAdmin() {
  const { id = '' } = useParams();
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const state = useAsync(async () => {
    const client = requireSupabase();
    const [p, m] = await Promise.all([
      client.from('player_profiles').select('*').eq('id', id).single(),
      client.from('player_media').select('*').eq('player_id', id).order('sort_order').order('created_at'),
    ]);
    return { player: unwrap(p) as PlayerProfile, media: unwrap(m) as PlayerMedia[] };
  }, [id]);

  const remove = async (m: PlayerMedia) => {
    if (!window.confirm('Delete this photo/video from the player’s profile?')) return;
    const res = await requireSupabase().from('player_media').delete().eq('id', m.id).select('id');
    if (res.error || !res.data?.length) {
      setNotice({ kind: 'error', text: friendlyDbError(res.error?.message ?? 'permission denied') });
      return;
    }
    if (m.storage_path) void deleteMedia(m.storage_path).catch(() => {});
    setNotice({ kind: 'success', text: 'Deleted.' });
    state.reload();
  };

  if (state.loading && !state.data) return <Loading />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  const { player, media } = state.data!;

  return (
    <div>
      <Link to="/admin/players" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-navy-800 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to player profiles
      </Link>
      <AdminPageHeader
        title={`${player.display_name}: photos & videos`}
        intro="These appear on the player’s public profile page when the profile is shown on the website."
        action={
          <div className="flex flex-wrap gap-2">
            {player.is_public && (
              <a
                href={`/players/${player.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-md border-2 border-navy-800 px-3 py-1.5 text-sm font-semibold text-navy-800 hover:bg-navy-800 hover:text-crease"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" /> View public page
              </a>
            )}
            <Button onClick={() => setAdding(true)}>
              <Upload className="h-4 w-4" aria-hidden="true" /> Add photos or videos
            </Button>
          </div>
        }
      />
      {!player.is_public && (
        <NoticeBar
          notice={{
            kind: 'error',
            text: 'This profile is hidden. Tick “Consent confirmed” and “Show on website” in Player profiles for visitors to see it.',
          }}
        />
      )}
      <NoticeBar notice={notice} onDismiss={() => setNotice(null)} />
      {adding && (
        <AddMediaForm
          player={player}
          onCancel={() => setAdding(false)}
          onDone={(text) => {
            setAdding(false);
            setNotice({ kind: 'success', text });
            state.reload();
          }}
        />
      )}
      {media.length === 0 ? (
        <Panel>
          <p className="py-6 text-center text-charcoal-600">No photos or videos yet. Use “Add photos or videos”.</p>
        </Panel>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {media.map((m) => {
            const thumb = m.youtube_id ? youtubeThumb(m.youtube_id) : m.media_type === 'image' ? mediaUrl(m.storage_path) : null;
            return (
              <li key={m.id} className="overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_rgb(0_0_0/0.06)]">
                <div className="relative aspect-video bg-navy-900">
                  {thumb ? (
                    <img src={thumb} alt={m.alt_text} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <video src={mediaUrl(m.storage_path) ?? undefined} className="h-full w-full object-cover" muted preload="metadata" aria-label={m.alt_text} />
                  )}
                  {m.media_type === 'video' && (
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-navy-950/85 px-2 py-0.5 text-xs font-semibold text-crease">
                      <Play className="h-3 w-3" aria-hidden="true" /> Video
                    </span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2 p-3">
                  <p className="min-w-0 truncate text-sm">{m.caption || m.alt_text}</p>
                  <button
                    type="button"
                    onClick={() => void remove(m)}
                    className="inline-flex shrink-0 items-center gap-1 rounded px-2 py-1 text-sm font-semibold text-cherry hover:bg-cherry/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
