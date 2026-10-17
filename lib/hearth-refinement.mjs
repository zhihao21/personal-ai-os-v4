const root = 'Personal AI OS V4 Prototype';
const records = name => `${root}/Records/${name}`;

const overview = `
const root = ${JSON.stringify(root)};
const recordFolder = name => root + "/Records/" + name;
const indexed = name => {
  const folder = recordFolder(name);
  if (!dv.app.vault.getAbstractFileByPath(folder)) return null;
  const files = dv.app.vault.getMarkdownFiles().filter(file => file.path.startsWith(folder + "/"));
  const pages = dv.pages(JSON.stringify(folder)).array();
  return files.length && !pages.length ? null : pages;
};
const tasks = indexed("Tasks"), projects = indexed("Projects");
const academic = indexed("Academic"), journals = indexed("Journal");
const entries = [
  {tone:"work",label:"工作",target:__WORK_TARGET__,
    summary:tasks && projects ? tasks.filter(p => p.status !== "done").length + " 項待辦 · " + projects.length + " 個專案" : "資料來源未就緒"},
  {tone:"study",label:"學習",target:__STUDY_TARGET__,
    summary:academic ? academic.length + " 筆學習紀錄" : "資料來源未就緒"},
  {tone:"life",label:"生活",target:__LIFE_TARGET__,
    summary:journals ? journals.length + " 篇日誌 · " + journals.filter(p => p.mood != null || p.state != null).length + " 篇有分數" : "資料來源未就緒"},
];
const row = dv.el("div", "", {cls:"unseen-overview"});
for (const entry of entries) {
  const item = dv.el("div", "", {container:row,cls:"unseen-overview-item unseen-overview-" + entry.tone});
  dv.el("div", dv.fileLink(entry.target, false, entry.label), {container:item,cls:"unseen-overview-link"});
  dv.el("div", entry.summary, {container:item,cls:"unseen-overview-summary"});
}
`.trim();

function tableQuery({folder,select,sort,headers,cells,empty,filteredEmpty,limit}) {
  const source=records(folder);
  return `
const folder = ${JSON.stringify(source)};
const directory = dv.app.vault.getAbstractFileByPath(folder);
if (!directory) {
  dv.paragraph("⚠ 資料來源不存在，請檢查此卡片的查詢。");
} else {
  const files = dv.app.vault.getMarkdownFiles().filter(file => file.path.startsWith(folder + "/"));
  const all = dv.pages(JSON.stringify(folder)).array();
  if (files.length && !all.length) {
    dv.paragraph("⚠ 紀錄存在，但查詢尚未取得資料；請檢查 Dataview 索引。");
  } else {
    const rows = all.filter(p => ${select}).sort((a,b) => ${sort});
    const shown = ${limit?`rows.slice(0, ${limit})`:'rows'};
    if (shown.length) dv.table(${JSON.stringify(headers)}, shown.map(p => ${cells}));
    else dv.paragraph(all.length ? ${JSON.stringify(filteredEmpty)} : ${JSON.stringify(empty)});
  }
}
`.trim();
}

const dateKey='String(p.starts_at ?? "").slice(0,10)';
const today='new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date())';
const queries={
  focus:tableQuery({folder:'Tasks',limit:6,select:'p.status !== "done"',
    sort:'String(a.due ?? "9999").localeCompare(String(b.due ?? "9999"))',
    headers:['任務','期限','優先'],cells:'[p.file.link,p.due ?? "—",p.priority ?? "—"]',
    empty:'目前沒有任務紀錄',filteredEmpty:'目前沒有未完成任務'}),
  week:tableQuery({folder:'Schedule',select:`${dateKey} >= ${today} && ${dateKey} < new Date(Date.parse(${today} + "T00:00:00Z") + 7*86400000).toISOString().slice(0,10)`,
    sort:'String(a.starts_at ?? "").localeCompare(String(b.starts_at ?? ""))',
    headers:['安排','日期','領域'],cells:'[p.file.link,p.starts_at ?? "—",p.domain ?? "—"]',
    empty:'尚無行程紀錄',filteredEmpty:'本週沒有已記錄行程'}),
  next:tableQuery({folder:'Schedule',limit:4,select:`${dateKey} >= ${today}`,
    sort:'String(a.starts_at ?? "").localeCompare(String(b.starts_at ?? ""))',
    headers:['安排','日期'],cells:'[p.file.link,p.starts_at ?? "—"]',
    empty:'尚無行程紀錄',filteredEmpty:'目前沒有後續已記錄行程'}),
  journal:tableQuery({folder:'Journal',limit:4,select:'true',
    sort:'String(b.date ?? b.file.name).localeCompare(String(a.date ?? a.file.name))',
    headers:['日期','心情','狀態'],cells:'[p.file.link,p.mood ?? "—",p.state ?? "—"]',
    empty:'尚無生活日誌',filteredEmpty:'尚無生活日誌'}),
  risk:tableQuery({folder:'Risks',select:'p.lifecycle === "current"',
    sort:'String(b.occurred_at ?? "").localeCompare(String(a.occurred_at ?? ""))',
    headers:['事件','分級','下一步'],cells:'[p.file.link,p.severity ?? "—",p.next_action ?? "—"]',
    empty:'尚無風險分析紀錄',filteredEmpty:'目前沒有追蹤中的風險紀錄'}),
  aftereffect:tableQuery({folder:'Risks',select:'true',
    sort:'String(b.lifecycle ?? "").localeCompare(String(a.lifecycle ?? "")) || String(b.occurred_at ?? "").localeCompare(String(a.occurred_at ?? ""))',
    headers:['事件','方向','狀態','分級'],cells:'[p.file.link,p.direction ?? "—",p.lifecycle ?? "—",p.severity ?? "—"]',
    empty:'尚無情緒後效紀錄',filteredEmpty:'尚無情緒後效紀錄'}),
};

export function refineHearthDashboard(config) {
  const home=config.dashboards?.find(item=>item.id==='dash-mvawm6fb-2495');
  if(!home||!Array.isArray(home.cards)||home.cards.length!==13)throw Error('Expected existing 13-card The Unseen dashboard');
  const byId=new Map(home.cards.map(item=>[item.id,item]));
  for(const id of ['domains','focus','week','next','journal','risk','aftereffect']){
    if(!byId.has(`unseen-${id}`))throw Error(`Missing Hearth card: ${id}`);
  }
  const domains=byId.get('unseen-domains');
  const targets=domains.links?.map(link=>link.target)??domains.overviewTargets;
  if(!targets||targets.length!==3)throw Error('Expected three existing domain links');
  domains.overviewTargets=targets;
  domains.kind='dataview';
  domains.dataview={language:'js',query:overview
    .replace('__WORK_TARGET__',JSON.stringify(targets[0]))
    .replace('__STUDY_TARGET__',JSON.stringify(targets[1]))
    .replace('__LIFE_TARGET__',JSON.stringify(targets[2]))};
  delete domains.links;
  delete domains.tileSizing;
  domains.title='工作／學習／生活 · 今日概覽';
  for(const [id,query] of Object.entries(queries))byId.get(`unseen-${id}`).dataview={language:'js',query};
  config.cardOpacity=0.64;
  return config;
}
