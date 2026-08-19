# Phase 1 Handoff Spec — Living Task Core

**Companion to:** `Build_Plan.md` (data schema, Phase 1 scope), `Concept_Brief.md` (friction rules), `CLAUDE.md` (behavioral rules, DO NOT list)
**Status:** Approved by Jeffrey 2026-08-19. Ready to hand to Claude Code.

---

## Scope

Task CRUD (create, edit, delete, list), the Capture modal (typed only — voice is Phase 7), and the Full List screen. Nothing from Phase 2 (Top 3 algorithm, timer, execution logging) or Phase 5 (Projects CRUD/UI) is in scope here.

---

## 1. Component / File Structure

```
src/
  lib/
    supabaseClient.js          # existing client init, reused everywhere
  hooks/
    useTasks.js                 # wraps all CRUD calls + loading/error state
    useAuth.js                  # existing from Phase 0, exposes session/user
  components/
    tasks/
      TaskCaptureModal.jsx      # typed capture, collapsed-by-default fields
      TaskCard.jsx              # single row/card in the Full List
      TaskListView.jsx          # Full List screen: fetch + filter + render TaskCard[]
      TaskEditForm.jsx          # shared by edit-in-place or a lightweight edit modal
  pages/
    FullListPage.jsx            # thin page wrapper, mounts TaskListView + capture button
```

`useTasks.js` is the single point of contact with Supabase for tasks. No component calls `supabase.from('tasks')` directly — this keeps `user_id` attachment and error handling in one place.

---

## 2. CRUD → Supabase Mapping

RLS is deployed (`auth.uid() = user_id` on `tasks`). Reads are auto-scoped by policy — no manual `.eq('user_id', ...)` filter needed on selects. Inserts require `user_id` set explicitly from the session to pass the `with check` clause.

| Operation | Call | RLS Note |
|---|---|---|
| Create | `supabase.from('tasks').insert({ title, due_date, area, priority_tier, notes, project_id, user_id: session.user.id }).select().single()` | `user_id` must come from the authenticated session — omitting it fails the insert policy |
| Read (list) | `supabase.from('tasks').select('*').order('due_date', { ascending: true, nullsFirst: false })` | Policy restricts to own rows automatically |
| Update | `supabase.from('tasks').update({ ...fields, updated_at: new Date(), last_touched_at: new Date() }).eq('id', taskId)` | Any edit updates `last_touched_at`, not just Phase 2 session logic. A blocked update (wrong user) returns 0 rows affected, not an error — surface this to the user if it happens |
| Delete | `supabase.from('tasks').delete().eq('id', taskId)` | Same 0-row-affected behavior if RLS blocks it |

---

## 3. Capture Modal — Field Behavior

**Friction rules, quoted from `Concept_Brief.md`, binding for this build:**

> "Max friction at the moment of capture: **title + optional due date + optional area + optional notes.**"

> "Typed capture: a single field that expands if you want to add more, never requires it."

> "Deferred processing over upfront structuring... richer categorization happens during session assignment or weekly review, not at the moment something enters the system."

**Default (non-expanded) view:**
- **Title** — autofocused text input. Only field that blocks submission.
- **Area** — visible, pre-filled to `work`, editable via a simple selector. (v1 is work-only domain per `Concept_Brief.md` MVP scope, but the field is not hidden — visible-but-defaulted per Jeffrey's decision 2026-08-19.)

**Expanded ("add details") view**, revealed by a toggle:
- **Due Date** — optional, blank by default.
- **Priority Tier** — optional dropdown (critical / high_priority / medium_priority / low_priority), defaults to `medium_priority` if untouched. Added to the expanded section per Jeffrey's decision 2026-08-19 — not part of the original friction-rule field list, but schema-present and needed ahead of Phase 2's Top 3 algorithm.
- **Notes** — optional, blank by default.

**Submit button:** disabled only when Title is empty. Area and Priority Tier ship with defaults, so no field beyond Title represents a real decision the user is forced to make.

**Hard exclusion:** no time-estimate field or UI element, per `CLAUDE.md` DO NOT list — do not add one even if it seems like a natural addition to the form.

---

## 4. Full List Screen

**Task card displays:** Title, due date (or "no due date"), priority tier badge, status. Project badge only if `project_id` happens to be set (won't occur in Phase 1 — no Project picker exists until Phase 5).

**Filters (Phase 1 scope only):** status (not_started / in_progress / blocked / done), priority tier. **No project filter** — Projects CRUD is Phase 5; don't build UI against a relation with no management screen yet.

**Default sort:** due date ascending, nulls last. This is a sane list default, not the Top 3 algorithm (Phase 2).

**Explicitly out of scope for this screen:** the BlitzIt-style Today/This Week/Backlog tab row referenced in `REFERENCES.md` — that structure belongs to Phase 2 (Session-First) and Phase 6 (Weekly Short List). Full List in Phase 1 is the flat, unfiltered-by-time "everything" view.

---

## Verification Checklist (per `CLAUDE.md`)

- [ ] `tasks` table already has `user_id` + RLS policy (deployed in Phase 0 — confirm no regression)
- [ ] Title is the only field blocking Capture submission
- [ ] No time-estimate field anywhere in the modal, card, or edit form
- [ ] Priority tier dropdown values match schema exactly: `critical`, `high_priority`, `medium_priority`, `low_priority`
- [ ] Status values match schema exactly: `not_started`, `in_progress`, `blocked`, `done`
- [ ] Edits update both `updated_at` and `last_touched_at`
- [ ] Full List has no project filter or Today/This Week/Backlog tabs (Phase 5 / Phase 2 / Phase 6 respectively)

## Human Validation Zone

None specific to Phase 1 beyond standard PR review (CodeRabbit) — this phase doesn't touch auth/RLS *configuration* (already deployed and signed off in Phase 0), doesn't run the Notion migration, and doesn't touch repo visibility. Standard manual click-through + CodeRabbit review applies.
