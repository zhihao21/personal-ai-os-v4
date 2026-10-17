import {readFile} from 'node:fs/promises';
import {saveJournalAnswers} from '../lib/obsidian-journal-entry.mjs';

const [vault,answersPath]=process.argv.slice(2);
if(!vault||!answersPath)throw Error('Usage: node tools/save-obsidian-journal.mjs VAULT PRIVATE_ANSWERS_JSON');
const input=JSON.parse((await readFile(answersPath,'utf8')).replace(/^\uFEFF/,''));
const {original_text,submission_id,submitted_at,source_reference,...answers}=input;
if(typeof original_text!=='string'||!original_text.length)throw Error('Private input must include the complete original_text; structured answers alone cannot preserve the submission');
if(typeof submission_id!=='string')throw Error('Private input must include a stable submission_id UUID for safe retries');
console.log(JSON.stringify(await saveJournalAnswers(vault,answers,{submissionId:submission_id,originalText:original_text,submittedAt:submitted_at,sourceReference:source_reference})));
