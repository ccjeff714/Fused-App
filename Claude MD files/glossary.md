# glossary.md

Terms, acronyms, and people specific to this project. Claude should use these definitions consistently and never guess at the meaning of an unfamiliar term — ask instead.

## Acronyms and Terms

| Term | Definition |
|------|------------|
| PARA | Projects, Areas, Resources, Archives — personal organization methodology. In this app: Projects = dated PARA Projects, Roles = ongoing PARA Areas. |
| Living Task | The core data model — a single task record holding both context (notes, project/role relation) and execution state (status, execution log), instead of splitting them across two systems. |
| Today's Top 3 | The default session-first recommendation on the Home screen — three tasks, chosen due-date-first with priority-tier as the tiebreaker. Echoes Jeffrey's TELOS Top 3 ritual. |
| Layered Context | The design pattern where a task's rich notes/context are collapsed by default and expand on demand, so quick capture is never slowed down by them. |
| Project Helios | EarthSoft's AI system for unstructured data, acquired from BP. Referenced as the aspirational model for a future indexed second-brain query layer over attached documents/images — a v2+ direction, not a v1 feature. |
| CodeRabbit | AI-powered code review tool that reviews GitHub pull requests automatically. Used here at the code level (bugs, security, cross-file issues); free while the repo is public, paid tier required once it goes private. |
| llm-council (skill) | A Claude Code skill that runs a question or decision through multiple AI advisors for pressure-testing. Used here for app-level verification, optimization, and ease-of-use passes — distinct from CodeRabbit's code-level focus. |
| RLS | Row Level Security — a Postgres/Supabase feature enforcing that each user can only see their own rows. Every table in this app's schema requires an RLS policy from day one. |
| TELOS / G3 / S2 | Jeffrey's personal goal-tracking framework. This app is the implementation layer for goal G3 and its S2 sub-goal (the Top 3 daily ritual). |
| PWA | Progressive Web App — a single web codebase that installs like a native app on phone and desktop. The chosen platform approach for this build, over React Native. |
| Sensitive environment variable (Vercel) | A Vercel env var flag that encrypts a value so it can never be read back via dashboard or CLI after creation — only decrypted during builds/runtime. Only available for Production/Preview (not Development). Reserved for true secrets (e.g. the Claude API key). Not used for the Supabase URL/publishable key, since those are meant to be exposed client-side — RLS, not secrecy, is what protects the data. |
| `profiles` auto-creation trigger | A Postgres trigger (`on_auth_user_created` → `handle_new_user()`) that fires after every insert into `auth.users`, automatically creating a matching row in `public.profiles`. Exists because `tasks`, `projects`, and other tables foreign-key to `profiles(id)` — without this trigger, a new signup would have no profile row for those relations (or for `profiles.settings`, which stores the inactivity threshold) to attach to. Documented in Build_Plan.md under the `profiles` table. |

## Project-Specific Conventions
- Every Supabase table includes a `user_id` column, even in the single-user v1, to avoid a painful retrofit if the app is ever shared.
- No time-estimate field exists anywhere in the schema or UI — a deliberate carryover from the "timer guilt" anti-pattern identified in the prior Notion build.
- Tasks require only a title at capture; due date, area, project/role relation, and notes are all optional and can be filled in later.
- The weekly report export includes a project/job-number field, added specifically to support sharing progress with admin.