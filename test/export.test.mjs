import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
test('vault env configuration, Markdown lines, metadata roundtrip and corrupt snapshot detection',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'aftereffect-export-'));
 try{
 const data={schemaVersion:1,events:[{id:'synthetic',title:'Review\n[link]',peakAt:'2026-01-01T00:00:00Z',valence:'positive',intensity:8,status:'closed',riskFactors:[0,0,0,0],followups:[],source:{pageId:'synthetic-only'}}]};
 const input=path.join(dir,'input.json');writeFileSync(input,JSON.stringify(data));writeFileSync(path.join(dir,'existing.md'),'unchanged');
 const run=()=>spawnSync(process.execPath,['tools/export-vault.mjs',input],{env:{...process.env,OBSIDIAN_VAULT:dir},encoding:'utf8'});
 assert.equal(run().status,0);assert.equal(run().status,0);
 const snapshot=path.join(dir,'Personal AI OS Exports',readdirSync(path.join(dir,'Personal AI OS Exports'))[0]);
 assert.deepEqual(JSON.parse(readFileSync(path.join(snapshot,'events.json'),'utf8')),data);
 const md=readFileSync(path.join(snapshot,'Emotional Aftereffect.md'),'utf8');assert.ok(md.includes('\n## Review \\[link\\]\n'));assert.ok(md.includes('not a clinical assessment'));
 assert.equal(readFileSync(path.join(dir,'existing.md'),'utf8'),'unchanged');writeFileSync(path.join(snapshot,'events.json'),'corrupt');assert.notEqual(run().status,0);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
