# Phase 2 Handoff Spec — Session-First

**Companion to:** `Build_Plan.md` (data schema, Phase 2 scope), `Concept_Brief.md` (Top 3 resolved logic), `CLAUDE.md` (behavioral rules, DO NOT list, Gotchas), `FOR_JEFFREY.md` (Phase 1 debrief — sort-order lesson below)
**Status:** Approved by Jeffrey 2026-08-20. Ready to hand to Claude Code.

---

## Scope

Top 3 algorithm (due-date-first, priority-tier tiebreak), the Home/Session Screen showing Top 3, a native Pomodoro-style timer with an adjustable interval, the Active Session Screen, `execution_sessions` writes, `last_touched_at` updates, and `streak_log` writes on session end. Streak_log writes are in scope; the visible streak indicator/mechanic is **not** — that's Phase 3. Layered Context (Task Detail expand/collapse) is **not** in scope — that's Phase 4.

**Schema note:** the two migrations this phase depends on (`profiles.settings.default_session_minutes`, `tasks.top3_override_slot` / `tasks.top3_override_date`) were already applied directly on 2026-08-20 — confirmed live via `list_tables` and a clean security-advisor pass. Claude Code does not need to run these migrations; it just needs to build against the columns as documented in §5 and §3 below. `Build_Plan.md`'s schema section should be updated to reflect these two additions so it stays the accurate source of truth going forward.

**Standing reminder per `CLAUDE.md` Gotchas:** before executing this spec, confirm `Build_Plan.md`, `Concept_Brief.md`, and `Phase1_Handoff_Spec.md` all actually exist in the repo. If any is missing, stop and alert Jeffrey — don't substitute a workaround silently.

---

## 1. Component / File Structure

```
src/
  hooks/
    useTasks.js                 # existing from Phase 1 — extend, don't duplicate (see §2)
    useTopThree.js               # new: Top 3 selection, built on the shared ranking utility
    useSession.js                # new: session lifecycle — start/end, execution_sessions + streak_log writes
  lib/
    ranking.js                   # new: shared sort/rank utility (see §2 — the sort-order fix)
  components/
    session/
      HomeSessionScreen.jsx      # new default landing screen — Top 3 + quick capture
      TopThreeCard.jsx           # one recommended task, tap to start a session
      ManualOverridePicker.jsx   # swap a Top 3 slot for a different task from Full List
      ActiveSessionScreen.jsx    # timer UI + task context + End Session action
      SessionTimer.jsx           # Pomodoro-style countdown, adjustable interval
  pages/
    HomePage.jsx                 # replaces FullListPage as the default route
```

`useTopThree.js` and `useSession.js` follow the Phase 1 pattern: single point of contact with Supabase for their concern, no component queries directly.

---

## 2. The Sort-Order Fix (per `FOR_JEFFREY.md`'s Phase 1 lesson)

Phase 1 shipped with the due-date sort enforced in **three** separate places (`useTasks`'s Supabase `.order()` call, and a local `sortByDueDate` applied after create/update) — a bug slipped through when two of the three weren't kept in sync.

**For Phase 2:** extract a single shared ranking utility (`lib/ranking.js`) that both the Full List and the Top 3 algorithm call — not three independent copies of "how to sort tasks."

```js
// lib/ranking.js
const tierOrder = { critical: 0, high_priority: 1, medium_priority: 2, low_priority: 3 };

export function rankTasks(tasks) {
  return [...tasks].sort((a, b) => {
    // due date ascending, nulls last
    if (a.due_date !== b.due_date) {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return a.due_date < b.due_date ? -1 : 1; // ISO date strings sort lexically
    }
    // same due date (or both null) — priority tier breaks the tie
    return tierOrder[a.priority_tier] - tierOrder[b.priority_tier];
  });
}
```

- **Full List** continues to sort by due date only (per Phase 1 spec) — it can call `rankTasks` and ignore the tier tiebreak, or keep its existing due-date-only sort. Either is fine as long as it's not a fourth independent implementation.
- **Top 3** (`useTopThree.js`) calls `rankTasks(nonDoneTasks)` and takes the first 3. This is where due-date-first + tier-tiebreak actually matters, per `Concept_Brief.md`'s resolved logic.

---

## 3. Top 3 Algorithm

- Fetch all tasks where `status != 'done'`.
- Rank via the shared `rankTasks` utility (§2).
- Take the first 3.
- **Manual override, persisted server-side.** `tasks.top3_override_slot` (integer, 1/2/3, nullable) and `tasks.top3_override_date` (date, nullable) were added via migration on 2026-08-20, with a partial unique index (`WHERE top3_override_slot IS NOT NULL`) preventing two tasks from claiming the same slot on the same day — no new table, rides on the existing `tasks` RLS policy.
  - **Swap:** `tasks.update({ top3_override_slot: slot, top3_override_date: today }).eq('id', taskId)`.
  - **Building the actual Top 3 list:** first check for any tasks where `top3_override_date = today`, ordered by `top3_override_slot` — these take their assigned slots. Fill any remaining slots from the ranked (non-overridden) list via `rankTasks`.
  - **Staleness is automatic:** since the override only applies when `top3_override_date` equals today, no cleanup job is needed — yesterday's override values just stop being read once the date rolls over. They're harmless leftover data, not a bug; clearing them isn't required for Phase 2.

---

## 4. Session Lifecycle → Supabase Mapping

| Action | Call | Notes |
|---|---|---|
| Start session | `execution_sessions.insert({ task_id, user_id, started_at: now() }).select().single()` | Fires when a Top 3 card is tapped |
| End session | `execution_sessions.update({ ended_at, duration_sec }).eq('id', sessionId)` | |
| Update task | `tasks.update({ last_touched_at: now() }).eq('id', taskId)` | Same action as End Session |
| Streak write | `streak_log.upsert({ user_id, date: today, engaged: true }, { onConflict: 'user_id,date' })` | **In scope for Phase 2** per Jeffrey's decision 2026-08-20 — write only, no visible indicator yet (that's Phase 3) |

All three writes (`execution_sessions` update, `tasks` update, `streak_log` upsert) fire together on End Session.

---

## 5. Timer / Active Session Screen

- **Adjustable interval, persisted server-side.** `profiles.settings.default_session_minutes` was added via migration on 2026-08-20 (default `25`, backfilled onto the existing profile row). The Active Session Screen reads this value on load and lets the person adjust it; on change, write back with `profiles.update({ settings: { ...settings, default_session_minutes: newValue } }).eq('id', session.user.id)` — merge into the existing `settings` object, don't overwrite the whole jsonb blob (would clobber `inactivity_threshold_days`).
- **This is not a time-estimate field** and doesn't violate the `CLAUDE.md` DO NOT list — it's a session-duration preference for the timer itself, not an estimate attached to a task. Worth stating explicitly so this doesn't get flagged incorrectly during verification.
- Task title + `notes` field displayed plainly throughout the session — **not** the full Phase 4 Layered Context expand/collapse component, which doesn't exist yet. Just render the existing notes content directly.

---

## 6. Screen Behavior

- **Home/Session Screen** becomes the new default landing route, replacing Full List (which stays reachable via nav).
- Tapping a Top 3 card starts a session and navigates to the Active Session Screen.
- Quick capture button reuses Phase 1's `TaskCaptureModal` unchanged.
- Streak indicator is **not** built this phase — no UI element references `streak_log` yet, even though the table is being written to.

---

## Verification Checklist (per `CLAUDE.md`)

- [ ] Top 3 logic matches the resolved rule exactly: due date overrides priority tier; within the same due date, tier (critical → high → medium → low) breaks the tie
- [ ] Full List, Top 3, and any other task ordering all route through `lib/ranking.js` — no independent copy of the sort logic
- [ ] `execution_sessions` insert on start, update (`ended_at`, `duration_sec`) on end
- [ ] `tasks.last_touched_at` updates on session end
- [ ] `streak_log` upserts on session end (write only — no streak indicator UI yet)
- [ ] Timer interval reads/writes `profiles.settings.default_session_minutes`, merging into the existing jsonb object rather than overwriting it
- [ ] No time-estimate field introduced on the `tasks` side — the session timer interval is a session preference, not a task field, and is exempt from the DO NOT list for that reason
- [ ] Manual override reads/writes `tasks.top3_override_slot` / `tasks.top3_override_date`; Top 3 assembly checks for today's overrides before falling back to `rankTasks`
- [ ] Home/Session Screen is the new default route; Full List remains reachable
- [ ] No Layered Context expand/collapse component built (Phase 4) — notes render plainly on Active Session Screen

---

## Human Validation Zone

Per `FOR_JEFFREY.md`'s Phase 1 debrief: the sandbox environment cannot complete a real Supabase auth flow (no email inbox access, `supabase.co` egress blocked by policy). Most of Phase 2 requires a real signed-in session to verify (Top 3 populating correctly, timer/session writes, streak_log upserts) — expect this phase to need your manual click-through rather than Claude Code self-verifying end-to-end. Standard CodeRabbit PR review still applies at the code level.
