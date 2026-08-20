# CONTEXT.md

## Current Project
"Fused" — a personal productivity PWA replacing Notion + BlitzIt. Work-only MVP built on React/Vite + Supabase + Vercel, directed via Claude Code.

## Current Phase
Phase 1 (Living Task Core) is complete. Beginning Phase 2 (Session-First).

## What Good Looks Like — Phase 0 (completed 2026-08-19)
PWA shell live and installable (manifest + service worker verified via Chrome DevTools, real install prompt confirmed working). Supabase schema deployed exactly per Build_Plan.md — all six tables, RLS enabled with a policy on every table, security advisor clean. Magic link auth wired end-to-end and confirmed working locally (sign-in, session persistence via `onAuthStateChange`). A `profiles` row auto-creates on signup via the `handle_new_user` trigger (see Build_Plan.md). Public GitHub repo connected to Vercel, deployed live at `https://fused-app.vercel.app`. Supabase Auth redirect URLs configured for both production and localhost.

## What Good Looks Like — Phase 1 (completed 2026-08-20)
A user can create a task with just a title (the only required field), optionally add due date/area/notes, see it in a Full List view, edit it, and delete it. All reads/writes go through the authenticated Supabase client. No time-estimate field anywhere. Capture stays low-friction — title-only is a fully valid task. Task create/edit/delete manually verified working end-to-end against Supabase.

**Known caveat — RLS cross-user isolation not yet manually verified.** The `tasks` RLS policy (`auth.uid() = user_id`, scoping every read/write to the signed-in user) is deployed and was confirmed present via direct schema inspection, but Phase 1 verification only had one test account available, so cross-user isolation (that a second signed-in user genuinely cannot see or modify the first user's tasks) has not been manually confirmed end-to-end. Worth a manual two-account check before this app handles anything sensitive, and revisit per CLAUDE.md's Human Validation Zone for auth/RLS.

## What We Are Building Right Now
Phase 2 — Session-First, per Build_Plan.md: the Top 3 algorithm (due-date-first, priority-tier tiebreak), the Home/Session screen showing Top 3, a native timer + Active Session screen, and `execution_sessions` writes / `last_touched_at` updates.

## What to Avoid Right Now
Don't build Streak Mechanic features yet (streak_log writes, streak indicator) — that's Phase 3. Don't build Layered Context (Task Detail expand/collapse) — that's Phase 4. Don't add fields beyond what Build_Plan.md's schema defines. Don't reintroduce a time-estimate field, even if it seems like a natural addition to the timer/session UI.

## Next Steps After This Phase
Phase 3 — Streak Mechanic: `streak_log` writes on session completion, streak indicator on the Home screen.