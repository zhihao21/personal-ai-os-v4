# Integration preparation and migration acceptance

## Notion mapping proposal (read-only preparation)

The university journal data source and existing chart views were queried read-only. The journal has date, 1-10 mood/state scores, and a composite formula property; it is **not** an Emotional Aftereffect event source. No Notion source was modified. The event/observation properties below remain a proposal, not verified existing names. Match actual property IDs and types in a private mapping before importing; do not rename source properties to fit this proposal.

| Canonical field | Proposed Notion property / type | Mapping rule |
| --- | --- | --- |
| id | Native page ID | Preserve stable page ID; never derive from title |
| title | Name / title | Concatenate plain text; retain original rich text in source metadata |
| valence | Direction / select | Explicit value map to positive or negative; reject unmapped options |
| domains | Risk areas / multi-select | Explicit map to emotional, relationship, academic, financial, health, lifestyle, time, or project; missing stays unclassified |
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

University account and journal source schema are verified read-only; the proposed Emotional Aftereffect source schema, composite formula behavior, Notion write permission, and rendered presentation are unverified. Attachment transfer and relation reconciliation remain manual. No account migration has been performed. Nine roadmap module interfaces remain reserved according to AGENTS.md. Risk scoring remains provisional and nonclinical; no automatic emergency determination. Authentication/shared hosting and bidirectional vault synchronization remain out of scope. Charts distinguish direction and lifecycle, but multiple same-direction events can overlap; detailed event lists remain the source for individual values.
## Offline migration evidence check

`node tools/check-migration.mjs SOURCE_INVENTORY.json DESTINATION_INVENTORY.json CANONICAL_EXPORT.json` reads three private files without changing them or contacting Notion. Keep all three outside the repository. Exit code 0 means the supplied inventories match the canonical export; 1 means a mismatch; 2 means invalid/incomplete evidence. Output contains counts and mismatch categories, not record IDs or personal content. This is one migration gate, not permission to cut over or delete an account.

Both inventories use this format (illustrative hashes only):

```json
{
  "schemaVersion": 1,
  "records": [{"id": "synthetic-page", "sha256": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}],
  "attachments": [{"id": "synthetic-file", "sha256": "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"}],
  "relations": [{"from": "synthetic-page", "to": "synthetic-page"}]
}
```

`records` hashes are SHA-256 of each complete canonical event JSON object with object keys sorted recursively; unknown source metadata is included. The [eventDigest](./lib/migration.mjs) implementation defines the exact algorithm. Attachment hashes must be calculated independently from file bytes on each side. Record IDs, attachment IDs and relation endpoints must be stable and independently inventoried; do not generate both manifests from the same destination export. Use explicit empty arrays only after verifying there are genuinely no attachments or relations. The checker rejects missing arrays, duplicate IDs, malformed hashes and dangling relation endpoints. It cannot prove an inventory is complete or that an attachment hash was actually taken from bytes; the human inventory and sampling gates above remain required.

## Life-first scope and recovery reconciliation

User priority (2026-10-16): life features first; academic work is deferred until source material is uploaded. Do not infer academic tasks from incidental text in life journals.

A fresh session reconciled the old checkpoint with actual Git history: recovery was already committed at ecc9df7; desktop QA was subsequently recorded at d1b632d; migration evidence checking was completed at 5fc0be3. Preserve these completed tasks and inspect live status before resuming.

Read-only Notion access is now available for a life-journal source. Its schema is a daily journal, not the Emotional Aftereffect event schema. Date-only entries must retain their precision. Numeric mood/state values require a confirmed scale; labels must retain their original meaning. Missing peak timestamp, lifecycle, intensity, four risk factors and followup relations block event import. Do not invent these fields or convert journal mood to signed followup mood. Full property IDs are not exposed by the current schema response. Private source identifiers and mapping remain outside the repository. No source records were changed or imported.
