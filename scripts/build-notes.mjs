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
const seenIds = new Set(), seenPaths = new Set();
for (const entry of entries) {
  requireString(entry, "id", entry.id || "unknown");
  requireString(entry, "path", entry.id);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(entry.id)) fail("invalid id: " + entry.id);
  if (seenIds.has(entry.id) || seenPaths.has(entry.path)) fail("duplicate id or path: " + entry.id);
  seenIds.add(entry.id); seenPaths.add(entry.path);
}
// Special kinds have their own reserved category and rules:
// - synthesis (SYNTHESIS.md): an editorial interpretation woven from articles;
//   never the basis of another document.
// - fiction (FICTION.md): a work, or one chapter of a work, kept as fiction.
const SYNTHESIS_TYPES = new Set(["cross", "concept", "critique"]);
const RESERVED = { synthesis: "종합", fiction: "소설" };
const KIND_FIELDS = { synthesis: ["synthesis_type", "based_on"], fiction: ["fiction_part", "work", "chapter", "revised"] };
const byEntryId = new Map(entries.map(e => [e.id, e]));
const kinds = new Map(entries.map(e => [e.id, e.kind]));
const chapterNumbers = new Map();
for (const entry of entries) {
  const text = fs.readFileSync(path.resolve(root, entry.path), "utf8");
  checkOriginalBlocks(entry.id, text);
  for (const [kind, category] of Object.entries(RESERVED)) {
    if (entry.category === category && entry.kind !== kind) fail(entry.id + ": category " + category + " is reserved for kind " + kind);
    if (entry.kind !== kind && KIND_FIELDS[kind].some(f => entry[f] !== undefined)) fail(entry.id + ": " + KIND_FIELDS[kind].join("/") + " require kind " + kind);
  }
  if (entry.kind === undefined) continue;
  if (!RESERVED[entry.kind]) fail(entry.id + ": unknown kind " + entry.kind);
  if (entry.category !== RESERVED[entry.kind]) fail(entry.id + ": " + entry.kind + " must use category " + RESERVED[entry.kind]);
  if (entry.kind === "fiction") {
    if (entry.revised !== undefined && typeof entry.revised !== "boolean") fail(entry.id + ": revised must be true or false");
    if (entry.fiction_part === "work") {
      if (entry.work !== undefined || entry.chapter !== undefined) fail(entry.id + ": a work has no work/chapter fields");
    } else if (entry.fiction_part === "chapter") {
      const work = byEntryId.get(entry.work);
      if (!work || work.kind !== "fiction" || work.fiction_part !== "work") fail(entry.id + ": work must be the id of a fiction work");
      if (!Number.isInteger(entry.chapter) || entry.chapter < 1) fail(entry.id + ": chapter must be a positive integer");
      const key = entry.work + "#" + entry.chapter;
      if (chapterNumbers.has(key)) fail(entry.id + ": duplicate chapter " + entry.chapter + " of " + entry.work);
      chapterNumbers.set(key, entry.id);
      const workText = fs.readFileSync(path.resolve(root, work.path), "utf8");
      if (!workText.includes("](./" + entry.id + ".md)")) fail(entry.work + ": work must link its chapter ./" + entry.id + ".md");
    } else fail(entry.id + ": fiction_part must be work or chapter");
    continue;
  }
  if (!SYNTHESIS_TYPES.has(entry.synthesis_type)) fail(entry.id + ": synthesis_type must be cross, concept or critique");
  const basis = entry.based_on;
  if (!Array.isArray(basis) || basis.length < (entry.synthesis_type === "critique" ? 1 : 2)) fail(entry.id + ": based_on needs " + (entry.synthesis_type === "critique" ? "1+" : "2+") + " document ids");
  if (new Set(basis).size !== basis.length) fail(entry.id + ": duplicate based_on id");
  for (const id of basis) {
    if (!kinds.has(id)) fail(entry.id + ": based_on unknown id " + id);
    if (kinds.get(id) === "synthesis") fail(entry.id + ": based_on must not cite another synthesis (" + id + ")");
    if (kinds.get(id) === "fiction" && entry.synthesis_type !== "critique") fail(entry.id + ": fiction can be the basis only of a critique (" + id + ")");
    if (!text.includes("](./" + id + ".md)")) fail(entry.id + ": body must link its basis ./" + id + ".md");
  }
}
// A revised passage keeps its original in a folded block (FICTION.md):
//   :::원본  ...original text...  :::
// Blocks must open and close cleanly. Headings inside are allowed; the site's
// table of contents, the map cards and the ledger checks skip them.
function checkOriginalBlocks(id, text) {
  let open = false;
  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const value = line.trim();
    if (/^:::\s*원본(?:\s|$)/.test(value)) {
      if (open) fail(id + ": nested :::원본 block");
      open = true;
    } else if (value === ":::") {
      if (!open) fail(id + ": ::: without an opening :::원본");
      open = false;
    }
  }
  if (open) fail(id + ": unclosed :::원본 block");
}
// order only sorts the site data; parallel editors may pick the same number,
// so ties keep manifest order instead of failing the build.
const published = entries.filter(e => e.publish === true).sort((a,b)=>(a.order ?? 1e9)-(b.order ?? 1e9));
const publishedIds = new Set(published.map(e=>e.id));
const required = ["id","title","category","status","updated","summary","source"];
const notes = published.map(entry => {
  for (const field of required) requireString(entry, field, entry.id);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.updated)) fail(entry.id + ": bad updated date");
  if (!Array.isArray(entry.tags) || !entry.tags.every(x=>typeof x==="string")) fail(entry.id + ": invalid tags");
  if (!Array.isArray(entry.related) || !entry.related.every(x=>typeof x==="string" && publishedIds.has(x))) fail(entry.id + ": missing related id");
  if (entry.order !== undefined && !Number.isInteger(entry.order)) fail(entry.id + ": order must be an integer");
  return {
    id:entry.id, title:entry.title, category:entry.category, status:entry.status,
    updated:entry.updated, summary:entry.summary, tags:entry.tags,
    source:entry.source, related:entry.related,
    ...(entry.kind === "synthesis" ? {kind:entry.kind, synthesis_type:entry.synthesis_type, based_on:entry.based_on} : {}),
    ...(entry.kind === "fiction" ? {kind:entry.kind, fiction_part:entry.fiction_part,
      ...(entry.fiction_part === "chapter" ? {work:entry.work, chapter:entry.chapter} : {}),
      ...(entry.revised ? {revised:true} : {})} : {}),
    body:readBody(entry)
  };
});
for (const note of notes) {
  for (const id of note.based_on ?? []) {
    if (!publishedIds.has(id)) fail(note.id + ": published synthesis cites unpublished basis " + id);
  }
  if (note.work && !publishedIds.has(note.work)) fail(note.id + ": published chapter of an unpublished work " + note.work);
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
