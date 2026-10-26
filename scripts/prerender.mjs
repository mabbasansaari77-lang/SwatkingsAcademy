// Runs after `vite build` and `vite build --ssr`. It:
//   1. loads public content from Supabase (same queries and RLS as the site),
//   2. writes a ready-made HTML file for every public page (dist/about.html, dist/news/<slug>.html, ...),
//   3. writes 404.html (app shell, used for /admin and unknown addresses),
//   4. writes sitemap.xml, robots.txt and llms.txt.
// If Supabase cannot be reached the build still succeeds: pages are rendered
// without database content and the browser loads it live as before.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const ssrEntry = resolve(root, 'dist-ssr', 'entry-server.js');

// Load .env files for local builds (Cloudflare passes real environment variables).
for (const file of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  const path = resolve(root, file);
  if (!existsSync(path)) continue;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
const siteUrl = (process.env.VITE_SITE_URL || '').replace(/\/$/, '');

const STATIC_ROUTES = [
  ['/', '1.0', 'weekly'],
  ['/about', '0.8', 'monthly'],
  ['/programmes', '0.9', 'weekly'],
  ['/coaches', '0.7', 'monthly'],
  ['/teams', '0.7', 'weekly'],
  ['/fixtures', '0.8', 'weekly'],
  ['/news', '0.8', 'weekly'],
  ['/gallery', '0.6', 'weekly'],
  ['/register', '0.9', 'monthly'],
  ['/contact', '0.8', 'monthly'],
  ['/faq', '0.8', 'monthly'],
  ['/privacy', '0.3', 'yearly'],
];

const esc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
const jsonForHtml = (v) => JSON.stringify(v).replace(/</g, '\\u003c');

/** React places <title>, <meta> and <link> first in its output: move them into <head>. */
function splitHead(html) {
  const m = html.match(/^((?:<title>[\s\S]*?<\/title>|<meta\b[^>]*>|<link\b[^>]*>)+)/);
  return m ? { head: m[1], body: html.slice(m[1].length) } : { head: '', body: html };
}

function fileFor(route) {
  if (route === '/') return resolve(dist, 'index.html');
  return resolve(dist, `${route.slice(1)}.html`);
}

if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('[prerender] dist/index.html not found. Run vite build first.');
  process.exit(1);
}

const template = readFileSync(resolve(dist, 'index.html'), 'utf8');
if (!template.includes('<!--seo-start-->') || !template.includes('<div id="root"></div>')) {
  console.error('[prerender] index.html is missing the <!--seo-start--> markers or the empty root element.');
  process.exit(1);
}

// 404.html: the plain app shell, used for /admin and any unknown address.
writeFileSync(
  resolve(dist, '404.html'),
  template.replace(/<!--seo-start-->[\s\S]*?<!--seo-end-->/, '<title data-pr="">Swat Kings Cricket Academy</title>\n    <meta name="robots" content="noindex" />'),
);

const { collect, render } = await import(pathToFileURL(ssrEntry).href);
const site = await collect();
const { settings } = site.meta;

const routes = [
  ...STATIC_ROUTES.map(([path, priority, changefreq]) => ({ path, priority, changefreq })),
  ...site.meta.articles.map((a) => ({ path: `/news/${a.slug}`, priority: '0.6', changefreq: 'monthly', lastmod: a.published_at })),
  ...site.meta.players.map((p) => ({ path: `/players/${p.id}`, priority: '0.5', changefreq: 'monthly' })),
];

let written = 0;
for (const r of routes) {
  const data = { ...site.shared, ...(site.pages[r.path] ?? {}) };
  let html;
  try {
    html = render(r.path, data);
  } catch (err) {
    console.warn(`[prerender] Skipped ${r.path}: ${err instanceof Error ? err.message : String(err)}`);
    continue;
  }
  const split = splitHead(html);
  const body = split.body;
  // Mark pre-rendered head tags so the browser app can replace them with live ones.
  const head = split.head.replace(/<(title|meta|link)\b/g, '<$1 data-pr=""');
  const page = template
    .replace(/<!--seo-start-->[\s\S]*?<!--seo-end-->/, `${head}\n    <meta property="og:site_name" content="${esc(settings.academy_name)}" />`)
    .replace(
      '<div id="root"></div>',
      `<div id="root">${body}</div>\n    <script type="application/json" id="skca-data">${jsonForHtml(data)}</script>`,
    );
  const out = fileFor(r.path);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, page);
  written++;
}
console.log(`[prerender] Wrote ${written} pre-rendered pages.`);

// robots.txt — everyone welcome (search engines and AI assistants), except the admin area.
const robots = ['User-agent: *', 'Allow: /', 'Disallow: /admin', ''];
if (siteUrl) robots.push(`Sitemap: ${siteUrl}/sitemap.xml`, '');
writeFileSync(resolve(dist, 'robots.txt'), robots.join('\n'));

// sitemap.xml
if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...routes.map(
      (u) =>
        `  <url><loc>${esc(siteUrl + u.path)}</loc><lastmod>${(u.lastmod || today).slice(0, 10)}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
    ),
    '</urlset>',
    '',
  ].join('\n');
  writeFileSync(resolve(dist, 'sitemap.xml'), xml);
  console.log(`[prerender] Wrote ${routes.length} URLs to sitemap.xml`);
} else {
  console.warn('[prerender] VITE_SITE_URL is not set: sitemap.xml skipped and links in llms.txt are relative.');
}

// llms.txt — a plain summary for AI assistants (https://llmstxt.org). Facts only from the database.
const link = (p) => (siteUrl ? `${siteUrl}${p}` : p);
const lines = [
  `# ${settings.academy_name}`,
  '',
  '> Cricket academy in Swat, Khyber Pakhtunkhwa, Pakistan, offering coaching for beginners, youth and developing cricketers. Players can register online; approved players get a public profile with consent.',
  '',
];
const contact = [
  settings.address && `- Address: ${settings.address.replace(/\s*\n\s*/g, ', ')}`,
  settings.phone && `- Phone: ${settings.phone}`,
  settings.whatsapp && `- WhatsApp: ${settings.whatsapp}`,
  settings.email && `- Email: ${settings.email}`,
  settings.training_schedule && `- Training times: ${settings.training_schedule.replace(/\s*\n\s*/g, '; ')}`,
].filter(Boolean);
if (contact.length) lines.push('## Contact', '', ...contact, '');
lines.push(
  '## Key pages',
  '',
  `- [Player registration](${link('/register')}): online player registration form with photo and cricket details (parent or guardian consent for under-19s)`,
  `- [Coaching programmes](${link('/programmes')}): programmes, age groups, schedules and availability`,
  `- [Coaches](${link('/coaches')})`,
  `- [Players and teams](${link('/teams')})`,
  `- [Fixtures and results](${link('/fixtures')})`,
  `- [News](${link('/news')})`,
  `- [Frequently asked questions](${link('/faq')})`,
  `- [Contact](${link('/contact')})`,
  '',
);
if (site.meta.programmes.length) {
  lines.push('## Programmes', '');
  for (const p of site.meta.programmes)
    lines.push(`- [${p.name}](${link(`/programmes#${p.slug}`)})${p.age_group ? ` (${p.age_group})` : ''}${p.summary ? `: ${p.summary}` : ''}`);
  lines.push('');
}
if (site.meta.faqs.length) {
  lines.push('## Frequently asked questions', '');
  for (const f of site.meta.faqs) lines.push(`### ${f.question}`, '', f.answer, '');
}
if (site.meta.articles.length) {
  lines.push('## Latest news', '');
  for (const a of site.meta.articles.slice(0, 10)) lines.push(`- [${a.title}](${link(`/news/${a.slug}`)})${a.excerpt ? `: ${a.excerpt}` : ''}`);
  lines.push('');
}
writeFileSync(resolve(dist, 'llms.txt'), lines.join('\n'));
console.log('[prerender] Wrote llms.txt');

// The server bundle is only needed during the build.
rmSync(resolve(root, 'dist-ssr'), { recursive: true, force: true });
process.exit(0);
