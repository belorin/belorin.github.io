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
vm.runInNewContext(fs.readFileSync('app.js', 'utf8'),
  {document: fakeDocument, window: fakeWindow, location: fakeLocation,
   fetch: fakeFetch, console, Math, Error},
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
console.log('OK: home, categories, article, TOC, links, listing, search, about, missing article');
