#!/usr/bin/env node
// Deterministic AI navigation generated from Markdown metadata, without network or LLM calls.
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
const root=process.cwd();
// Headings inside a folded ":::원본 … :::" block (FICTION.md) belong to the old text.
const withoutOriginals = text => text.replace(/^[ \t]*:::[ \t]*원본(?:[ \t].*)?$[\s\S]*?^[ \t]*:::[ \t]*$/gm, "");
const manifest=JSON.parse(fs.readFileSync(path.join(root,'wiki/manifest.json'),'utf8'));
const relations=JSON.parse(fs.readFileSync(path.join(root,'wiki/relations.json'),'utf8'));
const knownIds=new Set(manifest.documents.map(d=>d.id));
const knownAlias=new Set();
for(const d of manifest.documents){
 if(typeof d.id!=='string'||!/^[-a-z0-9]+$/.test(d.id)||d.path!=='wiki/'+d.id+'.md')throw Error('invalid id/path: '+d.id);
 if(!fs.existsSync(path.join(root,d.path)))throw Error('missing Markdown: '+d.path);
 if(!Array.isArray(d.aliases))throw Error('aliases missing: '+d.id);
 for(const a of d.aliases){if(typeof a!=='string'||!a.trim()||knownAlias.has(a))throw Error('duplicate or invalid alias '+a);knownAlias.add(a);}
 if(d.last_enriched_on!==null&&d.last_enriched_on!==undefined&&!/^\d{4}-\d{2}-\d{2}$/.test(d.last_enriched_on))throw Error('invalid enrichment date: '+d.id);
}
for(const r of relations.relations){
 const d=manifest.documents.find(d=>d.id===r.from);
 if(!d||!knownIds.has(r.to))throw Error('invalid relation endpoint');
 const body=fs.readFileSync(path.join(root,d.path),'utf8');
 const headings=Array.from(withoutOriginals(body).matchAll(/^#{1,6}[ \t]+(.+?)[ \t]*$/gm),x=>x[1].trim());
 if(headings.filter(h=>h===r.evidence_section).length!==1)throw Error('missing evidence heading: '+r.from+'/'+r.evidence_section);
}
const buildOutputs=function buildOutputs(manifest,relationSource){
 const raw="https://raw.githubusercontent.com/belorin/belorin.github.io/main/";
 const gh="https://github.com/belorin/belorin.github.io/blob/main/";
 const site="https://belorin.github.io/";
 const docs=manifest.documents.filter(d=>d.publish===true).sort((a,b)=>(a.order??1e9)-(b.order??1e9));
 const ids=new Set(docs.map(d=>d.id));
 const allowed=new Set(["introduces","elaborates","illustrates","curates","contrasts","challenges","supports"]);
 const edgeKeys=new Set(),edges=[];
 function edge(e){const key=[e.from,e.to,e.type].join("::");if(edgeKeys.has(key))throw Error("duplicate relationship "+key);edgeKeys.add(key);edges.push(e);}
 for(const d of docs) {
  if(!d.id||!d.title||!d.summary||!d.updated||!d.category||!Array.isArray(d.related)||!Array.isArray(d.aliases)) throw Error("incomplete "+d.id);
  if(!["unassessed","needs_review","reviewed"].includes(d.review_state))throw Error("invalid review_state "+d.id);
  for(const to of d.related){if(!ids.has(to))throw Error("unpublished relation "+to);edge({from:d.id,to,type:"related_to",basis:"manifest.related"});}
 }
 for(const r of relationSource.relations){
   if(!ids.has(r.from)||!ids.has(r.to)||r.from===r.to||!allowed.has(r.type)||!r.evidence_section||!r.reason)throw Error("bad curated relation");
   edge({from:r.from,to:r.to,type:r.type,basis:"curated",evidence_section:r.evidence_section,reason:r.reason});
 }
 const index={
  version:1,scope:"published_only",
  description:"탐색 메타데이터. 논증·사례는 Markdown 정본을 읽는다. 대화 원문은 포함하지 않는다.",
  source_files:["wiki/manifest.json","wiki/relations.json"],document_count:docs.length,
  documents:docs.map(d=>({
   id:d.id,title:d.title,aliases:d.aliases,category:d.category,tags:d.tags||[],summary:d.summary,
   published:true,review_state:d.review_state,review_label:d.status,last_updated_on:d.updated,
   last_enriched_on:d.last_enriched_on||null,
   last_enriched_note:d.last_enriched_on?"explicitly_recorded":"not_recorded_for_legacy_content",
   related_ids:d.related,
   ...(d.kind==="synthesis"?{kind:d.kind,synthesis_type:d.synthesis_type,based_on:d.based_on,note:"편집 해석. 사실 근거로 인용하지 않는다."}:{}),
   ...(d.kind==="fiction"?{kind:d.kind,fiction_part:d.fiction_part,...(d.work?{work:d.work,chapter:d.chapter}:{}),...(d.revised?{revised:true}:{}),note:"소설. 사실 근거로 인용하지 않는다."}:{}),
   markdown_url:raw+d.path,github_url:gh+d.path,page_url:site+"notes/"+d.id+"/",app_url:site+"#"+d.id
  }))
 };
 const relations={
  version:1,scope:"published_only",
  types:{related_to:"manifest.related의 일반적인 관련성",introduces:"상세 주제의 진입점",elaborates:"기존 주제 심화",illustrates:"사례로 구체화",curates:"대상을 선별·배열",contrasts:"차이 대조",challenges:"반론 제기",supports:"논거 제공"},
  source_files:["wiki/manifest.json","wiki/relations.json"],edge_count:edges.length,edges
 };
 const md=["# AI 탐색 색인","",
  "> Markdown이 상세 지식의 정본이다. 이 문서는 탐색용이며 논증과 근거를 대체하지 않는다.",
  "> 공개 사이트 문서만 나열한다. 미게시 원고는 내부 편집 시 wiki/manifest.json에서 확인한다.",
  "> last_enriched_on이 null이면 기존 기록만으로 실제 증보일을 확인할 수 없다는 뜻이다.",
  "","- [기계용 색인](ai/index.json)","- [관계 유형](ai/relations.json)","- [llms.txt](llms.txt)",""];
 const ll=["# belorin · 열린 노트","",
  "> Markdown을 정본으로 유지하는 누적형 지식백과. 이 목록은 탐색용이므로 상세 Markdown을 읽어야 한다.",
  "> 개인 대화 원문을 제공하지 않으며 공개 문서만 안내한다.",
  "","## 이 위키를 읽는 AI에게","",
  "1. 아래 목록의 제목과 설명에서 질문과 관련된 문서를 고른다. 분야를 넘나드는 연결이 많으므로 한 분류에서만 찾지 않는다.",
  "2. 고른 문서의 링크(본문이 들어 있는 문서 페이지)를 실제로 열어 읽는다. 목록의 한 줄 설명만으로 내용을 단정하거나 인용하지 않는다.",
  "3. 문서 페이지 `"+site+"notes/<문서-id>/`에는 본문이 들어 있다. 원문 Markdown은 `"+raw+"wiki/<문서-id>.md`이다. 탐색 화면 주소 `"+site+"#<문서-id>`는 자바스크립트로 본문을 그리므로 HTML만 받으면 본문이 없다.",
  "4. 답할 때는 근거가 된 문서와 절 제목을 밝힌다. 원문에 없는 내용은 위키 밖의 지식이나 추론임을 구분한다.",
  "5. 맨 아래 '종합' 묶음은 여러 문서를 엮은 편집 해석이다. 생각의 실마리로 쓰되 사실의 근거로 인용하지 말고, 각 글이 밝힌 근거 문서를 읽는다.",
  "6. '소설' 묶음은 창작 작품이다. 사실의 근거로 인용하지 않는다. 긴 작품은 작품 문서의 목차에서 장별 원문으로 이동한다. ':::원본'으로 감싼 부분은 개고 전 원문이다.",
  "","## Navigation","",
  "- [AI metadata index]("+site+"ai/index.json): Document IDs, aliases, review state and dates.",
  "- [Typed relations]("+site+"ai/relations.json): Related and curated semantic links.",
  "- [Markdown index]("+site+"AI_INDEX.md): Browsable public article catalog.",
  "- [Website]("+site+"): Human reading interface.",
  "","## Published Markdown articles",""];
 const cats=[...new Set(docs.filter(d=>!d.kind).map(d=>d.category))];
 for(const c of cats){
  md.push("## "+c,"");ll.push("### "+c,"");
  for(const d of docs.filter(x=>x.category===c)){
   md.push("- **["+d.title+"]("+d.path+")** · 별칭: "+d.aliases.join(", ")+" · 수정: "+d.updated+" · 검토: "+d.status);
   md.push("  - "+d.summary);
   md.push("  - [문서 페이지]("+site+"notes/"+d.id+"/) · [직접 Markdown]("+raw+d.path+")");
   ll.push("- ["+d.title+"]("+site+"notes/"+d.id+"/): "+d.summary);
  }
  md.push("");ll.push("");
 }
 const works=docs.filter(d=>d.kind==="fiction"&&d.fiction_part==="work");
 if(works.length){
  md.push("## 소설 (창작 작품 · 사실 근거 아님)","","> 장별 문서는 각 작품의 목차에서 이어진다.","");
  ll.push("### 소설 (창작 작품 · 사실 근거 아님)","");
  for(const d of works){
   const n=docs.filter(x=>x.work===d.id).length;
   md.push("- **["+d.title+"]("+d.path+")** · "+(n?n+"개 장":"단편")+(d.revised?" · 개고본":"")+" · 수정: "+d.updated);
   md.push("  - "+d.summary);
   md.push("  - [문서 페이지]("+site+"notes/"+d.id+"/) · [직접 Markdown]("+raw+d.path+")");
   ll.push("- ["+d.title+"]("+site+"notes/"+d.id+"/): [소설"+(n?" · "+n+"개 장":"")+"] "+d.summary);
  }
  md.push("");ll.push("");
 }
 const syntheses=docs.filter(d=>d.kind==="synthesis");
 if(syntheses.length){
  const label={cross:"교차 종합",concept:"개념 길잡이",critique:"편집 비평"};
  md.push("## 종합 (편집 해석 · 사실 근거 아님)","","> 여러 문서를 엮은 편집 해석이다. 사실 근거로 인용하지 않고, 각 글의 근거 문서를 읽는다.","");
  ll.push("### 종합 (편집 해석 · 사실 근거 아님)","");
  for(const d of syntheses){
   md.push("- **["+d.title+"]("+d.path+")** · "+label[d.synthesis_type]+" · 근거: "+d.based_on.join(", ")+" · 수정: "+d.updated);
   md.push("  - "+d.summary);
   md.push("  - [문서 페이지]("+site+"notes/"+d.id+"/) · [직접 Markdown]("+raw+d.path+")");
   ll.push("- ["+d.title+"]("+site+"notes/"+d.id+"/): ["+label[d.synthesis_type]+"] "+d.summary);
  }
  md.push("");ll.push("");
 }
 return {
  "ai/index.json":JSON.stringify(index,null,2)+"\n",
  "ai/relations.json":JSON.stringify(relations,null,2)+"\n",
  "AI_INDEX.md":md.join("\n").trimEnd()+"\n",
  "llms.txt":ll.join("\n").trimEnd()+"\n"
 };
};
const outputs=buildOutputs(manifest,relations);
let changes=0;
for(const [filename,body] of Object.entries(outputs)){
 const target=path.join(root,filename);
 const existing=fs.existsSync(target)?fs.readFileSync(target,'utf8'):null;
 if(existing===body)continue;
 if(process.argv.includes('--check'))throw Error('Stale generated AI index: '+filename);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,body);changes++;
}
console.log('AI index validated: '+manifest.documents.filter(d=>d.publish).length+' public articles; '+changes+' outputs updated');
