import {createHash} from 'node:crypto';
import {mkdir, readFile, readdir, rename, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {prototypeName} from './obsidian-prototype.mjs';

const sha = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const exists = async file => Boolean(await stat(file).catch(() => null));
const slash = value => value.replaceAll('\\', '/');
const labels = {Journal:'生活日誌', Risks:'情緒與風險', Observations:'延後觀察', Tasks:'生活任務', Schedule:'日程', Academic:'學習', Projects:'專案', Resources:'資源', Structure:'人生架構', Analysis:'分析回顧'};
const rgb = {Journal:0x569cd6, Risks:0xc878aa, Observations:0xf0a55c, Tasks:0x78b68b, Schedule:0x64a5bc, Academic:0x9b86e0, Projects:0xd49b55, Resources:0x8296ad, Structure:0xb887c5, Analysis:0x9aa1aa};

export function safeNoteName(title, id, occupied) {
  let name=String(title||'').replace(/[<>:"/\\|?*\x00-\x1f]/g,' ').replace(/\s+/g,' ').replace(/[. ]+$/,'').trim();
  if (!name || /^[a-f\d]{24,}$/i.test(name)) name='未命名紀錄';
  if (/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(name)) name=`紀錄 ${name}`;
  name=[...name].slice(0,76).join('');
  let candidate=name;
  if (occupied.has(candidate.toLowerCase())) candidate=`${name} · ${id.slice(-6)}`;
  let n=2;
  while (occupied.has(candidate.toLowerCase())) candidate=`${name} · ${id.slice(-6)}-${n++}`;
  occupied.add(candidate.toLowerCase());
  return candidate;
}

async function filesUnder(folder) {
  const found=[];
  for (const entry of await readdir(folder,{withFileTypes:true})) {
    const full=path.join(folder,entry.name);
    if(entry.isDirectory()) found.push(...await filesUnder(full));
    else if(entry.isFile()) found.push(full);
  }
  return found;
}

function linkRename(text, oldPath, newPath) {
  const oldStem=oldPath.replace(/\.md$/,'');
  const newStem=newPath.replace(/\.md$/,'');
  return text.replace(/\[\[([^\]]+)\]\]/g,(whole,inside)=>{
    const split=inside.search(/[|#]/);
    const target=split<0?inside:inside.slice(0,split);
    return target===oldStem?`[[${newStem}${split<0?'':inside.slice(split)}]]`:whole;
  });
}

function graphSettings(existing, base) {
  const excluded=['Assets','Templates','Views','Records/Analysis','歷史資料.md','DEVELOPMENT_STATE.md','AGENTS.md'];
  const search=excluded.map(item=>`-path:"${item}"`).join(' ');
  const colorGroups=Object.entries(rgb).map(([folder,color])=>({query:`path:"${base}/Records/${folder}"`,color:{a:1,rgb:color}}));
  colorGroups.push({query:'path:"Private AI assistant"',color:{a:1,rgb:0x949ba8}});
  return {...existing,search,showAttachments:false,showTags:false,hideUnresolved:true,showOrphans:false,colorGroups};
}

function makeBase(folder) {
  return `filters:\n  and:\n    - file.inFolder("${prototypeName}/Records/${folder}")\n    - file.ext == "md"\nviews:\n  - type: table\n    name: All\n    order:\n      - file.name\n      - source_last_edited_at\n`;
}

function canvas() {
  const nodes=[
    {id:'phase-one',type:'group',label:'Phase 1｜每日生活與風險',x:-1050,y:-640,width:1040,height:610,color:'5'},
    {id:'future',type:'group',label:'後續模組｜已保留位置',x:470,y:-640,width:1050,height:610,color:'2'},
    {id:'services',type:'group',label:'支援系統與外部來源',x:-1050,y:310,width:2570,height:540,color:'1'},
    {id:'core',type:'text',text:'# Personal AI OS V4.0 — Central AI Agent\nCapture → Organize → Analyze → Identify Risks → Recommend → Monitor → Review',x:0,y:0,width:460,height:150,color:'4'},
    ...[
      ['dashboard','Daily Dashboard｜每日總覽','已實作','Personal AI OS V4 Prototype/The Unseen.md',-1000,-570,'4'],
      ['journal','Life Journal｜生活日誌','已實作','Personal AI OS V4 Prototype/生活日誌.md',-520,-570,'5'],
      ['aftereffect','Emotional Aftereffect｜情緒後效','已實作','Personal AI OS V4 Prototype/生活風險.md',-1000,-290,'6'],
      ['academic','Academic Progress｜學習','歷史資料已匯入；深入分析待資料','Personal AI OS V4 Prototype/歷史資料.md',-520,-290,'3'],
      ['finance','Financial Intelligence｜財務','規劃中；目前沒有匯入交易',null,520,-570,'2'],
      ['health','Health and Fitness｜健康','規劃中；目前沒有匯入紀錄',null,1000,-570,'2'],
      ['goals','Goals and Life Planning｜目標','規劃中；目前沒有匯入目標',null,520,-290,'2'],
      ['projects','Projects and Automation｜專案','歷史專案已匯入；自動化待驗證','Personal AI OS V4 Prototype/任務與行程.md',1000,-290,'3']
    ].map(([id,title,status,file,x,y,color])=>file?{id,type:'file',file,x,y,width:430,height:190,color}:{id,type:'text',text:`## ${title}\n${status}`,x,y,width:430,height:190,color}),
    ...[
      ['obsidian','Obsidian｜主要操作平台',-1000,360],['notion','Notion｜唯讀歷史來源',-520,360],
      ['calendar','Google Calendar｜可用時連接日程',0,360],['gmail','Gmail｜可用時連接通訊',520,360],
      ['drive','Google Drive｜文件與備份（待驗證）',1000,360],
      ['codex','Codex｜開發與維護',-520,650],['gemini','Gemini｜可選分析協助',520,650]
    ].map(([id,text,x,y])=>({id,type:'text',text,x,y,width:430,height:150,color:'1'}))
  ];
  const modules=['dashboard','journal','aftereffect','academic','finance','health','goals','projects'];
  const edges=modules.map((id,i)=>({id:`core-${id}`,fromNode:'core',fromSide:i<4?'left':'right',toNode:id,toSide:i<4?'right':'left',toEnd:'arrow'}));
  for(const [from,to] of [['journal','aftereffect'],['dashboard','journal'],['obsidian','core'],['notion','obsidian'],['calendar','dashboard'],['gmail','projects'],['drive','obsidian'],['codex','projects'],['gemini','core']])edges.push({id:`${from}-${to}`,fromNode:from,fromSide:'bottom',toNode:to,toSide:'bottom',toEnd:'arrow'});
  return {nodes,edges};
}

export async function buildLifeGraph({vault,manifestPath,backupPath}) {
  const root=path.resolve(vault),prototype=path.join(root,prototypeName),backup=path.resolve(backupPath);
  if(!await exists(path.join(root,'.obsidian','graph.json')) || !await exists(backup)) throw Error('Existing vault and pre-graph backup required');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  const entries=Object.entries(manifest.records);
  const files=await filesUnder(root);
  const markdown=files.filter(file=>file.endsWith('.md'));
  const occupied=new Map();
  for(const file of markdown){const folder=path.dirname(file);if(!occupied.has(folder))occupied.set(folder,new Set());occupied.get(folder).add(path.basename(file,'.md').toLowerCase());}
  const moves=[];
  for(const [id,entry] of entries){
    const old=path.resolve(prototype,...entry.path.split('/'));
    if(!old.startsWith(prototype+path.sep) || !await exists(old))throw Error('Manifest path invalid or missing');
    const note=await readFile(old,'utf8');
    if(!note.includes(`source_record_id: "${id}"`))throw Error('Provenance mismatch');
    if(!/^[a-f\d]{32}\.md$/i.test(path.basename(old)))continue;
    const title=/^# (.+)$/m.exec(note)?.[1]??'';
    const names=occupied.get(path.dirname(old));
    const name=safeNoteName(title,id,names);
    const target=path.join(path.dirname(old),`${name}.md`);
    if(await exists(target))throw Error('Rename target exists');
    moves.push({id,old,target,from:entry.path,to:slash(path.relative(prototype,target))});
  }
  const index=path.join(prototype,'歷史資料.md');
  const replacements=new Map();let updatedLinks=0,removedHubLinks=0;
  for(const file of markdown){
    let text=await readFile(file,'utf8');
    const previous=text;
    for(const move of moves){
      const before=text;
      text=linkRename(text,move.from,move.to);
      if(text!==before && file!==index)updatedLinks+=(before.split(`[[${move.from.replace(/\.md$/,'')}`).length-1);
    }
    if(text!==previous)replacements.set(file,text);
  }
  // One-time generated index cleanup: native Bases list records without graph edges.
  if(await exists(index)){
    removedHubLinks=(await readFile(index,'utf8').then(text=>(text.match(/\[\[Records\//g)||[]).length));
    const lines=['---','cssclasses:','  - personal-ai-os-dashboard','---','# 歷史資料','','各類紀錄可在下方展開；個人事件內容保留在各筆筆記內。',''];
    for(const [folder,label] of Object.entries(labels)) if(entries.some(([,entry])=>entry.path.startsWith(`Records/${folder}/`)))lines.push(`> [!note]- ${label}`,`> ![[Views/${folder}.base#All]]`,'>');
    replacements.set(index,lines.join('\n')+'\n');
  }
  // Preflight complete: all source notes, targets, and provenance were checked before mutation.
  for(const move of moves)await rename(move.old,move.target);
  for(const [original,content] of replacements){
    const target=moves.find(move=>move.old===original)?.target??original;
    await writeFile(target,content);
  }
  for(const move of moves)manifest.records[move.id].path=move.to;
  for(const [id,entry] of entries){const file=path.join(prototype,...entry.path.split('/'));entry.content_hash=sha(await readFile(file,'utf8'));}
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  const views=path.join(prototype,'Views');
  await mkdir(views,{recursive:true});
  for(const folder of Object.keys(labels)){
    const file=path.join(views,`${folder}.base`);
    if(!await exists(file))await writeFile(file,makeBase(folder),{flag:'wx'});
  }
  const graphFile=path.join(root,'.obsidian','graph.json');
  const settings=JSON.parse(await readFile(graphFile,'utf8'));
  await writeFile(graphFile,JSON.stringify(graphSettings(settings,prototypeName),null,2)+'\n');
  const canvasFile=path.join(root,'Private AI assistant','Personal AI OS Architecture.canvas');
  await mkdir(path.dirname(canvasFile),{recursive:true});
  if(!await exists(canvasFile))await writeFile(canvasFile,JSON.stringify(canvas(),null,2)+'\n',{flag:'wx'});
  return {renamed:moves.length,rewrittenMarkdown:replacements.size,updatedLinks,removedHubLinks,graphGroups:Object.keys(rgb).length+1,canvasNodes:canvas().nodes.length,canvasEdges:canvas().edges.length,records:entries.length};
}
