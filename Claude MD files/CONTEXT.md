# CONTEXT.md

## Current Project
"Fused" — a personal productivity PWA replacing Notion + BlitzIt. Work-only MVP built on React/Vite + Supabase + Vercel, directed via Claude Code.

## Current Phase
Phase 0 (Scaffolding) is complete. Beginning Phase 1 (Living Task Core).

## What Good Looks Like — Phase 0 (completed 2026-08-19)
PWA shell live and installable (manifest + service worker verified via Chrome DevTools, real install prompt confirmed working). Supabase schema deployed exactly per Build_Plan.md — all six tables, RLS enabled with a policy on every table, security advisor clean. Magic link auth wired end-to-end and confirmed working locally (sign-in, session persistence via `onAuthStateChange`). A `profiles` row auto-creates on signup via the `handle_new_user` trigger (see Build_Plan.md). Public GitHub repo connected to Vercel, deployed live at `https://fused-app.vercel.app`. Supabase Auth redirect URLs configured for both production and localhost.

## What We Are Building Right Now
Phase 1 — Living Task Core, per Build_Plan.md: Task CRUD (create, edit, delete, list), the capture modal (typed only — voice comes later in Phase 7), and the Full List screen.

## What Good Looks Like — Phase 1
A user can create a task with just a title (the only required field), optionally add due date/area/notes, see it in a Full List view, edit it, and delete it. All reads/writes go through the authenticated Supabase client and respect RLS (a signed-in user only ever sees their own tasks). No time-estimate field anywhere. Capture stays low-friction — title-only is a fully valid task.

## What to Avoid Right Now
Don't build Session-First features yet (Top 3 algorithm, timer, execution logging) — that's Phase 2. Don't add fields beyond what Build_Plan.md's `tasks` schema defines. Don't reintroduce a time-estimate field, even if it seems like a natural addition to a task form.

## Next Steps After This Phase
Phase 2 — Session-First: Top 3 algorithm (due-date-first, priority-tier tiebreak), Home/Session screen, native timer, execution session logging.