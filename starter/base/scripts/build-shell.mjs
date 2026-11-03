#!/usr/bin/env node
/**
 * Generate index.html (the page shell the viewer draws into) and robots.txt
 * from site.config.json. Change the config, not these files.
 *
 *   node scripts/build-shell.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { esc, fail, footer, header, iconHref, loadConfig, root, themeStyle, version } from "./lib/site.mjs";

const c = loadConfig();
const v = version("style.css", "app.js", "calendar.js");
const raw = c.rawUrl + "wiki/";
const verify = c.verification || {};
const sidebarLinks = [
  ...(c.sidebarLinks || []),
  ...(c.features.calendar ? [{ href: "#calendar", label: "▦ 달력" }] : []),
].map(l => `          <a href="${esc(l.href)}">${esc(l.label)}</a>`).join("\n");

const index = `<!doctype html>
<html lang="${esc(c.lang)}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${esc(c.description)}">
  <title>${esc(c.name)}</title>
  <link rel="icon" href="${iconHref(c)}">
  <link rel="alternate" type="text/plain" href="llms.txt" title="AI·LLM용 문서 목록">
  <link rel="canonical" href="${c.url}">
${verify.google ? `  <meta name="google-site-verification" content="${esc(verify.google)}">\n` : ""}${verify.naver ? `  <meta name="naver-site-verification" content="${esc(verify.naver)}">\n` : ""}  <link rel="stylesheet" href="style.css?v=${v}">
${themeStyle(c)}</head>
<body>
${header(c)}
  <main class="layout">
    <aside class="sidebar" aria-label="문서 탐색">
      <button id="explore-toggle" class="explore-toggle" type="button" aria-expanded="true" aria-controls="explore-panel">검색 · 주제 <span aria-hidden="true">⌃</span></button>
      <div id="explore-panel" class="sidebar-inner">
        <label for="search">문서 검색</label>
        <input id="search" type="search" placeholder="제목, 본문, 키워드" autocomplete="off" aria-label="문서 검색">
        <div class="sidebar-section-label">주제</div>
        <div id="filters" class="filters" aria-label="주제 필터"></div>
        <div class="sidebar-actions">
          <button id="sidebar-random" type="button" class="subtle-button">↝ 무작위 문서</button>
${sidebarLinks}
        </div>
        <p class="sidebar-tip">검색 단축키 <kbd>/</kbd></p>
      </div>
    </aside>
    <section id="view" class="main-view" aria-live="polite" aria-busy="true">
      <p class="muted">문서를 불러오는 중입니다.</p>
      <div class="llm-note">
        <p><strong>AI·LLM 안내:</strong> 이 사이트는 자바스크립트로 본문을 그리므로 이 HTML에는 본문이 없습니다. 주소의 <code>#</code> 뒤가 문서 ID이며, 본문이 들어 있는 문서 페이지는 <code>${c.url}notes/&lt;문서-id&gt;/</code>, 원문 Markdown은 <code>${raw}&lt;문서-id&gt;.md</code>입니다. 전체 목록은 <a href="${c.url}llms.txt">${c.url}llms.txt</a>에 있습니다.</p>
        <p lang="en"><strong>For AI assistants:</strong> this page renders articles with JavaScript, so this HTML contains no article text. The part after <code>#</code> is the document ID; a static page with the article is at <code>${c.url}notes/&lt;document-id&gt;/</code> and the Markdown source at <code>${raw}&lt;document-id&gt;.md</code>. The full list is at <a href="${c.url}llms.txt">${c.url}llms.txt</a>.</p>
      </div>
    </section>
  </main>
${footer(c)}
  <script src="app.js?v=${v}" defer></script>
${c.features.calendar ? `  <script src="calendar.js?v=${v}" defer></script>\n` : ""}</body>
</html>
`;

const robots = `# 모든 방문자와 도구(LLM 열람 포함)는 전체에 접근할 수 있다.
User-agent: *
Allow: /

# 검색엔진은 문서 페이지(notes/)를 색인하고, 편집용 파일과 원본 데이터는
# 검색 결과에 싣지 않는다. 접근을 막는 규칙이 아니다.
User-agent: Googlebot
User-agent: Bingbot
User-agent: Yeti
User-agent: Daumoa
${["wiki/", "ai/", "scripts/", "templates/", "notes.json", "AI_INDEX.md"].map(p => "Disallow: " + c.basePath + p).join("\n")}

Sitemap: ${c.url}sitemap.xml
`;

let changed = 0;
for (const [file, text] of [["index.html", index], ["robots.txt", robots]]) {
  const target = path.join(root, file);
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : null;
  if (current === text) continue;
  if (process.argv.includes("--check")) fail(file + " is out of date: run node scripts/build.mjs");
  fs.writeFileSync(target, text);
  changed++;
}
console.log("Shell: index.html and robots.txt " + (changed ? "updated" : "up to date"));
