# CLAUDE.md — Workflow Project (WAT Framework)

> This is the rulebook for the `workflow/` half of the repo ONLY.
> It is separate from `frontend/CLAUDE.md` on purpose — do not mix the two.
> Read this fully before building or editing any workflow.

---

## What This Is

`workflow/` holds the business automations for Yanette's House Cleaning Company,
built with Claude Code using the **WAT framework** from Nate Herk's course.

These automations run the "behind the scenes" jobs — the things that happen after a
visitor or client does something on the website. The first one handles **inquiries**
(see `workflow/workflows/inquiry/`).

---

## ⚠️ PASTE NATE'S WAT FRAMEWORK RULES HERE

> Carlos: drop the WAT-framework section from Nate Herk's course CLAUDE.md into the
> block below, then delete this warning. Everything under "Starter Interpretation" is
> only a placeholder so the folder is not empty — replace it with Nate's real rules.

<!-- ───────────── PASTE NATE'S WAT FRAMEWORK BELOW THIS LINE ───────────── -->

<!-- ───────────── END NATE'S WAT FRAMEWORK ───────────── -->

---

## Starter Interpretation of WAT (placeholder — confirm against the course)

A working guess at the structure so we have something to build on. **W-A-T = Workflow,
Agent, Tool.** Replace this with Nate's exact definitions when you have them.

- **Workflow** — the top-level job, triggered by one event. It is the "what happens
  when X occurs" (e.g. *a new inquiry arrives*). A workflow orchestrates Agents and
  Tools in order; it owns the sequence and the decisions.
- **Agent** — a unit that makes a decision or does reasoning inside a workflow
  (e.g. *classify this inquiry: booking request vs. general question*). Agents think.
- **Tool** — a concrete action with no judgement: send an email, write a Supabase row,
  call an API, format a message. Tools do.

Suggested folder shape per workflow:

```
workflow/
  workflows/
    inquiry/
      workflow.js     <- orchestrates the steps (the Workflow)
      agents/         <- decision/reasoning units (the Agents)
      tools/          <- concrete actions: email, supabase, etc. (the Tools)
      README.md       <- what this workflow does + its trigger
```

---

## How Workflows Are Triggered (the seam with the website)

Workflows do not import or touch the React/UI code. They are kicked off by events the
frontend records. The contract (also documented in the root `CLAUDE.md`):

1. The website form POSTs to `frontend/src/app/api/inquiry/route.js`.
2. That route writes the submission to the Supabase `inquiries` table.
3. The inquiry workflow here reacts to that row and runs its steps.

Keep this boundary clean: the frontend knows nothing about WAT internals, and
workflows never reach into the frontend.

---

## Code Style (same learning rules as the frontend)

This project is also a learning tool, so the "readable like a book" rule still applies:

- **Comment every non-trivial line in plain English** — what it does and why.
  Carlos is learning to code; no line should be a mystery.
- Talk to Supabase with the shared client pattern. **Never use `.single()`** — use
  `?.[0]?.id` array access (same hard rule as the frontend).
- Always use optional chaining on joined/nullable data: `row.relation?.field`.
- Keep each Tool small and single-purpose; keep each Agent's job narrow.
- Store secrets in environment variables, never in code committed to git.
