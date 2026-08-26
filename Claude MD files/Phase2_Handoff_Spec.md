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

---

## Addendum (2026-08-20) — Settings Page, Break Timer, "Move to Top 3," Celebration Effects

Added after initial Phase 2 build was merged and manually verified. Pulls the Settings screen forward from Phase 8 (originally scoped there for just the inactivity threshold) — Phase 8 will add the inactivity threshold to this same page rather than building Settings twice.

### A1. Schema — already applied directly (2026-08-20), not a Claude Code task

`profiles.settings` gained five new keys, same jsonb-merge pattern as `default_session_minutes`:

| Key | Default | Maps to (BlitzIt reference) |
|---|---|---|
| `default_break_minutes` | `5` | Break |
| `auto_start_breaks` | `true` | Start breaks automatically |
| `auto_start_next_sprint` | `false` | Start work sprints automatically |
| `show_success_screen` | `true` | Show success screen |
| `success_screen_gif` | `true` | Fun gif on success screen |
| `success_sound_effect` | `true` | Success sound effect |

No "football celebration" equivalent — explicitly out of scope per Jeffrey's decision 2026-08-20.

### A2. Component Structure Addition

```
src/
  pages/
    SettingsPage.jsx
  components/
    settings/
      TimerSettingsSection.jsx      # work sprint / break duration + both auto-start toggles
      CelebrationSettingsSection.jsx # success screen / gif / sound toggles
  hooks/
    useSettings.js                  # single point of contact for all profiles.settings reads/writes
```

**Refactor note:** `useSettings.js` replaces the inline `profiles.update()` call that §5 originally put directly in the Active Session Screen for the timer interval. That write moves into this hook so there's one place managing `profiles.settings`, not two — same lesson as the Phase 1 sort-order bug (an invariant enforced in one place and not another is a bug waiting to happen).

### A3. Break Timer Behavior

- When the work sprint timer hits zero: if `auto_start_breaks` is `true`, the break countdown (`default_break_minutes`) starts automatically; if `false`, show a "Start Break" prompt instead.
- When the break timer hits zero: if `auto_start_next_sprint` is `true`, the next work sprint starts automatically; if `false`, return to a ready state awaiting manual start.
- **End Session stays fully manual and separate from this cycle**, confirmed per Jeffrey's decision 2026-08-20 — auto-transitioning between work/break does **not** fire the `execution_sessions`/`last_touched_at`/`streak_log` writes. Those only fire on an explicit End Session tap, regardless of how many work/break cycles ran first.
- **`duration_sec` sums work-sprint time only** — confirmed per Jeffrey 2026-08-20. Break time is excluded from the execution log; it isn't work on the task.

### A3a. "Pomodoro Sprints" Master Toggle — added 2026-08-22

Traces back to the BlitzIt reference screenshot's "Pomodoros" toggle sitting above "Work sprint"/"Break" — carried over its children (durations, auto-start toggles) when building the Settings schema but missed the parent toggle itself. Added as real scope, not cosmetic:

- New key: `pomodoro_enabled` (boolean, default `true`), already applied to `profiles.settings`.
- **When `true` (default):** Active Session Screen behaves exactly as specified in A3 — countdown sprint, optional auto-transition to break, etc.
- **When `false`:** Active Session Screen falls back to a plain stopwatch — counts up from zero with no fixed length, no break cycle, no auto-transitions. End Session ends it whenever the person taps it, same as always.
- **`duration_sec` in stopwatch mode** is simply total elapsed time from start to End Session — there's no sprint/break split to exclude anything from, unlike A3's "work-sprint time only" rule, which only applies when Pomodoro mode is active.
- **Settings page UI:** `default_session_minutes`, `default_break_minutes`, `auto_start_breaks`, and `auto_start_next_sprint` should visually nest under and disable/gray out alongside the master toggle when it's off — matching the BlitzIt reference's indentation, since none of those settings mean anything in stopwatch mode.

### A3b. success_sound_effect — no audio asset exists

Same placeholder situation as the session background photo and celebration gif (A6): the setting is real and live, but no audio file exists anywhere in the repo or design bundle. **Resolved 2026-08-22: leave it silent** — when `success_sound_effect` is `true` but no asset is configured, play nothing, no error state. This is a deliberate difference in reasoning from A3a above, not an inconsistency: unlike the master Pomodoro toggle (a real behavior gap that needed a decision), this is content Jeffrey hasn't supplied yet, same category as the photo and gif. Code should reference a static asset path (e.g. `assets/sounds/success.mp3`) and wrap the play call so a missing file fails silently rather than throwing.

An earlier version of this spec conflated two different needs into one "Move to Top 3" action. They've been separated, per Jeffrey's decision 2026-08-21, based on a real workflow: pulling extra tasks into today (e.g. two 30-minute tasks run in parallel with a Top 3 pick) without displacing anything, versus deliberately forcing a specific task into one of the three real slots.

**"Add to Today"** (Full List, This Week, and Planned cards — replaces the old "Move to Top 3" label):
- A toggle, not a one-way action. Clicking it sets `tasks.planned_date` to today. If the task already has `planned_date` set to today, clicking again clears `planned_date` to `null` entirely — it does **not** restore a previously-set other-day planned date, if one existed.
- Never touches `top3_override_slot`/`top3_override_date` or displaces anything already in the real Top 3.
- The button's visual state must differ between "not planned for today" and "planned for today" (e.g. filled/active style), so the toggle behavior is legible at a glance rather than requiring a second click to discover.
- No schema change — this is pure UI/behavior built on the existing `planned_date` column from Phase 5.

**"Also Today"** (new section on the Home screen, below the existing Top 3 cards):
- Lists every task where `planned_date` = today, **excluding** whichever three tasks are already shown in Top 3 above (a task can't appear twice).
- Fully hidden — no header, no empty state — when there are no such tasks. Appears only once at least one exists.
- Each card in this section needs its own "Remove from Today" action (same toggle-off behavior as clicking "Add to Today" again), so a task can be un-planned from here directly without navigating back to wherever it was originally added.
- Staleness is automatic, same pattern as the override columns: an item just stops appearing once `planned_date` isn't today anymore. No cleanup job needed.

**"Swap"** (`TopThreeCard` only — unchanged in purpose, but the picker it opens was never fully specified until now):
- Opens a modal scoped to the specific slot that triggered it: a text search field (filters by title as typed) above a list of every incomplete task (`status != 'done'`), **no exclusions** — including tasks already visible in Also Today. Each row shows title, due date, and priority tier.
- Clicking a row **assigns immediately, no confirmation step** — writes that task into the slot and closes the picker.
- This is the same override mechanism as before (`top3_override_slot`/`top3_override_date`), just with its selection UI now fully specified. `ManualOverridePicker.jsx` is **not** retired after all — it's revived, invoked only from Swap rather than from Full List cards.
- Displacing the previous slot occupant is the same non-atomic "clear old, set new" sequence already logged in `CLAUDE.md`'s Gotchas as a deliberate, accepted deferral (bundled with the session-end write sequence, revisit together in Phase 10) — no new atomicity work needed here, just confirming the picker triggers the existing sequence correctly.

### A4a. Which slot does "Add to Today" claim? — resolved: it claims none

This question doesn't actually arise under the model above. "Add to Today" never touches a Top 3 slot at all — it only sets `planned_date`. The only mechanism that assigns a specific slot is Swap, and Swap always operates on the one slot the person clicked from `TopThreeCard`, so there's no ambiguity about which of the three gets displaced.

### A5. Celebration Trigger

- Fires on marking a task **done** (`status: 'done'`), not on ending a session — these are different moments (a session can end without the task being finished). Confirmed per Jeffrey 2026-08-20.
- Add an explicit "Mark Complete" action on the Active Session Screen that sets `status: 'done'` and triggers the celebration sequence (success screen, gif, sound — each independently toggleable per `profiles.settings`), separate from End Session.
- **Resolved 2026-08-22 — Mark Complete also closes out the session.** The spec's original wording ("separate from End Session") only established that ending a session doesn't imply task completion — it left the reverse direction ambiguous. Confirmed: Mark Complete **also** performs End Session's writes (`execution_sessions.ended_at`/`duration_sec`, `tasks.last_touched_at`, `streak_log` upsert) as part of the same action, rather than leaving the session row open and requiring a separate End Session tap afterward. Rationale: there's no real scenario where someone completes a task and then keeps the timer running against it — leaving the session open in that case would just risk an orphaned `execution_sessions` row with no `ended_at`, and a completed task not counting toward that day's streak unless the person remembers a second tap.

### A6. Visual Design System

Established via Claude Design (Anthropic Labs), 2026-08-21. The project's design system was initially misconfigured — it inherited a generic newspaper/editorial system ("Broadsheet," with CMYK-separation effects, halftone textures, serif display type) from a different, unrelated Claude Design project, since design systems default to the workspace's existing system unless a new one is explicitly built. This has been corrected: Fused now has its own bespoke system, built directly from the `ccjeff714/Fused-App` repo.

**Tokens:**
- Palette: slate-blue + forest-green ramps, light and dark mode. No pink/magenta, no process-yellow, no print/editorial effects anywhere.
- Typography: Figtree throughout; IBM Plex Mono reserved for timer digits only.
- **Work session state:** calm background photography, green accent. **Break state:** solid blue, no imagery, softer type. This pairing (green = active work, teal/blue = calm rest) gives the palette's two core colors a functional meaning rather than a decorative one.
- No logo exists in the repo — wordmark is plain type with an accent dot, not an invented mark. No session background photo exists yet either; `SessionField` takes a `backgroundImage` prop and falls back to a green gradient until one is supplied (see A6a below).
- Icons are vendored Lucide SVGs (`assets/icons/`), since the repo ships no icon library — inlined so they render at any serving path and inherit `currentColor`.

**A6a. Session background image upload — schema already applied directly (2026-08-21):**

A private Supabase Storage bucket (`session-backgrounds`) with four RLS policies (select/insert/update/delete, each scoped to `(storage.foldername(name))[1] = auth.uid()::text`) is live. Upload path convention: `{user_id}/filename.jpg`. No `profiles.settings` migration was needed for the URL itself — `session_background_url` simply won't exist in `settings` until a user uploads something; the app should treat its absence as the normal case and fall back to the green gradient, not an error state. Claude Code's job here: build the actual upload control (on the Settings page) and wire `SessionField`'s `backgroundImage` prop to read from it.

### A7. Priority Tier Colors — Independent Tokens

The first design pass aliased tier colors directly to the brand palette (`--tier-high: var(--blue-500)`, `--tier-medium: var(--green-400)`), which collided with the work-session and streak colors — one token (`green-400`) was carrying three unrelated meanings at once (medium priority, active work session, engaged streak). Fixed 2026-08-21: all four tiers now have their own independent tokens, not aliased to blue/green at all:

| Tier | Color |
|---|---|
| Critical | True saturated red (not desaturated/softened) |
| High | Orange |
| Medium | Yellow |
| Low | Gray |

`--streak` stays on the green ramp thematically (pairs with the work-session state) but as its own fully independent token, never shared with a tier color again.

### A8. Card-Click Interaction Pattern

Clicking a task card behaves differently depending on which screen it's on:

- **Today (Top 3) screen:** opens a right-side sliding panel (Focus To-Do–style), showing title, due date, area, priority tier, notes, status, and a short execution history pulled from `execution_sessions` — all editable in place.
- **Every other screen** (Full List, This Week, Planned, Completed): opens a lightweight edit modal with title, due date, area, priority tier, notes, and status — no execution history, no panel treatment.

This is a deliberate partial pull-forward of Phase 4's Task Detail/Layered Context screen, scoped only to the Today view for now — the fuller Layered Context expand/collapse treatment for all screens remains Phase 4 scope.

**Known interaction bug, fix requested 2026-08-21:** interacting with a field inside either the panel or the modal was closing it entirely, rather than just not persisting the edit (expected, since Design prototypes have no real backend). Likely cause: a click-outside-to-close handler catching clicks that originate inside the panel/modal. Fix: stop that propagation so fields remain interactive while open.

### A9. Calendar Picker Consistency

The calendar date-picker used for Due Date in the Capture modal must be reused everywhere a Due Date or Planned Date field appears — the Capture modal, the lightweight edit modal, and the Today panel — not just in Capture, where it originally only appeared.

### Verification Checklist Additions

- [ ] `useSettings.js` is the only place that reads/writes `profiles.settings` — no duplicate inline calls
- [ ] Settings page renders and persists all six original keys correctly
- [ ] Auto-start toggles control timer transitions only — End Session writes remain fully manual regardless of toggle state
- [ ] `duration_sec` excludes break time
- [ ] `pomodoro_enabled` toggle works: `true` behaves per A3, `false` falls back to a plain count-up stopwatch with no sprint/break structure
- [ ] Settings page nests/disables sprint-duration and auto-start settings under the master toggle when it's off
- [ ] `duration_sec` in stopwatch mode is simple elapsed time, not work-sprint-only (that rule is Pomodoro-mode-specific)
- [ ] `success_sound_effect` fails silently with no error when no audio asset is configured
- [ ] "Add to Today" is a toggle on Full List/This Week/Planned cards, sets/clears `planned_date` to today, never touches `top3_override_slot`/`top3_override_date`
- [ ] Button visual state clearly differs between "not planned today" and "planned today"
- [ ] Also Today section shows all `planned_date = today` tasks excluding whatever's in the real Top 3, hidden entirely when empty
- [ ] Also Today cards have their own "Remove from Today" action
- [ ] Swap opens a searchable (by title) list of every incomplete task, no exclusions, and assigns immediately on click with no confirmation step
- [ ] Celebration fires on task completion (status → done), not on session end
- [ ] No Broadsheet/print-editorial styling remains anywhere (no CMYK effects, no halftone, no serif display type)
- [ ] All four priority-tier colors are independent tokens, not aliased to `--blue-*`/`--green-*`; critical is true saturated red
- [ ] `--streak` is its own independent token, not shared with any tier color
- [ ] Session background upload control exists on Settings page, writes to the `session-backgrounds` bucket under `{user_id}/`, and `SessionField` correctly falls back to the green gradient when no image is set
- [ ] Today screen cards open the right-side panel; all other screens open the lightweight edit modal — confirm the split, not a single shared pattern
- [ ] Editing a field inside the panel/modal no longer closes it
- [ ] Calendar picker appears consistently for Due Date and Planned Date in Capture, the edit modal, and the Today panel
