#!/usr/bin/env node
// Music taste / Poser artifact handoff. No dependencies; no audio synthesis.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function fresh(songId, title, duration = 5, now = new Date().toISOString()) {
  ensureId(songId);
  ensureFocus(0, duration);
  if (!title || !String(title).trim()) throw new Error('A nonempty title is required');
  return {
    schema_version: 'music-taste/0.1',
    song_id: songId, title: String(title), created_at: now,
    head: 'v000',
    versions: [{
      version_id: 'v000', parent: null, kind: 'seed', status: 'planned',
      focus: {start_sec: 0, duration_sec: duration},
      intent: 'Initial short musical sketch, not yet rendered',
      source: null, audio: null, report: null, created_at: now
    }],
    listens: [], taste_hypotheses: [],
    next_focus: {start_sec: 0, duration_sec: duration},
    links: []
  };
}
function ensureId(id) {
  if (typeof id !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/.test(id)) {
    throw new Error('Invalid song id; use letters, digits, underscore or hyphen');
  }
}
function ensureFocus(start, duration) {
  if (!Number.isFinite(start) || start < 0 || !Number.isFinite(duration) || duration <= 0 || duration > 600) {
    throw new Error('Focus requires start >= 0 and 0 < duration <= 600 seconds');
  }
}
function validWhen(value) {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}
function getVersion(s, versionId) {
  const v = s.versions.find(x => x.version_id === versionId);
  if (!v) throw new Error('Unknown version: ' + versionId);
  return v;
}
export function validate(s) {
  if (!s || typeof s !== 'object' || s.schema_version !== 'music-taste/0.1') throw new Error('Unexpected format');
  ensureId(s.song_id);
  if (typeof s.title !== 'string' || !s.title.trim() || !validWhen(s.created_at)) throw new Error('Invalid title or creation date');
  if (!Array.isArray(s.versions) || !s.versions.length || !Array.isArray(s.listens) || !Array.isArray(s.taste_hypotheses) || !Array.isArray(s.links)) throw new Error('Missing arrays');
  const ids = new Set();
  for (const v of s.versions) {
    if (!v || !/^v\d{3,}$/.test(v.version_id) || ids.has(v.version_id)) throw new Error('Invalid or duplicated version id');
    ids.add(v.version_id);
    ensureFocus(v.focus?.start_sec, v.focus?.duration_sec);
    if (!['seed','revision','variation','exploration'].includes(v.kind) || !['planned','source-linked','render-linked','auditioned'].includes(v.status)) throw new Error('Invalid kind/status');
    if (!validWhen(v.created_at) || typeof v.intent !== 'string' || (v.source !== null && typeof v.source !== 'string') || (v.audio !== null && typeof v.audio !== 'string') || (v.report !== null && typeof v.report !== 'string')) throw new Error('Invalid version data');
    if (v.status === 'source-linked' && !v.source) throw new Error('Source-linked version has no source');
    if (['render-linked','auditioned'].includes(v.status) && !v.audio) throw new Error('Version claims audio without link');
  }
  if (!ids.has(s.head)) throw new Error('Head version not found');
  for (const v of s.versions) {
    if (v.parent !== null && !ids.has(v.parent)) throw new Error('Parent does not exist: ' + v.parent);
    if (v.parent === v.version_id) throw new Error('Version cannot be own parent');
    let p = v.parent, seen = new Set([v.version_id]);
    while (p !== null) {
      if (seen.has(p)) throw new Error('Cycle in parent graph');
      seen.add(p); p = getVersion(s, p).parent;
    }
  }
  const events = new Set();
  for (const e of s.listens) {
    if (!e || !e.event_id || events.has(e.event_id)) throw new Error('Missing or repeated listening event');
    events.add(e.event_id);
    const v = getVersion(s, e.version_id);
    if (!v.audio || !['render-linked','auditioned'].includes(v.status)) throw new Error('Listening event lacks recorded audio');
    if (!validWhen(e.at) || !e.reaction?.trim()) throw new Error('Listening event must have date and reaction');
    ensureFocus(e.focus?.start_sec, e.focus?.duration_sec);
    if (!['positive','negative','mixed','unknown'].includes(e.attraction) || !['new','repetitive','unknown'].includes(e.novelty) || !['yes','no','unknown'].includes(e.reported_fatigue)) throw new Error('Invalid listening tags');
  }
  for (const v of s.versions) {
    if (v.status === 'auditioned' && !s.listens.some(e => e.version_id === v.version_id)) throw new Error('Auditioned version has no recorded reaction');
  }
  ensureFocus(s.next_focus?.start_sec, s.next_focus?.duration_sec);
  return true;
}
export function plan(s, {parent = s.head, start = 0, duration = 5, intent, kind = 'revision', now = new Date().toISOString()}) {
  validate(s);
  getVersion(s, parent);
  ensureFocus(start, duration);
  if (typeof intent !== 'string' || !intent.trim()) throw new Error('A revision intent is required');
  if (!['revision','variation','exploration'].includes(kind)) throw new Error('Invalid revision kind');
  const next = Math.max(...s.versions.map(v => Number(v.version_id.slice(1)))) + 1;
  const version_id = 'v' + String(next).padStart(3, '0');
  s.versions.push({
    version_id, parent, kind, status: 'planned',
    focus: {start_sec:start, duration_sec:duration},
    intent, source:null, audio:null, report:null, created_at:now
  });
  s.head = version_id;
  s.next_focus = {start_sec:start,duration_sec:duration};
  validate(s);
  return version_id;
}
export function attach(s, versionId, {source = undefined, audio = undefined, report = undefined}) {
  validate(s);
  const v = getVersion(s,versionId);
  if (source !== undefined) {
    if (typeof source !== 'string' || !source.trim()) throw new Error('Invalid source link');
    if (v.source && v.source !== source) throw new Error('Existing source is immutable; create another version');
    v.source = source;
  }
  if (audio !== undefined) {
    if (typeof audio !== 'string' || !audio.trim()) throw new Error('Invalid audio link');
    if (v.audio && v.audio !== audio) throw new Error('Existing audio is immutable; create another version');
    v.audio = audio;
  }
  if (report !== undefined) {
    if (typeof report !== 'string' || !report.trim()) throw new Error('Invalid report link');
    if (v.report && v.report !== report) throw new Error('Existing report is immutable; create another version');
    v.report = report;
  }
  v.status = s.listens.some(e=>e.version_id===versionId) ? 'auditioned' : v.audio ? 'render-linked' : v.source ? 'source-linked' : 'planned';
  validate(s);
  return v.status;
}
export function react(s, versionId, {start = 0,duration = 5,reaction,attraction='unknown',novelty='unknown',fatigue='unknown',now=new Date().toISOString()}) {
  validate(s);
  const v=getVersion(s,versionId);
  if (!v.audio) throw new Error('Cannot record listening without a linked audio file');
  ensureFocus(start,duration);
  if (typeof reaction !== 'string' || !reaction.trim()) throw new Error('A natural-language reaction is required');
  const i=s.listens.length+1;
  const id='e'+String(i).padStart(4,'0');
  s.listens.push({
    event_id:id,version_id:versionId,at:now,focus:{start_sec:start,duration_sec:duration},
    reaction,attraction,novelty,reported_fatigue:fatigue
  });
  v.status='auditioned';
  s.head=versionId;
  s.next_focus={start_sec:start,duration_sec:duration};
  validate(s);
  return id;
}
export function resume(s) {
  validate(s);
  const v=getVersion(s,s.head);
  const recent=s.listens.slice(-5).map(e =>
    '  - '+e.version_id+' '+e.focus.start_sec+'–'+(e.focus.start_sec+e.focus.duration_sec)+'초: '+e.reaction+
    ' (호감 '+e.attraction+', 새로움 '+e.novelty+', 보고된 피로 '+e.reported_fatigue+')'
  );
  const lines=[
    '음악 취향 실험을 이어가자. 규약: taste-lab/music/README.md (L1–L3).',
    '곡 ID: '+s.song_id+' / '+s.title,
    '현재 버전: '+v.version_id+' ('+v.status+') / 부모: '+(v.parent ?? '없음'),
    '작업 의도: '+v.intent,
    '현재 소스: '+(v.source || '미연결'),
    '현재 음원: '+(v.audio || '미연결'),
    '현재 분석: '+(v.report || '미연결'),
    '다음 대상: '+s.next_focus.start_sec+'초부터 '+s.next_focus.duration_sec+'초 구간',
    '최근 감상:'
  ];
  lines.push(...(recent.length ? recent : ['  - 아직 없음']));
  lines.push('요청: 파일과 접근 가능한 소스를 먼저 확인해. 5/10초 단위로 실제 수정을 진행하되 원본 버전은 보존해. 사용자 취향과 작곡기 실패를 구분하고 결과 오디오가 없으면 들었다고 하지 마. 설명은 필요할 때만 길게 보여줘.');
  return lines.join('\n');
}
function argumentsFor(argv) {
  const pos=[],opts={};
  for(let i=0;i<argv.length;i++) {
    if(argv[i].startsWith('--')) {
      const key=argv[i].slice(2);
      if(i===argv.length-1 || argv[i+1].startsWith('--')) throw new Error('Expected value after --'+key);
      opts[key]=argv[++i];
    } else pos.push(argv[i]);
  }
  return {pos,opts};
}
function takeNumber(o,k,def) {
  const x=o[k]===undefined?def:Number(o[k]);
  if (!Number.isFinite(x)) throw new Error('Invalid number for '+k);
  return x;
}
function read(filename) { const s=JSON.parse(fs.readFileSync(filename,'utf8'));validate(s);return s; }
function write(filename,s,first=false) {
  validate(s);
  const dest=path.resolve(filename);
  if(first && fs.existsSync(dest)) throw new Error('File already exists: '+dest);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  const temp=dest+'.tmp-'+process.pid;
  try { fs.writeFileSync(temp,JSON.stringify(s,null,2)+'\n',{encoding:'utf8',flag:'wx'});fs.renameSync(temp,dest); }
  finally { if(fs.existsSync(temp))fs.unlinkSync(temp); }
}
export function main(argv) {
  const command=argv[0], file=argv[1];
  if(!command||!file)throw new Error('Usage: music.mjs <init|plan|attach|react|resume|validate> <state.json> ...');
  const {pos,opts}=argumentsFor(argv.slice(2));
  if(command==='init') {
    if(pos.length!==2)throw new Error('init <file> <song-id> <title> [--duration 5|10]');
    const s=fresh(pos[0],pos[1],takeNumber(opts,'duration',5));
    write(file,s,true);return 'Created unbound song state: '+s.song_id+' ('+s.head+')';
  }
  const s=read(file);
  if(command==='validate')return 'Valid: '+s.song_id+' ('+s.versions.length+' versions, '+s.listens.length+' listens)';
  if(command==='resume')return resume(s);
  if(command==='plan') {
    const id=plan(s,{parent:opts.parent??s.head,start:takeNumber(opts,'start',0),duration:takeNumber(opts,'duration',5),intent:opts.intent,kind:opts.kind??'revision'});
    write(file,s);return 'Planned '+id+' from '+getVersion(s,id).parent+'; source and audio not yet linked';
  }
  if(command==='attach') {
    if(pos.length!==1)throw new Error('attach <file> <version> --source <link> --audio <link> [--report <link>]');
    const status=attach(s,pos[0],opts);
    write(file,s);return 'Attached '+pos[0]+' / '+status+' (links are not verified by this tool)';
  }
  if(command==='react') {
    if(pos.length!==1)throw new Error('react <file> <version> --reaction <text>');
    const id=react(s,pos[0],{start:takeNumber(opts,'start',0),duration:takeNumber(opts,'duration',5),reaction:opts.reaction,attraction:opts.attraction||'unknown',novelty:opts.novelty||'unknown',fatigue:opts.fatigue||'unknown'});
    write(file,s);return 'Recorded '+id+' for '+pos[0];
  }
  throw new Error('Unknown command: '+command);
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try{console.log(main(process.argv.slice(2)));}catch(e){console.error('Music state error: '+e.message);process.exitCode=1;}
}
