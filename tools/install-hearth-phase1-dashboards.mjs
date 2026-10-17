import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {buildHearthPhase1Dashboards} from '../lib/hearth-phase1-dashboards.mjs';

const vault=process.argv[2];
if(!vault)throw Error('Pass the existing Obsidian vault path');
const configPath=join(vault,'.obsidian','plugins','hearth','data.json');
const before=await readFile(configPath,'utf8');
const source=JSON.parse(before);
let updated=buildHearthPhase1Dashboards(source);
const refresh=process.argv.includes('--refresh-queries');
if(refresh && source.dashboards.length===5){
  const expected=buildHearthPhase1Dashboards({...source,dashboards:source.dashboards.slice(0,2)});
  updated=structuredClone(source);
  for(const id of ['tasks-status','tasks-pending','risk-aftereffects','overview-classes','tasks-classes']){
    const target=updated.dashboards.flatMap(b=>b.cards).find(c=>c.id===id);
    const replacement=expected.dashboards.flatMap(b=>b.cards).find(c=>c.id===id);
    if(!target?.dataview||!replacement?.dataview)throw Error('Missing managed card '+id);
    target.dataview.query=replacement.dataview.query;
    target.title=replacement.title;
  }
  for(const id of ['journal-overview','journal-risk']){
    const target=updated.dashboards[1].cards.find(c=>c.id==='journal-nav')?.links.find(l=>l.id===id);
    const replacement=expected.dashboards[1].cards.find(c=>c.id==='journal-nav')?.links.find(l=>l.id===id);
    if(!target||!replacement)throw Error('Missing approved journal link '+id);
    target.type=replacement.type;target.target=replacement.target;
  }
}
if(source.dashboards.length===updated.dashboards.length && !refresh){
  console.log('Phase 1 Hearth dashboards already installed; no changes written');
  process.exit(0);
}
const backupDir=join(vault,'..','Personal AI OS Backups','hearth-phase1-before');
await mkdir(backupDir,{recursive:true});
try{await copyFile(configPath,join(backupDir,'hearth-data-before.json'),1);}
catch(error){if(error.code!=='EEXIST')throw error;}
if(await readFile(configPath,'utf8')!==before)throw Error('Hearth configuration changed during installation');
await writeFile(configPath,JSON.stringify(updated,null,2)+'\n','utf8');
const saved=JSON.parse(await readFile(configPath,'utf8'));
const expected=['overview','risk','tasks'];
if(saved.dashboards.length!==(refresh?source.dashboards.length:source.dashboards.length+3) ||
  !expected.every(kind=>saved.dashboards.some(b=>b.cards.some(c=>c.id===kind+'-nav'))))
  throw Error('Hearth Phase 1 readback failed');
console.log(JSON.stringify({dashboards:saved.dashboards.map(b=>b.name),added:refresh?0:3,backup:backupDir}));
