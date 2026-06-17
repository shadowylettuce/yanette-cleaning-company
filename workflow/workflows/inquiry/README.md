# Inquiry Workflow

**Trigger:** a visitor submits the website contact / booking form (or sends an email
that lands in the `inquiries` table).

**Goal:** make sure no potential customer ever falls through the cracks — capture the
inquiry, let Yanette know, and reply to the visitor quickly.

---

## What it should do (first draft — refine with the WAT framework)

1. **Capture** — a new row appears in the Supabase `inquiries` table (written by
   `frontend/src/app/api/inquiry/route.js`).
2. **Classify (Agent)** — decide what kind of inquiry it is:
   `booking request` | `general question` | `spam`.
3. **Notify Yanette (Tool)** — send her the inquiry (app / email / SMS per her
   notification preference) so she can follow up.
4. **Auto-reply (Tool)** — send the visitor a friendly confirmation that Yanette will
   reach out, in the visitor's language (`en` / `es`).
5. **Record outcome** — mark the inquiry as handled so it is not processed twice.

## Build it with WAT

Follow the structure in `workflow/CLAUDE.md`:
- `workflow.js` — orchestrates steps 1–5 in order.
- `agents/` — the classify step lives here.
- `tools/` — the notify + auto-reply + Supabase-update actions live here.

## Open questions (confirm before building)

- [ ] Does the `inquiries` Supabase table exist yet? (Schema: name, email, phone,
      message, source `form` | `email`, language, status, created_at.)
- [ ] How should Yanette be notified — app, email, SMS, or all?
- [ ] What does the auto-reply message say (English + Spanish)?
- [ ] Is the website contact/booking form built yet, or does that come first?
