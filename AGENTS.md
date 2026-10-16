# Repository recovery workflow

At the start of every new Codex session in this repository:

1. Read [docs/DEVELOPMENT_STATE.md](docs/DEVELOPMENT_STATE.md), then inspect `git status --short --branch`, `git log -5 --oneline`, and the current branch's remote tracking state. Check Draft PR #1 when relevant.
2. Reconcile the checkpoint with Git and actual files. Git and verified behavior take precedence over stale prose. Record any discrepancy in the checkpoint before continuing.
3. Resume the first unfinished task in the checkpoint. If a task was interrupted, inspect the diff and partial files, preserve unrelated user changes, and finish or safely isolate the partial work. Never reset, clean, discard, or merge into main automatically.
4. After each significant completed task, update the checkpoint's completed/pending lists, validation evidence, blockers, branch, last commit, and exact next action. Commit only completed, verified work in small logical commits. Stage explicit paths when unrelated changes exist.
5. Before voluntarily ending a session, update the checkpoint again, including unfinished work and the precise next action. Commit the checkpoint with the work it describes or in a separate small commit when appropriate. Update Draft PR #1 with verified progress when appropriate; keep it draft.
6. Never commit personal records, vault contents, exports, tokens, credentials, or private mapping values. Keep Emotional Aftereffect modular, preserve existing features, use no paid APIs, and label risk scoring provisional and nonclinical.

A rate-limited or interrupted Codex session does not restart itself. Local Agent Host currently reports automation support, but no automation has been configured or tested for this project. To request periodic re-invocation, explicitly configure a Local Agent Host automation targeting this workspace/branch with a prompt to read the checkpoint and reconcile Git before resuming; choose an interval supported by the host and test one manual run. Scheduled runs are not guaranteed to coincide with usage-limit reset or retry until success. Do not report automatic recovery as enabled until configuration and a fresh-run test both succeed.

## Current user priority

Life functionality comes first. Academic functionality waits for uploaded source material. Keep daily journals distinct from Emotional Aftereffect peaks; do not infer missing timestamps, scales, lifecycle, or risk values. Store private schema identifiers/mappings outside this public repository.

## Required presentation surface (2026-10-16 correction)

The school Notion Personal AI OS workspace is the required user-facing presentation surface for **all requested dashboards and visual effects**. Preserve the standalone web app, but pause further standalone UI expansion; it cannot count as delivery of a Notion dashboard. On recovery, first inspect the school Notion control center, databases, properties, relations, views, templates, permissions, plan, and working integrations read-only. Reuse existing structures and records. Do not infer school workspace state from another account, a failed collection URL, prior reports, or local code. Keep school schema identifiers and personal values private.

Prioritize visible life functionality **inside Notion**: designed control center and navigation; separate daily mood, overall-state, and arithmetic-composite 1–10 trends; modular Emotional Aftereffect positive/negative peaks, real delayed observations and elapsed time, and separate active/current versus closed/historical indicators; tasks, followups, plans; finance charts only from actual transactions, otherwise an honest empty state. Verify native chart/dashboard availability against the actual school plan. If native functionality cannot deliver a required visualization, design a free embedded component that remains visible and usable within Notion, with privacy and refresh behavior reviewed. No paid APIs. Keep risk scoring provisional and nonclinical. Academic features and Goodnotes → Google Drive → Obsidian await later user material/direction.

The current task authorizes source inspection only. Prepare an exact, reuse-first proposed write list and obtain authorization before changing Notion pages or records. Verify the real Notion presentation and interactions before marking a feature complete. Preserve complete year-end portability, including page/database structure, views, templates, relations, attachments, IDs, timestamps, metadata, conflict handling, backups, and restore checks. See [docs/NOTION_LIFE_DESIGN.md](docs/NOTION_LIFE_DESIGN.md).
