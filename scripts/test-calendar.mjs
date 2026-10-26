#!/usr/bin/env node
// Calendar checks: the validator rejects malformed entries, and calendar.js
// lays entries on the strip (folded gaps, scales, wrapping recurring spans).
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";

const manifest = JSON.parse(fs.readFileSync("wiki/manifest.json", "utf8"));
const doc = manifest.documents.find(d => d.publish === true && !d.kind);
const heading = fs.readFileSync(doc.path, "utf8").match(/^## (.+)$/m)[1].trim();

// Validator: the real file passes, each broken fixture fails.
execFileSync("node", ["scripts/validate-calendar.mjs"], {stdio: "pipe"});
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "calendar-"));
const rejects = (entries, why) => {
  const file = path.join(dir, "c.json");
  fs.writeFileSync(file, JSON.stringify({version: 1, entries}));
  assert.throws(() => execFileSync("node", ["scripts/validate-calendar.mjs", file], {stdio: "pipe"}), undefined, why);
};
const ok = {id: "c001", label: "시험", from: "1871", to: "1888", doc: doc.id, section: heading};
const file = path.join(dir, "ok.json");
fs.writeFileSync(file, JSON.stringify({version: 1, entries: [ok, {id: "c002", label: "절기", every: {from: "09", to: "06"}, doc: doc.id}]}));
execFileSync("node", ["scripts/validate-calendar.mjs", file], {stdio: "pipe"});
rejects([{...ok, doc: "no-such-doc"}], "unknown document");
rejects([{...ok, section: "없는 절"}], "missing section");
rejects([{...ok, to: "1800"}], "to before from");
rejects([{...ok, from: "1871-13"}], "bad month");
rejects([{...ok, every: {from: "01"}}], "both linear and recurring");
rejects([{...ok, note: "x"}], "unknown field");
rejects([ok, {...ok}], "duplicate id");
rejects([{id: "c003", label: "절기", every: {from: "02-30"}, doc: doc.id}], "impossible day");

// Rendering: run calendar.js against a bare window and draw the strip as HTML.
const context = {window: {addEventListener() {}, matchMedia: () => ({matches: true})}, document: {}, location: {hash: ""}, Math, Date, Error};
vm.runInNewContext(fs.readFileSync("calendar.js", "utf8"), context, {filename: "calendar.js", timeout: 5000});
const cal = context.window.Calendar;
const plain = value => JSON.parse(JSON.stringify(value)); // arrays from the sandbox realm
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const ctx = {esc, byId: id => id === "d" ? {id: "d", title: "문서"} : null, permalink: id => "#" + id};
cal.setData({entries: [
  {id: "c001", label: "먼 옛날", from: "-2900", doc: "d"},
  {id: "c002", label: "전신망", from: "1871", to: "1888", doc: "d", section: "절"},
  {id: "c003", label: "봄 전황", from: "2026-03", to: "2026-04", doc: "d"},
  {id: "c004", label: "시즌", every: {from: "09", to: "06"}, doc: "d"},
  {id: "c005", label: "신년", every: {from: "01-01"}, doc: "d"},
  {id: "c006", label: "비공개 문서", from: "1900", doc: "hidden"}
]});
assert.deepEqual(plain(cal.lineSpan({from: "1871", to: "1888"})), [1871 * 12, 1888 * 12 + 11]);
assert.deepEqual(plain(cal.lineSpan({from: "-2900"})), [-2900 * 12, -2900 * 12 + 11]);
assert.deepEqual(plain(cal.cycleRanges({every: {from: "09", to: "06"}}, 2026, 365)), [[243, 364], [0, 180]], "a season wraps the year");
assert.deepEqual(plain(cal.cycleRanges({every: {from: "01-01"}}, 2026, 365)), [[0, 0]]);

cal.setView("line", "decade");
let html = cal.page(ctx);
assert.match(html, /class="cal cal-blocks"/, "the 덩어리 look is the default");
assert.match(html, /data-cal-look="cells"/, "the look can be switched to 칸");
cal.setView("line", "decade", "cells");
assert.ok(!cal.page(ctx).includes("cal-blocks"), "the 칸 look drops the block styling");
cal.setView("line", "decade", "blocks");
assert.match(html, /cal-gap">⋯ 기원전 2890 – 1869/, "empty centuries fold into one gap row");
assert.match(html, /data-ids="c002"/, "a period lights its cells");
assert.match(html, /data-section="절"/, "items carry their section");
assert.ok(!html.includes("비공개 문서"), "entries for unpublished documents are left out");
assert.equal((html.match(/data-ids="c002"/g) || []).length, 18, "1871–1888 covers 18 one-year cells");
cal.setView("line", "century");
assert.equal((cal.page(ctx).match(/data-ids="c002"/g) || []).length, 2, "at the century scale it covers two ten-year cells");
cal.setView("line", "year");
assert.equal((cal.page(ctx).match(/data-ids="c003"/g) || []).length, 2, "at the year scale March–April is two month cells");
cal.setView("cycle", "decade");
html = cal.page(ctx);
assert.match(html, /9월 – 6월/);
assert.match(html, / mt/, "months are separated by stepped lines");
assert.ok(!html.includes("전신망"), "the 절기 view shows recurring entries only");
console.log("OK: calendar validator fixtures, scales, folded gaps and recurring wrap");
