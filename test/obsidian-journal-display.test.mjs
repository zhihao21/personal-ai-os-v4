import test from 'node:test';
import assert from 'node:assert/strict';
import {journalDetailTemplate,renderJournalDetail} from '../lib/obsidian-journal-display.mjs';

const empty=`---\nrecord_type: journal\ndate: "2026-10-17"\nmood:\nstate:\nemotional_tags: []\n---\n# 2026-10-17｜每日生活日誌\n## 今日事件\n\n## 想法與擔憂\n## 重要回憶\n\n## 未來計畫\n\n> [!note]- 詳細回顧\n> \n`;

test('old empty journal becomes one-title compact detail with an edit action',()=>{
  const result=renderJournalDetail(empty);
  assert.equal((result.match(/^# 2026-10-17｜每日生活日誌$/gm)??[]).length,1);
  assert.match(result,/\[!info\] 尚未填寫/);
  assert.match(result,/viewmode=source/);
  assert.match(result,/hearth%3Aopen-dashboard-2/);
  assert.match(result,/cssclasses: \[the-unseen-journal-detail\]/);
  assert.doesNotMatch(result,/## 今日事件|## 想法與擔憂|詳細回顧/);
  assert.equal(renderJournalDetail(result),result);
});

test('completed journal preserves manual text and verbatim expandable originals',()=>{
  const full=`---\nrecord_type: journal\ndate: "2026-10-16"\nmood: 3\nstate: 1\nemotional_tags: ["calm", "tired"]\nsignificant_events: "Synthetic event"\nthoughts: "Synthetic reflection"\n---\n## 今日摘要\n\n> [!summary] Old summary\n> old\n\n---\n\nManual private note.\n\n> [!quote]- 原始提交\n> \`\`\`text\n> Original line 1\n> Original line 2\n> \`\`\`\n`;
  const result=renderJournalDetail(full);
  assert.match(result,/心情：\*\*3\/10\*\* · 今日狀態：\*\*1\/10\*\*/);
  assert.match(result,/calm、tired/);
  assert.match(result,/Synthetic event/);
  assert.match(result,/Synthetic reflection/);
  assert.match(result,/Manual private note\./);
  assert.match(result,/> Original line 1\n> Original line 2/);
  assert.equal((result.match(/^> \[!quote\]-/gm)??[]).length,1);
  assert.equal(renderJournalDetail(result),result);
});

test('new daily template starts in compact empty state',()=>{
  const template=journalDetailTemplate();
  assert.match(template,/cssclasses: \[the-unseen-journal-detail\]/);
  assert.match(template,/\[!info\] 尚未填寫/);
  assert.equal(renderJournalDetail(template.replaceAll('{{date:YYYY-MM-DD}}','2026-10-18')).includes('尚未填寫'),true);
});
