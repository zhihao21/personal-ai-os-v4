# Obsidian plugin audit and Hearth integration — 2026-10-17

## Scope and preservation

Inspected the live `Obsidian Vault` configuration: community and core plugin lists, every directory under `.obsidian/plugins`, each manifest and available `data.json`, the installed theme and snippet, Daily Notes settings, existing Bases, dashboard notes, and representative task, schedule, journal, and risk records. The audit found **14 installed community plugins**: 10 enabled after this change and 4 disabled. The 86 historical imports were not migrated or edited.

Before editing, made two private backups outside Git: `Documents/Personal AI OS Backups/Obsidian config pre-Hearth 2026-10-17 015803` (57/57 files, matching SHA-256) and `Documents/Personal AI OS Backups/Obsidian Vault pre-Hearth 2026-10-17 015835` (184/184 files, matching SHA-256). The live journal folder also contains a newer empty 2026-10-17 note. Backups and vault data remain outside this repository.

## Installed community plugins

The mobile column reflects `isDesktopOnly: false` in all manifests. It is **potential support**, not device testing. “No config” means no `data.json` was present; plugin defaults may still apply. Enabled state comes from `.obsidian/community-plugins.json`, except Lazy Loader can separately prevent startup.

| Plugin (ID) | Version / state | Function and observed configuration | Personal AI OS role, compatibility and overlap | Mobile |
| --- | --- | --- | --- | --- |
| Advanced URI (`obsidian-advanced-uri`) | 2.2.0 / enabled | Deep links and command URIs; no saved config. | Optional navigation automation; core Obsidian links and Daily Notes URI already cover home navigation. | Manifest yes; untested |
| Templater (`templater-obsidian`) | 2.26.0 / enabled | Dynamic templates; no saved config. | Available for future journal prompts. Existing journal template and manual writer do not depend on it. Overlaps core Templates. | Manifest yes; untested |
| Dataview (`dataview`) | 0.5.68 / enabled | Queries Markdown metadata; no saved config. | Selected for live Hearth cards over existing task, schedule, journal, and risk notes. Complements native Bases; both query the same files. | Manifest yes; untested |
| TaskNotes (`tasknotes`) | 4.13.8 / enabled | Task notes, Bases, calendar and task operations. Uses `TaskNotes/Tasks`, `task` tag, status/due/priority mappings, calendar view; API/MCP and Google/Microsoft Calendar integrations off, no iCal feeds. | Keep for its own tasks. The 8 imported `Records/Tasks` notes are not TaskNotes-tagged, so its default Hearth task card would omit them. Its calendar overlaps Day Planner and Hearth schedule. | Manifest yes; mobile calendar not disabled; untested |
| Minimal Theme Settings (`obsidian-minimal-settings`) | 9.0.0 / enabled | Minimal theme options saved, but active theme is Obsidian default. | Currently little effect; preserve owner settings. Overlaps appearance choices in theme/snippet/Hearth. | Manifest yes; untested |
| BRAT (`obsidian42-brat`) | 2.2.0 / enabled | Beta plugin installation/update utility; no saved config. | No dashboard role. Network/update supply-chain surface; retain installed state. | Manifest yes; untested |
| Notebook Navigator (`notebook-navigator`) | 3.4.3 / enabled | Enhanced file/folder navigation; starts in files view, narrow sidebar single pane, mobile scale 1. | Useful secondary navigation. Overlaps core File Explorer, but does not duplicate Hearth's dashboard. | Manifest yes; untested |
| Day Planner (`obsidian-day-planner`) | 0.35.1 / enabled | Timeline planner; Monday first, 3-day range, no external iCal feeds, shows now/next/completed tasks. | Optional detailed planning; overlaps TaskNotes/Hearth calendars. Imported schedule notes are still shown through Dataview/Bases on the home. | Manifest yes; untested |
| Lazy Loader (`lazy-plugins`) | 1.0.24 / enabled | Startup control: most enabled plugins instant; four unused plugins disabled. Hearth was marked disabled here even though installed. | Changed Hearth to `instant` so the newly enabled dashboard can start. It can otherwise silently conflict with community-plugin state. | Manifest yes; single desktop config; untested |
| Hearth (`hearth`) | 3.3.0 / **enabled now** | Custom home with editable dashboard cards, grid/stack layout, local image background, links, daily note, Dataview, note/image/Base embeds, search and optional task/calendar widgets. Prior dashboard was a default 13-card mix plus one empty dashboard. | Selected as The Unseen front page. Existing cards replaced with 13 cards using existing records/assets. Local background; external calls disabled. Native note `The Unseen.md` remains as portable alternative. | Manifest yes; narrow stacking on at 700 px; device untested |
| Daily Notes Editor (`daily-notes-editor`) | 1.1.0 / disabled | Inline multi-day editing; no saved config. | Overlaps core Daily Notes and journal page. Not needed for the home. | Manifest yes; untested |
| Mononote (`mononote`) | 1.2.2 / disabled | Keeps one note instance/window behavior; no saved config. | Could conflict with Hearth new-tab behavior if enabled; left disabled. | Manifest yes; untested |
| Quick Tagger (`quick-tagger`) | 2.2.4 / disabled | Fast tag entry; no saved config. | No current dashboard requirement; overlaps native tags/Properties. | Manifest yes; untested |
| SlashComplete (`slash-complete`) | 1.0.2 / disabled | Slash completion; no saved config. | Overlaps core command palette and editor actions. | Manifest yes; untested |

Native Bases, Daily Notes, Templates, Graph, Canvas, Properties, Bookmarks, File Recovery and Sync are enabled. Core File Explorer and Search are enabled. The installed `Obsidian Nord` theme is not active. The scoped `personal-ai-os-v4.css` snippet is enabled. Daily Notes uses `YYYY-MM-DD`, `Records/Journal`, and an existing journal template whose path resolves. The core plugin list also has disabled Footnotes, Slash Commands, Zettelkasten prefixer, Random Note, Slides, Audio Recorder, Workspaces, Publish and Web Viewer.

## Hearth capability assessment

The installed 3.3.0 code exposes templates for link launchpads, daily note, task list, schedule, Dataview query, and embeds of note/image/Base/Canvas. The saved configuration confirms a 12-column dashboard, compact layout, narrow stacking, startup/new-tab options, local image background, and mobile action controls. This supports overview cards, navigation, journal access, schedule/task lists, source-backed SVG charts, risk summaries and Emotional Aftereffect records without installing another plugin.

Hearth does not itself calculate the journal composite, independently verify emotional aftereffects, or make the existing SVG charts reactive to note edits. Native Bases and the existing local chart generator retain those jobs. Its TaskNotes widget only reflects TaskNotes-format notes in this setup; the imported task records require Dataview/Bases. The default schedule widget was not adopted for the imported schedule folder for the same reason. No dedicated mood widget was found; the existing source-backed chart is embedded instead. The plugin manifest does not declare special permissions. Code/settings expose optional web search, gallery/background and other external features; `disableExternalCalls` was set true and built-in vault search retained. This is a configuration/privacy review, not a complete security code audit.

## Implemented interface

`tools/configure-hearth.mjs` updates the existing Hearth home (same dashboard ID), enables Hearth and removes its Lazy Loader startup block. It does not modify other plugins or any personal record. The resulting 13 cards are:

1. The Unseen identity and Work / Study / Life links.
2. Native daily-note card for the existing date-keyed journal workflow.
3. Dataview open-task focus from the imported task folder.
4. A seven-day schedule query plus a separate next-events card, so a week without records is not filled with invented events.
5. Recent journal scores, with blank values preserved.
6. Task / Project / Resource links to existing pages and Base.
7. Current Life Risk Analysis query.
8. Emotional Aftereffect query showing current and closed cases distinctly.
9. Existing local mood/state SVG trend.
10. Nine module links to existing pages or reserved structure records.
11. Existing local task-progress and current/historical risk SVGs.

The portable `The Unseen.md` dashboard remains intact and continues to provide native Bases, links, chart and Canvas access. No plugin was installed. The empty second Hearth dashboard and other existing plugin settings were preserved. The enabled 22:00 questionnaire remains separate; no scheduled answered write was inferred.

## Verification and limits

Read-back confirmed Hearth enabled in community plugins, instant in Lazy Loader, the active dashboard ID and 13 cards, existing query folders and 18/18 local link/asset targets, Daily Notes template, and backups. The launched Obsidian process exists, but the available Computer Use surface returned no native apps or windows even after launch. Therefore **rendered desktop interactions and mobile visual checks are unverified**. Dataview query syntax and Hearth card rendering still need in-app inspection; especially the local image background, embedded SVG, links and narrow layout. The generated charts refresh manually. The current seven-day schedule has no source record; the next-events card shows later real records. No personal note or attachment was deleted.
