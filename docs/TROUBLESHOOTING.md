# Troubleshooting

## Installing and running

**`npm` is not recognised**
Node.js is not installed or PowerShell was opened before installing it. Install Node.js 22 LTS from <https://nodejs.org>, then close and reopen PowerShell.

**"running scripts is disabled on this system"**
Run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, then try again.

**`npm install` shows warnings**
Warnings ("deprecated", "funding") are normal. Only lines starting with `ERR!` are errors. Delete the `node_modules` folder and run `npm install` again.

**Port 5173 is already in use**
Another dev server is running. Close the other PowerShell window or run `npm run dev -- --port 5174`.

## The website shows "Content coming soon" everywhere

- `.env.local` is missing, has a typo, or still contains the placeholder values. It must be in the project's main folder (next to `package.json`).
- You changed `.env.local` while the server was running — stop it with `Ctrl + C` and run `npm run dev` again.
- On Cloudflare: the environment variables are missing or were added after the last deployment. Add them, then **Retry deployment**.
- Your Supabase project is **paused** (free projects pause after 1 week of inactivity). Open the Supabase dashboard and click **Restore project**.
- Migrations were not run, or were run out of order. Run all four files in `supabase/migrations/` in order.

## Programmes or other content don't appear

Content is shown only when **Show on website** is ticked. Announcements must be **Published** with a publish date in the past. Results need both the result and its fixture published. Player profiles need **Consent confirmed** and **Show on website**, and their team must be published.

## Registration form says "Something went wrong"

- Open the browser console (F12 → Console) for details.
- Check migration `20261025000003_public_submission_functions.sql` was run.
- "Too many submissions": the rate limit (3 per hour from one connection) was reached. Wait an hour; this is working as intended.
- "Registrations are currently closed": turn on **Accept new registrations** in **Admin → Website settings**.

## Admin login problems

**"Email or password is incorrect"** — check the user exists under **Authentication → Users** and is confirmed. Reset the password there if needed.

**"No admin access" after signing in** — the account doesn't have the admin role. Run in the SQL editor:

```sql
select u.email, p.role from auth.users u left join public.profiles p on p.id = u.id;
```

If the role is `user`, run the `update public.profiles set role = 'admin' …` command from the setup guide. If the profile row is missing (user created before the migrations), run:

```sql
insert into public.profiles (id, role)
select id, 'admin' from auth.users where email = 'admin@example.com'
on conflict (id) do update set role = 'admin';
```

**Saving in the admin shows "You do not have permission"** — same cause as above.

## Gallery uploads fail

- Photos must be JPG, PNG, WebP or AVIF and 5 MB or smaller. iPhone HEIC photos are not supported — export them as JPG first.
- Videos must be MP4 or WebM, 25 MB or smaller. Use a YouTube link for longer videos.
- Check migration `20261025000004_storage.sql` ran and the `public-media` bucket exists under **Storage**.
- You may have reached the free plan's 1 GB storage limit. Delete unused files.

## Security self-test fails

- `FAIL: anon can read registrations` or similar: a policy was changed or a migration was skipped. Re-run the migrations in order on a fresh project, or compare your policies (Authentication → Policies) with `20261025000002_auth_and_rls.sql`.
- `permission denied to set role "anon"`: run the script in the Supabase **SQL Editor** (it runs as the `postgres` role), not from another tool.
- Do not go live until the script prints **ALL SECURITY CHECKS PASSED**.

## Cloudflare Pages

**Build fails with a Node version error** — add environment variable `NODE_VERSION` = `22` and retry.

**Build fails at `tsc`** — run `npm run check` on your PC; fix what it reports, commit and push.

**Refreshing a page like `/programmes` shows a Cloudflare 404** — make sure the build output directory is `dist` and that you did not add a `404.html` file. Cloudflare Pages serves `index.html` for unknown paths when no `404.html` exists, which the app needs.

**Images from Supabase don't show on the live site** — `public/_headers` allows `https://*.supabase.co`. If you use a custom Supabase domain, add it to the `img-src`, `media-src` and `connect-src` parts of the Content-Security-Policy.

**Fonts look different** — the site loads Google Fonts; if they are blocked on a network, the browser uses a similar fallback font. Nothing is broken.

## Tests

Run `npm test`. All tests run without Supabase credentials. Tests that need a real database (the SQL security checks) are in `supabase/tests/security_checks.sql` and must be run in the Supabase SQL editor.
