import {LAND_BORDERS} from './board';
import type {Province,Token,TokenKind,RoundState} from './types';

export const CLANS = {
  crab:{name:'Краб',ability:'Каждый открытый жетон контроля даёт 3 защиты вместо 1.',capital:'23',unique:['navy',3]},
  crane:{name:'Журавль',ability:'Вы побеждаете при равенстве наибольшей силы в бою.',capital:'25',unique:['diplomacy',0]},
  dragon:{name:'Дракон',ability:'При наборе руки возьмите лишний жетон, затем верните один в резерв.',capital:'2',unique:['blessing',3]},
  lion:{name:'Лев',ability:'Блеф в своей провинции защищает с силой 2. Сам по себе без атаки не укрепляет провинцию.',capital:'29',unique:['army',6]},
  phoenix:{name:'Феникс',ability:'Атакуя столицу, игнорируйте её печатную защиту.',capital:'4',unique:['blessing',3]},
  scorpion:{name:'Скорпион',ability:'Раз в раунд при размещении приказа можно тайно посмотреть один незащищённый приказ.',capital:'21',unique:['shinobi',3]},
  unicorn:{name:'Единорог',ability:'Перед раскрытием можно поменять местами два своих незащищённых приказа на поле.',capital:'6',unique:['raid',0]},
} as const;
export type Clan=keyof typeof CLANS;
export const TERRITORIES:Record<string,string>={...Object.fromEntries(Object.entries(CLANS).map(([id,c])=>[id,c.name])),gold:'Горы',islands:'Острова',north:'Земли Тени — север',south:'Земли Тени — юг'};
// Province identifiers are stable reference numbers. Coordinates are an original schematic.
const provinceData:[string,number,number,number][]=[
 ['dragon',1,220,100],['dragon',2,440,120],['phoenix',2,660,230],['phoenix',2,660,100],['phoenix',1,880,100],
 ['unicorn',2,110,240],['lion',2,330,320],['lion',2,770,370],['crane',2,770,700],['crab',3,330,820],
 ['north',0,110,1100],['gold',3,550,1240],['scorpion',1,110,680],['scorpion',3,330,540],['dragon',3,550,370],
 ['islands',1,880,1240],['south',0,110,1380],['unicorn',1,110,460],['crab',2,330,1100],['gold',2,660,1000],
 ['scorpion',2,550,700],['islands',2,880,1000],['crab',2,330,1240],['unicorn',3,330,440],['crane',2,770,540],
 ['crab',1,110,820],['gold',3,550,1100],['islands',1,880,1380],['lion',2,550,540],['crane',3,550,840],
];
export const LAND_EDGES=LAND_BORDERS.map(([a,b])=>[a,b]);
export function createMap():Record<string,Province>{
 return Object.fromEntries(provinceData.map(([territory,honor,x,y],i)=>{
  const id=String(i+1),capital=Object.values(CLANS).some(c=>c.capital===id),shadowlands=['north','south'].includes(territory);
  return [id,{id,name:`${TERRITORIES[territory]} ${id}${capital?' ★':''}`,territory,honor,x,y,capital,shadowlands,
   defense:capital?2:shadowlands?1:0,coastal:[5,8,25,9,30,20,12,23,17,16,22,28].includes(i+1),
   neighbors:LAND_EDGES.filter(e=>e.includes(i+1)).map(e=>String(e.find(n=>n!==i+1))),owner:null,control:0}];
 }));
}
export function clanTokens(clan:Clan,player:string):Token[]{
 const specs:[TokenKind,number,number][]=[['army',1,6],['army',2,4],['army',3,3],['army',4,2],['army',5,1],['navy',1,2],['navy',2,1],['shinobi',1,1],['shinobi',2,1],['blessing',2,2],['raid',0,1],['diplomacy',0,1],['bluff',0,1]];
 const result:Token[]=[];
 for(const [kind,strength,count] of specs)for(let i=0;i<count;i++)result.push({id:'',kind,strength,owner:player});
 const [kind,strength]=CLANS[clan].unique;result.push({id:'',kind,strength,owner:player});return result;
}
export const OBJECTIVES=Object.fromEntries([
 ...Object.keys(CLANS).map(id=>[id,{name:`Влияние: ${CLANS[id as Clan].name}`,description:'Контролируйте столицу этого клана или хотя бы две его провинции.',points:({crab:5,crane:6,dragon:6,lion:7,phoenix:7,scorpion:7,unicorn:6} as Record<string,number>)[id]}]),
 ['empire',{name:'Изумрудная империя',description:'Контролируйте шесть соединённых провинций в трёх территориях.',points:10}],
 ['coast',{name:'Владыка побережья',description:'Контролируйте не менее шести прибрежных провинций.',points:10}],
 ['shadow',{name:'Власть над Тенью',description:'Контролируйте обе провинции Земель Тени.',points:3}],
 ['humility',{name:'Путь смирения',description:'Контролируйте наименьшее число провинций. Ничья тоже подходит.',points:10}],
 ['influence',{name:'Сеть влияния',description:'Контролируйте провинции в семи разных территориях.',points:10}],
] as [string,{name:string;description:string;points:number}][]);
export function objectivePoints(s:RoundState,id:string,player:string):number{
 const ps=Object.values(s.provinces).filter(p=>p.owner===player),has=(p:string)=>ps.some(x=>x.id===p);
 let ok=false;
 if(Object.hasOwn(CLANS,id))ok=has(CLANS[id as Clan].capital)||ps.filter(p=>p.territory===id).length>=2;
 else if(id==='coast')ok=ps.filter(p=>p.coastal||p.special?.kind==='harbor').length>=6;
 else if(id==='shadow')ok=has('11')&&has('17');
 else if(id==='humility')ok=Object.keys(s.players).every(other=>Object.values(s.provinces).filter(p=>p.owner===other).length>=ps.length);
 else if(id==='influence')ok=new Set(ps.map(p=>p.territory)).size>=7;
 else if(id==='empire'){
  // Enumerate connected six-province subsets, not simply a large connected component.
  const seen=new Set<string>();
  const visit=(ids:string[]):boolean=>{
   const key=[...ids].sort().join(',');if(seen.has(key))return false;seen.add(key);
   const territories=new Set(ids.map(n=>s.provinces[n].territory));if(territories.size>3)return false;
   if(ids.length===6)return territories.size===3;
   return [...new Set(ids.flatMap(n=>s.provinces[n].neighbors))].filter(n=>has(n)&&!ids.includes(n)).some(n=>visit([...ids,n]));
  };ok=ps.some(p=>visit([p.id]));
 }
 return ok?OBJECTIVES[id]?.points??0:0;
}

export interface TerritoryCard {id:string;territory:string;name:string;description:string;provinces?:number;orders?:number;hand?:number;discard?:number;opponent?:boolean;sacrifice?:boolean}
export const CARDS:TerritoryCard[]=[
 {id:'harbor',territory:'crab',name:'Инженерный подвиг',description:'Сделайте внутреннюю провинцию прибрежной: разместите порт.',provinces:1},
 {id:'promotion',territory:'crab',name:'Повышение',description:'Верните армию, флот или синоби из своего сброса в руку. Затем уберите один жетон руки в резерв или сброс.',discard:1,hand:1},
 {id:'honor',territory:'crane',name:'Кодекс чести',description:'В две разные провинции вне Земель Тени положите по +1 чести.',provinces:2},
 {id:'peace',territory:'crane',name:'Дипломатическая миссия',description:'Установите мир. Если провинция чужая, добавьте 2 открытых контроля в свою провинцию (вторая цель).',provinces:2},
 {id:'shrine',territory:'dragon',name:'Священная земля',description:'Разместите святилище: провинцию нельзя атаковать.',provinces:1},
 {id:'purpose',territory:'dragon',name:'Сила намерения',description:'Добавьте по 1 открытому контролю в две свои разные провинции.',provinces:2},
 {id:'pirates',territory:'islands',name:'Пиратские набеги',description:'Выжгите провинцию. Если она ваша, добавьте 3 открытых контроля в другую свою провинцию (вторая цель).',provinces:2},
 {id:'port',territory:'islands',name:'Порт процветания',description:'Добавьте +2 чести в провинцию вне Земель Тени.',provinces:1},
 {id:'bushido',territory:'lion',name:'Бусидо',description:'Замените печатную честь провинции вне Земель Тени на 4.',provinces:1},
 {id:'battlefield',territory:'lion',name:'Честный бой',description:'Поле битвы запрещает набеги и дипломатию.',provinces:1},
 {id:'levies',territory:'gold',name:'Рекруты Асигару',description:'Три разные провинции вне Земель Тени получают по +1 защиты и чести.',provinces:3},
 {id:'harvest',territory:'gold',name:'Обильный урожай',description:'Добавьте 2 открытых контроля в свою провинцию.',provinces:1},
 {id:'kami',territory:'phoenix',name:'Помощь Ками',description:'Провинция вне Земель Тени получает +2 защиты и +1 чести.',provinces:1},
 {id:'bless',territory:'phoenix',name:'Благословение земель',description:'Уберите выжженную землю. Получите провинцию с одним закрытым и одним открытым контролем.',provinces:1},
 {id:'rebellion',territory:'scorpion',name:'Разжечь восстание',description:'Уберите мир. Если провинция ваша, добавьте в неё 2 открытых контроля.',provinces:1},
 {id:'spy',territory:'scorpion',name:'Шпионская сеть',description:'Посмотрите руку соперника. Его блеф недоступен до следующего раунда.',opponent:true},
 {id:'dark',territory:'north',name:'Тёмные любимцы',description:'Пожертвуйте контролем вне Земель Тени, посмотрите до 4 приказов и затем откройте и сбросьте один из них.',sacrifice:true,orders:4},
 {id:'purge',territory:'north',name:'Изгнание слабых',description:'Сбросьте жетон руки вместо размещения. Откройте и сбросьте два приказа на поле.',hand:1,orders:2},
 {id:'animate',territory:'south',name:'Оживление мёртвых',description:'Пожертвуйте контролем вне Земель Тени. Разместите жетон из своего сброса открыто, затем сделайте обычный ход.',sacrifice:true,discard:1},
 {id:'fear',territory:'south',name:'Внушить страх',description:'Пожертвуйте контролем вне Земель Тени, уберите до двух особых жетонов.',sacrifice:true,provinces:2},
 {id:'exchange',territory:'unicorn',name:'Культурный обмен',description:'Поменяйте все жетоны контроля в своей и чужой провинциях.',provinces:2},
 {id:'reinforce',territory:'unicorn',name:'Подкрепление',description:'Верните две армии из своего сброса, затем уберите два жетона руки в резерв или сброс.',discard:2,hand:2},
];
