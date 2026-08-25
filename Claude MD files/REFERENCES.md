# REFERENCES.md
 
Background material for this project. Claude should know this exists and draw on it, but does not act on it directly unless asked.
 
## Examples of Good Work
 
**BlitzIt app layout** (screenshot on file): dropdown selector at top ("All Lists" — becomes the Roles/Projects filter in this app), a tab row (Backlog / This Week / Today / Done — this app uses Today / This Week / Backlog as the three primary tabs), task cards showing subtask progress rings and time tracking, and a floating primary action button ("Blitz Now"). This is the reference for the task list/tab structure.
 
**AppSheet Site Details view** (screenshot on file, from Jeffrey's environmental consulting AppSheet build): hero banner with title, a row of quick-action icons (view on map / view related items / current conditions), a structured info block (address), a related-items table (Associated Wells), and bottom tab navigation (Sites / Nearby / Well Activities). This is the reference for the Project/Role detail page: general info + AI summary + related artifacts (documents/images) + Top 3 relevant items + quick actions (add task, jump to task view).

**Notion build's Direction 7d** (collapsible role-toggle sections): validated prior art for the Projects View — Roles as collapsible top-level sections with Projects nested inside. This pattern wasn't rejected on its own merits; the whole Notion build was abandoned for the context/execution split that Fused exists to fix, not because Direction 7d's layout was wrong. Safe to build on directly in Phase 5 rather than re-deriving a structure from scratch.
 
## Relevant Links and Documents
- `Concept_Brief.md` — full design concept: Living Task, Today's Top 3, Layered Context, AI re-entry mechanism, resolved design decisions
- `Build_Plan.md` — data schema, screen-by-screen flow, phased Claude Code build order, cost/time estimates
- Uploaded design references: BlitzIt and AppSheet Site Details screenshots (see Examples of Good Work above)
## Key Background
 
**Why this app exists:** Jeffrey's prior Notion + BlitzIt system split context (Notion) from execution (BlitzIt). When a new priority pulled focus, maintenance lapsed on one or both systems, and the cost of re-entry became too high, leading to abandonment. This app's core bet is that fusing context and execution into one record removes that failure mode.
 
**Project Helios:** EarthSoft's AI system for unstructured data, which EarthSoft purchased from BP. Jeffrey referenced this as the aspirational shape for the eventual second-brain/AI-summary layer — not a full agent rebuild, but an indexed, queryable structure over attached documents and images, in the spirit of the architecture-map-query pattern Jeffrey already built for Claude Code's handling of his Excel VBA add-in (a pre-built map Claude queries instead of re-reading raw files each time). This is a v2+ direction, not built in the v1 MVP.
 
**PARA mapping:** Roles = PARA's Areas (ongoing responsibilities). Projects = PARA's Projects (dated, with an ending). Both filter one shared task view — similar to how Jeffrey's Notion Work Tasks database used different filtered views rather than separate databases. Custom filter options beyond Roles/Projects are deferred to v2.
 
**TELOS connection:** This app is the intended implementation layer for Jeffrey's G3/S2 goal (the Top 3 daily ritual), same relationship the original Notion build had to that goal.

**Notion build's Role/Project self-relation history:** the evidence base behind Phase 5's checklist-over-relation decision for `tasks.subtasks`. In the Notion build, subtask usage under Roles/Projects was consistently shallow — one level deep, functionally just a checkbox list, never a deep or multi-level relational structure in practice. The "EQC AppSheet App" umbrella-project is the clearest precedent: a project that itself contained many sub-efforts, but they were tracked as a flat checklist rather than as their own linked records. This is the real-usage evidence that justified `tasks.subtasks` as a lightweight `jsonb` array instead of a relational parent-child table — future phases should cite this note rather than re-deriving the decision from scratch.
 
## Notes
- Design preference: must support switching between light and dark mode; subtle blue and green as the color palette.
- Cost target: roughly $0–25/month for the full stack (Supabase, Vercel, Claude API). CodeRabbit is free while the repo is public; Jeffrey has accepted the repo being public during development and will switch to private once a working model exists, at which point the CodeRabbit cost/keep decision needs to be revisited.
- Validation approach: manual click-through testing + automated tests for edge cases, CodeRabbit for code-level PR review, llm-council skill for app-level verification/optimization/ease-of-use passes.
- Claude Design (Anthropic Labs' prompt-to-prototype tool) is worth using to mock up screens before Claude Code builds them, given its handoff bundle integration with Claude Code.