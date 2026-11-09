import type { RoundState, TokenKind } from './types';
import { validateOptions } from './catalog';

/** Synthetic test fixture. NOT the official map, clan token distribution, or game setup. */
export function createLab(players=2): RoundState {
  validateOptions({mode:'combat-lab',players,expansions:[]});
  const points = [
    ['a','Перевал',150,120,false,2],['b','Равнина',390,120,false,0],['c','Бухта',630,120,true,0],
    ['d','Крепость',150,330,false,2],['e','Долина',390,330,false,0],['f','Порт',630,330,true,0],
  ] as const;
  const neighbors: Record<string,string[]>={a:['b','d'],b:['a','c','e'],c:['b','f'],d:['a','e'],e:['b','d','f'],f:['c','e']};
  const owners=players===2?['0','0','1','0','1','1']:['0','1','2',players>3?'3':'0',players>4?'4':'1','2'];
  const kinds: [TokenKind,number][]=[['army',2],['army',3],['navy',2],['shinobi',1],['raid',0],['diplomacy',0],['blessing',2],['bluff',0]];
  return {
    provinces:Object.fromEntries(points.map(([id,name,x,y,coastal,defense],i)=>[id,{id,name,x,y,coastal,defense,honor:1,territory:i<3?'north':'south',neighbors:neighbors[id],owner:owners[i],control:0}])),
    players:Object.fromEntries(Array.from({length:players},(_,i)=>[String(i),{name:`Игрок ${i+1}`,hand:kinds.map(([kind,strength],j)=>({id:`${i}-${j}`,kind,strength})),scouts:2,shugenja:1,ronin:false,knowledge:{}}])),
    orders:[],discarded:[],nextOrder:0,revealed:false,battles:[],removed:[]
  };
}
