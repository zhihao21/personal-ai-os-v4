import {todayTimetableQuery, weeklyTimetableQuery} from './hearth-timetable.mjs';
const clone=value=>structuredClone(value);
const root='Personal AI OS V4 Prototype';
const folders={
  journal:root+'/Records/Journal',
  tasks:root+'/Records/Tasks',
  schedule:root+'/Records/Schedule',
  risks:root+'/Records/Risks',
};
const today=`const today = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());`;
const source=(name,body)=>{
  const folder=JSON.stringify(folders[name]);
  return `const folder = ${folder};
const directory = dv.app.vault.getAbstractFileByPath(folder);
const files = dv.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(folder + '/'));
const pages = directory ? dv.pages(JSON.stringify(folder)).array() : [];
if (!directory) dv.paragraph('資料來源尚未建立');
else if (files.length && !pages.length) dv.paragraph('紀錄尚未完成索引');
else { ${body} }`;
};
const journalStatus=source('journal',`${today}
const dated = p => String(p.date ?? p.file.name).slice(0,10);
const current = pages.find(p => dated(p) === today);
const latest = pages.filter(p => p.mood != null || p.state != null)
  .sort((a,b) => dated(b).localeCompare(dated(a)))[0];
const grid = dv.container.createDiv({cls:'unseen-phase-metrics'});
const add=(value,label)=>{const item=grid.createDiv({cls:'unseen-phase-metric'});item.createEl('strong',{text:String(value)});item.createSpan({text:label});};
add(today,'臺北日期');
add(current?.mood == null ? '未記錄' : current.mood+'/10','今日心情');
add(current?.state == null ? '未記錄' : current.state+'/10','今日狀態');
add(current ? '已建立' : '尚未建立','今日日誌');
if (latest && dated(latest) !== today) dv.paragraph('最近有分數的日期：'+dated(latest)+'；心情 '+(latest.mood ?? '未記錄')+'／狀態 '+(latest.state ?? '未記錄')+'（歷史，非今日）');
if (current) dv.paragraph(dv.fileLink(current.file.path,false,'開啟今日日誌'));
`);
const todayTasks=source('tasks',`${today}
const due=p=>String(p.due ?? '').slice(0,10);
const rows=pages.filter(p=>p.status !== 'done' && due(p) === today);
if (rows.length) dv.table(['今日任務','優先'],rows.map(p=>[p.file.link,p.priority ?? '—']));
else dv.paragraph('今天沒有已記錄的未完成任務');
`);
const journalFollowups=source('journal',`${today}
const rows=pages.filter(p=>p.followup && String(p.followup).trim() && String(p.followup).trim() !== '[]')
  .sort((a,b)=>String(b.date ?? '').localeCompare(String(a.date ?? ''))).slice(0,5);
if (rows.length) dv.table(['日誌','後續事項'],rows.map(p=>[p.file.link,String(p.followup).slice(0,100)]));
else dv.paragraph('目前沒有已記錄的日誌後續事項');
`);
const taskStatus=source('tasks',`${today}
const open=pages.filter(p=>p.status !== 'done');
const done=pages.filter(p=>p.status === 'done');
const grid=dv.container.createDiv({cls:'unseen-phase-metrics'});
for(const [value,label] of [[open.length,'待辦'],[done.length,'已完成'],[open.filter(p=>String(p.due ?? '').slice(0,10)===today).length,'今日到期'],[open.filter(p=>String(p.due ?? '').slice(0,10) && String(p.due).slice(0,10)<today).length,'已逾期']]){
 const item=grid.createDiv({cls:'unseen-phase-metric'});item.createEl('strong',{text:String(value)});item.createSpan({text:label});
}
`);
const pendingTasks=source('tasks',`${today}
const rows=pages.filter(p=>p.status !== 'done').sort((a,b)=>String(a.due ?? '9999').localeCompare(String(b.due ?? '9999')));
const when=p=>{const date=String(p.due ?? '').slice(0,10);return !date?'無期限':date<today?'逾期':date===today?'今日':'未來';};
if(rows.length) dv.table(['待辦任務','期限','時間狀態','優先'],rows.map(p=>[p.file.link,p.due ?? '—',when(p),p.priority ?? '—']));
else dv.paragraph('目前沒有未完成任務');
`);
const projectTasks=source('tasks',`
const rows=pages.filter(p=>p.status !== 'done' && (
 p.project || p.project_id || p.projects ||
 p.file.outlinks?.some(link=>String(link.path ?? '').includes('/Records/Projects/'))
));
if(rows.length) dv.table(['專案任務','期限'],rows.map(p=>[p.file.link,p.due ?? '—']));
else dv.paragraph('目前沒有可確認的專案關聯任務；可從任務紀錄查看全部工作。');
`);
const riskStatus=source('risks',`
const active=pages.filter(p=>p.lifecycle === 'current');
const historical=pages.filter(p=>p.lifecycle === 'closed');
const grid=dv.container.createDiv({cls:'unseen-phase-metrics'});
for(const [value,label] of [[active.length,'目前追蹤'],[historical.length,'已結束／歷史'],[pages.filter(p=>p.direction==='positive').length,'正向事件'],[pages.filter(p=>p.direction==='negative').length,'負向事件']]){
 const item=grid.createDiv({cls:'unseen-phase-metric'});item.createEl('strong',{text:String(value)});item.createSpan({text:label});
}
dv.paragraph('風險分級為暫定、非臨床指標；已結束事件不代表目前危機。');
`);
const activeRisks=source('risks',`
const rows=pages.filter(p=>p.lifecycle === 'current');
if(rows.length) dv.table(['追蹤事件','分級','下一步'],rows.map(p=>[dv.fileLink(p.file.path,false,'開啟紀錄'),p.severity ?? '未分級',p.next_action ? '詳見紀錄' : '尚未記錄']));
else dv.paragraph('目前沒有已記錄的追蹤中風險');
`);
const historicalRisks=source('risks',`
const rows=pages.filter(p=>p.lifecycle === 'closed');
if(rows.length) dv.table(['歷史事件','原始分級','歷史評分'],rows.map(p=>[dv.fileLink(p.file.path,false,'開啟歷史紀錄'),p.severity ?? '未分級',p.historical_score != null && p.historical_scale_max != null ? p.historical_score+'/'+p.historical_scale_max : '未記錄']));
else dv.paragraph('沒有已記錄的歷史結案風險');
`);
const aftereffects=source('risks',`
const rows=pages.filter(p=>p.direction === 'positive' || p.direction === 'negative');
if(rows.length) dv.table(['事件','方向','狀態','延遲效果'],rows.map(p=>[
 dv.fileLink(p.file.path,false,'查看事件'),p.direction==='positive'?'正向':'負向',p.lifecycle==='closed'?'歷史結案':p.lifecycle==='current'?'目前追蹤':(p.lifecycle ?? '未分類'),'尚待實際後續觀察'
]));
else dv.paragraph('尚無情緒後效事件紀錄');
const obsFolder = folder.replace('/Risks','/Observations');
const obsFiles = dv.app.vault.getMarkdownFiles().filter(f=>f.path.startsWith(obsFolder+'/'));
const obs = obsFiles.length ? dv.pages(JSON.stringify(obsFolder)).array() : [];
if(obs.length) dv.table(['已記錄的後續觀察','來源事件'],obs.map(p=>[p.file.link,p.event_id ?? p.related_event_id ?? '關聯未確認']));
else dv.paragraph('目前沒有可供確認延遲效果的後續觀察。');
`);
const triggerPatterns=source('risks',`
const rows=pages.filter(p=>p.verified_trigger_pattern || p.confirmed_trigger);
if(rows.length) dv.table(['事件','已驗證模式'],rows.map(p=>[dv.fileLink(p.file.path,false,'查看證據'),p.verified_trigger_pattern ?? p.confirmed_trigger]));
else dv.paragraph('目前沒有足以確認的觸發模式；未觀察到的延遲效果仍屬未知。');
`);
const position=(card,id,title,x,y,w,h)=>({
  ...clone(card),id,title,x,y,w,h,fx:x/12,fw:w/12,fy:y*108,fh:h*108-16,
});

export function buildHearthPhase1Dashboards(settings){
  const home=settings.dashboards?.find(b=>b.name==='The Unseen');
  const journal=settings.dashboards?.find(b=>b.cards?.some(c=>c.id==='journal-metrics'));
  if(!home||!journal)throw Error('Existing Hearth home and approved Life Journal are required');
  const known=['overview','risk','tasks'];
  if(settings.dashboards.some(b=>b.cards?.some(c=>known.some(k=>c.id===k+'-nav')))){
    if(known.every(k=>settings.dashboards.some(b=>b.cards?.some(c=>c.id===k+'-nav'))))return clone(settings);
    throw Error('Partial Phase 1 Hearth installation needs inspection');
  }
  const base=clone(settings);
  const byHome=id=>{const c=home.cards.find(x=>x.id===id);if(!c)throw Error('Missing Hearth card '+id);return c;};
  const byJournal=id=>{const c=journal.cards.find(x=>x.id===id);if(!c)throw Error('Missing journal card '+id);return c;};
  const command={home:1,journal:2,overview:3,risk:4,tasks:5};
  const links=[
    ['home','The Unseen','home'],['overview','每日總覽','layout-dashboard'],
    ['journal','生活日誌','book-heart'],['risk','生活風險','shield-alert'],
    ['tasks','任務與行程','calendar-days'],
  ].map(([key,label,icon])=>({id:'phase-'+key,label,icon,type:'command',target:'hearth:open-dashboard-'+command[key]}));
  const nav=(kind)=>{const c=position(byJournal('journal-nav'),kind+'-nav','快速導覽',0,0,12,2);c.links=clone(links);return c;};
  const data=(sourceId,id,title,x,y,w,h,query)=>{
    const c=position(byHome(sourceId),id,title,x,y,w,h);c.dataview={language:'js',query};return c;
  };
  const copy=(sourceId,id,title,x,y,w,h)=>position(byHome(sourceId),id,title,x,y,w,h);
  const board=(kind,title,icon,cards)=>({
    ...clone(journal),id:'the-unseen-'+kind,name:title,cards,
    header:{...clone(journal.header),title,titleIcon:icon},
    background:clone(home.background),backgroundLayout:home.backgroundLayout,
  });
  const overview=board('overview','每日總覽','layout-dashboard',[
    nav('overview'),
    data('unseen-journal','overview-status','今天 · 日誌狀態',0,2,12,2,journalStatus),
    data('unseen-focus','overview-today-tasks','今日任務',0,4,6,3,todayTasks),
    copy('unseen-next','overview-upcoming','後續行程',6,4,6,3),
    data('unseen-week','overview-classes','今日固定課程',0,7,6,3,todayTimetableQuery),
    data('unseen-journal','overview-followups','日誌後續事項',6,7,6,3,journalFollowups),
  ]);
  const risk=board('risk','生活風險分析','shield-alert',[
    nav('risk'),
    data('unseen-risk','risk-status','目前／歷史 · 概況',0,2,12,2,riskStatus),
    data('unseen-risk','risk-active','目前追蹤 · 非緊急判定',0,4,6,3,activeRisks),
    data('unseen-risk','risk-historical','已結束的歷史高風險',6,4,6,3,historicalRisks),
    data('unseen-aftereffect','risk-aftereffects','情緒後效 · 事件與後續',0,7,6,3,aftereffects),
    data('unseen-aftereffect','risk-patterns','已驗證的觸發模式',6,7,6,3,triggerPatterns),
    copy('unseen-risk-trend','risk-trend','風險趨勢 · 有紀錄時顯示',0,10,12,4),
  ]);
  const tasks=board('tasks','任務與行程','calendar-days',[
    nav('tasks'),
    data('unseen-focus','tasks-status','任務概況',0,2,12,2,taskStatus),
    data('unseen-focus','tasks-today','今日任務',0,4,6,3,todayTasks),
    data('unseen-focus','tasks-pending','未完成／期限狀態',6,4,6,3,pendingTasks),
    copy('unseen-week','tasks-week','本週行程',0,7,6,3),
    data('unseen-week','tasks-classes','每週固定課表',6,7,6,3,weeklyTimetableQuery),
    data('unseen-focus','tasks-projects','專案相關任務',0,10,6,3,projectTasks),
    position(byHome('unseen-operations'),'tasks-views','任務與日程檢視',6,10,6,3),
  ]);
  tasks.cards.at(-1).links=[
    {id:'tasknotes',label:'任務紀錄',icon:'list-checks',type:'note',target:root+'/任務與行程.md'},
    {id:'task-base',label:'任務 Base',icon:'table',type:'note',target:root+'/Views/Tasks.base'},
    {id:'schedule-base',label:'行程 Base',icon:'calendar',type:'note',target:root+'/Views/Schedule.base'},
  ];
  base.dashboards.push(overview,risk,tasks);
  const replace=(cardId,linkId,index)=>{
    const link=base.dashboards[0].cards.find(c=>c.id===cardId)?.links?.find(l=>l.id===linkId);
    if(!link)throw Error('Missing existing Hearth navigation '+linkId);
    link.type='command';link.target='hearth:open-dashboard-'+index;
  };
  replace('unseen-modules','overview',3);
  replace('unseen-modules','life-risk',4);
  replace('unseen-operations','tasks',5);
  const journalLinks=base.dashboards[1].cards.find(c=>c.id==='journal-nav')?.links;
  for(const [id,index] of [['journal-overview',3],['journal-risk',4]]){
    const link=journalLinks?.find(l=>l.id===id);
    if(!link)throw Error('Missing approved journal navigation '+id);
    link.type='command';link.target='hearth:open-dashboard-'+index;
  }
  return base;
}
