# Security overview

This website handles information about young players, so privacy and security were designed in from the start. This page explains how it works and what the trade-offs are.

## The key idea

The website runs entirely in the visitor's browser and talks directly to Supabase using a **public** key. That key is visible to anyone, which is normal and safe **only because every table has Row Level Security (RLS)**. The database itself decides what each request may read or change — not the website code.

## Who can do what

| | Visitor (not signed in) | Signed-in user without admin role | Admin |
| --- | --- | --- | --- |
| Read published programmes, coaches, teams, fixtures, results, news, gallery | Yes | Yes | Yes (also unpublished) |
| Read consented, public player profiles | Yes | Yes | Yes (all) |
| Submit a registration or contact message | Yes, via a checked function | Yes | Yes |
| Read registrations or messages | **No** | **No** | Yes |
| Create, edit or delete content | **No** | **No** | Yes |
| Upload or delete files | **No** | **No** | Yes |
| Make someone an admin | **No** | **No** | Only via the Supabase SQL editor |

## How admin access is protected

- Admin status is stored in `public.profiles.role` and checked on the server by `public.is_admin()`. The browser never decides who is an admin.
- There is no API policy that lets anyone insert or update a profile, so nobody can promote themselves. Roles are changed only in the Supabase SQL editor by the project owner.
- New Auth users automatically get the `user` role.
- The admin pages in the website check the role too, but that is only for a friendly experience. Even if someone bypassed the admin screens, the database would refuse their requests.
- There is no public sign-up page, and the setup guide tells you to switch off sign-ups in Supabase.

## Registrations and contact messages

- Visitors cannot insert rows directly. They call two database functions, `submit_registration` and `submit_contact_message`, which:
  - re-validate every field (lengths, formats, allowed values, guardian consent for under-19s, privacy acknowledgement, programme must be published and not closed, registrations switched on);
  - silently discard submissions that fill the hidden **honeypot** field (a common bot trap);
  - **rate-limit** each visitor (3 registrations / 5 messages per hour) and overall (120 / 200 per hour). Visitors are identified by a SHA-256 hash of their IP address; the raw IP is never stored, and the log is deleted after 2 days;
  - save the record with status `pending` and return only the reference number.
- No date of birth, ID documents, passwords or payment details are collected.

**Why database functions instead of an Edge Function?** They need no extra service, secrets or deployment, so they work on the free plan with nothing to configure. The trade-off: rate limiting relies on the IP headers Supabase's gateway provides, so an attacker using many IP addresses could still send some spam (the overall hourly cap limits the damage). If spam ever becomes a problem, add a free CAPTCHA such as Cloudflare Turnstile, verified in an Edge Function.

## Children's data

- `player_profiles` has no columns for date of birth, address, phone, email or a link to registrations — that information cannot be published by mistake.
- A profile can be public only when `consent_confirmed` is true (enforced by a database constraint) **and** its team is published.
- Coach qualifications can only be saved once an admin marks them verified (database constraint).

## File storage

- Bucket `public-media` holds only media approved for the public website.
- Only admins can upload, replace or delete files. Allowed types: JPEG, PNG, WebP, AVIF, MP4, WebM; maximum 25 MB (the admin screen limits photos to 5 MB). Uploads must go into the `gallery`, `coaches`, `news` or `players` folders.
- Files get random names and visitors cannot list the bucket.
- **Trade-off:** the bucket is public so images load fast without signed links. Anyone who has a file's exact address can open it, even if the gallery item is hidden. Delete files you do not want public (deleting a gallery item deletes its file).

## Secrets

- The frontend uses only the Supabase URL and the publishable/anon key.
- The **secret / service_role key is never used** anywhere in this project. Never add it to `.env.local`, Cloudflare or the code.
- `.env` files are ignored by Git; `.env.example` contains placeholders only. An automated test fails if a secret or service-role key appears in the project or the built site.

## Browser security headers

`public/_headers` makes Cloudflare send a strict Content Security Policy, `X-Frame-Options: DENY`, `nosniff`, HSTS and a restrictive Permissions-Policy. Admin pages are marked `noindex` and are not cached.

## How this was tested

- `supabase/tests/security_checks.sql` runs 22 checks as a visitor, a normal signed-in user and an admin, then rolls everything back. Run it after any database change.
- During development these migrations and checks were run against PostgreSQL 16 with Supabase-style roles; rate limiting, the honeypot and storage upload rules were also tested. Run the script once on your real Supabase project to confirm.

## Your responsibilities

- Use strong, unique admin passwords and remove admins who leave.
- Only publish photos and player profiles with consent.
- Export registrations regularly (free plan has no downloadable backups) and delete old records you no longer need.
- Keep dependencies updated (`npm outdated`, then update and run `npm run check`).
