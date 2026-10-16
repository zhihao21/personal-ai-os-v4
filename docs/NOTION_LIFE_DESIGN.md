# Notion-first life workspace proposal

Status: **proposed, not applied**. Prepared 2026-10-16 from user requirements and Notion product documentation. The shared school Notion tab redirected to login; its actual control center, databases, properties, relations, views, templates, permissions, plan, and integrations have **not** been audited in this session. Earlier read-only notes concern another workspace and are not evidence for the school workspace. No Notion data or layout was changed.

## Required presentation and audit

The school Notion Personal AI OS is the required user-facing surface. The local web app is preserved as a secondary development tool; opening it is not an acceptable substitute for any requested dashboard or visual effect. Before writing, sign in to the school workspace and record a private inventory of the existing control-center page, all linked life data sources, property IDs/types, relations, views, templates, sharing permissions, plan, and actual records needed to test behavior. Record whether each requested element already works. Reuse existing pages, data sources, views, and integrations. Do not infer absence from a failed link or a different account.

| Area | Inspect in school workspace | Proposed minimal change if missing |
| --- | --- | --- |
| Control center | Existing page layout, navigation, linked databases, visual hierarchy | Organize the existing page into Today, Trends, Emotional Aftereffect, Tasks/Followups, Plans, and Finance sections; add links and linked views of **existing** sources. |
| Daily journal | Source properties, 22:00 workflow, template, date/time precision, 1–10 mood and overall-state scales, current composite formula | Retain original fields and values. Where needed, add a formula for the arithmetic mean only when both scores exist; otherwise leave composite empty. Show three separate time-series views/charts, each sourced from the journal. |
| Emotional Aftereffect | Existing event/followup sources and relations; valence, peak time, intensity, lifecycle, risk fields | Keep a separate modular source if one already exists. Show positive and negative peak views, delayed observations with real observed and peak timestamps and elapsed time, a historical closed view, and a current active view. Closed 21/24 belongs to history only; risk remains provisional and nonclinical. Do not derive events from daily journal scores. |
| Tasks and plans | Existing task/plan sources, statuses, due dates, relations, templates | Place actionable linked views on the control center: today/overdue, followups, next plans, and a dated calendar or timeline when properties support it. Retain existing task records and relations. |
| Finance | Existing transaction source, account links, amount/currency/date properties, actual record count | Chart actual transactions only if present and permissioned. Otherwise show an explicit “No verified transaction data yet” state inside Notion, with a link to the existing finance source if one exists. Never invent transactions. |

No property, database, view, formula, template, or relation name in this table is asserted to exist. The exact write list must be finalized against the live inventory: target page/data-source ID, current state, property/view to reuse, proposed addition, filter/formula/configuration, affected permissions, and rollback/restore approach. Review this list before any Notion write. Existing content, records, views, and relations must remain intact; no duplicate database should be created solely to obtain a chart.

## Control-center presentation

Proposed reading order on the existing control-center page:

1. Title and compact navigation to the existing daily journal, Emotional Aftereffect, tasks, plans, and finance pages.
2. Today: latest journal entry and quick links to the existing 22:00 questionnaire, due tasks, and followups. Show a clear empty state for missing journal data.
3. Trends: **three distinct labeled mood, overall-state, and arithmetic-composite charts**, with the same daily date axis and preserved 1–10 source scale. A missing score leaves the corresponding point absent. Verify the actual formula against source examples.
4. Emotional Aftereffect: separate positive and negative peak views, delayed-observation view with elapsed time, and visibly separate active/current and closed/historical indicators. Chart or visual markers must link back to source records.
5. Next actions: life tasks and followups with status and due/observed dates; future plans with next milestone. Use existing relations.
6. Finance: verified chart(s) with source and date range, or the honest empty state above.

At desktop and narrow widths, inspect the actual Notion page for readable Traditional Chinese, no clipped charts, useful scroll order, functional navigation, filters, record opening, chart hover/drilldown, and edit permissions. Use synthetic records only in a disposable test source/page approved for that purpose; never insert test rows into the user's life databases.

## Native capability decision

Notion supports linked views of existing data sources, filters, calendar/timeline views, relations and rollups. A linked view can have its own view settings while source property/page edits affect the source. Chart views support line and other charts, hover and drilldown. However, the current Notion documentation says the Free plan permits **one chart** and unlimited charts require a paid plan; dashboard views are Business/Enterprise. The school plan and existing chart count are unverified. Do not promise three new native charts until those are inspected. Use a freeform page with linked views for the control center where native dashboard views are unavailable. If the plan cannot show all required trends natively without payment, propose a small free embedded chart component that renders **inside Notion**, with an explicit data-refresh and privacy design; the standalone website alone does not satisfy this requirement. Verify embedding permissions and interactive behavior in the school workspace before claiming delivery. Do not introduce paid APIs.

Official product references: [charts](https://www.notion.com/help/charts), [dashboard-plan availability](https://www.notion.com/en-gb/help/dashboards), [linked data sources](https://www.notion.com/en-gb/help/data-sources-and-linked-databases), [views and filters](https://www.notion.com/help/views-filters-and-sorts), [relations and rollups](https://www.notion.com/en-gb/help/relations-and-rollups).

## Existing integrations and portability

The 22:00 questionnaire-to-journal workflow and Calendar/Gmail/finance connections require read-only confirmation in the **school** workspace. Prior reports are leads, not current proof. Notion Calendar requires a database date property and distinct permissions; it does not prove Google Calendar or Gmail behavior. Academic modules remain positions/placeholders until material is uploaded. Goodnotes → Google Drive → Obsidian is deferred. Preserve the existing configurable one-way Obsidian export; do not introduce bidirectional sync.

Year-end transfer must cover the complete Notion page hierarchy, databases, data sources, properties, options, views, templates, relations, files/attachments, permissions where transferable, all experimental-period records, stable IDs, original timestamps/metadata, duplicate and conflict handling, and backed-up restoration. Produce independent source/destination inventories, check record and attachment hashes and relation targets, and verify a fresh-account restore before cutover. Notion states that an exported workspace cannot be instantly recreated by reuploading it; CSV relations require separate reconstruction. The Emotional Aftereffect JSON snapshot and offline checker are supporting evidence only. See [integration acceptance gates](../INTEGRATIONS.md). Official references: [backup and export](https://www.notion.com/help/back-up-your-data), [database export limitations](https://www.notion.com/help/category/databases).

## Gate to implementation

Blocked on school Notion read access. Once available, complete the private inventory and exact, reuse-first change list. Show that list for review and obtain write authorization because this task currently authorizes read-only source inspection. Then apply approved changes, inspect the real Notion desktop/narrow presentation and interactions, and record evidence in the development checkpoint. Do not report the design as implemented before those steps.
