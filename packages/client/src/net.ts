import {LobbyClient} from 'boardgame.io/client';
import {BattleForRokugan} from '@rokugan/engine';
export const SERVER=import.meta.env.VITE_SERVER||(import.meta.env.DEV?`${location.protocol}//${location.hostname}:3001`:location.origin);
export const GAME_ID=BattleForRokugan.name!;
export const lobby=new LobbyClient({server:SERVER});
export interface Seat{playerID:string;credentials:string;name?:string}
export interface RoomPlayer{id:number;name?:string;isConnected?:boolean}
export interface Session{players:number;matchID?:string;playerID?:string;credentials?:string;localID?:string;watch?:boolean}
export function loadSeat(id:string):Seat|null{try{const raw=localStorage.getItem(`rokugan:seat:${id}`);return raw?JSON.parse(raw):null;}catch{return null;}}
export function saveSeat(id:string,seat:Seat){localStorage.setItem(`rokugan:seat:${id}`,JSON.stringify(seat));}
export function forgetSeat(id:string){localStorage.removeItem(`rokugan:seat:${id}`);}
export function savedName(){return new URLSearchParams(location.search).get('name')?.trim().slice(0,20)||localStorage.getItem('rokugan:name')||'Игрок';}
export function rememberName(name:string){localStorage.setItem('rokugan:name',name.trim().slice(0,20));}
export function roomCode(value:string){const code=value.trim().replace(/^.*#\/m\//,'').replace(/\/watch\/?$/,'');return /^[A-Za-z0-9_-]{1,100}$/.test(code)?code:null;}
export function shareURL(id:string,watch=false){return `${location.origin}${location.pathname}${new URLSearchParams(location.search).has('embed')?'?embed=1':''}#/m/${id}${watch?'/watch':''}`;}
