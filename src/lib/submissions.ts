import { uploadRegistrationPhoto } from './registrationPhotos';
import { NotConfiguredError, requireSupabase } from './supabase';
import type { ContactData, RegistrationData } from './validation';

/** Error with a message that is safe and helpful to show to visitors. */
export class SubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmissionError';
  }
}

interface RpcError {
  message: string;
  code?: string;
  hint?: string | null;
}

function toFriendlyError(error: RpcError): SubmissionError {
  // Our database functions raise clear messages with codes 22023 (invalid
  // input) or P0001 (rate limited / closed). Show those as-is.
  if (error.code === '22023' || error.code === 'P0001') return new SubmissionError(error.message);
  if (/fetch|network/i.test(error.message)) {
    return new SubmissionError('We could not reach the server. Check your internet connection and try again.');
  }
  return new SubmissionError('Something went wrong while sending the form. Please try again in a few minutes.');
}

export async function submitRegistration(data: RegistrationData, photos: File[] = []): Promise<string> {
  let photo_paths: string[] = [];
  if (photos.length) {
    try {
      photo_paths = await Promise.all(photos.map((f) => uploadRegistrationPhoto(f)));
    } catch (err) {
      if (err instanceof NotConfiguredError) throw new SubmissionError(err.message);
      throw new SubmissionError(err instanceof Error ? err.message : 'A photo could not be uploaded.');
    }
  }
  const payload = { ...data, photo_paths };
  let res;
  try {
    res = await requireSupabase().rpc('submit_registration', { payload });
  } catch (err) {
    if (err instanceof NotConfiguredError) throw new SubmissionError(err.message);
    throw toFriendlyError({ message: err instanceof Error ? err.message : String(err) });
  }
  if (res.error) throw toFriendlyError(res.error);
  const reference = (res.data as { reference?: string } | null)?.reference;
  if (!reference) throw new SubmissionError('The registration was not confirmed. Please try again.');
  return reference;
}

export async function submitContactMessage(data: ContactData): Promise<void> {
  let res;
  try {
    res = await requireSupabase().rpc('submit_contact_message', { payload: data });
  } catch (err) {
    if (err instanceof NotConfiguredError) throw new SubmissionError(err.message);
    throw toFriendlyError({ message: err instanceof Error ? err.message : String(err) });
  }
  if (res.error) throw toFriendlyError(res.error);
}
