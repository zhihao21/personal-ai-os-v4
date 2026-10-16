import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
test('HTTP persistence, conflicts, backups and vault portability',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'personal-ai-os-test-'));
 const port=14310,base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:String(port),DATA_DIR:dir}});
 try {
  await Promise.race([once(child.stdout,'data'),once(child,'exit').then(()=>{throw Error('Server exited');}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Startup timeout')),5000).unref())]);
  const post=(route,body,origin=base)=>fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
  assert.deepEqual(await(await fetch(base+'/api/events')).json(),{schemaVersion:1,events:[]});
  assert.equal((await fetch(base+'/')).status,200);
  const e={id:'synthetic',title:'Synthetic only',status:'closed',valence:'negative',peakAt:'2026-01-01T00:00:00Z',intensity:9,riskFactors:[6,5,5,5],followups:[],source:{system:'notion',originalId:'synthetic-id'},extra:{retained:true}};
  const payload={schemaVersion:1,events:[e]};
  assert.equal((await post('/api/import',payload,'http://untrusted.example')).status,403);
  assert.equal((await post('/api/import',payload)).status,200);
  assert.equal((await post('/api/import',payload)).status,200);
  assert.equal((await post('/api/import',{schemaVersion:1,events:[{...e,title:'conflict'}]})).status,400);
  const updated={...e,status:'active',followups:[{at:'2026-01-02T00:00:00Z',mood:-2}]};
  assert.equal((await post('/api/edit',{original:e,updated})).status,200);
  assert.equal((await post('/api/edit',{original:e,updated})).status,400);
  const saved=await(await fetch(base+'/api/events')).json();assert.deepEqual(saved.events,[updated]);
  assert.ok((await readdir(dir)).some(f=>f.startsWith('backup-')));
  const input=path.join(dir,'export.json'),vault=path.join(dir,'vault');await mkdir(vault);await writeFile(path.join(vault,'existing.md'),'KEEP');await writeFile(input,JSON.stringify(saved));
  const run=()=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,['tools/export-vault.mjs',input,vault],{cwd:new URL('..',import.meta.url)});p.on('exit',code=>code===0?resolve():reject(Error('Vault export failed')));});
  await run();await run();assert.equal(await readFile(path.join(vault,'existing.md'),'utf8'),'KEEP');
  const snapshots=await readdir(path.join(vault,'Personal AI OS Exports'));assert.equal(snapshots.length,1);
  const restored=JSON.parse(await readFile(path.join(vault,'Personal AI OS Exports',snapshots[0],'events.json'),'utf8'));assert.deepEqual(restored,saved);
 }finally{child.kill();}
});
