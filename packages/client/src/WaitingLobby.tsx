import {useEffect,useState} from 'react';
import {CLANS,type FullState,type Action} from '@rokugan/engine';
import type {RoomPlayer,Session} from './net';
import {Emblem,clanColors} from './Art';

/** Same seated-player / host-start flow as the Cyclades reference lobby. */
export function WaitingLobby({g,session,members,onReady,onStart,onLeave,exit,onAction}:{g:FullState;session:Session;members?:RoomPlayer[];onReady:()=>void;onStart:()=>void;onLeave?:()=>void;exit:()=>void;onAction:(a:Action,id?:string)=>void}){
 const local=!session.matchID,me=session.playerID??'0',joined=local?g.seats.length:members?.filter(p=>p.name).length??0;
 const [localSeat,setLocalSeat]=useState('0'),seat=local?localSeat:me,chosen=g.lobby?.clans??{},host=local||me==='0';
 const name=members?.find(p=>String(p.id)===me)?.name;
 // Joining a seat is the confirmation; changing a clan registers the new choice automatically.
 useEffect(()=>{if(!local&&!session.watch&&name&&(!g.lobby?.ready[me]||g.lobby?.names[me]!==name))onReady();},[local,session.watch,name,g.lobby?.ready[me],g.lobby?.names[me]]);
 const full=joined===g.seats.length,ready=g.seats.every(id=>g.lobby?.ready[id]);
 const selected=chosen[seat];
 return <main className="council-page">
  <header className="council-heading"><span className="eyebrow">БИТВА ЗА РОКУГАН</span><h1>Совет кланов</h1><p>{session.watch?'Наблюдайте за сбором игроков.':local?'Выберите кланы участников и начните партию.':'Выберите свой клан. Когда все займут места, хозяин начнёт игру.'}</p></header>
  <section className="council-card"><header className="council-card-heading"><h2>За столом {joined} из {g.seats.length}</h2><span>{local?'За одним компьютером':'Сетевая партия'}</span></header>
   <div className="council-seats">{g.seats.map(id=>{const member=members?.find(p=>String(p.id)===id),playerName=local?`Игрок ${+id+1}`:member?.name;return <div className={`council-seat ${id===seat&&!session.watch?'mine':''}`} style={{borderLeftColor:chosen[id]?clanColors[chosen[id]]:undefined}} key={id}>
    <span className="council-number">{+id+1}</span><Emblem clan={chosen[id]}/><div className="council-seat-name"><b>{playerName??'Свободное место'}{!local&&!session.watch&&id===me?' · вы':''}</b><small>{chosen[id]?CLANS[chosen[id]].name:'Случайный клан при старте'}{id==='0'?' · хозяин':''}</small></div>
    {local?<button aria-pressed={seat===id} onClick={()=>setLocalSeat(id)}>{seat===id?'Выбираем клан':'Выбрать клан'}</button>:<span className="council-presence">{playerName?'За столом':'Ожидаем'}</span>}
   </div>;})}</div>
   {!session.watch&&<section className="council-clans"><h3>{local?`Клан игрока ${+seat+1}`:'Ваш клан'}</h3><div className="council-clan-options" role="radiogroup" aria-label="Клан игрока">{Object.entries(CLANS).map(([id,c])=>{const taken=Object.entries(chosen).some(([p,k])=>p!==seat&&k===id);return <button role="radio" aria-checked={selected===id} aria-label={`${c.name}${taken?' — занят':''}`} title={c.ability} key={id} disabled={taken} onClick={()=>onAction({type:'lobby-clan',clan:id},seat)}><Emblem clan={id}/><span>{c.name}</span></button>;})}</div>
    {selected?<div className="council-clan-preview"><img src={`/art/clans/${selected}.webp`} alt={`Ширма клана ${CLANS[selected].name}`}/><p><b>{CLANS[selected].name}</b>{CLANS[selected].ability}</p></div>:<p className="council-note">Можно оставить случайный клан. Уже выбранные кланы не повторяются.</p>}
   </section>}
   <p className="council-note">Базовая игра · 5 раундов · все семь кланов и Земли Тени</p>
   {g.errors[seat]&&<p className="error" role="alert">{g.errors[seat]}</p>}
   {!session.watch&&host?<div className="council-actions"><button onClick={()=>onAction({type:'random-clans'},'0')}>Случайно</button><button className="primary" disabled={!local&&(!full||!ready)} onClick={onStart}>{!full?'Ждём игроков…':!local&&!ready?'Подключаем игроков…':'Начать игру'}</button></div>:<p className="council-note" role="status">{full?'Все места заняты. Ждём, пока хозяин начнёт игру.':'Ждём остальных игроков.'}</p>}
   {!session.watch&&host&&<p className="council-note">«Случайно» распределяет только ещё не выбранные кланы.</p>}
  </section>
  <footer className="council-footer">{onLeave&&!session.watch&&<button onClick={onLeave}>Освободить моё место</button>}<button className="back" onClick={exit}>← На главную</button></footer>
 </main>;
}
