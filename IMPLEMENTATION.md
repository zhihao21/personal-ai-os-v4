# Emotional Aftereffect implementation

Run with Node.js 22 or later: `npm start`, then open http://127.0.0.1:4310. No installation or paid service is needed. Run `npm test` for core tests.

The original repository contained only README.md and .gitignore; both are preserved. The application uses dependency-free Node HTTP, plain browser modules, SVG charts and a versioned JSON store. Eight unnamed modules are intentionally placeholders pending the original specification.

## Scoring and state

Four provisional self-reported factors (distress, functional impact, persistence burden, insufficient support) each range 0–6. Sum is 0–24; >=21 prompts review. This heuristic is not a validated clinical scale. Positive peaks do not automatically imply risk. Only explicitly active, already-started events contribute to current risk. Closed events retain their original score and appear only as history. No score alone declares an emergency. No active records means unknown/no data, not zero risk.

Delayed impact uses explicitly recorded mood (-10..10), timestamps and hours since peak. When at least two followups have occurred, `observedMoodDelta` is the latest observed mood minus the first observed mood; otherwise it is null. Peak intensity and daily journal scores are never substituted for an observation baseline. This measured change does not establish causation, diagnose, or predict a future effect. Followups can be recorded for closed events without reopening them. Reopening requires an explicit action.

## Data and migration

`DATA_DIR` optionally selects storage outside the repository; default `data/` is private and ignored. `PORT` defaults to 4310. The server binds loopback only, rejects cross-origin writes, backs up before changes and atomically replaces validated data. Conflicting import IDs fail without overwriting records. Edits require the exact previous record to prevent stale overwrites. Preserve backup files until migration is verified.

Use full JSON export as the canonical portable record: schemaVersion=1, events with stable id, title, valence, peakAt (ISO timestamp), intensity, status, four riskFactors, followups [{at,mood}]. Unknown metadata, including source system/page IDs and original properties, survives JSON imports/exports. Do not publish personal exports to this public repository.

Obsidian: `node tools/export-vault.mjs export.json "YOUR_VAULT_PATH"` writes a content-addressed snapshot folder containing JSON plus Markdown. Existing notes are never changed. This is a local export bridge, not bidirectional synchronization; no vault path is hard-coded.

Notion remains untouched. Native live Notion sync is not implemented: property mappings, source identifiers and the authoritative original schema are unavailable. Import normalized exports only after retaining raw Notion exports and checking page IDs, row counts, relations, attachments and timestamps. Never infer or delete missing source records.

Year-end migration: export raw Notion data including attachments; export canonical JSON; export an Obsidian snapshot; retain originals and backups; compare ID sets/counts and hashes; test restore into a fresh DATA_DIR; verify representative relations and attachments manually before changing authority. Do not delete or disable Notion until verification is complete. Relation/attachment reconciliation is a manual requirement in this iteration.

## Verification and limitations

Core tests cover closed 21/24, active 24/24, both emotion directions, delayed timing, future observations, validation, metadata retention and conflict handling. Synthetic demo data is opt-in and is never persisted. Real personal records are not seeded.

No original module specification, vault location, Notion schema, or year-end acceptance criteria was available in the referenced conversation. The interface labels and provisional scoring require user review. This first iteration does not include authentication for shared hosting, automatic inference, clinical triage, real-time Notion sync, or automated migration of attachments.

## QA follow-up (2026-10-16)

Real integrated-browser screenshots were inspected at 370px and approximately 357px. A 1280px DOM snapshot showed the desktop sidebar and layout, but screenshot capture reverted to the host narrow viewport; full desktop visual QA remains pending. The mobile chart previously scaled 800-unit SVG labels down to unreadable text; it now uses panel width and redraws on resize. Stat spacing, flex sizing, focus outlines and the keyboard-accessible file picker were improved. Demo mode disables all write controls; a failed return-to-local request retains demo protection.

Browser interactions verified: opt-in synthetic positive 8 / negative 9 peaks; historical 21/24 separate from current 1/24; creating a synthetic active 24/24 event; closing it; adding a mood -3 followup 24 hours after its peak without reopening it; reload persistence. No horizontal page overflow at tested widths. QA data and screenshots were kept outside the repository. Eight automated tests pass, including snapshot roundtrip and corruption detection. Notion preparation and measurable year-end gates are in [INTEGRATIONS.md](INTEGRATIONS.md).
