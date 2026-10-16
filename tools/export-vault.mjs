import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync,mkdtempSync,rmSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {validate} from '../lib/emotions.mjs';
const [input,argVault]=process.argv.slice(2),vault=argVault||process.env.OBSIDIAN_VAULT;
if(!input||!vault)throw Error('Usage: node tools/export-vault.mjs export.json [vault]; or set OBSIDIAN_VAULT');
if(!statSync(vault).isDirectory())throw Error('Vault must be an existing directory');
const data=validate(JSON.parse(readFileSync(input,'utf8')));
const text=JSON.stringify(data,null,2),hash=createHash('sha256').update(text).digest('hex');
const parent=path.join(path.resolve(vault),'Personal AI OS Exports'),dir=path.join(parent,hash);
const safe=value=>String(value).replace(/[\r\n]/g,' ').replace(/[\\`*_{}\[\]<>#]/g,'\\$&');
const lines=['# Emotional Aftereffect snapshot','','Provisional personal tracking; not a clinical assessment.','Schema: 1. Original IDs and metadata are retained in events.json.',''];
for(const e of data.events)lines.push(`## ${safe(e.title)}`,`- ID: ${safe(e.id)}`,`- Peak: ${e.peakAt}`,`- Direction: ${e.valence}; intensity: ${e.intensity}/10`,`- Status: ${e.status}; score: ${e.riskFactors.reduce((a,b)=>a+b,0)}/24`,...e.followups.map(f=>`- ${f.at}: mood ${f.mood}`),'');
const markdown=lines.join('\n');
if(existsSync(dir)){
 if(readFileSync(path.join(dir,'events.json'),'utf8')!==text||readFileSync(path.join(dir,'Emotional Aftereffect.md'),'utf8')!==markdown)throw Error('Existing snapshot is incomplete or differs; preserve it and export to another vault directory');
 console.log('Identical verified snapshot already exists');
}else{
 mkdirSync(parent,{recursive:true});const staging=mkdtempSync(path.join(parent,'.snapshot-'));
 try{writeFileSync(path.join(staging,'events.json'),text,{flag:'wx'});writeFileSync(path.join(staging,'Emotional Aftereffect.md'),markdown,{flag:'wx'});renameSync(staging,dir);}finally{rmSync(staging,{recursive:true,force:true});}
 console.log(`Snapshot exported to ${dir}`);
}
