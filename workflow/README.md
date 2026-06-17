# workflow/ — Business Automations (WAT Framework)

This folder is one half of the repo. The other half is `frontend/` (the website + app).

- **What lives here:** the automations that run after a website action — built with
  Claude Code using Nate Herk's WAT framework.
- **Rulebook:** read `CLAUDE.md` in this folder before building anything.
- **First workflow:** `workflows/inquiry/` — handles inquiries submitted by email or
  through the website's contact / booking form.

## How it connects to the website

The frontend never runs workflow logic. It only records an event (e.g. a form
submission) and the matching workflow here reacts to it. The single point of contact:

```
website form  ->  frontend/src/app/api/inquiry/route.js  ->  Supabase `inquiries` table  ->  inquiry workflow
```

See the root `CLAUDE.md` ("The Trigger Seam") for the full contract.
