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
  settings      jsonb default '{"inactivity_threshold_days": 2}',
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
  updated_at    timestamptz default now()
)
```
 
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
  updated_at       timestamptz default now()
)
```
 
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
 
**Notes:**
- No time-estimate field anywhere — deliberate, per the timer-guilt anti-pattern.
- `last_touched_at` on tasks is what the overdue/staleness trigger reads from a — updated whenever a session starts or the task is edited.
- `settings.inactivity_threshold_days` on the profile lives in jsonb so it's adjustable without a schema migration, matching the "changeable option" decision.
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
**Phase 5 — Projects**
- Projects CRUD
- Task ↔ Project relation
- Projects View screen
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