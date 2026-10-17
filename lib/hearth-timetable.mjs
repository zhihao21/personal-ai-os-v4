// The source note is private vault data. These queries contain only its portable path.
const sourcePath = 'Personal AI OS V4 Prototype/Data/每週課表';
const common = `const timetable = dv.page(${JSON.stringify(sourcePath)});
const entries = Array.from(timetable?.classes ?? []);
const weekdays = ['週一','週二','週三','週四','週五'];
const time = entry => entry.start_time && entry.end_time
  ? entry.start_time + '–' + entry.end_time
  : '時間未提供';
const add = (parent, tag, value, cls) => parent.createEl(tag,{text:String(value),cls});
`;

export const todayTimetableQuery = `${common}
const dayName = new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',weekday:'long'}).format(new Date());
const day = ({Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5})[dayName];
if (!timetable) dv.paragraph('尚未匯入固定課表。');
else if (!day) dv.paragraph('週末沒有固定課程；臨時行程請查看近期行程。');
else {
  const rows = entries.filter(entry => Number(entry.weekday) === day)
    .sort((a,b) => String(a.start_time ?? '99:99').localeCompare(String(b.start_time ?? '99:99')));
  const panel = dv.container.createDiv({cls:'unseen-timetable-today'});
  if (!rows.length) add(panel,'p','今日沒有固定課程；臨時行程仍顯示於近期行程。');
  for (const entry of rows) {
    const row = panel.createDiv({cls:'unseen-timetable-entry'});
    add(row,'strong',entry.subject);
    add(row,'span',time(entry));
  }
}`;

export const weeklyTimetableQuery = `${common}
if (!timetable) dv.paragraph('尚未匯入固定課表；臨時行程請查看本週行程。');
else {
  const grid = dv.container.createDiv({cls:'unseen-timetable-week'});
  for (let day=1; day<=5; day++) {
    const card=grid.createDiv({cls:'unseen-timetable-day'});
    add(card,'h4',weekdays[day-1]);
    const rows=entries.filter(entry=>Number(entry.weekday)===day)
      .sort((a,b)=>String(a.start_time ?? '99:99').localeCompare(String(b.start_time ?? '99:99')));
    if (!rows.length) add(card,'p',day===5?'無固定課程 · 臨時行程另見本週行程':'尚無已確認課程');
    for (const entry of rows) {
      const row=card.createDiv({cls:'unseen-timetable-entry'});
      add(row,'strong',entry.subject);
      add(row,'span',time(entry));
    }
  }
}`;
