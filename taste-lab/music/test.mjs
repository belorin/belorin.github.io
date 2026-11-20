import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fresh, plan, attach, react, validate, resume, main } from './music.mjs';

const state = fresh('music-00', 'Unreleased demo', 5, '2026-11-20T00:00:00.000Z');
assert.equal(validate(state), true);
assert.equal(state.versions[0].status, 'planned');
assert.throws(() => react(state, 'v000', {reaction:'liked'}), /without a linked audio/);

const v1=plan(state,{parent:'v000',start:5,duration:10,intent:'Transition into contrasting theme',now:'2026-11-20T00:00:10.000Z'});
assert.equal(v1,'v001');
assert.equal(state.head,v1);
assert.equal(state.versions.length,2);
assert.equal(state.versions[0].status,'planned','parent remains unchanged');
const v2=plan(state,{parent:'v000',start:5,duration:5,intent:'Alternative fork',kind:'variation',now:'2026-11-20T00:00:11.000Z'});
assert.equal(v2,'v002','the branch can fork from v000 without overwriting v001');
assert.equal(state.versions.find(v=>v.version_id==='v002').parent,'v000');

const status=attach(state,v1,{source:'https://example.org/song-v1.yaml',audio:'https://example.org/song-v1.wav'});
assert.equal(status,'render-linked');
assert.throws(()=>attach(state,v1,{audio:'https://example.org/other.wav'}), /immutable/);
const e1=react(state,v1,{start:5,duration:10,reaction:'The second half is striking, but the beginning matters',attraction:'positive',fatigue:'unknown',now:'2026-11-20T00:00:12.000Z'});
assert.equal(e1,'e0001');
assert.equal(state.next_focus.duration_sec,10);
assert.equal(state.versions.find(v=>v.version_id==='v001').status,'auditioned');
assert.equal(state.listens[0].reported_fatigue,'unknown','exposure must not imply human saturation');
assert.ok(resume(state).includes('음악 취향 실험을 이어가자'));
assert.ok(resume(state).includes('5초부터 10초 구간'));
const tampered = structuredClone(state);
tampered.versions.find(v=>v.version_id==='v000').parent='v002';
assert.throws(()=>validate(tampered),/Cycle/);
const tampered2=structuredClone(state);
tampered2.versions.find(v=>v.version_id==='v001').audio=null;
assert.throws(()=>validate(tampered2),/audio/);

const d=fs.mkdtempSync(path.join(os.tmpdir(),'music-taste-test-'));
try {
 const file=path.join(d,'demo.json');
 assert.match(main(['init',file,'00','Demo','--duration','10']),/Created/);
 assert.throws(()=>main(['init',file,'00','Demo']),/already exists/);
 assert.match(main(['plan',file,'--parent','v000','--start','0','--duration','5','--intent','New opening']),/v001/);
 assert.match(main(['attach',file,'v001','--source','https://example.org/00-v1.yaml','--audio','https://example.org/00-v1.wav']),/render-linked/);
 assert.match(main(['react',file,'v001','--reaction','좋지만 반복 느낌','--novelty','repetitive']),/e0001/);
 assert.match(main(['validate',file]),/Valid/);
 assert.match(main(['resume',file]),/반복 느낌/);
} finally { fs.rmSync(d,{recursive:true,force:true}); }
console.log('music taste continuation tests passed');
