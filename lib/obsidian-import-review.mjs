import {readFile, readdir, writeFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {prototypeName} from './obsidian-prototype.mjs';

const uuidFromUrl = url => (String(url).match(/([0-9a-f]{32})(?:[/?#]|$)/i)?.[1] ?? '').toLowerCase();
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const headings={Journal:'生活日誌',Risks:'生活風險',Observations:'延後觀察',Tasks:'任務',Schedule:'行程',Academic:'學習',Projects:'專案',Finance:'財務',Health:'健康',Goals:'目標',Analysis:'分析回顧',Resources:'資源',Structure:'人生架構'};

export async function reviewNotionImport({vault,snapshotDir,manifestPath,attachmentMap={}}) {
  const root=path.join(vault,prototypeName);
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  const files=(await readdir(snapshotDir)).filter(name=>name.endsWith('.json'));
  const counts={},failures=[],sections=new Map(),all=[];
  for(const file of files){
    const source=JSON.parse(await readFile(path.join(snapshotDir,file),'utf8'));
    counts[source.source_title]=source.records.length;
    for(const record of source.records)all.push(record);
  }
  let verified=0,relationshipLinks=0,relationshipLinksMissing=0,unresolvedRelationships=0,attachmentsVerified=0,attachmentsUnresolved=0,manifestChanged=false;
  for(const record of all){
    const id=uuidFromUrl(record.row.url),entry=manifest.records[id];
    if(!entry){failures.push({id,error:'Not in manifest'});continue;}
    const target=path.join(root,...entry.path.split('/'));
    let note;
    try{note=await readFile(target,'utf8');}catch{failures.push({id,error:'Note missing'});continue;}
    if(!note.includes(`source_record_id: "${id}"`)){failures.push({id,error:'Source ID mismatch'});continue;}
    const original=/<properties>\s*([\s\S]*?)\s*<\/properties>/.exec(record.page.text);
    if(!original){failures.push({id,error:'Source properties missing'});continue;}
    const stored=/^original_properties_json: (.+)$/m.exec(note);
    try{
      if(!stored || JSON.stringify(JSON.parse(JSON.parse(stored[1])))!==JSON.stringify(JSON.parse(original[1])))throw Error();
    }catch{failures.push({id,error:'Properties differ'});continue;}
    const sourceBody=/<content>\s*([\s\S]*?)\s*<\/content>/.exec(record.page.text)?.[1]?.trim()??'';
    if(sourceBody && !note.includes(sourceBody.split(/\r?\n/).map(line=>`> ${line}`).join('\n'))){
      failures.push({id,error:'Page body differs'});continue;
    }
    if(record.page.page_last_edited_at && !note.includes(`source_last_edited_at: "${record.page.page_last_edited_at}"`)){
      failures.push({id,error:'Last-edited timestamp differs'});continue;
    }
    const folder=entry.path.split('/')[1],heading=headings[folder]??folder;
    if(!sections.has(heading))sections.set(heading,[]);
    const title=String(record.page.title||id).replaceAll('|','｜').replaceAll(']','）');
    sections.get(heading).push(`- [[${entry.path.replace(/\.md$/,'')}|${title}]]`);
    const refs=[...new Set(JSON.stringify(JSON.parse(original[1])).match(/https:\/\/(?:app\.)?notion\.(?:com|so)\/p\/[0-9a-f]{32}/gi)||[])].map(uuidFromUrl).filter(other=>other!==id);
    const missingLinks=[];
    for(const other of refs){
      const related=manifest.records[other];
      if(!related)unresolvedRelationships++;
      else if(note.includes(`[[${related.path.replace(/\.md$/,'')}]]`))relationshipLinks++;
      else missingLinks.push(`[[${related.path.replace(/\.md$/,'')}]]`);
    }
    if(missingLinks.length && hash(note)===entry.content_hash){
      note=note.trimEnd()+`\n\n> [!note]- 補齊關聯\n`+missingLinks.map(link=>`> - ${link}`).join('\n')+'\n';
      await writeFile(target,note);
      entry.content_hash=hash(note);
      manifestChanged=true;
      relationshipLinks+=missingLinks.length;
    }else{
      relationshipLinksMissing+=missingLinks.length;
    }
    for(const ref of record.page.text.match(/notion-file-block:\/\/[^\s)>"']+/g)||[]){
      const rel=attachmentMap[ref];
      if(rel && (await stat(path.join(root,...rel.split('/'))).catch(()=>null))?.isFile())attachmentsVerified++;
      else attachmentsUnresolved++;
    }
    verified++;
  }
  const lines=['---','cssclasses:','  - personal-ai-os-dashboard','---','# 歷史資料','',`已匯入 ${verified} 筆紀錄。點開分類查看原始頁面；個人詳情保留在各筆筆記的摺疊區塊。`,''];
  for(const [heading,links] of sections){lines.push(`> [!note]- ${heading}（${links.length}）`,...links.map(link=>`> ${link}`),'>');}
  const index=path.join(root,'歷史資料.md');
  try{await writeFile(index,lines.join('\n')+'\n',{flag:'wx'});}catch(error){
    if(error.code!=='EEXIST')throw error;
    const old=await readFile(index,'utf8');
    const added=[...sections.values()].flat().filter(link=>!old.includes(link));
    if(added.length)await writeFile(index,old.trimEnd()+`\n\n> [!note]- 新增紀錄（${added.length}）\n`+added.map(link=>`> ${link}`).join('\n')+'\n');
  }
  const dashboard=path.join(root,'The Unseen.md');
  const dashboardText=await readFile(dashboard,'utf8');
  if(!dashboardText.includes('[[歷史資料'))await writeFile(dashboard,dashboardText.trimEnd()+'\n\n[[歷史資料|日誌・風險・任務與其他歷史資料]]\n');
  if(manifestChanged)await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  return {source_records:all.length,verified,by_source:counts,relationship_links:relationshipLinks,relationship_links_missing:relationshipLinksMissing,unresolved_relationships:unresolvedRelationships,attachments_verified:attachmentsVerified,attachments_unresolved:attachmentsUnresolved,failures};
}
