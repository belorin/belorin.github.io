// Shared site settings: everything that names this particular wiki lives in
// site.config.json and is read here, so the scripts and the viewer carry no
// hard-coded owner, repository, address or title.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

export const root = process.cwd();
export const readJson = rel => JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
export const esc = value => String(value ?? "").replace(/[&<>"']/g, c =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const fail = message => { throw new Error(message); };

export function loadConfig() {
  const c = readJson("site.config.json");
  for (const key of ["owner", "repo", "name"]) {
    if (typeof c[key] !== "string" || !c[key].trim()) fail("site.config.json: " + key + " is required");
  }
  if (!/^[A-Za-z0-9-]+$/.test(c.owner) || !/^[A-Za-z0-9._-]+$/.test(c.repo)) fail("site.config.json: invalid owner/repo");
  c.branch ||= "main";
  c.lang ||= "ko";
  // A user site (<owner>.github.io) lives at the root; a project site under /<repo>/.
  c.url ||= c.repo.toLowerCase() === c.owner.toLowerCase() + ".github.io"
    ? `https://${c.owner.toLowerCase()}.github.io/`
    : `https://${c.owner.toLowerCase()}.github.io/${c.repo}/`;
  if (!/^https:\/\/[^\s"'<>]+\/$/.test(c.url)) fail("site.config.json: url must be https and end with /");
  c.basePath = new URL(c.url).pathname;
  c.brand ||= c.name;
  c.description ||= c.name;
  c.author ||= c.owner;
  c.icon ||= "✳";
  c.categories ||= [];
  c.features ||= {};
  c.repoUrl = `https://github.com/${c.owner}/${c.repo}`;
  c.rawUrl = `https://raw.githubusercontent.com/${c.owner}/${c.repo}/${c.branch}/`;
  return c;
}

// The part of the settings the browser needs; build-notes.mjs puts it in notes.json.
export function publicSite(c) {
  return {
    name: c.name, brand: c.brand, url: c.url, repo: c.owner + "/" + c.repo, branch: c.branch,
    categories: c.categories, home: c.home || {}, about: c.about || {},
    calendar: c.features.calendar === true, comments: c.features.comments || null,
  };
}

// Short content hash for ?v= cache busting, so a changed file is never served stale.
export function version(...files) {
  const hash = crypto.createHash("sha256");
  for (const f of files) if (fs.existsSync(path.join(root, f))) hash.update(fs.readFileSync(path.join(root, f)));
  return hash.digest("hex").slice(0, 10);
}

export const iconHref = c =>
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='85'%3E" +
  encodeURIComponent(c.icon) + "%3C/text%3E%3C/svg%3E";

// Optional accent colours from site.config.json "theme".
export function themeStyle(c) {
  const t = c.theme || {};
  const vars = Object.entries({ "--accent": t.accent, "--light": t.light, "--bg": t.background })
    .filter(([, v]) => typeof v === "string" && /^#[0-9a-fA-F]{3,8}$/.test(v));
  return vars.length ? `  <style>:root{${vars.map(([k, v]) => k + ":" + v).join(";")}}</style>\n` : "";
}

// Header and footer shared by index.html and the static pages. `home` is the
// link prefix: "" for index.html (hash links) or the base path for /notes/ pages.
export function header(c, { home = "", allHref = "#all", aboutHref = "#about" } = {}) {
  const brandSub = c.brandSub ? ` <span>${esc(c.brandSub)}</span>` : "";
  return `  <header class="site-header">
    <div class="header-inner">
      <a class="brand" href="${home || "#"}" aria-label="${esc(c.name)} 첫 화면">${esc(c.brand)}${brandSub}</a>
      <nav class="top-nav" aria-label="주 메뉴">
        <a href="${allHref}">전체 문서</a>
        <a href="${aboutHref}">소개</a>
        <a href="${c.repoUrl}" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
      </nav>
    </div>
  </header>`;
}
export function footer(c) {
  return `  <footer class="site-footer">
    <span>${esc(c.footer || c.name)}</span>
    <a href="${c.repoUrl}">원고와 편집 이력 ↗</a>
  </footer>`;
}
