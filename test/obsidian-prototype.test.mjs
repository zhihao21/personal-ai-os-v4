import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {installPrototype,prototypeName} from '../lib/obsidian-prototype.mjs';
import {renderCharts} from '../lib/obsidian-charts.mjs';

test('isolated Obsidian prototype preserves vault files and renders honest empty charts',async()=>{
  const vault=await mkdtemp(path.join(os.tmpdir(),'aios-obsidian-'));
  try{
    await mkdir(path.join(vault,'.obsidian'));await writeFile(path.join(vault,'.obsidian','appearance.json'),'{}');
    await writeFile(path.join(vault,'existing.md'),'KEEP');
    const first=await installPrototype(vault),second=await installPrototype(vault);
    assert(first.created.length>10);assert.equal(second.created.length,0);
    assert.equal(await readFile(path.join(vault,'existing.md'),'utf8'),'KEEP');
    const appearance=JSON.parse(await readFile(path.join(vault,'.obsidian','appearance.json'),'utf8'));
    assert(appearance.enabledCssSnippets.includes('personal-ai-os-v4'));
    const daily=JSON.parse(await readFile(path.join(vault,'.obsidian','daily-notes.json'),'utf8'));
    assert.equal(daily.folder,`${prototypeName}/Records/Journal`);
    assert.equal(daily.template,`${prototypeName}/Templates/每日生活日誌`);
    const homepage=await readFile(path.join(first.root,'The Unseen.md'),'utf8');
    assert.equal((homepage.match(/<small>/g)||[]).length,6);
    assert.match(homepage,/!\[\[Assets\/the-unseen-evening\.png\|1500\]\]/);
    assert.match(homepage,/!\[\[Assets\/mood-trend\.svg\|900\]\]/);
    assert.ok(homepage.includes(`obsidian://daily?vault=${encodeURIComponent(path.basename(vault))}`));
    const hero=await readFile(path.join(first.root,'Assets','the-unseen-evening.png'));
    assert.equal(hero.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    const css=await readFile(path.join(vault,'.obsidian','snippets','personal-ai-os-v4.css'),'utf8');
    assert.match(css,/data-property-key="original_properties_json"/);
    assert.match(css,/@media\(max-width:700px\)/);
    assert.match(css,/image-embed\[src\*="the-unseen-evening"\]/);
    const counts=await renderCharts(first.root);
    assert.equal(counts.journal,0);
    const mood=await readFile(path.join(first.root,'Assets','mood-trend.svg'),'utf8');
    assert.match(mood,/尚無日誌紀錄/);
    assert.equal(first.root,path.join(vault,prototypeName));
  }finally{await rm(vault,{recursive:true,force:true});}
});

test('synthetic records drive scores and duplicate dates stop chart refresh',async()=>{
  const vault=await mkdtemp(path.join(os.tmpdir(),'aios-obsidian-'));
  try{
    await mkdir(path.join(vault,'.obsidian'));await writeFile(path.join(vault,'.obsidian','appearance.json'),'{}');
    const {root}=await installPrototype(vault);
    const record=(date,mood,state)=>`---\nrecord_type: journal\ndate: "${date}"\nmood: ${mood}\nstate: ${state}\n---\n# Synthetic test only\n`;
    await writeFile(path.join(root,'Records','Journal','one.md'),record('2026-10-14',7,5));
    await writeFile(path.join(root,'Records','Journal','two.md'),record('2026-10-15',8,''));
    await renderCharts(root,new Date('2026-10-16T03:00:00Z'));
    const mood=await readFile(path.join(root,'Assets','mood-trend.svg'),'utf8');
    assert.match(mood,/心情・整體狀態・每日綜合/);
    assert.match(mood,/polyline/);
    await writeFile(path.join(root,'Records','Journal','duplicate.md'),record('2026-10-15',6,6));
    await assert.rejects(renderCharts(root),/Duplicate journal date/);
  }finally{await rm(vault,{recursive:true,force:true});}
});
