import {readFile} from 'node:fs/promises';
import {saveAftereffectFinding} from '../lib/obsidian-aftereffect-finding.mjs';

const [vault,findingPath]=process.argv.slice(2);
if(!vault||!findingPath)throw Error('Usage: node tools/save-obsidian-aftereffect-finding.mjs EXISTING_VAULT PRIVATE_FINDING_JSON');
const finding=JSON.parse((await readFile(findingPath,'utf8')).replace(/^\uFEFF/,''));
const result=await saveAftereffectFinding(vault,finding);
console.log(JSON.stringify({id:result.id,created:result.created,updated:result.updated,sources:result.sources}));
