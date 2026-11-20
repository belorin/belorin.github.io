import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script, createContext } from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(resolve(import.meta.dirname, 'index.html'), 'utf8');
const match = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match, 'HTML must contain a runtime script');
const script = match[1];
new Script(script, {filename:'character-app-inline.js'});
assert.match(html, /id="card"/);
assert.match(html, /data-vote="yes"/);
assert.match(html, /data-vote="no"/);
assert.match(html, /data-vote="curious"/);
assert.match(script, /state\.events\.push\(event\)/);
assert.match(script, /event=\{id:a\.id,vote:v,at:/);
assert.match(script, /Math\.exp\(/);
assert.match(script, /function generatedPrompt\(/);
assert.match(script, /function visualData\(/);
assert.match(html, /role="dialog"/);
assert.ok(!html.includes('sk-'), 'Do not publish model credentials');

const isolated = script.replace('bind();boot();', 'globalThis.__test={dataFor,distance,sim,score,generatedPrompt,setPool:(arr)=>{pool=arr},setEvents:(arr)=>{state.events=arr},fresh};');
assert.notEqual(isolated, script, 'Test harness must be inserted before boot');
const store = new Map();
const sandbox = createContext({
  localStorage:{getItem:(k)=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
  document:{getElementById:()=>({})},
  URLSearchParams,Map,Math,Date,console
});
new Script(isolated).runInContext(sandbox);
const app=sandbox.__test;
const a={id:'a',medium:'oil paint',year:1800,ratio:.8,visual:new Array(14).fill(.25)};
const b={id:'b',medium:'woodblock print',year:1900,ratio:1.3,visual:new Array(14).fill(.8)};
const c={id:'c',medium:'oil paint',year:1810,ratio:.83,visual:new Array(14).fill(.27)};
assert.equal(app.dataFor(a).length,26,'26 latent feature slots');
assert.equal(app.distance(a,a),0);
assert.ok(app.distance(a,c)<app.distance(a,b),'proximity is local');
assert.ok(app.sim(a,c)>app.sim(a,b),'kernel respects image-space closeness');
app.setPool([a,b,c]);
app.setEvents([{id:'a',vote:'yes',at:new Date().toISOString(),model:{}}]);
assert.ok(app.score(c).affinity>0,'liked peak creates local attraction');
const initial=app.score(c);
app.setEvents([{id:'a',vote:'no',at:new Date().toISOString(),model:{}}]);
assert.ok(app.score(c).affinity<0,'dislike yields local repulsion');
app.setEvents([{id:'a',vote:'skip',at:new Date().toISOString(),model:{}}]);
assert.equal(app.score(c).affinity,0,'skip is exposure, not preference');
assert.ok(app.generatedPrompt().includes('한 장'),'generator emits one-image prompt');
console.log('character taste card checks passed');
