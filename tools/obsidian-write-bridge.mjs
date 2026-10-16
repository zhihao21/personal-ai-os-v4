import http from 'node:http';
import {readFile, lstat} from 'node:fs/promises';
import {timingSafeEqual} from 'node:crypto';
import {createObsidianBridge, BridgeError} from '../lib/obsidian-write-bridge.mjs';

const tokenPath=process.env.OBSIDIAN_BRIDGE_TOKEN_FILE;
if(!tokenPath)throw Error('OBSIDIAN_BRIDGE_TOKEN_FILE is required');
const tokenInfo=await lstat(tokenPath);
if(!tokenInfo.isFile()||tokenInfo.isSymbolicLink())throw Error('Token file must be a regular file');
const token=(await readFile(tokenPath,'utf8')).trim();
if(token.length<32||token.length>256)throw Error('Token must have 32 to 256 characters');
const secret=Buffer.from(token);
const bridge=await createObsidianBridge(process.env.OBSIDIAN_VAULT);
const configuredPort=Number(process.env.OBSIDIAN_BRIDGE_PORT??4311);
if(!Number.isInteger(configuredPort)||configuredPort<0||configuredPort>65535)throw Error('Invalid bridge port');

const response=(res,status,value)=>{
  res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
  res.end(JSON.stringify(value));
};
const decode=async req=>{
  if(!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type']??''))throw new BridgeError('application/json required',415,'unsupported_media_type');
  let size=0;const chunks=[];
  for await(const chunk of req){size+=chunk.length;if(size>65536)throw new BridgeError('Request too large',413,'request_too_large');chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new BridgeError('Invalid JSON',400,'invalid_json');}
};
const server=http.createServer(async(req,res)=>{
  try{
    const port=server.address().port;
    if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(req.headers.host))throw new BridgeError('Invalid host',403,'forbidden');
    if(req.headers.origin)throw new BridgeError('Browser origin not allowed',403,'forbidden');
    const supplied=req.headers.authorization?.match(/^Bearer (\S+)$/)?.[1];
    const candidate=Buffer.from(supplied??'');
    if(candidate.length!==secret.length||!timingSafeEqual(candidate,secret))throw new BridgeError('Authentication required',401,'unauthorized');
    const url=new URL(req.url,`http://127.0.0.1:${port}`);
    let data;
    if(req.method==='GET'&&url.pathname==='/health'&&!url.search)data={status:'ready'};
    else if(req.method==='GET'&&url.pathname==='/v1/journals'){
      if([...url.searchParams.keys()].some(key=>key!=='limit'))throw new BridgeError('Invalid query');
      data=await bridge.listRecentJournals(url.searchParams.has('limit')?{limit:Number(url.searchParams.get('limit'))}:{});
    }else if(req.method==='GET'&&/^\/v1\/journals\/\d{4}-\d{2}-\d{2}$/.test(url.pathname)&&!url.search)data=await bridge.getJournal({date:url.pathname.split('/').at(-1)});
    else if(req.method==='POST'&&url.pathname==='/v1/journals'&&!url.search)data=await bridge.upsertJournal(await decode(req));
    else if(req.method==='POST'&&url.pathname==='/v1/journals/verify'&&!url.search)data=await bridge.verifyJournal(await decode(req));
    else if(req.method==='POST'&&url.pathname==='/v1/events'&&!url.search)data=await bridge.addLifeEvent(await decode(req));
    else if(req.method==='POST'&&url.pathname==='/v1/aftereffect/findings'&&!url.search)data=await bridge.addAftereffectFinding(await decode(req));
    else throw new BridgeError('Operation not found',404,'not_found');
    response(res,200,{ok:true,data});
  }catch(error){
    const known=error instanceof BridgeError;
    response(res,known?error.status:500,{ok:false,error:{code:known?error.code:'operation_failed',message:known?error.message:'Bridge operation failed'}});
  }
});
server.requestTimeout=15000;
server.listen(configuredPort,'127.0.0.1',()=>process.stdout.write(JSON.stringify({status:'listening',host:'127.0.0.1',port:server.address().port})+'\n'));
