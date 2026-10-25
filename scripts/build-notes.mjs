#!/usr/bin/env node
/**
 * Generate notes.json (website cache) from canonical Markdown articles.
 * No packages or network required. Do not manually edit notes.json.
 *
 * Usage:
 *   node scripts/build-notes.mjs         # update cache if changed
 *   node scripts/build-notes.mjs --check # verify cache is up to date
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const manifestPath = path.join(root, "wiki", "manifest.json");
const outputPath = path.join(root, "notes.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const entries = manifest.documents;

function fail(message) { throw Error(message); }
function requireString(obj, key, id) {
  if (typeof obj[key] !== "string") fail(id + ": invalid " + key);
}
function normalizeBody(text, alias) {
  // The simple website renderer supports site hash links, not filesystem paths.
  return text
    .replace(/\]\((?:\.\/|\.\.\/wiki\/)([a-z0-9-]+)\.md\)/g,
      (_match, id) => "](#" + (alias[id] ?? id) + ")")
    .replace(/\]\(https:\/\/belorin\.github\.io\/#([a-z0-9-]+)\)/g,
      (_match, id) => "](#" + id + ")");
}
function readBody(entry) {
  const fullPath = path.resolve(root, entry.path);
  const wikiRoot = path.resolve(root, "wiki") + path.sep;
  if (!fullPath.startsWith(wikiRoot) || !entry.path.endsWith(".md")) {
    fail(entry.id + ": unsafe or non-Markdown path");
  }
  const markdown = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");
  const heading = markdown.match(/^# ([^\n]+)\n\n/);
  if (!heading) fail(entry.id + ": expected a first-level heading and blank line");
  return normalizeBody(markdown.slice(heading[0].length).trimEnd(), manifest.linkAliases ?? {});
}
if (!Array.isArray(entries)) fail("manifest.documents must be an array");
const seenIds = new Set(), seenPaths = new Set(), orderSet = new Set();
for (const entry of entries) {
  requireString(entry, "id", entry.id || "unknown");
  requireString(entry, "path", entry.id);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) fail("invalid id: " + entry.id);
  if (seenIds.has(entry.id) || seenPaths.has(entry.path)) fail("duplicate id or path: " + entry.id);
  seenIds.add(entry.id); seenPaths.add(entry.path);
}
// Synthesis notes (SYNTHESIS.md) weave existing articles into an editorial
// interpretation. They are marked, kept in their own category and never serve
// as the basis of another document.
const SYNTHESIS_TYPES = new Set(["cross", "concept", "critique"]);
const kinds = new Map(entries.map(e => [e.id, e.kind]));
for (const entry of entries) {
  const body = () => fs.readFileSync(path.resolve(root, entry.path), "utf8");
  if (entry.kind === undefined) {
    if (entry.category === "종합") fail(entry.id + ": category 종합 is reserved for kind synthesis");
    if (entry.synthesis_type !== undefined || entry.based_on !== undefined) fail(entry.id + ": synthesis fields require kind synthesis");
    continue;
  }
  if (entry.kind !== "synthesis") fail(entry.id + ": unknown kind " + entry.kind);
  if (entry.category !== "종합") fail(entry.id + ": synthesis must use category 종합");
  if (!SYNTHESIS_TYPES.has(entry.synthesis_type)) fail(entry.id + ": synthesis_type must be cross, concept or critique");
  const basis = entry.based_on;
  if (!Array.isArray(basis) || basis.length < (entry.synthesis_type === "critique" ? 1 : 2)) fail(entry.id + ": based_on needs " + (entry.synthesis_type === "critique" ? "1+" : "2+") + " document ids");
  if (new Set(basis).size !== basis.length) fail(entry.id + ": duplicate based_on id");
  const text = body();
  for (const id of basis) {
    if (!kinds.has(id)) fail(entry.id + ": based_on unknown id " + id);
    if (kinds.get(id) === "synthesis") fail(entry.id + ": based_on must not cite another synthesis (" + id + ")");
    if (!text.includes("](./" + id + ".md)")) fail(entry.id + ": body must link its basis ./" + id + ".md");
  }
}
const published = entries.filter(e => e.publish === true).sort((a,b)=>a.order-b.order);
const publishedIds = new Set(published.map(e=>e.id));
const required = ["id","title","category","status","updated","summary","source"];
const notes = published.map(entry => {
  for (const field of required) requireString(entry, field, entry.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.updated)) fail(entry.id + ": bad updated date");
  if (!Array.isArray(entry.tags) || !entry.tags.every(x=>typeof x==="string")) fail(entry.id + ": invalid tags");
  if (!Array.isArray(entry.related) || !entry.related.every(x=>typeof x==="string" && publishedIds.has(x))) fail(entry.id + ": missing related id");
  if (!Number.isInteger(entry.order) || orderSet.has(entry.order)) fail(entry.id + ": invalid order");
  orderSet.add(entry.order);
  return {
    id:entry.id, title:entry.title, category:entry.category, status:entry.status,
    updated:entry.updated, summary:entry.summary, tags:entry.tags,
    source:entry.source, related:entry.related,
    ...(entry.kind ? {kind:entry.kind, synthesis_type:entry.synthesis_type, based_on:entry.based_on} : {}),
    body:readBody(entry)
  };
});
for (const note of notes) {
  for (const id of note.based_on ?? []) {
    if (!publishedIds.has(id)) fail(note.id + ": published synthesis cites unpublished basis " + id);
  }
  for (const match of note.body.matchAll(/\]\(#([a-z0-9-]+)\)/g)) {
    if (!publishedIds.has(match[1])) fail(note.id + ": broken site link #" + match[1]);
  }
}
const current = fs.existsSync(outputPath) ? JSON.parse(fs.readFileSync(outputPath,"utf8")) : null;
const equals = JSON.stringify(current) === JSON.stringify(notes);
if (process.argv.includes("--check")) {
  if (!equals) fail("notes.json is out of date: run node scripts/build-notes.mjs and commit the result");
  console.log("OK: " + notes.length + " published Markdown articles match notes.json");
} else if (!equals) {
  fs.writeFileSync(outputPath, JSON.stringify(notes,null,2) + "\n");
  console.log("Updated notes.json from " + notes.length + " Markdown articles");
} else {
  console.log("No changes: notes.json already matches " + notes.length + " Markdown articles");
}
