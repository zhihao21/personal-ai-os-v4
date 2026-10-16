import {readFile, readdir, writeFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {parseFrontmatter, prototypeName} from './obsidian-prototype.mjs';
import {renderCharts} from './obsidian-charts.mjs';

const fields={mood:'mood',state:'state',emotional_tags:'emotional_tags',significant_events:'significant_events',thoughts:'thoughts',important_memories:'important_memories',future_plans:'future_plans',followup:'followup'};
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(`${value}T12:00:00Z`));

function validate(answers){
  if(!answers||typeof answers!=='object'||!validDate(answers.date))throw Error('Valid YYYY-MM-DD date required');
  for(const key of Object.keys(answers))if(key!=='date'&&!Object.hasOwn(fields,key))throw Error(`Unknown questionnaire field: ${key}`);
  for(const key of ['mood','state'])if(Object.hasOwn(answers,key)&&(!Number.isInteger(answers[key])||answers[key]<1||answers[key]>10))throw Error(`${key} must be an integer from 1 to 10`);
  if(Object.hasOwn(answers,'emotional_tags')&&(!Array.isArray(answers.emotional_tags)||!answers.emotional_tags.every(x=>typeof x==='string')))throw Error('emotional_tags must be strings');
  for(const key of ['significant_events','thoughts','important_memories','future_plans','followup'])if(Object.hasOwn(answers,key)&&typeof answers[key]!=='string')throw Error(`${key} must be text`);
}

function updateFrontmatter(markdown,answers){
  const match=/^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if(!match)throw Error('Journal note has no frontmatter');
  const current=parseFrontmatter(markdown);
  if(current.record_type!=='journal'||current.date!==answers.date)throw Error('Journal type or date mismatch');
  let front=match[1];
  for(const [answerKey,property] of Object.entries(fields)){
    if(!Object.hasOwn(answers,answerKey))continue;
    const line=`${property}: ${JSON.stringify(answers[answerKey])}`;
    const pattern=new RegExp(`^${property}:.*$`,'m');
    front=pattern.test(front)?front.replace(pattern,line):front+`\n${line}`;
  }
  return markdown.replace(match[1],front);
}

export async function saveJournalAnswers(vault,answers){
  validate(answers);
  const root=path.join(vault,prototypeName),journalDir=path.join(root,'Records','Journal');
  if(!(await stat(path.join(vault,'.obsidian')).catch(()=>null))?.isDirectory())throw Error('Existing Obsidian vault required');
  const matches=[];
  for(const name of await readdir(journalDir)){
    if(!name.endsWith('.md'))continue;
    const note=await readFile(path.join(journalDir,name),'utf8');
    if(parseFrontmatter(note)?.date===answers.date)matches.push(name);
  }
  if(matches.length>1)throw Error('Duplicate journal date in vault');
  const filename=`${answers.date}.md`,target=path.join(journalDir,filename);
  if(matches.length===1&&matches[0]!==filename)throw Error('Date already exists under a different filename');
  let prior,created=false;
  if(matches.length){prior=await readFile(target,'utf8');}
  else{
    const templateNames=await readdir(path.join(root,'Templates'));
    const candidates=[];
    for(const name of templateNames){if(!name.endsWith('.md'))continue;const content=await readFile(path.join(root,'Templates',name),'utf8');if(parseFrontmatter(content)?.record_type==='journal')candidates.push(content);}
    if(candidates.length!==1)throw Error('Expected exactly one journal template');
    prior=candidates[0].replaceAll('{{date:YYYY-MM-DD}}',answers.date);
    created=true;
  }
  const next=updateFrontmatter(prior,answers);
  if(created)await writeFile(target,next,{flag:'wx'});
  else if(next!==prior)await writeFile(target,next);
  const saved=await readFile(target,'utf8');
  if(saved!==next)throw Error('Journal write verification failed');
  const charts=await renderCharts(root);
  return {created,updated:!created&&next!==prior,record_count:charts.journal,path:target};
}
