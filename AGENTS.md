# Personal AI OS V4.0 agent instructions

## Mission and priorities

Support self-understanding through the cycle Capture -> Organize -> Analyze -> Identify Risks -> Recommend -> Monitor -> Review. Use evidence-based longitudinal analysis and actionable recommendations. Do not make important personal decisions for the user, diagnose conditions, or turn hypotheses into facts. Communicate with the user primarily in Traditional Chinese; write Codex prompts, repository handoffs, and development instructions in English. Be concise and distinguish delivered behavior from proposals and unverified assumptions.

The university Notion workspace is the primary operational database and in-Notion home for Phase 1. Reuse the existing school control center, data sources, relations, views, charts, templates, and integrations. The owner now also authorizes a custom frontend in the existing repository for visual effects that native Notion cannot reasonably reproduce; it must use configured real sources when available and clearly mark disconnected or synthetic demonstration states. Preserve the native Notion navigation and useful views. Do not delete, overwrite, or duplicate working structures or records.

The owner explicitly authorized non-destructive creation and modification of pages, databases, properties, charts, views, and dashboard layouts in the **university Notion workspace** for Phase 1 Daily Dashboard, Life Journal, and Life Risk Analysis including Emotional Aftereffect. The former read-only development restriction is superseded for this scope. Do not request the same authorization again. The personal Notion account is outside scope. Deleting existing personal records or databases, destructive schema changes, account migration or switching, merging into main, and destructive Git recovery still require separate approval. Verify actual Notion desktop and narrow presentation, Traditional Chinese, charts, navigation, filters, record opening, and interactions before claiming completion. If browser QA is unavailable, use Notion tools for supported implementation and record the limitation. Use native Notion functions where supported; if a free embedded component is needed, it must remain visible and usable within Notion with reviewed privacy and refresh behavior. No paid APIs.

## Phased architecture

Reserve interfaces for all nine modules; implement only the approved phase. Phase 1 has highest priority: (1) Daily Dashboard with calendar, schedules, tasks, priorities and visual indicators; (2) Life Journal with the 22:00 questionnaire, 1-10 mood and overall-state scores, an arithmetic-mean composite only when both scores exist, trends and reliable Notion sync; (3) independent cross-domain Life Risk Analysis with Emotional Aftereffect completed and validated during Phase 1. Preserve missing values and original scales. Do not convert journal scores into signed Emotional Aftereffect observations.

Phase 2 reserves (4) Academic Center, (5) Project Management, and (6) AI Analytics Center. Academic implementation waits for uploaded material. Goodnotes -> Google Drive -> Obsidian is deferred. Phase 3 reserves (7) Financial Center, (8) Health and Fitness, and (9) Goals and Life Planning. Existing life-facing task, plan, and finance structures may be reused in Phase 1; do not fabricate transactions or implement every later module now.

Life Risk Analysis must distinguish observed facts, possible risks, hypotheses, and confirmed outcomes across emotional, relationship, academic, financial, health, and lifestyle domains. Record evidence, context, probability/impact only when supported, confidence, protection, actions, history, and followups. Keep scoring provisional and nonclinical. Emotional Aftereffect is independently modular: positive and negative peaks, real delayed observations and elapsed time, separate closed/historical and active/current indicators. The closed historical calibration case EA-NEG-001 at 21/24 is historical high risk, not a current emergency; do not re-escalate it without new evidence.

Use the existing school Notion workspace for life work. Calendar, Gmail, Drive, GitHub, Codex, Gemini, and Obsidian integrations are conditional on availability and authorization. Verify actual sync/write results and avoid duplicates. The Obsidian export remains configurable and one-way; do not add bidirectional sync without approved design.

An isolated Obsidian life-management prototype now exists for comparison. Keep Notion as the primary operational system and do not modify it while the platform comparison is underway unless the owner gives a newer explicit instruction. Keep Obsidian records as local Markdown/frontmatter with stable identifiers, preserve all pre-existing vault notes, and never copy school Notion personal records or enable cross-platform synchronization without an approved mapping and conflict policy. Generated Obsidian charts are refreshed locally and must show an honest empty state before records exist. See [docs/OBSIDIAN_NOTION_COMPARISON.md](docs/OBSIDIAN_NOTION_COMPARISON.md) for observed parity and limitations.

## Portability and privacy

Portability of the complete school Notion system to a future personal account is mandatory from Phase 1, but do not migrate now. Never hardcode account-specific tokens or page/database/data-source/workspace IDs in application logic. Use external configuration and version-controlled schema/configuration templates. Preserve all experimental-period records, stable identifiers, timestamps, original metadata, page/database structure, views, templates, relations, attachments, duplicate/conflict handling, backups, ID remapping, and verified restoration. Document Notion API/export limitations. Never commit personal records, private mappings, vault contents, exports, tokens, or credentials.

## Recovery workflow

At the start of every Codex session:
1. Read [docs/DEVELOPMENT_STATE.md](docs/DEVELOPMENT_STATE.md), then inspect Git status, recent commits, branch tracking, and Draft PR #1. Reconcile prose with Git and verified behavior; record discrepancies.
2. Resume the first unfinished task. Inspect interrupted partial changes and preserve unrelated user work. Never reset, clean, discard, or merge into main automatically.
3. After each significant completed task and before voluntarily ending, update the checkpoint's completed/pending tasks, blockers, validation evidence, branch/commit information, and exact next action. Stage explicit paths and commit only reviewed, verified work in small logical commits. Push the existing feature branch and update Draft PR #1 when appropriate; keep it draft.
4. Preserve the architecture and existing features. Avoid paid APIs and destructive recovery. Do not assume an interrupted or rate-limited session restarts itself.

No automatic restart is configured or tested. If the user later requests scheduling, configure an available external Agent Host runner for this workspace/branch with a prompt to read the checkpoint and reconcile Git, then test a fresh manual run. A schedule cannot be assumed to coincide with a usage-limit reset.

See [docs/NOTION_LIFE_DESIGN.md](docs/NOTION_LIFE_DESIGN.md) for the school-workspace audit and implementation record; [docs/DEVELOPMENT_STATE.md](docs/DEVELOPMENT_STATE.md) is the current delivery checkpoint.
