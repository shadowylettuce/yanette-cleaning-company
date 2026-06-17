# CLAUDE.md — Yanette's House Cleaning Company

> This file is the single source of truth for Claude Code.
> Read it fully before touching any file. Every decision here is deliberate.

---

## What This Is

This is a fully custom website and business management app built for **Yanette's House Cleaning Company**, a house cleaning business based in the Bay Area.

This project serves two purposes:
1. **A real working product** for Yanette — she uses it to run her business day to day
2. **A portfolio and sales demo** — the developer (Carlos) uses this as a live example when pitching similar builds to other cleaning companies

The code is private. It is not a template to be distributed or cloned.
Each future client gets their own custom build, sold as a service.

**First customer:** Yanette's House Cleaning Company — Bay Area, ~50 recurring clients, ~5 workers.

---

## Stack

- **Framework:** Next.js App Router — JavaScript only, no TypeScript
- **Auth + Database:** Supabase
- **Styles:** Tailwind CSS
- **Deployment:** Vercel (custom .com domain)
- **Local path:** `C:\Users\cgran\Dev\yanettes-cleaning`
- **GitHub:** private repo
- **Supabase client:** `src/lib/supabase.js`

```js
// Import the Supabase client anywhere you need to talk to the database
import { supabase } from "@/lib/supabase"
```

---

## THE MOST IMPORTANT RULE — Inline Comments on Every Line

**Every non-trivial line of code must have an inline comment explaining what it does in plain English.**

The goal: the developer (Carlos) is actively learning to code. Every file should be
readable top to bottom like a book — no line should be a mystery.

**This is what it should look like:**

```js
const [appointments, setAppointments] = useState([]) // appointments holds the list of bookings; starts as an empty array

useEffect(() => {                          // useEffect runs this block of code after the page first loads
  fetchAppointments()                      // call our function that goes and gets appointments from the database
}, [])                                     // the empty array means: only run this once, when the component first mounts

const { data, error } = await supabase     // send a request to Supabase; it gives back { data, error }
  .from('appointments')                    // look inside the appointments table
  .select('*, clients(name, address)')     // get all columns, and also pull name + address from the related clients table
  .eq('business_id', businessId)           // filter: only return rows where business_id matches our business
  .order('date', { ascending: true })      // sort the results by date, oldest first

if (error) {                               // if Supabase returned an error instead of data
  console.error('Failed to load appointments:', error) // print the error to the browser console so we can debug it
  return                                   // exit early — do not try to use the broken data below
}
```

**This rule applies to:**
- Every `useState` declaration
- Every `useEffect`
- Every Supabase query line
- Every `if` statement, ternary, or `&&` conditional
- Every function definition
- Any Tailwind className with more than 3 classes (add a comment on the line above describing what this element is)

Do not comment completely obvious things like a lone `return` at the end of a component.
Use judgment — but when in doubt, write the comment.

---

## Code Style — Enforce on Every File

**First line of every component file:**
```js
'use client' // tells Next.js this component runs in the browser, not on the server
```

**Section dividers inside every component (always in this order):**
```js
// ─── STATE ───        (useState declarations live here)
// ─── EFFECTS ───      (useEffect hooks live here)
// ─── FETCH ───        (async functions that talk to Supabase live here)
// ─── HANDLERS ───     (functions triggered by user actions like clicks live here)
// ─── RENDER ───       (the return statement and JSX live here)
```

**JSX section markers:**
```jsx
{/* ── SECTION NAME ── */}
  ... jsx goes here ...
{/* ── END SECTION NAME ── */}
```

**Component pattern — always in this order:**
```
useState declarations → useEffect hooks → async fetch functions → handler functions → return (JSX)
```

---

## Design System

**Vibe:** Fresh, clean, warm, small-business human.
Someone opens this site and immediately feels *trust*. Like walking into a spotless, well-run home.
Light mode only. Never dark. Never corporate. Never cold.

**Colors:**
```
Background:   #FFFFFF  — white base, main page background
Card surface: #F8FAFB  — slightly off-white, used for cards and panels
Primary:      #4CAF82  — soft green, main buttons and accents
Accent:       #5BAFD6  — light blue, highlights and links
Text:         #1A1A2E  — near-black, main readable text
Muted text:   #6B7280  — gray, secondary labels and timestamps
Border:       #E5E7EB  — light gray, card outlines and dividers
Warning/New:  #FCD34D  — yellow, used to highlight new clients on the calendar
```

**Typography:** Modern, readable, warm. Not sterile.
Use Plus Jakarta Sans via Google Fonts. Fall back to `font-sans`.

**Responsive priority:**
- Owner dashboard → desktop first, then adapt down to mobile
- Worker and client portals → mobile first, then adapt up to desktop

**Brand Assets:**
Before designing any page, check the `public/brand_assets/` folder.
If logos, color guides, or photos exist there, use them — do not use placeholders where real assets are available.

---

## Designing from Reference

If Carlos pastes a screenshot or URL of a site he likes, treat it as a reference:
- Match the layout, spacing, typography, and color **exactly**
- Swap in Yanette's real content (name, colors, copy) — do not keep the reference's brand
- Do not "improve" or add to the design — match it first, then Carlos will direct changes
- After building, take a screenshot, compare visually against the reference, fix every visible mismatch, screenshot again
- Do at least **2 comparison rounds** — stop only when no visible differences remain or Carlos says to stop
- When comparing, be specific: *"heading is 32px but reference shows ~24px"*, *"card gap is 16px but should be 24px"*
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

---

## Screenshot Workflow

Use this workflow any time you need to visually verify a page looks correct.

**Start the dev server first:**
```bash
npm run dev   # starts at http://localhost:3000
```
If the server is already running, do not start a second instance.

**Take a screenshot:**
```bash
node screenshot.mjs http://localhost:3000
# optional label: node screenshot.mjs http://localhost:3000 hero-section
```
Screenshots save automatically to `./temporary-screenshots/screenshot-N.png` (auto-incremented, never overwritten).

**Read the screenshot:**
After saving, use the Read tool on the PNG file — Claude can see and analyze images directly.
Compare against the reference or design intent, list specific differences, fix them, screenshot again.

---

## Design Quality Rules — Anti-Generic Guardrails

These rules prevent lazy defaults. Apply them to every page, every component.

- **Colors:** Never use default Tailwind palette (no `indigo-500`, `blue-600`, etc.). Always use the project's defined hex values from the Design System above.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity (e.g. `shadow-[0_4px_24px_rgba(76,175,130,0.10)]`).
- **Typography:** Never use the same font for headings and body. Plus Jakarta Sans is the body font — pair it with a display weight or a complementary heading treatment.
- **Gradients:** Where backgrounds need depth, layer multiple radial gradients rather than a flat color.
- **Animations:** Only animate `transform` and `opacity`. **Never use `transition-all`** — it causes jank. Use spring-style easing (`cubic-bezier(0.34, 1.56, 0.64, 1)`).
- **Interactive states:** Every clickable element (button, link, card) must have `hover:`, `focus-visible:`, and `active:` states. No exceptions.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps. Establish a rhythm and stick to it.
- **Depth:** Surfaces should have a layering system (base → elevated → floating) — they should not all sit at the same visual z-plane.

---

## Getting business_id — Do It This Way Every Time

```js
// Query the businesses table to find the business owned by the currently logged-in user
const { data: bizData } = await supabase
  .from('businesses')              // look in the businesses table
  .select('id')                    // we only need the id column, nothing else
  .eq('owner_id', user.id)         // filter: only rows where owner_id matches the logged-in user's id

const businessId = bizData?.[0]?.id  // safely grab the first result's id; returns undefined if nothing was found
```

**Never use `.single()`** — it throws a hard crash if the query returns 0 rows or more than 1 row.
`?.[0]?.id` is safe in all situations.

---

## Known Bug Patterns — Never Repeat These

| Bug | What Goes Wrong | The Fix |
|-----|----------------|---------|
| `.single()` on any Supabase query | Crashes if 0 or 2+ rows returned | Always use `?.[0]?.id` array access |
| `fetchData(user)` wrapper that ignores `user` param | Silently fetches the wrong user's data | Pass `user` directly into every fetch function |
| State declared as `[Workers, setWorkers]` but used as `workers` | React can't find the variable, silent failure | Casing must match exactly — pick one and never deviate |
| `apt.clients.name` on joined Supabase data | Crashes if the join returns null | Always write `apt.clients?.name` with optional chaining |

---

## Role System

Single login page (`/login`). After sign-in, look up the user's `role` in the `users` table and redirect:

| Role | Redirect | What They Can Do |
|------|----------|-----------------|
| `owner` | `/dashboard` | Everything — full control of the entire app |
| `manager` | `/portal/manager` | View today's route, clock in/out |
| `cleaner` | `/portal/cleaner` | View today's jobs, clock in/out, see weekly hours |
| `client` | `/portal/client` | View appointments, payment status, request reschedule |

---

## Portal Specs

### Owner (Yanette)
- Full access to everything in the app
- Only role that can create or edit appointments
- Approves or denies client reschedule requests
- Manages clients, workers, payments, and private notes
- Receives a daily schedule summary notification
- Revenue dashboard with earnings overview
- Private owner-only notes per client

### Manager (Driver)
- Sees their assigned driving route for the day
- Sees which cleaners are going to each house
- Clocks in once at the start of the day
- Clocks out once at the end of the day
- Clock in/out tracks the whole day — not per individual house

### Cleaner
- Sees their list of assigned jobs for the day
- Clocks in at the first house, clocks out after the last
- Can view their total hours worked for the current week

### Client
- Sees their upcoming appointment date, time, and details
- Sees their current payment status
- Can request a reschedule (flat fee charged, Yanette must approve)
- Can request a new one-off cleaning (flat fee charged, Yanette must approve)

---

## The Calendar — Core of the App

The calendar is the heartbeat of this product. Everything else supports it.

**Owner desktop view:**
- Monthly grid by default
- Each day cell shows: client names, addresses, assigned workers
- Click any day → expanded side panel appears with full details per house:
  - Client name, address, scheduled time, assigned workers, notes

**All users on mobile:**
- Defaults to today's single-day view
- Clean, scannable, no clutter

**New client highlight rule (hard requirement — do not skip):**
- Any client with fewer than 4 completed cleanings gets a **yellow** (#FCD34D) background on their calendar entry
- This helps Yanette immediately spot clients who are new and may need extra care

**Scheduling rules:**
- Only the owner (Yanette) can create or edit appointments
- Clients submit reschedule requests → Yanette gets notified → she approves or denies → client is notified
- Recurring frequency options per client: `weekly` | `biweekly` | `monthly` | `on-call`

---

## Notifications

Each user has a `notification_preference` stored in the database: `app` | `email` | `sms` | `all`

**When notifications fire:**
- Day before a scheduled appointment → reminder sent to the client
- Day of a scheduled appointment → reminder sent to the client
- Client submits a reschedule request → Yanette notified immediately
- Yanette approves or denies a reschedule → client notified immediately

---

## Language Support

Full Spanish / English toggle throughout the entire app.
Each user's preference is stored in `language_preference`: `en` | `es`
The preference is saved per user and remembered across sessions.

**Rule:** Never hardcode English strings directly in JSX.
Use a translation object or i18n pattern so every user-facing string exists in both `en` and `es`.

---

## Payments

Accepted methods: **Cash, Zelle, Venmo**

The payments page shows all three options clearly with instructions for each.
Do not build Stripe or any credit card form — that is a future version.
Show a placeholder line: "Online card payments coming soon."

---

## Database Schema

### `businesses`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | unique identifier for this business |
| name | text | the business display name (e.g. "Yanette's House Cleaning Company") |
| owner_id | uuid | foreign key linking to the owner's entry in the users table |
| created_at | timestamp | automatically set when the row is created |

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | must match the Supabase auth user id exactly |
| business_id | uuid | which business this user belongs to |
| role | text | `owner` \| `manager` \| `cleaner` \| `client` |
| language_preference | text | `en` \| `es` |
| notification_preference | text | `app` \| `email` \| `sms` \| `all` |
| created_at | timestamp | |

### `clients`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| business_id | uuid | which business this client belongs to |
| name | text | client's full name |
| phone | text | |
| email | text | |
| address | text | street address of the home being cleaned |
| city | text | |
| frequency | text | `weekly` \| `biweekly` \| `monthly` \| `on-call` |
| cleaning_count | integer | increments by 1 each time an appointment is marked completed |
| owner_notes | text | private field — visible to Yanette only, never shown to the client |
| created_at | timestamp | |

### `appointments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| business_id | uuid | |
| client_id | uuid | foreign key linking to the clients table |
| date | date | the scheduled date of the cleaning |
| time | time | the scheduled start time |
| price | numeric | the dollar amount charged for this appointment |
| status | text | `scheduled` \| `completed` \| `cancelled` \| `pending_reschedule` |
| notes | text | any special instructions for this appointment |
| reschedule_fee | numeric | flat fee charged when client reschedules — confirm amount with Yanette |
| created_at | timestamp | |

### `workers`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| business_id | uuid | |
| name | text | worker's full name |
| phone | text | |
| hourly_rate | numeric | how much this worker is paid per hour |
| tier | text | `manager` \| `cleaner` — determines which portal they see |
| created_at | timestamp | |

### `timesheets`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| worker_id | uuid | foreign key linking to the workers table |
| appointment_id | uuid | nullable — not every timesheet entry ties to a specific appointment |
| clock_in | timestamp | when the worker started their workday |
| clock_out | timestamp | when the worker ended their workday |
| hours_worked | numeric | calculated field: clock_out minus clock_in, stored in hours |
| date | date | the calendar date of this shift |
| created_at | timestamp | |

### `payments`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| appointment_id | uuid | foreign key linking to the appointments table |
| amount | numeric | the dollar amount for this payment |
| paid | boolean | true if Yanette has confirmed payment was received |
| paid_date | date | nullable — only populated once payment is confirmed |
| method | text | `cash` \| `zelle` \| `venmo` \| `app` |
| created_at | timestamp | |

### `reschedule_requests`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| appointment_id | uuid | the original appointment being rescheduled |
| client_id | uuid | the client who submitted the request |
| requested_date | date | the new date the client is asking for |
| requested_time | time | the new time the client is asking for |
| fee | numeric | the flat fee charged for this reschedule |
| status | text | `pending` \| `approved` \| `denied` |
| created_at | timestamp | |

---

## Pages — Build Order

### Public
- `app/page.js` — landing page (public-facing, markets Yanette's business to potential new clients)

### Auth
- `app/login/page.js` — single login form; after sign-in, redirects each user to their correct portal

### Owner Dashboard (`app/dashboard/`)
- `page.js` — main calendar (monthly grid on desktop, single day on mobile)
- `clients/page.js` — list all clients, add new client, delete client
- `clients/[id]/page.js` — view and edit a single client's details
- `workers/page.js` — list all workers, add new worker, delete worker
- `workers/[id]/page.js` — view and edit a single worker's details
- `appointments/page.js` — list all appointments, create new appointment, cancel appointment
- `appointments/[id]/page.js` — view and edit a single appointment
- `revenue/page.js` — total earnings, monthly breakdown, revenue charts
- `payroll/page.js` — worker clock-in/out log, weekly hours summary
- `payments/page.js` — payment status per appointment, mark as paid, payment method display
- `reminders/page.js` — manage notification preferences for all users

### Worker Portals (`app/portal/`)
- `manager/page.js` — today's route list, single clock-in/clock-out button
- `cleaner/page.js` — today's job list, clock-in/out, total hours this week

### Client Portal
- `portal/client/page.js` — upcoming appointment details, payment status, reschedule request form

---

## Landing Page — Yanette's House Cleaning Company

Sections (in order):
1. **Hero** — Yanette's logo, company name, tagline, "Book a Cleaning" CTA button
2. **Services** — what the business offers (standard cleaning, deep clean, move-in/out, etc.)
3. **How It Works** — 3-step flow: Book Online → We Show Up → You Enjoy a Clean Home
4. **Why Choose Us** — trust signals: years in business, number of happy clients, insured & bonded
5. **Testimonials** — real or placeholder client reviews
6. **Contact / Book** — phone number, email, service area, booking CTA
7. **Nav** — "Log In" button in the top right, visible on every section

Tone: Warm, trustworthy, personal. Yanette is a real person who cares about her clients' homes.

---

## Open Questions — Confirm With Yanette Before Building

- [ ] Exact reschedule flat fee dollar amount
- [ ] Does the manager assign workers to houses, or only Yanette?
- [ ] How many days in advance can clients request a reschedule?
- [ ] Does Yanette want a public "Book a Cleaning" form, or just a phone/email CTA?
- [ ] Logo file — Yanette needs to provide this
- [ ] Preferred payment method display order (Cash / Zelle / Venmo)
- [ ] Service area cities to list on the landing page
- [ ] Tagline — does Yanette have one, or should one be written?

---

## Build Rules for Claude Code

0. **Before writing any frontend code, invoke the `frontend-design` skill.** No exceptions — every session, every page.
1. **Read this entire file before writing a single line of code.**
2. **Comment every non-trivial line of code** — explain what it does in plain English. This is non-negotiable.
3. One task at a time. Minimum change needed. Do not touch files outside the scope of the current task.
4. Diagnose before acting. State clearly what you are about to do before doing it.
5. Never rewrite an entire file unless Carlos explicitly says to.
6. Every new file gets: `'use client'` at top, section dividers, JSX markers.
7. Mobile-first for worker and client portals. Desktop-first for owner dashboard.
8. All UI strings must support both `en` and `es` — never hardcode English directly in JSX.
9. The calendar is the most important feature in this app. Build it carefully. Handle edge cases.
10. **Never use `.single()`.** Not once. Not ever.
11. Always use optional chaining on any joined Supabase data: `row.relation?.field`
12. State variable names must match exactly between their declaration and every place they are used.