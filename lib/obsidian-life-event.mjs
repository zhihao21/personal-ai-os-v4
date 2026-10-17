import {createHash, randomUUID} from 'node:crypto';
import {link, mkdir, open, readFile, stat, unlink, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {parseFrontmatter, prototypeName} from './obsidian-prototype.mjs';
import {validJournalDate} from './obsidian-journal-entry.mjs';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const readMaybe=async file=>readFile(file,'utf8').catch(error=>error.code==='ENOENT'?null:Promise.reject(error));

export async function saveLifeEvent(vault,event){
  if(!event||typeof event!=='object'||!uuid.test(event.submission_id??''))throw Error('Valid UUID submission_id required');
  if(!validJournalDate(event.date))throw Error('Valid event date required');
  if(typeof event.title!=='string'||!event.title.trim()||event.title.length>160||/[\r\n]/.test(event.title))throw Error('Valid event title required');
  if(typeof event.description!=='string'||!event.description.trim()||event.description.length>12000)throw Error('Valid event description required');
  if(event.source_journal_date!==undefined&&!validJournalDate(event.source_journal_date))throw Error('Invalid source journal date');
  const root=path.join(vault,prototypeName);
  if(!(await stat(path.join(vault,'.obsidian')).catch(()=>null))?.isDirectory())throw Error('Existing Obsidian vault required');
  if(event.source_journal_date){
    const source=await readFile(path.join(root,'Records','Journal',`${event.source_journal_date}.md`),'utf8');
    const data=parseFrontmatter(source);
    if(data?.record_type!=='journal'||data.date!==event.source_journal_date)throw Error('Source journal mismatch');
  }
  const id=`LIFE-${event.submission_id.toLowerCase()}`;
  const normalized={date:event.date,title:event.title.trim(),description:event.description.trim(),source_journal_date:event.source_journal_date??null};
  const contentHash=createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
  const folder=path.join(root,'Records','Events');
  await mkdir(folder,{recursive:true});
  const target=path.join(folder,`${id}.md`);
  const lock=await open(`${target}.lock`,'wx');
  let temporary;
  try{
    const prior=await readMaybe(target);
    if(prior!==null){
      const data=parseFrontmatter(prior);
      if(data?.record_type!=='life_event'||data.event_id!==id||data.bridge_content_hash!==contentHash)throw Error('Life event submission conflict');
      return {id,created:false,replayed:true,path:target};
    }
    const source=event.source_journal_date?`\n## 來源日誌\n\n[[Records/Journal/${event.source_journal_date}]]\n`:'';
    const markdown=`---\nrecord_type: "life_event"\nevent_id: ${JSON.stringify(id)}\ndate: ${JSON.stringify(event.date)}\nsource_journal_date: ${JSON.stringify(event.source_journal_date??null)}\nbridge_content_hash: ${JSON.stringify(contentHash)}\nsource_platform: "obsidian"\n---\n# ${normalized.title}\n\n## 事件記錄\n\n${normalized.description}\n${source}`;
    temporary=`${target}.${randomUUID()}.tmp`;
    await writeFile(temporary,markdown,{flag:'wx',flush:true});
    await link(temporary,target);
    await unlink(temporary);temporary=undefined;
    if(await readFile(target,'utf8')!==markdown)throw Error('Life event write verification failed');
    return {id,created:true,replayed:false,path:target};
  }finally{
    if(temporary)await unlink(temporary).catch(()=>{});
    await lock.close();await unlink(`${target}.lock`);
  }
}
