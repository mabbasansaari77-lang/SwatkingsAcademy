# Swat Kings Cricket Academy — Website

A professional, mobile-friendly website for **Swat Kings Cricket Academy** with a real database, online trial registration, a contact inbox and a secure admin dashboard.

Built to run for **$0 a month** on free tiers: **Cloudflare Pages** (hosting) + **Supabase** (database, login, file storage).

> New to this? Follow **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** step by step. It assumes no prior experience.

**Live site:** <https://swatkingsacademy.swatkings.workers.dev> (set as `VITE_SITE_URL` in Cloudflare → Settings → Build → Variables and secrets).

---

## What's included

**Public website (14 pages)**
Home · About · Coaching Programmes · Coaches · Players & Teams · Fixtures & Results · News (list + article pages) · Gallery · Registration · Reviews · FAQ · Contact · Privacy Policy · custom 404 page

**Trial registration**
Validated form (age group instead of date of birth, guardian consent for under-19s, privacy acknowledgement), unique reference like `SK-2610-A1B2C3`, status starts as **Pending**, spam protection (honeypot + server-side validation + rate limiting).

**Admin dashboard (`/admin`)**
Secure login · overview with real counts · registrations (search, filter by programme/date/status, change status, private notes, **export to Excel/CSV**) · contact messages inbox · manage programmes, coaches, teams, player profiles, fixtures, results, announcements, gallery (photo/video upload or YouTube link) and website settings (contact details, social links, About text, registration on/off).

**Security**
Row Level Security on every table, admin role checked on the server, no public sign-up, no secret keys in the code, private data never shown publicly. An included SQL self-test checks all of this in one click.

**SEO and quality**
Per-page titles and descriptions, Open Graph image, canonical URLs, sitemap and robots.txt, semantic HTML, keyboard navigation, reduced-motion support, lazy-loaded images, security headers.

## Technology

| Part | Tool |
| --- | --- |
| Frontend | React 19, Vite 7, TypeScript |
| Styling | Tailwind CSS 4, Lucide icons |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage) |
| Hosting | Cloudflare Pages |
| Tests | Vitest + React Testing Library |

## Quick start (Windows)

You need **Node.js 20.19 or newer** (22 LTS recommended) from <https://nodejs.org>.

Open **PowerShell** in the project folder and run:

```powershell
npm install
copy .env.example .env.local
notepad .env.local      # paste your Supabase URL and publishable key, then save
npm run dev
```

Open <http://localhost:5173>. The site works without Supabase too — sections simply show "coming soon" until the database is connected.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the site locally with live reload |
| `npm run build` | Type-check and build the production site into `dist/` (also writes sitemap.xml and robots.txt) |
| `npm run preview` | Serve the built site locally to test it |
| `npm run lint` | Check code quality |
| `npm run typecheck` | Check TypeScript types |
| `npm test` | Run the automated tests |
| `npm run check` | Run lint, types, tests and build together |

## Project structure

```
├─ public/                  Static files: favicon, share image, robots.txt, Cloudflare _headers
├─ scripts/
│  └─ generate-sitemap.mjs  Builds sitemap.xml + robots.txt after each build
├─ src/
│  ├─ admin/                Admin dashboard (login, guard, registrations, inbox, editors)
│  ├─ components/
│  │  ├─ cards/             Programme, coach, fixture/result, news and gallery components
│  │  ├─ graphics/          Original SVG logo and hero illustration
│  │  ├─ layout/            Header, footer, page layout
│  │  └─ ui/                Buttons, sections, form fields, loading/empty/error states, SEO
│  ├─ lib/                  Supabase client, data queries, validation, types, auth, settings
│  ├─ pages/                One file per public page
│  └─ test/                 Automated tests
├─ supabase/
│  ├─ migrations/           Database schema, security policies, functions, storage (run in order)
│  ├─ seed.sql              Optional, clearly labelled DEMO programmes and one DEMO announcement
│  └─ tests/security_checks.sql   One-click security self-test for the SQL editor
├─ docs/                    Setup, security and troubleshooting guides
├─ .env.example             Template for your environment variables (placeholders only)
└─ index.html, vite.config.ts, tsconfig*.json, eslint.config.js, package.json
```

## Content rules built into the site

- No invented achievements, trophies, statistics, testimonials, addresses or phone numbers. Contact details stay hidden until you enter them in **Admin → Website settings**.
- Home page numbers appear only when real published records exist.
- Training fees are optional; if empty, the site shows **"Contact us for details"**.
- Coach qualifications can only be saved after an admin ticks **Qualifications verified** (enforced by the database).
- Player profiles are optional, need recorded consent before they can be public, and have no fields for date of birth, address or contact details.
- Results are entered manually. The site never claims live scores.

## Documentation

- **[docs/SETUP_GUIDE.md](docs/SETUP_GUIDE.md)** — Supabase, first admin, GitHub, Cloudflare Pages, going live
- **[docs/SECURITY.md](docs/SECURITY.md)** — how the data is protected and the trade-offs
- **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** — common problems and fixes

## Free-tier notes

Limits below were checked in October 2026 and **can change** — always confirm on the providers' pricing pages.

- **Supabase Free** ([pricing](https://supabase.com/pricing)): up to 2 active projects, 500 MB database, 1 GB file storage, 5 GB egress. **Free projects are paused after 1 week of inactivity**; you restore them from the Supabase dashboard (the website shows "coming soon" states while paused).
- **Cloudflare Pages Free** ([limits](https://developers.cloudflare.com/pages/platform/limits/)): 500 builds per month, 20,000 files per site, 25 MiB per file. You get a free `*.pages.dev` address; a custom domain is optional.

## License

Code written for Swat Kings Cricket Academy. Fonts (Big Shoulders Display, Source Sans 3) are open-source from Google Fonts. All graphics are original SVGs.
