import test from 'node:test';
import assert from 'node:assert/strict';
import {validateJournal,mergeJournals} from '../lib/journal.mjs';
const page={id:'synthetic-page',properties:{Date:{type:'date',date:{start:'2026-10-16'}},Mood:{type:'number',number:4},State:{type:'number',number:7},Tags:{type:'multi_select',multi_select:[{name:'Synthetic'}]},Notes:{type:'rich_text',rich_text:[{plain_text:'Synthetic only'}]},Formula:{type:'formula',formula:{number:42}}},created_time:'2026-10-16T08:00:00Z',last_edited_time:'2026-10-16T09:00:00Z',unknownSourceField:{keep:true}};
const entry={id:'synthetic-page',date:{value:'2026-10-16',precision:'day'},source:{system:'notion',page}};
const data={schemaVersion:1,entries:[entry]};
test('day precision and complete unknown source metadata survive JSON roundtrip',()=>{
 const restored=validateJournal(JSON.parse(JSON.stringify(data)));
 assert.deepEqual(restored,data);assert.equal(restored.entries[0].date.value,'2026-10-16');
 assert.equal(restored.entries[0].source.page.properties.Mood.number,4);
 assert.equal(restored.entries[0].source.page.unknownSourceField.keep,true);
 assert.equal('peakAt' in restored.entries[0],false);
});
test('reject invented times, malformed dates, source mismatch and duplicate IDs',()=>{
 for(const date of [{value:'2026-02-30',precision:'day'},{value:'2026-10-16T08:00:00',precision:'instant'},{value:'2026-10-16',precision:'instant'},{value:'2026-02-30T08:00:00Z',precision:'instant'}])assert.throws(()=>validateJournal({...data,entries:[{...entry,date}]}));
 const mismatched={...entry,source:{system:'notion',page:{...page,id:'other'}}};
 assert.throws(()=>validateJournal({...data,entries:[mismatched]}));
 assert.throws(()=>validateJournal({...data,entries:[entry,entry]}));
});
test('merge is idempotent and refuses to overwrite changed journal content',()=>{
 assert.deepEqual(mergeJournals(data,data),data);
 assert.throws(()=>mergeJournals(data,{...data,entries:[{...entry,source:{...entry.source,page:{...page,properties:{...page.properties,Mood:{type:'number',number:5}}}}}]}));
});
