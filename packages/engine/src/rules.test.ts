import {describe,it,expect} from 'vitest';
import {Client} from 'boardgame.io/client';
import {Local} from 'boardgame.io/multiplayer';
import {createLab,place,placementError,playerView,resolve,scout,shugenja,score,territoryOwners,validateOptions,type RoundState,type TokenKind} from './index';
import {RokuganLab} from './game';

function put(s:RoundState,p:string,kind:TokenKind,target:string,from?:string,strength?:number,parent?:string){
  const t=s.players[p].hand.find(t=>t.kind===kind)!;
  if(strength!==undefined)t.strength=strength;
  expect(place(s,p,{token:t.id,target,from,parent})).toBeNull();
  return s.orders.at(-1)!.id;
}
describe('границы и закрытая информация',()=>{
  it.each(['__proto__','constructor','toString'])('не принимает имя свойства объекта %s вместо провинции',target=>{const s=createLab();expect(place(s,'0',{token:'0-0',target})).toBeTruthy();expect(s.orders).toHaveLength(0);});
  it('запрещает чужие жетоны и повторное размещение',()=>{const s=createLab();expect(place(s,'0',{token:'1-0',target:'a'})).toBeTruthy();put(s,'0','army','a');expect(place(s,'0',{token:'0-0',target:'a'})).toBeTruthy();});
  it('граница занята в обоих направлениях',()=>{const s=createLab();put(s,'0','army','e','b');expect(placementError(s,'1',{token:'1-0',target:'b',from:'e'})).toBeTruthy();});
  it('не разрешает перескочить через провинцию',()=>{const s=createLab();expect(place(s,'0',{token:'0-0',target:'f',from:'a'})).toBeTruthy();});
  it.each(['peace','scorched'] as const)('блокирует %s и с обеих сторон границы',kind=>{const s=createLab();s.provinces.b.special={kind};expect(place(s,'0',{token:'0-0',target:'e',from:'b'})).toBeTruthy();expect(place(s,'0',{token:'0-0',target:'b'})).toBeTruthy();});
  it('святилище допускает исходящий приказ владельца',()=>{const s=createLab();s.provinces.b.special={kind:'shrine'};put(s,'0','army','e','b');expect(place(s,'1',{token:'1-3',target:'b'})).toBeTruthy();});
  it('флот защищает берег; неправильное размещение исчезает при раскрытии',()=>{const s=createLab();put(s,'0','navy','a');expect(resolve(s).provinces.a.control).toBe(0);expect(resolve(s).removed).toHaveLength(1);});
  it('можно блефовать неверным типом на допустимой границе',()=>{const s=createLab();put(s,'0','diplomacy','e','b');expect(resolve(s).provinces.e.special).toBeUndefined();});
  it('зритель и соперник не видят типы, силу, руки и разведданные',()=>{const s=createLab();put(s,'0','army','e','b');for(const who of ['1',null,undefined,'unknown']){const v=playerView(s,who);expect(v.orders[0].token).toBeNull();expect(v.players['0'].hand).toEqual([]);expect(v.players['0'].knowledge).toEqual({});}expect(playerView(s,'0').orders[0].token?.kind).toBe('army');});
  it('разведка раскрывает жетон только разведчику',()=>{const s=createLab(3);const id=put(s,'0','army','a');expect(scout(s,'1',id)).toBeNull();expect(playerView(s,'1').orders[0].token?.kind).toBe('army');expect(playerView(s,'2').orders[0].token).toBeNull();expect(playerView(s,null).players['1'].knowledge).toEqual({});});
  it('благословение открыто и защищает весь стек',()=>{const s=createLab();const id=put(s,'0','army','a');put(s,'0','blessing','a',undefined,2,id);expect(scout(s,'1',id)).toBeTruthy();expect(shugenja(s,'1',id)).toBeTruthy();const v=playerView(s,'1');expect(v.orders[0].token).toBeNull();expect(v.orders[1].token?.kind).toBe('blessing');});
  it('сюгэндзя удаляет приказ, блеф возвращается в руку',()=>{const s=createLab();const id=put(s,'0','bluff','a');expect(shugenja(s,'1',id)).toBeNull();expect(s.players['0'].hand.some(t=>t.kind==='bluff')).toBe(true);expect(s.orders).toHaveLength(0);expect(s.players['1'].shugenja).toBe(0);});
});
describe('одновременный бой',()=>{
  it('две армии захватывают провинции друг друга одновременно',()=>{const s=createLab();s.provinces.a.owner='1';s.provinces.a.defense=0;put(s,'0','army','a','b',3);put(s,'1','shinobi','b',undefined,2);const r=resolve(s);expect(r.provinces.a.owner).toBe('0');expect(r.provinces.b.owner).toBe('1');expect(s.provinces.a.owner).toBe('1');});
  it('ничья двух атакующих оставляет контроль слабому защитнику',()=>{const s=createLab(3);s.provinces.b.owner='2';put(s,'0','army','b','a',3);put(s,'1','shinobi','b',undefined,3);const r=resolve(s);expect(r.provinces.b.owner).toBe('2');expect(r.provinces.b.control).toBe(1);});
  it('ничья с защитой оставляет контроль защитнику',()=>{const s=createLab();s.provinces.e.control=2;put(s,'0','army','e','b',2);expect(resolve(s).provinces.e.owner).toBe('1');});
  it('оборона без нападения добавляет ровно одно укрепление',()=>{const s=createLab();put(s,'0','army','a');put(s,'0','army','a');expect(resolve(s).provinces.a.control).toBe(1);});
  it('блеф не создаёт успешную оборону',()=>{const s=createLab();put(s,'0','bluff','e','b');const r=resolve(s);expect(r.provinces.e.control).toBe(0);expect(r.players['0'].hand.some(t=>t.kind==='bluff')).toBe(true);});
  it('благословение добавляет силу',()=>{const s=createLab();s.provinces.e.control=3;const id=put(s,'0','army','e','b',2);put(s,'0','blessing','e','b',2,id);expect(resolve(s).provinces.e.owner).toBe('0');});
  it.each(['raid','diplomacy','bluff'] as const)('благословение на %s делает весь стек незаконным',kind=>{const s=createLab();const target=kind==='raid'?'e':'b';const id=put(s,'0',kind,target);put(s,'0','blessing',target,undefined,2,id);const r=resolve(s);expect(r.removed).toHaveLength(2);expect(r.provinces[target].special).toBeUndefined();});
  it('повторное разрешение не удваивает укрепления и сброс',()=>{const s=createLab();put(s,'0','army','a');const r=resolve(s);expect(resolve(r)).toEqual(r);});
  it('нельзя отправлять новые приказы после раскрытия',()=>{const r=resolve(createLab());expect(place(r,'0',{token:'0-0',target:'a'})).toBeTruthy();});
});
describe('особые эффекты',()=>{
  it('объясняет дипломатию в чужой провинции и не создаёт мир',()=>{const s=createLab();put(s,'0','diplomacy','e');const r=resolve(s);expect(r.provinces.e.special).toBeUndefined();expect(r.removed[0].reason).toContain('только в своей провинции');});
  it('дипломатия владельца создаёт мир и снимает нападение с благословением',()=>{const s=createLab();put(s,'1','diplomacy','e');const attack=put(s,'0','army','e','b');put(s,'0','blessing','e','b',2,attack);const r=resolve(s);expect(r.provinces.e.special?.kind).toBe('peace');expect(r.battles).toEqual([]);expect(r.removed).toHaveLength(3);expect(r.provinces.e.owner).toBe('1');});
  it('набег отменяет дипломатию и исходящие атаки',()=>{const s=createLab();put(s,'0','raid','e');put(s,'1','diplomacy','e');put(s,'1','army','b','e');const r=resolve(s);expect(r.provinces.e.special?.kind).toBe('scorched');expect(r.provinces.e.owner).toBeNull();expect(r.provinces.b.owner).toBe('0');expect(r.provinces.b.control).toBe(0);});
  it('дипломатия отменяет все приказы на границе',()=>{const s=createLab();put(s,'0','army','e','b',3);put(s,'1','diplomacy','e');const r=resolve(s);expect(r.provinces.e.special?.kind).toBe('peace');expect(r.provinces.e.owner).toBe('1');expect(r.provinces.e.control).toBe(0);});
  it('удалённый набег требует синоби',()=>{const s=createLab();s.provinces.e.owner='1';s.provinces.c.owner='1';put(s,'0','raid','f');expect(resolve(s).provinces.f.special).toBeUndefined();put(s,'0','shinobi','f');expect(resolve(s).provinces.f.special?.kind).toBe('scorched');});
  it('мир в соседней провинции не даёт право на набег',()=>{const s=createLab();s.provinces.b.special={kind:'peace'};s.provinces.d.owner='1';put(s,'0','raid','e');expect(resolve(s).provinces.e.special).toBeUndefined();});
  it('поле битвы отменяет набег и дипломатию',()=>{const s=createLab();s.provinces.e.special={kind:'battlefield'};put(s,'0','raid','e');put(s,'1','diplomacy','e');expect(resolve(s).provinces.e.special?.kind).toBe('battlefield');});
  it('ронин атакует через чужую границу, но не применяет набег',()=>{const s=createLab();Object.values(s.provinces).forEach(p=>p.owner='1');s.players['0'].ronin=true;put(s,'0','army','e','b',3);put(s,'0','raid','f');const r=resolve(s);expect(r.provinces.e.owner).toBe('0');expect(r.provinces.f.special).toBeUndefined();});
  it('флот атакует берег без собственной прибрежной провинции',()=>{const s=createLab();put(s,'0','navy','f','sea',2);expect(resolve(s).provinces.f.owner).toBe('0');});
  it('выжженная земля не мешает контролю территории, полностью сгоревшая ничья',()=>{const s=createLab();s.provinces.c.special={kind:'scorched'};s.provinces.c.owner=null;expect(territoryOwners(s.provinces).north).toBe('0');s.provinces.a.special={kind:'scorched'};s.provinces.b.special={kind:'scorched'};expect(territoryOwners(s.provinces).north).toBeNull();});
  it('Земли Теней не дают честь за контроль и укрепления',()=>{const s=createLab();for(const p of Object.values(s.provinces)){p.owner='0';p.shadowlands=true;p.control=5;}expect(score(s.provinces,'0').total).toBe(0);});
});
describe('настройки и серверный игровой протокол',()=>{
  it.each([1,6,2.5,NaN])('отвергает число игроков %s',players=>expect(()=>validateOptions({mode:'combat-lab',players,expansions:[]})).toThrow());
  it('не принимает несуществующие дополнения или полную партию',()=>{expect(()=>validateOptions({mode:'combat-lab',players:2,expansions:['fake']})).toThrow();expect(()=>validateOptions({mode:'full',players:2,expansions:[]})).toThrow();});
  it('клиенты скрывают состояние и аргументы в журнале, раунд завершается',()=>{
    const multiplayer=Local();
    const clients=['0','1',undefined].map(playerID=>Client({game:RokuganLab,numPlayers:2,multiplayer,playerID,debug:false}));
    clients.forEach(c=>c.start());const [a,b,watch]=clients;
    try{
      a.moves.place({token:'0-0',target:'e',from:'b'});
      expect(b.getState()!.G.round.orders[0].token).toBeNull();
      expect(watch.getState()!.G.round.orders[0].token).toBeNull();
      expect(b.log?.find(e=>e.action.payload.type==='place')?.action.payload.args).toBeNull();
      b.moves.ready();a.moves.ready();
      expect(a.getState()!.ctx.gameover).toEqual({complete:true});
      expect(a.getState()!.G.round.provinces.e.owner).toBe('0');
    } finally {clients.forEach(c=>c.stop());}
  });
});
