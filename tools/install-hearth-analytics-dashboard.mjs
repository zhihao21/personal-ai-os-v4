import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {buildHearthAnalyticsDashboard} from '../lib/hearth-analytics-dashboard.mjs';

const vault=process.argv[2];
if(!vault)throw Error('Pass the existing Obsidian vault path');
const configPath=join(vault,'.obsidian','plugins','hearth','data.json');
const cssPath=join(vault,'.obsidian','snippets','the-unseen-hearth.css');
const repoCss=await readFile(new URL('../assets/the-unseen-hearth.css',import.meta.url),'utf8');
const [before,oldCss]=await Promise.all([readFile(configPath,'utf8'),readFile(cssPath,'utf8')]);
if(!oldCss.includes('.unseen-journal-metrics')||!oldCss.includes('.unseen-phase-metrics'))
  throw Error('Installed Hearth styling requires manual inspection');
const source=JSON.parse(before);
const updated=buildHearthAnalyticsDashboard(source);
const newConfig=JSON.stringify(updated,null,2)+'\n';
if(newConfig===before&&repoCss===oldCss){console.log(JSON.stringify({installed:false,boards:source.dashboards.length}));process.exit(0);}
const backup=join(vault,'..','Personal AI OS Backups',`hearth-analytics-before-${new Date().toISOString().replace(/[:.]/g,'-')}`);
await mkdir(backup,{recursive:true});
await copyFile(configPath,join(backup,'hearth-data.json'));
await copyFile(cssPath,join(backup,'the-unseen-hearth.css'));
if(await readFile(configPath,'utf8')!==before||await readFile(cssPath,'utf8')!==oldCss)
  throw Error('Installed Hearth configuration changed during backup');
await writeFile(configPath,newConfig,'utf8');
await writeFile(cssPath,repoCss,'utf8');
const saved=JSON.parse(await readFile(configPath,'utf8'));
if(saved.dashboards.filter(board=>board.id==='the-unseen-analytics').length!==1 ||
  !saved.dashboards.find(board=>board.id==='the-unseen-analytics').cards.some(card=>card.id==='analytics-mood') ||
  await readFile(cssPath,'utf8')!==repoCss)throw Error('Hearth Analytics readback failed');
console.log(JSON.stringify({installed:true,boards:saved.dashboards.length,backup}));
