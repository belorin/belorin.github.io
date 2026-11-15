/* Objects and transformations, not a model of human preferences. */
const Engine = (() => {
 const rng = seed => {let n=seed>>>0;return()=>((n=(1664525*n+1013904223)>>>0)/4294967296)};
 const clone = o=>JSON.parse(JSON.stringify(o));
 function base(seed) {const r=rng(seed);return {seed,ops:[],marks:Array.from({length:12},(_,i)=>({x:70+(i%4)*85,y:130+Math.floor(i/4)*100,r:12+r()*23,kind:i%3,angle:0}))}}
 const ops=['orbit','fold','fracture','weave'];
 function transform(obj,op) {const o=clone(obj);o.ops.push(op);
 if(op==='orbit')o.marks.forEach((p,i)=>{const a=Math.atan2(p.y-280,p.x-210)+.65;const d=Math.hypot(p.x-210,p.y-280);p.x=210+Math.cos(a)*d*.88;p.y=280+Math.sin(a)*d*.88;p.angle+=38});
 if(op==='fold')o.marks=o.marks.flatMap(p=>[{...p,x:45+p.x*.42,r:p.r*.72},{...p,x:375-p.x*.42,r:p.r*.72,angle:-p.angle}]);
 if(op==='fracture')o.marks.forEach((p,i)=>{p.x+=p.y>280?43:-25;p.y+=p.x>210?25:-10;p.angle+=i%2?24:-24;p.kind=(p.kind+1)%3});
 if(op==='weave')o.marks.forEach((p,i)=>{p.x+=Math.sin(p.y/48)*32;p.y+=Math.sin(p.x/55)*32;p.r*=i%2?.65:1.2;p.angle+=p.y/7});
 return o;
 }
 const make=(seed,seq)=>seq.reduce(transform,base(seed));
 function signature(o){const m=o.marks,n=m.length;return [n/96,m.reduce((s,p)=>s+p.x,0)/n/420,m.reduce((s,p)=>s+p.y,0)/n/560,m.reduce((s,p)=>s+Math.hypot(p.x-210,p.y-280),0)/n/300,m.filter(p=>p.kind===0).length/n,m.reduce((s,p)=>s+Math.abs(p.angle),0)/n/180]}
 const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
 function candidates(seed){const out=[];for(const a of ops)for(const b of ops)for(const c of ops)out.push(make(seed,[a,b,c]));return out}
 function select(seed,diverse){const pool=candidates(seed);if(!diverse)return pool.slice(0,6);let selected=[pool.splice(seed%pool.length,1)[0]];while(selected.length<6){let best=-1,score=-1;pool.forEach((o,i)=>{const d=Math.min(...selected.map(p=>distance(signature(o),signature(p))));if(d>score){score=d;best=i}});selected.push(pool.splice(best,1)[0])}return selected}
 function svg(o,palette=0){const palettes=[['#eee7d6','#183e46','#cf603f','#e3ac45'],['#171e32','#d5ded7','#bc83a9','#7fa7ad'],['#f1d8c8','#582f50','#dc654f','#648a77']];const p=palettes[palette%3];let marks=o.marks.map((m,i)=>{const fill=p[1+i%3];const shape=m.kind===0?`<circle cx="0" cy="0" r="${m.r}"/>`:m.kind===1?`<rect x="${-m.r}" y="${-m.r*1.7}" width="${m.r*2}" height="${m.r*3.4}"/>`:`<path d="M ${-m.r} ${m.r} L 0 ${-m.r*1.8} L ${m.r} ${m.r} Z"/>`;return `<g transform="translate(${m.x} ${m.y}) rotate(${m.angle})" fill="${fill}" opacity=".82">${shape}</g>`}).join('');return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 560" role="img" aria-label="밤의 정원: 생성 조형 작품"><defs><clipPath id="field"><rect x="20" y="90" width="380" height="390"/></clipPath></defs><rect width="420" height="560" fill="${p[0]}"/><text x="24" y="46" font-family="Georgia,serif" font-size="27" fill="${p[1]}">THE UNSEEN GARDEN</text><text x="25" y="68" font-family="monospace" font-size="9" letter-spacing="3" fill="${p[1]}">STUDIES IN RELATION / 2026</text><g clip-path="url(#field)">${marks}</g><path d="M24 496H396" stroke="${p[1]}"/><text x="24" y="523" font-family="Georgia,serif" font-size="17" fill="${p[1]}">A place between familiar things.</text><text x="24" y="546" font-family="monospace" font-size="10" fill="${p[1]}">NIGHT GARDEN · OPEN AFTER DARK</text></svg>`}
 const step=([q,m],op)=>op==='A'?[q+m,m+1]:op==='B'?[q,m-1]:[q+.5,m];
 const walk=(s,seq)=>{const path=[s];for(const op of seq)path.push(step(path.at(-1),op));return path};
 function reach(s,depth,allowC){const found=new Map([[s.join(','),[]]]);let frontier=[s];for(let d=0;d<depth;d++){const next=[];for(const p of frontier)for(const op of allowC?['A','B','C']:['A','B']){const t=step(p,op),key=t.join(',');if(!found.has(key)){found.set(key,[...found.get(p.join(',')),op]);next.push(t)}}frontier=next}return found}
 return {rng,base,transform,make,signature,distance,candidates,select,svg,step,walk,reach};
})();
if(typeof module!=='undefined')module.exports=Engine;
