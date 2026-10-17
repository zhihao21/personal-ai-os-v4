import {readFile,copyFile,mkdir,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {prototypeName} from '../lib/obsidian-prototype.mjs';
import {renderCharts} from '../lib/obsidian-charts.mjs';

const vault=process.argv[2];
if(!vault)throw Error('Pass the existing Obsidian vault path');
const root=join(vault,prototypeName);
const journalDir=join(root,'Records','Journal');
const assets=join(root,'Assets');
const names=['mood-trend.svg','risk-summary.svg','activity.svg','calendar.svg'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const beforeJournals=new Map();
for(const name of await readdir(journalDir))if(/^\d{4}-\d{2}-\d{2}\.md$/.test(name))
  beforeJournals.set(name,hash(await readFile(join(journalDir,name))));
const backup=join(vault,'..','Personal AI OS Backups',`charts-before-${new Date().toISOString().replace(/[:.]/g,'-')}`);
await mkdir(backup,{recursive:true});
for(const name of names)await copyFile(join(assets,name),join(backup,name));
const counts=await renderCharts(root);
for(const [name,digest] of beforeJournals)
  if(hash(await readFile(join(journalDir,name)))!==digest)throw Error(`Journal changed during chart refresh: ${name}`);
const mood=await readFile(join(assets,'mood-trend.svg'),'utf8');
if(mood.includes('<rect width="900" height="300"') || !mood.includes('10/17'))
  throw Error('Mood chart transparency or date-label readback failed');
console.log(JSON.stringify({refreshed:names.length,journals_unchanged:beforeJournals.size,counts,backup}));
