import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {installPrototype, prototypeName} from '../lib/obsidian-prototype.mjs';
import {importNotionSnapshots} from '../lib/obsidian-notion-import.mjs';
import {reviewNotionImport} from '../lib/obsidian-import-review.mjs';
import {buildLifeGraph, safeNoteName} from '../lib/obsidian-life-graph.mjs';

test('graph filenames are safe and collision-resistant',()=>{
  const occupied=new Set();
  assert.equal(safeNoteName('Study: Math?', '11111111',occupied),'Study Math');
  assert.equal(safeNoteName('Study: Math?', '22222222',occupied),'Study Math · 222222');
});

const page=(id,properties,content='')=>({
  url:`https://app.notion.com/p/${id}`,title:'Imported record',page_last_edited_at:'2026-10-15T10:00:00Z',
  text:`<page><properties>\n${JSON.stringify(properties)}\n</properties>\n<content>\n${content}\n</content></page>`
});

test('Notion snapshot import preserves scores and historical risk, links records, and is repeatable',async()=>{
  const tmp=await mkdtemp(path.join(os.tmpdir(),'personal-ai-os-import-'));
  const vault=path.join(tmp,'vault'),backup=path.join(tmp,'backup'),snapshot=path.join(tmp,'source');
  await Promise.all([mkdir(path.join(vault,'.obsidian'),{recursive:true}),mkdir(backup),mkdir(snapshot)]);
  await writeFile(path.join(vault,'.obsidian','appearance.json'),'{}');
  await installPrototype(vault);
  const journalId='11111111111111111111111111111111',riskId='22222222222222222222222222222222';
  const journalUrl='collection://journal',riskUrl='collection://risk';
  const sources=[
    {source_url:journalUrl,source_title:'Journal',records:[{row:{url:page(journalId,{}).url},page:page(journalId,{'date:日期:start':'2026-10-15','心情分數':8,'今日狀態分數':5,'心情標籤':['平靜']},'Original private text')} ]},
    {source_url:riskUrl,source_title:'Risk',records:[{row:{url:page(riskId,{}).url},page:page(riskId,{'事件 ID':'EA-NEG-001','生命週期':'歷史已結束','風險分級':'高','暫定總分':21,'方向':'負向','來源日誌':[page(journalId,{}).url]},'Historical content')} ]}
  ];
  for(const [i,source] of sources.entries())await writeFile(path.join(snapshot,`${i}.json`),JSON.stringify(source));
  const mappingPath=path.join(tmp,'mapping.json'),manifestPath=path.join(tmp,'manifest.json');
  await writeFile(mappingPath,JSON.stringify({sources:{[journalUrl]:{folder:'Journal'},[riskUrl]:{folder:'Risks'}},attachments:{}}));
  const args={vault,snapshotDir:snapshot,mappingPath,manifestPath,backupPath:backup};
  const first=await importNotionSnapshots(args);
  assert.equal(first.imported,2);
  assert.equal(first.charts.journal,1);
  assert.equal(first.charts.risks,1);
  const root=path.join(vault,prototypeName);
  const journal=await readFile(path.join(root,'Records','Journal','2026-10-15.md'),'utf8');
  const risk=await readFile(path.join(root,'Records','Risks',`${riskId}.md`),'utf8');
  assert.match(journal,/mood: 8/);
  assert.match(journal,/state: 5/);
  assert.match(journal,/Original private text/);
  assert.match(risk,/historical_score: 21/);
  assert.match(risk,/historical_scale_max: 24/);
  assert.match(risk,/lifecycle: "closed"/);
  assert.match(risk,/\[\[Records\/Journal\/2026-10-15\]\]/);
  const second=await importNotionSnapshots(args);
  assert.equal(second.imported,0);
  assert.equal(second.skipped,2);
  assert.equal(second.conflicted,0);
  const review=await reviewNotionImport({vault,snapshotDir:snapshot,manifestPath});
  assert.equal(review.verified,2);
  assert.equal(review.relationship_links,1);
  assert.equal(review.relationship_links_missing,0);
  assert.equal(review.failures.length,0);
  assert.match(await readFile(path.join(root,'歷史資料.md'),'utf8'),/生活日誌/);
  assert.match(await readFile(path.join(root,'The Unseen.md'),'utf8'),/\[\[歷史資料/);
  await writeFile(path.join(vault,'.obsidian','graph.json'),'{}');
  await writeFile(path.join(vault,'verification.md'),`[[Records/Risks/${riskId}]]\n`);
  const backedRisk=path.join(backup,prototypeName,'Records','Risks',`${riskId}.md`);
  await mkdir(path.dirname(backedRisk),{recursive:true});
  await writeFile(backedRisk,await readFile(path.join(root,'Records','Risks',`${riskId}.md`)));
  const graph=await buildLifeGraph({vault,manifestPath,backupPath:backup});
  assert.equal(graph.renamed,1);
  assert.ok(graph.updatedLinks>=1);
  const mapped=JSON.parse(await readFile(manifestPath,'utf8')).records[riskId].path;
  assert.match(mapped,/Imported record\.md$/);
  assert.match(await readFile(path.join(vault,'verification.md'),'utf8'),/\[\[Records\/Risks\/Imported record\]\]/);
  assert.match(await readFile(path.join(root,...mapped.split('/')),'utf8'),/source_record_id: "22222222222222222222222222222222"/);
  assert.equal((await importNotionSnapshots(args)).conflicted,0);
  const after=await reviewNotionImport({vault,snapshotDir:snapshot,manifestPath});
  assert.equal(after.relationship_links_missing,0);
});
