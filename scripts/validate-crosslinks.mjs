#!/usr/bin/env node
// Validate hypothesis ledger structure and exact Markdown headings; no automatic wiki edits.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'wiki/manifest.json'),'utf8'));
const ledger=JSON.parse(fs.readFileSync(path.join(root,'editorial/crosslinks/index.json'),'utf8'));
const docs=new Map(manifest.documents.map(d=>[d.id,d]));
const fail=m=>{throw Error(m);};
const exact=(o,allowed,n)=>{if(!o||typeof o!=='object'||Array.isArray(o))fail(n+': invalid object');for(const k of Object.keys(o))if(!allowed.includes(k))fail(n+': unexpected field '+k);};
const safe=(v,n,max=300)=>{if(typeof v!=='string'||!v.trim()||v.length>max||/[\r\n\x00-\x1f]/.test(v)||/https?:\/\//i.test(v))fail(n+': invalid public-safe field');};
const date=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d+'T00:00:00Z'))&&new Date(d+'T00:00:00Z').toISOString().slice(0,10)===d;
const types=new Set(['analogy','conceptual_extension','methodological_parallel','possible_contrast','possible_counterargument']);
const states=new Set(['proposed','approved','integrated','rejected']);
function checkRef(ref,n){
 exact(ref,['doc_id','section'],n);safe(ref.doc_id,n+'.doc_id',90);safe(ref.section,n+'.section',200);
 const d=docs.get(ref.doc_id);if(!d)fail(n+': unknown document '+ref.doc_id);
 const body=fs.readFileSync(path.join(root,d.path),'utf8');
 const headings=Array.from(body.matchAll(/^#{1,6}[ \t]+(.+?)[ \t]*$/gm),m=>m[1].trim());
 if(headings.filter(h=>h===ref.section).length!==1)fail(n+': missing or ambiguous section '+ref.section);
}
exact(ledger,['version','description','proposals'],'index');
if(ledger.version!==1||!Array.isArray(ledger.proposals))fail('Invalid proposals ledger');
const ids=new Set(),pairs=new Set();
for(const p of ledger.proposals){
 exact(p,['id','created_on','from','to','type','status','basis','hypothesis','reason','limitation','review_note'],p.id||'proposal');
 safe(p.id,'id',100);if(!/^link-\d{8}-[a-z0-9-]+$/.test(p.id)||ids.has(p.id))fail('Invalid/duplicate ID');ids.add(p.id);
 if(!date(p.created_on))fail(p.id+': invalid date');
 checkRef(p.from,p.id+'.from');checkRef(p.to,p.id+'.to');
 if(p.from.doc_id===p.to.doc_id)fail(p.id+': self link');
 if(!types.has(p.type)||!states.has(p.status)||p.basis!=='editorial_hypothesis')fail(p.id+': bad type/state/basis');
 for(const k of ['hypothesis','reason','limitation'])safe(p[k],p.id+'.'+k);
 if(p.review_note!==undefined)safe(p.review_note,'review_note');
 if(p.status!=='proposed'&&!p.review_note)fail(p.id+': review decision requires review_note');
 const key=[p.from.doc_id,p.to.doc_id].sort().join('::')+'::'+p.type;
 if(pairs.has(key))fail('Duplicate concept relation: '+key);pairs.add(key);
}
console.log('OK: '+ledger.proposals.length+' cross-topic interpretive proposals; no automatic facts or links');
