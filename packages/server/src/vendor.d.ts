declare module 'koa-static' {
  import type { Middleware } from 'koa';
  function serve(root:string):Middleware;
  export default serve;
}
