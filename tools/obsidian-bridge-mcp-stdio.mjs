import readline from 'node:readline';
import {createObsidianBridge} from '../lib/obsidian-write-bridge.mjs';
import {bridgeTools,callBridgeTool} from '../lib/obsidian-bridge-tools.mjs';

// Run as the private stdio endpoint of an authenticated Secure MCP Tunnel.
// No socket is opened; the tunnel controls which ChatGPT workspace can invoke it.
const bridge=await createObsidianBridge(process.env.OBSIDIAN_VAULT);
const exposedTools=bridgeTools.filter(tool=>tool.name!=='save_aftereffect_finding');
const exposedNames=new Set(exposedTools.map(tool=>tool.name));
const send=value=>process.stdout.write(JSON.stringify(value)+'\n');
const error=(id,code,message)=>({jsonrpc:'2.0',id,error:{code,message}});
const lines=readline.createInterface({input:process.stdin,crlfDelay:Infinity});
for await(const line of lines){
  let request;
  try{
    if(Buffer.byteLength(line)>65536){send(error(null,-32600,'Request too large'));continue;}
    request=JSON.parse(line);
    if(!request||typeof request!=='object'||Array.isArray(request))throw Error('Invalid request');
    if(request.method==='notifications/initialized'||request.method==='notifications/cancelled')continue;
    if(!Object.hasOwn(request,'id'))continue;
    if(request.method==='initialize'){
      send({jsonrpc:'2.0',id:request.id,result:{protocolVersion:'2025-06-18',capabilities:{tools:{listChanged:false}},serverInfo:{name:'personal-ai-os-obsidian',version:'0.1.0'},instructions:'Obsidian is canonical. Save only user-provided answers. Generate one UUID per intended write and reuse it on retry. Never infer risk findings from mood scores.'}});
    }else if(request.method==='ping')send({jsonrpc:'2.0',id:request.id,result:{}});
    else if(request.method==='tools/list')send({jsonrpc:'2.0',id:request.id,result:{tools:exposedTools}});
    else if(request.method==='tools/call'){
      try{
        if(!exposedNames.has(request.params?.name))throw Error('Unknown bridge tool');
        const result=await callBridgeTool(bridge,request.params?.name,request.params?.arguments);
        send({jsonrpc:'2.0',id:request.id,result:{content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result,isError:false}});
      }catch(cause){
        const detail={code:cause.code??'operation_failed',message:cause.status>=500?'Bridge operation failed':cause.message};
        send({jsonrpc:'2.0',id:request.id,result:{content:[{type:'text',text:JSON.stringify(detail)}],isError:true}});
      }
    }else send(error(request.id,-32601,'Method not found'));
  }catch{send(error(request?.id??null,-32600,'Invalid request'));}
}
