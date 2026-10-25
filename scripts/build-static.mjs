#!/usr/bin/env node
/**
 * Build static, crawlable pages into a deploy directory (default _site):
 *   notes/<id>/index.html  one page per published note, article already rendered
 *   notes/index.html       all documents, grouped by category
 *   sitemap.xml            home, the index and every note page
 * Pages are rendered by app.js's own article() in a sandbox, so they match the
 * interactive site exactly. Output is deployed only, never committed.
 *
 * Usage: node scripts/build-static.mjs [outDir]
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";

const root = process.cwd();
const outDir = path.resolve(root, process.argv[2] || "_site");
const site = "https://belorin.github.io/";
const siteName = "belorin · 열린 노트";
const notes = JSON.parse(fs.readFileSync(path.join(root, "notes.json"), "utf8"));
const ids = new Set(notes.map(n => n.id));
const indexHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const cssVersion = (indexHtml.match(/style\.css\?v=([^"]+)/) || [])[1] || "1";
const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pageUrl = id => `${site}notes/${id}/`;

// Run app.js against a minimal DOM and hand it notes.json, as the browser would.
function element() {
  return { innerHTML: "", value: "", children: [], attributes: {}, addEventListener() {}, setAttribute(k, v) { this.attributes[k] = v; },
    replaceChildren() { this.children = []; }, append(c) { this.children.push(c); }, getAttribute(k) { return this.attributes[k] ?? null; } };
}
const view = element();
const nodes = { "#view": view, "#search": element(), "#filters": element(), "#sidebar-random": element(), "#explore-toggle": element() };
const context = {
  document: { querySelector: s => nodes[s], createElement: element, getElementById: () => null, addEventListener() {}, activeElement: null },
  window: { matchMedia: () => ({ matches: false }), addEventListener() {}, scrollTo() {} },
  location: { hash: "#static-build" }, navigator: {}, console, Math, Error,
  fetch: async () => ({ ok: true, json: async () => notes }),
};
vm.runInNewContext(fs.readFileSync(path.join(root, "app.js"), "utf8"), context, { filename: "app.js", timeout: 5000 });
await new Promise(resolve => setImmediate(resolve));

// Interactive controls become plain links; site hash links become page links.
function staticArticle(note) {
  context.article(note);
  return view.innerHTML
    .replace(/<button type="button" data-jump="([^"]+)">([\s\S]*?)<\/button>/g, '<a href="#$1">$2</a>')
    .replace(/<button type="button" data-random>[\s\S]*?<\/button>/g, "")
    .replace(/<button type="button" data-copy="[^"]+">[\s\S]*?<\/button>/g,
      `<a href="https://raw.githubusercontent.com/belorin/belorin.github.io/main/wiki/${note.id}.md">원문 Markdown</a><a href="/#${note.id}">탐색 화면에서 보기</a>`)
    .replace(/href="#all"/g, 'href="/notes/"')
    .replace(/href="#about"/g, 'href="/#about"')
    .replace(/href="#([a-z0-9-]+)"/g, (match, id) => ids.has(id) ? `href="/notes/${id}/"` : match);
}

function page({ title, description, canonical, body, jsonLd, type = "article" }) {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${esc(siteName)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="ko_KR">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='85'%3E✳%3C/text%3E%3C/svg%3E">
  <link rel="stylesheet" href="/style.css?v=${esc(cssVersion)}">
${jsonLd ? `  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>\n` : ""}</head>
<body>
  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="/" aria-label="열린 노트 첫 화면">belorin <span>열린 노트</span></a>
      <nav class="top-nav" aria-label="주 메뉴">
        <a href="/notes/">전체 문서</a>
        <a href="/#about">소개</a>
        <a href="https://github.com/belorin/belorin.github.io" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
      </nav>
    </div>
  </header>
  <main class="layout static-layout">
    <section class="main-view">
${body}
    </section>
  </main>
  <footer class="site-footer">
    <span>belorin / 열린 노트</span>
    <a href="https://github.com/belorin/belorin.github.io">원고와 편집 이력 ↗</a>
  </footer>
</body>
</html>
`;
}

const write = (rel, text) => {
  const file = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
};

for (const note of notes) {
  const body = staticArticle(note);
  const isFiction = note.kind === "fiction";
  const html = page({
    title: `${note.title} · ${siteName}`,
    description: note.summary,
    canonical: pageUrl(note.id),
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": isFiction ? "CreativeWork" : "Article",
      headline: note.title,
      description: note.summary,
      dateModified: note.updated,
      inLanguage: "ko",
      url: pageUrl(note.id),
      author: { "@type": "Person", name: "belorin" },
      isPartOf: { "@type": "WebSite", name: siteName, url: site },
      ...(note.tags?.length ? { keywords: note.tags.join(", ") } : {}),
    },
  });
  assert.ok(html.includes(`<h1>${esc(note.title)}</h1>`), note.id + ": title missing");
  assert.ok(!/data-(jump|copy|random)/.test(html), note.id + ": interactive control left in static page");
  assert.ok(![...html.matchAll(/href="#([a-z0-9-]+)"/g)].some(m => ids.has(m[1])), note.id + ": hash link to a note left");
  write(`notes/${note.id}/index.html`, html);
}

// All documents, grouped like the site: knowledge categories, then 소설, then 종합.
const rank = c => c === "종합" ? 2 : c === "소설" ? 1 : 0;
const listed = notes.filter(n => n.fiction_part !== "chapter");
const groups = [...new Set(listed.map(n => n.category))]
  .map(c => [c, listed.filter(n => n.category === c)])
  .sort(([a, x], [b, y]) => rank(a) - rank(b) || y.length - x.length || a.localeCompare(b, "ko"));
const indexBody = `<div class="page-heading"><h1>전체 문서</h1><p>${listed.filter(n => n.kind !== "synthesis").length}개 문서${listed.some(n => n.kind === "synthesis") ? ` · 종합 ${listed.filter(n => n.kind === "synthesis").length}편` : ""}. <a href="/">탐색 화면</a>에서 검색과 주제별 보기를 쓸 수 있습니다.</p></div>
${groups.map(([c, list]) => `<section><div class="section-heading"><h2>${esc(c)} (${list.length})</h2></div>
${list.map(n => `<div class="list-item"><h2><a href="/notes/${n.id}/">${esc(n.title)}</a></h2><p>${esc(n.summary)}</p></div>`).join("\n")}
</section>`).join("\n")}`;
write("notes/index.html", page({
  title: `전체 문서 · ${siteName}`,
  description: "음악, 철학, AI와 사회, 역사, 문학과 소설까지 대화에서 시작해 계속 고쳐 쓰는 공개 위키의 전체 문서 목록.",
  canonical: `${site}notes/`, body: indexBody, type: "website",
  jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", name: `전체 문서 · ${siteName}`, url: `${site}notes/`, inLanguage: "ko" },
}));

const latest = notes.map(n => n.updated).sort().at(-1);
const urls = [
  { loc: site, lastmod: latest },
  { loc: `${site}notes/`, lastmod: latest },
  ...notes.map(n => ({ loc: pageUrl(n.id), lastmod: n.updated })),
];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n")}
</urlset>
`);
console.log(`Static pages: ${notes.length} notes + index, sitemap with ${urls.length} URLs → ${path.relative(root, outDir) || "."}`);
