#!/usr/bin/env node
// Offline hybrid candidate search: Korean character n-grams + metadata + graph neighbors.
// This is NOT an embedding model. Interpretive links require an AI/editor to read both articles.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
const args=process.argv.slice(2);
const val=key=>{const i=args.indexOf(key);return i>=0?args[i+1]:null;};
const all=args.includes('--all'),json=args.includes('--json');
const anchor=val('--related');
const query=val('--query')??(!anchor?args.filter(x=>!x.startsWith('--')).join(' '):'');
const limitValue=Number(val('--limit')||10);
if(!Number.isInteger(limitValue)||limitValue<1)throw Error('Invalid --limit');
const limit=Math.min(50,limitValue);
if(!query&&!anchor)throw Error('Usage: node scripts/search-wiki.mjs --query "text" [--all] [--json] OR --related ID [--all] [--novel] [--json]');
const root=process.cwd();
const manifest=JSON.parse(fs.readFileSync(path.join(root,'wiki/manifest.json'),'utf8'));
const proposals=JSON.parse(fs.readFileSync(path.join(root,'editorial/crosslinks/index.json'),'utf8'));
function sectionsOf(md){
 const sections=[];let current=null;
 for(const line of md.replace(/\r\n/g,'\n').split('\n')){
  const m=line.match(/^(#{1,6})[ \t]+(.+?)\s*$/);
  if(m){current={heading:m[2].trim(),lead:''};sections.push(current);continue;}
  if(current&&!current.lead&&line.trim()&&!/^[ \t]*([-*+] |\d+\. |\[)/.test(line)&&!line.startsWith('>')){
   current.lead=line.replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/https?:\/\/\S+/g,'').replace(/[\*_\x60>#|]/g,'').trim().slice(0,180);
  }
 }
 return sections;
}
const docs=manifest.documents.filter(d=>all||d.publish===true).map(d=>{
 const body=fs.readFileSync(path.join(root,d.path),'utf8');
 return {id:d.id,title:d.title||body.split('\n')[0].replace(/^# /,''),aliases:d.aliases||[],tags:d.tags||[],summary:d.summary||'',published:d.publish===true,related_ids:d.related||[],sections:sectionsOf(body),markdown_url:'https://raw.githubusercontent.com/belorin/belorin.github.io/main/'+d.path};
});
const byId=new Map(docs.map(d=>[d.id,d]));
if(anchor&&!byId.has(anchor))throw Error('Missing anchor '+anchor+'; use --all for unlisted articles');
function grams(value){
 const text=String(value||'').normalize('NFKC').toLowerCase();
 const out=new Set(),words=text.match(/[가-힣]+|[a-z][a-z0-9-]+/g)||[];
 for(const w of words){
  if(w.length>=2)out.add(w);
  if(/[가-힣]/.test(w))for(const n of [2,3])for(let i=0;i<=w.length-n;i++)out.add(w.slice(i,i+n));
 }
 return out;
}
function searchable(doc){return [doc.title,...doc.aliases,...doc.tags,doc.summary,...doc.sections.flatMap(s=>[s.heading,s.lead])].join(' ');}
const gramsById=new Map(docs.map(d=>[d.id,grams(searchable(d))]));
const idf=new Map();
for(const set of gramsById.values())for(const t of set)idf.set(t,(idf.get(t)||0)+1);
function similarity(left,right){
 let shared=0,den1=0,den2=0;
 for(const token of left){const v=Math.log(1+docs.length/(1+(idf.get(token)||0)));den1+=v*v;if(right.has(token))shared+=v*v;}
 for(const token of right){const v=Math.log(1+docs.length/(1+(idf.get(token)||0)));den2+=v*v;}
 return den1&&den2?shared/Math.sqrt(den1*den2):0;
}
const queryGrams=anchor?gramsById.get(anchor):grams(query);
const links=new Map(docs.map(d=>[d.id,new Set(d.related_ids.filter(x=>byId.has(x))]));
for(const d of docs)for(const to of links.get(d.id))links.get(to)?.add(d.id);
const sourceN=anchor?(links.get(anchor)||new Set()):new Set();
const candidates=docs.filter(d=>d.id!==anchor).map(d=>{
 const lexical=similarity(queryGrams,gramsById.get(d.id));
 const direct=!!anchor&&sourceN.has(d.id);
 const mutual=anchor?[...sourceN].filter(n=>links.get(d.id)?.has(n)).length:0;
 const proposal=proposals.proposals.find(p=>p.status!=='rejected'&&((p.from.doc_id===anchor&&p.to.doc_id===d.id)||(p.to.doc_id===anchor&&p.from.doc_id===d.id)));
 const exactName=!!query&&[d.title,...d.aliases].some(s=>s&&query.includes(s));
 const score=+(lexical*10+(direct?0.7:0)+Math.min(mutual,4)*0.28+(proposal?1.8:0)+(exactName?1.25:0)).toFixed(4);
 return {id:d.id,title:d.title,score,lexical:+lexical.toFixed(4),direct_link:direct,shared_neighbor_count:mutual,semantic_proposal:proposal?.id||null,published:d.published,sections:d.sections.slice(0,5).map(s=>s.heading),markdown_url:d.markdown_url};
}).filter(x=>x.score>0);
const results=candidates.filter(x=>!args.includes('--novel')||!x.direct_link).sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id)).slice(0,limit);
const output={query:anchor?null:query,related:anchor||null,scope:all?'all_repository_markdown_public_git':'published_only',method:'lexical+Korean-character-ngrams+link-graph+editorial-proposals (not vector embeddings)',requires_model_review:true,results};
if(json)console.log(JSON.stringify(output,null,2));
else{
 console.log('Candidate ranking only. Read full Markdown; a score is NOT evidence of semantic equivalence.');
 for(const x of results)console.log(x.score.toFixed(2)+' '+x.id+' '+(x.direct_link?'[direct]':'[unlinked]')+' shared:'+x.shared_neighbor_count+' proposal:'+(x.semantic_proposal||'none')+'\n  '+x.markdown_url);
}
