# Phase 1 Notion / Obsidian comparison

Updated 2026-10-16. This compares implemented behavior only. The school Notion workspace remains the primary operational source. The Obsidian prototype is isolated in a subfolder of an existing vault; it contains **no imported personal records**, and no synchronization or migration is enabled.

| Criterion | School Notion (verified) | Obsidian prototype (verified) | Open verification |
| --- | --- | --- | --- |
| Daily dashboard | Existing linked schedule, task, mood, and risk views; Work/Study/Life navigation. | The Unseen note with core Bases embeds for today's tasks and the coming seven days, module links, and generated summary SVGs. | Native Obsidian layout and mobile interaction need visual QA. Notion homepage cleanup remains unfinished. |
| Journal entry | Three existing dated records; separate mood, state, and composite native charts; follow-up and plan views. | Date-keyed Markdown template, idempotent journal creation command, Bases table, and chart generator. Actual record count is zero by design. | First scheduled 22:00 Notion upsert remains unverified; no Obsidian personal journal data was copied. |
| Emotional Aftereffect | Current positive medium observation and closed historical 21/24 event in separate native views; observation source empty. | Event and observation templates keep stable IDs, source metadata, original scale, lifecycle, and timestamps; Bases show current/history separately. Records empty by design. | No cross-platform record mapping or synchronization. |
| Charts and progress | Native journal charts and separate current/historical risk counts; actual journal points rendered in browser. | Four local SVGs: mood/state/composite, risk, task progress, and weekly calendar. Empty states rendered and inspected; synthetic tests exercised populated charts. | Obsidian charts update when the local refresh command runs, not automatically on note edits. |
| Daily use | Edit existing records directly in linked Notion views; app need not be open. | Open native Markdown/Bases notes; create notes from templates. A small CLI also prevents duplicate daily journal filenames. | Obsidian templates/Bases should be visually checked in the native app. |
| Offline and ownership | Offline behavior not tested; complete account migration remains a separate project. | Local Markdown, YAML properties, SVG, and Base files; originals in the vault were preserved. | Mobile vault availability and backup/restore are not yet tested. |
| Automation | Enabled local Agent Host 22:00 Asia/Taipei questionnaire; manual dry-run verified read path only. | No automatic note-to-chart refresh or Notion sync. | Verify first real scheduled Notion questionnaire and response. |

The current comparison does **not** establish functional parity. Notion has real life data and native rendered charts; Obsidian has a working isolated interface and record format but intentionally empty life data. Do not infer zero real-world risks from its empty cards.

## Use the Obsidian prototype

1. Set a private `OBSIDIAN_VAULT` environment variable to an existing vault directory. No vault path is stored in the repository.
2. Run `node tools/obsidian-prototype.mjs install`. This creates only missing prototype files, adds a scoped CSS snippet, and enables that snippet without replacing other appearance settings.
3. Open `Personal AI OS V4 Prototype/The Unseen.md` in Obsidian. Core Bases and Templates must be enabled. Existing vault configuration was checked before installation.
4. To create or reopen today's blank journal safely, run `node tools/obsidian-prototype.mjs journal`. It never overwrites an existing same-date note. Alternatively create a date-named note from the provided template after checking that it does not already exist.
5. Run `node tools/obsidian-prototype.mjs refresh` after editing prototype records to regenerate charts. The command rejects duplicate journal dates or event IDs before writing chart files.

Only the isolated `Personal AI OS V4 Prototype` folder and its scoped CSS snippet belong to this prototype. The pre-existing one-way `Personal AI OS Exports` snapshots are separate and unchanged. Do not copy school Notion records into this vault until a reviewed mapping, duplicate policy, and privacy-preserving sync design exist.
