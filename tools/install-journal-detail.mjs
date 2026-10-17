import {readFile,readdir,writeFile,copyFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {compileInteriorCss} from '../lib/obsidian-interior-style.mjs';
import {prototypeName,parseFrontmatter} from '../lib/obsidian-prototype.mjs';
import {addJournalDetailClass,journalDetailTemplate,renderJournalDetail} from '../lib/obsidian-journal-display.mjs';
import {readOriginalSubmissions} from '../lib/obsidian-journal-originals.mjs';

const vault=process.argv[2];
if(!vault)throw Error('Pass the existing Obsidian vault path');
const root=join(vault,prototypeName);
const journalDir=join(root,'Records','Journal');
const templatePath=join(root,'Templates','每日生活日誌.md');
const cssPath=join(vault,'.obsidian','snippets','the-unseen-interior.css');
const oldTemplate=await readFile(templatePath,'utf8');
if(parseFrontmatter(oldTemplate)?.record_type!=='journal')throw Error('Unexpected daily template');
if(oldTemplate.split(/^---\s*$/m).slice(2).join('---').trim() && oldTemplate!==journalDetailTemplate())
  throw Error('Daily template has custom body; inspect before replacement');

const notes=[];
for(const name of await readdir(journalDir)){
  if(!/^\d{4}-\d{2}-\d{2}\.md$/.test(name))continue;
  const file=join(journalDir,name),before=await readFile(file,'utf8');
  if(parseFrontmatter(before)?.record_type!=='journal')throw Error(`Unexpected journal type: ${name}`);
  const after=name==='2026-10-17.md'?renderJournalDetail(before):addJournalDetailClass(before);
  if(name==='2026-10-17.md'){
    const values=parseFrontmatter(before);
    if(values.mood!=null||values.state!=null||before.includes('> [!quote]-'))
      throw Error('October 17 is no longer empty; inspect before presentation repair');
  }
  const originalsBefore=await readOriginalSubmissions(journalDir,name.slice(0,10),before);
  const originalsAfter=await readOriginalSubmissions(journalDir,name.slice(0,10),after);
  if(JSON.stringify(originalsBefore)!==JSON.stringify(originalsAfter))throw Error(`Original submissions changed: ${name}`);
  if(after!==before)notes.push({file,name,before,after});
}
const cssBefore=await readFile(cssPath,'utf8');
const cssTemplate=await readFile(new URL('../assets/the-unseen-interior.css',import.meta.url),'utf8');
const image=await readFile(join(root,'Assets','the-unseen-evening.png'));
const cssAfter=compileInteriorCss(cssTemplate,image);
const updates=[...notes,{file:templatePath,name:'journal-template.md',before:oldTemplate,after:journalDetailTemplate()},
  {file:cssPath,name:'the-unseen-interior.css',before:cssBefore,after:cssAfter}].filter(item=>item.after!==item.before);
if(!updates.length){console.log(JSON.stringify({updated_notes:0,template:false,css:false}));process.exit(0);}
const backup=join(vault,'..','Personal AI OS Backups',`journal-detail-before-${new Date().toISOString().replace(/[:.]/g,'-')}`);
await mkdir(backup,{recursive:true});
for(const item of updates)await copyFile(item.file,join(backup,item.name));
for(const item of updates){
  if(await readFile(item.file,'utf8')!==item.before)throw Error(`Changed during installation: ${item.name}`);
  await writeFile(item.file,item.after,'utf8');
  if(await readFile(item.file,'utf8')!==item.after)throw Error(`Readback failed: ${item.name}`);
}
console.log(JSON.stringify({updated_notes:notes.length,template:updates.some(item=>item.file===templatePath),css:updates.some(item=>item.file===cssPath),backup}));
