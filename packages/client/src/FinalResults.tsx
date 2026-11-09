import {useEffect,useRef,useState} from 'react';
import {OBJECTIVES,TERRITORIES,scoreBreakdown,territoryOwners,type FullState} from '@rokugan/engine';
import {Emblem} from './Art';

export function FinalResults({g}:{g:FullState}){
 const [open,setOpen]=useState(true),[selected,setSelected]=useState(g.winners[0]??g.seats[0]),ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(open)ref.current?.showModal();else ref.current?.close();},[open]);
 const names=g.winners.map(id=>g.round.players[id].name).join(', '),r=g.results.find(r=>r.player===selected)!;
 const rows=scoreBreakdown(g.round.provinces,selected),objective=OBJECTIVES[g.secrets[selected]?.objective??''];
 const fullCount=Object.values(territoryOwners(g.round.provinces)).filter(id=>id===selected).length;
 const regionCounts=Object.values(territoryOwners(g.round.provinces)),top=Math.max(...g.results.map(x=>x.total)),tied=g.results.filter(x=>x.total===top);
 const mostRegions=Math.max(...tied.map(x=>regionCounts.filter(id=>id===x.player).length));
 const contenders=tied.filter(x=>regionCounts.filter(id=>id===x.player).length===mostRegions);
 const reason=tied.length<2?'Больше всего очков чести.':g.winners.length>1?'Равенство чести, полных регионов и провинций — совместная победа.':contenders.length===1?`По чести ничья. Решили полные регионы, включая Земли Тени: ${tied.map(x=>`${g.round.players[x.player].name} — ${regionCounts.filter(id=>id===x.player).length}`).join('; ')}.`:`По чести и регионам ничья. Решило число провинций: ${contenders.map(x=>`${g.round.players[x.player].name} — ${x.provinces}`).join('; ')}.`;
 const sorted=[...g.results].sort((a,b)=>b.total-a.total||Number(g.winners.includes(b.player))-Number(g.winners.includes(a.player)));
 return <section className="panel final-results"><h2>{g.winners.length>1?'Совместная победа':'Победитель'}: {names}</h2><button className="primary" onClick={()=>setOpen(true)}>Открыть итоговую таблицу</button>
 {open&&<dialog ref={ref} className="victory-dialog" aria-label="Итоги партии" onCancel={()=>setOpen(false)}>
  <header className="victory-heading"><div><span className="eyebrow">ПЯТЬ РАУНДОВ · ПАРТИЯ ЗАВЕРШЕНА</span><h2>{g.winners.length>1?'Совместная победа':'Победитель'}: {names}</h2><p>{g.results.find(x=>x.player===g.winners[0])?.total} очков чести</p></div><button autoFocus onClick={()=>setOpen(false)}>Вернуться к полю</button></header>
  <p className="score-formula">Честь провинций и жетонов + открытый контроль + 5 за каждый полный регион + выполненная тайная цель.</p>
  <p className="victory-reason">{reason}</p>
  <div className="score-scroll"><table className="score-table"><caption>Нажмите клан, чтобы посмотреть его регионы и задание</caption><thead><tr><th>Клан</th><th>Провинции<br/>и бонусы</th><th>Открытый<br/>контроль</th><th>Полные<br/>регионы</th><th>Тайная<br/>цель</th><th>Всего</th></tr></thead><tbody>{sorted.map(x=><tr key={x.player} className={selected===x.player?'score-selected':''}><th><button aria-pressed={selected===x.player} onClick={()=>setSelected(x.player)}><Emblem clan={g.round.players[x.player].clan}/><span>{g.round.players[x.player].name}{g.winners.includes(x.player)&&<small>Победитель</small>}</span></button></th><td>{x.flowers}</td><td>{x.defense}</td><td>{x.territories} × 5 = {x.territories*5}</td><td>{x.objective>0?`+${x.objective}`:'0'}</td><td><strong>{x.total}</strong></td></tr>)}</tbody></table></div>
  <section className="score-detail" aria-live="polite"><h3>Разбор: {g.round.players[selected].name} <span>{r.flowers} + {r.defense} + {r.territories*5} + {r.objective} = {r.total}</span></h3>
   <div className={`scored-objective ${r.objective>0?'complete':'incomplete'}`}><div><b>{objective?.name??'Тайная цель не выбрана'}</b><strong>{r.objective>0?`Выполнено · +${r.objective} очков`:'Не выполнено · 0 очков'}</strong></div><p>{objective?.description}</p>{objective&&<small>Награда за выполнение: {objective.points}. Проверяется по итоговому состоянию поля.</small>}</div>
   <div className="score-scroll"><table className="region-score"><caption>Очки за регионы · раскройте строку для просмотра провинций</caption><thead><tr><th>Регион / ваши провинции</th><th>Честь</th><th>Контроль</th><th>Полный регион</th><th>Итого</th></tr></thead><tbody>{rows.map(row=><tr key={row.territory}><th><details><summary>{TERRITORIES[row.territory]??row.territory} <small>{row.provinces.length} пров.</small></summary><ul>{row.provinces.map(p=><li key={p.id}><b>{p.name}</b><span>{p.flowers} чести + {p.defense} контроля = {p.flowers+p.defense}</span><small>{p.note}</small></li>)}</ul></details></th><td>{row.flowers}</td><td>{row.defense}</td><td>{row.bonus?'+5':row.complete?'0 · Земли Тени':'—'}</td><td><b>{row.total}</b></td></tr>)}</tbody><tfoot><tr><th>С поля, без тайной цели</th><td>{r.flowers}</td><td>{r.defense}</td><td>{r.territories*5}</td><td>{r.total-r.objective}</td></tr></tfoot></table>{!rows.length&&<p>Контролируемых провинций нет.</p>}</div>
   <p className="tie-note">При равенстве чести: больше полных регионов (включая Земли Тени), затем провинций; при полном равенстве — совместная победа. У этого игрока: {fullCount} полных регионов, {r.provinces} провинций.</p>
  </section>
 </dialog>}
 </section>;
}
