import {buildIdentity,statusLabels} from "./identity.mjs";
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
 const profileText=m=>m?[...(m.works||[]).map(w=>w.genre+" "+w.title),...(m.awards||[]),...(m.affiliations||[]),...(m.notes||[])].join(" "):"";
 const profileView=m=>{const d=el("details");d.append(el("summary","약력 메모 · "+m.source.page+"쪽"));for(const [label,items] of [["작품",(m.works||[]).map(w=>w.genre+" · "+w.title)],["수상",m.awards||[]],["소속·직책",m.affiliations||[]],["판독 메모",m.notes||[]]]){if(items.length)d.append(el("p",label+": "+items.join(" / ")))}d.append(el("p","약력 전사 · "+(m.transcription_review==="user_reviewed"?"검수 완료":"미검수")+" · 개별 공연 미확정"));return d};
 const creditSection=el("section");creditSection.append(el("h2","제작진·기관·협력업체"),el("p","제작 프로젝트 단위 기록. 기관 명부에 기재된 사람이 해당 공연에 직접 참여했다는 뜻은 아닙니다."));
 const creditSearch=el("input");creditSearch.placeholder="제작진·업체·직책 검색";creditSearch.setAttribute("aria-label","제작진·업체·직책 검색");creditSection.append(creditSearch);const creditResults=el("div");creditSection.append(creditResults);
 function renderCredits(){creditResults.replaceChildren();const q=creditSearch.value.trim().toLowerCase();for(const p of productions){const rows=p.credits.filter(c=>[p.title,c.name,c.role,c.organization,c.department,profileText(c.profile_note)].join(" ").toLowerCase().includes(q));if(!rows.length)continue;const d=el("details");d.open=!!q;d.append(el("summary",p.title+" · "+rows.length+"개 크레딧 · "+(p.transcription_review==="user_reviewed"?"검수 완료":"재검수 전")));const groups=new Map();for(const c of rows){const key=c.scope==="production"?"프로덕션":c.organization+(c.department?" / "+c.department:"")+" (기관 명부)";if(!groups.has(key))groups.set(key,[]);groups.get(key).push(c)}for(const [key,cs] of groups){d.append(el("h3",key));const table=el("div");table.className="table";const t=el("table");for(const c of cs){const tr=el("tr");for(const value of [c.role,c.printed_name||c.name,c.entity_type==="person"?"개인":c.entity_type==="vendor"?"협력업체":"공연단체"])tr.append(el("td",value));if(c.profile_note){const cell=el("td");cell.append(profileView(c.profile_note));tr.append(cell)}t.append(tr)}table.append(t);d.append(table)}creditResults.append(d)}}
 creditSearch.addEventListener("input",renderCredits);renderCredits();document.querySelector("footer").before(creditSection);
 const careerSection=el("section");careerSection.append(el("h2","경력 사건"),el("p","입단·승급·퇴임 등 명부와 별도로 출처를 기록한 사건. 명부 연결은 동일인 후보입니다."));for(const e of cat.career_events||[]){const d=el("details");d.append(el("summary",e.date+" · "+e.name+" · "+(e.type==="retirement"?"퇴임":e.type)),el("p",ens.get(e.ensemble_id)+" / "+e.part));if(e.tenure)d.append(el("p","상임 "+e.tenure.regular_years+"년 · 비상임 포함 "+e.tenure.total_years_including_nonregular+"년"));d.append(el("p",e.source.label+" — "+e.source.note),el("p",e.note));for(const l of e.record_links||[]){const x=records.find(y=>y.id===l.record_id);if(x)d.append(el("p",x.scope+" / "+x.part+" — "+l.status))}careerSection.append(d)}document.querySelector("footer").before(careerSection);
 const q=$("q");
 function render(){const text=q.value.trim().toLowerCase(), e=$("ensemble").value,s=$("scope").value,k=$("category").value;
 const out=records.filter(x=>(!e||x.roster.ensemble_id===e)&&(!s||applies(x.roster,s)||x.roster.id===s)&&(!k||x.category===k)&&text.split(/\s+/).every(t=>[x.name,x.part,x.role,x.membership,x.ensemble,x.scope,profileText(x.profile_note)].join(" ").toLowerCase().includes(t)));
 $("status").textContent=out.length+"개 명부 등장 기록 · 고유 인원 및 실제 출연 인원과 다릅니다.";
 $("rows").replaceChildren();const frag=document.createDocumentFragment();
 for(const x of out){const tr=el("tr"), name=el("td"), b=el("button",x.name);b.type="button";b.addEventListener("click",()=>{q.value=x.name;$("ensemble").value="";$("scope").value="";$("category").value="";render()});name.append(b);tr.append(name);for(const v of [x.part,x.role||x.membership||"미표기",x.ensemble,x.scope])tr.append(el("td",v));const td=el("td"),a=el("a",x.roster.transcription_review==="user_reviewed"?"검수 완료":x.roster.transcription_review==="source_reviewed"?"공개 출처 대조 완료":x.roster.source.url?"웹 출처 · 미검수":"재검수 전");a.href=x.roster.source.url||(x.roster.source.wiki?"../#"+x.roster.source.wiki:"data/rosters/"+x.roster.id+".json");a.title=x.roster.source.label;td.append(a);if(x.profile_note)td.append(profileView(x.profile_note));tr.append(td);frag.append(tr)}$("rows").append(frag)}
 for(const id of ["q","ensemble","scope","category"])$(id).addEventListener(id==="q"?"input":"change",render);
 const overrides=await get("data/identity-links.json"), identity=buildIdentity(cat,rosters,overrides);
 const match=$("matches"), mode=$("identity-mode"), iq=$("identity-q"), network=$("identity-network");
 const sourceName=x=>x.concert_id?eventLabel(concerts.get(x.concert_id)):rosters.find(r=>r.id===x.roster_id)?.season||x.roster_id;
 function drawNetwork(pairs){
 const ids=[...new Set(pairs.flatMap(p=>p.ensembles))];if(!ids.length)return;
 const ns="http://www.w3.org/2000/svg",svg=document.createElementNS(ns,"svg"),make=(tag,attrs,t)=>{const n=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));if(t)n.textContent=t;return n};
 const width=660,height=Math.max(300,ids.length*58),cx=width/2,cy=height/2;
 svg.setAttribute("viewBox","0 0 "+width+" "+height);svg.setAttribute("role","img");svg.setAttribute("aria-label","단체 간 동일인 연결 후보 관계망");svg.style.width="100%";svg.style.maxHeight="540px";
 const pos=new Map(ids.map((id,i)=>{const a=-Math.PI/2+2*Math.PI*i/ids.length;return [id,[cx+Math.cos(a)*220,cy+Math.sin(a)*(height/2-43)]]}));
 const max=Math.max(...pairs.map(p=>p.count));for(const p of pairs){const [a,b]=p.ensembles.map(id=>pos.get(id));svg.append(make("line",{x1:a[0],y1:a[1],x2:b[0],y2:b[1],stroke:"currentColor","stroke-opacity":".35","stroke-width":1+5*p.count/max,"stroke-dasharray":mode.value==="confirmed"?"none":"6 4"}));svg.append(make("text",{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2-8,fill:"currentColor","font-size":16,"text-anchor":"middle","paint-order":"stroke",stroke:"var(--bg)","stroke-width":5},String(p.count)))}
 for(const id of ids){const [x,y]=pos.get(id),name=ens.get(id);svg.append(make("rect",{x:x-100,y:y-22,width:200,height:44,rx:8,fill:"var(--panel)",stroke:"var(--accent)"}));svg.append(make("text",{x,y:y+5,fill:"currentColor","font-size":name.length>14?12:14,"text-anchor":"middle"},name))}network.append(svg);
 }
 function showIdentity(){
 network.replaceChildren();match.replaceChildren();
 const pairs=identity.network(mode.value);const total=pairs.reduce((s,p)=>s+p.count,0);
 network.append(el("p",pairs.length+"개 단체 쌍 · "+total+"개 단체 쌍별 연결 후보 (고유 인물 수 아님)"));drawNetwork(pairs);
 for(const p of pairs){const d=el("details");d.append(el("summary",p.ensembles.map(id=>ens.get(id)).join(" ↔ ")+" · "+p.count+"개"));for(const c of p.candidates)d.append(el("p",c.label+" / "+statusLabels[c.status]));network.append(d)}
 if(!pairs.length)network.append(el("p","해당 기준의 교차 연결 없음"));
 const query=iq.value.trim().toLowerCase();if(!query){match.append(el("p","이름을 입력하면 직접 연결된 활동 이력과 근거를 표시합니다."));return}
 const hits=identity.rows.filter(x=>[x.name,...(x.cast_name_aliases||[])].some(n=>n.toLowerCase().includes(query)));
 const rendered=new Set();
 for(const x of hits){const links=identity.dossier(x.id,mode.value);const signature=[x.id,...links.map(l=>l.record.id)].sort().join("|");if(rendered.has(signature))continue;rendered.add(signature);const d=el("details");d.open=true;d.append(el("summary",x.name+" · "+(x.family||"분야 미확인")+" · "+ens.get(x.ensemble_id)));
 d.append(el("p","기준 기록: "+sourceName(x)+" / "+x.part));if(x.profile_note)d.append(profileView(x.profile_note));
 for(const l of links){const y=l.record;d.append(el("p",y.name+" · "+ens.get(y.ensemble_id)+" · "+sourceName(y)+" / "+y.part+" — "+statusLabels[l.status]+" ("+l.reason+")"));for(const e of l.evidence||[]){const p=el("p",e.label||e.note||"근거");if(e.url){const a=el("a"," 출처");a.href=e.url;p.append(a)}d.append(p)}}
 if(!links.length)d.append(el("p","이 기준에서 연결된 기록 없음"));match.append(d)}
 for(const item of identity.review.filter(x=>x.name.toLowerCase().includes(query)))match.append(el("p",item.name+" — "+item.reason));
 if(!hits.length)match.append(el("p","검색 결과 없음"));
 }
 mode.addEventListener("change",showIdentity);iq.addEventListener("input",showIdentity);showIdentity();render()

}
main().catch(e=>{$("status").textContent="데이터를 불러오지 못했습니다: "+e.message});
