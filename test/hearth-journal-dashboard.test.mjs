import test from 'node:test';
import assert from 'node:assert/strict';
import {buildHearthJournalDashboard} from '../lib/hearth-journal-dashboard.mjs';

test('reuses the empty Hearth board and existing journal sources',()=>{
  const cards=[
    {id:'unseen-modules',kind:'links',links:[]},
    {id:'unseen-journal',kind:'dataview',dataview:{language:'js',query:'existing journal query'}},
    {id:'unseen-mood',kind:'embed',target:'Assets/mood-trend.svg'},
  ];
  const settings={dashboards:[{name:'The Unseen',cards,background:{kind:'image',value:'Assets/evening.png'},backgroundLayout:'full'},{name:'Dashboard 2',cards:[]}]};
  const result=buildHearthJournalDashboard(settings);
  assert.equal(settings.dashboards[1].cards.length,0);
  assert.equal(result.dashboards[0].cards[1].dataview.query,'existing journal query');
  assert.equal(result.dashboards[1].name,'生活日誌');
  assert.deepEqual(result.dashboards[1].background,settings.dashboards[0].background);
  assert.equal(result.dashboards[1].cards.length,4);
  assert.equal(result.dashboards[1].cards.find(card=>card.id==='journal-recent').dataview.query,'existing journal query');
  assert.equal(result.dashboards[1].cards.find(card=>card.id==='journal-trend').target,'Assets/mood-trend.svg');
  result.dashboards[1].cards[0].title='User-adjusted title';
  assert.equal(buildHearthJournalDashboard(result).dashboards[1].cards[0].title,'User-adjusted title');
  assert.throws(()=>buildHearthJournalDashboard({...settings,dashboards:[settings.dashboards[0],{name:'Dashboard 2',cards:[{}]}]}),/user cards/);
});
