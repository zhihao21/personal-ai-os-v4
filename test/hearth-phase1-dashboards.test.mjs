import test from 'node:test';
import assert from 'node:assert/strict';
import {buildHearthPhase1Dashboards} from '../lib/hearth-phase1-dashboards.mjs';

test('adds Phase 1 boards while retaining home and approved journal',()=>{
  const card=(id,kind='dataview')=>({id,kind,dataview:{query:id},links:[]});
  const home={id:'home',name:'The Unseen',background:{kind:'image',value:'Assets/evening.png'},cards:[
    ...['unseen-journal','unseen-focus','unseen-next','unseen-week','unseen-risk','unseen-aftereffect','unseen-risk-trend'].map(id=>card(id)),
    {...card('unseen-modules','links'),links:[{id:'overview'},{id:'life-risk'}]},
    {...card('unseen-operations','links'),links:[{id:'tasks'}]},
  ]};
  const journal={id:'journal',name:'生活日誌',header:{title:'生活日誌'},cards:[{...card('journal-nav','links'),links:[{id:'journal-home'},{id:'journal-overview',type:'note',target:'old-overview'},{id:'journal-risk',type:'note',target:'old-risk'}]},{...card('journal-metrics')}],background:home.background};
  const input={dashboards:[home,journal]};
  const result=buildHearthPhase1Dashboards(input);
  assert.equal(input.dashboards.length,2);
  assert.equal(result.dashboards.length,5);
  assert.equal(result.dashboards[1].cards.find(c=>c.id==='journal-nav').links.find(l=>l.id==='journal-overview').target,'hearth:open-dashboard-3');
  assert.equal(result.dashboards[1].cards.find(c=>c.id==='journal-nav').links.find(l=>l.id==='journal-risk').target,'hearth:open-dashboard-4');
  assert.equal(input.dashboards[1].cards[0].links[1].target,'old-overview');
  assert.deepEqual(result.dashboards.slice(2).map(b=>b.name),['每日總覽','生活風險分析','任務與行程']);
  assert.ok(result.dashboards.slice(2).every(b=>b.background.value==='Assets/evening.png'));
  assert.equal(result.dashboards[0].cards.find(c=>c.id==='unseen-modules').links[0].target,'hearth:open-dashboard-3');
  assert.match(result.dashboards[2].cards.find(c=>c.id==='overview-status').dataview.query,/歷史，非今日/);
  assert.match(result.dashboards[3].cards.find(c=>c.id==='risk-historical').dataview.query,/historical_score/);
  assert.match(result.dashboards[4].cards.find(c=>c.id==='tasks-classes').dataview.query,/unseen-timetable-week/);
  assert.match(result.dashboards[2].cards.find(c=>c.id==='overview-classes').dataview.query,/Asia\/Taipei/);
  assert.equal(buildHearthPhase1Dashboards(result).dashboards.length,5);
});
