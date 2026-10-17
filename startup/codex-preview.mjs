import {playStartup} from '/animation.mjs';
const result=document.getElementById('result');let requested=false;
async function launch(){if(requested)return;requested=true;try{const response=await fetch('/launch',{method:'POST'});if(!response.ok)throw Error(`HTTP ${response.status}`);const body=await response.json();result.textContent=body.preview?' Preview complete.':body.dryRun?' Dry run complete.':' Opening Codex…';}catch(error){requested=false;result.textContent=` Launch failed: ${error.message}. Use the direct shortcut.`}}
document.getElementById('direct').onclick=launch;
try{const config=await(await fetch('/config.json')).json();await playStartup(config,{force:true});await launch()}catch(error){result.textContent=` Preview failed: ${error.message}`;await launch()}
