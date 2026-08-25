# Phase 5 Handoff Spec — Roles, Projects, and Subtasks

**Companion to:** `Build_Plan.md` (original Phase 5 scope: "Projects CRUD, Task ↔ Project relation, Projects View screen"), `Concept_Brief.md`, `glossary.md` (PARA mapping), `REFERENCES.md` (Notion-project prior art), `CLAUDE.md` (behavioral rules, DO NOT list)
**Status:** Designed conversationally 2026-08-21, schema applied directly to Supabase same day. Ready to hand to Claude Code once this doc and the project files are reviewed.

---

## Scope

This significantly expands Phase 5's original scope (which was just Projects CRUD + a Projects View). It now covers:
1. **Roles** — a new, user-manageable entity implementing the PARA "Areas" concept referenced in `glossary.md` but never built.
2. **Projects**, including a Role relationship, a Full List filter, and a dedicated Projects View screen.
3. **Subtasks**, implemented as a lightweight checklist field — not a relational structure.

**Terminology note, important:** "Role" here is unrelated to the existing `tasks.area` field (work/personal/hobby, fixed to `'work'` for all of v1). They were nearly conflated during design and are worth keeping distinct: `area` is the broad life-domain split from the original `Concept_Brief.md` design; Role is the PARA-Areas concept, mapping onto Jeffrey's real prior categories (e.g. Operations, Data Management, Project Management) from the Notion build.

---

## 1. Schema — already applied directly to Supabase, 2026-08-21

Not a Claude Code task. Applied and verified (`list_tables`, a live insert/trigger test, and a clean security-advisor pass) in three migrations:

```sql
-- Roles: a real user-manageable table, same RLS pattern as projects
create table roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- RLS: select/insert/update/delete, each scoped to auth.uid() = user_id

-- role_id on both projects and tasks — standalone tasks need it too, not just project-linked ones
alter table projects add column role_id uuid references roles(id);
alter table tasks add column role_id uuid references roles(id);

-- Lightweight subtask checklist, not a relation
alter table tasks add column subtasks jsonb default '[]'::jsonb;
```

Plus a database trigger enforcing the Role/Project invariant at the data layer (not just the UI — see §3):

```sql
create or replace function sync_task_role_with_project()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if new.project_id is not null then
    select role_id into new.role_id from public.projects where id = new.project_id;
  end if;
  return new;
end;
$$;

create trigger sync_role_on_project_change
before insert or update of project_id on tasks
for each row execute function sync_task_role_with_project();
```

`EXECUTE` on `sync_task_role_with_project()` has been revoked from `anon`/`authenticated`, matching the same hardening already applied to `handle_new_user()` — trigger firing is unaffected, this only closes direct RPC access.

**Why a trigger and not just app-layer logic:** consistent with this project's standing principle (database triggers over app-layer logic for invariant rules, same reasoning as `handle_new_user`'s profile auto-creation). Without it, a bug or a direct API call could write a task whose `role_id` doesn't match its project's — the trigger makes that structurally impossible rather than just discouraged by the UI.

**Why a checklist and not relational subtasks:** research into the prior Notion build showed subtask usage stayed shallow in practice (one level, never deeply nested) and was functionally closer to a checkbox list (DTW App's ~20-item flat list) than to independent task records with their own due dates and priority. A `jsonb` array of `{text, done}` objects matches that real usage shape, avoids a second entity type, and needs no Top-3-exclusion logic — checklist items were never independent tasks that could accidentally surface there in the first place.

---

## 2. Roles

- User-manageable, not a fixed enum — Jeffrey wants to rename/add roles later without a schema change, unlike `status` or `priority_tier`.
- No dedicated Roles CRUD screen has been designed yet. Minimum viable: creation happens inline wherever a Role picker appears (Capture, edit surfaces, Projects View), same low-friction spirit as everything else in this app. Flag to Jeffrey if a dedicated management screen turns out to be needed once this is in daily use.

---

## 3. Role ↔ Project ↔ Task Relationship

- **A Project belongs to exactly one Role.** Confirmed by Jeffrey 2026-08-21: if a piece of work's role genuinely changes, that's treated as a new task/project, not a live reassignment.
- **A standalone task (no project) can still carry a Role directly** — most of Jeffrey's real task list in the old system wasn't project-linked, so Role needs to be meaningful without a Project present, not just inherited through one.
- **Auto-fill and lock:** when a task has a `project_id`, its `role_id` is forced to match the project's (enforced by the trigger in §1 — not just suggested by the UI). When a task has no `project_id`, `role_id` is freely editable.
- **On project reassignment:** if a task's `project_id` changes to a different project, `role_id` is overwritten to match the new project automatically (same trigger, no separate confirmation step) — the project assignment itself is the deliberate act.
- **This lock is deliberately revisitable, not permanent.** Jeffrey's own words: "let's lock it, but re-evaluate the lock in a future phase to see if it is still warranted." Recommended checkpoint: end of Phase 5, once Roles/Projects have real usage to evaluate against, rather than left open-ended. **This needs to land in `CLAUDE.md` as a standing item, not just live in this spec** — see the project-files update section below.

---

## 4. Projects View Screen

New screen (not in the original six-screen Claude Design pass). Structure follows validated prior art from the Notion build's Direction 7d, which used collapsible role-toggle sections and wasn't rejected on its own merits — the whole Notion build was abandoned for the context/execution split this app exists to fix, not because this pattern failed.

- **Top level:** Roles as collapsible toggle sections.
- **Nested inside each Role:** its Projects.
- **Clicking into a Project:** shows that project's related tasks.

---

## 5. Full List — Project/Role Filter

Add a Project filter and a Role filter to Full List's existing filters (currently status + priority tier only, per `Phase1_Handoff_Spec.md` §4, which explicitly deferred project filtering to "Phase 5" — this is that deferred work). This is complementary to the Projects View, not a replacement: Projects View is for entering through a specific project; Full List's filter is for narrowing an already-open flat view.

---

## 6. Capture Modal — Field Additions

Add **Project** and **Role** as optional fields in the expanded "add details" section, positioned after Notes in priority (Jeffrey's explicit ordering: Notes matters more than either tag if he only has room for one more field at capture). Same auto-fill-and-lock behavior as §3 applies here — picking a Project locks Role to match it.

Full expanded-section field order as of this spec: Due Date, Planned Date, Priority Tier, Project, Role, Notes.

**Note on `planned_date`:** earlier in this design process it was assumed `planned_date` shouldn't be a capture-time field (deferred to weekly review only) — that assumption was wrong and has been corrected. Jeffrey confirmed a task arriving mid-week that needs planning for a near-term day shouldn't have to wait for the weekend review cycle. `planned_date` belongs in Capture's expanded section alongside Due Date.

---

## 7. Card-Click Surfaces (Today Panel / Lightweight Edit Modal)

Per Phase 2 Addendum §A8: both the Today right-side panel and the lightweight edit modal used on every other screen need Project and Role added, with the same auto-fill-and-lock behavior as Capture.

---

## 8. Task Cards — Badges

Full List, This Week, and Planned task cards should show a Project badge (when set) and a Role badge (Role stays meaningful even without a Project, since standalone tasks can carry one directly).

---

## 9. Subtasks — Checklist, Not a Screen

- `tasks.subtasks`: `jsonb`, array of `{text: string, done: boolean}` objects, default `[]`.
- No new screen, no new card type, no CRUD for a second entity. Rendered inline wherever a task's detail is already shown (the Today panel, the edit modal).
- Checklist items cannot independently carry a due date, priority, or execution session — if a future real case demands that, it's a signal to reconsider this decision, not to bolt relational behavior onto the checklist field.

---

## Verification Checklist

- [ ] `roles` table exists, RLS scoped correctly, `EXECUTE` on `sync_task_role_with_project()` revoked from `anon`/`authenticated`
- [ ] Creating/editing a task with a `project_id` set correctly forces `role_id` to match the project — verify via the trigger, not just the UI (a direct insert should also sync correctly)
- [ ] Removing a task's `project_id` leaves `role_id` as-is and makes it editable again (not reset to null)
- [ ] Role and Project are optional in Capture, positioned after Notes, both behind the expand toggle
- [ ] Today panel and the lightweight edit modal both show Project/Role with the same lock behavior as Capture
- [ ] Full List has working Project and Role filters
- [ ] Projects View renders Role sections collapsible, Projects nested correctly, clicking a Project shows its tasks
- [ ] Project and Role badges appear on Full List, This Week, and Planned cards
- [ ] Subtask checklist renders and toggles correctly wherever task detail is shown; confirm no independent due date/priority/session capability was accidentally added to checklist items
- [ ] `area` field is untouched and unrelated to any of the above — confirm nothing conflated `area` with Role during implementation

---

## Human Validation Zone

Schema and the Role-sync trigger have already been applied and tested live (a real insert/select round-trip confirmed correct sync behavior, cleaned up after). What's still outstanding is entirely UI/functional wiring in Claude Code — none of Roles, Projects, the Projects View, or subtasks exist in the running app yet, only in the schema and in Claude Design mockups. Standard manual click-through + CodeRabbit review applies once built. Per the established sandbox limitation (`FOR_JEFFREY.md`'s Phase 1 debrief), expect Jeffrey's manual verification to be the primary check here too, same as every phase since.

---

## Outstanding Project-Files Updates (not yet done)

- `CLAUDE.md`: add the Role-lock re-evaluation checkpoint (§3) as a standing item — recommend end of Phase 5 as the trigger, or reactive if Jeffrey prefers.
- `Build_Plan.md`: schema section needs all of Phase 5's tables/columns added (`roles`, `role_id` on `projects`/`tasks`, `subtasks`); Phase 5's build-order description needs replacing with this doc's actual scope, which is considerably larger than the original one-line summary.
- `glossary.md`: add Role, Projects View, and subtasks-as-checklist as defined terms — Role especially, given how easily it was conflated with `area` during design.
- `REFERENCES.md`: the Direction 7d toggle-sections precedent and the Notion project's Role/Project prior art are worth a permanent note here, not just this spec, since they'll likely inform future phases too.
