import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validate} from '../lib/emotions.mjs';
const [input,vault]=process.argv.slice(2);
if(!input||!vault)throw Error('Usage: node tools/export-vault.mjs export.json /path/to/vault');
const data=validate(JSON.parse(readFileSync(input,'utf8')));
// Content-addressed snapshots never overwrite notes, source data, or existing snapshots.
const text=JSON.stringify(data,null,2),hash=createHash('sha256').update(text).digest('hex');
const dir=path.join(path.resolve(vault),'Personal AI OS Exports',hash);
if(existsSync(dir)){console.log('Identical snapshot already exists');process.exit(0);}
mkdirSync(dir,{recursive:true});
writeFileSync(path.join(dir,'events.json'),text,{flag:'wx'});
const lines=['# Emotional Aftereffect snapshot','','Schema: 1. Original IDs and metadata are retained in events.json.',''];
for(const e of data.events)lines.push(`## ${e.title.replace(/[\r\n]/g,' ')}`,`- ID: ${e.id}`,`- Peak: ${e.peakAt}`,`- Direction: ${e.valence}; intensity: ${e.intensity}/10`,`- Status: ${e.status}; score: ${e.riskFactors.reduce((a,b)=>a+b,0)}/24`,...e.followups.map(f=>`- ${f.at}: mood ${f.mood}`),'');
writeFileSync(path.join(dir,'Emotional Aftereffect.md'),lines.join('\n'),{flag:'wx'});
console.log(`Snapshot exported to ${dir}`);
