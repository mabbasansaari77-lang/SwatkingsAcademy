import { CheckCircle2, ExternalLink, Loader2, Mail, MessageCircle, MessageSquare, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '../components/ui/Button';
import { buttonClass } from '../components/ui/buttonClass';
import { formatDateTime } from '../lib/format';
import { AGE_GROUPS, EXPERIENCE_LEVELS, labelFor, PLAYING_ROLES, REGISTRATION_STATUSES, SCHEDULES } from '../lib/labels';
import { approvalMessage, emailLink, smsLink, whatsappLink, whatsappNumber } from '../lib/notify';
import { REGISTRATION_BUCKET } from '../lib/registrationPhotos';
import { SITE_URL } from '../lib/schema';
import { useSettings } from '../lib/settings';
import { MEDIA_BUCKET, requireSupabase } from '../lib/supabase';
import type { Registration, RegistrationStatus } from '../lib/types';
import { friendlyDbError } from './errors';
import { NoticeBar, Panel } from './ui';

const MIME: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

function canShowPublicly(reg: Registration): boolean {
  return Boolean(reg.public_profile_consent) && (reg.age_group === 'adult' || reg.guardian_consent);
}

/** Private photos are shown to admins through short-lived signed links. */
function useSignedPhotos(paths: string[]) {
  const [urls, setUrls] = useState<string[]>([]);
  const key = paths.join('|');
  useEffect(() => {
    let alive = true;
    if (!paths.length) return;
    void requireSupabase()
      .storage.from(REGISTRATION_BUCKET)
      .createSignedUrls(paths, 600)
      .then(({ data }) => {
        if (alive) setUrls((data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[]);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}

/** Copies the private registration photos into the public bucket (players/). */
async function publishPhotos(paths: string[]): Promise<string[]> {
  const client = requireSupabase();
  const out: string[] = [];
  for (const path of paths) {
    const ext = path.split('.').pop() ?? 'jpg';
    const { data, error } = await client.storage.from(REGISTRATION_BUCKET).download(path);
    if (error || !data) throw new Error('A registration photo could not be read. Try again.');
    const dest = `players/${crypto.randomUUID()}.${ext}`;
    const up = await client.storage
      .from(MEDIA_BUCKET)
      .upload(dest, data, { contentType: MIME[ext] ?? 'image/jpeg', cacheControl: '31536000', upsert: false });
    if (up.error) throw new Error(`A photo could not be published: ${up.error.message}`);
    out.push(dest);
  }
  return out;
}

function NotifyPanel({ reg, profileId }: { reg: Registration; profileId: string | null }) {
  const { settings } = useSettings();
  const profileUrl = profileId
    ? `${SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/players/${profileId}`
    : null;
  const initial = useMemo(
    () =>
      approvalMessage({
        academyName: settings.academy_name,
        playerName: reg.player_name,
        guardianName: reg.age_group === 'adult' ? null : reg.guardian_name,
        reference: reg.reference,
        profileUrl,
        academyPhone: settings.whatsapp || settings.phone || null,
      }),
    [settings.academy_name, settings.whatsapp, settings.phone, reg, profileUrl],
  );
  const [message, setMessage] = useState(initial);
  const wa = whatsappLink(reg.phone, message);
  const sms = smsLink(reg.phone, message);
  const number = whatsappNumber(reg.phone);

  return (
    <section aria-labelledby="notify-title" className="mt-6 rounded-md border-2 border-sky-500/50 bg-sky-50 p-5">
      <h3 id="notify-title" className="flex items-center gap-2 text-xl font-extrabold text-navy-900">
        <CheckCircle2 className="h-5 w-5 text-sky-600" aria-hidden="true" /> Notify the player
      </h3>
      <p className="mt-1 text-sm text-charcoal-600">
        Choose how to send the approval message. It opens ready to send — you just press <strong>Send</strong>.
        {number && (
          <>
            {' '}
            WhatsApp number: <strong>+{number}</strong> (check it is correct).
          </>
        )}
      </p>
      <label htmlFor="notify-message" className="mt-4 mb-1 block text-sm font-semibold">
        Message (you can edit it)
      </label>
      <textarea
        id="notify-message"
        rows={8}
        className="field-input font-sans text-sm"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <div className="mt-4 flex flex-wrap gap-3">
        {wa ? (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={buttonClass('navy', 'md', 'bg-[#128C7E] hover:bg-[#0e6f64]')}>
            <MessageCircle className="h-5 w-5" aria-hidden="true" /> Send on WhatsApp
          </a>
        ) : (
          <p className="text-sm text-cherry">The phone number looks invalid for WhatsApp.</p>
        )}
        {sms && (
          <a href={sms} className={buttonClass('outline-dark')}>
            <MessageSquare className="h-5 w-5" aria-hidden="true" /> Send SMS
          </a>
        )}
        {reg.email ? (
          <a
            href={emailLink(reg.email, `Registration approved — ${settings.academy_name}`, message)}
            className={buttonClass('outline-dark')}
          >
            <Mail className="h-5 w-5" aria-hidden="true" /> Send email
          </a>
        ) : (
          <span className="self-center text-sm text-charcoal-600">No email address was given.</span>
        )}
        {profileUrl && (
          <a href={`/players/${profileId}`} target="_blank" rel="noopener noreferrer" className={buttonClass('ghost')}>
            <ExternalLink className="h-4 w-4" aria-hidden="true" /> View public profile
          </a>
        )}
      </div>
      <p className="mt-3 text-xs text-charcoal-600">
        SMS opens your phone’s messages app (works on mobile; normal SMS charges from your phone plan may apply).
      </p>
    </section>
  );
}

export function RegistrationReview({
  reg,
  onClose,
  onChanged,
}: {
  reg: Registration;
  onClose: () => void;
  onChanged: (text: string, close: boolean) => void;
}) {
  const [status, setStatus] = useState<RegistrationStatus>(reg.status);
  const [notes, setNotes] = useState(reg.admin_notes ?? '');
  const [busy, setBusy] = useState<'save' | 'accept' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState<{ profileId: string | null } | null>(
    reg.status === 'accepted' ? { profileId: reg.player_profile_id } : null,
  );
  const photos = reg.photo_paths ?? [];
  const photoUrls = useSignedPhotos(photos);
  const showPublic = canShowPublicly(reg);

  const saveNotes = async () => {
    const res = await requireSupabase()
      .from('registrations')
      .update({ admin_notes: notes.trim() || null })
      .eq('id', reg.id)
      .select('id');
    if (res.error || !res.data?.length) throw new Error(friendlyDbError(res.error?.message ?? 'permission denied'));
  };

  const accept = async () => {
    setBusy('accept');
    setError(null);
    try {
      let published: string[] = [];
      if (showPublic && !reg.player_profile_id && photos.length) published = await publishPhotos(photos);
      const [photo = null, ...extras] = published;
      const res = await requireSupabase().rpc('accept_registration', {
        p_id: reg.id,
        p_photo_path: photo,
        p_extra_photos: extras,
      });
      if (res.error) throw new Error(friendlyDbError(res.error.message));
      await saveNotes();
      const profileId = (res.data as string | null) ?? null;
      setStatus('accepted');
      setAccepted({ profileId });
      onChanged(
        profileId
          ? `Accepted ${reg.reference}. ${reg.player_name} is now on the players page. Send the approval message below.`
          : `Accepted ${reg.reference}. Not shown on the website (no public-profile consent). Send the approval message below.`,
        false,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not accept this registration.');
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    if (status === 'accepted' && reg.status !== 'accepted') return accept();
    setBusy('save');
    setError(null);
    try {
      const patch: Record<string, unknown> = { status, admin_notes: notes.trim() || null };
      if (status === 'rejected' && photos.length) {
        const del = await requireSupabase().storage.from(REGISTRATION_BUCKET).remove(photos);
        if (del.error) throw new Error('The photos could not be deleted. Try again.');
        patch.photo_paths = [];
      }
      const res = await requireSupabase().from('registrations').update(patch).eq('id', reg.id).select('id');
      if (res.error || !res.data?.length) throw new Error(friendlyDbError(res.error?.message ?? 'permission denied'));
      onChanged(`Updated ${reg.reference} to ${labelFor(REGISTRATION_STATUSES, status)}.`, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setBusy(null);
    }
  };

  const rows: [string, string | null | undefined][] = [
    ['Reference', reg.reference],
    ['Submitted', formatDateTime(reg.created_at)],
    ['Player', reg.player_name],
    ['Parent / guardian', reg.guardian_name],
    ['Age group', labelFor(AGE_GROUPS, reg.age_group)],
    ['Phone', reg.phone],
    ['Email', reg.email],
    ['Main role', reg.playing_role ? labelFor(PLAYING_ROLES, reg.playing_role) : null],
    ['Batting', reg.batting_style],
    ['Bowling', reg.bowling_style],
    ['Achievements', reg.achievements],
    ['About the player', reg.about_player],
    ['Programme', reg.programme?.name ?? 'Not sure yet'],
    ['Experience', labelFor(EXPERIENCE_LEVELS, reg.experience_level)],
    ['Experience details', reg.experience_details],
    ['Preferred schedule', labelFor(SCHEDULES, reg.preferred_schedule)],
    ['Additional information', reg.additional_info],
    ['Guardian consent', reg.guardian_consent ? 'Yes' : reg.age_group === 'adult' ? 'Not needed (adult)' : 'No'],
    ['Show on website if accepted', reg.public_profile_consent ? 'Yes' : 'No'],
  ];

  return (
    <Panel className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-navy-900">{reg.player_name}</h2>
        <button type="button" onClick={onClose} className="rounded p-1 hover:bg-chalk">
          <X aria-hidden="true" />
          <span className="sr-only">Close details</span>
        </button>
      </div>

      {photos.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-3" aria-label="Uploaded photos (private)">
          {photoUrls.map((u, i) => (
            <li key={u}>
              <a href={u} target="_blank" rel="noopener noreferrer">
                <img
                  src={u}
                  alt={`${reg.player_name} — photo ${i + 1}${i === 0 ? ' (profile)' : ''}`}
                  className={`h-32 w-32 rounded-md object-cover ${i === 0 ? 'ring-4 ring-accent-500' : 'ring-1 ring-charcoal-400/40'}`}
                />
              </a>
            </li>
          ))}
          {photoUrls.length === 0 && <li className="text-sm text-charcoal-600">Loading photos…</li>}
        </ul>
      )}

      <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-sm text-charcoal-600">{k}</dt>
              <dd className="whitespace-pre-line font-semibold break-words">
                {k === 'Phone' ? (
                  <a href={`tel:${v!.replace(/[^0-9+]/g, '')}`} className="underline underline-offset-4">
                    {v}
                  </a>
                ) : k === 'Email' ? (
                  <a href={`mailto:${v}`} className="underline underline-offset-4">
                    {v}
                  </a>
                ) : (
                  v
                )}
              </dd>
            </div>
          ))}
      </dl>

      {!accepted && (
        <div className="mt-6 rounded-md bg-chalk p-4">
          <Button variant="accent" onClick={() => void accept()} disabled={busy !== null}>
            {busy === 'accept' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
            {showPublic ? 'Accept and add to players page' : 'Accept registration'}
          </Button>
          <p className="mt-2 text-sm text-charcoal-600">
            {showPublic
              ? 'Creates a public player profile with the name, photos and cricket details only (never phone, email or guardian). You can assign a team later under Players.'
              : 'The player did not agree to a public profile, so nothing will be shown on the website.'}
          </p>
        </div>
      )}

      {accepted && <NotifyPanel reg={reg} profileId={accepted.profileId} />}

      <div className="mt-6 grid gap-4 border-t border-charcoal-400/20 pt-5 sm:grid-cols-[220px_1fr]">
        <div>
          <label htmlFor="reg-status" className="mb-1.5 block font-semibold">
            Application status
          </label>
          <select id="reg-status" className="field-input" value={status} onChange={(e) => setStatus(e.target.value as RegistrationStatus)}>
            {REGISTRATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          {status === 'rejected' && photos.length > 0 && (
            <p className="mt-1 text-sm text-cherry">Saving as Rejected deletes the uploaded photos.</p>
          )}
        </div>
        <div>
          <label htmlFor="reg-notes" className="mb-1.5 block font-semibold">
            Private admin notes
          </label>
          <textarea id="reg-notes" rows={3} maxLength={2000} className="field-input" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      {error && (
        <div className="mt-4">
          <NoticeBar notice={{ kind: 'error', text: error }} />
        </div>
      )}
      <div className="mt-4 flex gap-3">
        <Button onClick={() => void save()} disabled={busy !== null}>
          {busy === 'save' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null} Save
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </Panel>
  );
}
