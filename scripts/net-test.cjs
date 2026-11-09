const assert=require('node:assert/strict');
const {Client,LobbyClient}=require('boardgame.io/client');
const {SocketIO}=require('boardgame.io/multiplayer');
const {RokuganLab}=require('../build/engine/src/game.js');
const server=process.env.TEST_SERVER??'http://localhost:3001';
const lobby=new LobbyClient({server});
async function until(fn){const deadline=Date.now()+10000;while(Date.now()<deadline){if(fn())return;await new Promise(r=>setTimeout(r,30));}throw Error('Network state timeout');}
(async()=>{
  const {matchID}=await lobby.createMatch(RokuganLab.name,{numPlayers:2,setupData:{mode:'combat-lab',players:2,expansions:[]}});
  const clients=[];
  try{
    for(const playerID of ['0','1']){
      const {playerCredentials}=await lobby.joinMatch(RokuganLab.name,matchID,{playerID,playerName:`Network test ${playerID}`});
      const c=Client({game:RokuganLab,numPlayers:2,matchID,playerID,credentials:playerCredentials,multiplayer:SocketIO({server}),debug:false});c.start();clients.push(c);
    }
    const watch=Client({game:RokuganLab,numPlayers:2,matchID,multiplayer:SocketIO({server}),debug:false});watch.start();clients.push(watch);
    await until(()=>clients.every(c=>c.getState()?.isConnected));
    const [a,b]=clients;
    a.moves.place({token:'0-0',target:'e',from:'b'});
    await until(()=>b.getState()?.G.round.orders.length===1 && watch.getState()?.G.round.orders.length===1);
    assert.equal(b.getState().G.round.orders[0].token,null);
    assert.equal(watch.getState().G.round.orders[0].token,null);
    assert.deepEqual(watch.getState().G.round.players['0'].hand,[]);
    assert.equal(b.log.find(e=>e.action.payload.type==='place').action.payload.args,null);
    b.moves.ready();await until(()=>a.getState()?.ctx.currentPlayer==='0');
    a.moves.ready();await until(()=>clients.every(c=>c.getState()?.ctx.gameover));
    assert.equal(b.getState().G.round.provinces.e.owner,'0');
    b.stop();b.start();await until(()=>b.getState()?.isConnected&&b.getState()?.ctx.gameover);
    assert.equal(b.getState().G.round.provinces.e.owner,'0');
    console.log('PASS: HTTP lobby, 2 Socket.IO players, spectator secrecy, redacted log, resolution, reconnect');
  }finally{clients.forEach(c=>c.stop());}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
