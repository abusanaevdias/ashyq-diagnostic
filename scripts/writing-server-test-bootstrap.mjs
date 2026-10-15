// Test process only: Next resolves server-only to this empty module on the server.
// No application imports this hook; it provides no runtime activation switch.
import {registerHooks} from 'node:module';
const empty=new URL('../node_modules/next/dist/compiled/server-only/empty.js',import.meta.url).href;
registerHooks({resolve(specifier,context,nextResolve){return specifier==='server-only'?{url:empty,shortCircuit:true}:nextResolve(specifier,context);}});
