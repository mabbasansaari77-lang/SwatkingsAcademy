// Generates dist/sitemap.xml and dist/robots.txt after `vite build`.
// Uses VITE_SITE_URL (and, if available, the public Supabase key to list
// published news articles). Runs automatically as part of `npm run build`.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');

// Load .env files the same way Vite does for local builds (Cloudflare
// provides real environment variables instead).
const env = { ...process.env };
for (const file of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  const path = resolve(root, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const siteUrl = (env.VITE_SITE_URL || '').replace(/\/$/, '');
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY;

const staticRoutes = [
  ['/', '1.0', 'weekly'],
  ['/about', '0.8', 'monthly'],
  ['/programmes', '0.9', 'weekly'],
  ['/coaches', '0.7', 'monthly'],
  ['/teams', '0.6', 'monthly'],
  ['/fixtures', '0.8', 'weekly'],
  ['/news', '0.8', 'weekly'],
  ['/gallery', '0.6', 'weekly'],
  ['/register', '0.9', 'monthly'],
  ['/contact', '0.7', 'monthly'],
  ['/privacy', '0.3', 'yearly'],
];

async function newsRoutes() {
  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project-ref')) return [];
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/announcements?select=slug,published_at&status=eq.published&order=published_at.desc&limit=500`,
      { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    return rows.map((r) => ({ path: `/news/${r.slug}`, lastmod: r.published_at?.slice(0, 10) }));
  } catch (err) {
    console.warn(`[sitemap] Could not load news articles (${err.message}). Continuing without them.`);
    return [];
  }
}

const escapeXml = (s) => s.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

if (!existsSync(dist)) {
  console.error('[sitemap] dist/ not found. Run vite build first.');
  process.exit(1);
}

const robots = ['User-agent: *', 'Allow: /', 'Disallow: /admin', ''];

if (!siteUrl) {
  console.warn('[sitemap] VITE_SITE_URL is not set — skipping sitemap.xml. Set it after your first deployment.');
  writeFileSync(resolve(dist, 'robots.txt'), robots.join('\n'));
} else {
  const today = new Date().toISOString().slice(0, 10);
  const news = await newsRoutes();
  const urls = [
    ...staticRoutes.map(([path, priority, changefreq]) => ({ path, priority, changefreq, lastmod: today })),
    ...news.map((n) => ({ ...n, priority: '0.6', changefreq: 'monthly' })),
  ];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(
      (u) =>
        `  <url><loc>${escapeXml(siteUrl + (u.path === '/' ? '/' : u.path))}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');
  writeFileSync(resolve(dist, 'sitemap.xml'), xml);
  robots.push(`Sitemap: ${siteUrl}/sitemap.xml`, '');
  writeFileSync(resolve(dist, 'robots.txt'), robots.join('\n'));
  console.log(`[sitemap] Wrote ${urls.length} URLs to dist/sitemap.xml`);
}
