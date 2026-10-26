#!/usr/bin/env node
/**
 * Validate wiki/calendar.json, the source of the desktop calendar (/#calendar).
 * Entries are added during maintenance (MAINTENANCE.md) and only for documents
 * or sections whose time is specific.
 *
 *   linear:    {"id":"c001","label":"…","from":"1871","to":"1888","doc":"id","section":"절 제목"}
 *              from/to: YYYY or YYYY-MM, a minus sign for BCE (-2900); to is optional
 *   recurring: {"id":"c025","label":"…","every":{"from":"01-01","to":"01-01"},"doc":"id"}
 *              every.from/to: MM or MM-DD; to is optional; to before from wraps the year
 *
 * Usage: node scripts/validate-calendar.mjs [file]
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const file = path.resolve(root, process.argv[2] || "wiki/calendar.json");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "wiki", "manifest.json"), "utf8"));
const docs = new Map(manifest.documents.map(d => [d.id, d]));
const fail = message => { throw new Error("calendar: " + message); };
const withoutOriginals = text => text.replace(/^[ \t]*:::[ \t]*원본(?:[ \t].*)?$[\s\S]*?^[ \t]*:::[ \t]*$/gm, "");
const headings = new Map();

function exactFields(obj, allowed, label) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) fail(label + ": must be an object");
  for (const key of Object.keys(obj)) if (!allowed.includes(key)) fail(label + ": unexpected field " + key);
}
function line(value, label, max) {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\r\n\u0000-\u001f]/.test(value) ||
      /https?:\/\//i.test(value)) fail(label + ": expected a nonempty single-line string without URLs <= " + max);
}
function linearMonth(value, label, end) {
  const m = /^(-?\d{1,4})(?:-(\d{2}))?$/.exec(value ?? "");
  if (!m || +m[1] === 0 || (m[2] && (+m[2] < 1 || +m[2] > 12))) fail(label + ": expected YYYY or YYYY-MM (BCE as -YYYY)");
  return +m[1] * 12 + (m[2] ? +m[2] - 1 : end ? 11 : 0);
}
function cycleDay(value, label) {
  const m = /^(\d{2})(?:-(\d{2}))?$/.exec(value ?? "");
  const days = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (!m || +m[1] < 1 || +m[1] > 12 || (m[2] && (+m[2] < 1 || +m[2] > days[+m[1] - 1]))) fail(label + ": expected MM or MM-DD");
}
function sectionCount(doc, section) {
  if (!headings.has(doc.id)) {
    const text = withoutOriginals(fs.readFileSync(path.resolve(root, doc.path), "utf8"));
    headings.set(doc.id, Array.from(text.matchAll(/^#{2,6}[ \t]+(.+?)[ \t]*$/gm), m => m[1].trim()));
  }
  return headings.get(doc.id).filter(h => h === section).length;
}

const data = JSON.parse(fs.readFileSync(file, "utf8"));
exactFields(data, ["version", "description", "entries"], "file");
if (data.version !== 1 || !Array.isArray(data.entries)) fail("version must be 1 and entries an array");
const seen = new Set();
let linear = 0, recurring = 0;
for (const entry of data.entries) {
  const id = entry?.id;
  if (typeof id !== "string" || !/^c\d{3,}$/.test(id) || seen.has(id)) fail("bad or duplicate id " + id);
  seen.add(id);
  exactFields(entry, ["id", "label", "from", "to", "every", "doc", "section"], id);
  line(entry.label, id + ".label", 60);
  const doc = docs.get(entry.doc);
  if (!doc) fail(id + ": unknown doc " + entry.doc);
  if (doc.publish !== true) fail(id + ": doc " + entry.doc + " is not published");
  if (entry.section !== undefined) {
    line(entry.section, id + ".section", 200);
    const count = sectionCount(doc, entry.section);
    if (count !== 1) fail(id + ": expected exactly one heading '" + entry.section + "' in " + doc.path + ", found " + count);
  }
  if ((entry.from === undefined) === (entry.every === undefined)) fail(id + ": use either from/to (연대) or every (절기)");
  if (entry.every !== undefined) {
    if (entry.to !== undefined) fail(id + ": a recurring entry keeps to inside every");
    exactFields(entry.every, ["from", "to"], id + ".every");
    cycleDay(entry.every.from, id + ".every.from");
    if (entry.every.to !== undefined) cycleDay(entry.every.to, id + ".every.to");
    recurring++;
  } else {
    const start = linearMonth(entry.from, id + ".from", false);
    if (entry.to !== undefined && linearMonth(entry.to, id + ".to", true) < start) fail(id + ": to is before from");
    linear++;
  }
}
console.log("OK: calendar has " + linear + " 연대 and " + recurring + " 절기 entries, all pointing to published documents and existing sections");
