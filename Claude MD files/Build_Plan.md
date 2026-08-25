# Build Plan — [Working Title: "Fused"]
 
> Companion to Concept_Brief.md. This translates the resolved design decisions into a data schema, screen flow, and a phased build order for Claude Code.
 
---
 
## 🧱 Stack Summary
 
| Layer | Choice |
|---|---|
| Frontend | PWA (React + Vite, installable) |
| Backend | Supabase (Postgres + Auth + Realtime) |
| Auth | Supabase Auth, magic link email |
| AI | Claude API, called server-side (Vercel serverless function — never expose the API key client-side) |
| Hosting | Vercel |
| Build method | Claude Code, directed by you |
 
---
 
## 🗄️ Data Schema (Supabase / Postgres)
 
All tables carry `user_id` from day one per the resolved sharing-readiness decision, enforced via Row Level Security (RLS) so each user only ever sees their own rows.
 
### `users` (managed by Supabase Auth, extended with a profile table)
```sql
profiles (
  id            uuid primary key references auth.users(id),
  email         text,
  settings      jsonb default '{"inactivity_threshold_days": 2, "default_session_minutes": 25, "default_break_minutes": 5, "auto_start_breaks": true, "auto_start_next_sprint": false, "show_success_screen": true, "success_screen_gif": true, "success_sound_effect": true}',
  created_at    timestamptz default now()
)
```
 
### `projects`
```sql
projects (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) not null,
  name          text not null,
  description   text,
  status        text default 'active',  -- active | on_hold | done
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  role_id       uuid references roles(id)  -- nullable — which Role this Project belongs to
)
```

### `roles` (PARA "Areas" — Operations, Data Management, Project Management, etc.)
```sql
roles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) not null,
  name          text not null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
)
```
Same RLS pattern as `projects` — a user only ever sees their own roles.
 
### `tasks` (the Living Task)
```sql
tasks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid references profiles(id) not null,
  title            text not null,
  due_date         date,
  area             text default 'work',   -- work only in v1; field exists for v2 expansion
  notes            text,
  status           text default 'not_started', -- not_started | in_progress | blocked | done
  priority_tier    text default 'medium_priority', -- critical | high_priority | medium_priority | low_priority
  project_id       uuid references projects(id),
  last_touched_at  timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  top3_override_slot  integer,  -- 1 | 2 | 3, nullable — manual Top 3 slot assignment; check (top3_override_slot is null or top3_override_slot in (1,2,3))
  top3_override_date  date,     -- nullable — the override only applies when this equals today
  planned_date  date,           -- nullable — a "working on this day" designation, distinct from due_date
  role_id       uuid references roles(id),  -- nullable — kept in sync with project_id's role by a DB trigger, see below
  subtasks      jsonb default '[]'  -- lightweight checklist: array of {text, done} objects, not a relational structure
)
```
Partial unique index `(user_id, top3_override_date, top3_override_slot) WHERE top3_override_slot IS NOT NULL` prevents two tasks from claiming the same slot on the same day for the same user. There's no constraint requiring `top3_override_slot` and `top3_override_date` to be both-null-or-both-set — the app never writes one without the other, but nothing at the DB level currently enforces that pairing.

**Trigger `sync_role_on_project_change`** (before insert or update of `project_id` on `tasks`, calls `sync_task_role_with_project()`): whenever a task's `project_id` is set, this trigger overwrites `role_id` to match that project's `role_id`. This is a hard lock enforced in the database, not just suggested by the UI — see `CLAUDE.md` Gotchas for the re-evaluation checkpoint on this decision.
 
### `execution_sessions` (the execution log — auto-populated, never manually entered)
```sql
execution_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) not null,
  task_id       uuid references tasks(id) not null,
  started_at    timestamptz not null,
  ended_at      timestamptz,
  duration_sec  integer
)
```
 
### `streak_log`
```sql
streak_log (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) not null,
  date          date not null,
  engaged       boolean default false,
  unique(user_id, date)
)
```
 
### `reentry_events`
```sql
reentry_events (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references profiles(id) not null,
  trigger_type    text not null,  -- weekly | inactivity | overdue_task
  trigger_reason  text,           -- e.g. "3 days inactive" or task id for overdue
  summary_content text,           -- AI-generated text
  generated_at    timestamptz default now(),
  acknowledged_at timestamptz
)
```

### Storage — `session-backgrounds` bucket
Private bucket, one folder per user (`{user_id}/...` path convention). Four RLS policies on `storage.objects`, all scoped to `bucket_id = 'session-backgrounds' AND (storage.foldername(name))[1] = auth.uid()::text`:
- `Users can view own session background` (SELECT)
- `Users can upload own session background` (INSERT)
- `Users can update own session background` (UPDATE)
- `Users can delete own session background` (DELETE)

Backs the Active Session Screen's optional background image — a user can only ever read or write files under their own `{user_id}/` folder.
 
**Notes:**
- No time-estimate field anywhere — deliberate, per the timer-guilt anti-pattern.
- `last_touched_at` on tasks is what the overdue/staleness trigger reads from a — updated whenever a session starts or the task is edited.
- `settings.inactivity_threshold_days` on the profile lives in jsonb so it's adjustable without a schema migration, matching the "changeable option" decision.
- `settings.default_session_minutes` (added Phase 2, 2026-08-20, default `25`) is the Active Session Screen's adjustable Pomodoro-style interval — a session-duration preference, not a time-estimate field on a task, so it's exempt from the DO NOT list's time-estimate rule.
- `tasks.top3_override_slot` / `tasks.top3_override_date` (added Phase 2, 2026-08-20) back the manual Top 3 override — swapping a different task into one of today's three recommended slots. No cleanup job needed; an override past its date is just inert leftover data since the app only reads it when `top3_override_date` equals today.
- `settings.default_break_minutes` / `auto_start_breaks` / `auto_start_next_sprint` / `show_success_screen` / `success_screen_gif` / `success_sound_effect` (added Phase 5, 2026-08-21, all live) round out the Pomodoro session-preference set alongside `default_session_minutes` — break length, whether breaks/next sprints auto-start, and end-of-session celebration options. None are task-level fields, so none touch the DO NOT list's time-estimate rule.
- `tasks.planned_date` (added Phase 5, 2026-08-21) is a "working on this day" designation, separate from `due_date` (when it's actually due) and from the Top 3 override (today's recommended slots) — a task can be planned for a day without being due that day.
- `tasks.role_id` (added Phase 5, 2026-08-21) is kept in sync with `project_id`'s role by the `sync_role_on_project_change` trigger whenever `project_id` is set — see the trigger note above `tasks`.
- `tasks.subtasks` (added Phase 5, 2026-08-21, default `[]`) is a `jsonb` array of `{text, done}` objects — a lightweight checklist, not a relational parent-child table. See `glossary.md`'s Subtasks entry for the reasoning.
- `handle_new_user()` was hardened (pinned `search_path`, revoked `EXECUTE` from `anon`/`authenticated`) to close direct RPC access — the same hardening is now also applied to `sync_task_role_with_project()`, confirmed live (`anon`/`authenticated` cannot execute either function directly; both run as `SECURITY DEFINER` with `search_path` pinned to `''`).
---
 
## 🖥️ Screen-by-Screen Flow
 
1. **Home / Session Screen** *(default landing screen)*
   - Today's Top 3, each showing title + due date + priority tier at a glance
   - Tap any of the three to expand its context (Layered Context) and start a session
   - Streak indicator (small, persistent, not nagging)
   - Quick capture button, always reachable
2. **Active Session Screen**
   - Timer running (Pomodoro-style, configurable interval)
   - Task title + expanded notes visible throughout
   - End session → writes to `execution_sessions`, updates `last_touched_at`, marks streak engaged for the day
3. **This Week's Short List**
   - Narrower filtered view — designated set for the week
   - Same card format as Top 3, but browsable, not prescriptive
4. **Full List**
   - All active tasks, filterable by project/status/priority
   - Where the full backlog lives; not the default view
5. **Task Detail (Layered Context expand)**
   - Notes, project relation, execution history, status — collapsed by default everywhere else, fully visible here
6. **Capture Modal**
   - Typed: title field, expandable to due date / area / notes
   - Voice: title + optional due date only, richer speech routed into notes for later cleanup
7. **Projects View**
   - List of projects, each showing its related tasks (rollup-style count/status)
8. **Re-entry Screen**
   - Surfaces `reentry_events` — weekly summary and any inactivity/overdue-triggered nudges
   - Acknowledge action clears the nudge
9. **Settings**
   - Inactivity threshold (default 2 days, adjustable)
   - Basic account/auth management
---
 
## 🔨 Phased Build Order (Claude Code)
 
Each phase should be independently testable before moving to the next — same incremental-validation instinct as the Notion build.
 
**Phase 0 — Scaffolding**
- PWA shell (React + Vite + manifest/service worker)
- Supabase project setup, schema migration for all tables above, RLS policies
- Magic link auth wired end-to-end (sign in, session persistence)
- Deploy empty shell to Vercel — confirms the full pipeline works before any features exist
**Phase 1 — Living Task Core**
- Task CRUD (create, edit, delete, list)
- Capture modal (typed only — voice comes later)
- Full List screen
**Phase 2 — Session-First**
- Top 3 algorithm (due-date-first, priority-tier tiebreak)
- Home/Session screen showing Top 3
- Native timer + Active Session screen
- `execution_sessions` writes, `last_touched_at` updates
**Phase 3 — Streak Mechanic**
- `streak_log` writes on session completion
- Streak indicator on Home screen
**Phase 4 — Layered Context**
- Task Detail expand/collapse
- Notes field, rich enough for context (links, formatting as needed)
**Phase 5 — Roles & Projects**
- See `Phase5_Handoff_Spec.md` for full scope — grew considerably beyond this build plan's original "Projects CRUD" framing to include Roles as a real table, the Projects View (Roles as collapsible sections, Projects nested inside), the Role-lock trigger, and the subtasks checklist field.
**Phase 6 — Weekly Short List**
- Designation mechanism (how a task gets marked "this week")
- Short List screen
**Phase 7 — Voice Capture**
- Voice-to-text title + due date only, transcription overflow into notes
**Phase 8 — AI Re-entry**
- Serverless function calling Claude API
- Weekly summary generation (scheduled)
- Condition-triggered nudges (inactivity threshold, overdue task)
- Re-entry Screen, settings for threshold
**Phase 9 — Migration**
- Import all active work tasks from Notion (CSV export → import script, or direct Notion API pull if the connector is available)
- Verify against the current ~85-task Work Tasks database
**Phase 10 — Polish**
- PWA install prompts, offline handling, edge cases
- Real-world daily use begins here
---
 
## 📅 Status
 
Build plan drafted. Ready to start Phase 0 whenever you want to hand this to Claude Code.