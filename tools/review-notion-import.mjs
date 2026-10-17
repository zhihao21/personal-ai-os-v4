import {readFile} from 'node:fs/promises';
import {reviewNotionImport} from '../lib/obsidian-import-review.mjs';

const [vault,snapshotDir,mappingPath,manifestPath]=process.argv.slice(2);
if(![vault,snapshotDir,mappingPath,manifestPath].every(Boolean))
  throw Error('Usage: node tools/review-notion-import.mjs VAULT SNAPSHOT_DIR PRIVATE_MAPPING PRIVATE_MANIFEST');
const mapping=JSON.parse(await readFile(mappingPath,'utf8'));
console.log(JSON.stringify(await reviewNotionImport({vault,snapshotDir,manifestPath,attachmentMap:mapping.attachments??{}})));
