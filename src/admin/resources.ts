import { formatDate, formatDateTime } from '../lib/format';
import {
  ANNOUNCEMENT_CATEGORIES,
  FIXTURE_STATUSES,
  HOME_AWAY,
  labelFor,
  OUTCOMES,
  PLAYING_ROLES,
  PROGRAMME_CATEGORIES,
  PROGRAMME_STATUSES,
} from '../lib/labels';
import type { MediaFolder } from '../lib/media';

type Option = { readonly value: string; readonly label: string };
type Row = Record<string, unknown>;

export type FieldDef =
  | { name: string; label: string; type: 'text' | 'textarea' | 'url'; required?: boolean; max?: number; hint?: string; rows?: number }
  | { name: string; label: string; type: 'slug'; from: string; hint?: string }
  | { name: string; label: string; type: 'number'; min?: number; max?: number; hint?: string }
  | { name: string; label: string; type: 'select'; options: readonly Option[]; required?: boolean; hint?: string }
  | {
      name: string;
      label: string;
      type: 'relation';
      table: string;
      select: string;
      optionLabel: (row: Row) => string;
      order: string;
      ascending?: boolean;
      required?: boolean;
      hint?: string;
    }
  | { name: string; label: string; type: 'checkbox'; hint?: string }
  | { name: string; label: string; type: 'datetime'; required?: boolean; hint?: string }
  | { name: string; label: string; type: 'image'; folder: MediaFolder; hint?: string };

export interface ColumnDef {
  label: string;
  render: (row: Row) => string;
  pill?: (row: Row) => { value: string; label: string } | null;
}

export interface ResourceDef {
  path: string;
  table: string;
  title: string;
  singular: string;
  intro: string;
  select: string;
  order: { column: string; ascending: boolean }[];
  searchColumn: string;
  fields: FieldDef[];
  columns: ColumnDef[];
  defaults: Row;
  /** Extra per-row links, e.g. to manage a player's photos */
  rowLinks?: { label: string; to: (row: Row) => string }[];
  /** Adjust values just before saving */
  beforeSave?: (values: Row) => Row;
}

const yesNo = (v: unknown, yes = 'Published', no = 'Hidden') => ({ value: v ? 'yes' : 'no', label: v ? yes : no });
const str = (v: unknown) => (v == null ? '' : String(v));

const coachRelation = {
  type: 'relation' as const,
  table: 'coaches',
  select: 'id, name',
  optionLabel: (r: Row) => str(r.name),
  order: 'name',
};

export const RESOURCES: ResourceDef[] = [
  {
    path: 'programmes',
    table: 'programmes',
    title: 'Programmes',
    singular: 'programme',
    intro: 'Coaching programmes shown on the website. Leave fees empty to show “Contact us for details”.',
    select: '*, coach:coaches(name)',
    order: [
      { column: 'sort_order', ascending: true },
      { column: 'name', ascending: true },
    ],
    searchColumn: 'name',
    defaults: { status: 'open', category: 'beginner', is_published: false, sort_order: 0 },
    fields: [
      { name: 'name', label: 'Programme name', type: 'text', required: true, max: 120 },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', from: 'name', hint: 'Used in links, e.g. beginner-cricket' },
      { name: 'category', label: 'Category', type: 'select', options: PROGRAMME_CATEGORIES, required: true },
      { name: 'status', label: 'Status', type: 'select', options: PROGRAMME_STATUSES, required: true },
      { name: 'summary', label: 'Short summary', type: 'text', max: 300, hint: 'One sentence shown on cards.' },
      { name: 'description', label: 'Full description', type: 'textarea', max: 4000, rows: 5 },
      { name: 'age_group', label: 'Age group', type: 'text', max: 80, hint: 'e.g. Under 12 to Under 16' },
      { name: 'schedule', label: 'Training schedule', type: 'text', max: 300, hint: 'e.g. Mon, Wed, Fri 4–6 pm' },
      { name: 'location', label: 'Location', type: 'text', max: 200 },
      { name: 'coach_id', label: 'Coach', ...coachRelation },
      { name: 'capacity', label: 'Capacity', type: 'number', min: 0, max: 1000 },
      { name: 'spots_available', label: 'Places available', type: 'number', min: 0, max: 1000 },
      { name: 'fee_text', label: 'Fees', type: 'text', max: 120, hint: 'Optional. e.g. PKR 3,000 per month' },
      { name: 'sort_order', label: 'Display order', type: 'number', min: 0, hint: 'Lower numbers appear first.' },
      { name: 'is_published', label: 'Show on website', type: 'checkbox' },
    ],
    columns: [
      { label: 'Name', render: (r) => str(r.name) },
      { label: 'Category', render: (r) => labelFor(PROGRAMME_CATEGORIES, str(r.category)) },
      { label: 'Status', render: (r) => labelFor(PROGRAMME_STATUSES, str(r.status)) },
      { label: 'Website', render: () => '', pill: (r) => yesNo(r.is_published) },
    ],
  },
  {
    path: 'coaches',
    table: 'coaches',
    title: 'Coaches',
    singular: 'coach',
    intro: 'Only enter qualifications you have checked. They appear publicly only when marked as verified.',
    select: '*',
    order: [
      { column: 'sort_order', ascending: true },
      { column: 'name', ascending: true },
    ],
    searchColumn: 'name',
    defaults: { is_published: false, qualifications_verified: false, sort_order: 0 },
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true, max: 120 },
      { name: 'role_title', label: 'Role', type: 'text', max: 120, hint: 'e.g. Head Coach, Bowling Coach' },
      { name: 'specialisation', label: 'Specialisation', type: 'text', max: 200 },
      { name: 'bio', label: 'Biography', type: 'textarea', max: 4000, rows: 5 },
      { name: 'qualifications', label: 'Qualifications', type: 'textarea', max: 2000, rows: 3 },
      {
        name: 'qualifications_verified',
        label: 'Qualifications verified',
        type: 'checkbox',
        hint: 'Tick only after seeing proof. Required before qualifications can be saved.',
      },
      { name: 'photo_url', label: 'Photo', type: 'image', folder: 'coaches', hint: 'Portrait photo, JPG/PNG/WebP up to 5 MB.' },
      { name: 'sort_order', label: 'Display order', type: 'number', min: 0 },
      { name: 'is_published', label: 'Show on website', type: 'checkbox' },
    ],
    columns: [
      { label: 'Name', render: (r) => str(r.name) },
      { label: 'Role', render: (r) => str(r.role_title) },
      { label: 'Verified', render: () => '', pill: (r) => yesNo(r.qualifications_verified, 'Verified', 'Not verified') },
      { label: 'Website', render: () => '', pill: (r) => yesNo(r.is_published) },
    ],
  },
  {
    path: 'teams',
    table: 'teams',
    title: 'Teams',
    singular: 'team',
    intro: 'Squads and age groups.',
    select: '*, coach:coaches(name)',
    order: [
      { column: 'sort_order', ascending: true },
      { column: 'name', ascending: true },
    ],
    searchColumn: 'name',
    defaults: { is_published: false, sort_order: 0 },
    fields: [
      { name: 'name', label: 'Team name', type: 'text', required: true, max: 120 },
      { name: 'age_group', label: 'Age group', type: 'text', max: 80 },
      { name: 'description', label: 'Description', type: 'textarea', max: 2000 },
      { name: 'coach_id', label: 'Coach', ...coachRelation },
      { name: 'sort_order', label: 'Display order', type: 'number', min: 0 },
      { name: 'is_published', label: 'Show on website', type: 'checkbox' },
    ],
    columns: [
      { label: 'Team', render: (r) => str(r.name) },
      { label: 'Age group', render: (r) => str(r.age_group) },
      { label: 'Coach', render: (r) => str((r.coach as Row | null)?.name) },
      { label: 'Website', render: () => '', pill: (r) => yesNo(r.is_published) },
    ],
  },
  {
    path: 'players',
    table: 'player_profiles',
    title: 'Player profiles',
    singular: 'player profile',
    intro:
      'Optional public profiles. Use a display name (e.g. first name and initial). Never add dates of birth, addresses or contact details. A profile can be public only after consent is confirmed.',
    select: '*, team:teams(name)',
    order: [
      { column: 'sort_order', ascending: true },
      { column: 'display_name', ascending: true },
    ],
    searchColumn: 'display_name',
    defaults: { is_public: false, consent_confirmed: false, sort_order: 0 },
    fields: [
      { name: 'display_name', label: 'Display name', type: 'text', required: true, max: 80, hint: 'e.g. Ahmed K.' },
      {
        name: 'team_id',
        label: 'Team',
        type: 'relation',
        table: 'teams',
        select: 'id, name',
        optionLabel: (r) => str(r.name),
        order: 'name',
      },
      { name: 'playing_role', label: 'Playing role', type: 'select', options: PLAYING_ROLES },
      { name: 'batting_style', label: 'Batting style', type: 'text', max: 60, hint: 'e.g. Right-hand bat' },
      { name: 'bowling_style', label: 'Bowling style', type: 'text', max: 60, hint: 'e.g. Left-arm spin' },
      { name: 'approved_achievements', label: 'Approved achievements', type: 'textarea', max: 2000, hint: 'Only verified achievements.' },
      {
        name: 'bio',
        label: 'About the player (profile page text)',
        type: 'textarea',
        max: 3000,
        rows: 5,
        hint: 'Shown on the player’s own page. No dates of birth, school, address or contact details.',
      },
      { name: 'photo_url', label: 'Profile photo', type: 'image', folder: 'players', hint: 'Main photo. Only with consent. Add more photos and videos with “Photos & videos” in the list below.' },
      {
        name: 'consent_confirmed',
        label: 'Consent confirmed',
        type: 'checkbox',
        hint: 'Player (or parent/guardian for under-19s) agreed to a public profile.',
      },
      { name: 'is_public', label: 'Show on website', type: 'checkbox' },
      { name: 'sort_order', label: 'Display order', type: 'number', min: 0 },
    ],
    columns: [
      { label: 'Name', render: (r) => str(r.display_name) },
      { label: 'Team', render: (r) => str((r.team as Row | null)?.name) },
      { label: 'Consent', render: () => '', pill: (r) => yesNo(r.consent_confirmed, 'Confirmed', 'Not confirmed') },
      { label: 'Website', render: () => '', pill: (r) => yesNo(r.is_public) },
    ],
    rowLinks: [{ label: 'Photos & videos', to: (r) => `/admin/players/${String(r.id)}/media` }],
  },
  {
    path: 'fixtures',
    table: 'fixtures',
    title: 'Fixtures',
    singular: 'fixture',
    intro: 'Matches. Add the result in Results after the game.',
    select: '*, team:teams(name)',
    order: [{ column: 'match_date', ascending: false }],
    searchColumn: 'opponent',
    defaults: { status: 'scheduled', is_published: false },
    fields: [
      {
        name: 'team_id',
        label: 'Our team',
        type: 'relation',
        table: 'teams',
        select: 'id, name',
        optionLabel: (r) => str(r.name),
        order: 'name',
      },
      { name: 'opponent', label: 'Opponent', type: 'text', required: true, max: 160 },
      { name: 'match_date', label: 'Date and time', type: 'datetime', required: true },
      { name: 'tournament', label: 'Tournament', type: 'text', max: 160 },
      { name: 'venue', label: 'Venue', type: 'text', max: 200 },
      { name: 'match_format', label: 'Format', type: 'text', max: 60, hint: 'e.g. T20, 40 overs' },
      { name: 'home_away', label: 'Home or away', type: 'select', options: HOME_AWAY },
      { name: 'status', label: 'Status', type: 'select', options: FIXTURE_STATUSES, required: true },
      { name: 'notes', label: 'Notes', type: 'textarea', max: 1000 },
      { name: 'is_published', label: 'Show on website', type: 'checkbox' },
    ],
    columns: [
      { label: 'Date', render: (r) => formatDateTime(str(r.match_date)) },
      { label: 'Match', render: (r) => `${str((r.team as Row | null)?.name) || 'Swat Kings'} v ${str(r.opponent)}` },
      { label: 'Status', render: (r) => labelFor(FIXTURE_STATUSES, str(r.status)) },
      { label: 'Website', render: () => '', pill: (r) => yesNo(r.is_published) },
    ],
  },
  {
    path: 'results',
    table: 'match_results',
    title: 'Results',
    singular: 'result',
    intro: 'Enter results manually after each match. A result shows publicly only if both the result and its fixture are published.',
    select: '*, fixture:fixtures(opponent, match_date)',
    order: [{ column: 'created_at', ascending: false }],
    searchColumn: 'result_summary',
    defaults: { outcome: 'won', is_published: false },
    fields: [
      {
        name: 'fixture_id',
        label: 'Fixture',
        type: 'relation',
        table: 'fixtures',
        select: 'id, opponent, match_date',
        optionLabel: (r) => `${formatDate(str(r.match_date))} — v ${str(r.opponent)}`,
        order: 'match_date',
        ascending: false,
        required: true,
      },
      { name: 'outcome', label: 'Outcome', type: 'select', options: OUTCOMES, required: true },
      { name: 'our_score', label: 'Our score', type: 'text', max: 60, hint: 'e.g. 156/7 (20 ov)' },
      { name: 'opponent_score', label: 'Opponent score', type: 'text', max: 60 },
      { name: 'result_summary', label: 'Result summary', type: 'text', max: 300, hint: 'e.g. Won by 23 runs' },
      { name: 'scorecard_summary', label: 'Scorecard summary', type: 'textarea', max: 4000, rows: 5 },
      { name: 'player_of_match', label: 'Player of the match', type: 'text', max: 80 },
      { name: 'is_published', label: 'Show on website', type: 'checkbox' },
    ],
    columns: [
      {
        label: 'Fixture',
        render: (r) => {
          const f = r.fixture as Row | null;
          return f ? `${formatDate(str(f.match_date))} v ${str(f.opponent)}` : '';
        },
      },
      { label: 'Outcome', render: (r) => labelFor(OUTCOMES, str(r.outcome)) },
      { label: 'Score', render: (r) => [str(r.our_score), str(r.opponent_score)].filter(Boolean).join(' / ') },
      { label: 'Website', render: () => '', pill: (r) => yesNo(r.is_published) },
    ],
  },
  {
    path: 'faqs',
    table: 'faqs',
    title: 'FAQ',
    singular: 'question',
    intro:
      'Questions and answers shown on the home page and /faq. Google and AI assistants often quote these directly, so answer clearly in 1–3 sentences and only with facts you can confirm. Ideas: What age can my child join? Where and when do you train? How do trials work? What should players bring? Do beginners need experience? How much are the fees?',
    select: 'id, question, answer, is_published, sort_order',
    order: [
      { column: 'sort_order', ascending: true },
      { column: 'created_at', ascending: true },
    ],
    searchColumn: 'question',
    defaults: { is_published: true, sort_order: 0 },
    fields: [
      { name: 'question', label: 'Question', type: 'text', required: true, max: 200, hint: 'Write it the way a parent would ask it.' },
      { name: 'answer', label: 'Answer', type: 'textarea', required: true, max: 2000, rows: 4, hint: 'Short and factual. Mention Swat where it fits naturally.' },
      { name: 'sort_order', label: 'Display order', type: 'number', min: 0, hint: 'Lower numbers appear first.' },
      { name: 'is_published', label: 'Show on website', type: 'checkbox' },
    ],
    columns: [
      { label: 'Question', render: (r) => str(r.question) },
      { label: 'Website', render: () => '', pill: (r) => yesNo(r.is_published) },
    ],
  },
  {
    path: 'announcements',
    table: 'announcements',
    title: 'Announcements',
    singular: 'announcement',
    intro: 'News and notices. Drafts are never shown publicly. Separate paragraphs with a blank line.',
    select: 'id, slug, title, excerpt, body, category, cover_image_url, cover_image_alt, status, published_at, created_at',
    order: [{ column: 'created_at', ascending: false }],
    searchColumn: 'title',
    defaults: { status: 'draft', category: 'news' },
    fields: [
      { name: 'title', label: 'Title', type: 'text', required: true, max: 200 },
      { name: 'slug', label: 'Web address (slug)', type: 'slug', from: 'title' },
      { name: 'category', label: 'Category', type: 'select', options: ANNOUNCEMENT_CATEGORIES, required: true },
      { name: 'excerpt', label: 'Short summary', type: 'text', max: 400 },
      { name: 'body', label: 'Article text', type: 'textarea', max: 20000, rows: 10 },
      { name: 'cover_image_url', label: 'Cover image', type: 'image', folder: 'news' },
      { name: 'cover_image_alt', label: 'Cover image description (alt text)', type: 'text', max: 200, hint: 'Describe the image for visually impaired visitors.' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'draft', label: 'Draft (hidden)' },
          { value: 'published', label: 'Published' },
        ],
        required: true,
      },
      { name: 'published_at', label: 'Publish date', type: 'datetime', hint: 'Leave empty to use the current time when publishing.' },
    ],
    columns: [
      { label: 'Title', render: (r) => str(r.title) },
      { label: 'Category', render: (r) => labelFor(ANNOUNCEMENT_CATEGORIES, str(r.category)) },
      { label: 'Published', render: (r) => formatDate(str(r.published_at)) },
      { label: 'Status', render: () => '', pill: (r) => ({ value: str(r.status), label: str(r.status) === 'published' ? 'Published' : 'Draft' }) },
    ],
    beforeSave: (v) => (v.status === 'published' && !v.published_at ? { ...v, published_at: new Date().toISOString() } : v),
  },
];
