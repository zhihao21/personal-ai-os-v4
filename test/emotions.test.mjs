import test from 'node:test';
import assert from 'node:assert/strict';
import {analyze,validate,merge} from '../lib/emotions.mjs';
const event=(extra={})=>({id:'a',title:'Synthetic',valence:'negative',peakAt:'2026-01-01T00:00:00Z',intensity:9,status:'closed',riskFactors:[6,5,5,5],followups:[{at:'2026-01-02T00:00:00Z',mood:-3}],...extra});
const data=(...events)=>({schemaVersion:1,events});
test('closed 21/24 is historical only',()=>{const a=analyze(data(event()));assert.equal(a.activeHigh.length,0);assert.equal(a.historicalHigh[0].score,21);assert.equal(a.activeMax,null);});
test('active 24/24 remains distinct',()=>{const a=analyze(data(event({status:'active',riskFactors:[6,6,6,6]})));assert.equal(a.activeHigh.length,1);assert.equal(a.historicalHigh.length,0);});
test('positive and negative peaks; delayed observations retain signed mood',()=>{const a=analyze(data(event(),event({id:'b',valence:'positive',intensity:8})));assert.equal(a.positivePeak,8);assert.equal(a.negativePeak,9);assert.deepEqual(a.events[0].delayed[0],{at:'2026-01-02T00:00:00Z',mood:-3,hours:24});});
test('future observations excluded at analysis clock',()=>{assert.equal(analyze(data(event()),new Date('2026-01-01T12:00Z')).events[0].latestMood,null);});
test('reject malformed scales, dates, duplicate IDs and pre-peak observations',()=>{for(const e of [event({riskFactors:[25]}),event({peakAt:'bad'}),event({intensity:11}),event({followups:[{at:'2025-01-01',mood:0}]})])assert.throws(()=>validate(data(e)));assert.throws(()=>validate(data(event(),event())));});
test('merge is idempotent and rejects conflicting source IDs without loss',()=>{const d=data(event({source:{system:'notion',originalId:'opaque'},custom:'retained'}));assert.deepEqual(merge(d,d),d);assert.throws(()=>merge(d,data(event({title:'changed'}))));assert.equal(JSON.parse(JSON.stringify(d)).events[0].custom,'retained');});
test('elapsed observations require real timezone-aware instants',()=>{
  const valid=event({peakAt:'2026-03-01T00:30:00+08:00',followups:[{at:'2026-02-28T18:00:00Z',mood:2}]});
  assert.equal(analyze(data(valid)).events[0].delayed[0].hours,1.5);
  for(const peakAt of ['2026-02-30T10:00Z','2026-03-01','2026-03-01T00:30','2026-03-01T00:30+14:30']) assert.throws(()=>validate(data(event({peakAt}))));
  assert.throws(()=>validate(data(event({followups:[{at:'2026-01-02',mood:1}]}))));
});
test('cross-domain counts keep active and historical risk separate',()=>{
  const result=analyze(data(event({domains:['relationship','lifestyle']}),event({id:'b',status:'active',domains:['emotional','health'],riskFactors:[6,6,6,6]})));
  assert.deepEqual(result.byDomain.relationship,{active:0,historical:1});
  assert.deepEqual(result.byDomain.emotional,{active:1,historical:0});
  assert.equal(result.historicalHigh[0].score,21);
  assert.equal(result.activeHigh[0].score,24);
  assert.equal(analyze(data(event())).byDomain.unclassified.historical,1);
  for(const domains of [['emotional','emotional'],['unknown'],null]) assert.throws(()=>validate(data(event({domains}))));
});
test('delayed mood change requires two observed followups and never uses peak intensity as a baseline',()=>{
  const observed=event({valence:'positive',intensity:10,followups:[
    {at:'2026-01-01T01:00:00Z',mood:4},
    {at:'2026-01-02T00:00:00Z',mood:-2}
  ]});
  assert.equal(analyze(data(observed),new Date('2026-01-01T12:00:00Z')).events[0].observedMoodDelta,null);
  const result=analyze(data(observed),new Date('2026-01-03T00:00:00Z')).events[0];
  assert.equal(result.observedMoodDelta,-6);
  assert.equal(result.delayed[1].hours,24);
  assert.equal(analyze(data(event()),new Date('2026-01-03T00:00:00Z')).events[0].observedMoodDelta,null);
});
