import {readFile} from 'node:fs/promises';
import {saveJournalAnswers} from '../lib/obsidian-journal-entry.mjs';

const [vault,answersPath]=process.argv.slice(2);
if(!vault||!answersPath)throw Error('Usage: node tools/save-obsidian-journal.mjs VAULT PRIVATE_ANSWERS_JSON');
const answers=JSON.parse((await readFile(answersPath,'utf8')).replace(/^\uFEFF/,''));
console.log(JSON.stringify(await saveJournalAnswers(vault,answers)));
