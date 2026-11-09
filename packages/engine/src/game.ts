import type { Game } from 'boardgame.io';
import { INVALID_MOVE } from 'boardgame.io/core';
import { createLab } from './fixture';
import { place, playerView, resolve, scout, shugenja } from './rules';
import { validateOptions } from './catalog';
import type { Placement, RoundState } from './types';

export interface LabState { round:RoundState; done:Record<string,boolean>; options:{mode:'combat-lab';players:number;expansions:string[]} }
export const RokuganLab: Game<LabState> = {
  name:'rokugan-combat-lab',minPlayers:2,maxPlayers:5,
  setup:({ctx}, data) => {
    const options=validateOptions(data ?? {mode:'combat-lab',players:ctx.numPlayers,expansions:[]});
    if(options.players!==ctx.numPlayers) throw Error('Число мест не совпадает с настройками.');
    return {round:createLab(ctx.numPlayers),done:Object.fromEntries(ctx.playOrder.map(id=>[id,false])),options};
  },
  validateSetupData:(data,numPlayers) => {
    try {const options=validateOptions(data??{mode:'combat-lab',players:numPlayers,expansions:[]});return options.players!==numPlayers?'Число игроков не совпадает':undefined;} catch(e) {return String(e);}
  },
  playerView:({G,playerID}) => ({...G,round:playerView(G.round,playerID) as unknown as RoundState}),
  // No client-side prediction with hidden orders. Only the authoritative master can resolve them.
  moves:{
    place:{client:false,redact:true,move:({G,playerID,events},input:Placement)=>{
      if(!playerID || G.done[playerID] || !input || typeof input!=='object' || place(G.round,playerID,input)) return INVALID_MOVE;
      if(!G.round.players[playerID].hand.length) G.done[playerID]=true;
      events.endTurn();
    }},
    scout:{client:false,redact:true,move:({G,playerID},id:string)=>{
      if(!playerID || G.done[playerID] || scout(G.round,playerID,id)) return INVALID_MOVE;
    }},
    shugenja:{client:false,move:({G,playerID},id:string)=>{
      if(!playerID || G.done[playerID] || shugenja(G.round,playerID,id)) return INVALID_MOVE;
    }},
    ready:{client:false,move:({G,playerID,events})=>{
      if(!playerID||G.done[playerID]) return INVALID_MOVE;
      G.done[playerID]=true; events.endTurn();
    }}
  },
  turn:{
    order:{first:()=>0,next:({G,ctx})=>{
      for(let i=1;i<=ctx.numPlayers;i++) {const pos=(ctx.playOrderPos+i)%ctx.numPlayers;if(!G.done[ctx.playOrder[pos]]) return pos;}
      return undefined;
    }},
    onEnd:({G})=>{if(Object.values(G.done).every(Boolean)) G.round=resolve(G.round);}
  },
  endIf:({G})=>G.round.revealed?{complete:true}:undefined,
  disableUndo:true,
};
