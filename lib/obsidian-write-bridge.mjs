import {lstat, readFile, readdir, realpath, stat} from 'node:fs/promises';
import path from 'node:path';
import {saveJournalAnswers, validJournalDate} from './obsidian-journal-entry.mjs';
import {saveAftereffectFinding} from './obsidian-aftereffect-finding.mjs';
import {saveLifeEvent} from './obsidian-life-event.mjs';
import {parseFrontmatter, prototypeName} from './obsidian-prototype.mjs';

export class BridgeError extends Error {
  constructor(message,status=400,code='invalid_request'){super(message);this.status=status;this.code=code;}
}
const fail=(message,status=400,code='invalid_request')=>{throw new BridgeError(message,status,code);};
const own=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowed=(value,keys)=>{
  if(!value||typeof value!=='object'||Array.isArray(value))fail('JSON object required');
  for(const key of Object.keys(value))if(!keys.includes(key))fail(`Unsupported field: ${key}`);
};
const text=(value,key,max=12000)=>{
  if(typeof value!=='string'||value.length>max||value.includes('\0'))fail(`${key} must be text of at most ${max} characters`);
};
const date=value=>{if(!validJournalDate(value))fail('Valid YYYY-MM-DD date required');};
const submission=value=>{if(typeof value!=='string'||!uuid.test(value))fail('Valid UUID submission_id required');};
const journalFields=['mood','state','emotional_tags','significant_events','thoughts','important_memories','future_plans','followup'];
const valueFromLine=(markdown,key)=>{
  const front=/^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown)?.[1];
  const line=front?.split(/\r?\n/).find(item=>item.startsWith(`${key}:`));
  if(!line)return null;
  const raw=line.slice(key.length+1).trim();
  if(!raw||raw==='null')return null;
  try{return JSON.parse(raw);}catch{return raw;}
};

export async function createObsidianBridge(vault){
  if(typeof vault!=='string'||!vault)fail('Vault path must be configured',500,'configuration_error');
  const resolved=await realpath(vault);
  if(!(await stat(path.join(resolved,'.obsidian')).catch(()=>null))?.isDirectory())fail('Existing Obsidian vault required',500,'configuration_error');
  const root=path.join(resolved,prototypeName);
  if(!(await stat(root).catch(()=>null))?.isDirectory())fail('Personal AI OS vault folder required',500,'configuration_error');
  async function guard(){
    for(const relative of ['.obsidian',prototypeName,`${prototypeName}/Records`,
      `${prototypeName}/Records/Journal`,`${prototypeName}/Records/Risks`,`${prototypeName}/Templates`]){
      const item=path.join(resolved,relative);
      if((await lstat(item)).isSymbolicLink())fail('Vault symlink rejected',403,'unsafe_vault');
    }
    for(const folder of ['Records/Journal','Records/Risks','Records/Events','Records/Findings','Templates','Assets','Views']){
      const directory=path.join(root,folder);
      const info=await lstat(directory).catch(error=>error.code==='ENOENT'?null:Promise.reject(error));
      if(!info)continue;
      if(info.isSymbolicLink()||!info.isDirectory())fail('Record directory is unsafe',403,'unsafe_vault');
      for(const name of await readdir(directory)){
        if((await lstat(path.join(directory,name))).isSymbolicLink())fail('Record symlink rejected',403,'unsafe_vault');
      }
    }
    for(const name of await readdir(root)){
      if(!name.endsWith('.md'))continue;
      if((await lstat(path.join(root,name))).isSymbolicLink())fail('Page symlink rejected',403,'unsafe_vault');
    }
  }
  const relative=absolute=>{
    const result=path.relative(resolved,absolute).replaceAll('\\','/');
    if(result.startsWith('../')||result==='..'||path.isAbsolute(result))fail('Write escaped vault',500,'unsafe_path');
    return result;
  };
  let queue=Promise.resolve();
  const serialized=operation=>{
    const task=queue.then(async()=>{await guard();return operation();});
    queue=task.catch(()=>{});return task;
  };
  async function getJournal(input){
    allowed(input,['date']);date(input.date);await guard();
    const target=path.join(root,'Records','Journal',`${input.date}.md`);
    const markdown=await readFile(target,'utf8').catch(error=>error.code==='ENOENT'?null:Promise.reject(error));
    if(markdown===null)fail('Journal not found',404,'not_found');
    const front=parseFrontmatter(markdown);
    if(front?.record_type!=='journal'||front.date!==input.date)fail('Journal record mismatch',409,'record_conflict');
    return {date:input.date,path:relative(target),fields:Object.fromEntries(journalFields.map(key=>[key,valueFromLine(markdown,key)]))};
  }
  return {
    async upsertJournal(input){
      allowed(input,['date','submission_id',...journalFields]);date(input.date);
      if(own(input,'submission_id'))submission(input.submission_id);
      const answers={date:input.date};
      for(const key of journalFields){
        if(!own(input,key))continue;
        const value=input[key];
        if(key==='mood'||key==='state'){
          if(!Number.isInteger(value)||value<1||value>10)fail(`${key} must be an integer from 1 to 10`);
        }else if(key==='emotional_tags'){
          if(!Array.isArray(value)||value.length>20||value.some(tag=>typeof tag!=='string'||!tag.trim()||tag.length>80))fail('Invalid emotional_tags');
        }else text(value,key);
        answers[key]=value;
      }
      if(Object.keys(answers).length===1)fail('At least one journal answer required');
      return serialized(async()=>{
        const written=await saveJournalAnswers(resolved,answers,{submissionId:input.submission_id});
        const saved=await getJournal({date:input.date});
        for(const key of Object.keys(answers))if(key!=='date'&&JSON.stringify(saved.fields[key])!==JSON.stringify(answers[key]))fail('Submission was superseded by a later update',409,'superseded');
        return {...saved,created:written.created,updated:written.updated,replayed:written.replayed,chart_error:written.chart_error};
      });
    },
    getJournal,
    async verifyJournal(input){
      allowed(input,['date','expected']);date(input.date);
      if(own(input,'expected')){
        allowed(input.expected,journalFields);
        for(const [key,value] of Object.entries(input.expected)){
          if(key==='mood'||key==='state'){
            if(!Number.isInteger(value)||value<1||value>10)fail(`Invalid expected ${key}`);
          }else if(key==='emotional_tags'){
            if(!Array.isArray(value)||value.some(item=>typeof item!=='string'))fail('Invalid expected tags');
          }else text(value,key);
        }
      }
      try{
        const saved=await getJournal({date:input.date});
        return {...saved,exists:true,matches:Object.entries(input.expected??{}).every(([key,value])=>JSON.stringify(saved.fields[key])===JSON.stringify(value))};
      }catch(error){if(error.code==='not_found')return {date:input.date,exists:false,matches:false};throw error;}
    },
    async listRecentJournals(input={}){
      allowed(input,['limit']);const limit=input.limit??10;
      if(!Number.isInteger(limit)||limit<1||limit>30)fail('limit must be 1..30');
      await guard();
      const names=(await readdir(path.join(root,'Records','Journal'))).filter(name=>/^\d{4}-\d{2}-\d{2}\.md$/.test(name)).sort().reverse().slice(0,limit);
      return {journals:await Promise.all(names.map(name=>getJournal({date:name.slice(0,-3)})))};
    },
    async addLifeEvent(input){
      allowed(input,['submission_id','date','title','description','source_journal_date']);
      submission(input.submission_id);date(input.date);
      text(input.title,'title',160);if(!input.title.trim()||/[\r\n]/.test(input.title))fail('Valid single-line title required');
      text(input.description,'description');if(!input.description.trim())fail('Event description required');
      if(own(input,'source_journal_date'))date(input.source_journal_date);
      return serialized(async()=>{
        const result=await saveLifeEvent(resolved,input);
        const saved=await readFile(result.path,'utf8');
        const front=parseFrontmatter(saved);
        if(front?.event_id!==result.id||front.date!==input.date)fail('Event write verification failed',500,'write_failed');
        return {id:result.id,path:relative(result.path),created:result.created,replayed:result.replayed,source_journal_date:input.source_journal_date??null};
      });
    },
    async addAftereffectFinding(input){
      allowed(input,['date','source_journal_date','source_event_id','facts','hypotheses','unknowns','followup']);date(input.date);
      if(own(input,'source_journal_date'))date(input.source_journal_date);
      if(own(input,'source_event_id')){
        text(input.source_event_id,'source_event_id',120);
        if(!/^[\p{L}\p{N}._-]+$/u.test(input.source_event_id))fail('Invalid source_event_id');
      }
      if(!input.source_journal_date&&!input.source_event_id)fail('Finding source required');
      for(const key of ['facts','hypotheses','unknowns','followup'])if(own(input,key))text(input[key],key);
      if(!['facts','hypotheses','unknowns'].some(key=>input[key]?.trim()))fail('A fact, hypothesis or unknown is required');
      return serialized(async()=>{
        const result=await saveAftereffectFinding(resolved,input);
        const saved=await readFile(result.path,'utf8');
        if(parseFrontmatter(saved)?.finding_id!==result.id||!saved.includes('<!-- aftereffect-finding:end -->'))fail('Finding write verification failed',500,'write_failed');
        for(const source of result.source_paths){
          if(!saved.includes(`[[${source.replace(/\.md$/,'')}]]`))fail('Finding source link verification failed',500,'write_failed');
        }
        return {id:result.id,path:relative(result.path),created:result.created,updated:result.updated,sources:result.sources,chart_error:result.chart_error};
      });
    },
  };
}
