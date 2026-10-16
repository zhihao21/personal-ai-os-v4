# Personal AI OS V4.0 agent instructions

## Mission and priorities

Support self-understanding through the cycle Capture -> Organize -> Analyze -> Identify Risks -> Recommend -> Monitor -> Review. Use evidence-based longitudinal analysis and actionable recommendations. Do not make important personal decisions for the user, diagnose conditions, or turn hypotheses into facts. Communicate with the user primarily in Traditional Chinese; write Codex prompts, repository handoffs, and development instructions in English. Be concise and distinguish delivered behavior from proposals and unverified assumptions.

Obsidian is now the sole primary operational platform. Continue in the existing vault and The Unseen dashboard, using portable Markdown/frontmatter, native Bases, templates, relative links, and local charts. The school Notion workspace is a preserved, read-only legacy source for the authorized historical data migration. Stop new Notion feature development; never delete, overwrite, or disconnect the source. The standalone web interface is supplemental and must not replace Obsidian daily use.

The owner explicitly authorized non-destructive copying of all available school Notion history into the existing Obsidian vault. Back up the vault before import; keep snapshots, imported notes, attachments, and the private source-ID manifest outside Git. Import incrementally, preserve all original properties/content and provenance, reject duplicates and conflicts, and verify counts and representative relationships. This authorization supersedes the earlier no-import rule. It does not authorize deleting Notion content, changing the personal Notion account, destructive vault edits, merging into main, or destructive Git recovery. No paid APIs.

## Phased architecture

Reserve interfaces for all nine modules; implement according to the approved phases. Phase 1 has highest priority: (1) Daily Dashboard with calendar, schedules, tasks, priorities and visual indicators; (2) Life Journal with a 22:00 questionnaire, 1-10 mood and overall-state scores, an arithmetic-mean composite only when both scores exist, and local journal persistence; (3) independent cross-domain Life Risk Analysis with Emotional Aftereffect. The existing Notion questionnaire automation is legacy and its first real upsert remains unverified; do not claim an Obsidian automation exists until configured and tested. Preserve missing values and original scales. Do not convert journal scores into signed Emotional Aftereffect observations.

Phase 2 reserves (4) Academic Center, (5) Project Management, and (6) AI Analytics Center. Existing academic history is authorized for lossless migration; new academic analysis waits for uploaded material. Goodnotes -> Google Drive -> Obsidian is deferred. Phase 3 reserves (7) Financial Center, (8) Health and Fitness, and (9) Goals and Life Planning. Historical records in every phase may be imported now; do not fabricate transactions or treat empty sources as zero real-world activity.

Life Risk Analysis must distinguish observed facts, possible risks, hypotheses, and confirmed outcomes across emotional, relationship, academic, financial, health, and lifestyle domains. Record evidence, context, probability/impact only when supported, confidence, protection, actions, history, and followups. Keep scoring provisional and nonclinical. Emotional Aftereffect is independently modular: positive and negative peaks, real delayed observations and elapsed time, separate closed/historical and active/current indicators. The closed historical calibration case EA-NEG-001 at 21/24 is historical high risk, not a current emergency; do not re-escalate it without new evidence.

Use Obsidian for life work. Calendar, Gmail, Drive, GitHub, Codex, and Gemini integrations remain conditional on availability and authorization. Verify actual sync/write results and avoid duplicates. The completed Notion-to-Obsidian import is a one-time, non-destructive copy; do not enable bidirectional synchronization without a reviewed design.

The existing Obsidian prototype is the production foundation. Keep local Markdown/frontmatter with stable identifiers and preserve all pre-existing vault notes. The 2026-10-16 migration copied 86 records from 24 school sources into the existing vault after a full backup; private snapshots and mapping are outside the repository. Generated charts refresh locally and show source-backed data. Native Obsidian desktop/mobile visual QA is still unverified because the app was unavailable to computer-use tools. See [docs/DEVELOPMENT_STATE.md](docs/DEVELOPMENT_STATE.md) for precise counts and limitations.

## Portability and privacy

Obsidian Markdown and relative links are the portable primary format. Never hardcode account-specific tokens or Notion page/database/data-source/workspace IDs in application logic. Keep source mappings and credentials in private external configuration. Preserve all experimental-period records, stable identifiers, source timestamps, original metadata, relations, and attachments wherever available. Document unavailable metadata and Notion API/export limits; keep backups and restoration evidence. Never commit personal records, private mappings, vault contents, exports, tokens, or credentials.

## Recovery workflow

At the start of every Codex session:
1. Read [docs/DEVELOPMENT_STATE.md](docs/DEVELOPMENT_STATE.md), then inspect Git status, recent commits, branch tracking, and Draft PR #1. Reconcile prose with Git and verified behavior; record discrepancies.
2. Resume the first unfinished task. Inspect interrupted partial changes and preserve unrelated user work. Never reset, clean, discard, or merge into main automatically.
3. After each significant completed task and before voluntarily ending, update the checkpoint's completed/pending tasks, blockers, validation evidence, branch/commit information, and exact next action. Stage explicit paths and commit only reviewed, verified work in small logical commits. Push the existing feature branch and update Draft PR #1 when appropriate; keep it draft.
4. Preserve the architecture and existing features. Avoid paid APIs and destructive recovery. Do not assume an interrupted or rate-limited session restarts itself.

No automatic restart is configured or tested. If the user later requests scheduling, configure an available external Agent Host runner for this workspace/branch with a prompt to read the checkpoint and reconcile Git, then test a fresh manual run. A schedule cannot be assumed to coincide with a usage-limit reset.

See [docs/NOTION_LIFE_DESIGN.md](docs/NOTION_LIFE_DESIGN.md) for the school-workspace audit and implementation record; [docs/DEVELOPMENT_STATE.md](docs/DEVELOPMENT_STATE.md) is the current delivery checkpoint.
