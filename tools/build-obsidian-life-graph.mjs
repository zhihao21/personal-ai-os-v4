import {buildLifeGraph} from '../lib/obsidian-life-graph.mjs';

const args=Object.fromEntries(process.argv.slice(2).map(value=>{
  const at=value.indexOf('=');
  if(at<1 || !value.startsWith('--'))throw Error('Use --vault=PATH --manifest=PATH --backup=PATH');
  return [value.slice(2,at),value.slice(at+1)];
}));
for(const key of ['vault','manifest','backup'])if(!args[key])throw Error(`Missing --${key}`);
console.log(JSON.stringify(await buildLifeGraph({vault:args.vault,manifestPath:args.manifest,backupPath:args.backup}),null,2));
