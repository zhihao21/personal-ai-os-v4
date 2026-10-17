import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {spawn,execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.dirname(fileURLToPath(import.meta.url));
const preview=process.argv.includes('--preview');
const dryRun=process.argv.includes('--dry-run');
const identity='OpenAI.Codex_2p2nqsd0c76g0!App';
const edge='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let launched=false;
function openCodex(){if(launched)return;launched=true;if(dryRun){console.log('DRY RUN: would open '+identity);return;}const child=spawn('explorer.exe',[`shell:AppsFolder\\${identity}`],{detached:true,stdio:'ignore',windowsHide:true});child.unref();}
const assets={'/':'codex-preview.html','/animation.css':'animation.css','/animation.mjs':'animation.mjs','/codex-preview.css':'codex-preview.css','/codex-preview.mjs':'codex-preview.mjs','/config.json':'codex-config.json'};
const server=http.createServer(async(req,res)=>{try{
 const host=`127.0.0.1:${server.address().port}`;if(req.headers.host!==host){res.writeHead(403).end();return;}
 const pathname=new URL(req.url,`http://${host}`).pathname;
 if(req.method==='POST'&&pathname==='/launch'){if(req.headers.origin!==`http://${host}`){res.writeHead(403).end();return;}if(!preview)openCodex();res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({ok:true,dryRun,preview}));if(!preview)setTimeout(()=>server.close(),800);return;}
 if(req.method==='GET'&&assets[pathname]){const name=assets[pathname];res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':'text/javascript');res.setHeader('Cache-Control','no-store');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'");res.end(await readFile(path.join(root,name)));return;}
 res.writeHead(404).end();
 }catch(error){console.error(error);res.writeHead(500).end();}});
server.listen(0,'127.0.0.1',()=>{const url=`http://127.0.0.1:${server.address().port}/`;console.log(url);if(preview)return;const browser=spawn(edge,[`--app=${url}`,'--new-window'],{detached:true,stdio:'ignore',windowsHide:true});browser.on('error',error=>{console.error('Preview failed:',error.message);openCodex();server.close()});browser.unref();setTimeout(()=>{if(!launched){console.error('Startup timed out; opening Codex directly.');openCodex();server.close()}},30000).unref();});
server.on('error',error=>{console.error('Preview server failed:',error.message);openCodex();});
