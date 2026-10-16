# Integration preparation and migration acceptance

## Notion mapping proposal (read-only preparation)

No Notion database was queried or modified. These are proposed properties, not verified existing names. Match actual property IDs and types in a private mapping before importing; do not rename source properties to fit this proposal.

| Canonical field | Proposed Notion property / type | Mapping rule |
| --- | --- | --- |
| id | Native page ID | Preserve stable page ID; never derive from title |
| title | Name / title | Concatenate plain text; retain original rich text in source metadata |
| valence | Direction / select | Explicit value map to positive or negative; reject unmapped options |
| peakAt | Peak time / date | Require time and timezone; date-only values need review |
| intensity | Intensity / number | Required finite 0–10; no default for missing values |
| status | Tracking status / status or select | Explicit active/closed map; no inference from score or age |
| riskFactors[0..3] | Distress, Impact, Persistence, Support deficit / number | Four integers 0–6; missing means unresolved, never zero |
| followups | Followups / relation to separate database | Each child requires event page ID, observed date/time and mood −10..10 |
| source | Original metadata | Retain database/page IDs, raw properties, timestamps, relations and attachment references |

A private mapping should record database ID, property IDs, types, option translations and timezone policy. Block normalization on missing fields, ambiguous relationships or invalid scales. Retain raw exports separately. Relation and attachment references are not the attached bytes. No Notion writer, token, paid API or automatic synchronization is introduced.

## Obsidian configuration

Use `node tools/export-vault.mjs export.json "EXISTING_VAULT_DIRECTORY"`, or set the process-local `OBSIDIAN_VAULT` environment variable and omit the second argument. Explicit argument takes precedence. No actual vault path is committed. Export full JSON from the dashboard first. Test against a disposable vault before selecting a real one.

Snapshots contain canonical JSON and readable Markdown under a SHA-256 directory. Export uses a staging directory before publication; repeat export verifies both files. Existing mismatched/incomplete snapshots fail without overwrite. Older snapshots with different Markdown formatting will fail verification: preserve them and export into a separate directory. Markdown is a view, not a supported import format. JSON retains original metadata. This is one-way export, not live synchronization.

## Proposed year-end account migration gates

Target: all gates passed by 2026-12-31 before changing the authoritative account. These are acceptance criteria, not a claim that migration has occurred.

1. Inventory: 100% of source databases, pages, attachments and relations listed in a private manifest, with export timestamp, source account and SHA-256 hashes. Zero unexplained missing objects.
2. Mapping: 100% of required property IDs/types and select/status values mapped; zero unresolved timezone, missing-score or relation ambiguities.
3. Records: source and destination stable-ID sets match exactly; zero duplicate IDs; 100% of canonical fields and retained source metadata match after JSON roundtrip.
4. Attachments/relations: 100% attachment byte hashes match; every relation target resolves or has an explicitly approved exception. Manually inspect at least 20 representative pages (all if fewer), covering both valences, closed high scores and delayed observations.
5. Behavior: all automated tests pass; browser checks pass at 370px and 1280px; closed 21/24 never contributes to current risk, active 24/24 does, followups do not reopen closed records, future observations are excluded at analysis time.
6. Restore: restore canonical export into a fresh DATA_DIR; exact ID/field equality; repeat import causes zero additions. Produce and verify an Obsidian snapshot without altering existing notes.
7. Recovery: two independently stored verified backups; rehearse restore in under 60 minutes; record timings and checks privately. Preserve old account/data for at least 30 days after cutover.
8. Authority: owner records approval only after zero unresolved blocking discrepancies and seven consecutive days of successful destination checks. Account closure/deletion is a separate future action.

## Remaining limitations

Source Notion schema and account scope are unverified. Attachment transfer and relation reconciliation remain manual. No account migration has been performed. Eight original module placeholders remain placeholders. Risk scoring remains provisional and nonclinical; no automatic emergency determination. Authentication/shared hosting and bidirectional vault synchronization remain out of scope. Charts distinguish direction and lifecycle, but multiple same-direction events can overlap; detailed event lists remain the source for individual values.
