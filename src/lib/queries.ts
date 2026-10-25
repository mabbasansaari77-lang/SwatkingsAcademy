import { requireSupabase } from './supabase';
import type { Announcement, Coach, Fixture, GalleryItem, MatchResult, PlayerProfile, Programme, Team } from './types';
import { unwrap } from './useAsync';

// Read-only queries used by the public website. RLS on the server makes sure
// only published / approved rows are ever returned to visitors.

export async function fetchProgrammes(limit?: number): Promise<Programme[]> {
  let q = requireSupabase()
    .from('programmes')
    .select('*, coach:coaches(name)')
    .eq('is_published', true)
    .order('sort_order')
    .order('name');
  if (limit) q = q.limit(limit);
  return unwrap(await q) as Programme[];
}

export async function fetchCoaches(limit?: number): Promise<Coach[]> {
  let q = requireSupabase().from('coaches').select('*').eq('is_published', true).order('sort_order').order('name');
  if (limit) q = q.limit(limit);
  return unwrap(await q) as Coach[];
}

export interface TeamWithPlayers extends Team {
  players: PlayerProfile[];
}

export async function fetchTeamsWithPlayers(): Promise<{ teams: TeamWithPlayers[]; unassigned: PlayerProfile[] }> {
  const client = requireSupabase();
  const [teams, players] = await Promise.all([
    client.from('teams').select('*, coach:coaches(name)').eq('is_published', true).order('sort_order').order('name'),
    client
      .from('player_profiles')
      .select('id, team_id, display_name, playing_role, batting_style, bowling_style, approved_achievements, photo_url, sort_order')
      .eq('is_public', true)
      .order('sort_order')
      .order('display_name'),
  ]);
  const teamRows = unwrap(teams) as Team[];
  const playerRows = unwrap(players) as PlayerProfile[];
  return {
    teams: teamRows.map((t) => ({ ...t, players: playerRows.filter((p) => p.team_id === t.id) })),
    unassigned: playerRows.filter((p) => !p.team_id),
  };
}

const FIXTURE_SELECT = '*, team:teams(name), result:match_results(*)';

export function resultOf(f: Fixture): MatchResult | null {
  if (!f.result) return null;
  return Array.isArray(f.result) ? (f.result[0] ?? null) : f.result;
}

export async function fetchUpcomingFixtures(limit?: number): Promise<Fixture[]> {
  let q = requireSupabase()
    .from('fixtures')
    .select(FIXTURE_SELECT)
    .eq('is_published', true)
    .gte('match_date', new Date(Date.now() - 6 * 3600 * 1000).toISOString())
    .in('status', ['scheduled', 'postponed'])
    .order('match_date', { ascending: true });
  if (limit) q = q.limit(limit);
  return unwrap(await q) as Fixture[];
}

export async function fetchPastFixtures(limit?: number): Promise<Fixture[]> {
  let q = requireSupabase()
    .from('fixtures')
    .select(FIXTURE_SELECT)
    .eq('is_published', true)
    .or(`match_date.lt.${new Date().toISOString()},status.in.(completed,cancelled,abandoned)`)
    .order('match_date', { ascending: false });
  if (limit) q = q.limit(limit);
  const rows = unwrap(await q) as Fixture[];
  return rows.filter((f) => f.status !== 'scheduled' || resultOf(f));
}

export async function fetchAnnouncements(limit?: number): Promise<Announcement[]> {
  let q = requireSupabase()
    .from('announcements')
    .select('id, slug, title, excerpt, category, cover_image_url, cover_image_alt, status, published_at, created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (limit) q = q.limit(limit);
  return unwrap(await q) as Announcement[];
}

export async function fetchAnnouncement(slug: string): Promise<Announcement | null> {
  const res = await requireSupabase()
    .from('announcements')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return unwrap(res) as Announcement | null;
}

export async function fetchGallery(limit?: number): Promise<GalleryItem[]> {
  let q = requireSupabase()
    .from('gallery_items')
    .select('*')
    .eq('is_published', true)
    .order('sort_order')
    .order('created_at', { ascending: false });
  if (limit) q = q.limit(limit);
  return unwrap(await q) as GalleryItem[];
}

export interface PublicCounts {
  programmes: number;
  coaches: number;
  teams: number;
}

/** Counts of real published records. Used only when every value is above zero. */
export async function fetchPublicCounts(): Promise<PublicCounts> {
  const client = requireSupabase();
  const count = async (table: string) => {
    const { count: c, error } = await client
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true);
    if (error) throw new Error(error.message);
    return c ?? 0;
  };
  const [programmes, coaches, teams] = await Promise.all([count('programmes'), count('coaches'), count('teams')]);
  return { programmes, coaches, teams };
}
