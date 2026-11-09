export const RULE_SOURCES = {
  rokugan: 'https://images-cdn.fantasyflightgames.com/filer_public/95/ef/95ef7efa-c0e1-4ae9-bd33-5439d236cefb/l5b01_rulebook_webcompressed.pdf',
  faq: 'https://images-cdn.fantasyflightgames.com/filer_public/2a/a8/2aa8c9a8-5ec9-4516-b6b0-32d3f2aa9f04/battle-for-rokugan-faq-v11.pdf',
  brw: 'https://ludusmagnusstudio.com/black-rose-wars/black-rose-wars-rules/'
};
export const BLACK_ROSE_MODULES = [
  {id:'hidden-thorns',name:'Hidden Thorns',description:'Два мага; расширение состава до 6 игроков.'},
  {id:'sator',name:'Sator Box',description:'Новые школы, маги и дополнительные правила.'},
  {id:'inferno',name:'Inferno',description:'Комнаты Преисподней, Люцифер и его поведение.'},
  {id:'crono',name:'Crono',description:'Школа Myth и отдельный сценарий с Хроносом.'},
  {id:'familiars',name:'Familiars',description:'Модуль фамильяров; отдельные правила.'},
  {id:'asymmetric-mages',name:'Asymmetric Mages',description:'Дополнительные способности магов.'}
] as const;
export interface MatchOptions { mode: 'combat-lab'; players: number; expansions: string[] }
export function validateOptions(value: unknown): MatchOptions {
  if(!value || typeof value!=='object') throw Error('Требуются настройки партии.');
  const v=value as MatchOptions;
  if(v.mode!=='combat-lab') throw Error('Полная партия ещё в разработке. Доступен стенд боя.');
  if(!Number.isInteger(v.players)||v.players<2||v.players>5) throw Error('Выберите от 2 до 5 участников.');
  if(!Array.isArray(v.expansions)||v.expansions.length) throw Error('Для Рокугана не подтверждены официальные дополнения.');
  return {mode:'combat-lab',players:v.players,expansions:[]};
}
