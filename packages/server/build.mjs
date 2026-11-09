import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
execFileSync(process.execPath,[path.join(root,'node_modules/typescript/bin/tsc'),'-p',path.join(root,'tsconfig.server.json')],{stdio:'inherit'});
writeFileSync(path.join(root,'build/package.json'),JSON.stringify({type:'commonjs'}));
