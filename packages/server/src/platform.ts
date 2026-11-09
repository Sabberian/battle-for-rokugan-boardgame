import {timingSafeEqual} from 'node:crypto';
import type {IncomingMessage} from 'node:http';
import type {Server} from 'boardgame.io/server';

async function readBody(req:IncomingMessage):Promise<Record<string,unknown>>{
 let body='';for await(const chunk of req){body+=chunk.toString();if(Buffer.byteLength(body)>4096)throw Error('too large');}
 const parsed=JSON.parse(body||'{}');if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))throw Error('invalid body');return parsed;
}
/** Same opt-in platform contract as the reference projects. Secret never enters client code. */
export function addPlatformRoutes(server:ReturnType<typeof Server>){
 const secret=process.env.PLATFORM_SECRET;if(!secret)return;
 const authorized=(value:string)=>{const actual=Buffer.from(value),expected=Buffer.from(secret);return actual.length===expected.length&&timingSafeEqual(actual,expected);};
 server.router.post('/platform/matches/:id/leave',async ctx=>{
  if(!authorized(ctx.get('x-platform-secret'))){ctx.status=403;return;}
  let body:Record<string,unknown>;try{body=await readBody(ctx.req);}catch{ctx.status=400;return;}
  const name=typeof body.playerName==='string'?body.playerName.trim().toLowerCase():'';if(!name){ctx.status=400;return;}
  const {metadata}=await server.db.fetch(ctx.params.id,{metadata:true});if(!metadata){ctx.status=404;return;}
  let left=0;for(const player of Object.values(metadata.players)){if(player.name?.toLowerCase()!==name)continue;delete player.name;delete player.credentials;delete player.data;left++;}
  if(left){metadata.updatedAt=Date.now();await server.db.setMetadata(ctx.params.id,metadata);}ctx.body={left};
 });
 server.router.delete('/platform/matches/:id',async ctx=>{
  if(!authorized(ctx.get('x-platform-secret'))){ctx.status=403;return;}
  const {metadata}=await server.db.fetch(ctx.params.id,{metadata:true});if(!metadata){ctx.status=404;return;}
  await server.db.wipe(ctx.params.id);ctx.body={ok:true};
 });
}
