import { requireSupabase } from './supabase';

/** Private bucket: visitors can only upload; only admins can view. */
export const REGISTRATION_BUCKET = 'registration-photos';
export const MAX_REGISTRATION_PHOTOS = 3;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_EDGE = 1600;

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** Returns a problem with the chosen file, or null if it can be used. */
export function checkPhoto(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Please choose a photo (JPG, PNG or WebP).';
  if (file.size > 25 * 1024 * 1024) return 'This photo is too large. Please choose one under 25 MB.';
  return null;
}

/**
 * Shrinks a phone photo to at most 1600px on the long edge and saves it as
 * JPEG, so uploads are fast and fit the 5 MB limit. This also drops the
 * photo's hidden EXIF data (such as GPS location). Falls back to the
 * original file if the browser cannot process it.
 */
export async function preparePhoto(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no canvas');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new Error('no blob');
    return blob;
  } catch {
    if (!EXT[file.type]) throw new Error('This photo format is not supported. Please use a JPG, PNG or WebP photo.');
    return file;
  }
}

/** Uploads one prepared photo to the private bucket and returns its path. */
export async function uploadRegistrationPhoto(file: File): Promise<string> {
  const blob = await preparePhoto(file);
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error('A photo is still larger than 5 MB. Please choose a smaller photo.');
  const type = blob.type || file.type;
  const ext = EXT[type];
  if (!ext) throw new Error('This photo format is not supported. Please use a JPG, PNG or WebP photo.');
  const path = `pending/${crypto.randomUUID()}.${ext}`;
  const { error } = await requireSupabase()
    .storage.from(REGISTRATION_BUCKET)
    .upload(path, blob, { contentType: type, upsert: false });
  if (error) throw new Error('A photo could not be uploaded. Check your connection and try again.');
  return path;
}
