"use strict";
const $=id=>document.getElementById(id);
const el=(tag,t)=>{const e=document.createElement(tag);if(t!==undefined)e.textContent=t;return e};
const get=async path=>{const r=await fetch(path);if(!r.ok)throw Error(path+" "+r.status);return r.json()};
async function main(){
 const cat=await get("data/catalog.json"), rosters=await Promise.all(cat.roster_ids.map(id=>get("data/rosters/"+id+".json")));
 const ens=new Map(cat.ensembles.map(x=>[x.id,x.name])), concerts=new Map(cat.concerts.map(x=>[x.id,x]));
 const eventLabel=c=>c.date+(c.time?" "+c.time:"")+" · "+c.title;
 const applies=(r,id)=>(r.applies_to_concert_ids||[r.concert_id]).includes(id);
 const label=r=>r.applies_to_concert_ids?concerts.get(r.concert_id).date+" · "+concerts.get(r.concert_id).title.replace(/ — \d+회차$/,"")+" (제작 공통 명부)":r.concert_id?eventLabel(concerts.get(r.concert_id)):r.season;
 const membershipCandidates=(r,x)=>{const pid=concerts.get(r.concert_id)?.production_id;if(!pid)return [];return rosters.filter(s=>s.ensemble_id===r.ensemble_id&&s.source.type==="booklet_membership_snapshot"&&s.source.production_id===pid).flatMap(s=>s.records.filter(y=>y.name===x.name||y.cast_name_aliases?.includes(x.name)))};
 const records=rosters.flatMap(r=>r.records.map(x=>({...x,roster:r,ensemble:ens.get(r.ensemble_id),scope:label(r),membership:membershipCandidates(r,x).map(y=>y.role+" (명부 연결 후보)").join(" / ")})));
 for(const [title,num] of [["공연 회차",cat.concerts.length],["단체",cat.ensembles.length],["명부",rosters.length],["등장 기록",records.length]]){const d=el("div");d.className="metric";d.append(el("strong",num+"건"),el("span",title));$("metrics").append(d)}
 const option=(target,value,label)=>{const o=el("option",label);o.value=value;$(target).append(o)};
 for(const e of cat.ensembles)option("ensemble",e.id,e.name);
 for(const c of cat.concerts)option("scope",c.id,eventLabel(c));
 for(const r of rosters.filter(r=>!r.concert_id))option("scope",r.id,ens.get(r.ensemble_id)+" · "+r.season);
 const overview=el("section");overview.append(el("h2","공연별 참여 단체 및 명부 확보 상태"));for(const c of cat.concerts){const d=el("details");d.append(el("summary",eventLabel(c)));for(const eid of c.ensemble_ids){const rr=rosters.filter(r=>applies(r,c.id)&&r.ensemble_id===eid);d.append(el("p",(c.ensemble_labels?.[eid]||ens.get(eid))+" — "+(rr.length?"명부 "+rr.reduce((n,r)=>n+r.records.length,0)+"건"+(rr.some(r=>r.applies_to_concert_ids)?" (제작 공통)":""):"개인 명부 미확보")))}if(c.documentation_note)d.append(el("p",c.documentation_note));overview.append(d)}$("status").before(overview);
 const productions=await Promise.all((cat.production_credit_ids||[]).map(id=>get("data/productions/"+id+".json")));
 const creditSection=el("section");creditSection.append(el("h2","제작진·기관·협력업체"),el("p","제작 프로젝트 단위 기록. 기관 명부에 기재된 사람이 해당 공연에 직접 참여했다는 뜻은 아닙니다."));
 const creditSearch=el("input");creditSearch.placeholder="제작진·업체·직책 검색";creditSearch.setAttribute("aria-label","제작진·업체·직책 검색");creditSection.append(creditSearch);const creditResults=el("div");creditSection.append(creditResults);
 function renderCredits(){creditResults.replaceChildren();const q=creditSearch.value.trim().toLowerCase();for(const p of productions){const rows=p.credits.filter(c=>[p.title,c.name,c.role,c.organization,c.department].join(" ").toLowerCase().includes(q));if(!rows.length)continue;const d=el("details");d.open=!!q;d.append(el("summary",p.title+" · "+rows.length+"개 크레딧 · "+(p.transcription_review==="user_reviewed"?"검수 완료":"재검수 전")));const groups=new Map();for(const c of rows){const key=c.scope==="production"?"프로덕션":c.organization+(c.department?" / "+c.department:"")+" (기관 명부)";if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c)}for(const [key,cs] of groups){d.append(el("h3",key));const table=el("div");table.className="table";const t=el("table");for(const c of cs){const tr=el("tr");for(const value of [c.role,c.printed_name||c.name,c.entity_type==="person"?"개인":c.entity_type==="vendor"?"협력업체":"공연단체"])tr.append(el("td",value));t.append(tr)}table.append(t);d.append(table)}creditResults.append(d)}}
 creditSearch.addEventListener("input",renderCredits);renderCredits();document.querySelector("footer").before(creditSection);
 const q=$("q");
 function render(){const text=q.value.trim().toLowerCase(), e=$("ensemble").value,s=$("scope").value,k=$("category").value;
 const out=records.filter(x=>(!e||x.roster.ensemble_id===e)&&(!s||applies(x.roster,s)||x.roster.id===s)&&(!k||x.category===k)&&text.split(/\s+/).every(t=>[x.name,x.part,x.role,x.membership,x.ensemble,x.scope].join(" ").toLowerCase().includes(t)));
 $("status").textContent=out.length+"개 명부 등장 기록 · 고유 인원 및 실제 출연 인원과 다릅니다.";
 $("rows").replaceChildren();const frag=document.createDocumentFragment();
 for(const x of out){const tr=el("tr"), name=el("td"), b=el("button",x.name);b.type="button";b.addEventListener("click",()=>{q.value=x.name;$("ensemble").value="";$("scope").value="";$("category").value="";render()});name.append(b);tr.append(name);for(const v of [x.part,x.role||x.membership||"미표기",x.ensemble,x.scope])tr.append(el("td",v));const td=el("td"),a=el("a",x.roster.transcription_review==="user_reviewed"?"검수 완료":x.roster.source.url?"웹 출처 · 미검수":"재검수 전");a.href=x.roster.source.url||(x.roster.source.wiki?"../#"+x.roster.source.wiki:"data/rosters/"+x.roster.id+".json");a.title=x.roster.source.label;td.append(a);tr.append(td);frag.append(tr)}$("rows").append(frag)}
 for(const id of ["q","ensemble","scope","category"])$(id).addEventListener(id==="q"?"input":"change",render);
 const groups=new Map();for(const x of records.filter(x=>x.roster.concert_id&&["instrumentalist","chorister","dancer","actor"].includes(x.category))){const key=x.name+"\u0000"+x.part;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x)}
 for(const xs of groups.values()){if(new Set(xs.map(x=>x.roster.ensemble_id)).size<2)continue;const d=el("details"),head=el("summary",xs[0].name+" · "+xs[0].part+" — "+new Set(xs.map(x=>x.roster.ensemble_id)).size+"개 단체 (동일인 미확인)");d.append(head);for(const x of xs)d.append(el("p",x.scope+" / "+x.ensemble+" / "+(x.role||"직책 미표기")));$("matches").append(d)}
 if(!$("matches").childNodes.length)$("matches").append(el("p","현재 후보 없음"));render()
}
main().catch(e=>{$("status").textContent="데이터를 불러오지 못했습니다: "+e.message});
