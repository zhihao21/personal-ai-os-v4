import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

export const prototypeName = 'Personal AI OS V4 Prototype';
const folders = ['Records/Journal', 'Records/Risks', 'Records/Observations', 'Records/Tasks', 'Records/Schedule', 'Templates', 'Views', 'Assets'];
const css = `.personal-ai-os-dashboard.markdown-preview-view,
.personal-ai-os-dashboard.markdown-source-view {--background-primary:#0c0f16;--background-secondary:#151a26;--text-normal:#e9edf5;--text-muted:#a7b0c4;--interactive-accent:#9d87ec;color:#e9edf5;background:#0c0f16}
.personal-ai-os-dashboard .markdown-preview-section {max-width:1200px;margin:auto}
.personal-ai-os-dashboard h1 {font-size:2.7rem;letter-spacing:-.05em;color:#f3efff;margin-bottom:.2em}
.personal-ai-os-dashboard h1 + p {color:#aca0e8;font-size:1.05rem;margin-top:0}
.personal-ai-os-dashboard h2 {font-size:1.25rem;color:#ddd8f7;border-bottom:1px solid #31364a;padding-bottom:.45rem}
.personal-ai-os-dashboard table {width:100%;border-collapse:separate;border-spacing:10px}
.personal-ai-os-dashboard table th,.personal-ai-os-dashboard table td {background:#171b29;border:1px solid #30364a;border-radius:11px;padding:12px;color:#e6e7f0}
.personal-ai-os-dashboard table th:first-child {border-color:#695594;color:#c6b0ff}
.personal-ai-os-dashboard table th:nth-child(2) {border-color:#38668a;color:#8ac4f5}
.personal-ai-os-dashboard table th:nth-child(3) {border-color:#37745e;color:#96dfb6}
.personal-ai-os-dashboard .callout {border-radius:12px;background:#171c29;border:1px solid #30374a}
.personal-ai-os-dashboard .callout[data-callout=todo] {border-color:#705493}
.personal-ai-os-dashboard .callout[data-callout=note] {border-color:#3b637f}
.personal-ai-os-dashboard .callout[data-callout=info] {border-color:#3b806a}
.personal-ai-os-dashboard .internal-embed {border:0}
.personal-ai-os-dashboard img,.personal-ai-os-dashboard .internal-embed img {max-width:100%;height:auto}
@media(max-width:700px){.personal-ai-os-dashboard table,.personal-ai-os-dashboard thead,.personal-ai-os-dashboard tbody,.personal-ai-os-dashboard tr,.personal-ai-os-dashboard th,.personal-ai-os-dashboard td{display:block;width:100%}.personal-ai-os-dashboard table{border-spacing:0}.personal-ai-os-dashboard table td,.personal-ai-os-dashboard table th{margin:.4rem 0}}
`;

const files = {
  'The Unseen.md': `---
cssclasses:
  - personal-ai-os-dashboard
---
# The Unseen
*Understand Yourself. Design Your Future.*

| 💼 工作 | 📘 學習 | 🌿 生活 |
|:---|:---|:---|
| [[任務與行程]] | 保留學習入口 | [[生活日誌]] · [[生活風險]] |

> [!todo] 今日重點
> ![[Views/Tasks.base#Today]]

## 本週行程
![[Views/Schedule.base#This week]]

## 生活狀態
![[Assets/mood-trend.svg|900]]

## 風險摘要
![[Assets/risk-summary.svg|900]]
[[生活風險|查看目前追蹤與歷史紀錄]]

> [!example]- 詳細紀錄
> [[生活日誌]] · [[視覺分析]] · [[任務與行程]]
`,
  '生活日誌.md': `---
cssclasses:
  - personal-ai-os-dashboard
---
# 生活日誌

> [!tip] 每天一筆
> 先在下方查找日期；同日更新原筆記。新的一天使用 [[Templates/每日生活日誌|日誌範本]] 或日期鍵入指令建立，不覆寫既有內容。

![[Views/Journal.base#Recent days]]

## 心情・整體狀態・每日綜合
![[Assets/mood-trend.svg|900]]

> [!note]- 待追蹤與較長的回顧
> ![[Views/Journal.base#Followups]]
`,
  '生活風險.md': `---
cssclasses:
  - personal-ai-os-dashboard
---
# 生活風險

![[Assets/risk-summary.svg|900]]

## 目前追蹤
![[Views/Risks.base#Current]]

> [!warning]- 歷史事件與詳細分析
> ![[Views/Risks.base#Historical]]
> ![[Views/Risks.base#Positive and negative]]

> [!info]- 延後觀察與追蹤
> ![[Views/Observations.base#Observed]]

評分僅供暫定、非臨床回顧；歷史高風險不等於目前危機。未記錄的延後變化保持未知。
`,
  '任務與行程.md': `---
cssclasses:
  - personal-ai-os-dashboard
---
# 任務與行程

## 今日待辦
![[Views/Tasks.base#Today]]

## 所有待辦
![[Views/Tasks.base#Open]]

## 本週行程
![[Views/Schedule.base#This week]]

[[Templates/任務|新增任務範本]] · [[Templates/行程|新增行程範本]]
`,
  '視覺分析.md': `---
cssclasses:
  - personal-ai-os-dashboard
---
# 視覺分析

## 心情與狀態趨勢
![[Assets/mood-trend.svg|900]]

## 生活風險
![[Assets/risk-summary.svg|900]]

## 任務進度
![[Assets/activity.svg|900]]

## 本週日曆
![[Assets/calendar.svg|900]]

> [!note]- 記錄入口
> [[生活日誌]] · [[生活風險]] · [[任務與行程]]
`,
  'Views/Journal.base': `filters:
  and:
    - file.inFolder("Personal AI OS V4 Prototype/Records/Journal")
    - file.ext == "md"
formulas:
  composite: 'if(mood != null && state != null, (mood + state) / 2, null)'
properties:
  file.name:
    displayName: 日期
  mood:
    displayName: 心情
  state:
    displayName: 整體狀態
  formula.composite:
    displayName: 每日綜合
  emotional_tags:
    displayName: 情緒標籤
  followup:
    displayName: 待追蹤
views:
  - type: table
    name: Recent days
    order:
      - file.name
      - mood
      - state
      - formula.composite
      - emotional_tags
  - type: table
    name: Followups
    filters:
      and:
        - 'followup != ""'
    order:
      - file.name
      - followup
`,
  'Views/Risks.base': `filters:
  and:
    - file.inFolder("Personal AI OS V4 Prototype/Records/Risks")
    - file.ext == "md"
properties:
  file.name:
    displayName: 事件
  direction:
    displayName: 方向
  lifecycle:
    displayName: 狀態
  severity:
    displayName: 分級
  domains:
    displayName: 領域
  next_action:
    displayName: 下一步
views:
  - type: table
    name: Current
    filters:
      and:
        - 'lifecycle == "current"'
    order:
      - file.name
      - severity
      - domains
      - next_action
  - type: table
    name: Historical
    filters:
      and:
        - 'lifecycle == "closed"'
    order:
      - file.name
      - severity
      - domains
  - type: table
    name: Positive and negative
    order:
      - file.name
      - direction
      - lifecycle
      - severity
`,
  'Views/Observations.base': `filters:
  and:
    - file.inFolder("Personal AI OS V4 Prototype/Records/Observations")
    - file.ext == "md"
views:
  - type: table
    name: Observed
    order:
      - file.name
      - event_id
      - observed_at
      - original_scale
      - observed_value
`,
  'Views/Tasks.base': `filters:
  and:
    - file.inFolder("Personal AI OS V4 Prototype/Records/Tasks")
    - file.ext == "md"
views:
  - type: table
    name: Today
    filters:
      and:
        - 'due == today()'
        - 'status != "done"'
    order:
      - file.name
      - status
      - priority
  - type: table
    name: Open
    filters:
      and:
        - 'status != "done"'
    order:
      - file.name
      - due
      - priority
`,
  'Views/Schedule.base': `filters:
  and:
    - file.inFolder("Personal AI OS V4 Prototype/Records/Schedule")
    - file.ext == "md"
views:
  - type: table
    name: This week
    filters:
      and:
        - 'starts_at >= today()'
        - 'starts_at < today() + "7d"'
    order:
      - starts_at
      - file.name
      - domain
`,
  'Templates/每日生活日誌.md': `---
record_type: journal
record_id: "journal-{{date:YYYY-MM-DD}}"
date: "{{date:YYYY-MM-DD}}"
mood:
state:
emotional_tags: []
followup: ""
source_platform: obsidian
source_record_id: ""
---
# {{date:YYYY-MM-DD}}｜每日生活日誌

## 今日事件

## 想法與擔憂

## 重要回憶

## 未來計畫

> [!note]- 詳細回顧
>
`,
  'Templates/情緒事件.md': `---
record_type: emotional_event
event_id: ""
occurred_at: ""
direction: ""
lifecycle: current
severity: ""
domains: []
evidence_level: observation
next_action: ""
source_platform: obsidian
source_record_id: ""
---
# 情緒事件

> [!note]- 事實、假設與脈絡
> **已觀察事實**
>
> **尚待驗證**
>
> **保護因素與下一步**
`,
  'Templates/延後觀察.md': `---
record_type: emotional_observation
event_id: ""
observed_at: ""
original_scale: ""
observed_value:
source_platform: obsidian
source_record_id: ""
---
# 延後觀察

> [!note]- 實際觀察
> 請記錄真實觀察時間、原始量尺與脈絡；未觀察到的變化留空。
`,
  'Templates/任務.md': `---
record_type: task
task_id: ""
due: ""
status: open
priority: ""
domain: life
source_platform: obsidian
source_record_id: ""
---
# 任務

## 下一步
`,
  'Templates/行程.md': `---
record_type: schedule
schedule_id: ""
starts_at: ""
ends_at: ""
domain: life
source_platform: obsidian
source_record_id: ""
---
# 行程

## 地點與備註
`
};

export async function installPrototype(vault) {
  const root = path.join(vault, prototypeName);
  for (const folder of folders) await mkdir(path.join(root, folder), {recursive: true});
  const created = [], preserved = [];
  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(root, relative);
    try { await writeFile(target, content, {flag:'wx'}); created.push(relative); }
    catch (error) { if (error.code !== 'EEXIST') throw error; preserved.push(relative); }
  }
  const snippetDir=path.join(vault,'.obsidian','snippets');
  await mkdir(snippetDir,{recursive:true});
  const snippetPath=path.join(snippetDir,'personal-ai-os-v4.css');
  try {await writeFile(snippetPath,css,{flag:'wx'});created.push('../.obsidian/snippets/personal-ai-os-v4.css');}
  catch(error){if(error.code!=='EEXIST')throw error;preserved.push('../.obsidian/snippets/personal-ai-os-v4.css');}
  const appearancePath=path.join(vault,'.obsidian','appearance.json');
  const appearance=JSON.parse(await readFile(appearancePath,'utf8'));
  const enabled=new Set(appearance.enabledCssSnippets??[]);
  if(!enabled.has('personal-ai-os-v4')) {
    enabled.add('personal-ai-os-v4');
    appearance.enabledCssSnippets=[...enabled];
    await writeFile(appearancePath,JSON.stringify(appearance,null,2)+'\n');
  }
  return {root,created,preserved};
}

export function parseFrontmatter(markdown) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  if (!match) return null;
  const result = {};
  for (const line of match[1].split(/\r?\n/)) {
    const part = /^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
    if (!part) continue;
    let value = part[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1,-1);
    else if (/^-?\d+(?:\.\d+)?$/.test(value)) value = Number(value);
    else if (value === '[]') value = [];
    else if (value === '') value = null;
    result[part[1]] = value;
  }
  return result;
}

export async function readRecords(root, folder) {
  const dir=path.join(root,'Records',folder), result=[];
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const content=await readFile(path.join(dir,entry.name),'utf8');
    const data=parseFrontmatter(content);
    if (data) result.push({...data,_file:entry.name});
  }
  return result;
}
