const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const {createServer}=require('node:net');
const {mkdtempSync}=require('node:fs');
const {tmpdir}=require('node:os');
const path=require('node:path');
const {randomBytes}=require('node:crypto');
const {Client}=require('boardgame.io/client');
const {SocketIO}=require('boardgame.io/multiplayer');
const {BattleForRokugan}=require('../build/engine/src/full-game.js');
const root=path.resolve(__dirname,'..'),dir=mkdtempSync(path.join(tmpdir(),'rokugan-platform-')),secret=randomBytes(24).toString('hex');
let child,clients=[],base,port,logs='';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<160;i++){if(await fn())return;await delay(50);}throw Error('Timed out');}
async function request(url,method='GET',body,auth=false,expected=200){const r=await fetch(base+url,{method,headers:{'content-type':'application/json',...(auth?{'x-platform-secret':secret}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(6000)});assert.equal(r.status,expected,method+' '+url);return r.headers.get('content-type')?.includes('json')?r.json():r.text();}
async function start(){child=spawn(process.execPath,['build/server/src/index.js'],{cwd:root,env:{...process.env,PORT:String(port),PUBLIC_URL:'https://rokugan.zarya-boardgames.ru',MATCHES_DIR:dir,PLATFORM_SECRET:secret},stdio:['ignore','pipe','pipe'],windowsHide:true});child.stdout.on('data',x=>logs+=x);child.stderr.on('data',x=>logs+=x);await until(async()=>{try{return(await fetch(base+'/health',{signal:AbortSignal.timeout(500)})).ok;}catch{return false;}});}
async function stop(){if(!child)return;const proc=child;child=null;await new Promise(resolve=>{proc.once('exit',resolve);proc.kill();});}
(async()=>{const probe=createServer();await new Promise(r=>probe.listen(0,'127.0.0.1',r));port=probe.address().port;await new Promise(r=>probe.close(r));base='http://127.0.0.1:'+port;
 try{await start();assert.equal((await request('/health')).game,'battle-for-rokugan');assert.deepEqual(await request('/games'),['battle-for-rokugan']);
 const cors=await fetch(base+'/games',{headers:{Origin:'https://rokugan.zarya-boardgames.ru'}});assert.equal(cors.headers.get('access-control-allow-origin'),'https://rokugan.zarya-boardgames.ru');
 const {matchID}=await request('/games/battle-for-rokugan/create','POST',{numPlayers:4});
 for(let i=0;i<4;i++){const {playerCredentials}=await request(`/games/battle-for-rokugan/${matchID}/join`,'POST',{playerID:String(i),playerName:'Import QA '+i});const client=Client({game:BattleForRokugan,numPlayers:4,matchID,playerID:String(i),credentials:playerCredentials,multiplayer:SocketIO({server:base}),debug:false});client.start();clients.push(client);}
 await until(()=>clients.every(c=>c.getState()?.isConnected));
 for(let i=0;i<4;i++){clients[i].moves.act({type:'ready',ready:true,name:'Import QA '+i});await until(()=>clients.every(c=>c.getState()?.G.lobby.ready[String(i)]));}
 clients[1].moves.act({type:'start'});await until(()=>!!clients[1].getState()?.G.errors['1']);assert.equal(clients[0].getState().G.phase,'lobby');
 clients[0].moves.act({type:'start'});await until(()=>clients.every(c=>c.getState()?.G.phase==='objective'));clients.forEach(c=>c.stop());clients=[];
 await stop();await start();const restored=await request(`/games/battle-for-rokugan/${matchID}`);assert.equal(restored.players.filter(p=>p.name).length,4);
 await request(`/platform/matches/${matchID}/leave`,'POST',{playerName:'Import QA 2'},false,403);
 assert.equal((await request(`/platform/matches/${matchID}/leave`,'POST',{playerName:'Import QA 2'},true)).left,1);
 assert.equal((await request(`/games/battle-for-rokugan/${matchID}`)).players[2].name,undefined);
 const join=await request(`/games/battle-for-rokugan/${matchID}/join`,'POST',{playerID:'2',playerName:'Replacement QA'});assert.ok(join.playerCredentials);
 await request(`/platform/matches/${matchID}`,'DELETE',undefined,false,403);assert.equal((await request(`/platform/matches/${matchID}`,'DELETE',undefined,true)).ok,true);
 await request(`/games/battle-for-rokugan/${matchID}`,'GET',undefined,false,404);
 console.log('PASS: game registration, CORS, 4 seats, host-only start, restart persistence, authenticated leave/rejoin/delete.');
 }finally{clients.forEach(c=>c.stop());await stop();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
