import {readFile,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {buildHearthJournalDashboard} from '../lib/hearth-journal-dashboard.mjs';

const vault=process.argv[2];
if(!vault)throw Error('Pass the existing Obsidian vault path');
const configPath=join(vault,'.obsidian','plugins','hearth','data.json');
const backupDir=join(vault,'..','Personal AI OS Backups','hearth-journal-before');
const original=await readFile(configPath,'utf8');
const parsed=JSON.parse(original);
const settings=buildHearthJournalDashboard(parsed);
const home=settings.dashboards.find(board=>board.name==='The Unseen');
const link=home.cards.find(card=>card.id==='unseen-modules')?.links.find(item=>item.id==='life-journal');
if(!link)throw Error('Hearth home has no Life Journal link');
link.type='command';
link.target='hearth:open-dashboard-2';
await mkdir(backupDir,{recursive:true});
const backup=join(backupDir,'hearth-data-before.json');
try{await copyFile(configPath,backup,1);}catch(error){if(error.code!=='EEXIST')throw error;}
if(await readFile(configPath,'utf8')!==original)throw Error('Hearth configuration changed during installation');
await writeFile(configPath,JSON.stringify(settings,null,2)+'\n','utf8');
const saved=JSON.parse(await readFile(configPath,'utf8'));
if(saved.dashboards[1]?.name!=='生活日誌'||saved.dashboards[1].cards.length!==4||saved.dashboards[0].cards.length!==home.cards.length)throw Error('Hearth dashboard readback failed');
console.log(JSON.stringify({dashboard:saved.dashboards[1].name,cards:saved.dashboards[1].cards.length,background:saved.dashboards[1].background?.kind,homeCards:saved.dashboards[0].cards.length}));
