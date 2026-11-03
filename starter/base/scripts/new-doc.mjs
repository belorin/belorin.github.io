#!/usr/bin/env node
/**
 * Start a new document from a template and register it in wiki/manifest.json.
 *
 *   node scripts/new-doc.mjs <type> <id> "<제목>" [--category 분류] [--publish]
 *   node scripts/new-doc.mjs --list
 *
 * Types are defined in site.config.json "types" ({label, template, category,
 * status}). The new document starts unpublished (publish:false) unless --publish
 * is given; fill in the summary in the manifest before publishing.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fail, loadConfig, readJson, root } from "./lib/site.mjs";

const c = loadConfig();
const types = c.types || {};
const args = process.argv.slice(2);
const option = name => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
if (args.includes("--list") || !args.length) {
  console.log("문서 유형 (site.config.json types):");
  for (const [key, t] of Object.entries(types)) console.log(`  ${key.padEnd(12)} ${t.label || ""} → ${t.template} [${t.category || "-"}]`);
  process.exit(0);
}
const publish = args.includes("--publish");
const category = option("--category");
const [type, id, title] = args.filter(a => a !== "--publish");
const t = types[type] || fail("unknown type " + type + " (see --list)");
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || "")) fail("id must be lowercase letters, digits and hyphens: " + id);
if (!title) fail("a title is required");
const manifest = readJson("wiki/manifest.json");
if (manifest.documents.some(d => d.id === id)) fail("id already exists: " + id);
const file = path.join(root, "wiki", id + ".md");
if (fs.existsSync(file)) fail("file already exists: wiki/" + id + ".md");
const today = new Date().toISOString().slice(0, 10);
const body = fs.readFileSync(path.join(root, t.template), "utf8")
  .replace(/\{\{title\}\}/g, title).replace(/\{\{date\}\}/g, today);
fs.writeFileSync(file, body);
const order = Math.max(-1, ...manifest.documents.map(d => d.order ?? -1)) + 1;
manifest.documents.push({
  path: "wiki/" + id + ".md", publish, order, id, title,
  category: category || t.category || c.categories[0] || "미분류", status: t.status || "초고",
  updated: today, summary: "", tags: [], source: "", related: [], aliases: [], review_state: "unassessed",
});
fs.writeFileSync(path.join(root, "wiki/manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Created wiki/${id}.md (${t.label || type}) and registered it${publish ? "" : " as unpublished"}.`);
console.log("Next: write the body, fill \"summary\" in wiki/manifest.json, set publish:true, run node scripts/build.mjs.");
