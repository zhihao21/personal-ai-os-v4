import test from 'node:test';
import assert from 'node:assert/strict';
import {loadNotionDashboard,normalizeRows,querySource,textOf} from '../lib/notion-dashboard.mjs';

const rich=text=>({type:'rich_text',rich_text:[{plain_text:text}]});
test('normalizes existing Notion fields without changing their scales',()=>{
  const rows=normalizeRows('journal',[{id:'j1',url:'https://example.invalid/j1',properties:{標題:{type:'title',title:[{plain_text:'Synthetic journal'}]},日期:{type:'date',date:{start:'2026-10-16'}},心情分數:{type:'number',number:8},今日狀態分數:{type:'number',number:5},每日綜合分數:{type:'formula',formula:{type:'number',number:6.5}},今日事件:rich('Synthetic')}}]);
  assert.equal(rows[0].mood,8);assert.equal(rows[0].state,5);assert.equal(rows[0].composite,6.5);
  assert.equal(rows[0].date,'2026-10-16');assert.equal(textOf({type:'formula',formula:{type:'number',number:null}}),'');
});

test('paginates configured university data source and keeps identifiers out of code defaults',async()=>{
  const requests=[];
  const fetcher=async(url,options)=>{requests.push({url,body:JSON.parse(options.body),headers:options.headers});return {ok:true,json:async()=>requests.length===1?{results:[{id:'a',properties:{名稱:{type:'title',title:[{plain_text:'A'}]}}}],has_more:true,next_cursor:'next'}:{results:[{id:'b',properties:{名稱:{type:'title',title:[{plain_text:'B'}]}}}],has_more:false}};};
  const rows=await querySource('synthetic-token','synthetic-id',fetcher);
  assert.equal(rows.length,2);assert.equal(requests[1].body.start_cursor,'next');assert.ok(requests[0].url.endsWith('/synthetic-id/query'));
  const dashboard=await loadNotionDashboard({},fetcher);assert.equal(dashboard.connected,false);assert.deepEqual(dashboard.sources,{});
});

test('builds a source-backed dashboard only from configured sources',async()=>{
  let calls=0;
  const fetcher=async()=>{calls++;return {ok:true,json:async()=>({results:[{id:'t1',url:'https://example.invalid/t1',properties:{名稱:{type:'title',title:[{plain_text:'Synthetic task'}]},日期:{type:'date',date:{start:'2026-10-16'}}}}],has_more:false})};};
  const result=await loadNotionDashboard({NOTION_API_TOKEN:'synthetic-token',NOTION_TASK_SOURCE_ID:'synthetic-task-id'},fetcher);
  assert.equal(calls,1);assert.equal(result.connected,true);assert.equal(result.sources.tasks[0].title,'Synthetic task');assert.equal(result.sources.journal,null);
});
