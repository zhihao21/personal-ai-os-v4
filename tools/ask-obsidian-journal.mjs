import readline from 'node:readline/promises';
import {randomUUID} from 'node:crypto';
import {stdin as input,stdout as output} from 'node:process';
import {saveJournalAnswers,taipeiDate,validJournalDate} from '../lib/obsidian-journal-entry.mjs';

const vault=process.argv[2];
if(!vault)throw Error('Usage: node tools/ask-obsidian-journal.mjs EXISTING_VAULT [YYYY-MM-DD]');
const date=process.argv[3]??taipeiDate();
if(!validJournalDate(date))throw Error('Invalid questionnaire date');
const prompt=readline.createInterface({input,output});
const answers={date};
const originalLines=[];
try{
  output.write(`每日生活日誌 ${date}（Asia/Taipei）。留空會保留原值或未知值。\n`);
  for(const [key,label] of [
    ['mood','心情 1–10'],['state','今日整體狀態 1–10'],['emotional_tags','情緒標籤（逗號分隔）'],
    ['significant_events','今日重要事件'],['thoughts','想法與擔憂'],['important_memories','重要回憶'],
    ['future_plans','未來計畫'],['followup','待追蹤事項']
  ]){
    const raw=await prompt.question(`${label}：`);
    originalLines.push(`${label}：${raw}`);
    const value=raw.trim();
    if(!value)continue;
    answers[key]=key==='mood'||key==='state'?Number(value):key==='emotional_tags'?value.split(/[,，]/).map(tag=>tag.trim()).filter(Boolean):value;
  }
}finally{prompt.close();}
if(Object.keys(answers).length===1){output.write('沒有提供答案；未寫入日誌。\n');process.exit(0);}
const result=await saveJournalAnswers(vault,answers,{submissionId:randomUUID(),originalText:originalLines.join('\n'),sourceReference:'local-interactive-questionnaire'});
output.write(`${result.created?'已建立':result.updated?'已更新':'內容未變'}：${date}；已重新讀取並核對 Markdown。${result.chart_error?` 圖表更新失敗：${result.chart_error}`:''}\n`);
