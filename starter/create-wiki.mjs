#!/usr/bin/env node
/**
 * Create a new wiki repository from the basic wiki (starter/base) and,
 * optionally, one or more purpose presets layered on top (starter/presets/<name>).
 *
 *   node starter/create-wiki.mjs --list
 *   node starter/create-wiki.mjs --out ../my-wiki --owner alice
 *   node starter/create-wiki.mjs --out ../books --owner alice --repo books --preset reading
 *   node starter/create-wiki.mjs --out ../lab --owner alice --repo lab --preset research,timeline --name "연구 노트"
 *
 * Options:
 *   --out <dir>        target folder (must be empty or missing; --force to allow non-empty)
 *   --owner <id>       GitHub user or organisation
 *   --repo <name>      repository name (default <owner>.github.io)
 *   --preset <a,b>     presets applied in order (default: none, the basic wiki)
 *   --name <text>      site name (overrides the preset's)
 *   --author <text>    author shown in page metadata (default owner)
 *   --url <https://…/> site address if not the default GitHub Pages one
 *   --no-build         skip generating notes.json and the AI index
 *
 * A preset is a folder with preset.json and an optional files/ tree copied over
 * the base. preset.json may hold:
 *   label, description          shown by --list
 *   config                      merged into site.config.json (objects merge, arrays and
 *                               values replace, null deletes a key)
 *   removeDocuments             ids of earlier documents to drop (their files too)
 *   documents                   manifest entries added, or replacing the same id
 *   relations, calendar         entries appended to wiki/relations.json, wiki/calendar.json
 * In copied Markdown and JSON (not templates/ or scripts/), {{name}}, {{owner}},
 * {{repo}}, {{url}}, {{description}}, {{author}} and {{today}} are filled in.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.join(here, "base");
const presetsDir = path.join(here, "presets");
const fail = message => { console.error("create-wiki: " + message); process.exit(1); };
const readJson = file => JSON.parse(fs.readFileSync(file, "utf8"));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");

const args = process.argv.slice(2);
const opt = {};
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (!a.startsWith("--")) fail("unexpected argument " + a);
  const key = a.slice(2);
  if (["list", "force", "no-build"].includes(key)) opt[key] = true;
  else if (i + 1 < args.length) opt[key] = args[++i];
  else fail(a + " needs a value");
}

const presetNames = fs.existsSync(presetsDir) ? fs.readdirSync(presetsDir).filter(n => fs.existsSync(path.join(presetsDir, n, "preset.json"))).sort() : [];
if (opt.list) {
  console.log("기본형(base): 프리셋 없이 만들면 기본형 위키가 된다.\n\n프리셋:");
  for (const n of presetNames) {
    const p = readJson(path.join(presetsDir, n, "preset.json"));
    console.log(`  ${n.padEnd(14)} ${p.label}${p.description ? " — " + p.description : ""}`);
  }
  process.exit(0);
}
if (!opt.out) fail("--out is required (see --list and the header of this file)");
if (!opt.owner || !/^[A-Za-z0-9-]+$/.test(opt.owner)) fail("--owner <GitHub id> is required");
const repo = opt.repo || opt.owner.toLowerCase() + ".github.io";
const presets = (opt.preset || "").split(",").map(s => s.trim()).filter(Boolean);
for (const n of presets) if (!presetNames.includes(n)) fail("unknown preset " + n + " (available: " + presetNames.join(", ") + ")");
const out = path.resolve(opt.out);
if (fs.existsSync(out) && fs.readdirSync(out).length && !opt.force) fail(out + " is not empty (use --force to write into it)");

// Objects merge, arrays and values replace, null deletes.
function merge(target, source) {
  for (const [k, v] of Object.entries(source ?? {})) {
    if (v === null) delete target[k];
    else if (v && typeof v === "object" && !Array.isArray(v) && target[k] && typeof target[k] === "object" && !Array.isArray(target[k])) merge(target[k], v);
    else target[k] = structuredClone(v);
  }
  return target;
}

// 1. Copy the basic wiki, then each preset's files over it.
fs.mkdirSync(out, { recursive: true });
fs.cpSync(baseDir, out, { recursive: true });
for (const generated of ["notes.json", "index.html", "robots.txt", "AI_INDEX.md", "llms.txt", "ai", "_site"]) {
  fs.rmSync(path.join(out, generated), { recursive: true, force: true });
}
const config = readJson(path.join(out, "site.config.json"));
const manifest = readJson(path.join(out, "wiki/manifest.json"));
const relations = readJson(path.join(out, "wiki/relations.json"));
const calendar = readJson(path.join(out, "wiki/calendar.json"));
for (const n of presets) {
  const dir = path.join(presetsDir, n);
  const p = readJson(path.join(dir, "preset.json"));
  if (fs.existsSync(path.join(dir, "files"))) fs.cpSync(path.join(dir, "files"), out, { recursive: true });
  merge(config, p.config);
  for (const id of p.removeDocuments ?? []) {
    const doc = manifest.documents.find(d => d.id === id);
    if (doc) fs.rmSync(path.join(out, doc.path), { force: true });
    manifest.documents = manifest.documents.filter(d => d.id !== id);
    relations.relations = relations.relations.filter(r => r.from !== id && r.to !== id);
    calendar.entries = calendar.entries.filter(e => e.doc !== id);
  }
  for (const doc of p.documents ?? []) {
    const at = manifest.documents.findIndex(d => d.id === doc.id);
    if (at >= 0) manifest.documents[at] = doc; else manifest.documents.push(doc);
  }
  relations.relations.push(...(p.relations ?? []));
  calendar.entries.push(...(p.calendar ?? []));
}

// A preset may replace a document's text without restating its manifest entry:
// the title always follows the file's "# heading".
for (const doc of manifest.documents) {
  const file = path.join(out, doc.path);
  if (!fs.existsSync(file)) fail("preset document missing: " + doc.path);
  const heading = fs.readFileSync(file, "utf8").match(/^# (.+)$/m);
  if (heading) doc.title = heading[1].trim();
}

// 2. Settings from the command line win over the presets.
config.owner = opt.owner;
config.repo = repo;
if (opt.name) { config.name = opt.name; config.brand = opt.name; }
config.author = opt.author || (config.author === "your-github-id" ? opt.owner : config.author);
if (opt.url) config.url = opt.url.endsWith("/") ? opt.url : opt.url + "/";
else delete config.url;
config.preset = presets.length ? presets.join(",") : "base";
const url = config.url || (repo.toLowerCase() === opt.owner.toLowerCase() + ".github.io"
  ? `https://${opt.owner.toLowerCase()}.github.io/` : `https://${opt.owner.toLowerCase()}.github.io/${repo}/`);

writeJson(path.join(out, "site.config.json"), config);
writeJson(path.join(out, "wiki/manifest.json"), manifest);
writeJson(path.join(out, "wiki/relations.json"), relations);
writeJson(path.join(out, "wiki/calendar.json"), calendar);

// 3. Fill placeholders in prose and data (templates keep {{title}}/{{date}} for new-doc.mjs).
const values = { name: config.name, owner: opt.owner, repo, url, description: config.description, author: config.author,
  today: new Date().toISOString().slice(0, 10) };
const jsonSafe = s => JSON.stringify(s).slice(1, -1);
function fill(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    const rel = path.relative(out, file);
    if (entry.isDirectory()) {
      if (![".git", "templates", "scripts", "node_modules"].includes(entry.name)) fill(file);
    } else if (/\.(md|json)$/.test(entry.name)) {
      const isJson = entry.name.endsWith(".json");
      const text = fs.readFileSync(file, "utf8");
      const next = text.replace(/\{\{(name|owner|repo|url|description|author|today)\}\}/g,
        (_m, k) => isJson ? jsonSafe(values[k]) : values[k]);
      if (next !== text) fs.writeFileSync(file, next);
      if (/\{\{(name|owner|repo|url|description|author|today)\}\}/.test(next)) fail("unfilled placeholder in " + rel);
    }
  }
}
fill(out);

// 4. Generate the site data so the new repository is ready to push.
if (!opt["no-build"]) {
  execFileSync(process.execPath, ["scripts/build.mjs"], { cwd: out, stdio: "inherit" });
  execFileSync(process.execPath, ["scripts/build.mjs", "--check"], { cwd: out, stdio: "inherit" });
}
console.log(`
만들었습니다: ${out}
  형태: ${config.preset} · 이름: ${config.name} · 주소: ${url}

다음 단계:
  1. GitHub에 빈 저장소 ${opt.owner}/${repo} 를 만든다.
  2. cd "${out}" && git init -b main && git add -A && git commit -m "init wiki" &&
     git remote add origin https://github.com/${opt.owner}/${repo}.git && git push -u origin main
  3. 저장소 Settings → Pages → Source를 "GitHub Actions"로 바꾼다.
`);
