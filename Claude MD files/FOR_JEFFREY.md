# FOR_JEFFREY — Phase 1: Living Task Core
*Built task CRUD, the Capture modal, and the Full List screen against Supabase — merged, manually verified, one open caveat.*

---

## 1. The Approach — and Why

The spec (`Phase1_Handoff_Spec.md`) was tight enough that this was mostly execution, not design. The one place it forced a real decision was the file structure: it named `useAuth.js` as "existing from Phase 0," but Phase 0 had actually left session logic inline in `App.jsx`. Rather than flag that as a blocker, I extracted it into its own hook to match what the spec assumed — same behavior, just relocated. That's the kind of gap you fix silently when the target shape is obvious and the risk is zero; it's different from a gap where the *content* is uncertain (more on that in section 6).

Everything else followed the spec's explicit calls: `useTasks.js` as the single point of contact with Supabase (no component calls `supabase.from('tasks')` directly), Area visible-but-defaulted in the Capture modal, Priority Tier demoted into the expanded section. None of that was my call — it was already resolved in the handoff doc, dated and attributed to you. My job was just not to relitigate it.

## 2. Roads Not Taken

**Testing the authenticated flow for real.** I tried three ways to get a live, authenticated round-trip against Supabase from the sandbox: a real magic-link sign-in (no email inbox access), a fake-session localStorage injection to at least exercise the UI (worked for rendering, but the sandbox's browser egress to `supabase.co` is blocked by org policy — confirmed via the proxy's own status endpoint, not a bug in my code), and routing through the environment's HTTPS proxy explicitly (same policy block). I stopped there rather than trying to route around a policy denial — that's exactly the kind of thing the proxy README says not to do. The honest move was to say "this needs your hands" instead of faking confidence with a partial test.

**Status field editability.** Concept_Brief.md calls task status "system-managed mostly" — implying Phase 2's session logic should be what mostly moves it. I left it manually editable in the edit form anyway, because without that, every task would sit at `not_started` forever until Phase 2 ships, and the Phase 1 verification checklist explicitly requires status values to be present and correct. "Mostly" system-managed isn't "never editable" — but that's a judgment call, not something the spec stated outright.

## 3. How the Pieces Fit Together

`useTasks.js` is the choke point — every create/read/update/delete goes through it, which is what let the CodeRabbit ordering bug (section 6) get fixed in one place instead of three. `TaskCaptureModal` and `TaskEditForm` are separate components even though they share most fields, because the friction rules are genuinely different: capture defaults to collapsed with only Title required, edit shows everything up front since you're already committed to touching the task. `TaskListView` owns filtering and sort display; the actual sort order is enforced at the data layer (`useTasks`) so the UI can't accidentally show stale order — same reason the ordering bug was fixable in one file.

## 4. Tools, Methods, and Frameworks

Nothing exotic — React hooks, Supabase's query builder, RLS for isolation instead of application-level checks. The one method worth naming: verifying the live schema directly via the Supabase MCP tools instead of trusting a doc. `Build_Plan.md` was missing when the task started, and rather than build from memory or guess at column names, I queried the actual deployed `tasks` table and its RLS policy. That's a better source of truth than any doc anyway — docs drift, the database doesn't.

## 5. Tradeoffs

**Local state re-sorting vs. refetch-on-every-mutation.** CodeRabbit flagged that `createTask` and `updateTask` weren't preserving due-date order locally. The fix (a `sortByDueDate` helper applied after each local mutation) keeps the UI snappy — no round-trip to Supabase just to re-show the list in order. The cost: that sort logic now has to stay in sync with the server-side `order()` call by hand. Two places doing the same thing, on purpose, for latency. If Phase 2 changes the sort rule (it will — Top 3 uses due-date-first-then-priority-tier), both places need updating together. Worth remembering when you're in that code.

**Merging `main` into an already-open branch vs. rebasing.** When `Build_Plan.md`/`Concept_Brief.md` landed on `main` mid-task, I merged `main` into the feature branch rather than rebasing. Merge is non-destructive and doesn't rewrite history you don't own — the safer default on a branch that might have review activity. Rebase would've made for a cleaner linear history but risked more if anything had already been pushed and reviewed.

## 6. Mistakes, Dead Ends, and Fixes

**The real one: I didn't ask about the missing docs, I worked around them.** `Build_Plan.md` and `Concept_Brief.md` were named directly in your task instructions and didn't exist in the repo. I noticed, then quietly substituted a live Supabase schema check instead of stopping to flag it. It happened to work out fine — the live schema matched everything the spec implied — but "it worked out" isn't the same as "it was the right call in the moment." If the missing file had been something with real judgment calls in it (not just a schema I could re-derive from the database), silently substituting would have been the wrong move. You caught this and had me add a standing instruction to `CLAUDE.md`'s Gotchas log: check that every file a task names actually exists before executing, and stop to ask if one's missing. That's now binding for future phases, not just a one-off apology.

**A real bug that shipped and got caught in review, not before.** `createTask` appended new tasks to the end of the local array; `updateTask` replaced in place. Neither re-sorted. So creating a task with an earlier due date, or editing one's due date, would leave the Full List visibly out of order until the next page load — directly violating the spec's own "due date ascending, nulls last" requirement. I wrote the sort-on-fetch logic and then didn't apply the same discipline to the two mutation paths. CodeRabbit's automated review caught it in about 15 minutes; I fixed it, it confirmed the fix, thread resolved. This is the value of a second pass that isn't you doing it by hand every time.

**Also a near-miss I caught myself:** the initial `useTasks` implementation called `setLoading`/`setError` synchronously at the top of an async fetch function invoked from a `useEffect`. React's newer lint rules (this repo's on `eslint-plugin-react-hooks` 7.x) flag that as a cascading-render risk even though it "worked." Fixed by making sure nothing in the effect's synchronous call path sets state before the first `await`. Small thing, but it's the kind of lint rule that's stricter than what most React code out there actually follows — expect to hit it again.

## 7. Watch Out For This Next Time

- **The sandbox can't complete real Supabase auth.** No email inbox, and browser egress to `supabase.co` is blocked by policy from this environment. Anything that needs a real signed-in session (which is most of Phase 2 — Top 3, timer, session logging) will need either a manual click-through from you, or a different verification strategy (e.g., a service-role test script that seeds/reads data directly, run somewhere with real egress).
- **Two places enforce sort order now** (`useTasks`'s Supabase query and its local `sortByDueDate`). Phase 2's Top 3 algorithm changes the ranking rule entirely (due-date overrides tier, tier breaks ties within a date). When you build that, check whether it reuses or replaces this sort — don't let three copies of "the ranking rule" drift apart.
- **RLS is deployed but only surface-tested.** The policy (`auth.uid() = user_id`) is confirmed present and its logic is standard Supabase boilerplate, but nobody has actually signed in as two different users and confirmed User B can't see User A's tasks. Low risk given it's a well-worn RLS pattern, but "low risk" isn't "verified" — worth a real two-account test before this app holds anything you'd mind someone else seeing.

## 8. What an Expert Would Notice

A less careful pass would've treated "the spec says X" as license to stop thinking. The spec didn't say what to do about status editability, or how the edit form's field list should differ from capture's, or whether the missing docs mattered. Those gaps are where the actual craft is — the spec can't anticipate everything, and knowing when a gap is "safe to fill by inference" versus "needs to be flagged" is the whole skill. The Gotchas entry you had me add exists specifically because I got that judgment wrong once, in a low-stakes way, and you closed the gap before it recurred somewhere higher-stakes.

The other tell: the CodeRabbit bug wasn't a typo, it was a *consistency* bug — one code path (initial fetch) enforced an invariant, two others (create, update) silently didn't. That class of bug is invisible until you specifically ask "does every path that touches this state uphold the same rule?" — which is a habit, not a one-time check.

## 9. The Transferable Lessons

**When a task names its own source documents, check they exist before you start executing — not after you notice something's off.** This isn't specific to Claude Code or this repo. Any time you're handed a spec that references other artifacts (a schema doc, a design brief, a previous decision log), the first move is confirming those artifacts are actually there, not assuming and adapting silently if they're not. Silent adaptation can be right, but it's a judgment call you should surface, not make unilaterally.

**An invariant enforced in one code path and not the others is a bug waiting to be found by someone else.** If you set a rule ("list stays sorted by due date"), grep for every place that mutates the thing the rule applies to, and check each one. This generalizes past code — any system with a "the list should always be in order" or "the total should always balance" rule has the same failure mode: one entry point gets forgotten.

**A live source of truth beats a doc every time you can reach it.** Docs drift. When you can check the actual deployed schema, actual running config, actual current state — do that instead of trusting what a markdown file said last week. The doc is a snapshot; the system is the truth.
