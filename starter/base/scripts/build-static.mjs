#!/usr/bin/env node
/**
 * Build crawlable static pages into a deploy directory (default _site):
 *   notes/<id>/index.html  one page per published note, article already rendered
 *   notes/index.html       every document, grouped by topic
 *   sitemap.xml
 * Articles are rendered by app.js's own article() in a sandbox, so the pages
 * match the interactive site. Output is deployed only, never committed.
 *
 *   node scripts/build-static.mjs [outDir]
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import vm from "node:vm";
import { esc, footer, header, iconHref, loadConfig, root, themeStyle, version } from "./lib/site.mjs";

const c = loadConfig();
const outDir = path.resolve(root, process.argv[2] || "_site");
const data = JSON.parse(fs.readFileSync(path.join(root, "notes.json"), "utf8"));
const notes = data.notes;
const ids = new Set(notes.map(n => n.id));
const base = c.basePath; // "/" for a user site, "/<repo>/" for a project site
const pageUrl = id => `${c.url}notes/${id}/`;

// Run app.js against a minimal DOM and hand it notes.json, as the browser would.
function element() {
  return { innerHTML: "", value: "", children: [], attributes: {}, addEventListener() {}, setAttribute(k, v) { this.attributes[k] = v; },
    replaceChildren() { this.children = []; }, append(x) { this.children.push(x); }, getAttribute(k) { return this.attributes[k] ?? null; } };
}
const view = element();
const nodes = { "#view": view, "#search": element(), "#filters": element(), "#sidebar-random": element(), "#explore-toggle": element() };
const context = {
  document: { querySelector: s => nodes[s], createElement: element, getElementById: () => null, addEventListener() {}, activeElement: null },
  window: { matchMedia: () => ({ matches: false }), addEventListener() {}, scrollTo() {} },
  location: { hash: "#static-build" }, navigator: {}, console, Math, Error,
  fetch: async () => ({ ok: true, json: async () => data }),
};
vm.runInNewContext(fs.readFileSync(path.join(root, "app.js"), "utf8"), context, { filename: "app.js", timeout: 5000 });
await new Promise(resolve => setImmediate(resolve));
const giscusAttributes = vm.runInContext("giscusAttributes", context);
const giscusScript = id => "<script " + Object.entries(giscusAttributes(id))
  .map(([name, value]) => name + '="' + esc(value) + '"').join(" ") + " async></script>";

// Interactive controls become plain links; site hash links become page links.
function staticArticle(note) {
  context.article(note);
  return view.innerHTML
    .replace(/<div class="giscus" data-term="([a-z0-9-]+)"><\/div>/, (_m, id) => '<div class="giscus">' + giscusScript(id) + "</div>")
    .replace(/<button type="button" data-jump="([^"]+)">([\s\S]*?)<\/button>/g, '<a href="#$1">$2</a>')
    .replace(/<button type="button" data-random>[\s\S]*?<\/button>/g, "")
    .replace(/<button type="button" data-copy="[^"]+">[\s\S]*?<\/button>/g,
      `<a href="${c.rawUrl}wiki/${note.id}.md">원문 Markdown</a><a href="${base}#${note.id}">탐색 화면에서 보기</a>`)
    .replace(/href="#all"/g, `href="${base}notes/"`)
    .replace(/href="#([a-z0-9-]+)"/g, (m, id) => ids.has(id) ? `href="${base}notes/${id}/"` : m);
}

const cssVersion = version("style.css", "app.js", "calendar.js");
function page({ title, description, canonical, body, jsonLd, type = "article" }) {
  return `<!doctype html>
<html lang="${esc(c.lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${esc(c.name)}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta name="twitter:card" content="summary">
  <link rel="icon" href="${iconHref(c)}">
  <link rel="stylesheet" href="${base}style.css?v=${cssVersion}">
${themeStyle(c)}${jsonLd ? `  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>\n` : ""}</head>
<body>
${header(c, { home: base, allHref: base + "notes/", aboutHref: base + "#about" })}
  <main class="layout static-layout">
    <section class="main-view">
${body}
    </section>
  </main>
${footer(c)}
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
  const html = page({
    title: `${note.title} · ${c.name}`, description: note.summary, canonical: pageUrl(note.id), body: staticArticle(note),
    jsonLd: {
      "@context": "https://schema.org", "@type": "Article", headline: note.title, description: note.summary,
      dateModified: note.updated, inLanguage: c.lang, url: pageUrl(note.id),
      author: { "@type": "Person", name: c.author }, isPartOf: { "@type": "WebSite", name: c.name, url: c.url },
      ...(note.tags?.length ? { keywords: note.tags.join(", ") } : {}),
    },
  });
  assert.ok(html.includes(`<h1>${esc(note.title)}</h1>`), note.id + ": title missing");
  assert.ok(!/data-(jump|copy|random)/.test(html), note.id + ": interactive control left in static page");
  assert.ok(![...html.matchAll(/href="#([a-z0-9-]+)"/g)].some(m => ids.has(m[1])), note.id + ": hash link to a note left");
  write(`notes/${note.id}/index.html`, html);
}

const order = c.categories;
const rank = name => order.includes(name) ? order.indexOf(name) : order.length;
const groups = [...new Set(notes.map(n => n.category))]
  .map(cat => [cat, notes.filter(n => n.category === cat)])
  .sort(([a, x], [b, y]) => rank(a) - rank(b) || y.length - x.length || a.localeCompare(b, "ko"));
const indexBody = `<div class="page-heading"><h1>전체 문서</h1><p>${notes.length}개 문서. <a href="${base}">탐색 화면</a>에서 검색과 주제별 보기를 쓸 수 있습니다.</p></div>
${groups.map(([cat, list]) => `<section><div class="section-heading"><h2>${esc(cat)} (${list.length})</h2></div>
${list.map(n => `<div class="list-item"><h2><a href="${base}notes/${n.id}/">${esc(n.title)}</a></h2><p>${esc(n.summary)}</p></div>`).join("\n")}
</section>`).join("\n")}`;
write("notes/index.html", page({
  title: `전체 문서 · ${c.name}`, description: c.description, canonical: `${c.url}notes/`, body: indexBody, type: "website",
  jsonLd: { "@context": "https://schema.org", "@type": "CollectionPage", name: `전체 문서 · ${c.name}`, url: `${c.url}notes/`, inLanguage: c.lang },
}));

const latest = notes.map(n => n.updated).sort().at(-1) || new Date().toISOString().slice(0, 10);
const urls = [{ loc: c.url, lastmod: latest }, { loc: `${c.url}notes/`, lastmod: latest },
  ...notes.map(n => ({ loc: pageUrl(n.id), lastmod: n.updated }))];
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n")}
</urlset>
`);
console.log(`Static pages: ${notes.length} notes + index, sitemap with ${urls.length} URLs → ${path.relative(root, outDir) || "."}`);
