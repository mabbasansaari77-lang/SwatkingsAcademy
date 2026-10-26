import { CalendarDays, ClipboardList, Image, Inbox, Megaphone, Shield, Star, User, Users } from 'lucide-react';
import { Link } from 'react-router';
import { ErrorState, Loading } from '../components/ui/States';
import { formatDateTime } from '../lib/format';
import { AGE_GROUPS, labelFor, REGISTRATION_STATUSES } from '../lib/labels';
import { requireSupabase } from '../lib/supabase';
import type { Registration } from '../lib/types';
import { unwrap, useAsync } from '../lib/useAsync';
import { AdminPageHeader, Panel, Pill } from './ui';

type Filter = { column: string; op: 'eq' | 'gte'; value: string | boolean };

async function count(table: string, filters: Filter[] = []) {
  let q = requireSupabase().from(table).select('id', { count: 'exact', head: true });
  for (const f of filters) q = f.op === 'eq' ? q.eq(f.column, f.value) : q.gte(f.column, f.value as string);
  const { count: c, error } = await q;
  if (error) throw new Error(error.message);
  return c ?? 0;
}

const eq = (column: string, value: string | boolean): Filter => ({ column, op: 'eq', value });
const gte = (column: string, value: string): Filter => ({ column, op: 'gte', value });

async function loadOverview() {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const now = new Date().toISOString();
  const [total, pending, week, unread, pendingReviews, programmes, coaches, teams, upcoming, news, gallery, recent] = await Promise.all([
    count('registrations'),
    count('registrations', [eq('status', 'pending')]),
    count('registrations', [gte('created_at', weekAgo)]),
    count('contact_messages', [eq('is_read', false)]),
    count('reviews', [eq('status', 'pending')]),
    count('programmes', [eq('is_published', true)]),
    count('coaches', [eq('is_published', true)]),
    count('teams', [eq('is_published', true)]),
    count('fixtures', [gte('match_date', now), eq('is_published', true)]),
    count('announcements', [eq('status', 'published')]),
    count('gallery_items', [eq('is_published', true)]),
    requireSupabase()
      .from('registrations')
      .select('id, reference, player_name, age_group, status, created_at, programme:programmes(name)')
      .order('created_at', { ascending: false })
      .limit(6)
      .then((r) => unwrap(r) as unknown as Registration[]),
  ]);
  return { total, pending, week, unread, pendingReviews, programmes, coaches, teams, upcoming, news, gallery, recent };
}

export default function Dashboard() {
  const state = useAsync(loadOverview);

  if (state.loading && !state.data) return <Loading label="Loading overview" />;
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />;
  const d = state.data!;

  const primary = [
    { label: 'Pending registrations', value: d.pending, to: '/admin/registrations', icon: ClipboardList, accent: true },
    { label: 'New in the last 7 days', value: d.week, to: '/admin/registrations', icon: ClipboardList },
    { label: 'Total registrations', value: d.total, to: '/admin/registrations', icon: ClipboardList },
    { label: 'Unread messages', value: d.unread, to: '/admin/messages', icon: Inbox, accent: d.unread > 0 },
  ];
  const content = [
    { label: 'Reviews to approve', value: d.pendingReviews, to: '/admin/reviews', icon: Star },
    { label: 'Published programmes', value: d.programmes, to: '/admin/programmes', icon: Shield },
    { label: 'Published coaches', value: d.coaches, to: '/admin/coaches', icon: User },
    { label: 'Published teams', value: d.teams, to: '/admin/teams', icon: Users },
    { label: 'Upcoming fixtures', value: d.upcoming, to: '/admin/fixtures', icon: CalendarDays },
    { label: 'Published announcements', value: d.news, to: '/admin/announcements', icon: Megaphone },
    { label: 'Gallery items', value: d.gallery, to: '/admin/gallery', icon: Image },
  ];

  return (
    <div>
      <AdminPageHeader title="Overview" intro="Counts come straight from the database." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {primary.map(({ label, value, to, icon: Icon, accent }) => (
          <Link
            key={label}
            to={to}
            className={`rounded-lg p-5 shadow-[0_1px_2px_rgb(0_0_0/0.06)] transition-colors ${
              accent ? 'bg-navy-800 text-crease hover:bg-navy-700' : 'bg-white hover:bg-sky-100/50'
            }`}
          >
            <Icon className={`h-5 w-5 ${accent ? 'text-accent-300' : 'text-navy-600'}`} aria-hidden="true" />
            <p className="mt-3 font-display text-5xl font-black">{value}</p>
            <p className={accent ? 'text-crease/80' : 'text-charcoal-600'}>{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold text-navy-900">Latest registrations</h2>
            <Link to="/admin/registrations" className="text-sm font-semibold text-navy-800 underline">
              View all
            </Link>
          </div>
          {d.recent.length === 0 ? (
            <p className="py-6 text-charcoal-600">No registrations yet.</p>
          ) : (
            <ul className="divide-y divide-charcoal-400/15">
              {d.recent.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                  <span>
                    <span className="font-semibold">{r.player_name}</span>{' '}
                    <span className="text-sm text-charcoal-600">
                      {labelFor(AGE_GROUPS, r.age_group)}
                      {r.programme?.name ? ` — ${r.programme.name}` : ''}
                    </span>
                    <span className="block text-xs text-charcoal-600">
                      {r.reference} — {formatDateTime(r.created_at)}
                    </span>
                  </span>
                  <Pill value={r.status} label={labelFor(REGISTRATION_STATUSES, r.status)} />
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel>
          <h2 className="mb-3 text-2xl font-extrabold text-navy-900">Website content</h2>
          <ul className="divide-y divide-charcoal-400/15">
            {content.map(({ label, value, to, icon: Icon }) => (
              <li key={label}>
                <Link to={to} className="flex items-center gap-3 py-2.5 hover:text-navy-600">
                  <Icon className="h-4 w-4 text-navy-600" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  <span className="font-display text-2xl font-black">{value}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
