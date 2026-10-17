import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,readFile,writeFile,rm,symlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {installPrototype,prototypeName} from '../lib/obsidian-prototype.mjs';
import {createObsidianBridge} from '../lib/obsidian-write-bridge.mjs';
import {readOriginalMetadata} from '../lib/obsidian-journal-originals.mjs';
import {saveJournalAnswers} from '../lib/obsidian-journal-entry.mjs';

const base=()=>mkdtemp(path.join(os.tmpdir(),'aios-bridge-test-'));
async function setup(){
  const home=await base(),vault=path.join(home,'vault');
  await mkdir(path.join(vault,'.obsidian'),{recursive:true});
  await writeFile(path.join(vault,'.obsidian','appearance.json'),'{}');
  await installPrototype(vault);
  return {home,vault,root:path.join(vault,prototypeName)};
}

test('journal, event, finding and access guards use only synthetic records',async()=>{
  const {home,vault,root}=await setup();
  try{
    const bridge=await createObsidianBridge(vault),submission_id=randomUUID();
    const first={date:'2040-04-05',submission_id,original_text:'Mood 7\n\nSynthetic reflection.',mood:7,state:6,emotional_tags:['calm'],thoughts:'Synthetic reflection'};
    const created=await bridge.upsertJournal(first);
    assert.equal(created.created,true);
    const target=path.join(root,'Records','Journal','2040-04-05.md');
    const bytes=await readFile(target,'utf8');
    assert.match(bytes,/Synthetic reflection/);
    assert.match(bytes,/original_submissions_index: \[/);
    assert.doesNotMatch(bytes,/<!-- the-unseen-original:/);
    assert.doesNotMatch(bytes,/<!-- the-unseen-journal:/);
    const repeated=await bridge.upsertJournal(first);
    assert.equal(repeated.replayed,true);
    assert.equal(await readFile(target,'utf8'),bytes);
    assert.equal(repeated.original_submissions[0].original_text,first.original_text);
    const indexed=readOriginalMetadata(bytes);
    const legacy=bytes.replace(/^original_submissions_index:.*\r?\n/m,'')
      .replace(/^> \[!quote\]- /m,`<!-- the-unseen-original:${JSON.stringify(indexed[0])} -->\n> [!quote]- `)
      .replace(/(> ```\r?\n)$/,`$1<!-- the-unseen-original:end -->\n`);
    await writeFile(target,legacy);
    const repaired=await saveJournalAnswers(vault,{date:first.date,mood:7});
    assert.equal(repaired.updated,true);
    const clean=await readFile(target,'utf8');
    assert.doesNotMatch(clean,/<!-- the-unseen-/);
    assert.deepEqual(readOriginalMetadata(clean),indexed);
    assert.equal((await bridge.getJournal({date:first.date})).original_submissions[0].original_text,first.original_text);
    await assert.rejects(()=>bridge.upsertJournal({date:first.date,submission_id:randomUUID(),thoughts:'Missing original'}),/original_text/i);
    await assert.rejects(()=>bridge.upsertJournal({...first,mood:8}),/submission ID already used/i);
    const changed=await bridge.upsertJournal({date:first.date,submission_id:randomUUID(),original_text:'Synthetic follow-up',followup:'Synthetic follow-up'});
    assert.equal(changed.fields.mood,7);
    assert.equal(changed.fields.thoughts,'Synthetic reflection');
    assert.equal(changed.fields.followup,'Synthetic follow-up');
    assert.equal((await bridge.verifyJournal({date:first.date,expected:{mood:7,followup:'Synthetic follow-up'}})).matches,true);
    assert.equal((await bridge.listRecentJournals({limit:1})).journals[0].date,first.date);
    const event={submission_id:randomUUID(),date:first.date,title:'Synthetic event',description:'Synthetic event detail',source_journal_date:first.date};
    const added=await bridge.addLifeEvent(event);
    assert.equal(added.created,true);
    assert.equal((await bridge.addLifeEvent(event)).replayed,true);
    const eventText=await readFile(path.join(vault,added.path),'utf8');
    assert.match(eventText,/\[\[Records\/Journal\/2040-04-05\]\]/);
    const finding=await bridge.addAftereffectFinding({date:first.date,source_event_id:added.id,facts:'Synthetic observed fact',hypotheses:'Synthetic hypothesis',unknowns:'Synthetic unknown',followup:'Observe later'});
    const findingText=await readFile(path.join(vault,finding.path),'utf8');
    assert.ok(findingText.includes(`[[Records/Events/${added.id}]]`));
    assert.match(findingText,/Synthetic observed fact/);
    await assert.rejects(()=>bridge.getJournal({date:'../../outside'}),/date required/i);
    await assert.rejects(()=>bridge.addAftereffectFinding({date:first.date,source_event_id:'DOES-NOT-EXIST',facts:'Synthetic fact'}),/exactly one note/i);
    await assert.rejects(()=>bridge.addLifeEvent({...event,description:'Different detail'}),/submission conflict/i);
    const escape=path.join(root,'Records','Events','escape.md');
    try{
      await symlink(path.join(home,'outside.md'),escape);
      await assert.rejects(()=>bridge.listRecentJournals({}),/symlink/i);
    }catch(error){if(error.code!=='EPERM')throw error;}
  }finally{await rm(home,{recursive:true,force:true});}
});

test('loopback HTTP requires bearer and rejects browser origin',async()=>{
  const {home,vault}=await setup();
  const token='synthetic-test-token-'+randomUUID(),tokenFile=path.join(home,'token');
  await writeFile(tokenFile,token);
  const child=spawn(process.execPath,['tools/obsidian-write-bridge.mjs'],{cwd:path.resolve('.'),env:{...process.env,OBSIDIAN_VAULT:vault,OBSIDIAN_BRIDGE_TOKEN_FILE:tokenFile,OBSIDIAN_BRIDGE_PORT:'0'},stdio:['ignore','pipe','pipe']});
  try{
    const port=await new Promise((resolve,reject)=>{
      let output='';const timer=setTimeout(()=>reject(Error('HTTP bridge startup timeout')),10000);
      child.stdout.on('data',chunk=>{output+=chunk;const line=output.split('\n')[0];if(line.endsWith('}')){clearTimeout(timer);resolve(JSON.parse(line).port);}});
      child.once('exit',code=>{clearTimeout(timer);reject(Error(`HTTP bridge exited ${code}`));});
    });
    const url=`http://127.0.0.1:${port}`;
    const denied=await fetch(url+'/v1/journals');assert.equal(denied.status,401);
    const forbidden=await fetch(url+'/v1/journals',{headers:{Authorization:`Bearer ${token}`,Origin:'https://example.com'}});assert.equal(forbidden.status,403);
    const written=await fetch(url+'/v1/journals',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({date:'2041-01-02',submission_id:randomUUID(),original_text:'Synthetic API event',mood:5,significant_events:'Synthetic API event'})});
    assert.equal(written.status,200,await written.text());
    const read=await fetch(url+'/v1/journals/2041-01-02',{headers:{Authorization:`Bearer ${token}`}});
    assert.equal((await read.json()).data.fields.significant_events,'Synthetic API event');
  }finally{child.kill();await rm(home,{recursive:true,force:true});}
});

test('stdio MCP exposes scoped tools and persists a synthetic journal',async()=>{
  const {home,vault}=await setup();
  const child=spawn(process.execPath,['tools/obsidian-bridge-mcp-stdio.mjs'],{cwd:path.resolve('.'),env:{...process.env,OBSIDIAN_VAULT:vault},stdio:['pipe','pipe','pipe']});
  let output='',nextId=0;const pending=new Map();
  child.stdout.on('data',chunk=>{
    output+=chunk.toString();
    while(output.includes('\n')){
      const end=output.indexOf('\n'),line=output.slice(0,end);output=output.slice(end+1);
      const message=JSON.parse(line);pending.get(message.id)?.(message);pending.delete(message.id);
    }
  });
  const call=(method,params)=>new Promise((resolve,reject)=>{
    const id=++nextId,timer=setTimeout(()=>reject(Error('MCP timeout')),5000);
    pending.set(id,value=>{clearTimeout(timer);resolve(value);});
    child.stdin.write(JSON.stringify({jsonrpc:'2.0',id,method,params})+'\n');
  });
  try{
    const init=await call('initialize',{protocolVersion:'2025-06-18',capabilities:{},clientInfo:{name:'test',version:'1'}});
    assert.equal(init.result.serverInfo.name,'personal-ai-os-obsidian');
    const tools=await call('tools/list');
    assert.ok(tools.result.tools.some(item=>item.name==='upsert_daily_journal'));
    assert.deepEqual(tools.result.tools.map(item=>item.name).sort(),['add_life_event','get_daily_journal','list_recent_journals','upsert_daily_journal','verify_daily_journal'].sort());
    const denied=await call('tools/call',{name:'save_aftereffect_finding',arguments:{date:'2042-02-03',facts:'Synthetic'}});
    assert.equal(denied.result.isError,true);
    const saved=await call('tools/call',{name:'upsert_daily_journal',arguments:{date:'2042-02-03',submission_id:randomUUID(),original_text:'Synthetic MCP reflection',mood:8,thoughts:'Synthetic MCP reflection'}});
    assert.equal(saved.result.isError,false);
    assert.equal(saved.result.structuredContent.fields.thoughts,'Synthetic MCP reflection');
    const read=await call('tools/call',{name:'get_daily_journal',arguments:{date:'2042-02-03'}});
    assert.equal(read.result.structuredContent.fields.mood,8);
  }finally{child.kill();await rm(home,{recursive:true,force:true});}
});
