import {importNotionSnapshots} from '../lib/obsidian-notion-import.mjs';

const [vault,snapshotDir,mappingPath,manifestPath,backupPath]=process.argv.slice(2);
if(![vault,snapshotDir,mappingPath,manifestPath,backupPath].every(Boolean))
  throw Error('Usage: node tools/import-notion-snapshot.mjs VAULT SNAPSHOT_DIR PRIVATE_MAPPING PRIVATE_MANIFEST VERIFIED_BACKUP');
const result=await importNotionSnapshots({vault,snapshotDir,mappingPath,manifestPath,backupPath});
console.log(JSON.stringify(result));
