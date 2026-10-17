import test from 'node:test';
import assert from 'node:assert/strict';
import {moodChart} from '../lib/obsidian-charts.mjs';

test('mood chart has transparent canvas and labels every recorded date without inventing scores',()=>{
  const dates=['2026-10-13','2026-10-14','2026-10-15','2026-10-16','2026-10-17'];
  const mood=[4,4,8,3,null],state=[5,5,5,1,null];
  const svg=moodChart(dates.map((date,i)=>({date,mood:mood[i],state:state[i]})));
  assert.doesNotMatch(svg,/<rect width="900" height="300"[^>]*fill=/);
  for(const date of dates)assert.match(svg,new RegExp(date.slice(5).replace('-','/')));
  assert.equal((svg.match(/y="272"/g)||[]).length,5);
  assert.doesNotMatch(svg,/846,[0-9]+/);
  assert.match(svg,/36,188/); // The 10/13 mood value remains 4/10.
});
