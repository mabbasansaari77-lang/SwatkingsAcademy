/**
 * Build-time renderer used by scripts/prerender.mjs.
 * It loads public content with the same queries as the browser (RLS still
 * applies: only published, approved data is visible) and renders each page
 * to static HTML so search engines and AI assistants can read it without JavaScript.
 */
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import { AuthProvider } from './lib/auth';
import { loadBanners } from './lib/banners';
import { DEFAULT_SETTINGS } from './lib/defaultSettings';
import {
  fetchAnnouncement,
  fetchAnnouncements,
  fetchCoaches,
  fetchFaqs,
  fetchGallery,
  fetchHomeGallery,
  fetchPastFixtures,
  fetchPlayer,
  fetchProgrammes,
  fetchPublicCounts,
  fetchTeamsWithPlayers,
  fetchUpcomingFixtures,
} from './lib/queries';
import { SettingsProvider } from './lib/settings';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import type { SiteSettings } from './lib/types';

type Data = Record<string, unknown>;

async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[prerender] Could not load ${label}: ${err instanceof Error ? err.message : String(err)}`);
    return undefined;
  }
}

export interface SiteData {
  shared: Data;
  pages: Record<string, Data>;
  /** Extra info for the sitemap and llms.txt */
  meta: {
    settings: SiteSettings;
    programmes: { name: string; summary: string | null; age_group: string | null; slug: string }[];
    articles: { slug: string; title: string; published_at: string | null; excerpt: string | null }[];
    players: { id: string; display_name: string }[];
    faqs: { question: string; answer: string }[];
  };
}

/** Fetches everything public that the pre-rendered pages need. */
export async function collect(): Promise<SiteData> {
  const empty: SiteData = {
    shared: {},
    pages: {},
    meta: { settings: DEFAULT_SETTINGS, programmes: [], articles: [], players: [], faqs: [] },
  };
  if (!isSupabaseConfigured || !supabase) return empty;

  const settingsRes = await safe('settings', async () => {
    const { data, error } = await supabase!.from('site_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw new Error(error.message);
    return data ? ({ ...DEFAULT_SETTINGS, ...data } as SiteSettings) : DEFAULT_SETTINGS;
  });
  const settings = settingsRes ?? DEFAULT_SETTINGS;
  const banners = await safe('banners', () => loadBanners(true));

  const [counts, homeProgrammes, homeCoaches, homeUp, homePast, homeGallery, homeNews, faqs] = await Promise.all([
    safe('counts', fetchPublicCounts),
    safe('home programmes', () => fetchProgrammes(4)),
    safe('home coaches', () => fetchCoaches(3)),
    safe('home fixtures', () => fetchUpcomingFixtures(3)),
    safe('home results', () => fetchPastFixtures(3)),
    safe('home gallery', () => fetchHomeGallery(8)),
    safe('home news', () => fetchAnnouncements(3)),
    safe('faqs', fetchFaqs),
  ]);
  const [programmes, coaches, teams, upcoming, past, news, gallery] = await Promise.all([
    safe('programmes', () => fetchProgrammes()),
    safe('coaches', () => fetchCoaches()),
    safe('teams', fetchTeamsWithPlayers),
    safe('fixtures', () => fetchUpcomingFixtures()),
    safe('results', () => fetchPastFixtures(50)),
    safe('news', () => fetchAnnouncements()),
    safe('gallery', () => fetchGallery()),
  ]);

  const pages: Record<string, Data> = {
    '/': {
      counts,
      'home:programmes': homeProgrammes,
      'home:coaches': homeCoaches,
      'home:upcoming': homeUp,
      'home:past': homePast,
      'home:gallery': homeGallery,
      'home:news': homeNews,
      faqs,
    },
    '/programmes': { programmes },
    '/coaches': { coaches },
    '/teams': { teams },
    '/fixtures': { 'fixtures:upcoming': upcoming, 'fixtures:past': past },
    '/news': { news },
    '/gallery': { gallery },
    '/faq': { faqs },
  };

  for (const a of news ?? []) {
    const full = await safe(`article ${a.slug}`, () => fetchAnnouncement(a.slug));
    if (full) pages[`/news/${a.slug}`] = { [`news:${a.slug}`]: full };
  }

  const allPlayers = teams ? [...teams.teams.flatMap((t) => t.players), ...teams.unassigned] : [];
  for (const p of allPlayers) {
    const full = await safe(`player ${p.id}`, () => fetchPlayer(p.id));
    if (full) pages[`/players/${p.id}`] = { [`player:${p.id}`]: full };
  }

  return {
    shared: { settings, banners },
    pages,
    meta: {
      settings,
      programmes: (programmes ?? []).map((p) => ({ name: p.name, summary: p.summary, age_group: p.age_group, slug: p.slug })),
      articles: (news ?? []).map((a) => ({ slug: a.slug, title: a.title, published_at: a.published_at, excerpt: a.excerpt })),
      players: allPlayers.map((p) => ({ id: p.id, display_name: p.display_name })),
      faqs: (faqs ?? []).map((f) => ({ question: f.question, answer: f.answer })),
    },
  };
}

/** Renders one page. `data` is also embedded in the HTML for the browser to reuse. */
export function render(url: string, data: Data): string {
  globalThis.__SKCA_DATA__ = data;
  try {
    return renderToString(
      <StaticRouter location={url}>
        <SettingsProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SettingsProvider>
      </StaticRouter>,
    );
  } finally {
    globalThis.__SKCA_DATA__ = undefined;
  }
}
