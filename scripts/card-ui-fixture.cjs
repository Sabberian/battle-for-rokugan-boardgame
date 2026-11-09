// Isolated deterministic UI fixtures. Never points at the normal match store.
const {FlatFile}=require('boardgame.io/server');
const {InitializeGame}=require('boardgame.io/internal');
const {BattleForRokugan,setupFull,act}=require('../build/engine/src/full-game');
const path=require('node:path');
const dir=path.resolve(__dirname,'../../../work/qa-card-ui');
const shuffle=x=>[...x];
(async()=>{const db=new FlatFile({dir});await db.connect();for(const phase of ['upkeep','placement']){
 let g=setupFull(2,shuffle);const move=a=>{const r=act(g,g.active,a,shuffle);if(r.error)throw Error(r.error);g=r.state;};
 for(const clan of ['scorpion','unicorn'])move({type:'clan',clan});
 while(g.phase==='objective')move({type:'objective',objective:g.secrets[g.active].objectives[0]});
 while(g.phase==='draft')move({type:'draft',province:Object.values(g.round.provinces).find(p=>p.owner===null).id});
 g.phase=phase;g.active='0';g.cinematic=true;g.manual=false;g.round.provinces['1'].owner='0';g.round.provinces['2'].owner='1';g.round.provinces['3'].owner='0';g.round.provinces['5'].owner='0';
 for(const [territory,id]of [['islands','pirates'],['scorpion','spy'],['south','animate'],['north','purge']]){g.cards=g.cards.filter(c=>c.territory!==territory);g.cards.push({territory,id,owner:'0',used:false,revealed:true});}
 g.cards.find(c=>c.territory==='crane').owner='1';
 for(const player of ['0','1']){const hand=g.round.players[player].hand,pool=g.secrets[player].pool;const source=hand.some(t=>t.kind==='army')?hand:pool,at=source.findIndex(t=>t.kind==='army');const token=source.splice(at,1)[0];g.round.orders.push({id:`order-${g.round.nextOrder++}`,player,token,target:'1'});}
 const sec=g.secrets['0'],at=sec.pool.findIndex(t=>t.kind==='army');g.round.discarded.push(sec.pool.splice(at,1)[0]);
 const state=InitializeGame({game:BattleForRokugan,numPlayers:2});state.G=g;
 const matchID=`qa-${phase}-${Date.now()}`;await db.createMatch(matchID,{initialState:state,metadata:{gameName:BattleForRokugan.name,players:{0:{id:0},1:{id:1,name:'Соперник'}},createdAt:Date.now(),updatedAt:Date.now(),setupData:{}}});console.log('http://localhost:3002/#/m/'+matchID);
}})().catch(e=>{console.error(e);process.exitCode=1;});
