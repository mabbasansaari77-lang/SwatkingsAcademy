import { z } from 'zod';
import { AGE_GROUPS, BATTING_STYLES, BOWLING_STYLES, EXPERIENCE_LEVELS, PLAYING_ROLES, SCHEDULES } from './labels';

// These rules mirror the server-side checks in
// supabase/migrations/20261025000003_public_submission_functions.sql.
// The server re-validates everything; these exist for fast, friendly feedback.

export const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;
export const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const values = <T extends readonly { value: string }[]>(opts: T) =>
  opts.map((o) => o.value) as [T[number]['value'], ...T[number]['value'][]];

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .optional()
    .transform((v) => (v ? v : undefined));

export const registrationSchema = z
  .object({
    player_name: z
      .string()
      .trim()
      .min(2, 'Enter the player’s full name.')
      .max(120, 'Name must be 120 characters or fewer.'),
    guardian_name: optionalText(120, 'Name must be 120 characters or fewer.'),
    age_group: z.enum(values(AGE_GROUPS), { errorMap: () => ({ message: 'Choose an age group.' }) }),
    phone: z.string().trim().regex(PHONE_PATTERN, 'Enter a phone number using digits, spaces, + or -.'),
    email: z
      .string()
      .trim()
      .max(254, 'Email is too long.')
      .refine((v) => v === '' || EMAIL_PATTERN.test(v), 'Enter a valid email address or leave it empty.')
      .optional()
      .transform((v) => (v ? v.toLowerCase() : undefined)),
    programme_id: z
      .string()
      .optional()
      .transform((v) => (v ? v : undefined)),
    experience_level: z.enum(values(EXPERIENCE_LEVELS), {
      errorMap: () => ({ message: 'Choose the player’s experience.' }),
    }),
    experience_details: optionalText(1000, 'Keep this under 1000 characters.'),
    preferred_schedule: z.enum(values(SCHEDULES), {
      errorMap: () => ({ message: 'Choose a preferred schedule.' }),
    }),
    additional_info: optionalText(1500, 'Keep this under 1500 characters.'),
    playing_role: z
      .union([z.enum(values(PLAYING_ROLES)), z.literal('')])
      .optional()
      .transform((v) => (v ? v : undefined)),
    batting_style: z
      .union([z.enum(values(BATTING_STYLES)), z.literal('')])
      .optional()
      .transform((v) => (v ? v : undefined)),
    bowling_style: z
      .union([z.enum(values(BOWLING_STYLES)), z.literal('')])
      .optional()
      .transform((v) => (v ? v : undefined)),
    achievements: optionalText(2000, 'Keep this under 2000 characters.'),
    about_player: optionalText(1000, 'Keep this under 1000 characters.'),
    public_profile_consent: z.boolean().default(false),
    guardian_consent: z.boolean().default(false),
    privacy_acknowledged: z.literal(true, {
      errorMap: () => ({ message: 'Confirm you have read the privacy notice.' }),
    }),
    // Honeypot. Hidden from people; bots tend to fill it in.
    website: z.string().max(200).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.age_group !== 'adult') {
      if (!data.guardian_name || data.guardian_name.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardian_name'],
          message: 'A parent or guardian name is required for players under 19.',
        });
      }
      if (!data.guardian_consent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['guardian_consent'],
          message: 'Parent or guardian consent is required for players under 19.',
        });
      }
    }
  });

export type RegistrationInput = z.input<typeof registrationSchema>;
export type RegistrationData = z.output<typeof registrationSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(120, 'Name must be 120 characters or fewer.'),
  contact: z
    .string()
    .trim()
    .min(5, 'Enter an email address or phone number.')
    .max(254, 'This is too long.')
    .refine(
      (v) => EMAIL_PATTERN.test(v) || PHONE_PATTERN.test(v),
      'Enter a valid email address or phone number.',
    ),
  subject: z.string().trim().min(3, 'Enter a subject.').max(160, 'Keep the subject under 160 characters.'),
  message: z
    .string()
    .trim()
    .min(10, 'Write at least 10 characters.')
    .max(4000, 'Keep your message under 4000 characters.'),
  website: z.string().max(200).optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Extracts an 11-character YouTube video id from common URL formats. */
export function parseYouTubeId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1);
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v');
      else {
        const m = u.pathname.match(/^\/(embed|shorts|live)\/([^/]+)/);
        id = m ? m[2] : null;
      }
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
