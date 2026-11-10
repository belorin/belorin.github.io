#!/usr/bin/env node
// Zero-dependency viewer smoke test for the site's current published notes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const notes = JSON.parse(fs.readFileSync('notes.json', 'utf8'));
// An in-memory synthesis note so the synthesis display is always exercised.
const [basisA, basisB] = notes.filter(n => !n.kind);
notes.push({id: 'viewer-test-synthesis', title: '시험 종합', category: '종합', status: '시험',
  updated: '1900-01-01', summary: '시험용 종합 노트', tags: [], source: '시험',
  related: [basisA.id, basisB.id], kind: 'synthesis', synthesis_type: 'cross',
  based_on: [basisA.id, basisB.id],
  body: '## 질문\n[근거](#' + basisA.id + ')와 [근거](#' + basisB.id + ')를 엮는다.'});
// An independent AI essay is discoverable only in its own category or search.
notes.push({id: 'viewer-test-essay', title: '시험 AI 논고', category: 'AI의 글', status: 'AI 독립 저술',
  updated: '1900-01-01', summary: '시험용 AI 자율 논고', tags: [], source: '위키 기반 AI 저술',
  related: [basisA.id], kind: 'ai-essay', essay_origin: 'post-ingestion', based_on: [basisA.id],
  body: '## 논고\n[출발 문서](#' + basisA.id + ')를 읽고 새로운 문제를 제기한다.'});
// An in-memory novel: a work counted in totals, chapters reached only through it.
notes.push({id: 'viewer-test-novel', title: '시험 소설', category: '소설', status: '시험', updated: '1900-01-01',
  summary: '시험용 소설', tags: [], source: '시험', related: [], kind: 'fiction', fiction_part: 'work', revised: true,
  body: '## 목차\n- [1장](#viewer-test-novel-01)\n- [2장](#viewer-test-novel-02)'});
for (const n of [1, 2]) notes.push({id: 'viewer-test-novel-0' + n, title: '시험 소설 ' + n + '장', category: '소설',
  status: '시험', updated: '1900-01-01', summary: n + '장', tags: [], source: '시험', related: [], kind: 'fiction',
  fiction_part: 'chapter', work: 'viewer-test-novel', chapter: n, revised: n === 1,
  body: '고친 문장이다.' + (n === 1 ? '\n\n:::원본 1장 초고\n고치기 전 **문장**이다.\n:::\n\n뒤 문단.' : '')});
const articleCount = notes.filter(n => n.kind !== 'synthesis' && n.kind !== 'ai-essay' && n.fiction_part !== 'chapter').length;
const events = new Map();
function element() {
  return {
    innerHTML: '',
    value: '',
    children: [],
    listeners: {},
    attributes: {},
    addEventListener(name, handler) { this.listeners[name] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    replaceChildren() { this.children = []; },
    append(child) { this.children.push(child); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    focus() { this.focused = true; },
    blur() { this.focused = false; }
  };
}
const nodes = new Map(['#view', '#search', '#filters', '#sidebar-random', '#explore-toggle']
  .map(selector => [selector, element()]));
const fakeDocument = {
  querySelector(selector) { return nodes.get(selector); },
  createElement() { return element(); },
  getElementById() { return {scrollIntoView() {}}; },
  addEventListener(name, handler) { events.set('document:' + name, handler); },
  activeElement: null
};
const fakeWindow = {
  matchMedia() { return {matches: true}; },
  addEventListener(name, handler) { events.set('window:' + name, handler); },
  scrollTo() {}
};
const fakeLocation = {hash: ''};
const fakeFetch = async () => ({ok: true, json: async () => notes});
const context = {document: fakeDocument, window: fakeWindow, location: fakeLocation,
  fetch: fakeFetch, console, Math, Error};
vm.runInNewContext(fs.readFileSync('app.js', 'utf8'), context,
  {filename: 'app.js', timeout: 5000});

await new Promise(resolve => setImmediate(resolve));
const html = () => nodes.get('#view').innerHTML;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
const visit = fragment => {
  fakeLocation.hash = fragment;
  events.get('window:hashchange')();
};
assert.ok(notes.length > 0, 'Expected published notes');
assert.match(html(), /오늘의 문서/);
assert.equal(fakeDocument.title, 'belorin · 열린 노트');
assert.ok(!html().includes('topic-grid'), 'Home no longer repeats the topic list');
visit('#calendar');
assert.match(html(), /달력을 불러오지 못했습니다/, 'The calendar route degrades when calendar.js is absent');
visit('');
assert.match(html(), /최근 갱신/);
assert.ok(nodes.get('#filters').children.length > 1, 'Missing category filters');

visit('#ai-human-control-guide');
assert.match(html(), /이 글의 목차/);
assert.match(fakeDocument.title, /^AI와 인간의 통제력.* · belorin · 열린 노트$/, 'The tab title names the article');
assert.match(html(), / · 약 \d+분<\/div>/, 'Reading time missing');
assert.match(html(), /Markdown 원고/);
assert.match(html(), /개정 이력/);
assert.match(html(), /data-copy="https:\/\/belorin\.github\.io\/notes\/ai-human-control-guide\/">LLM용 링크 복사/);
assert.match(html(), /<div class="giscus" data-term="ai-human-control-guide"><\/div>/, 'Each article has its own comment thread');
assert.match(html(), /href="https:\/\/github\.com\/belorin\/belorin\.github\.io\/edit\/main\/wiki\/ai-human-control-guide\.md"[^>]*>고치기/);
assert.match(html(), /연결된 글/);
assert.equal(nodes.get('#explore-toggle').attributes['aria-expanded'], 'false');
assert.match(html(), /<details class="toc"><summary>/);
nodes.get('#explore-toggle').listeners.click();
assert.equal(nodes.get('#explore-toggle').attributes['aria-expanded'], 'true');

visit('#all');
assert.equal(nodes.get('#explore-toggle').attributes['aria-expanded'], 'true');
assert.ok(html().includes(articleCount + '개 문서'));
assert.ok(!html().includes('시험 종합'), 'Synthesis must stay out of the 전체 list');
assert.ok(!html().includes('시험 AI 논고'), 'AI essays must stay out of the knowledge 전체 list');
nodes.get('#search').value = 'AI';
nodes.get('#search').listeners.input();
assert.match(html(), /검색 결과/);
assert.ok(!html().includes(articleCount + '개 문서'), 'Search did not narrow results');

visit('#viewer-test-synthesis');
assert.match(html(), /class="reader is-synthesis"/);
assert.match(html(), /<span class="badge-synthesis">종합 · 교차 종합<\/span>/);
assert.match(html(), /class="synthesis-note"/);
assert.ok(html().includes('href="#' + basisA.id + '"') && html().includes('href="#' + basisB.id + '"'), 'Basis links missing');
visit('#' + basisA.id);
assert.match(html(), /시험 종합/, 'Basis article should list the synthesis among connected notes');

visit('#viewer-test-essay');
assert.match(html(), /class="reader is-essay"/);
assert.match(html(), /badge-essay">AI의 글 · 증보 후/);
assert.match(html(), /class="essay-note"/);
assert.ok(html().includes('href="#' + basisA.id + '"'), 'Essay basis link missing');
visit('#all');
const essayFilter = nodes.get('#filters').children.find(n => n.innerHTML.includes('AI의 글'));
assert.ok(essayFilter, 'AI essay category missing');
essayFilter.listeners.click();
assert.ok(html().includes('href="#viewer-test-essay"'), 'AI essay missing from its own category');
nodes.get('#filters').children[0].listeners.click(); // restore 전체 for existing listing assertions
visit('#viewer-test-novel-01');
assert.match(html(), /class="reader is-fiction"/);
assert.match(html(), /<span class="badge-fiction">소설 · 1장 · 개고본<\/span>/);
assert.match(html(), /class="fiction-note"/);
assert.match(html(), /<details class="original-text"><summary>1장 초고 — 개고 전 원본 보기<\/summary><div class="original-body"><p>고치기 전 <strong>문장<\/strong>이다.<\/p><\/div><\/details><p>뒤 문단.<\/p>/);
assert.match(html(), /href="#viewer-test-novel">↑ 목차: 시험 소설<\/a>/);
assert.match(html(), /href="#viewer-test-novel-02">다음 장 →/);
assert.ok(!html().includes('이전 장'), 'First chapter has no previous chapter');
visit('#viewer-test-novel-02');
assert.match(html(), /href="#viewer-test-novel-01">← 이전 장/);
assert.ok(!html().includes('fiction-note'), 'Unrevised chapter shows no revision note');
nodes.get('#search').value = '';
visit('#all');
assert.ok(html().includes('시험 소설') && !html().includes('시험 소설 1장'), 'Works are listed, chapters are not');

visit('#about');
assert.match(html(), /운영과 원칙/);
visit('#not-an-article');
assert.match(html(), /문서를 찾을 수 없습니다/);

visit('');
assert.match(html(), /오늘의 문서/);
fakeWindow.matchMedia = () => ({matches: false});
visit('#ai-human-control-guide');
assert.match(html(), /<details class="toc" open><summary>/);

// Regression: public manuscripts must render tables rather than pipe-delimited paragraphs.
visit('#state-hollowing-country-pilot');
assert.equal((html().match(/<table>/g) || []).length, 2);
assert.equal((html().match(/<tbody>/g) || []).length, 2);
assert.equal((html().match(/<tr>/g) || []).length, 42);
assert.match(html(), /<th scope="col" class="align-right">GPI<\/th>/);
assert.match(html(), /<td class="align-right"><strong>18\.6<\/strong><\/td>/);
assert.ok(!html().includes('| ---'), 'Table delimiter leaked into article');

const markdown = text => context.renderMarkdown(text, 'table-test').html;
const table = markdown('앞 문단\n\n항목 | 수치 | 설명\n:--- | ---: | :---:\n**강조** | 42 | [링크](#all)\n빈 칸 | 7\n추가 칸 | 8 | `코드` | 무시\n\n## 다음 절\n- 목록');
assert.match(table, /<p>앞 문단<\/p><div class="table-scroll"/);
assert.match(table, /role="region"[^>]*tabindex="0"/);
assert.match(table, /<th scope="col" class="align-center">설명<\/th>/);
assert.match(table, /<td class="align-left"><strong>강조<\/strong><\/td>/);
assert.match(table, /<td class="align-center"><a href="#all">링크<\/a><\/td>/);
assert.match(table, /<td class="align-center"><\/td>/);
assert.ok(!table.includes('무시'), 'Extra body cells should be ignored');
assert.match(table, /<\/table><\/div><h2[^>]*>다음 절<\/h2><ul><li>목록<\/li><\/ul>/);

const pipes = markdown('| 이름 | 표현 |\n| --- | --- |\n| a\\|b | `x|y` |\n| c | 끝\\| |');
assert.match(pipes, /<td class="align-left">a\|b<\/td>/);
assert.match(pipes, /<td class="align-left"><code>x\|y<\/code><\/td>/);
assert.match(pipes, /<td class="align-left">끝\|<\/td>/);
assert.ok(!markdown('일반 | 문장\n이어지는 문장').includes('<table>'));
assert.ok(!markdown('| A | B |\n| --- |').includes('<table>'), 'Mismatched header is not a table');
const unsafe = markdown('| <img src=x onerror=alert(1)> |\n| --- |\n| [위험](javascript:alert) |');
assert.ok(!unsafe.includes('<img'));
assert.ok(!unsafe.includes('href="javascript:'));
assert.match(unsafe, /&lt;img/);

let tableDocuments = 0;
for (const note of notes) {
  const count = note.body.split('\n').filter(line => /^\|\s*:?-{3,}:?\s*\|/.test(line)).length;
  if (!count) continue;
  assert.equal((markdown(note.body).match(/<table>/g) || []).length, count, note.id);
  tableDocuments++;
}

// Inline marks: emphasis inside bold, bare addresses, literal code spans.
assert.equal(markdown('**비트만의 *Con brio*와 *Partita***'), '<p><strong>비트만의 <em>Con brio</em>와 <em>Partita</em></strong></p>');
assert.equal(markdown('**굵게** 그리고 *기울임*'), '<p><strong>굵게</strong> 그리고 <em>기울임</em></p>');
assert.equal(markdown('- 초록: https://example.org/a_b.pdf?x=1&y=2.'),
  '<ul><li>초록: <a href="https://example.org/a_b.pdf?x=1&amp;y=2" target="_blank" rel="noopener noreferrer">https://example.org/a_b.pdf?x=1&amp;y=2</a>.</li></ul>');
assert.equal(markdown('[https://example.org](https://example.org)'), '<p><a href="https://example.org" target="_blank" rel="noopener noreferrer">https://example.org</a></p>');
assert.equal(markdown('`**그대로** https://example.org`'), '<p><code>**그대로** https://example.org</code></p>');
assert.ok(!markdown('javascript:alert(1) https://x.test/"onmouseover="1').includes('"onmouseover'));

// Search: all words must match; title hits come first; body hits show the passage.
const searchFor = text => { nodes.get('#search').value = text; visit('#all'); return html(); };
const titles = text => [...searchFor(text).matchAll(/<h2><a href="#([a-z0-9-]+)">/g)].map(m => m[1]);
assert.equal(titles('시험 종합')[0], 'viewer-test-synthesis', 'A title match ranks first');
assert.match(searchFor('시험 종합'), /<mark>시험<\/mark> <mark>종합<\/mark>/);
assert.equal(titles('고치기 전 문장').join(), 'viewer-test-novel-01', 'Body words are searched together');
assert.match(html(), /class="list-snippet">.*<mark>고치기<\/mark>/);
assert.equal(titles('없는말xyz 시험').length, 0);
assert.match(html(), /해당하는 문서가 없습니다/);
assert.ok(!searchFor('<b>').includes('<b>'), 'Query text must be escaped');
nodes.get('#search').value = '';

// In-text links connect both ways, like manifest relations.
visit('#viewer-test-novel-02');
assert.match(html(), /연결된 글[\s\S]*href="#viewer-test-novel"/, 'A linked chapter lists its work');

// Deployed data: the index has no bodies; an article fetches its own, search fetches all.
{
  const requests = [];
  const slim = notes.map(({body, ...meta}) => ({...meta, chars: body.length, aliases: meta.id === basisB.id ? ['별칭시험어'] : [],
    ...(meta.id === basisA.id ? {k: 2, rel: [{id: basisB.id, dir: 'out', type: 'elaborates', reason: '시험 관계의 이유'}]} : {})}));
  const pieces = [{d: '2026-01-02', k: 'counterargument', t: '시험 반론 표제', s: 2, h: '둘째 절'}, {d: '2026-01-01', k: 'fact', t: '시험 사실 표제'}];
  const logData = [...pieces.map(piece => ({...piece, doc: basisA.id})), {d: '2026-01-01', k: 'fact', t: '없는 문서', doc: 'gone'}];
  const view2 = element(), search2 = element(), events2 = new Map();
  const nodes2 = new Map([['#view', view2], ['#search', search2], ['#filters', element()], ['#sidebar-random', element()], ['#explore-toggle', element()]]);
  const location2 = {hash: '#' + basisA.id};
  const state = {};
  vm.runInNewContext(fs.readFileSync('app.js', 'utf8'), {
    document: {...fakeDocument, querySelector: s => nodes2.get(s), addEventListener() {}},
    window: {matchMedia: () => ({matches: false}), scrollTo(options) { state.top = options.top; },
      addEventListener(name, handler) { events2.set(name, handler); }, history: {state: {y: 321}, replaceState() {}}},
    location: location2, console, Math, Error,
    fetch: async url => {
      requests.push(url);
      if (url === 'data/index.json') return {ok: true, json: async () => slim};
      if (url === 'notes.json') return {ok: true, json: async () => notes};
      if (url === 'data/log.json') return {ok: true, json: async () => logData};
      const id = /^data\/notes\/([a-z0-9-]+)\.json$/.exec(url)?.[1];
      return id ? {ok: true, json: async () => ({id, body: notes.find(n => n.id === id).body, ...(id === basisA.id ? {knowledge: pieces} : {})})} : {ok: false};
    }
  }, {filename: 'app.js', timeout: 5000});
  const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(resolve => setImmediate(resolve)); };
  await settle();
  assert.deepEqual(requests, ['data/index.json', 'data/notes/' + basisA.id + '.json'], 'An article loads the index and its own body only');
  assert.ok(view2.innerHTML.includes('class="prose"') && !view2.innerHTML.includes('불러오는 중'), 'Body did not render');
  assert.equal(state.top, 321, 'Back/forward restores the remembered scroll position');
  assert.match(view2.innerHTML, /이 글에 담긴 지식 · 2건/);
  assert.match(view2.innerHTML, new RegExp('data-jump="' + basisA.id + '-section-2">둘째 절</button>'));
  assert.match(view2.innerHTML, /class="kind kind-counterargument">반론<\/span><span>시험 반론 표제/);
  assert.match(view2.innerHTML, /class="typed">[^<]* →<span class="relation"><span class="relation-type">→ 심화<\/span>시험 관계의 이유/);
  const go = async fragment => { location2.hash = fragment; events2.get('hashchange')(); await settle(); return view2.innerHTML; };
  assert.match(await go('#log'), /<h1>지식 일지<\/h1>/);
  assert.match(view2.innerHTML, /data-kind="counterargument"[^>]*>반론 <span class="filter-count">1</);
  assert.ok(view2.innerHTML.includes('href="#' + basisA.id + '/2">시험 반론 표제</a>'), 'A log item leads to its section');
  assert.ok(!view2.innerHTML.includes('없는 문서'), 'Items of unknown documents stay out');
  assert.ok((await go('#' + basisA.id + '/2')).includes('class="prose"'), 'A section address opens its article');
  assert.match(await go('#' + basisA.id + '/999'), /class="prose"/);
  search2.value = '별칭시험어';
  location2.hash = '#all';
  events2.get('hashchange')();
  assert.ok(view2.innerHTML.includes(esc(basisB.title)), 'Aliases from the index are searchable before bodies arrive');
  assert.match(view2.innerHTML, /본문을 불러오는 중/);
  await settle();
  assert.equal(requests.filter(url => url === 'notes.json').length, 1, 'Search loads every body once');
  search2.value = '반론 시험';
  events2.get('hashchange')();
  assert.match(view2.innerHTML, /지식 표제 1건/, 'Knowledge titles are searchable');
  assert.ok(view2.innerHTML.includes('href="#' + basisA.id + '/2">'), 'A knowledge hit leads to its section');
  assert.ok(!view2.innerHTML.includes('본문을 불러오는 중'));
}
console.log('OK: viewer routes, mobile navigation, Markdown tables, alignment, escaping and ' + tableDocuments + ' published table documents');
