#!/usr/bin/env node
/**
 * Validate the public, transcript-free ingestion ledger.
 *
 * Usage:
 *   node scripts/validate-editorial.mjs
 *   node scripts/validate-editorial.mjs --report
 *
 * The ledger is structural provenance only. It must NOT store raw chats,
 * quotations, private chat URLs, or the provider's conversation IDs.
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const editorialDir = path.join(root, "editorial", "ingestions");
const indexFile = path.join(editorialDir, "index.json");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "wiki", "manifest.json"), "utf8"));
const index = JSON.parse(fs.readFileSync(indexFile, "utf8"));
const docs = new Map(manifest.documents.map(d => [d.id, d]));
const coverageKinds = new Set(["visible-complete", "visible-partial", "uncertain"]);
const knowledgeKinds = new Set(["concept", "fact", "argument", "counterargument", "example", "curation", "question", "other"]);
const statuses = new Set(["integrated", "pending"]);
const headings = new Map();
const fail = message => { throw new Error(message); };

function exactFields(obj, allowed, label) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) fail(label + ": must be object");
  for (const field of Object.keys(obj)) {
    if (!allowed.includes(field)) fail(label + ": unexpected field " + field + " (raw conversation fields prohibited)");
  }
}
function boundedString(value, label, max = 180) {
  if (typeof value !== "string" || !value.trim() || value.length > max ||
      (/[\r\n\u0000-\u001f]/.test(value) || /(?:https?:\/\/|chatgpt\.com\/share\/)/i.test(value))) fail(label + ": expected a nonempty single-line public-safe string without URLs <= " + max);
}
function date(value, label) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      Number.isNaN(Date.parse(value + "T00:00:00Z")) ||
      new Date(value + "T00:00:00Z").toISOString().slice(0,10) !== value) fail(label + ": invalid date");
}
function actualHeadings(doc) {
  if (headings.has(doc.id)) return headings.get(doc.id);
  const full = path.resolve(root, doc.path);
  const parent = path.resolve(root, "wiki") + path.sep;
  if (!full.startsWith(parent) || !doc.path.endsWith(".md")) fail(doc.id + ": invalid document path");
  const source = fs.readFileSync(full, "utf8");
  const found = Array.from(source.matchAll(/^#{1,6}[ \t]+(.+?)[ \t]*$/gm), m => m[1].trim());
  headings.set(doc.id, found);
  return found;
}
exactFields(index, ["version", "description", "batches"], "index");
if (index.version !== 1 || !Array.isArray(index.batches)) fail("index: invalid version/batches");
const seenBatches = new Set(), pending = [];
let itemCount = 0, integratedCount = 0, withheldCount = 0;
for (const id of index.batches) {
  boundedString(id, "batch id", 80);
  if (!/^ing-\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail("invalid batch id: " + id);
  if (seenBatches.has(id)) fail("duplicate batch id: " + id);
  seenBatches.add(id);
  const file = path.join(editorialDir, id + ".json");
  if (!fs.existsSync(file)) fail("missing batch: " + id);
  const batch = JSON.parse(fs.readFileSync(file, "utf8"));
  exactFields(batch, ["id", "processed_on", "coverage", "limit_note", "withheld_count", "items"], id);
  if (batch.id !== id) fail(id + ": id/filename mismatch");
  date(batch.processed_on, id + ".processed_on");
  if (!coverageKinds.has(batch.coverage)) fail(id + ": invalid coverage");
  if (batch.limit_note !== undefined) boundedString(batch.limit_note, id + ".limit_note", 220);
  if (!Number.isInteger(batch.withheld_count) || batch.withheld_count < 0) fail(id + ": invalid withheld_count");
  withheldCount += batch.withheld_count;
  if (!Array.isArray(batch.items)) fail(id + ": items must be an array");
  const seenItems = new Set();
  for (const item of batch.items) {
    exactFields(item, ["id", "kind", "title", "status", "targets", "reason"], id + ".item");
    if (typeof item.id !== "string" || !/^k[0-9]+$/.test(item.id) || seenItems.has(item.id)) fail(id + ": duplicate/bad item id");
    seenItems.add(item.id);
    if (!knowledgeKinds.has(item.kind)) fail(id + "." + item.id + ": bad kind");
    boundedString(item.title, id + "." + item.id + ".title", 160);
    if (!statuses.has(item.status) || !Array.isArray(item.targets)) fail(id + "." + item.id + ": invalid status/targets");
    if (item.reason !== undefined) boundedString(item.reason, id + "." + item.id + ".reason", 220);
    if (item.status === "pending") {
      if (item.targets.length !== 0 || !item.reason) fail(id + "." + item.id + ": pending requires reason and no targets");
      pending.push(id + "/" + item.id + ": " + item.title + " — " + item.reason);
    } else {
      if (!item.targets.length) fail(id + "." + item.id + ": integrated requires a target");
      if (item.reason !== undefined) fail(id + "." + item.id + ": remove obsolete reason after integration");
      integratedCount++;
    }
    const seenTargets = new Set();
    for (const target of item.targets) {
      exactFields(target, ["doc_id", "section"], id + "." + item.id + ".target");
      boundedString(target.doc_id, id + "." + item.id + ".doc_id", 80);
      boundedString(target.section, id + "." + item.id + ".section", 200);
      const key = target.doc_id + "::" + target.section;
      if (seenTargets.has(key)) fail(id + "." + item.id + ": duplicate target");
      seenTargets.add(key);
      const doc = docs.get(target.doc_id);
      if (!doc) fail(id + "." + item.id + ": missing document " + target.doc_id);
      const count = actualHeadings(doc).filter(x=>x===target.section).length;
      if (count !== 1) fail(id + "." + item.id + ": expected exactly one heading '" + target.section + "' in " + doc.path + ", found " + count);
    }
    itemCount++;
  }
}
const existingFiles = fs.readdirSync(editorialDir).filter(n => n.endsWith(".json") && n !== "index.json")
  .map(n=>n.slice(0,-5));
for (const id of existingFiles) if (!seenBatches.has(id)) fail("unindexed batch file: " + id + ".json");
console.log("OK: " + seenBatches.size + " public editing batches, " + itemCount + " knowledge items, " + integratedCount + " integrated, " + pending.length + " pending, " + withheldCount + " withheld (contents not stored)");
if (process.argv.includes("--report")) {
  console.log(pending.length ? "Pending:\n- " + pending.join("\n- ") : "No pending knowledge items");
}
