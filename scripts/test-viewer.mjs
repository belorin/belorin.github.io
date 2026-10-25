#!/usr/bin/env node
// Zero-dependency viewer smoke test for the site's current published notes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const notes = JSON.parse(fs.readFileSync('notes.json', 'utf8'));
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
assert.match(html(), /연결된 글/);
assert.equal(nodes.get('#explore-toggle').attributes['aria-expanded'], 'false');
assert.match(html(), /<details class="toc"><summary>/);
nodes.get('#explore-toggle').listeners.click();
assert.equal(nodes.get('#explore-toggle').attributes['aria-expanded'], 'true');

visit('#all');
assert.equal(nodes.get('#explore-toggle').attributes['aria-expanded'], 'true');
assert.ok(html().includes(notes.length + '개 문서'));
nodes.get('#search').value = 'AI';
nodes.get('#search').listeners.input();
assert.match(html(), /검색 결과/);
assert.ok(!html().includes(notes.length + '개 문서'), 'Search did not narrow results');

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
