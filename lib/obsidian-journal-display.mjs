const summaryHeading = '## 今日摘要';
const startMarker = '<!-- the-unseen-journal:start -->';
const endMarker = '<!-- the-unseen-journal:end -->';
const className = 'the-unseen-journal-detail';
const fields = ['mood','state','emotional_tags','significant_events','thoughts','important_memories','future_plans','followup'];
const descriptions = [
  ['今日事件','significant_events'],['想法與擔憂','thoughts'],['重要回憶','important_memories'],
  ['未來計畫','future_plans'],['後續事項','followup'],
];

function frontmatter(markdown) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown);
  if (!match) throw Error('Journal note has no frontmatter');
  return match;
}

export function addJournalDetailClass(markdown) {
  const match = frontmatter(markdown);
  if (/^cssclasses:\s*/m.test(match[1])) {
    if (!new RegExp(`^cssclasses:.*\\b${className}\\b`, 'm').test(match[1]))
      throw Error('Existing journal cssclasses need manual inspection');
    return markdown;
  }
  return markdown.replace(match[0], `---\n${match[1]}\ncssclasses: [${className}]\n---\n`);
}

function valuesFrom(markdown) {
  const lines = frontmatter(markdown)[1].split(/\r?\n/);
  const values = {};
  for (const field of ['date',...fields]) {
    const line = lines.find(item => item.startsWith(`${field}:`));
    if (!line) continue;
    const raw = line.slice(field.length + 1).trim();
    if (!raw) continue;
    try { values[field] = JSON.parse(raw); } catch { values[field] = raw; }
  }
  return values;
}

const navigation = '> [!abstract] 快速導覽\n> [日誌總覽](obsidian://advanced-uri?commandid=hearth%3Aopen-dashboard-2) · [今日日誌](obsidian://daily) · [The Unseen](obsidian://advanced-uri?commandid=hearth%3Aopen-dashboard-1)';
const prefix = date => `# ${date}｜每日生活日誌\n\n${navigation}\n\n`;
const editUri = date => `obsidian://advanced-uri?filepath=${encodeURIComponent(`Personal AI OS V4 Prototype/Records/Journal/${date}.md`)}&viewmode=source`;
const quoted = value => String(value).split(/\r?\n/).map(line => `> ${line}`).join('\n');
const score = value => value == null ? '—' : `${value}/10`;

export function journalDetailTemplate() {
  const date = '{{date:YYYY-MM-DD}}';
  return `---\nrecord_type: journal\nrecord_id: "journal-${date}"\ndate: "${date}"\nmood:\nstate:\nemotional_tags: []\nfollowup: ""\nsource_platform: obsidian\nsource_record_id: ""\ncssclasses: [${className}]\n---\n${prefix(date)}${summaryHeading}\n\n> [!info] 尚未填寫\n> 今天沒有已記錄的回答。[開啟填寫模式](obsidian://advanced-uri?filepath=Personal%20AI%20OS%20V4%20Prototype%2FRecords%2FJournal%2F${date}.md&viewmode=source)\n\n---\n`;
}

function emptyLegacyBody(body,date) {
  const lines = body.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const expected = [
    `# ${date}｜每日生活日誌`, '## 今日事件', '## 想法與擔憂',
    '## 重要回憶', '## 未來計畫', '> [!note]- 詳細回顧', '>',
  ];
  return lines.every(line => expected.includes(line)) && lines.some(line => line.startsWith(`# ${date}`));
}

export function renderJournalDetail(markdown) {
  markdown = addJournalDetailClass(markdown);
  const front = frontmatter(markdown);
  const values = valuesFrom(markdown);
  const date = values.date;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw Error('Journal date required');
  const tags = Array.isArray(values.emotional_tags) ? values.emotional_tags.filter(Boolean) : [];
  const details = descriptions.filter(([,key]) => typeof values[key] === 'string' && values[key].trim());
  const originalBody = markdown.slice(front[0].length);
  const answered = values.mood != null || values.state != null || tags.length > 0 || details.length > 0 || originalBody.includes('> [!quote]-');
  const summary = answered
    ? [summaryHeading,'','> [!summary] 今日概況',`> 心情：**${score(values.mood)}** · 今日狀態：**${score(values.state)}**`,
       `> 情緒：${tags.join('、') || '—'}`,`> 已記錄：${details.map(([label]) => label).join('、') || '原始提交'}`,'',
       ...details.flatMap(([label,key]) => [`> [!note]- ${label}`,quoted(values[key]),'']),'---'].join('\n')
    : [summaryHeading,'','> [!info] 尚未填寫',
       `> 今天沒有已記錄的回答。[開啟填寫模式](${editUri(date)})`,'','---'].join('\n');
  let body = originalBody;
  if (body.startsWith(prefix(date))) body = body.slice(prefix(date).length);
  body = body.replace(new RegExp(`^# ${date}｜每日生活日誌\\r?\\n`), '').trimStart();
  if (emptyLegacyBody(originalBody,date)) body = '';
  const start = body.indexOf(startMarker), end = body.indexOf(endMarker);
  if (start !== -1 || end !== -1) {
    if (start === -1 || end < start) throw Error('Incomplete journal display markers');
    body = body.slice(0,start) + summary + body.slice(end + endMarker.length);
  } else {
    const heading = body.indexOf(summaryHeading);
    if (heading !== -1) {
      const divider = /^---[ \t]*$/m.exec(body.slice(heading + summaryHeading.length));
      if (!divider) throw Error('Incomplete journal display section');
      const endAt = heading + summaryHeading.length + divider.index + divider[0].length;
      body = body.slice(0,heading) + summary + body.slice(endAt);
    } else body = summary + (body.trim() ? `\n\n${body}` : '');
  }
  return markdown.slice(0,front[0].length) + prefix(date) + body.trimStart().replace(/\s*$/, '\n');
}
