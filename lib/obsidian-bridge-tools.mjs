const date={type:'string',description:'Asia/Taipei calendar date, YYYY-MM-DD'};
const submission={type:'string',description:'Unique UUID for this intended submission; reuse it on retry'};
const journalProperties={date,submission_id:submission,original_text:{type:'string',description:'Complete verbatim user submission, with original punctuation and paragraph breaks'},submitted_at:{type:'string',description:'Original submission timestamp with timezone, only when known'},source_reference:{type:'string',description:'Original conversation or message reference, only when known'},mood:{type:'integer',minimum:1,maximum:10},state:{type:'integer',minimum:1,maximum:10},emotional_tags:{type:'array',items:{type:'string'}},significant_events:{type:'string'},thoughts:{type:'string'},important_memories:{type:'string'},future_plans:{type:'string'},followup:{type:'string'}};
const schema=(properties,required=[])=>({type:'object',properties,required,additionalProperties:false});

export const bridgeTools=[
  {name:'upsert_daily_journal',description:'Save the complete verbatim user message as an immutable original submission, plus only structured answers actually supplied. For another message on the same date, use a fresh UUID; reuse the same UUID on retry. Preserve omitted fields. Never substitute an AI summary for original_text.',inputSchema:schema(journalProperties,['date','submission_id','original_text']),annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false}},
  {name:'add_life_event',description:'Save a user-described life event as a separate Obsidian Markdown note. Optional source_journal_date must already exist. This does not classify risk or create an Emotional Aftereffect finding.',inputSchema:schema({submission_id:submission,date,title:{type:'string'},description:{type:'string'},source_journal_date:date},['submission_id','date','title','description']),annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false}},
  {name:'get_daily_journal',description:'Read structured journal fields and every verbatim original submission for one date from the canonical Obsidian vault.',inputSchema:schema({date},['date']),annotations:{readOnlyHint:true,openWorldHint:false}},
  {name:'verify_daily_journal',description:'Check whether a journal exists and whether selected saved structured fields exactly match expected values.',inputSchema:schema({date,expected:schema(Object.fromEntries(Object.entries(journalProperties).filter(([key])=>!['date','submission_id','original_text','submitted_at','source_reference'].includes(key))))},['date']),annotations:{readOnlyHint:true,openWorldHint:false}},
  {name:'list_recent_journals',description:'List up to 30 recent saved journal records from Obsidian.',inputSchema:schema({limit:{type:'integer',minimum:1,maximum:30}}),annotations:{readOnlyHint:true,openWorldHint:false}},
  {name:'save_aftereffect_finding',description:'Save an explicit, provisional, nonclinical Emotional Aftereffect finding linked to an existing journal or event. Keep observed facts, hypotheses, unknowns and follow-up distinct. Never invent a finding.',inputSchema:schema({date,source_journal_date:date,source_event_id:{type:'string'},facts:{type:'string'},hypotheses:{type:'string'},unknowns:{type:'string'},followup:{type:'string'}},['date']),annotations:{readOnlyHint:false,destructiveHint:false,openWorldHint:false}},
];

const methods={upsert_daily_journal:'upsertJournal',add_life_event:'addLifeEvent',get_daily_journal:'getJournal',verify_daily_journal:'verifyJournal',list_recent_journals:'listRecentJournals',save_aftereffect_finding:'addAftereffectFinding'};
export async function callBridgeTool(bridge,name,args){
  const method=methods[name];
  if(!method)throw Error('Unknown bridge tool');
  return bridge[method](args??{});
}
