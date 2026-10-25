import { MEDIA_BUCKET, requireSupabase, supabase } from './supabase';

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm'];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB (bucket hard limit)

export type MediaFolder = 'gallery' | 'coaches' | 'news' | 'players';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

/** Returns a human-readable problem with the file, or null if it is acceptable. */
export function validateMediaFile(file: File, allowVideo: boolean): string | null {
  const isImage = IMAGE_TYPES.includes(file.type);
  const isVideo = VIDEO_TYPES.includes(file.type);
  if (!isImage && !(allowVideo && isVideo)) {
    return allowVideo
      ? 'Use a JPG, PNG, WebP or AVIF image, or an MP4/WebM video.'
      : 'Use a JPG, PNG, WebP or AVIF image.';
  }
  if (isImage && file.size > MAX_IMAGE_BYTES) return 'Images must be 5 MB or smaller. Resize the photo and try again.';
  if (isVideo && file.size > MAX_VIDEO_BYTES)
    return 'Videos must be 25 MB or smaller. For longer clips, upload to YouTube and paste the link instead.';
  return null;
}

/** Uploads a file under a random name and returns its storage path. */
export async function uploadMedia(file: File, folder: MediaFolder): Promise<string> {
  const client = requireSupabase();
  const ext = EXTENSIONS[file.type];
  if (!ext) throw new Error('Unsupported file type.');
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (error) throw new Error(error.message);
  return path;
}

export async function deleteMedia(path: string): Promise<void> {
  const client = requireSupabase();
  const { error } = await client.storage.from(MEDIA_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

/** Public URL for a stored file. Accepts a storage path or an absolute https URL. */
export function mediaUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;
  if (/^https:\/\//.test(pathOrUrl)) return pathOrUrl;
  if (!supabase) return null;
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(pathOrUrl).data.publicUrl;
}

export function youtubeThumb(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function youtubeEmbed(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}
