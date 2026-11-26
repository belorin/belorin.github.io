// Reversible identity hypotheses over immutable source records. No automatic person_id assignment.
export const statusLabels={possible:"추정",likely:"유력",confirmed:"확인",distinct:"별개 인물"};
const norm=s=>s.normalize("NFC").trim().replace(/\s+/g," ");
export function family(x){
 if(x.category==="instrumentalist"){if(["제1바이올린","제2바이올린","바이올린","악장"].includes(x.part))return "바이올린";if(["팀파니","타악기"].includes(x.part))return "타악기";if(["트롬본","베이스트롬본"].includes(x.part))return "트롬본";if(x.part==="파곳")return "바순";return x.part==="미확인"?null:x.part}
 if(x.category==="chorister")return "성부:"+x.part;
 if(x.category==="dancer")return "무용";
 if(x.category==="actor")return "연기";
 if(x.category==="accompanist")return "반주";
 if(x.category==="leadership"||x.category==="staff")return "직책:"+x.part;
 return null;
}
export const pairKey=(a,b)=>[a,b].sort().join("|");
export function buildIdentity(cat,rosters,overrides={links:[]}){
 const concerts=new Map(cat.concerts.map(x=>[x.id,x]));
 const rows=rosters.flatMap(r=>r.records.map(x=>({...x,ensemble_id:r.ensemble_id,roster_id:r.id,concert_id:r.concert_id,production_id:r.source?.production_id||concerts.get(r.concert_id)?.production_id||null,source:r.source?.label,review:r.transcription_review, family:family(x)})));
 const byId=new Map(rows.map(x=>[x.id,x])), groups=new Map(), nameGroups=new Map();
 const autoKey=x=>{if(!x.family)return null;let scope=x.role==="어린이객원"?"|production:"+x.production_id:x.category==="dancer"||x.category==="actor"?"|ensemble:"+x.ensemble_id:x.category==="staff"||x.category==="leadership"?"|ensemble:"+x.ensemble_id:"";return norm(x.name)+"|"+x.family+scope};
 // Minor guest records are never automatically linked across productions.
 for(const x of rows){const k=autoKey(x);if(k){if(!groups.has(k))groups.set(k,[]);groups.get(k).push(x)}if(!nameGroups.has(norm(x.name)))nameGroups.set(norm(x.name),[]);nameGroups.get(norm(x.name)).push(x)}
 const links=new Map();const put=(a,b,status,reason,evidence=[])=>{if(a.id===b.id)return;links.set(pairKey(a.id,b.id),{a:a.id,b:b.id,status,reason,evidence})};
 for(const xs of groups.values())for(let i=0;i<xs.length;i++)for(let j=i+1;j<xs.length;j++){const a=xs[i],b=xs[j];put(a,b,a.ensemble_id===b.ensemble_id?"likely":"possible",a.ensemble_id===b.ensemble_id?"이름·분야·단체 일치":"이름·악기/성부 계열 일치")}
 for(const o of overrides.links||[]){const a=byId.get(o.a),b=byId.get(o.b);if(a&&b)put(a,b,o.status,o.reason,o.evidence||[])}
 // A direct contradiction excludes the pair; never infer confirmed relations transitively.
 const edges=[...links.values()];const rank={possible:1,likely:2,confirmed:3,distinct:0};
 function network(mode="possible"){
  const min=rank[mode]??1,pairs=new Map();
  for(const e of edges){if(rank[e.status]<min)continue;const a=byId.get(e.a),b=byId.get(e.b);if(a.ensemble_id===b.ensemble_id||!a.concert_id||!b.concert_id)continue;
   const k=pairKey(a.ensemble_id,b.ensemble_id);if(!pairs.has(k))pairs.set(k,new Map());const label=norm(a.name)===norm(b.name)?norm(a.name)+" · "+(a.family||b.family||"분야 미확인"):[a.name,b.name].sort().join(" / ");const bucket=pairs.get(k),old=bucket.get(label);if(!old||rank[e.status]>rank[old.status])bucket.set(label,{label,status:e.status,example:[e.a,e.b]});
  }
  return [...pairs.entries()].map(([k,m])=>({ensembles:k.split("|"),count:m.size,candidates:[...m.values()].sort((a,b)=>a.label.localeCompare(b.label,"ko"))})).sort((a,b)=>b.count-a.count);
 }
 function dossier(id,mode="possible"){const min=rank[mode]??1;return edges.filter(e=>(e.a===id||e.b===id)&&rank[e.status]>=min).map(e=>({record:byId.get(e.a===id?e.b:e.a),status:e.status,reason:e.reason,evidence:e.evidence}));}
 const review=[...nameGroups].filter(([n,xs])=>xs.some(x=>!x.family)&&xs.some(x=>x.family)).map(([name,xs])=>({name,record_ids:xs.map(x=>x.id),reason:"이름 일치, 일부 악기 미확인; 자동 연결 제외"}));
 return {rows,byId,edges,groups,network,dossier,review};
}
