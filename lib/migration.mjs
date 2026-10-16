import {createHash} from 'node:crypto';
import {validate} from './emotions.mjs';

const hashPattern=/^[0-9a-f]{64}$/;
const digest=value=>createHash('sha256').update(value).digest('hex');
const canonical=value=>JSON.stringify(value,(_key,item)=>item && !Array.isArray(item) && typeof item==='object' ? Object.fromEntries(Object.entries(item).sort(([a],[b])=>a.localeCompare(b,'en'))) : item);
export const eventDigest=event=>digest(canonical(event));

function inventory(input,label){
 if(input?.schemaVersion!==1||!Array.isArray(input.records)||!Array.isArray(input.attachments)||!Array.isArray(input.relations))throw Error(`${label}: expected schemaVersion 1 and records, attachments, relations arrays`);
 const entries=(items,name)=>{
  const map=new Map();
  for(const item of items){
   if(typeof item?.id!=='string'||!item.id||typeof item.sha256!=='string'||!hashPattern.test(item.sha256)||map.has(item.id))throw Error(`${label}: invalid or duplicate ${name} ID/hash`);
   map.set(item.id,item.sha256);
  }
  return map;
 };
 const records=entries(input.records,'record'),attachments=entries(input.attachments,'attachment'),relations=new Set();
 for(const item of input.relations){
  if(typeof item?.from!=='string'||typeof item?.to!=='string'||!records.has(item.from)||!records.has(item.to))throw Error(`${label}: relation endpoint is missing from records`);
  const pair=JSON.stringify([item.from,item.to]);if(relations.has(pair))throw Error(`${label}: duplicate relation`);relations.add(pair);
 }
 return {records,attachments,relations};
}
function compare(a,b,label,errors){
 const missing=[...a.keys()].filter(key=>!b.has(key)).length;
 const extra=[...b.keys()].filter(key=>!a.has(key)).length;
 const changed=[...a].filter(([key,value])=>b.has(key)&&b.get(key)!==value).length;
 if(missing||extra||changed)errors.push(`${label}: ${missing} missing, ${extra} extra, ${changed} hash mismatches`);
}
export function checkMigration(sourceInput,destinationInput,candidateInput){
 const source=inventory(sourceInput,'source'),destination=inventory(destinationInput,'destination');
 validate(candidateInput);
 const candidate=new Map(candidateInput.events.map(event=>[event.id,eventDigest(event)]));
 const errors=[];
 compare(source.records,destination.records,'source versus destination records',errors);
 compare(source.records,candidate,'source versus canonical export',errors);
 compare(destination.records,candidate,'destination versus canonical export',errors);
 compare(source.attachments,destination.attachments,'attachments',errors);
 const asMap=set=>new Map([...set].map(value=>[value,value]));
 compare(asMap(source.relations),asMap(destination.relations),'relations',errors);
 return {ready:errors.length===0,counts:{records:source.records.size,attachments:source.attachments.size,relations:source.relations.size},errors};
}
