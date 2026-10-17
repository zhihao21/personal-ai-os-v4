const clone = value => structuredClone(value);
const root = 'Personal AI OS V4 Prototype';
const folder = name => `${root}/Records/${name}`;
const place = (card,id,title,x,y,w,h) => ({
  ...clone(card),id,title,x,y,w,h,fx:x/12,fw:w/12,fy:y*108,fh:h*108-16,
});

const metricsQuery = `const root = ${JSON.stringify(root)};
const read = name => {
  const dir = root + '/Records/' + name;
  const files = dv.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(dir + '/'));
  const pages = dv.app.vault.getAbstractFileByPath(dir) ? dv.pages(JSON.stringify(dir)).array() : [];
  return {files,pages};
};
const journal = read('Journal'), tasks = read('Tasks'), risks = read('Risks');
if ([journal,tasks,risks].some(group => group.files.length && !group.pages.length)) {
  dv.paragraph('資料索引暫不可用，請稍後重新整理。');
} else {
  const metrics = [
    ['日誌記錄',journal.pages.length],
    ['有心情與狀態的日誌',journal.pages.filter(p => p.mood != null && p.state != null).length],
    ['待辦任務',tasks.pages.filter(p => p.status !== 'done').length],
    ['已完成任務',tasks.pages.filter(p => p.status === 'done').length],
    ['目前追蹤風險',risks.pages.filter(p => p.lifecycle === 'current').length],
    ['歷史風險',risks.pages.filter(p => p.lifecycle === 'closed').length],
  ];
  const grid = dv.container.createDiv({cls:'unseen-analytics-metrics'});
  for(const [label,value] of metrics){
    const item=grid.createDiv({cls:'unseen-analytics-metric'});
    item.createEl('strong',{text:String(value)});
    item.createSpan({text:label});
  }
}`;

export function buildHearthAnalyticsDashboard(settings) {
  const source = clone(settings);
  const boards = source.dashboards;
  if (!Array.isArray(boards) || boards.length < 5) throw Error('Expected existing Hearth Phase 1 dashboards');
  const existing = boards.find(board => board.id === 'the-unseen-analytics');
  if (existing) {
    if (!['analytics-nav','analytics-metrics','analytics-mood','analytics-tasks','analytics-risk','analytics-recent']
      .every(id => existing.cards.some(card => card.id === id))) throw Error('Analytics dashboard requires manual inspection');
    const positions={
      'analytics-metrics':[0,2,12,2], 'analytics-mood':[0,4,12,4],
      'analytics-tasks':[0,8,6,4], 'analytics-risk':[6,8,6,4],
      'analytics-recent':[0,12,12,4],
    };
    existing.cards=existing.cards.map(card=>positions[card.id]
      ? place(card,card.id,card.title,...positions[card.id]):card);
    return source;
  }
  const home = boards.find(board => board.name === 'The Unseen');
  const journal = boards.find(board => board.cards.some(card => card.id === 'journal-trend'));
  if (!home || !journal) throw Error('Hearth home or approved journal dashboard missing');
  const card = id => {
    const result = [...home.cards,...journal.cards].find(item => item.id === id);
    if (!result) throw Error(`Missing existing Hearth card: ${id}`);
    return result;
  };
  const nav = place(card('journal-nav'),'analytics-nav','快速導覽',0,0,12,2);
  nav.links = [
    ['home','The Unseen','home',1],['overview','每日總覽','layout-dashboard',3],
    ['journal','生活日誌','book-heart',2],['risk','生活風險','shield-alert',4],
    ['tasks','任務與行程','calendar-days',5],['analytics','視覺分析','chart-no-axes-combined',6],
  ].map(([id,label,icon,index])=>({id:`analytics-${id}`,label,icon,type:'command',target:`hearth:open-dashboard-${index}`}));
  const metrics = place(card('journal-metrics'),'analytics-metrics','資料概況',0,2,12,2);
  metrics.dataview = {language:'js',query:metricsQuery};
  const mood = place(card('journal-trend'),'analytics-mood','心情・每日狀態・綜合趨勢',0,4,12,4);
  const tasks = place(card('unseen-progress'),'analytics-tasks','任務進度',0,8,6,4);
  const risk = place(card('unseen-risk-trend'),'analytics-risk','生活風險摘要',6,8,6,4);
  const recent = place(card('journal-recent'),'analytics-recent','最近日誌',0,12,12,4);
  boards.push({
    id:'the-unseen-analytics',name:'視覺分析',cards:[nav,metrics,mood,tasks,risk,recent],
    fitToPage:false,compact:true,showSearch:false,
    header:{showTitle:true,title:'視覺分析',titleIcon:'chart-no-axes-combined',themeColorTarget:'none'},
    background:clone(journal.background),backgroundLayout:journal.backgroundLayout,
  });
  for(const board of boards.slice(0,-1)){
    for(const item of board.cards){
      if(item.id==='unseen-modules'){
        const link=item.links?.find(link=>link.id==='analytics');
        if(link){link.label='視覺分析';link.type='command';link.target='hearth:open-dashboard-6';}
      }
      if(item.id==='journal-nav'){
        const link=item.links?.find(link=>link.id==='journal-analytics');
        if(link){link.type='command';link.target='hearth:open-dashboard-6';}
      }
      if(['overview-nav','risk-nav','tasks-nav'].includes(item.id) && !item.links?.some(link=>link.id==='phase-analytics'))
        item.links.push({id:'phase-analytics',label:'視覺分析',icon:'chart-no-axes-combined',type:'command',target:'hearth:open-dashboard-6'});
    }
  }
  return source;
}
