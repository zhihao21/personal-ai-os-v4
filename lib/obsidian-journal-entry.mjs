import {readFile, readdir, writeFile, stat, open, rename, unlink, link} from 'node:fs/promises';
import {createHash, randomUUID} from 'node:crypto';
import path from 'node:path';
import {parseFrontmatter, prototypeName} from './obsidian-prototype.mjs';
import {renderCharts} from './obsidian-charts.mjs';

const fields={mood:'mood',state:'state',emotional_tags:'emotional_tags',significant_events:'significant_events',thoughts:'thoughts',important_memories:'important_memories',future_plans:'future_plans',followup:'followup'};
const bodyStart='<!-- the-unseen-journal:start -->';
const bodyEnd='<!-- the-unseen-journal:end -->';
const visibleFields=['mood','state','emotional_tags','significant_events','thoughts','important_memories','future_plans','followup'];
const templateBody=date=>`# ${date}｜每日生活日誌\n\n## 今日事件\n\n## 想法與擔憂\n\n## 重要回憶\n\n## 未來計畫\n\n> [!note]- 詳細回顧\n> `;
function journalValues(markdown){
  const front=/^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown)?.[1];
  if(front===undefined)throw Error('Journal note has no frontmatter');
  const values={};
  for(const key of visibleFields){
    const line=front.split(/\r?\n/).find(item=>item.startsWith(`${key}:`));
    if(!line)continue;
    const raw=line.slice(key.length+1).trim();
    if(!raw)continue;
    try{values[key]=JSON.parse(raw);}catch{values[key]=raw;}
  }
  return values;
}
function quoteLines(value){return String(value).split(/\r?\n/).map(line=>`> ${line}`).join('\n');}
function renderJournalBody(markdown){
  const values=journalValues(markdown);
  const tags=Array.isArray(values.emotional_tags)?values.emotional_tags.filter(Boolean).join('、'):'';
  const details=[['今日事件',values.significant_events],['想法與擔憂',values.thoughts],['重要回憶',values.important_memories],['未來計畫',values.future_plans],['後續追蹤',values.followup]]
    .filter(([,value])=>typeof value==='string'&&value.trim());
  const score=value=>value==null?'未填寫':`${value}/10`;
  const summary=[bodyStart,'','> [!summary] 今日摘要',`> 心情：**${score(values.mood)}** · 今日狀態：**${score(values.state)}**`,
    `> 情緒：${tags||'未填寫'}`,`> 已記錄：${details.length?details.map(([label])=>label).join('、'):'尚無文字記錄'}`,'',
    ...details.flatMap(([label,value])=>[`> [!note]- ${label}`,quoteLines(value),'']),bodyEnd].join('\n');
  const frontEnd=/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/.exec(markdown)?.[0];
  if(!frontEnd)throw Error('Journal note has no frontmatter');
  const front=markdown.slice(0,frontEnd.length).replace(/\r?\n?$/,'\n');
  let body=markdown.slice(frontEnd.length);
  const start=body.indexOf(bodyStart),end=body.indexOf(bodyEnd);
  if(start!==-1||end!==-1){
    if(start===-1||end<start)throw Error('Incomplete journal display markers');
    return front+body.slice(0,start)+summary+body.slice(end+bodyEnd.length);
  }
  const date=values.date??parseFrontmatter(markdown)?.date;
  if(body.trim()===templateBody(date).trim())body='';
  return front+summary+'\n'+(body.trim()?`\n${body}`:'');
}
export const taipeiDate=(now=new Date())=>{
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part=>[part.type,part.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
export const validJournalDate=value=>{
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const [year,month,day]=value.split('-').map(Number),actual=new Date(Date.UTC(year,month-1,day));
  return actual.getUTCFullYear()===year&&actual.getUTCMonth()===month-1&&actual.getUTCDate()===day;
};

function validate(answers){
  if(!answers||typeof answers!=='object'||!validJournalDate(answers.date))throw Error('Valid YYYY-MM-DD date required');
  if(Object.keys(answers).length===1)throw Error('At least one questionnaire answer required');
  for(const key of Object.keys(answers))if(key!=='date'&&!Object.hasOwn(fields,key))throw Error(`Unknown questionnaire field: ${key}`);
  for(const key of ['mood','state'])if(Object.hasOwn(answers,key)&&(!Number.isInteger(answers[key])||answers[key]<1||answers[key]>10))throw Error(`${key} must be an integer from 1 to 10`);
  if(Object.hasOwn(answers,'emotional_tags')&&(!Array.isArray(answers.emotional_tags)||!answers.emotional_tags.every(x=>typeof x==='string')))throw Error('emotional_tags must be strings');
  for(const key of ['significant_events','thoughts','important_memories','future_plans','followup'])if(Object.hasOwn(answers,key)&&typeof answers[key]!=='string')throw Error(`${key} must be text`);
}

function updateFrontmatter(markdown,answers,submissionId){
  const match=/^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if(!match)throw Error('Journal note has no frontmatter');
  const current=parseFrontmatter(markdown);
  if(current.record_type!=='journal'||current.date!==answers.date)throw Error('Journal type or date mismatch');
  const hash=createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(answers).sort(([a],[b])=>a.localeCompare(b))))).digest('hex');
  let submissions={};
  if(current.bridge_submissions){
    try{submissions=JSON.parse(current.bridge_submissions);}catch{throw Error('Invalid bridge submission metadata');}
    if(!submissions||typeof submissions!=='object'||Array.isArray(submissions))throw Error('Invalid bridge submission metadata');
  }
  if(submissionId&&Object.hasOwn(submissions,submissionId)){
    if(submissions[submissionId]!==hash)throw Error('Submission ID already used with different answers');
    return {text:renderJournalBody(markdown),replayed:true};
  }
  let front=match[1];
  for(const [answerKey,property] of Object.entries(fields)){
    if(!Object.hasOwn(answers,answerKey))continue;
    const line=`${property}: ${JSON.stringify(answers[answerKey])}`;
    const pattern=new RegExp(`^${property}:.*$`,'m');
    front=pattern.test(front)?front.replace(pattern,line):front+`\n${line}`;
  }
  if(submissionId){
    submissions[submissionId]=hash;
    const line=`bridge_submissions: ${JSON.stringify(submissions)}`;
    front=/^bridge_submissions:.*$/m.test(front)?front.replace(/^bridge_submissions:.*$/m,line):front+`\n${line}`;
  }
  return {text:renderJournalBody(markdown.replace(match[1],front)),replayed:false};
}

export async function saveJournalAnswers(vault,answers,{submissionId}={}){
  validate(answers);
  if(submissionId!==undefined&&(typeof submissionId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)))throw Error('Valid UUID submissionId required');
  const root=path.join(vault,prototypeName),journalDir=path.join(root,'Records','Journal');
  if(!(await stat(path.join(vault,'.obsidian')).catch(()=>null))?.isDirectory())throw Error('Existing Obsidian vault required');
  const filename=`${answers.date}.md`,target=path.join(journalDir,filename);
  const lockPath=target+'.lock',lock=await open(lockPath,'wx');
  let created=false,updated=false,temporary,replayed=false;
  try{
    const matches=[];
    for(const name of await readdir(journalDir)){
      if(!name.endsWith('.md'))continue;
      const note=await readFile(path.join(journalDir,name),'utf8');
      if(parseFrontmatter(note)?.date===answers.date)matches.push(name);
    }
    if(matches.length>1)throw Error('Duplicate journal date in vault');
    if(matches.length===1&&matches[0]!==filename)throw Error('Date already exists under a different filename');
    let prior;
    if(matches.length)prior=await readFile(target,'utf8');
    else{
      const templateNames=await readdir(path.join(root,'Templates'));
      const candidates=[];
      for(const name of templateNames){if(!name.endsWith('.md'))continue;const content=await readFile(path.join(root,'Templates',name),'utf8');if(parseFrontmatter(content)?.record_type==='journal')candidates.push(content);}
      if(candidates.length!==1)throw Error('Expected exactly one journal template');
      prior=candidates[0].replaceAll('{{date:YYYY-MM-DD}}',answers.date);
      created=true;
    }
    const result=updateFrontmatter(prior,answers,submissionId);
    const next=result.text;replayed=result.replayed;
    if(created){
      temporary=`${target}.${randomUUID()}.tmp`;
      await writeFile(temporary,next,{flag:'wx',flush:true});
      await link(temporary,target);
      await unlink(temporary);temporary=undefined;
    }
    else if(next!==prior){
      temporary=`${target}.${randomUUID()}.tmp`;
      await writeFile(temporary,next,{flag:'wx',flush:true});
      if(await readFile(target,'utf8')!==prior)throw Error('Journal changed during update');
      await rename(temporary,target);
      temporary=undefined;updated=true;
    }
    if(await readFile(target,'utf8')!==next)throw Error('Journal write verification failed');
  }finally{
    if(temporary)await unlink(temporary).catch(()=>{});
    await lock.close();await unlink(lockPath);
  }
  let charts,chartError;
  try{charts=await renderCharts(root);}catch(error){chartError=error.message;}
  return {created,updated,replayed,record_count:charts?.journal??null,chart_error:chartError??null,path:target};
}
