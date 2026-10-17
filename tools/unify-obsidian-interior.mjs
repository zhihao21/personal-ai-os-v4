import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {join} from 'node:path';

const vault = process.argv[2];
if (!vault) throw new Error('Pass the backed-up Obsidian vault path.');
const root = 'Personal AI OS V4 Prototype';
const backgroundHook = `\`\`\`dataviewjs
const file = dv.app.vault.getAbstractFileByPath(${JSON.stringify(root + '/Assets/the-unseen-evening.png')});
const view = dv.container.closest('.markdown-preview-view.the-unseen-module');
if (file && view) view.style.setProperty('--unseen-background-image', 'url("' + dv.app.vault.getResourcePath(file) + '")');
dv.container.closest('.block-language-dataviewjs')?.classList.add('unseen-background-hook');
\`\`\``;
const note = (title, summary, actions, body) => `---\ncssclasses:\n  - the-unseen-module\n---\n${backgroundHook}\n\n# ${title}\n\n${summary}\n\n${actions}\n\n${body.trim()}\n`;
const block = source => `\`\`\`dataviewjs\n${source.trim()}\n\`\`\``;
const count = (items) => block(`
const root = ${JSON.stringify(root + '/Records')};
const folders = ${JSON.stringify(items)};
const out = dv.el('div', '', {cls:'unseen-metrics'});
for (const [label, folder, field, value] of folders) {
  const path = root + '/' + folder;
  const directory = dv.app.vault.getAbstractFileByPath(path);
  const files = dv.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(path + '/'));
  const pages = directory ? dv.pages(JSON.stringify(path)).array() : [];
  const number = !directory || (files.length && !pages.length) ? '資料未就緒' :
    field === '__scored__' ? pages.filter(p => p.mood != null && p.state != null).length :
    field ? pages.filter(p => String(p[field] ?? '') === value).length : pages.length;
  const item = dv.el('div', '', {container:out,cls:'unseen-metric'});
  dv.el('strong', String(number), {container:item});
  dv.el('span', label, {container:item});
}`);
const filteredCount = (folder, label, filter) => block(`
const path = ${JSON.stringify(root + '/Records/' + folder)};
const directory = dv.app.vault.getAbstractFileByPath(path);
const files = dv.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(path + '/'));
const pages = directory ? dv.pages(JSON.stringify(path)).array() : [];
const value = !directory || (files.length && !pages.length) ? '資料未就緒' : pages.filter(p => ${filter}).length;
const row = dv.el('div', '', {cls:'unseen-metrics'});
const item = dv.el('div', '', {container:row,cls:'unseen-metric'});
dv.el('strong', String(value), {container:item});
dv.el('span', ${JSON.stringify(label)}, {container:item});`);
const table = ({folder, headers, filter='true', sort='0', cells, empty, limit=6}) => block(`
const path = ${JSON.stringify(root + '/Records/' + folder)};
const directory = dv.app.vault.getAbstractFileByPath(path);
const files = dv.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(path + '/'));
const pages = directory ? dv.pages(JSON.stringify(path)).array() : [];
if (!directory) dv.paragraph('⚠ 資料來源不存在，請檢查紀錄資料夾。');
else if (files.length && !pages.length) dv.paragraph('⚠ 紀錄存在，但 Dataview 尚未建立索引。');
else {
  const rows = pages.filter(p => ${filter}).sort((a,b) => ${sort}).slice(0,${limit});
  if (rows.length) dv.table(${JSON.stringify(headers)}, rows.map(p => ${cells}));
  else dv.paragraph(${JSON.stringify(empty)});
}`);
const journal = table({folder:'Journal',headers:['日期','心情','狀態'],sort:'String(b.date ?? b.file.name).localeCompare(String(a.date ?? a.file.name))',cells:'[p.file.link,p.mood ?? "—",p.state ?? "—"]',empty:'尚無日誌紀錄。'});
const tasks = table({folder:'Tasks',headers:['任務','期限','狀態'],filter:'p.status !== "done"',sort:'String(a.due ?? "9999").localeCompare(String(b.due ?? "9999"))',cells:'[p.file.link,p.due ?? "—",p.status ?? "—"]',empty:'目前沒有未完成任務。'});
const schedule = table({folder:'Schedule',headers:['安排','日期'],filter:'String(p.starts_at ?? "").slice(0,10) >= new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())',sort:'String(a.starts_at ?? "").localeCompare(String(b.starts_at ?? ""))',cells:'[p.file.link,p.starts_at ?? "—"]',empty:'目前沒有後續已記錄行程。'});
const risks = table({folder:'Risks',headers:['事件','方向','分級'],filter:'p.lifecycle === "current"',sort:'String(b.occurred_at ?? "").localeCompare(String(a.occurred_at ?? ""))',cells:'[p.file.link,p.direction ?? "—",p.severity ?? "—"]',empty:'目前沒有追蹤中的風險紀錄。'});
const academic = table({folder:'Academic',headers:['學習紀錄'],sort:'String(b.file.name).localeCompare(String(a.file.name))',cells:'[p.file.link]',empty:'尚無學習紀錄。',limit:8});
const projects = table({folder:'Projects',headers:['專案'],sort:'String(b.file.name).localeCompare(String(a.file.name))',cells:'[p.file.link]',empty:'尚無專案紀錄。'});
const shared = '[[The Unseen|首頁]] · [[每日總覽|總覽]] · [[生活日誌|日誌]] · [[生活風險|風險]] · [[任務與行程|任務]] · [[視覺分析|趨勢]] · [[生命關聯圖|關聯]]';
const pages = {
  '每日總覽.md':note('每日總覽','工作、學習與生活的當前狀態。',`${shared} · [填寫今日日誌](obsidian://daily?vault=${encodeURIComponent(vault.split(/[\\/]/).filter(Boolean).at(-1))})`,`
## 即時概況
${count([['未完成任務','Tasks','status','open'],['學習紀錄','Academic'],['日誌','Journal'],['追蹤中事件','Risks','lifecycle','current']])}
## 今日重點
${tasks}
## 後續行程
${schedule}
> [!note]- 更多分析
> [[視覺分析|查看生活趨勢]] · [[生活風險|查看風險分析]] · [[生命關聯圖|查看關聯]]`),
  '生活管理.md':note('生活管理','查看最近生活狀態、日誌、追蹤事件與待辦。',`${shared} · [[視覺分析|趨勢]]`,`
## 當前狀態
${count([['日誌','Journal'],['有分數的日誌','Journal','__scored__'],['追蹤中事件','Risks','lifecycle','current'],['未完成任務','Tasks','status','open']])}
![[Assets/mood-trend.svg|900]]
## 最近日誌
${journal}
## 目前追蹤
${risks}
## 待辦與後續
${tasks}
> [!note]- 個人回顧與詳細觀察
> [[生活日誌|開啟日誌]] · [[生活風險|開啟風險分析]] · [[歷史資料|查閱歷史紀錄]]`),
  '生活日誌.md':note('生活日誌','記錄每日心情、狀態與重要經歷；私密敘事留在各篇日誌中。',`${shared} · [開啟／填寫今日日誌](obsidian://daily?vault=${encodeURIComponent(vault.split(/[\\/]/).filter(Boolean).at(-1))})`,`
## 日誌概況
${count([['日誌','Journal'],['追蹤中事件','Risks','lifecycle','current']])}
## 最近日誌
${journal}
## 心情與每日狀態
![[Assets/mood-trend.svg|900]]
> [!note]- 待追蹤事項
> ![[Views/Journal.base#Followups]]`),
  '生活風險.md':note('生活風險分析','區分目前追蹤與已結束的歷史事件；判斷依據保留在原始紀錄。',`${shared} · [[生活日誌|查看來源日誌]]`,`
## 風險概況
${count([['追蹤中','Risks','lifecycle','current'],['歷史已結束','Risks','lifecycle','closed'],['觀察紀錄','Observations']])}
## 目前追蹤
${risks}
![[Assets/risk-summary.svg|900]]
> [!warning]- 歷史事件與詳細分析
> ![[Views/Risks.base#Historical]]
> [!note]- 情緒後效與觀察
> ![[Views/Risks.base#Positive and negative]]
> ![[Views/Observations.base#Observed]]`),
  '任務與行程.md':note('任務與行程','先看未完成事項，再看已記錄的後續安排。',`${shared} · [[專案脈絡|專案]]`,`
## 執行概況
${count([['未完成任務','Tasks','status','open'],['任務紀錄','Tasks'],['行程紀錄','Schedule'],['專案','Projects']])}
## 未完成任務
${tasks}
## 後續行程
${schedule}
> [!note]- 完整任務與資源
> ![[Views/Tasks.base#Open]]
> [[Views/Resources.base|開啟資源清單]]`),
  '視覺分析.md':note('視覺分析','從已記錄資料查看生活狀態、任務與風險趨勢。',`${shared} · [[生活風險|風險紀錄]]`,`
## 資料概況
${count([['日誌','Journal'],['任務紀錄','Tasks'],['風險事件','Risks']])}
## 心情與每日狀態
![[Assets/mood-trend.svg|900]]
## 任務與生活風險
![[Assets/activity.svg|900]]
![[Assets/risk-summary.svg|900]]
> [!note]- 更多紀錄分布
> ![[Assets/calendar.svg|900]]
> [[歷史資料|查看來源紀錄]]`),
  '生命關聯圖.md':note('生命關聯圖','由日誌、事件、任務與學習紀錄探索個人脈絡。',`${shared} · [[Private AI assistant/Personal AI OS Architecture.canvas|開啟 Canvas]]`,`
## 關聯概況
${count([['日誌','Journal'],['風險事件','Risks'],['觀察紀錄','Observations'],['學習紀錄','Academic']])}
## 可追溯的紀錄
${risks}
> [!note]- 探索更多關係
> [[Private AI assistant/Personal AI OS Architecture.canvas|開啟 Canvas]] · [[歷史資料|瀏覽所有歷史紀錄]]`),
  '學習脈絡.md':note('學習中心','最近的學習紀錄與相關專案。',`${shared} · [[生命關聯圖|關聯圖]]`,`
## 學習概況
${count([['學習紀錄','Academic'],['專案','Projects']])}
## 最近紀錄
${academic}
> [!note]- 全部學習紀錄
> ![[Views/Academic.base#All]]`),
  '專案脈絡.md':note('專案管理','查看專案、待辦與可用資源。',`${shared} · [[任務與行程|任務與行程]]`,`
## 專案概況
${count([['專案','Projects'],['未完成任務','Tasks','status','open'],['資源','Resources']])}
## 專案
${projects}
## 待辦
${tasks}
> [!note]- 資源清單
> ![[Views/Resources.base#All]]`),
  '財務中心.md':note('財務中心','集中查看已保存的財務相關紀錄。',`${shared} · [[歷史資料|歷史資料]]`,`
## 紀錄概況
${filteredCount('Structure','財務相關紀錄','String(p.file.name).includes("財務")')}
## 相關紀錄
${table({folder:'Structure',headers:['財務紀錄'],filter:'String(p.file.name).includes("財務")',cells:'[p.file.link]',empty:'目前沒有其他財務紀錄。'})}
> [!note]- 詳細紀錄
> [[Records/Structure/財務|開啟既有財務紀錄]]`),
  '健康與健身.md':note('健康與健身','查看已保存的健康紀錄與相關待辦。',`${shared} · [[歷史資料|歷史資料]]`,`
## 待辦概況
${filteredCount('Tasks','健康相關待辦','p.status !== "done" && /疫苗|健康|健身|運動/.test(String(p.file.name))')}
## 相關待辦
${table({folder:'Tasks',headers:['任務','期限'],filter:'p.status !== "done" && /疫苗|健康|健身|運動/.test(String(p.file.name))',cells:'[p.file.link,p.due ?? "—"]',empty:'目前沒有健康相關待辦。'})}
> [!note]- 詳細紀錄
> [[Records/Structure/健康健身|開啟既有健康紀錄]]`),
  '目標與規劃.md':note('目標與規劃','從現有專案與任務整理下一步。',`${shared} · [[生命關聯圖|生命關聯圖]]`,`
## 執行概況
${count([['專案','Projects'],['未完成任務','Tasks','status','open']])}
## 目前專案
${projects}
## 下一步
${tasks}
> [!note]- 關聯圖
> [[Private AI assistant/Personal AI OS Architecture.canvas|開啟 Canvas]]`),
};

const rootPath = join(vault, root);
if (process.argv.includes('--background-only')) {
  let updated = 0;
  for (const name of Object.keys(pages)) {
    const file = join(rootPath, name);
    const existing = await readFile(file, 'utf8');
    if (existing.includes("view.style.setProperty('--unseen-background-image'")) continue;
    const frontmatter = /^---\r?\n[\s\S]*?\r?\n---\r?\n/.exec(existing)?.[0];
    if (!frontmatter || !frontmatter.includes('the-unseen-module')) throw new Error(`Not a module page: ${name}`);
    await writeFile(file, frontmatter + backgroundHook + '\n\n' + existing.slice(frontmatter.length), 'utf8');
    updated++;
  }
  console.log(JSON.stringify({modulePages:Object.keys(pages).length,updated}));
  process.exit(0);
}
for (const [name, content] of Object.entries(pages)) {
  await writeFile(join(rootPath, name), content, 'utf8');
}
const homePath = join(rootPath, 'The Unseen.md');
let home = await readFile(homePath, 'utf8');
home = home.replace('[[The Unseen#今天|每日總覽]]','[[每日總覽|每日總覽]]')
  .replace('[[Private AI assistant/Personal AI OS Architecture.canvas|生命關聯圖]]','[[生命關聯圖|生命關聯圖]]')
  .replace('[[Records/Structure/財務|財務]]','[[財務中心|財務]]')
  .replace('[[Records/Structure/健康健身|健康]]','[[健康與健身|健康]]')
  .replace('[[Private AI assistant/Personal AI OS Architecture.canvas|目標與規劃]]','[[目標與規劃|目標與規劃]]');
home = home.replace('> [[學習脈絡|學習]]', '> [[生活管理|生活管理]] · [[學習脈絡|學習]]');
await writeFile(homePath, home, 'utf8');

const configPath = join(vault,'.obsidian','plugins','hearth','data.json');
const config = JSON.parse(await readFile(configPath,'utf8'));
const dashboard = config.dashboards?.find(d => d.name === 'The Unseen');
if (!dashboard || dashboard.cards?.length !== 13) throw new Error('Expected 13-card Hearth dashboard');
const byId = new Map(dashboard.cards.map(c => [c.id,c]));
const targets = ['任務與行程.md','學習脈絡.md','生活管理.md'].map(name => `${root}/${name}`);
const domains = byId.get('unseen-domains');
if (domains?.kind !== 'dataview' || !domains.dataview?.query) throw new Error('Expected existing overview Dataview card');
const previous = domains.overviewTargets;
if (!Array.isArray(previous) || previous.length !== 3) throw new Error('Expected three domain targets');
let query = domains.dataview.query;
for (let i=0;i<3;i++) query = query.replaceAll(JSON.stringify(previous[i]),JSON.stringify(targets[i]));
domains.overviewTargets = targets;
domains.dataview.query = query;
const links = byId.get('unseen-modules')?.links;
if (!Array.isArray(links) || links.length !== 9) throw new Error('Expected nine Hearth module links');
const replacements = {overview:'每日總覽.md',finance:'財務中心.md',health:'健康與健身.md',goals:'目標與規劃.md'};
for (const link of links) if (replacements[link.id]) link.target=`${root}/${replacements[link.id]}`;
await writeFile(configPath,JSON.stringify(config,null,2)+'\n','utf8');

const appPath = join(vault,'.obsidian','app.json');
const app = JSON.parse(await readFile(appPath,'utf8'));
app.propertiesInDocument = 'hidden';
await writeFile(appPath,JSON.stringify(app,null,2)+'\n','utf8');
const appearancePath = join(vault,'.obsidian','appearance.json');
const appearance = JSON.parse(await readFile(appearancePath,'utf8'));
appearance.enabledCssSnippets ??= [];
if (!appearance.enabledCssSnippets.includes('the-unseen-interior')) appearance.enabledCssSnippets.push('the-unseen-interior');
await writeFile(appearancePath,JSON.stringify(appearance,null,2)+'\n','utf8');
await mkdir(join(vault,'.obsidian','snippets'),{recursive:true});
await writeFile(join(vault,'.obsidian','snippets','the-unseen-interior.css'),await readFile(new URL('../assets/the-unseen-interior.css',import.meta.url),'utf8'),'utf8');
console.log(JSON.stringify({pages:Object.keys(pages).length,hearthCards:dashboard.cards.length,targets}));
