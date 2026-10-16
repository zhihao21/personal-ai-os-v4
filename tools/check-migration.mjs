import {readFileSync} from 'node:fs';
import {checkMigration} from '../lib/migration.mjs';
const [source,destination,exportPath]=process.argv.slice(2);
if(!source||!destination||!exportPath){console.error('Usage: node tools/check-migration.mjs source-inventory.json destination-inventory.json canonical-export.json');process.exitCode=2;}
else{
 try{
  const read=name=>JSON.parse(readFileSync(name,'utf8'));
  const result=checkMigration(read(source),read(destination),read(exportPath));
  console.log(JSON.stringify(result,null,2));
  if(!result.ready)process.exitCode=1;
 }catch(error){console.error(`Migration check failed: ${error.message}`);process.exitCode=2;}
}
