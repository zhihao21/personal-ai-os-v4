import test from 'node:test';
import assert from 'node:assert/strict';
import {buildHearthAnalyticsDashboard} from '../lib/hearth-analytics-dashboard.mjs';

test('reuses Hearth data cards and adds one navigable analytics board',()=>{
  const card=(id,kind,extra={})=>({id,kind,...extra});
  const background={kind:'image',value:'Assets/evening.png'};
  const settings={dashboards:[
    {name:'The Unseen',cards:[card('unseen-modules','links',{links:[{id:'analytics',type:'note',target:'old.md'}]}),card('unseen-progress','embed',{target:'Assets/activity.svg'}),card('unseen-risk-trend','embed',{target:'Assets/risk.svg'})]},
    {name:'生活日誌',background,backgroundLayout:'full',cards:[card('journal-nav','links',{links:[{id:'journal-analytics',type:'note',target:'old.md'}]}),card('journal-metrics','dataview',{dataview:{query:'old'}}),card('journal-recent','dataview',{dataview:{query:'recent'}}),card('journal-trend','embed',{target:'Assets/mood.svg'})]},
    ...['overview','risk','tasks'].map(id=>({name:id,cards:[card(`${id}-nav`,'links',{links:[]})]})),
  ]};
  const result=buildHearthAnalyticsDashboard(settings);
  assert.equal(settings.dashboards.length,5);
  assert.equal(result.dashboards.length,6);
  const analytics=result.dashboards[5];
  assert.equal(analytics.name,'視覺分析');
  assert.deepEqual(analytics.background,background);
  assert.deepEqual(analytics.cards.map(c=>c.id),['analytics-nav','analytics-metrics','analytics-mood','analytics-tasks','analytics-risk','analytics-recent']);
  assert.equal(analytics.cards.find(c=>c.id==='analytics-mood').target,'Assets/mood.svg');
  assert.equal(analytics.cards.find(c=>c.id==='analytics-tasks').target,'Assets/activity.svg');
  assert.equal(analytics.cards.find(c=>c.id==='analytics-risk').target,'Assets/risk.svg');
  assert.equal(analytics.cards.find(c=>c.id==='analytics-recent').dataview.query,'recent');
  assert.match(analytics.cards.find(c=>c.id==='analytics-metrics').dataview.query,/lifecycle === 'current'/);
  assert.equal(result.dashboards[0].cards[0].links[0].target,'hearth:open-dashboard-6');
  assert.equal(result.dashboards[1].cards[0].links[0].target,'hearth:open-dashboard-6');
  assert.equal(result.dashboards[2].cards[0].links.at(-1).target,'hearth:open-dashboard-6');
  assert.deepEqual(buildHearthAnalyticsDashboard(result),result);
});
