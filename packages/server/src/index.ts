import path from 'node:path';
import {Server,FlatFile} from 'boardgame.io/server';
import serve from 'koa-static';
import {BattleForRokugan} from '../../engine/src/full-game';
import {addPlatformRoutes} from './platform';

const root=path.resolve(__dirname,'../../..');
const port=Number(process.env.PORT??3001);
const publicURL=process.env.PUBLIC_URL??process.env.RENDER_EXTERNAL_URL;
const origins=[...new Set([
 ...process.env.ALLOWED_ORIGINS?.split(',').map(s=>s.trim()).filter(Boolean)??[],
 ...(publicURL?[new URL(publicURL).origin]:[]),
 `http://localhost:${port}`,`http://127.0.0.1:${port}`,
 'http://localhost:5173','http://127.0.0.1:5173',
])];
const server=Server({games:[BattleForRokugan],origins,db:new FlatFile({dir:process.env.MATCHES_DIR??path.join(root,'data/matches')})});
server.app.use(serve(path.join(root,'packages/client/dist')));
addPlatformRoutes(server);
server.router.get('/health',ctx=>{ctx.body={ok:true,game:BattleForRokugan.name,status:'ready'};});
server.run(port,()=>console.log(`Битва за Рокуган: http://localhost:${port}`));
