# Setup guide — from your PC to a live website

Follow the parts in order. Each step says exactly where to click. Supabase and Cloudflare sometimes move buttons around; if a name is slightly different, look for the closest match.

**Time needed:** about 60–90 minutes the first time. **Cost:** $0.

**What you need:** a Windows PC, an email address, and free accounts on [GitHub](https://github.com/signup), [Supabase](https://supabase.com/dashboard/sign-up) and [Cloudflare](https://dash.cloudflare.com/sign-up).

---

## Part 1 — Run the website on your PC

1. Install **Node.js 22 LTS** from <https://nodejs.org> (accept the defaults).
2. Install **Git** from <https://git-scm.com/download/win> (accept the defaults).
3. Unzip the project, for example to `C:\Projects\swat-kings-cricket-academy`.
4. Open the folder in File Explorer, click the address bar, type `powershell` and press Enter.
5. Run:

   ```powershell
   node -v          # should show v20.19 or newer
   npm install
   npm run dev
   ```

6. Open <http://localhost:5173>. You should see the home page. Sections show "Content coming soon" because the database is not connected yet — that is expected.
7. Press `Ctrl + C` in PowerShell to stop the server when you're done.

> If PowerShell says "running scripts is disabled", run this once and try again:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

---

## Part 2 — Create the Supabase database

### 2.1 Create the project

1. Go to <https://supabase.com/dashboard> and sign in.
2. Click **New project**.
3. Name: `swat-kings-cricket-academy`. Create a **strong database password** and save it in a password manager.
4. Region: pick one close to your visitors (for Pakistan, a Mumbai/South Asia or Singapore region is usually closest).
5. Plan: **Free**. Click **Create new project** and wait 1–2 minutes.

### 2.2 Run the database migrations

The migrations create every table, the security rules, the registration functions and the file storage bucket.

1. In your project, open **SQL Editor** (left menu) → **New query**.
2. Open `supabase/migrations/20261025000001_schema.sql` from the project in Notepad, copy **everything**, paste it into the SQL editor and click **Run**. You should see "Success. No rows returned".
3. Repeat, **in this order**, for:
   - `20261025000002_auth_and_rls.sql`
   - `20261025000003_public_submission_functions.sql`
   - `20261025000004_storage.sql`
4. **Optional:** run `supabase/seed.sql` to add 8 example programmes and one example announcement. They are clearly marked **DEMO** — edit or delete them before launch.

> Advanced alternative: if you install the [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started), `npx supabase link` then `npx supabase db push` applies the same migrations.

### 2.3 Check the security rules work

1. SQL Editor → **New query**.
2. Paste the whole of `supabase/tests/security_checks.sql` and click **Run**.
3. The result must say **ALL SECURITY CHECKS PASSED**. In the **Messages/Notices** area you will see each `PASS:` line. Everything this test creates is rolled back automatically.

If it stops with `FAIL: ...`, do not go live — see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

### 2.4 Turn off public sign-ups

The website has no sign-up page, but Supabase allows sign-ups through its API by default. Turn this off:

1. **Authentication** → **Sign In / Providers** (on some versions: **Authentication → Settings**).
2. Turn **off** "Allow new users to sign up". Save.

(Even if someone did sign up, they would not be an admin and could not see private data — this is just an extra lock.)

### 2.5 Copy your project URL and public key

1. Click **Connect** at the top of the project page, or go to **Project Settings → API Keys**.
2. Copy the **Project URL** (looks like `https://abcdxyz.supabase.co`).
3. Copy the **Publishable key** (starts with `sb_publishable_`). On older projects, use the **anon public** key under "Legacy API keys".
4. **Never** copy the **secret** key or **service_role** key into this project. The website does not need it.

### 2.6 Connect your PC to Supabase

In PowerShell, in the project folder:

```powershell
copy .env.example .env.local
notepad .env.local
```

Fill in:

```
VITE_SUPABASE_URL=https://abcdxyz.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
VITE_SITE_URL=
```

Save, then run `npm run dev` again. If you ran the seed, the demo programmes now appear on the home page.

**Test it:** go to **Register for Trials**, submit a test registration, and note the reference number. You'll see it in the admin dashboard after Part 3.

---

## Part 3 — Create your first admin

There is deliberately no public admin sign-up. You create the admin in Supabase:

1. **Authentication → Users → Add user → Create new user**.
2. Enter the admin's email and a **strong password** (12+ characters). Tick **Auto Confirm User**. Click **Create user**.
3. **SQL Editor → New query**, paste this (replace the email), and **Run**:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'admin@example.com');
   ```

   It should say "1 row affected". If it says 0, check the email spelling.

4. On the website, go to `/admin` (or click **Staff login** in the footer) and sign in.

**Adding more admins:** repeat steps 1–3 for each person. **Removing an admin:** run the same SQL with `set role = 'user'`, or delete the user under Authentication → Users.

**Security tips:** use a unique password, share admin access only with trusted staff, and remove people who leave.

---

## Part 4 — Put the code on GitHub

1. Create a free account at <https://github.com>.
2. Click **+ → New repository**. Name: `swat-kings-cricket-academy`. Choose **Private** (recommended). Do **not** add a README. Click **Create repository**.
3. In PowerShell, in the project folder (replace `YOUR-USERNAME`):

   ```powershell
   git init
   git add .
   git commit -m "Initial website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/swat-kings-cricket-academy.git
   git push -u origin main
   ```

   A browser window may open to sign in to GitHub — approve it.

4. **Check:** on GitHub, make sure there is **no** `.env.local` file in the repository. (The `.gitignore` file prevents it, but always double-check.)

---

## Part 5 — Deploy on Cloudflare Pages (free)

1. Sign in at <https://dash.cloudflare.com>.
2. Go to **Workers & Pages** → **Create** → choose the **Pages** tab → **Connect to Git** (also called "Import an existing Git repository").
3. Connect your GitHub account and select the `swat-kings-cricket-academy` repository.
4. Build settings:

   | Setting | Value |
   | --- | --- |
   | Framework preset | `React (Vite)` (or `None`) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | *(leave empty)* |

5. Open **Environment variables** and add:

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | your Project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | your publishable (or anon) key |
   | `NODE_VERSION` | `22` |

6. Click **Save and Deploy**. After 1–3 minutes you get an address like `https://swat-kings-cricket-academy.pages.dev`.

### 5.1 Finish the SEO setup

1. In Cloudflare: your Pages project → **Settings → Variables and Secrets** (or **Environment variables**) → add `VITE_SITE_URL` = your `https://….pages.dev` address (no trailing slash).
2. **Deployments** → **Retry deployment** (or push any change to GitHub). This turns on canonical URLs and generates `sitemap.xml`.
3. Optional: add the site to [Google Search Console](https://search.google.com/search-console) and submit `https://YOUR-SITE.pages.dev/sitemap.xml`.

### 5.2 Allow your live site in Supabase Auth

**Authentication → URL Configuration** → set **Site URL** to your `https://….pages.dev` address. Save.

### 5.3 Test the live site

- [ ] Home page loads and looks right on your phone.
- [ ] All menu links work; a made-up address like `/abc` shows the "Clean bowled" 404 page.
- [ ] Submit a test registration → you get a reference number.
- [ ] Sign in at `/admin` → the test registration is listed → change its status to **Contacted**.
- [ ] Send a test contact message → it appears in **Admin → Messages**.
- [ ] Upload a test photo in **Admin → Gallery** → it appears on the Gallery page → delete it.
- [ ] Sign out → visiting `/admin/registrations` sends you to the login page.

From now on, every `git push` to the `main` branch redeploys the site automatically.

---

## Part 6 — Before you announce the website

1. **Admin → Website settings:** enter the real address, phone, WhatsApp, email, training times, social links, About text. Leave anything unconfirmed empty — it stays hidden.
2. Delete or edit the **DEMO** programmes and announcement.
3. Add programmes, coaches (tick "Qualifications verified" only after checking), teams and fixtures.
4. Read the **Privacy Policy** page and adjust it to your academy (it is a plain-language template).
5. Only publish photos and player profiles with consent from players and, for under-19s, their parents or guardians.

---

## Keeping the site running on the free plan

- **Supabase pauses free projects after 1 week of inactivity.** Signing in to the admin dashboard or receiving registrations counts as activity. If it pauses, open the Supabase dashboard and click **Restore project**. While paused, the website still loads but shows "coming soon" in data sections and forms cannot be sent.
- Free limits (checked October 2026, subject to change): Supabase 500 MB database and 1 GB file storage; Cloudflare Pages 500 builds per month. Keep photos under 5 MB (resize phone photos first) and put long videos on YouTube.
- **Backups:** the free Supabase plan does not include downloadable backups. Regularly use **Admin → Registrations → Export to Excel (CSV)** to keep your own copy.
- **Email notifications** are not set up — check **Admin → Messages** and **Registrations** regularly. If you want emails later, a free option is a Supabase Database Webhook to a service like Resend or Brevo (free tiers); this needs extra setup and is not included.

---

## Updating the website later

```powershell
npm run dev            # make and preview changes
npm run check          # lint + types + tests + build
git add .
git commit -m "Describe your change"
git push               # Cloudflare redeploys automatically
```

Database changes: add a **new** file in `supabase/migrations/` (never edit old ones once applied) and run it in the SQL editor.
