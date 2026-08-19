# Concept Brief — [Working Title: "Fused"]
 
## A single app that replaces Notion + BlitzIt
 
> This is a working concept brief, not a spec. It captures the shape of the idea as of the design conversation on July 21, 2026. Expect this to evolve once building starts.
 
---
 
## 🎯 One-Liner
 
A personal operating system where a task's **context** and its **execution** are the same object — not two apps stitched together. You open it once a day; it tells you what to work on and starts working with you.
 
---
 
## 🧩 Why Sidestep the Notion Build
 
The Notion + BlitzIt combo split the problem into two systems: Notion held the *why*, BlitzIt held the *do*. That split works fine when maintenance discipline holds — but the documented failure mode (new priority pulls focus → maintenance lapses → re-entry cost too high → system abandoned) hits harder when there are two systems to fall behind on instead of one.
 
The bet here: if context and execution live in the *same record*, there's nothing to keep in sync, nothing to reconcile after a lapse, and one re-entry point instead of two.
 
**Status of the Notion build:** Paused as primary focus, kept running as a fallback while this is designed and built. Not archived — if this doesn't stick, Notion is still there.
 
---
 
## 🏗️ Core Concept — Three Ideas, One Model
 
These aren't three competing options. They're three layers of the same design.
 
### 1. Living Task (the data model)
Every task is a single record with both context and execution state built in — not a task that links out to a separate notes page, and not a timer session that references a task elsewhere. One object, one source of truth.
 
**Draft fields:**
 
| Field | Purpose | Friction Rule |
|---|---|---|
| Title | What it is | Required |
| Due Date | When it matters | Optional |
| Area | work / personal / hobby | Optional at capture |
| Notes | Context — why this exists, what's been tried, links | Optional at capture, filled in later |
| Status | not started / in progress / blocked / done | System-managed mostly |
| Execution Log | Time chunks worked, session history | Auto-populated by sessions, not manually entered |
| Streak Contribution | Whether this task counted toward today's engagement | Auto-managed |
| Related Project | Optional link | Optional |
 
Notice: **no time estimate field.** That was a documented anti-pattern (timer guilt) in the Notion build, and it carries forward as a hard rule here.
 
### 2. Session-First (the interaction model)
You don't land on a list and pick something. You open the app and it proposes **today's top 3** — not a single task — each with its context attached, and lets you start a timer on whichever one you jump into. From there you have three doors, in order of prominence:
 
1. **Today's Top 3** (default, front-and-center — pick any of the three and go; switch between them freely as the day changes)
2. **This week's short list** (the designated set of items for the week — a narrower view than the full backlog)
3. **Full list** (everything, for when you specifically need it)
The Top 3 framing deliberately echoes the Top 3 ritual from your TELOS strategy (S2) — this app becomes the natural home for that ritual instead of a manual morning exercise.
 
This preserves BlitzIt's stickiness (timer + task combined) while making sure the *first* thing you see is a recommendation, not an undifferentiated pile.
 
### 3. Layered Context (the surfacing model)
The context/notes layer is real and rich (Notion's strength) but it's collapsed by default. It expands per-task, on demand. Quick capture never has to pass through it — you can add a title and walk away, and the richness is there waiting whenever you (or the AI) need to draw on it.
 
---
 
## ✍️ Capture Flow
 
Max friction at the moment of capture: **title + optional due date + optional area + optional notes.**
 
- Typed capture: a single field that expands if you want to add more, never requires it.
- Voice capture: title + optional due date only. Anything richer said out loud gets transcribed into Notes for later review — it doesn't block the capture.
Deferred processing over upfront structuring, same principle as the Notion build: richer categorization happens during session assignment or weekly review, not at the moment something enters the system.
 
---
 
## 🔁 The Neglect-Survival Mechanism
 
Carried forward from the Notion build, with an added AI layer:
 
- **Streak mechanic** (Duolingo model) — visible daily engagement streak, tied to completing at least one session, not to perfect task completion.
- **Re-entry page** — same core idea as the Notion build: a single page that answers "where was I?" without requiring a full review.
- **AI-assisted re-entry** — this is the new piece. Instead of you writing a manual weekly summary, the app generates one:
  - **Weekly re-entry**: a standing AI-generated summary of what moved, what stalled, and what's overdue for attention.
  - **Condition-triggered re-entry**: specific conditions (e.g., N days since last open, a task sitting untouched past its due date) can trigger an AI-generated "here's what changed while you were away" note, not just a scheduled weekly one.
This needs its own design pass later — specifically, what data the AI is allowed to pull from and how much synthesis vs. raw facts it surfaces (the Notion build's principle of "pull a small, high-signal subset, not the whole workspace" should probably carry over here too).
 
---
 
## 🛠️ Technical Direction
 
| Decision | Choice | Why |
|---|---|---|
| **Build approach** | Claude Code, agentically, you directing | Matches your stated build preference |
| **Platform** | PWA (Progressive Web App) | Single codebase, installs to phone home screen, full-featured on desktop where you actually live day-to-day. Avoids React Native's build/simulator/app-store overhead, which slows the "try it, see if it works, improve" loop you prefer. Revisit React Native later only if you need background push, home screen widgets, or App Store distribution for sharing. |
| **Backend** | Supabase | Already your identified Phase 3 target for the Notion build; supports relations, auth, and real-time sync from day one without a later migration. |
| **AI layer** | Claude API | For session recommendations, re-entry summaries, and condition-triggered nudges |
 
---
 
## 📐 Design Principles Carried Forward (from the Notion project)
 
These held for the Notion build and should hold here too, unless you want to explicitly revisit them:
 
- Survive neglect — usable after a week away without a rebuild
- No time estimates at capture (timer guilt)
- Deferred processing over upfront structuring
- Low-friction capture is non-negotiable
- Context over completion — a task with context beats ten without
- Duolingo model — small daily commitment, visible streak, rewarding to open
---
 
## ✅ MVP Scope (decided July 21, 2026)
 
**Domain: Work only.** Prove the model on work tasks/projects before extending to personal life or hobbies. Personal and hobby domains are explicitly deferred, not abandoned — same three-domain vision as the original Notion project, just sequenced.
 
**In v1:**
 
| Piece | Included? | Notes |
|---|---|---|
| Living Task data model | ✅ | Title, due date, area (work only for now), notes, status, execution log, streak contribution |
| Capture flow (typed + voice) | ✅ | Full friction rules as designed above |
| Today's Top 3 recommendation | ✅ | Core session-first interaction |
| Weekly short list view | ✅ | |
| Full list view | ✅ | |
| Native timer (Pomodoro/blitz mode) | ✅ | Built in, not deferred to BlitzIt |
| Streak mechanic | ✅ | |
| Projects (relation to tasks) | ✅ | Included from v1 |
| AI-assisted re-entry (weekly + condition-triggered) | ✅ | Included from v1 |
| PWA + Supabase + Claude API | ✅ | Foundational stack, not deferred |
 
**Deferred to v2+:**
 
- Personal and hobby domains (Life Hub equivalent)
- Sharing / multi-user support
- Formal migration tooling from Notion (v1 assumes manual re-entry of active work tasks/projects)
This is a genuinely full-featured MVP, not a stripped-down one — the only thing narrowed is the domain (work only). Everything else designed above (Living Task, Session-First, Layered Context, AI re-entry, native timer) ships in v1.
 
---
 
## ✅ Resolved Design Decisions (July 21, 2026)
 
**1. AI re-entry mechanics**
- **Weekly summary** pulls: tasks completed that week (from execution log), which Top 3 picks got worked vs. skipped, and any critical/high-priority task sitting untouched.
- **Condition-triggered nudge** fires after **2 days of inactivity** (app not opened), with this threshold user-adjustable in settings — not hardcoded.
- Also fires when a task sits untouched past its due date (separate trigger from the inactivity one).
**2. Top 3 recommendation logic**
- Due date can override priority tier — something due today jumps ahead of a stale critical-priority task.
- Within the same due date, priority tier (critical → high → medium → low) breaks ties.
- Manual override always available regardless of what the algorithm surfaces.
**3. Projects data shape**
- Parent record, related to tasks via relation — same pattern as the current Notion Projects DB ↔ Work Tasks relation. No duplicated data.
**4. Sharing/multi-user readiness**
- Every Supabase table gets a `user_id` column from day one, even though v1 is single-user. Cheap now, expensive to retrofit.
**5. Migration scope from Notion**
- All active work tasks migrate into v1, not just the critical/high tier. Full cutover on the work domain.
---
 
## 📅 Status
 
Design phase complete for v1. Scope: work-only domain, full feature set (Living Task, Today's Top 3 with due-date-first/tier-tiebreak logic, Layered Context, native timer, streak, AI re-entry at 2-day/adjustable threshold, Projects as related parent records, per-user-scoped Supabase schema). Migration: full active work task set from Notion.
 
**Next step:** move to a build plan — data schema, screen-by-screen flow, and a phased Claude Code build order.