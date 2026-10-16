import http from 'node:http';
import {readFile, mkdir, writeFile, rename, copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {validate, merge} from './lib/emotions.mjs';
import {loadNotionDashboard} from './lib/notion-dashboard.mjs';
const root = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.env.DATA_DIR || path.join(root,'data'));
const file = path.join(dir,'emotions.json');
const host = '127.0.0.1';
const port = Number(process.env.PORT || 4310);
async function load() { try { return validate(JSON.parse(await readFile(file,'utf8'))); } catch(e) { if(e.code==='ENOENT') return {schemaVersion:1,events:[]}; throw e; } }
let queue = Promise.resolve();
async function save(data) {
  validate(data); await mkdir(dir,{recursive:true});
  try { await copyFile(file,path.join(dir,`backup-${Date.now()}-${randomUUID()}.json`)); } catch(e) {if(e.code!=='ENOENT') throw e;}
  const tmp = `${file}.${randomUUID()}.tmp`; await writeFile(tmp,JSON.stringify(data,null,2)); await rename(tmp,file);
}
const assets = {'/':'web/index.html','/app.mjs':'web/app.mjs','/style.css':'web/style.css','/emotions.mjs':'lib/emotions.mjs','/dashboard':'web/dashboard.html','/dashboard.css':'web/dashboard.css','/dashboard.mjs':'web/dashboard.mjs'};
const server = http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'");
  const json = (status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  try {
    if (req.headers.host !== `${host}:${port}` && req.headers.host !== `localhost:${port}`) return json(403,{error:'Invalid host'});
    const requestPath = new URL(req.url, `http://${req.headers.host}`).pathname;
    if(req.method==='GET' && req.url==='/api/events') return json(200,await load());
    if(req.method==='GET' && req.url==='/api/dashboard') return json(200,await loadNotionDashboard());
    if(req.method==='POST' && req.url==='/api/edit') {
      if(req.headers.origin !== `http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')) return json(403,{error:'Same-origin JSON required'});
      let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>2000000)return json(413,{error:'Edit too large'});}
      const {original,updated}=JSON.parse(body);
      validate({schemaVersion:1,events:[original]});validate({schemaVersion:1,events:[updated]});
      if(original.id!==updated.id)return json(400,{error:'ID cannot change'});
      const task=queue.then(async()=>{const current=await load();const index=current.events.findIndex(e=>e.id===original.id);if(index<0||JSON.stringify(current.events[index])!==JSON.stringify(original))throw Error('Record changed; refresh before editing');current.events[index]=updated;await save(current);return current;});
      queue=task.catch(()=>{});return json(200,await task);
    }
    if(req.method==='POST' && req.url==='/api/import') {
      if(req.headers.origin !== `http://${req.headers.host}` || !req.headers['content-type']?.startsWith('application/json')) return json(403,{error:'Same-origin JSON required'});
      let body=''; for await(const chunk of req) {body+=chunk; if(Buffer.byteLength(body)>2000000) return json(413,{error:'Import too large'});}
      const incoming=validate(JSON.parse(body));
      const task=queue.then(async()=>{const result=merge(await load(),incoming);await save(result);return result;});
      queue=task.catch(()=>{}); return json(200,await task);
    }
    if(req.method==='GET' && assets[requestPath]) {
      const name=assets[requestPath];res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css':'text/javascript');
      return res.end(await readFile(path.join(root,name)));
    }
    json(404,{error:'Not found'});
  }catch(e){json(400,{error:e.message});}
});
server.listen(port,host,()=>console.log(`Personal AI OS: http://${host}:${port}`));

