import test from 'node:test';
import assert from 'node:assert/strict';
import {todayTimetableQuery, weeklyTimetableQuery} from '../lib/hearth-timetable.mjs';

test('recurring timetable reads one private source without creating event notes', () => {
  for (const query of [todayTimetableQuery, weeklyTimetableQuery]) {
    assert.match(query, /Data\/每週課表/);
    assert.doesNotMatch(query, /vault\.(create|modify)/);
    assert.doesNotMatch(query, /待確認|unverified|tentative/);
  }
  assert.match(todayTimetableQuery, /Asia\/Taipei/);
  assert.match(weeklyTimetableQuery, /週五/);
  assert.match(weeklyTimetableQuery, /無固定課程/);
  assert.match(weeklyTimetableQuery, /entry\.weekday/);
});
