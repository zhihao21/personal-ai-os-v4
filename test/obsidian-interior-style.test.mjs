import test from 'node:test';
import assert from 'node:assert/strict';
import {compileInteriorCss} from '../lib/obsidian-interior-style.mjs';

test('interior CSS embeds the existing PNG without a Dataview bootstrap',()=>{
  const png=Buffer.from('89504e470d0a1a0a00000000','hex');
  const compiled=compileInteriorCss('background:url("__HEARTH_BACKGROUND_DATA_URI__")',png);
  assert.match(compiled,/data:image\/png;base64,/);
  assert.deepEqual(Buffer.from(compiled.match(/base64,([A-Za-z0-9+/=]+)/)[1],'base64'),png);
  assert.throws(()=>compileInteriorCss('no placeholder',png),/placeholder/);
  assert.throws(()=>compileInteriorCss('__HEARTH_BACKGROUND_DATA_URI__',Buffer.from('not png')),/Hearth PNG/);
});
