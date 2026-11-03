#!/usr/bin/env node
/**
 * Generate notes.json (the website's data) from the canonical Markdown articles
 * and wiki/manifest.json, plus the public part of site.config.json.
 * Do not edit notes.json by hand.
 *
 *   node scripts/build-notes.mjs          # update notes.json if changed
 *   node scripts/build-notes.mjs --check  # fail if notes.json is stale
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fail, loadConfig, publicSite, readJson, root } from "./lib/site.mjs";

const config = loadConfig();
const manifest = readJson("wiki/manifest.json");
const entries = manifest.documents;
const outputPath = path.join(root, "notes.json");
const requireString = (obj, key, id) => { if (typeof obj[key] !== "string") fail(id + ": invalid " + key); };
const siteLink = new RegExp("\\]\\(" + config.url.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&") + "#([a-z0-9-]+)\\)", "g");

function normalizeBody(text, alias) {
  // The viewer understands site hash links, not file paths: ./id.md → #id.
  return text
    .replace(/\]\((?:\.\/|\.\.\/wiki\/)([a-z0-9-]+)\.md\)/g, (_m, id) => "](#" + (alias[id] ?? id) + ")")
    .replace(siteLink, (_m, id) => "](#" + id + ")");
}
function readBody(entry) {
  const fullPath = path.resolve(root, entry.path);
  if (!fullPath.startsWith(path.resolve(root, "wiki") + path.sep) || !entry.path.endsWith(".md")) fail(entry.id + ": unsafe or non-Markdown path");
  const markdown = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");
  const heading = markdown.match(/^# ([^\n]+)\n\n/);
  if (!heading) fail(entry.id + ": the file must start with '# 제목' and a blank line");
  return normalizeBody(markdown.slice(heading[0].length).trimEnd(), manifest.linkAliases ?? {});
}

if (!Array.isArray(entries)) fail("manifest.documents must be an array");
const seen = new Set();
for (const entry of entries) {
  requireString(entry, "id", entry.id || "unknown");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) fail("invalid id: " + entry.id);
  if (entry.path !== "wiki/" + entry.id + ".md") fail(entry.id + ": path must be wiki/" + entry.id + ".md");
  if (seen.has(entry.id)) fail("duplicate id: " + entry.id);
  if (!fs.existsSync(path.join(root, entry.path))) fail(entry.id + ": missing " + entry.path);
  seen.add(entry.id);
}
// order only sorts; ties keep manifest order.
const published = entries.filter(e => e.publish === true).sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
const publishedIds = new Set(published.map(e => e.id));
const notes = published.map(entry => {
  for (const field of ["title", "category", "status", "updated", "summary"]) requireString(entry, field, entry.id);
  if (!entry.summary.trim()) fail(entry.id + ": a published document needs a summary");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.updated)) fail(entry.id + ": updated must be YYYY-MM-DD");
  if (!Array.isArray(entry.tags ?? []) || !(entry.tags ?? []).every(x => typeof x === "string")) fail(entry.id + ": invalid tags");
  if (!Array.isArray(entry.related ?? []) || !(entry.related ?? []).every(x => publishedIds.has(x))) fail(entry.id + ": related must list published ids");
  if (entry.order !== undefined && !Number.isInteger(entry.order)) fail(entry.id + ": order must be an integer");
  return {
    id: entry.id, title: entry.title, category: entry.category, status: entry.status,
    updated: entry.updated, summary: entry.summary, tags: entry.tags ?? [],
    source: entry.source ?? "", related: entry.related ?? [], body: readBody(entry),
  };
});
for (const note of notes) {
  for (const m of note.body.matchAll(/\]\(#([a-z0-9-]+)\)/g)) {
    if (!publishedIds.has(m[1])) fail(note.id + ": broken link to #" + m[1] + " (missing or unpublished)");
  }
}
const data = { site: publicSite(config), notes };
const text = JSON.stringify(data, null, 2) + "\n";
const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
if (process.argv.includes("--check")) {
  if (current !== text) fail("notes.json is out of date: run node scripts/build.mjs");
  console.log("OK: notes.json matches " + notes.length + " published articles");
} else if (current !== text) {
  fs.writeFileSync(outputPath, text);
  console.log("Updated notes.json: " + notes.length + " published articles");
} else console.log("No changes: notes.json already matches " + notes.length + " articles");
