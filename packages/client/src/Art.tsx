import {useEffect,useRef,useState,useId,type ReactNode} from 'react';
import {CARDS,OBJECTIVES,type Token} from '@rokugan/engine';
import manifest from '../public/art/assets.json';
type Asset={path:string}|null;
const assets=manifest as unknown as {cards:Record<string,Asset>;objectives:Record<string,Asset>;tokens:Record<string,Record<string,Asset>>};
export const clanColors:Record<string,string>={crab:'#427bad',crane:'#75accd',dragon:'#419b62',lion:'#cda43b',phoenix:'#df8243',scorpion:'#b34846',unicorn:'#a366ba'};
export const tokenLabels:Record<string,string>={army:'Армия',navy:'Флот',shinobi:'Синоби',blessing:'Благословение',raid:'Набег',diplomacy:'Дипломатия',bluff:'Блеф'};
const marks:Record<string,string>={crab:'蟹',crane:'鶴',dragon:'龍',lion:'獅',phoenix:'鳳',scorpion:'蠍',unicorn:'麟'};
export function ClanSeal({clan}:{clan?:string}){return <g>{clan&&<image href={`/art/emblems/${clan}.webp`} x={-14} y={-14} width={28} height={28}/>}<circle opacity={clan?0:1} r="14" fill={clanColors[clan??'']??'#67716c'} stroke="#f3dfae" strokeWidth="2"/><circle opacity={clan?0:1} r="10" fill="none" stroke="#ead6a5"/><text opacity={clan?0:1} y="5" textAnchor="middle" fontSize="13" fill="#fff6dc">{marks[clan??'']??'◆'}</text></g>;}
export function TokenGlyph({clan,token}:{clan?:string;token:Token|null}){
 const clip=useId().replaceAll(':','');
 const asset=assets.tokens[clan??'']?.[token?`${token.kind}-${token.strength}`:'back'];
 if(asset)return <g className="scanned-token"><defs><clipPath id={clip}><path d="M0 -17 C3 -16 5 -12 9 -9 C14 -4 15 0 15 5 C15 12 10 16 0 16 C-10 16 -15 12 -15 5 C-15 0 -14 -4 -9 -9 C-5 -12 -3 -16 0 -17Z"/></clipPath></defs><image href={asset.path} x={-16} y={-18} width={32} height={36} preserveAspectRatio="none" clipPath={`url(#${clip})`}/><path d="M0 -17 C3 -16 5 -12 9 -9 C14 -4 15 0 15 5 C15 12 10 16 0 16 C-10 16 -15 12 -15 5 C-15 0 -14 -4 -9 -9 C-5 -12 -3 -16 0 -17Z" fill="none" stroke="#4a3826" strokeWidth=".6"/></g>;
 const color=clanColors[clan??'']??'#586569';
 return <g className="token-glyph"><path d="M0 -18L15 -7L15 14Q15 17 12 17H-12Q-15 17 -15 14V-7Z" fill={token?'#ead7ad':color} stroke="#42382c" strokeWidth="1.5"/><path d="M0 -14L4 -10H-4Z" fill={color}/><circle cy="3" r="11" fill={token?'#f9edce':'#25343c'} stroke={color} strokeWidth="1.5"/>
 {!token?<text y="7" textAnchor="middle" fontSize="14" fill="#f6e2ac">{marks[clan??'']??'◆'}</text>:<>
 <g transform="translate(0 -1)" fill="none" stroke="#35312b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
 {token.kind==='army'&&<path d="M-7 2L5 -9L7 -7L-5 4M-7 -1L-2 4M-7 4L-9 6"/>}
 {token.kind==='navy'&&<path d="M-8 1H8L4 5H-4ZM0 -9V1M1 -8L6 -1H1M-7 7Q-3 5 0 7Q3 5 7 7"/>}
 {token.kind==='shinobi'&&<path d="M0 -10L2 -3L9 -1L2 1L0 8L-2 1L-9 -1L-2 -3Z"/>}
 {token.kind==='blessing'&&<path d="M0 -9V5M-7 -2H7M-5 -7L5 3M5 -7L-5 3"/>}
 {token.kind==='raid'&&<path d="M0 -10Q5 -4 1 -2Q8 -4 7 3Q5 9 0 8Q-8 8 -7 1Q-4 -2 -3 -6Q-4 3 0 3Q3 0 0 -10Z"/>}
 {token.kind==='diplomacy'&&<path d="M-7 5V-6H7V5M-5 -3H5M-5 0H5M-5 3H2"/>}
 {token.kind==='bluff'&&<circle cy="-1" r="6" strokeDasharray="2 2"/>}
 </g>{token.strength>0&&<g><circle cx="10" cy="11" r="7" fill={color} stroke="#f7e6bf"/><text x="10" y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">{token.strength}</text></g>}</>}
 </g>;
}
export function Emblem({clan,className=''}:{clan?:string;className?:string}){return <svg className={`clan-emblem ${className}`} viewBox="-17 -17 34 34" aria-hidden="true"><ClanSeal clan={clan}/></svg>;}
export function TokenArt({clan,token,label}:{clan?:string;token:Token|null;label?:string}){return <svg className="token-art" viewBox="-20 -21 40 42" role="img" aria-label={label??(token?`${tokenLabels[token.kind]} ${token.strength||''}`:'Закрытый жетон')}><TokenGlyph clan={clan} token={token}/></svg>;}
export function CardArt({id,type='territory',name,children,onSelect}:{id:string;type?:'territory'|'objective';name:string;children?:ReactNode;onSelect?:()=>void}){
 const src=(type==='objective'?assets.objectives:assets.cards)[id]?.path,description=type==='objective'?OBJECTIVES[id]?.description:CARDS.find(c=>c.id===id)?.description;
 return <div className="component-card">{onSelect?<><button className="card-face" onClick={onSelect} aria-label={`Выбрать карту: ${name}`}>{src?<img src={src} alt={name}/>:<span className="card-title-cover">{name}</span>}</button><ArtZoom className="card-magnifier" src={src??'/art/cards/territory-back.png'} title={name} description={description}><Magnifier/></ArtZoom></>:src?<ArtZoom src={src} title={name} description={description}><img src={src} alt={name} loading="lazy"/></ArtZoom>:<ArtZoom src="/art/cards/territory-back.png" title={name} description={description}><span className="card-title-cover">{name}</span></ArtZoom>}{children}</div>;
}
export function ArtZoom({src,title,description,children,className=''}:{src:string;title:string;description?:string;children:ReactNode;className?:string}){
 const [open,setOpen]=useState(false),[scale,setScale]=useState(1),ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(open)ref.current?.showModal();else ref.current?.close();},[open]);
 return <><button type="button" className={`art-zoom ${className}`} title={description??title} aria-label={`Рассмотреть: ${title}`} onClick={()=>{setScale(1);setOpen(true);}}>{children}</button>{open&&<dialog ref={ref} className="art-dialog" aria-label={title} onCancel={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}><header><h2>{title}</h2><div><button onClick={()=>setScale(x=>Math.max(1,x-.5))} aria-label="Уменьшить карту в окне">−</button><button onClick={()=>setScale(x=>Math.min(3,x+.5))} aria-label="Увеличить карту в окне">+</button><button autoFocus onClick={()=>setOpen(false)} aria-label="Закрыть изображение">✕</button></div></header>{description&&<p className="readable-card-text">{description}</p>}<div className="zoomed-card-scroll"><img src={src} alt={title} style={{width:`${Math.round(440*scale)}px`}}/></div></dialog>}</>;
}

export function Magnifier(){return <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="10" cy="10" r="6" fill="none" stroke="currentColor" strokeWidth="2"/><path d="m15 15 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;}
