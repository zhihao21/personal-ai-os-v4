import {mkdir,readFile,writeFile,link,unlink,lstat} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';
import path from 'node:path';

const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const marker=/^<!-- the-unseen-original:(\{[^\r\n]*\}) -->$/gm;
const indexKey='original_submissions_index';
const digest=text=>createHash('sha256').update(text,'utf8').digest('hex');
const originalsRoot=(journalDir,date)=>path.join(journalDir,'Originals',date);
const originalPath=(journalDir,date,id)=>path.join(originalsRoot(journalDir,date),`${id}.txt`);

export function validateOriginal({id,text,submittedAt,sourceReference}){
  if(typeof id!=='string'||!uuid.test(id))throw Error('Original submission UUID required');
  if(typeof text!=='string'||!text.length||text.includes('\0'))throw Error('Complete original_text required');
  if(submittedAt!==undefined&&(typeof submittedAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(submittedAt)||Number.isNaN(Date.parse(submittedAt))))throw Error('Valid submitted_at with timezone required');
  if(sourceReference!==undefined&&(typeof sourceReference!=='string'||!sourceReference.trim()||sourceReference.length>500||/[\r\n\0]/.test(sourceReference)||sourceReference.includes('-->')))throw Error('Valid single-line source_reference required');
}

async function safeDirectory(directory){
  const info=await lstat(directory).catch(error=>error.code==='ENOENT'?null:Promise.reject(error));
  if(info?.isSymbolicLink()||info&&!info.isDirectory())throw Error('Unsafe original submission directory');
  if(!info)await mkdir(directory);
}

export async function preserveOriginal(journalDir,date,submission){
  validateOriginal(submission);
  const parent=path.join(journalDir,'Originals');
  await safeDirectory(parent);
  await safeDirectory(originalsRoot(journalDir,date));
  const target=originalPath(journalDir,date,submission.id);
  const existing=await lstat(target).catch(error=>error.code==='ENOENT'?null:Promise.reject(error));
  if(existing?.isSymbolicLink()||existing&&!existing.isFile())throw Error('Unsafe original submission file');
  if(!existing){
    const temporary=`${target}.${randomUUID()}.tmp`;
    try{
      await writeFile(temporary,submission.text,{flag:'wx',flush:true});
      try{await link(temporary,target);}catch(error){if(error.code!=='EEXIST')throw error;}
    }finally{await unlink(temporary).catch(()=>{});}
  }
  if(await readFile(target,'utf8')!==submission.text)throw Error('Original submission ID conflicts with stored text');
  return {id:submission.id,sha256:digest(submission.text),submitted_at:submission.submittedAt??null,source_reference:submission.sourceReference??null};
}

export function appendOriginalBlock(markdown,metadata,text){
  markdown=normalizeOriginalPresentation(markdown);
  const existing=readOriginalMetadata(markdown).find(item=>item.id===metadata.id);
  if(existing){
    if(JSON.stringify(existing)!==JSON.stringify(metadata))throw Error('Original submission metadata conflict');
    return markdown;
  }
  const longest=Math.max(3,...(text.match(/`+/g)??[]).map(run=>run.length+1));
  const fence='`'.repeat(longest);
  const quoted=text.split('\n').map(line=>`> ${line}`).join('\n');
  const label=metadata.submitted_at?`原始提交 · ${metadata.submitted_at}`:'原始提交';
  const block=`> [!quote]- ${label}\n> ${fence}text\n${quoted}\n> ${fence}`;
  return setIndex(markdown,[...readOriginalMetadata(markdown),metadata])+(markdown.endsWith('\n')?'':'\n')+`\n${block}\n`;
}

function legacyMetadata(markdown){
  const found=[];
  for(const match of markdown.matchAll(marker)){
    let data;
    try{data=JSON.parse(match[1]);}catch{throw Error('Invalid original submission metadata');}
    if(!data||!uuid.test(data.id??'')||!(/^[0-9a-f]{64}$/.test(data.sha256??'')))throw Error('Invalid original submission metadata');
    if(found.some(item=>item.id===data.id))throw Error('Duplicate original submission ID');
    found.push(data);
  }
  return found;
}

function setIndex(markdown,items){
  const front=/^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown);
  if(!front)throw Error('Journal note has no frontmatter');
  const line=`${indexKey}: ${JSON.stringify(items)}`;
  const body=/^original_submissions_index:.*$/m.test(front[1])?front[1].replace(/^original_submissions_index:.*$/m,line):front[1]+`\n${line}`;
  return markdown.replace(front[0],`---\n${body}\n---`);
}

export function readOriginalMetadata(markdown){
  const front=/^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown)?.[1];
  const line=front?.split(/\r?\n/).find(value=>value.startsWith(`${indexKey}:`));
  let items;
  if(line){
    try{items=JSON.parse(line.slice(indexKey.length+1).trim());}catch{throw Error('Invalid original submission index');}
    if(!Array.isArray(items))throw Error('Invalid original submission index');
    const ids=new Set();
    for(const data of items){
      if(!data||!uuid.test(data.id??'')||!(/^[0-9a-f]{64}$/.test(data.sha256??''))||ids.has(data.id))throw Error('Invalid original submission index');
      ids.add(data.id);
    }
  }
  const legacy=legacyMetadata(markdown);
  if(items&&legacy.length&&JSON.stringify(items)!==JSON.stringify(legacy))throw Error('Original submission metadata conflict');
  return items??legacy;
}

export function normalizeOriginalPresentation(markdown){
  const legacy=legacyMetadata(markdown);
  if(!legacy.length)return markdown;
  const items=readOriginalMetadata(markdown);
  let next=setIndex(markdown,items);
  next=next.replace(/^<!-- the-unseen-original:\{[^\r\n]*\} -->\r?\n/gm,'');
  next=next.replace(/^<!-- the-unseen-original:end -->\r?\n?/gm,'');
  return next;
}

export async function readOriginalSubmissions(journalDir,date,markdown){
  const result=[];
  for(const metadata of readOriginalMetadata(markdown)){
    const target=originalPath(journalDir,date,metadata.id);
    const info=await lstat(target);
    if(!info.isFile()||info.isSymbolicLink())throw Error('Unsafe original submission file');
    const text=await readFile(target,'utf8');
    if(digest(text)!==metadata.sha256)throw Error('Original submission integrity check failed');
    result.push({...metadata,original_text:text});
  }
  return result;
}
