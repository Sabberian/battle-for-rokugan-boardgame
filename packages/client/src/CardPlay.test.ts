import {describe,it,expect} from 'vitest';
import {setupFull} from '@rokugan/engine';
import {cardStep,cardProvinceError} from './CardPlay';
const game=()=>setupFull(2,x=>[...x]);
const draft=(id:string)=>({id,started:true,provinces:[] as string[],orders:[] as string[],discard:[] as string[],hand:[] as string[],revision:0});
describe('card targets on the table',()=>{
 it('exchange rejects an enemy first and requires an enemy after own province',()=>{const g=game(),d=draft('exchange');g.round.provinces['1'].owner='0';g.round.provinces['2'].owner='1';g.round.provinces['3'].owner=null;expect(cardProvinceError(d,g,'0','2')).toContain('Сначала');expect(cardProvinceError(d,g,'0','1')).toBeNull();const next={...d,provinces:['1']};expect(cardProvinceError(next,g,'0','3')).toContain('соперника');expect(cardProvinceError(next,g,'0','2')).toBeNull();});
 it('peace on neutral land needs no bonus target',()=>{const g=game();g.round.provinces['1'].owner=null;expect(cardStep({...draft('peace'),provinces:['1']},g,'0')).toBe('ready');});
 it('pirates targets an enemy once, but needs a bonus province after burning own land',()=>{const g=game();g.round.provinces['1'].owner='1';const d={...draft('pirates'),provinces:['1']};expect(cardStep(d,g,'0')).toBe('ready');g.round.provinces['1'].owner='0';expect(cardStep(d,g,'0')).toBe('province');expect(cardStep({...d,provinces:['1','2']},g,'0')).toBe('ready');});
 it('peace needs the bonus only after targeting an opponent',()=>{const g=game();g.round.provinces['1'].owner='0';const d={...draft('peace'),provinces:['1']};expect(cardStep(d,g,'0')).toBe('ready');g.round.provinces['1'].owner='1';expect(cardStep(d,g,'0')).toBe('province');});
 it('spy waits for a player click',()=>{const g=game(),d=draft('spy');expect(cardStep(d,g,'0')).toBe('player');expect(cardStep({...d,opponent:'1'},g,'0')).toBe('ready');});
 it('animate follows sacrifice, discard, and actual map position',()=>{const g=game(),d=draft('animate');expect(cardStep(d,g,'0')).toBe('sacrifice');const s={...d,sacrifice:'1'};expect(cardStep(s,g,'0')).toBe('discard');const t={...s,discard:['token']};expect(cardStep(t,g,'0')).toBe('placement');expect(cardStep({...t,placement:{token:'token',target:'2',from:'1'}},g,'0')).toBe('ready');});
 it('support cards wait for an order rather than a province',()=>{const g=game();for(const id of ['scout','shugenja','first'])expect(cardStep(draft(id),g,'0')).toBe('order');});
});
