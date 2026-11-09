const assert=require('node:assert/strict');
const {Client,LobbyClient}=require('boardgame.io/client');
const {SocketIO}=require('boardgame.io/multiplayer');
const {BattleForRokugan,availablePlacements}=require('../build/engine/src/full-game.js');
const server=process.env.TEST_SERVER??'http://localhost:3001',lobby=new LobbyClient({server});
async function until(fn){const deadline=Date.now()+10000;while(Date.now()<deadline){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error('Network state timeout');}
(async()=>{
 const n=Number(process.env.TEST_PLAYERS??3),{matchID}=await lobby.createMatch(BattleForRokugan.name,{numPlayers:n,setupData:{expansions:[]}}),clients=[],options=[];
 try{
  for(let i=0;i<n;i++){
   const playerID=String(i),{playerCredentials}=await lobby.joinMatch(BattleForRokugan.name,matchID,{playerID,playerName:`QA ${i}`});
   const opts={game:BattleForRokugan,numPlayers:n,matchID,playerID,credentials:playerCredentials,multiplayer:SocketIO({server}),debug:false};options.push(opts);const c=Client(opts);c.start();clients.push(c);
  }
  const watch=Client({game:BattleForRokugan,numPlayers:n,matchID,multiplayer:SocketIO({server}),debug:false});watch.start();clients.push(watch);
  await until(()=>clients.every(c=>c.getState()?.isConnected));
  for(let i=0;i<n;i++){const rev=clients[i].getState().G.revision;clients[i].moves.act({type:'ready',ready:true,name:'QA '+i});await until(()=>clients.every(c=>c.getState()?.G.revision>rev));}
  clients[0].moves.act({type:'start'});await until(()=>clients.every(c=>c.getState()?.G.phase==='objective'));
  let steps=0;
  while(!watch.getState().ctx.gameover&&steps++<500){
   const view=watch.getState().G,c=clients[+view.active],g=c.getState().G,id=g.active;let a;
   switch(g.phase){
    case 'clan':a={type:'clan',clan:['scorpion','unicorn','dragon'][+id]};break;
    case 'objective':a={type:'objective',objective:g.secrets[id].objectives[0]};break;
    case 'draft':a={type:'draft',province:Object.values(g.round.provinces).find(p=>p.owner===null).id};break;
    case 'dragon':a={type:'dragon',token:g.round.players[id].hand.find(t=>t.kind!=='bluff').id};break;
    case 'upkeep':a={type:'pass'};break;
    case 'placement':a={type:'place',placement:availablePlacements(g,id)[0]};break;
    case 'unicorn':a={type:'unicorn',ids:[]};break;
    case 'reveal':a={type:'reveal-next'};break;
    case 'resolution':a={type:'continue'};break;
    default:throw Error(g.phase);
   }
   const rev=g.revision;c.moves.act(a);
   await until(()=>clients.every(c=>c.getState()?.G.revision>rev)).catch(e=>{console.error({steps,phase:g.phase,action:a.type,states:clients.map(x=>({id:x.playerID,rev:x.getState()?.G.revision,errors:x.getState()?.G.errors}))});throw e;});
   const spectator=watch.getState().G;
   for(const p of spectator.seats){assert.deepEqual(spectator.round.players[p].hand,[]);assert.deepEqual(spectator.secrets[p].pool,[]);assert.deepEqual(spectator.secrets[p].objectives,[]);if(spectator.phase!=='finished')assert.equal(spectator.secrets[p].objective,null);}
   if(!spectator.round.revealed)assert(spectator.round.orders.every(o=>!o.token||o.token.kind==='blessing'||o.faceup));
   assert.deepEqual(spectator.initiative,[]);
   const other=clients.find(x=>x.playerID!==id);
   assert.equal(other.log.filter(e=>e.action.payload.type==='act').at(-1)?.action.payload.args,null);
   if(steps===50){c.stop();const replacement=Client(options[+id]);clients[+id]=replacement;replacement.start();await until(()=>replacement.getState()?.isConnected&&replacement.getState()?.G.revision>rev);}
  }
  assert.equal(watch.getState().G.phase,'finished');assert.equal(watch.getState().G.number,5);assert(watch.getState().G.winners.length);
  assert.equal(watch.getState().G.results.length,n);
  console.log(`RESULT_URL=${server}/#/m/${matchID}/watch`);
  console.log(JSON.stringify(watch.getState().G.results));
  console.log(`PASS: complete ${n}-player Socket.IO game (${steps} actions), five rounds, spectator secrecy, private objectives, redacted logs, reconnect, final scoring`);
 }finally{clients.forEach(c=>c.stop());}
})().catch(e=>{console.error(e);process.exitCode=1;});
