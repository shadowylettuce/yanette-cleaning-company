-- schema.sql — creates every database table for Yanette's House Cleaning Company
--
-- HOW TO RUN THIS (full steps in SETUP_GUIDE.md):
--   1. Open your Supabase project dashboard
--   2. Click "SQL Editor" in the left sidebar
--   3. Paste this ENTIRE file and click "Run"
--
-- NOTE: This matches the schema in CLAUDE.md, plus three small additions the app needs:
--   * workers.user_id  — links a worker to their login account (so the portal knows whose jobs to show)
--   * clients.user_id  — links a client to their login account (same reason)
--   * appointment_workers — a "join table" recording which workers are assigned to which appointment
--     (without it there is no way to show "assigned workers" on the calendar)

-- ─────────────────────────── BUSINESSES ───────────────────────────
-- One row per cleaning business. For now there is exactly one: Yanette's.
create table businesses (
  id uuid primary key default gen_random_uuid(), -- unique identifier, auto-generated
  name text not null,                            -- the business display name
  owner_id uuid references auth.users(id),       -- links to the owner's login account in Supabase Auth
  created_at timestamptz default now()           -- automatically set when the row is created
);

-- ─────────────────────────── USERS ───────────────────────────
-- One row per person who can LOG IN (Yanette, workers, clients).
-- The id must exactly match the person's Supabase Auth user id.
create table users (
  id uuid primary key references auth.users(id), -- must match the Supabase auth user id exactly
  business_id uuid references businesses(id),    -- which business this user belongs to
  role text not null check (role in ('owner', 'manager', 'cleaner', 'client')), -- what they can do in the app
  language_preference text default 'en' check (language_preference in ('en', 'es')), -- English or Spanish
  notification_preference text default 'app' check (notification_preference in ('app', 'email', 'sms', 'all')), -- how they want reminders
  created_at timestamptz default now()
);

-- ─────────────────────────── CLIENTS ───────────────────────────
-- One row per HOME that gets cleaned. (Separate from `users` — a client may or may not have a login.)
create table clients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),    -- which business this client belongs to
  user_id uuid references auth.users(id),        -- ADDITION: the client's login account, if they have one (can be empty)
  name text not null,                            -- client's full name
  phone text,
  email text,
  address text,                                  -- street address of the home being cleaned
  city text,
  frequency text default 'biweekly' check (frequency in ('weekly', 'biweekly', 'monthly', 'on-call')), -- how often they get cleaned
  cleaning_count integer default 0,              -- goes up by 1 each time an appointment is marked completed
  owner_notes text,                              -- PRIVATE — visible to Yanette only, never shown to the client
  created_at timestamptz default now()
);

-- ─────────────────────────── APPOINTMENTS ───────────────────────────
-- One row per scheduled cleaning visit.
create table appointments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  client_id uuid references clients(id) on delete cascade, -- which client's home; if the client is deleted, their appointments go too
  date date not null,                            -- the scheduled date of the cleaning
  time time,                                     -- the scheduled start time
  price numeric default 0,                       -- the dollar amount charged for this appointment
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'pending_reschedule')),
  notes text,                                    -- any special instructions for this visit
  reschedule_fee numeric default 0,              -- flat fee charged when client reschedules — confirm amount with Yanette
  created_at timestamptz default now()
);

-- ─────────────────────────── WORKERS ───────────────────────────
-- One row per employee (managers and cleaners).
create table workers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id),
  user_id uuid references auth.users(id),        -- ADDITION: the worker's login account, if they have one (can be empty)
  name text not null,                            -- worker's full name
  phone text,
  hourly_rate numeric default 0,                 -- how much this worker is paid per hour
  tier text default 'cleaner' check (tier in ('manager', 'cleaner')), -- determines which portal they see
  created_at timestamptz default now()
);

-- ─────────────────────────── APPOINTMENT_WORKERS (addition) ───────────────────────────
-- A "join table": each row says "this worker is assigned to this appointment".
-- One appointment can have many workers, and one worker has many appointments.
create table appointment_workers (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade, -- if the appointment is deleted, the assignment goes too
  worker_id uuid references workers(id) on delete cascade,           -- if the worker is deleted, the assignment goes too
  created_at timestamptz default now()
);

-- ─────────────────────────── TIMESHEETS ───────────────────────────
-- One row per workday per worker — records clock in and clock out.
create table timesheets (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references workers(id) on delete cascade, -- whose shift this is
  appointment_id uuid references appointments(id),         -- nullable — not every shift ties to one specific appointment
  clock_in timestamptz,                          -- when the worker started their workday
  clock_out timestamptz,                         -- when the worker ended their workday
  hours_worked numeric,                          -- calculated: clock_out minus clock_in, stored in hours
  date date default current_date,                -- the calendar date of this shift
  created_at timestamptz default now()
);

-- ─────────────────────────── PAYMENTS ───────────────────────────
-- One row per appointment that tracks whether it has been paid.
create table payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade, -- which appointment this payment is for
  amount numeric default 0,                      -- the dollar amount for this payment
  paid boolean default false,                    -- true once Yanette confirms payment was received
  paid_date date,                                -- nullable — only filled in once payment is confirmed
  method text check (method in ('cash', 'zelle', 'venmo', 'app')), -- how the client paid
  created_at timestamptz default now()
);

-- ─────────────────────────── RESCHEDULE_REQUESTS ───────────────────────────
-- One row per "can we move my cleaning?" request from a client.
create table reschedule_requests (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointments(id) on delete cascade, -- the original appointment being moved
  client_id uuid references clients(id) on delete cascade,           -- the client who asked
  requested_date date,                           -- the new date the client is asking for
  requested_time time,                           -- the new time the client is asking for
  fee numeric default 0,                         -- the flat fee charged for this reschedule
  status text default 'pending' check (status in ('pending', 'approved', 'denied')),
  created_at timestamptz default now()
);

-- ─────────────────────────── ROW LEVEL SECURITY (RLS) ───────────────────────────
-- RLS is Supabase's permission system: it decides which ROWS each logged-in user may see/change.
-- For version 1 we use a simple rule: any LOGGED-IN user can read and write.
-- (People who are not logged in get nothing.) The app's role system controls what each
-- person can actually see. Tightening these per-role is a good future improvement.

alter table businesses enable row level security;           -- turn the permission system on for this table
alter table users enable row level security;
alter table clients enable row level security;
alter table appointments enable row level security;
alter table workers enable row level security;
alter table appointment_workers enable row level security;
alter table timesheets enable row level security;
alter table payments enable row level security;
alter table reschedule_requests enable row level security;

-- "to authenticated using (true)" means: any logged-in user passes the check
create policy "logged-in users full access" on businesses for all to authenticated using (true) with check (true);
create policy "logged-in users full access" on users for all to authenticated using (true) with check (true);
create policy "logged-in users full access" on clients for all to authenticated using (true) with check (true);
create policy "logged-in users full access" on appointments for all to authenticated using (true) with check (true);
create policy "logged-in users full access" on workers for all to authenticated using (true) with check (true);
create policy "logged-in users full access" on appointment_workers for all to authenticated using (true) with check (true);
create policy "logged-in users full access" on timesheets for all to authenticated using (true) with check (true);
create policy "logged-in users full access" on payments for all to authenticated using (true) with check (true);
create policy "logged-in users full access" on reschedule_requests for all to authenticated using (true) with check (true);

-- ─────────────────────────── GOOGLE CALENDAR IMPORT (addition) ───────────────────────────
-- If you already ran the big script above, paste ONLY this section into the SQL Editor and click "Run".
-- It remembers which Google Calendar event each imported appointment came from,
-- so re-importing the same .ics file skips rows that already exist instead of duplicating them.
alter table appointments add column if not exists google_event_uid text;

-- speeds up the "have we already imported this event on this date?" lookup
create index if not exists idx_appointments_google_uid
  on appointments (business_id, google_event_uid, date);
