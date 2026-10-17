import test from 'node:test';
import assert from 'node:assert/strict';
import {refineHearthDashboard} from '../lib/hearth-refinement.mjs';

const ids=['domains','daily','focus','week','next','journal','operations','risk','aftereffect','mood','modules','progress','risk-trend'];
const makeConfig=()=>({cardOpacity:0.56,backgroundValue:'evening.png',dashboards:[{
  id:'dash-mvawm6fb-2495',cards:ids.map(id=>({id:`unseen-${id}`,kind:id==='domains'?'links':'dataview',
    ...(id==='domains'?{links:[
      {target:'vault/work.md'},{target:'vault/study.md'},{target:'vault/life.md'},
    ],tileSizing:'scale'}:{})})),
}]});

test('refinement keeps all cards and navigation targets, and compiles live queries',()=>{
  const config=makeConfig(),before=config.dashboards[0].cards.map(card=>card.id);
  refineHearthDashboard(config);
  assert.deepEqual(config.dashboards[0].cards.map(card=>card.id),before);
  assert.equal(config.backgroundValue,'evening.png');
  assert.equal(config.cardOpacity,0.64);
  const cards=config.dashboards[0].cards;
  const overview=cards[0];
  assert.equal(overview.kind,'dataview');
  for(const target of ['vault/work.md','vault/study.md','vault/life.md'])assert.ok(overview.dataview.query.includes(target));
  for(const card of cards.filter(card=>card.dataview?.language==='js'))new Function('dv','app',card.dataview.query);
  refineHearthDashboard(config);
  assert.deepEqual(cards[0].overviewTargets,['vault/work.md','vault/study.md','vault/life.md']);
});

test('empty schedule is a localised empty state; missing folder is an error',()=>{
  const config=refineHearthDashboard(makeConfig());
  const query=config.dashboards[0].cards.find(card=>card.id==='unseen-week').dataview.query;
  const messages=[],folder='Personal AI OS V4 Prototype/Records/Schedule';
  const app={vault:{getAbstractFileByPath:()=>({}),getMarkdownFiles:()=>[{path:folder+'/past.md'}]}};
  const dv={app,pages:()=>({array:()=>[{starts_at:'2020-01-01',file:{link:'past'}}]}),paragraph:message=>messages.push(message),table:()=>assert.fail('No current week rows')};
  new Function('dv','app',query)(dv,app);
  assert.deepEqual(messages,['本週沒有已記錄行程']);
  messages.length=0;
  app.vault.getAbstractFileByPath=()=>null;
  new Function('dv','app',query)(dv,app);
  assert.match(messages[0],/資料來源不存在/);
});
