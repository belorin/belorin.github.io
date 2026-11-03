#!/usr/bin/env node
// Viewer smoke test: run app.js against a fake DOM with fixture data and check
// that home, listing, search, article, about and the calendar fallback render.
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const site = { name: "시험 위키", url: "https://example.github.io/wiki/", repo: "example/wiki", branch: "main",
  categories: ["둘", "하나"], home: { title: "첫 화면" }, about: { title: "소개 제목", lead: "소개 문장", links: [{ id: "a", label: "안내" }] },
  calendar: false, comments: null };
const notes = [
  { id: "a", title: "가 문서", category: "하나", status: "초고", updated: "2026-01-02", summary: "가 요약", tags: ["t"], source: "", related: ["b"],
    body: "## 첫 절\n\n본문 [나](#b) 링크와 **강조**.\n\n## 둘째 절\n\n| 열 | 값 |\n| --- | ---: |\n| x | 1 |\n\n- 목록" },
  { id: "b", title: "나 문서", category: "둘", status: "검토", updated: "2026-01-03", summary: "나 요약", tags: [], source: "출처", related: [], body: "짧은 <b>본문</b>." },
];
function element() {
  return { innerHTML: "", value: "", children: [], attributes: {}, listeners: {}, addEventListener(k, f) { this.listeners[k] = f; },
    setAttribute(k, v) { this.attributes[k] = v; }, replaceChildren() { this.children = []; }, append(x) { this.children.push(x); },
    getAttribute(k) { return this.attributes[k] ?? null; } };
}
const view = element(), search = element(), filters = element();
const nodes = { "#view": view, "#search": search, "#filters": filters, "#sidebar-random": element(), "#explore-toggle": element() };
const windowListeners = {};
const context = {
  document: { querySelector: s => nodes[s], createElement: element, getElementById: () => null, addEventListener() {}, activeElement: null, body: null },
  window: { matchMedia: () => ({ matches: false }), addEventListener: (k, f) => { windowListeners[k] = f; }, scrollTo() {} },
  location: { hash: "" }, navigator: {}, console, Math, Error, setTimeout,
  fetch: async () => ({ ok: true, json: async () => ({ site, notes }) }),
};
vm.runInNewContext(fs.readFileSync("app.js", "utf8"), context, { filename: "app.js", timeout: 5000 });
await new Promise(resolve => setImmediate(resolve));
const go = hash => { context.location.hash = hash; windowListeners.hashchange(); return view.innerHTML; };

assert.match(view.innerHTML, /<h1>첫 화면<\/h1>/);
assert.match(view.innerHTML, /2개 문서/);
assert.deepEqual(filters.children.map(b => b.innerHTML.match(/<span>(.*?)<\/span>/)[1]), ["전체", "둘", "하나"], "topic order follows config");
let html = go("#a");
assert.match(html, /<h1>가 문서<\/h1>/);
assert.match(html, /<h2 id="a-section-1">첫 절<\/h2>/);
assert.match(html, /<a href="#b">나<\/a>/);
assert.match(html, /<strong>강조<\/strong>/);
assert.match(html, /<table>.*<td class="align-right">1<\/td>/s);
assert.match(html, /href="https:\/\/github\.com\/example\/wiki\/edit\/main\/wiki\/a\.md"/);
assert.match(html, /data-copy="https:\/\/example\.github\.io\/wiki\/notes\/a\/"/);
assert.doesNotMatch(html, /giscus/, "comments stay off without a categoryId");
assert.match(go("#b"), /짧은 &lt;b&gt;본문&lt;\/b&gt;/, "HTML in Markdown is escaped");
assert.match(go("#b"), /연결된 글.*가 문서/s, "backlinks are shown");
assert.match(go("#about"), /소개 제목.*안내 — 가 문서/s);
assert.match(go("#calendar"), /달력을 쓸 수 없습니다/);
search.value = "나 요약";
assert.match(go("#all"), /1개 문서 · 검색어/);
search.value = "";
assert.match(go("#nothing"), /문서를 찾을 수 없습니다/);
console.log("OK: viewer renders home, topics, article, about, search and fallbacks");
