#!/usr/bin/env node
// Tests do not store or require chat transcripts.
import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import process from 'node:process';
const root=process.cwd();
function run(file,...params){
 const r=spawnSync(process.execPath,[path.join(root,'scripts',file),...params],{cwd:root,encoding:'utf8'});
 assert.equal(r.status,0,file+' '+params.join(' ')+'\n'+r.stdout+'\n'+r.stderr);
 return r.stdout;
}
run('validate-crosslinks.mjs');
const direct=JSON.parse(run('search-wiki.mjs','--query','재즈 즉흥연주','--limit','10','--json'));
assert.ok(direct.results.some(r=>r.id==='jazz-dialogue'));
assert.equal(direct.scope,'published_only');
assert.ok(direct.results.every(r=>r.published));
const indirect=JSON.parse(run('search-wiki.mjs','--related','silent-film-musician-labor','--all','--novel','--limit','50','--json'));
const candidate=indirect.results.find(r=>r.id==='ai-mediated-human-change');
assert.ok(candidate,'Cross-domain indirect candidate not found');
assert.equal(candidate.direct_link,false);
assert.ok(candidate.semantic_proposal);
assert.equal(indirect.requires_model_review,true);
const philosophy=JSON.parse(run('search-wiki.mjs','--query','들뢰즈 생성 미래','--all','--limit','30','--json'));
assert.ok(philosophy.results.some(r=>r.id==='deleuze-becoming-new'));
console.log('OK: searchable corpus, indirect candidates and editorial review safeguards');
