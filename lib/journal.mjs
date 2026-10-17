// Daily journals are independent source records, not Emotional Aftereffect peaks.
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function validDate(date){
 if(date===null)return true;
 if(!object(date)||typeof date.value!=='string')return false;
 if(date.precision==='day'){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date.value))return false;
  const parsed=new Date(`${date.value}T00:00:00Z`);
  return Number.isFinite(+parsed)&&parsed.toISOString().slice(0,10)===date.value;
 }
 if(date.precision==='instant')return validDate({value:date.value.slice(0,10),precision:'day'})&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(date.value)&&/(?:Z|[+-]\d{2}:\d{2})$/.test(date.value)&&Number.isFinite(Date.parse(date.value));
 return false;
}
export function validateJournal(data){
 if(data?.schemaVersion!==1||!Array.isArray(data.entries))throw Error('Expected journal schemaVersion 1 and entries array');
 const ids=new Set();
 for(const entry of data.entries){
  if(!object(entry)||typeof entry.id!=='string'||!entry.id||ids.has(entry.id))throw Error('Missing or duplicate journal ID');
  ids.add(entry.id);
  if(!validDate(entry.date))throw Error('Journal date must preserve day or timezone-aware instant precision, or be null');
  if(!object(entry.source)||entry.source.system!=='notion'||!object(entry.source.page)||entry.source.page.id!==entry.id)throw Error('Journal must retain the complete matching source page');
 }
 return data;
}
export function mergeJournals(current,incoming){
 validateJournal(current);validateJournal(incoming);
 const events=new Map(current.entries.map(entry=>[entry.id,entry]));
 for(const entry of incoming.entries){
  if(events.has(entry.id)&&JSON.stringify(events.get(entry.id))!==JSON.stringify(entry))throw Error('Conflicting journal ID; resolve explicitly before import');
  events.set(entry.id,entry);
 }
 return {...current,entries:[...events.values()]};
}
