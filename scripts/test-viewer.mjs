#!/usr/bin/env node
// Zero-dependency viewer smoke test for the site's current published notes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const notes = JSON.parse(fs.readFileSync('notes.json', 'utf8'));
// An in-memory synthesis note so the synthesis display is always exercised.
const [basisA, basisB] = notes.filter(n => n.kind !== 'synthesis');
notes.push({id: 'viewer-test-synthesis', title: '시험 종합', category: '종합', status: '시험',
  updated: '1900-01-01', summary: '시험용 종합 노트', tags: [], source: '시험',
  related: [basisA.id, basisB.id], kind: 'synthesis', synthesis_type: 'cross',
  based_on: [basisA.id, basisB.id],
  body: '## 질문\n[근거](#' + basisA.id + ')와 [근거](#' + basisB.id + ')를 엮는다.'});
// An in-memory novel: a work counted in totals, chapters reached only through it.
notes.push({id: 'viewer-test-novel', title: '시험 소설', category: '소설', status: '시험', updated: '1900-01-01',
  summary: '시험용 소설', tags: [], source: '시험', related: [], kind: 'fiction', fiction_part: 'work', revised: true,
  body: '## 목차\n- [1장](#viewer-test-novel-01)\n- [2장](#viewer-test-novel-02)'});
for (const n of [1, 2]) notes.push({id: 'viewer-test-novel-0' + n, title: '시험 소설 ' + n + '장', category: '소설',
  status: '시험', updated: '1900-01-01', summary: n + '장', tags: [], source: '시험', related: [], kind: 'fiction',
  fiction_part: 'chapter', work: 'viewer-test-novel', chapter: n, revised: n === 1,
  body: '고친 문장이다.' + (n === 1 ? '\n\n:::원본 1장 초고\n고치기 전 **문장**이다.\n:::\n\n뒤 문단.' : '')});
const articleCount = notes.filter(n => n.kind !== 'synthesis' && n.fiction_part !== 'chapter').length;
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
const visit = fragment => {
  fakeLocation.hash = fragment;
  events.get('window:hashchange')();
};
assert.ok(notes.length > 0, 'Expected published notes');
assert.match(html(), /오늘의 무작위 문서/);
assert.match(html(), /주제별 보기/);
assert.match(html(), /최근 갱신/);
assert.ok(nodes.get('#filters').children.length > 1, 'Missing category filters');

visit('#ai-human-control-guide');
assert.match(html(), /이 글의 목차/);
assert.match(html(), /Markdown 원고/);
assert.match(html(), /개정 이력/);
assert.match(html(), /data-copy="https:\/\/belorin\.github\.io\/notes\/ai-human-control-guide\/">LLM용 링크 복사/);
assert.match(html(), /연결된 글/);
assert.equal(nodes.get('#explore-toggle').attributes['aria-expanded'], 'false');
assert.match(html(), /<details class="toc"><summary>/);
nodes.get('#explore-toggle').listeners.click();
assert.equal(nodes.get('#explore-toggle').attributes['aria-expanded'], 'true');

visit('#all');
assert.equal(nodes.get('#explore-toggle').attributes['aria-expanded'], 'true');
assert.ok(html().includes(articleCount + '개 문서'));
assert.ok(!html().includes('시험 종합'), 'Synthesis must stay out of the 전체 list');
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
assert.match(html(), /오늘의 무작위 문서/);
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
console.log('OK: viewer routes, mobile navigation, Markdown tables, alignment, escaping and ' + tableDocuments + ' published table documents');
