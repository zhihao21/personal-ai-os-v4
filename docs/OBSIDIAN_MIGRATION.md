# School Notion to Obsidian historical import — 2026-10-16

The owner selected Obsidian as the sole primary operational platform and authorized a non-destructive copy of school Notion history. Notion remains intact as a read-only legacy source. The existing vault and The Unseen dashboard were reused; no second vault or prototype was created. Private vault files, Notion snapshots, the source-ID mapping, manifest, and backup are stored outside Git.

## Verified transfer

| Category | Imported records |
| --- | ---: |
| Daily journals and questionnaires | 3 |
| Emotional Aftereffect events | 2 |
| Delayed observations | 0 |
| Tasks | 8 |
| Schedules | 4 |
| Academic courses, assignments, mistakes, chapters, progress | 57 |
| Projects | 1 |
| Resources | 1 |
| Dimension and area structure | 9 |
| Import/sync history | 1 |
| Finance, health, goals, periodic reviews | 0 |
| **Total** | **86** |

Twenty-four original school data sources were read. Each source's unfiltered default view was queried again to match imported counts; all returned `has_more: false` and the counts matched. Separate archived-row queries returned zero across all 24 sources. Every imported record was fetched as a full page and checked against its source properties. An import rerun added zero notes, skipped all 86 mapped records, and reported zero conflicts. The source-ID manifest and backup remain private. One PDF attachment was downloaded and linked. All 140 relationships to imported records now have Obsidian links; one additional reference points to the legacy Notion Life Risk Analysis parent page and remains as an original source URL.

The three journal records drive the mood, overall-state, and composite trend SVG; eight tasks and four schedules drive activity/calendar SVGs. Two Emotional Aftereffect events drive separate current and historical indicators. The closed historical 21/24 case remains closed/high; the positive October 15 case remains a medium observation without invented delayed results. Source properties and original page body are kept in each note, with sensitive details inside a collapsed callout. Source last-edited times are in frontmatter. Original created timestamps were not exposed by the available Notion fetch results and are **not** reconstructed. Formula results exposed as references are retained as source metadata, not guessed values. The single parent-page relationship is not an imported database record.

## Remaining limits and next checks

- Native Obsidian desktop/mobile Bases, CSS, template, navigation, and collapsed-callout rendering were not visually verified: the app was not exposed to the available computer-use surface. Generated SVG files parsed as XML; the browser's local-file preload failed during this migration session, so browser visual confirmation is also open.
- Chart refresh is a local command after note edits, not an active cross-device automation. There is no bidirectional Notion sync. Verify mobile vault availability and a safe chart refresh method before claiming full daily-use parity.
- The Notion pages that frame the 24 databases are preserved at the source; their interface layout and development text were not copied as personal records. External file links remain in original properties. The only Notion-hosted file reference observed in fetched record bodies was downloaded.
- The private vault backup matched the pre-import vault's 26 files and 17,210 total bytes. A private SHA-256 manifest now verifies all 26 backup files; restoration has not been exercised. The live vault subsequently changed as charts, the dashboard, and Obsidian workspace state updated, so compare a restore against the frozen backup rather than the current vault. Keep the backup and source snapshots until native Obsidian QA and restore testing pass.

Run the import CLI with explicit paths to the existing vault, private snapshots, mapping, manifest, and verified backup. The CLI requires the backup and never overwrites an existing note. Run the review CLI afterward to verify fields, relationships, attachments, counts, and the collapsed historical index. Do not commit any argument paths or outputs containing personal data.
