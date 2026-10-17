const placeholder='__HEARTH_BACKGROUND_DATA_URI__';
const pngSignature=Buffer.from('89504e470d0a1a0a','hex');

export function compileInteriorCss(template,image){
  if(typeof template!=='string'||template.split(placeholder).length!==2)throw Error('Expected one Hearth background placeholder');
  if(!Buffer.isBuffer(image)||!image.subarray(0,8).equals(pngSignature))throw Error('Expected existing Hearth PNG');
  return template.replace(placeholder,`data:image/png;base64,${image.toString('base64')}`);
}
