import {createHash} from 'node:crypto';
import {mkdir, readFile, readdir, stat, writeFile, rename} from 'node:fs/promises';
import path from 'node:path';
import {prototypeName, parseFrontmatter} from './obsidian-prototype.mjs';
import {renderCharts} from './obsidian-charts.mjs';

const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const uuidFromUrl = url => (String(url).match(/([0-9a-f]{32})(?:[/?#]|$)/i)?.[1] ?? '').toLowerCase();
const yaml = value => JSON.stringify(value ?? null);
const noteLink = relative => `[[${relative.replace(/\.md$/,'')}]]`;
const quoteBlock = text => String(text || '').split(/\r?\n/).map(line => `> ${line}`).join('\n');
const numeric = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
const array = value => {
  if (Array.isArray(value)) return value;
  if (typeof value !== 'string') return [];
  try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
};

function pageParts(page) {
  if (!page?.text) throw Error('Missing fetched page content');
  const properties = /<properties>\s*([\s\S]*?)\s*<\/properties>/.exec(page.text);
  if (!properties) throw Error('Missing page properties');
  const content = /<content>\s*([\s\S]*?)\s*<\/content>/.exec(page.text);
  return {properties: JSON.parse(properties[1]), content: content?.[1]?.trim() ?? ''};
}

function normalized(folder, source) {
  const p = source.properties;
  if (folder === 'Journal') return {
    record_type:'journal', date:p['date:日期:start'] ?? null,
    mood:numeric(p['心情分數']), state:numeric(p['今日狀態分數']),
    emotional_tags:array(p['心情標籤']), followup:p['待追蹤事項'] ?? '',
    future_plans:p['未來計畫'] ?? ''
  };
  if (folder === 'Risks') return {
    record_type:'emotional_event', event_id:p['事件 ID'] ?? null,
    direction:p['方向']==='正向'?'positive':p['方向']==='負向'?'negative':null,
    lifecycle:p['生命週期']==='目前追蹤'?'current':p['生命週期']==='歷史已結束'?'closed':null,
    severity:p['風險分級']==='高'?'high':p['風險分級']==='中'?'medium':p['風險分級']==='低'?'low':null,
    domains:array(p['風險領域']), occurred_at:p['date:高峰時間:start'] ?? null,
    historical_score:numeric(p['暫定總分']), historical_scale_max:p['事件 ID']==='EA-NEG-001'?24:null,
    next_action:p['下一步'] ?? ''
  };
  if (folder === 'Observations') return {
    record_type:'emotional_observation', event_id:p['事件 ID'] ?? null,
    observed_at:p['date:觀察時間:start'] ?? null,
    original_scale:p['原始量尺'] ?? null, observed_value:numeric(p['觀察值'])
  };
  if (folder === 'Tasks') return {
    record_type:'task', task_id:p['來源識別碼'] ?? null,
    due:p['date:日期:start'] ?? null, status:p['狀態']==='完成'?'done':'open',
    priority:p['優先級'] ?? null, domain:'life'
  };
  if (folder === 'Schedule') return {
    record_type:'schedule', schedule_id:p['來源識別碼'] ?? null,
    starts_at:p['date:日期:start'] ?? null, ends_at:p['date:日期:end'] ?? null,
    domain:p['類別'] ?? 'life'
  };
  return {record_type:folder.toLowerCase()};
}

function renderNote(item, map, attachments) {
  const {source, sourceId, relative, folder, parts} = item;
  const p = parts.properties;
  const fields = {
    ...normalized(folder, parts), source_platform:'notion', source_record_id:sourceId,
    source_data_source:item.sourceUrl, source_url:source.page.url,
    source_last_edited_at:source.page.page_last_edited_at ?? null,
    original_properties_json:JSON.stringify(p)
  };
  if (folder === 'Risks' && fields.event_id === 'EA-NEG-001') {
    if (fields.historical_score !== 21 || fields.lifecycle !== 'closed' || fields.severity !== 'high')
      throw Error('EA-NEG-001 historical classification mismatch');
  }
  const frontmatter=Object.entries(fields).map(([key,value])=>`${key}: ${yaml(value)}`).join('\n');
  const body=[];
  const title=String(source.page.title || p['標題'] || p['名稱'] || p['事件'] || sourceId).replace(/\r?\n/g,' ');
  body.push(`# ${title}`);
  const relations=[...new Set(JSON.stringify(p).match(/https:\/\/(?:app\.)?notion\.(?:com|so)\/p\/[0-9a-f]{32}/gi)||[])].map(uuidFromUrl).filter(id=>id!==sourceId);
  if (relations.length) {
    body.push('## 關聯記錄');
    for (const id of relations) body.push(map.has(id)?`- ${noteLink(map.get(id))}`:`- Notion ID: ${id}（來源未匯入）`);
  }
  const refs=String(source.page.text).match(/notion-file-block:\/\/[^\s)>"']+/g)||[];
  if (refs.length) {
    body.push('## 附件');
    for (const ref of refs) body.push(attachments[ref]?`- [[${attachments[ref]}]]`:`- 未下載：${ref}`);
  }
  body.push('> [!note]- 原始 Notion 內容與欄位');
  body.push(quoteBlock(parts.content || '（此頁無內文；原始欄位如下）'));
  body.push('>');
  body.push('> ```json');
  body.push(quoteBlock(JSON.stringify(p,null,2)));
  body.push('> ```');
  return `---\n${frontmatter}\n---\n${body.join('\n')}\n`;
}

async function filesUnder(directory) {
  const result=[];
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const full=path.join(directory,entry.name);
    if (entry.isDirectory()) result.push(...await filesUnder(full));
    else if (entry.isFile() && entry.name.endsWith('.md')) result.push(full);
  }
  return result;
}

async function saveManifest(target, manifest) {
  const temporary=target+'.tmp';
  await writeFile(temporary,JSON.stringify(manifest,null,2)+'\n',{flag:'w'});
  await rename(temporary,target);
}

export async function importNotionSnapshots({vault,snapshotDir,mappingPath,manifestPath,backupPath}) {
  const root=path.join(vault,prototypeName);
  if (!(await stat(path.join(vault,'.obsidian')).catch(()=>null))?.isDirectory()) throw Error('Existing Obsidian vault required');
  if (!(await stat(backupPath).catch(()=>null))?.isDirectory()) throw Error('Verified vault backup directory required');
  const mapping=JSON.parse(await readFile(mappingPath,'utf8'));
  const manifest=await readFile(manifestPath,'utf8').then(JSON.parse).catch(error=>error.code==='ENOENT'?{version:1,records:{},failures:[]}:Promise.reject(error));
  const sourceFiles=(await readdir(snapshotDir)).filter(name=>name.endsWith('.json')).sort();
  const items=[], failures=[];
  for (const name of sourceFiles) {
    const source=JSON.parse(await readFile(path.join(snapshotDir,name),'utf8'));
    const config=mapping.sources[source.source_url];
    if (!config?.folder) { failures.push({source:source.source_url,error:'Missing category mapping'}); continue; }
    for (const record of source.records) {
      try {
        const sourceId=uuidFromUrl(record.row.url);
        if (!sourceId) throw Error('Missing source page ID');
        const parts=pageParts(record.page);
        const date=parts.properties['date:日期:start'];
        if(config.folder==='Journal' && !/^\d{4}-\d{2}-\d{2}$/.test(date??'')) throw Error('Missing journal date');
        const filename=config.folder==='Journal'?`${date}.md`:`${sourceId}.md`;
        const relative=`Records/${config.folder}/${filename}`;
        items.push({source:record,sourceId,sourceUrl:source.source_url,folder:config.folder,relative,parts});
      } catch (error) { failures.push({source:record.row.url,error:error.message}); }
    }
  }
  const byId=new Map(items.map(item=>[item.sourceId,item.relative]));
  const byPath=new Set(),duplicateIds=new Set();
  for(const item of items){if(byPath.has(item.relative))duplicateIds.add(item.sourceId);byPath.add(item.relative);}
  const existing=await filesUnder(root);
  const existingIds=new Map();
  for (const file of existing) {
    const data=parseFrontmatter(await readFile(file,'utf8'));
    if(data?.source_record_id)existingIds.set(String(data.source_record_id).replaceAll('-','').toLowerCase(),file);
  }
  let imported=0,skipped=0,conflicted=0;
  const counts={};
  for(const item of items){
    const {sourceId,relative,folder}=item;
    const target=path.join(root,...relative.split('/'));
    const sourceHash=hash({page:item.source.page,row:item.source.row});
    try {
      if(duplicateIds.has(sourceId))throw Error('Duplicate destination journal date');
      const prior=manifest.records[sourceId];
      if(prior){
        if(prior.path!==relative || prior.source_hash!==sourceHash || !(await stat(target).catch(()=>null)))throw Error('Existing mapping differs or file missing');
        skipped++;continue;
      }
      if(existingIds.has(sourceId))throw Error('Source ID already exists in a vault note');
      if(await stat(target).catch(()=>null))throw Error('Destination note already exists');
      const markdown=renderNote(item,byId,mapping.attachments??{});
      await mkdir(path.dirname(target),{recursive:true});
      await writeFile(target,markdown,{flag:'wx'});
      manifest.records[sourceId]={path:relative,source_data_source:item.sourceUrl,source_hash:sourceHash,content_hash:hash(markdown)};
      await saveManifest(manifestPath,manifest);
      existingIds.set(sourceId,target);
      imported++;counts[folder]=(counts[folder]??0)+1;
    } catch(error){failures.push({source:item.source.row.url,error:error.message});conflicted++;}
  }
  manifest.failures=failures;
  await saveManifest(manifestPath,manifest);
  const charts=await renderCharts(root);
  return {imported,skipped,conflicted,counts,charts,manifest_records:Object.keys(manifest.records).length,failures};
}
