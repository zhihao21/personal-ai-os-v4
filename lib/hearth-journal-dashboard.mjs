const clone=value=>structuredClone(value);
const place=(card,id,title,x,y,w,h)=>({
  ...clone(card),id,title,x,y,w,h,
  fx:x/12,fw:w/12,fy:y*108,fh:h*108-16,
});

export function buildHearthJournalDashboard(settings){
  const home=settings.dashboards?.find(board=>board.name==='The Unseen');
  const target=settings.dashboards?.[1];
  if(!home||!target||target===home)throw Error('Expected existing Hearth home and second dashboard');
  if(target.cards?.length){
    const expected=['journal-nav','journal-metrics','journal-recent','journal-trend'];
    if(target.name==='生活日誌'&&expected.every(id=>target.cards.some(card=>card.id===id)))return clone(settings);
    throw Error('Second dashboard already contains user cards');
  }
  const byId=id=>{
    const card=home.cards.find(item=>item.id===id);
    if(!card)throw Error(`Missing existing Hearth card: ${id}`);
    return card;
  };
  const root='Personal AI OS V4 Prototype';
  const metricsQuery=`const folder = ${JSON.stringify(root+'/Records/Journal')};
const files = dv.app.vault.getMarkdownFiles().filter(f => f.path.startsWith(folder + '/'));
const pages = dv.pages(JSON.stringify(folder)).array();
if (files.length && !pages.length) dv.paragraph('日誌索引尚未就緒。');
else {
  const sorted = pages.sort((a,b) => String(b.date ?? b.file.name).localeCompare(String(a.date ?? a.file.name)));
  const latest = sorted.find(p => p.mood != null || p.state != null);
  const values = [
    ['日誌', pages.length],
    ['有分數的日誌', pages.filter(p => p.mood != null && p.state != null).length],
    ['最近心情', latest?.mood == null ? '—' : latest.mood + '/10'],
    ['最近狀態', latest?.state == null ? '—' : latest.state + '/10']
  ];
  const grid = dv.container.createDiv({cls:'unseen-journal-metrics'});
  for (const [label,value] of values) {
    const item = grid.createDiv({cls:'unseen-journal-metric'});
    item.createEl('strong',{text:String(value)});
    item.createSpan({text:label});
  }
  if (sorted.length) dv.el('div',dv.fileLink(sorted[0].file.path,false,'開啟最近日誌'),{cls:'unseen-journal-latest'});
}`;
  const nav=place(byId('unseen-modules'),'journal-nav','快速導覽',0,0,12,2);
  nav.links=[
    {id:'journal-home',label:'The Unseen',icon:'home',type:'command',target:'hearth:open-dashboard-1'},
    {id:'journal-overview',label:'每日總覽',icon:'layout-dashboard',type:'note',target:`${root}/每日總覽.md`},
    {id:'journal-records',label:'文字日誌',icon:'book-open',type:'note',target:`${root}/生活日誌.md`},
    {id:'journal-risk',label:'生活風險',icon:'shield-alert',type:'note',target:`${root}/生活風險.md`},
    {id:'journal-analytics',label:'視覺分析',icon:'chart-no-axes-combined',type:'note',target:`${root}/視覺分析.md`},
    {id:'journal-graph',label:'生命關聯圖',icon:'waypoints',type:'note',target:`${root}/生命關聯圖.md`},
  ];
  const metrics=place(byId('unseen-journal'),'journal-metrics','日誌概況',0,2,12,2);
  metrics.dataview={language:'js',query:metricsQuery};
  const recent=place(byId('unseen-journal'),'journal-recent','最近日誌 · 開啟原文',0,4,5,5);
  const chart=place(byId('unseen-mood'),'journal-trend','心情 · 狀態 · 每日綜合趨勢',5,4,7,5);
  return {
    ...settings,
    dashboards:settings.dashboards.map(board=>board===target?{
      ...board,name:'生活日誌',cards:[nav,metrics,recent,chart],fitToPage:false,compact:true,showSearch:false,
      header:{showTitle:true,title:'生活日誌',titleIcon:'book-heart',themeColorTarget:'none'},
      background:clone(home.background),backgroundLayout:home.backgroundLayout,
    }:board),
  };
}
