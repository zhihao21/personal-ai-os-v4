import {readFile, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {installPrototype, prototypeName} from '../lib/obsidian-prototype.mjs';
import {renderCharts} from '../lib/obsidian-charts.mjs';

const [command='install',providedVault]=process.argv.slice(2);
const vault=providedVault||process.env.OBSIDIAN_VAULT;
if(!vault)throw Error('Usage: node tools/obsidian-prototype.mjs install|refresh|journal [vault]; or set OBSIDIAN_VAULT');
if(!(await stat(path.join(vault,'.obsidian')).catch(()=>null))?.isDirectory())throw Error('Select an existing Obsidian vault');
const root=path.join(vault,prototypeName);

if(command==='install'){
  const result=await installPrototype(vault);
  const counts=await renderCharts(result.root);
  console.log(JSON.stringify({created:result.created.length,preserved:result.preserved.length,records:counts},null,2));
}else if(command==='refresh'){
  console.log(JSON.stringify(await renderCharts(root),null,2));
}else if(command==='journal'){
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
  const date=`${parts.year}-${parts.month}-${parts.day}`;
  const target=path.join(root,'Records','Journal',`${date}.md`);
  const template=await readFile(path.join(root,'Templates','每日生活日誌.md'),'utf8');
  try{await writeFile(target,template.replaceAll('{{date:YYYY-MM-DD}}',date),{flag:'wx'});console.log(`Created ${target}`);}
  catch(error){if(error.code!=='EEXIST')throw error;console.log(`Existing daily journal preserved: ${target}`);}
}else throw Error('Expected install, refresh, or journal');
