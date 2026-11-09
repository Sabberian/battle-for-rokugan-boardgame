import {describe,it,expect} from 'vitest';
import {createMap,objectivePoints} from './content';
import {score,scoreBreakdown} from './rules';
import {setupFull,act} from './full-game';

describe('final scoring explanations',()=>{
 it('reconciles provinces, special tokens, open control and complete regions',()=>{
  const p=createMap();for(const v of Object.values(p))if(v.territory==='crab')v.owner='0';
  p['10'].control=2;p['10'].special={kind:'honor',value:1};
  p['19'].special={kind:'honor',value:4};p['23'].special={kind:'defense',value:2};
  p['26'].owner=null;p['26'].special={kind:'scorched'};
  p['11'].owner='0';p['11'].control=9;
  const rows=scoreBreakdown(p,'0');
  expect(score(p,'0')).toEqual({flowers:11,defense:2,territories:1,total:18});
  expect(rows.find(r=>r.territory==='crab')).toMatchObject({bonus:5,total:18});
  expect(rows.find(r=>r.territory==='north')).toMatchObject({bonus:0,flowers:0,defense:0,total:0,complete:true});
  expect(rows.reduce((sum,r)=>sum+r.total,0)).toBe(18);
 });
 it('includes an achieved objective and hides results until the final reveal finishes',()=>{
  let g=setupFull(4,x=>x);g.number=5;g.phase='unicorn';g.active='0';g.cinematic=true;
  for(const p of Object.values(g.round.provinces)){p.owner=p.territory==='crab'?'0':null;p.control=0;}
  g.secrets['0'].objective='crab';g.secrets['1'].objective='crane';g.secrets['2'].objective='lion';g.secrets['3'].objective='phoenix';
  g=act(g,'0',{type:'unicorn',ids:[]},x=>x).state;
  expect(g.phase).toBe('reveal');
  while(g.phase==='reveal')g=act(g,g.active,{type:'reveal-next'},x=>x).state;
  expect(g.phase).toBe('finished');expect(g.winners).toEqual(['0']);
  expect(g.results[0]).toMatchObject({flowers:8,defense:0,territories:1,objective:5,total:18});
  for(const r of g.results)expect(r.total).toBe(scoreBreakdown(g.round.provinces,r.player).reduce((sum,x)=>sum+x.total,0)+objectivePoints(g.round,g.secrets[r.player].objective!,r.player));
 });
 it('uses Shadowlands territories for a tied score, but gives them no honor',()=>{
  let g=setupFull(2,x=>x);g.number=5;g.phase='unicorn';g.active='0';g.cinematic=false;
  for(const p of Object.values(g.round.provinces))p.owner=null;
  g.round.provinces['11'].owner='1';g.secrets['0'].objective='crab';g.secrets['1'].objective='crane';
  g=act(g,'0',{type:'unicorn',ids:[]},x=>x).state;
  expect(g.results.map(r=>r.total)).toEqual([0,0]);expect(g.winners).toEqual(['1']);
 });
});
