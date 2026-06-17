# CLAUDE.md — Repo Root (Yanette's House Cleaning Company)

> Keep this file SHORT. It is loaded for every task in this repo.
> The real, detailed rules live in the per-path CLAUDE.md files below — read the one
> that matches the folder you are working in. Do not duplicate their content here.

---

## This Repo Has Two Halves

This is a monorepo with two separate projects that each have their own CLAUDE.md.
They are kept apart on purpose so their rules never bleed into each other.

| Path | What it is | Its rulebook |
|------|-----------|--------------|
| `frontend/` | The Next.js + Supabase website and business app | `frontend/CLAUDE.md` |
| `workflow/` | The WAT-framework automations (built with Claude Code) | `workflow/CLAUDE.md` |

**Rule:** When you work inside `frontend/`, follow `frontend/CLAUDE.md`.
When you work inside `workflow/`, follow `workflow/CLAUDE.md`.
Claude Code loads the nearest CLAUDE.md automatically, so you usually get the right one.

---

## The ONE Place They Touch — The Trigger Seam

The frontend and the workflows are otherwise independent. They meet at exactly one
contract, and this is the only cross-cutting thing worth documenting here:

> **A user action in the website triggers a workflow.**
> Example: a visitor clicks **"Contact Us"** / submits the booking form → that fires the
> **inquiry** workflow.

**How the handoff works (the contract):**
1. The website form POSTs to a single Next.js API route in the frontend:
   `frontend/src/app/api/inquiry/route.js` (the trigger endpoint).
2. That route does the minimum: validate the submission and record it (Supabase
   `inquiries` table) — it is the ONLY thing the frontend knows about workflows.
3. The `workflow/` side picks it up from there and runs the WAT automation
   (notify Yanette, auto-reply to the visitor, etc.).

Keep this seam thin. The frontend should never contain workflow logic, and the
workflow should never reach into React/UI code. They communicate only through this
endpoint + the shared Supabase table.

---

## Project Background

See the developer's learning context and goals in Claude Code memory
(`learning-context`). Short version: Carlos is learning Claude Code by building this
for a family member's cleaning company, using Nate Herk's WAT framework for the
workflow half, with the goal of later selling the same build to other companies.
