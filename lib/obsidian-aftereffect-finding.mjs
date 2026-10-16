import {createHash} from 'node:crypto';
import {mkdir,open,readFile,readdir,rename,stat,unlink,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {parseFrontmatter,prototypeName} from './obsidian-prototype.mjs';
import {validJournalDate} from './obsidian-journal-entry.mjs';
import {renderCharts} from './obsidian-charts.mjs';

const quote=text=>String(text||'未知').split(/\r?\n/).map(line=>`> ${line}`).join('\n');
const stem=relative=>relative.replace(/\.md$/,'').replaceAll('\\','/');

export async function saveAftereffectFinding(vault,finding){
  if(!finding||!validJournalDate(finding.date))throw Error('Valid finding date required');
  if(!finding.source_journal_date&&!finding.source_event_id)throw Error('A source journal or event is required');
  if(finding.source_journal_date&&!validJournalDate(finding.source_journal_date))throw Error('Invalid source journal date');
  for(const key of ['facts','hypotheses','unknowns','followup'])if(finding[key]!==undefined&&typeof finding[key]!=='string')throw Error(`${key} must be text`);
  if(!['facts','hypotheses','unknowns'].some(key=>finding[key]?.trim()))throw Error('A fact, hypothesis, or unknown is required');
  const root=path.join(vault,prototypeName),sources=[];
  if(!(await stat(path.join(vault,'.obsidian')).catch(()=>null))?.isDirectory())throw Error('Existing Obsidian vault required');
  if(finding.source_journal_date){
    const relative=`Records/Journal/${finding.source_journal_date}.md`,file=path.join(root,...relative.split('/'));
    const note=await readFile(file,'utf8');
    if(parseFrontmatter(note)?.date!==finding.source_journal_date)throw Error('Source journal date mismatch');
    sources.push(relative);
  }
  if(finding.source_event_id){
    const risks=path.join(root,'Records','Risks'),matches=[];
    for(const name of await readdir(risks)){
      if(!name.endsWith('.md'))continue;
      const note=await readFile(path.join(risks,name),'utf8');
      const data=parseFrontmatter(note);
      if(data?.record_type==='emotional_event'&&data.event_id===finding.source_event_id)matches.push(`Records/Risks/${name}`);
    }
    if(matches.length!==1)throw Error('Source event ID must resolve to exactly one note');
    sources.push(matches[0]);
  }
  const sourceKey=finding.source_event_id??`journal-${finding.source_journal_date}`;
  const suffix=createHash('sha256').update(sourceKey).digest('hex').slice(0,10);
  const id=`EA-FIND-${finding.date}-${suffix}`;
  const folder=path.join(root,'Records','Findings'),target=path.join(folder,`${id}.md`);
  await mkdir(folder,{recursive:true});
  const lockPath=target+'.lock',lock=await open(lockPath,'wx');
  let temporary,created=false,updated=false;
  try{
    const block=[
      '<!-- aftereffect-finding:start -->',
      `來源：${sources.map(relative=>`[[${stem(relative)}]]`).join(' · ')}`,
      '',
      '> [!note]- 已觀察事實',quote(finding.facts),
      '',
      '> [!question]- 尚待驗證的假設',quote(finding.hypotheses),
      '',
      '> [!info]- 未知與缺少的觀察',quote(finding.unknowns),
      '',
      '> [!todo]- 後續追蹤',quote(finding.followup),
      '<!-- aftereffect-finding:end -->'
    ].join('\n');
    const front=`---\nrecord_type: "aftereffect_finding"\nfinding_id: ${JSON.stringify(id)}\ndate: ${JSON.stringify(finding.date)}\nsource_journal_date: ${JSON.stringify(finding.source_journal_date??null)}\nsource_event_id: ${JSON.stringify(finding.source_event_id??null)}\nevidence_status: "provisional_nonclinical"\nsource_platform: "obsidian"\n---\n`;
    const before=await readFile(target,'utf8').catch(error=>error.code==='ENOENT'?null:Promise.reject(error));
    let next;
    if(before===null){next=`${front}# 情緒後效發現｜${finding.date}\n\n${block}\n`;await writeFile(target,next,{flag:'wx'});created=true;}
    else{
      const data=parseFrontmatter(before);
      if(data?.finding_id!==id||data?.record_type!=='aftereffect_finding'||
        (data.source_journal_date??null)!==(finding.source_journal_date??null)||
        (data.source_event_id??null)!==(finding.source_event_id??null))throw Error('Finding destination conflict');
      const start=before.indexOf('<!-- aftereffect-finding:start -->'),end=before.indexOf('<!-- aftereffect-finding:end -->');
      if(start<0||end<start)throw Error('Existing finding has no managed section');
      next=before.slice(0,start)+block+before.slice(end+'<!-- aftereffect-finding:end -->'.length);
      if(next!==before){
        temporary=`${target}.${process.pid}.tmp`;
        await writeFile(temporary,next,{flag:'wx'});
        if(await readFile(target,'utf8')!==before)throw Error('Finding changed during update');
        await rename(temporary,target);temporary=undefined;updated=true;
      }
    }
    if(await readFile(target,'utf8')!==next)throw Error('Finding write verification failed');
  }finally{
    if(temporary)await unlink(temporary).catch(()=>{});
    await lock.close();await unlink(lockPath);
  }
  const view=path.join(root,'Views','Findings.base');
  if(!(await stat(view).catch(()=>null)))await writeFile(view,`filters:\n  and:\n    - file.inFolder("${prototypeName}/Records/Findings")\n    - file.ext == "md"\nviews:\n  - type: table\n    name: All\n    order:\n      - file.name\n      - date\n      - source_event_id\n`,{flag:'wx'});
  const riskPage=path.join(root,'生活風險.md'),riskText=await readFile(riskPage,'utf8');
  if(!riskText.includes('Views/Findings.base#All')){
    const anchor='> ![[Views/Observations.base#Observed]]';
    if(!riskText.includes(anchor))throw Error('Risk page observation section missing');
    await writeFile(riskPage,riskText.replace(anchor,anchor+'\n> ![[Views/Findings.base#All]]'));
  }
  let charts,chartError;
  try{charts=await renderCharts(root);}catch(error){chartError=error.message;}
  return {id,created,updated,path:target,sources:sources.length,chart_error:chartError??null,chart_counts:charts??null};
}
