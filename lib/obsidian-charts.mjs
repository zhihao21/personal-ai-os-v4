import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {readRecords} from './obsidian-prototype.mjs';

const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const shell=(title,body,width=900,height=300)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}"><rect width="${width}" height="${height}" rx="18" fill="#1b1714"/><rect x="1" y="1" width="${width-2}" height="${height-2}" rx="17" fill="none" stroke="#57432f"/><text x="28" y="40" fill="#f2e8db" font-family="sans-serif" font-weight="700" font-size="19">${esc(title)}</text>${body}</svg>`;
const empty=(title,message)=>shell(title,`<text x="28" y="155" fill="#b9a99a" font-family="sans-serif" font-size="17">${esc(message)}</text>`);
const validScore=n=>typeof n==='number' && Number.isFinite(n) && n>=1 && n<=10;
const segments=(points,spacing)=>{const result=[];let current=[];points.forEach((point,i)=>{if(point===null){if(current.length)result.push(current);current=[];}else current.push(`${36+i*spacing},${242-(point-1)*18}`);});if(current.length)result.push(current);return result;};

export function moodChart(records) {
  const rows=records.filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r.date??'')).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
  if(!rows.length)return empty('心情・整體狀態・每日綜合','尚無日誌紀錄；填寫日誌後更新圖表。');
  const spacing=Math.min(58,810/Math.max(1,rows.length-1));
  let body='';
  for(let score=2;score<=10;score+=2){const y=242-(score-1)*18;body+=`<line x1="34" y1="${y}" x2="856" y2="${y}" stroke="#47392d"/><text x="8" y="${y+4}" fill="#aa9a8b" font-family="sans-serif" font-size="11">${score}</text>`;}
  const series=[
    {color:'#e3b777',values:rows.map(r=>validScore(r.mood)?r.mood:null)},
    {color:'#94abc5',values:rows.map(r=>validScore(r.state)?r.state:null)},
    {color:'#88b9a0',values:rows.map(r=>validScore(r.mood)&&validScore(r.state)?(r.mood+r.state)/2:null)}
  ];
  for(const s of series)for(const points of segments(s.values,spacing)){if(points.length>1)body+=`<polyline points="${points.join(' ')}" fill="none" stroke="${s.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;else body+=`<circle cx="${points[0].split(',')[0]}" cy="${points[0].split(',')[1]}" r="4" fill="${s.color}"/>`;}
  rows.forEach((r,i)=>{if(i===0||i===rows.length-1||i%3===0)body+=`<text x="${36+i*spacing}" y="272" fill="#aa9a8b" font-family="sans-serif" font-size="10">${esc(r.date.slice(5))}</text>`;});
  body+='<circle cx="555" cy="35" r="5" fill="#e3b777"/><text x="565" y="39" fill="#ded1c0" font-family="sans-serif" font-size="12">心情</text><circle cx="645" cy="35" r="5" fill="#94abc5"/><text x="655" y="39" fill="#ded1c0" font-family="sans-serif" font-size="12">狀態</text><circle cx="735" cy="35" r="5" fill="#88b9a0"/><text x="745" y="39" fill="#ded1c0" font-family="sans-serif" font-size="12">綜合</text>';
  return shell('心情・整體狀態・每日綜合',body);
}

export function riskChart(events,observations) {
  if(!events.length&&!observations.length)return empty('生活風險摘要','原型尚無風險紀錄；空白不代表實際風險為零。');
  const current=events.filter(e=>e.lifecycle==='current').length,historical=events.filter(e=>e.lifecycle==='closed'&&e.severity==='high').length;
  const positive=events.filter(e=>e.direction==='positive').length,negative=events.filter(e=>e.direction==='negative').length;
  const cards=[['目前追蹤',current,'#e3b777'],['歷史高風險',historical,'#a797bb'],['正向高峰',positive,'#88b9a0'],['負向低谷',negative,'#d68f83'],['延後觀察',observations.length,'#d4ad78']];
  let body='';
  cards.forEach(([name,value,color],i)=>{const x=25+i*174;body+=`<rect x="${x}" y="78" width="158" height="156" rx="12" fill="#28211b" stroke="${color}"/><text x="${x+15}" y="113" fill="#d2c0ac" font-family="sans-serif" font-size="14">${esc(name)}</text><text x="${x+15}" y="183" fill="${color}" font-family="sans-serif" font-weight="700" font-size="48">${value}</text>`;});
  body+='<text x="27" y="271" fill="#ad9c8b" font-family="sans-serif" font-size="12">暫定、非臨床；歷史事件不等於目前危機，沒有觀察就不推論趨勢。</text>';
  return shell('生活風險摘要',body);
}

export function activityChart(tasks) {
  const total=tasks.length,done=tasks.filter(t=>t.status==='done').length,open=total-done;
  if(!total)return empty('任務進度','尚無任務紀錄；新增任務後更新圖表。');
  const pct=Math.round(done/total*100),fill=Math.max(0,Math.min(100,pct));
  const body=`<text x="28" y="108" fill="#d2c0ac" font-family="sans-serif" font-size="15">已完成 ${done} ／ ${total}</text><rect x="28" y="138" width="720" height="22" rx="11" fill="#47392d"/><rect x="28" y="138" width="${720*fill/100}" height="22" rx="11" fill="#d9ac72"/><text x="28" y="215" fill="#f1e5d6" font-family="sans-serif" font-size="17">待辦 ${open}　·　完成率 ${pct}%</text>`;
  return shell('任務進度',body);
}

export function calendarChart(schedule,tasks,now=new Date()) {
  if(!schedule.length&&!tasks.length)return empty('本週日曆','原型尚無行程或任務；請使用下方資料檢視新增。');
  const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(p=>[p.type,p.value]));
  const local=new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00Z`);
  const day=local.getUTCDay(),monday=new Date(local);monday.setUTCDate(local.getUTCDate()-((day+6)%7));
  const days=Array.from({length:7},(_,i)=>{const d=new Date(monday);d.setUTCDate(monday.getUTCDate()+i);return d.toISOString().slice(0,10)});
  let body='';
  days.forEach((date,i)=>{const x=24+i*124,items=[...schedule.filter(s=>s.starts_at?.slice(0,10)===date),...tasks.filter(t=>t.due?.slice(0,10)===date)];body+=`<rect x="${x}" y="70" width="116" height="186" rx="9" fill="#28211b" stroke="#57432f"/><text x="${x+9}" y="96" fill="#dac9b5" font-family="sans-serif" font-size="13">${esc(date.slice(5))}</text><text x="${x+9}" y="145" fill="${items.length?'#e3b777':'#8a7865'}" font-family="sans-serif" font-size="22">${items.length}</text><text x="${x+9}" y="172" fill="#ad9c8b" font-family="sans-serif" font-size="11">行程／任務</text>`;});
  return shell('本週日曆',body);
}

export async function renderCharts(root, now=new Date()) {
  const [journal,risks,observations,tasks,schedule]=await Promise.all(['Journal','Risks','Observations','Tasks','Schedule'].map(folder=>readRecords(root,folder)));
  const ids=new Set(),dates=new Set();
  for(const r of risks){if(r.event_id){if(ids.has(r.event_id))throw Error('Duplicate event ID');ids.add(r.event_id);}}
  for(const r of journal){if(r.date){if(dates.has(r.date))throw Error('Duplicate journal date');dates.add(r.date);}}
  const charts={'mood-trend.svg':moodChart(journal),'risk-summary.svg':riskChart(risks,observations),'activity.svg':activityChart(tasks),'calendar.svg':calendarChart(schedule,tasks,now)};
  for(const [name,svg] of Object.entries(charts))await writeFile(path.join(root,'Assets',name),svg);
  return {journal:journal.length,risks:risks.length,observations:observations.length,tasks:tasks.length,schedule:schedule.length};
}
