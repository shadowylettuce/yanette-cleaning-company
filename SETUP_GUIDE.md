# SETUP GUIDE — Yanette's House Cleaning Company

This guide walks you through everything needed to take the code in this folder from
"files on my computer" to "live website Yanette can use." **You do every step yourself** —
each one explains *what* you're doing and *why*, so next time you can do it without a guide.

Work through the steps in order. Total time: ~30–45 minutes.

---

## Step 1 — Link this folder to your GitHub repo

Git is a tool that tracks every change to your code. GitHub is the website where your
git history is stored online (backup + the place Vercel deploys from).

Open a terminal **in this folder** and run these one at a time:

```bash
git init
```
> Creates a hidden `.git` folder — this folder is now a git repository. Git starts watching for changes.

```bash
git add .
```
> Stages every file ("add these to my next snapshot"). The `.` means "everything here."
> Note: `node_modules` and `.env.local` are automatically skipped because they're listed in `.gitignore` — your secret keys never leave your computer.

```bash
git commit -m "Initial build: full app, schema, and setup guide"
```
> Takes the snapshot. `-m` is the message describing what this snapshot contains.

```bash
git branch -M main
```
> Names your main line of work `main` (the modern standard; GitHub expects it).

```bash
git remote add origin https://github.com/YOUR_USERNAME/house-cleaning-company-template.git
```
> Tells git where the online copy lives. Replace `YOUR_USERNAME` with your GitHub username.
> "origin" is just the conventional nickname for "my GitHub copy."

```bash
git push -u origin main
```
> Uploads your snapshot to GitHub. `-u` remembers the destination so future pushes are just `git push`.

**Verify:** open `github.com/YOUR_USERNAME/house-cleaning-company-template` in a browser.
You should see all the files. Confirm `.env.local` is **NOT** there — that's correct and important.

---

## Step 2 — Create the database tables in Supabase

The file `supabase/schema.sql` contains the instructions that build every table the app uses.

1. Go to [supabase.com](https://supabase.com) → open your `house-cleaning-company-template` project
2. In the left sidebar, click **SQL Editor**
3. Click **New query**
4. Open `supabase/schema.sql` from this folder, copy the **entire file**, paste it in
5. Click **Run** (bottom right)

You should see "Success. No rows returned" — that's normal; creating tables doesn't return rows.

**Verify:** click **Table Editor** in the sidebar. You should see 9 tables:
`businesses`, `users`, `clients`, `appointments`, `workers`, `appointment_workers`,
`timesheets`, `payments`, `reschedule_requests`.

> **Why 9 and not 8?** The CLAUDE.md schema had 8. The app needed one more —
> `appointment_workers` — to record which workers are assigned to which appointment
> (the calendar can't show "assigned workers" without it). Two columns were also added:
> `workers.user_id` and `clients.user_id`, which connect a login account to a worker/client
> so the portals know whose jobs to show.

---

## Step 3 — Connect the app to Supabase (.env.local)

The app needs two values to talk to YOUR Supabase project. They live in `.env.local`,
which stays on your computer only (it's gitignored).

1. In Supabase: **Project Settings** (gear icon) → **API** (or "API Keys" / "Data API")
2. Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`)
3. Copy the **anon / public** key (a long string)
4. Open `.env.local` in this folder and replace the two placeholders:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...your-long-key...
```

> **Why is the anon key safe to put in a website?** Because Row Level Security (the
> policies at the bottom of schema.sql) controls what it can actually do. The anon key
> alone, without a logged-in user, can't read or write anything.
> **Never** copy the `service_role` key into this file — that one bypasses all security.

---

## Step 4 — Create the first users (Yanette + test accounts)

Logging in needs two things per person: an **auth account** (email + password) and a
**row in the `users` table** that says what their role is.

### 4a. Create the auth accounts
1. In Supabase: **Authentication** → **Users** → **Add user** → **Create new user**
2. Create at least these (use real or made-up emails; you set the passwords):
   - `yanette@example.com` — the owner
   - `manager@example.com` — a test manager
   - `cleaner@example.com` — a test cleaner
   - `client@example.com` — a test client
3. Check **Auto Confirm User** if offered (skips email verification for these manual accounts)

### 4b. Create the business + role rows
Go to **SQL Editor**, new query, and run this — but first replace each `PASTE-...-UUID`
with the real ids: in **Authentication → Users**, click a user and copy their **UUID**.

```sql
-- 1. Create the business, owned by Yanette's auth account
insert into businesses (name, owner_id)
values ('Yanette''s House Cleaning Company', 'PASTE-YANETTE-AUTH-UUID');

-- 2. Look up the business id we just created (copy it from the result)
select id from businesses;
```

Now run this, pasting the business id from above plus each person's auth UUID:

```sql
-- 3. Give each auth account a role in the app
insert into users (id, business_id, role) values
  ('PASTE-YANETTE-AUTH-UUID', 'PASTE-BUSINESS-ID', 'owner'),
  ('PASTE-MANAGER-AUTH-UUID', 'PASTE-BUSINESS-ID', 'manager'),
  ('PASTE-CLEANER-AUTH-UUID', 'PASTE-BUSINESS-ID', 'cleaner'),
  ('PASTE-CLIENT-AUTH-UUID',  'PASTE-BUSINESS-ID', 'client');
```

### 4c. Link workers and clients to their logins
Workers and clients also need rows in the `workers` / `clients` tables, with `user_id`
pointing at their login (this is how the portals know whose jobs to show):

```sql
-- the manager and a cleaner as worker rows
insert into workers (business_id, user_id, name, tier, hourly_rate) values
  ('PASTE-BUSINESS-ID', 'PASTE-MANAGER-AUTH-UUID', 'Test Manager', 'manager', 25),
  ('PASTE-BUSINESS-ID', 'PASTE-CLEANER-AUTH-UUID', 'Test Cleaner', 'cleaner', 20);

-- the test client as a client row
insert into clients (business_id, user_id, name, address, city, frequency) values
  ('PASTE-BUSINESS-ID', 'PASTE-CLIENT-AUTH-UUID', 'Test Client', '123 Main St', 'San Jose', 'biweekly');
```

> Day to day, Yanette adds clients/workers from the dashboard. This SQL linking step is
> only needed when someone gets a **login**. (A future improvement: an invite flow in the app.)

---

## Step 5 — Run the app on your computer

```bash
npm install
```
> Downloads every package the app depends on into `node_modules`. Only needed once
> (or after pulling code that changed `package.json`). It may already be done.

```bash
npm run dev
```
> Starts the development server. Leave this terminal running.

Open **http://localhost:3000** and check:
- The landing page loads, EN/ES toggle works
- **Log In** → sign in as Yanette → you land on `/dashboard` (the calendar)
- Add a client, create an appointment for them, assign the cleaner — it appears on the calendar **in yellow** (fewer than 4 completed cleanings = new client)
- Log out, sign in as the cleaner → you see that job in the cleaner portal, clock in/out works
- Sign in as the client → you see the appointment and can request a reschedule
- Back as Yanette → **Reminders** shows the request; approve it and the calendar updates

To stop the server: `Ctrl + C` in the terminal.

---

## Step 6 — Deploy to Vercel (put it on the internet)

1. Go to [vercel.com](https://vercel.com) and sign in **with GitHub**
2. **Add New → Project** → import `house-cleaning-company-template`
3. Before clicking Deploy, open **Environment Variables** and add both values from `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   > Vercel never sees your `.env.local` file (it's not on GitHub), so you provide the values here.
4. Click **Deploy**. ~1 minute later you get a live `*.vercel.app` URL.

**Custom domain:** Project → **Settings → Domains** → add your `.com` → follow the DNS
instructions Vercel shows (you change two records at your domain registrar). It can take
a few minutes to a few hours to go live.

---

## Step 7 — Your day-to-day workflow from now on

Every change follows the same loop:

```bash
# 1. edit code, check it at localhost:3000 (npm run dev)
# 2. then snapshot and upload:
git add .
git commit -m "Describe what you changed"
git push
```

> Pushing to GitHub automatically triggers Vercel to rebuild and redeploy the live site.
> That's the whole pipeline: **edit → test locally → push → live**.

**When something breaks:**
- Page is blank / behaves wrong → press **F12** in the browser → **Console** tab. Our code logs every failure with `console.error`, so the message tells you which fetch failed.
- `npm run dev` won't start → read the terminal error; it names the file and line.
- Works locally but not on Vercel → check the env vars in Step 6.3, then the deploy logs on the Vercel dashboard.

---

## Still open — confirm with Yanette

- [ ] Exact reschedule flat fee (currently **$25** — change `RESCHEDULE_FEE` at the top of `src/app/portal/client/page.js`)
- [ ] Real phone, email, and tagline for the landing page (`src/app/page.js` + `src/lib/translations.js`)
- [ ] Logo file (replace the text logo in the nav)
- [ ] Service area cities to list
- [ ] Payment method display order (currently Cash / Zelle / Venmo)
- [ ] Does the manager assign workers, or only Yanette? (currently only Yanette can)
- [ ] How far in advance can clients reschedule? (currently any future date)
- [ ] Public "Book a Cleaning" form vs phone/email CTA (currently phone/email)

**Not built yet (future versions):** email/SMS sending (preferences are stored and ready),
Stripe/card payments, per-role database security policies, an invite flow for new logins.
