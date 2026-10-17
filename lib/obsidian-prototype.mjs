import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

export const prototypeName = 'Personal AI OS V4 Prototype';
const folders = ['Records/Journal', 'Records/Risks', 'Records/Observations', 'Records/Tasks', 'Records/Schedule', 'Templates', 'Views', 'Assets'];
const css = `.personal-ai-os-dashboard.markdown-preview-view,
.personal-ai-os-dashboard.markdown-source-view {--background-primary:#100e0d;--background-secondary:#1b1714;--text-normal:#f1e9df;--text-muted:#b9a99a;--interactive-accent:#d4aa72;background:#100e0d;color:#f1e9df}
.personal-ai-os-dashboard .markdown-preview-section {max-width:1520px;margin:auto;padding:0 24px 4rem}
.personal-ai-os-dashboard h1 {font-family:Georgia,'Noto Serif TC',serif;font-size:clamp(2.4rem,4vw,4.1rem);line-height:1.08;letter-spacing:-.025em;color:#fff3e3;margin:.2rem 0 .4rem;text-shadow:0 2px 18px #000}
.personal-ai-os-dashboard h1 + p {color:#e7caa4;font-size:1rem;letter-spacing:.07em;margin:0 0 1.2rem}
.personal-ai-os-dashboard h2 {font-size:1.13rem;color:#f4e1c7;border-bottom:1px solid #48392b;padding-bottom:.5rem;margin-top:1.5rem}
.personal-ai-os-dashboard a.internal-link {text-decoration:none;color:#efd3ae}
.personal-ai-os-dashboard a.internal-link:hover {color:#fff5e8;text-decoration:underline}
.personal-ai-os-dashboard table {width:100%;table-layout:fixed;border-collapse:separate;border-spacing:9px;margin:1rem -9px}
.personal-ai-os-dashboard table th,.personal-ai-os-dashboard table td {background:linear-gradient(140deg,#29221c,#1b1816 70%);border:1px solid #51402e;border-radius:15px;padding:16px 18px;text-align:left;vertical-align:top;font-weight:600;color:#f1e9df;box-shadow:0 8px 22px #0004}
.personal-ai-os-dashboard table th:first-child,.personal-ai-os-dashboard table td:first-child {border-color:#8a6743}
.personal-ai-os-dashboard table th:nth-child(2),.personal-ai-os-dashboard table td:nth-child(2) {border-color:#665679}
.personal-ai-os-dashboard table th:nth-child(3),.personal-ai-os-dashboard table td:nth-child(3) {border-color:#4a7764}
.personal-ai-os-dashboard table small {display:block;margin-top:6px;color:#b9a99a;font-size:.75rem;font-weight:400}
.personal-ai-os-dashboard .callout {border-radius:15px;background:linear-gradient(145deg,#241e1a,#191715);border:1px solid #4d3b2b;box-shadow:0 8px 24px #0003}
.personal-ai-os-dashboard .callout[data-callout=todo] {border-color:#8a6743}
.personal-ai-os-dashboard .callout[data-callout=note] {border-color:#665679}
.personal-ai-os-dashboard .callout[data-callout=info] {border-color:#4a7764}
.personal-ai-os-dashboard .callout[data-callout=warning] {border-color:#a56e60}
.personal-ai-os-dashboard .internal-embed {border:0}
.personal-ai-os-dashboard img,.personal-ai-os-dashboard .internal-embed img {max-width:100%;height:auto}
.personal-ai-os-dashboard .markdown-preview-section > div:has(.image-embed[src*="the-unseen-evening"]) {height:240px;overflow:hidden;border:1px solid #5a4230;border-radius:18px;margin:18px 0 0;box-shadow:0 16px 36px #0007}
.personal-ai-os-dashboard .image-embed[src*="the-unseen-evening"],.personal-ai-os-dashboard .image-embed[src*="the-unseen-evening"] img {display:block;width:100%;height:240px;object-fit:cover}
.personal-ai-os-dashboard .markdown-preview-section > div:has(.image-embed[src*="the-unseen-evening"]) + div h1 {position:relative;margin:-112px 30px 0}
.personal-ai-os-dashboard .markdown-preview-section > div:has(.image-embed[src*="the-unseen-evening"]) + div + div p {position:relative;margin:2px 32px 54px;color:#fff0d8;text-shadow:0 2px 12px #000}
.personal-ai-os-dashboard .callout[data-callout="daily"] {border-color:#9d754a}
.personal-ai-os-dashboard .callout[data-callout="daily"] .callout-icon {color:#e2b879}
.personal-ai-os-dashboard .callout[data-callout="mood"] {border-color:#6f668d}
.personal-ai-os-dashboard .callout[data-callout="risk"] {border-color:#9a655f}
/* Imported provenance stays in YAML/source mode, away from daily reading panes. */
.metadata-property[data-property-key="original_properties_json"],
.metadata-property[data-property-key="source_record_id"],
.metadata-property[data-property-key="source_data_source_id"],
.metadata-property[data-property-key="source_url"],
.metadata-property[data-property-key="source_last_edited_at"],
.metadata-property[data-property-key="source_platform"] {display:none}
@media(max-width:700px){.personal-ai-os-dashboard .markdown-preview-section{padding:0 12px 3rem}.personal-ai-os-dashboard .markdown-preview-section > div:has(.image-embed[src*="the-unseen-evening"]),.personal-ai-os-dashboard .image-embed[src*="the-unseen-evening"],.personal-ai-os-dashboard .image-embed[src*="the-unseen-evening"] img{height:170px}.personal-ai-os-dashboard .markdown-preview-section > div:has(.image-embed[src*="the-unseen-evening"]) + div h1{font-size:2.3rem;margin:-90px 16px 0}.personal-ai-os-dashboard .markdown-preview-section > div:has(.image-embed[src*="the-unseen-evening"]) + div + div p{margin:2px 18px 44px;font-size:.77rem}.personal-ai-os-dashboard table{table-layout:fixed;border-spacing:5px;margin:.7rem -5px}.personal-ai-os-dashboard table th,.personal-ai-os-dashboard table td{padding:11px 9px;font-size:.86rem}.personal-ai-os-dashboard table small{font-size:.68rem}.personal-ai-os-dashboard .callout{margin:10px 0}}
@media(max-width:400px){.personal-ai-os-dashboard table,.personal-ai-os-dashboard thead,.personal-ai-os-dashboard tbody,.personal-ai-os-dashboard tr{display:block;width:100%;box-sizing:border-box}.personal-ai-os-dashboard table td{display:block;width:100%;box-sizing:border-box;margin:5px 0}}
`;

const files = {
  'The Unseen.md': `---
cssclasses:
  - personal-ai-os-dashboard
---
![[Assets/the-unseen-evening.png|1500]]
# The Unseen
*Understand Yourself. Design Your Future.*

| ☀️ [[The Unseen#今天|每日總覽]]<br><small>本日重點</small> | 📓 [[生活日誌|生活日誌]]<br><small>今日與過往日誌</small> | ◈ [[生活風險|生活風險分析]]<br><small>目前與歷史分開</small> |
|:---|:---|:---|
| ☑️ [[任務與行程|任務與行程]]<br><small>待辦與本週安排</small> | 📈 [[視覺分析|趨勢分析]]<br><small>心情・狀態・進度</small> | ◎ [[Private AI assistant/Personal AI OS Architecture.canvas|生命關聯圖]]<br><small>模組與知識關係</small> |

## 今天

**[✎ 開啟／填寫今日日誌](obsidian://daily?vault={{vault_uri}})** · [[生活日誌|查看過往日誌]]

> [!daily] 今日重點
> ![[Views/Tasks.base#Today]]

## 情緒與生活狀態

> [!mood] 近期趨勢 · [[視覺分析|完整分析]]
> ![[Assets/mood-trend.svg|900]]

## 接下來 · 本週行程

![[Views/Schedule.base#This week]]

> [!risk]- 生活風險 · [[生活風險|查看目前與歷史]]
> ![[Assets/risk-summary.svg|900]]

> [!note]- 更多領域
> [[學習脈絡|學習]] · [[專案脈絡|專案]] · [[Records/Structure/財務|財務]] · [[Records/Structure/健康健身|健康]] · [[Private AI assistant/Personal AI OS Architecture.canvas|目標與規劃]]
>
> [[歷史資料|所有紀錄]]
`,
  '生活日誌.md': `---
cssclasses:
  - personal-ai-os-dashboard
---
# 生活日誌

**[開啟／填寫今日日誌](obsidian://daily?vault={{vault_uri}})**

## 過往日誌
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
# 生活風險分析

![[Assets/risk-summary.svg|900]]

## 目前追蹤
![[Views/Risks.base#Current]]

> [!warning]- 歷史事件
> ![[Views/Risks.base#Historical]]

> [!note]- 情緒事件
> ![[Views/Risks.base#Positive and negative]]

> [!info]- 延後觀察與追蹤
> ![[Views/Observations.base#Observed]]

評分僅供暫定、非臨床回顧；歷史高風險不等於目前危機。
`,
  '任務與行程.md': `---
cssclasses:
  - personal-ai-os-dashboard
---
# 任務與行程

## 今日待辦
![[Views/Tasks.base#Today]]

## 本週行程
![[Views/Schedule.base#This week]]

> [!note]- 其他待辦
> ![[Views/Tasks.base#Open]]
`,
  '視覺分析.md': `---
cssclasses:
  - personal-ai-os-dashboard
---
# 趨勢分析

## 心情・狀態・每日綜合
![[Assets/mood-trend.svg|900]]

## 生活風險
![[Assets/risk-summary.svg|900]]

> [!note]- 更多趨勢
> ![[Assets/activity.svg|900]]
> ![[Assets/calendar.svg|900]]
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
    try { await writeFile(target, content.replaceAll('{{vault_uri}}',encodeURIComponent(path.basename(vault))), {flag:'wx'}); created.push(relative); }
    catch (error) { if (error.code !== 'EEXIST') throw error; preserved.push(relative); }
  }
  const heroTarget=path.join(root,'Assets','the-unseen-evening.png');
  try {
    const heroSource=fileURLToPath(new URL('../assets/the-unseen-evening.png',import.meta.url));
    await writeFile(heroTarget,await readFile(heroSource),{flag:'wx'});
    created.push('Assets/the-unseen-evening.png');
  } catch(error) {
    if(error.code!=='EEXIST') throw error;
    preserved.push('Assets/the-unseen-evening.png');
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
  const dailyNotesPath=path.join(vault,'.obsidian','daily-notes.json');
  const dailyNotes={format:'YYYY-MM-DD',folder:`${prototypeName}/Records/Journal`,template:`${prototypeName}/Templates/每日生活日誌`};
  try {await writeFile(dailyNotesPath,JSON.stringify(dailyNotes,null,2)+'\n',{flag:'wx'});created.push('../.obsidian/daily-notes.json');}
  catch(error){if(error.code!=='EEXIST')throw error;preserved.push('../.obsidian/daily-notes.json');}
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
