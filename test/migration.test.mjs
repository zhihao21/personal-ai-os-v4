import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {checkMigration,eventDigest} from '../lib/migration.mjs';
const event={id:'synthetic-a',title:'Synthetic',valence:'positive',peakAt:'2026-01-01T00:00:00Z',intensity:8,status:'closed',riskFactors:[0,0,0,0],followups:[],source:{system:'synthetic'}};
const exportData={schemaVersion:1,events:[event]};
const sha='a'.repeat(64);
const manifest=()=>({schemaVersion:1,records:[{id:event.id,sha256:eventDigest(event)}],attachments:[{id:'synthetic-file',sha256:sha}],relations:[{from:event.id,to:event.id}]});
test('exact matching inventories and canonical export pass without depending on property order',()=>{
 const source=manifest(),destination=manifest();
 const reordered={...exportData,events:[Object.fromEntries(Object.entries(event).reverse())]};
 assert.deepEqual(checkMigration(source,destination,reordered),{ready:true,counts:{records:1,attachments:1,relations:1},errors:[]});
});
test('missing records, changed metadata, attachment bytes and relations block readiness',()=>{
 const source=manifest(),destination=manifest();destination.records=[];destination.attachments[0].sha256='b'.repeat(64);destination.relations=[];
 const changed={...exportData,events:[{...event,source:{system:'changed'}}]};
 const result=checkMigration(source,destination,changed);
 assert.equal(result.ready,false);assert.ok(result.errors.some(error=>error.startsWith("attachments:")));assert.ok(result.errors.some(error=>error.startsWith("relations:")));assert.ok(result.errors.some(error=>error.includes("canonical export")));
});
test('reject incomplete, duplicate or dangling inventory evidence',()=>{
 assert.throws(()=>checkMigration({...manifest(),attachments:undefined},manifest(),exportData));
 assert.throws(()=>checkMigration({...manifest(),records:[...manifest().records,...manifest().records]},manifest(),exportData));
 assert.throws(()=>checkMigration({...manifest(),relations:[{from:event.id,to:'missing'}]},manifest(),exportData));
});
test('CLI returns a nonzero status for mismatched evidence and leaves files unchanged',()=>{
 const dir=mkdtempSync(path.join(tmpdir(),'migration-check-'));
 try{
  const files=['source.json','destination.json','export.json'].map(name=>path.join(dir,name));
  const input=[manifest(),{...manifest(),attachments:[]},exportData].map(value=>JSON.stringify(value));
  files.forEach((file,i)=>writeFileSync(file,input[i]));
  const run=spawnSync(process.execPath,['tools/check-migration.mjs',...files],{encoding:'utf8'});
  assert.equal(run.status,1);assert.match(run.stdout,/attachments/);
  assert.deepEqual(files.map(file=>readFileSync(file,'utf8')),input);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
