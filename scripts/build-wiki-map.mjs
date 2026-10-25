#!/usr/bin/env node
/**
 * Generate the editorial wiki map: a compact entry map of every manuscript and
 * one card per document (section outline, ledger entries, relations, proposals).
 * Editors read the map first, then only candidate cards, then target sections.
 * Derived from wiki/*.md, manifest, relations and ledgers. Do not edit outputs.
 *
 * Usage:
 *   node scripts/build-wiki-map.mjs         # write editorial/map/
 *   node scripts/build-wiki-map.mjs --check # verify editorial/map/ is up to date
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outDir = path.join(root, "editorial", "map");
const cardDir = path.join(outDir, "docs");
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const manifest = readJson("wiki/manifest.json");
const relations = readJson("wiki/relations.json").relations;
const proposals = readJson("editorial/crosslinks/index.json").proposals;
const docs = manifest.documents;
const byId = new Map(docs.map(d => [d.id, d]));

function fail(message) { throw Error(message); }
const count = n => n.toLocaleString("en-US");
const plain = text => text
  .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
  .replace(/\*\*|__|`/g, "")
  .replace(/\s+/g, " ")
  .trim();

function firstSentence(lines) {
  const line = lines.map(l => l.trim()).find(l => l && !/^(\|?\s*:?-{3,}|```)/.test(l));
  if (!line) return "";
  if (line.startsWith("|")) return "(표)";
  const text = plain(line.replace(/^(?:[-*>]|\d+\.)\s+/, ""));
  const match = text.match(/^(.{8,110}?[.!?])(?:\s|$)/);
  if (match) return match[1];
  return text.length > 90 ? text.slice(0, 90) + "…" : text;
}

// Split a manuscript into sections: intro (before the first ##) and ##~#### headings.
function outline(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  if (!/^# /.test(lines[0] ?? "")) fail("expected a first-level heading");
  const sections = [{ level: 1, title: "(도입부)", lines: [] }];
  let fenced = false;
  for (const line of lines.slice(1)) {
    if (line.trim().startsWith("```")) fenced = !fenced;
    const heading = !fenced && line.match(/^(#{2,4})[ \t]+(.+?)[ \t]*$/);
    if (heading) sections.push({ level: heading[1].length, title: heading[2].trim(), lines: [] });
    else sections.at(-1).lines.push(line);
  }
  return sections
    .map(s => ({ ...s, chars: s.lines.join("\n").trim().length, lead: firstSentence(s.lines) }))
    .filter(s => s.level > 1 || s.chars > 0);
}

// Ledger entries grouped by target document.
const ledger = new Map();
const batchIds = readJson("editorial/ingestions/index.json").batches;
let ledgerItems = 0;
for (const batchId of batchIds) {
  const batch = readJson(path.join("editorial", "ingestions", batchId + ".json"));
  for (const item of batch.items ?? []) {
    ledgerItems++;
    for (const target of item.targets ?? []) {
      if (!ledger.has(target.doc_id)) ledger.set(target.doc_id, []);
      ledger.get(target.doc_id).push({ batch: batchId, title: item.title, status: item.status, section: target.section });
    }
  }
}

const outputs = new Map();
const categories = new Map();
let sectionTotal = 0;

for (const doc of docs) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(doc.id)) fail("invalid id: " + doc.id);
  const markdown = fs.readFileSync(path.join(root, doc.path), "utf8");
  const sections = outline(markdown);
  const headed = sections.filter(s => s.level > 1);
  sectionTotal += headed.length;
  const chars = markdown.trim().length;
  const category = doc.category || "미분류";
  if (!categories.has(category)) categories.set(category, []);
  categories.get(category).push({ doc, chars, sectionCount: headed.length });

  const card = [];
  card.push("# " + doc.title, "");
  card.push("> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.", "");
  card.push(`- id: \`${doc.id}\` · 분류: ${category} · ${doc.publish ? "공개" : "**미게시**"} · 원고: [${doc.path}](../../../${doc.path}) · ${count(chars)}자 · 절 ${headed.length}개`);
  if (doc.aliases?.length) card.push("- 별칭: " + doc.aliases.join(", "));
  if (doc.summary) card.push("- 요약: " + doc.summary);
  if (doc.tags?.length) card.push("- 태그: " + doc.tags.join(", "));
  card.push(`- 수정일: ${doc.updated ?? "없음"} · 실제 증보일: ${doc.last_enriched_on ?? "미확인"} · 검토: ${doc.review_state ?? "없음"}`);
  if (doc.related?.length) card.push("- 관련 문서: " + doc.related.map(id => `\`${id}\``).join(", "));

  card.push("", "## 절 목차", "", "글자 수는 하위 절을 제외한 그 절 고유 본문의 분량이다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.", "");
  for (const s of sections) {
    const indent = "  ".repeat(Math.max(0, s.level - 2));
    card.push(`${indent}- ${s.title} (${count(s.chars)}자)${s.lead ? " — " + s.lead : ""}`);
  }

  const entries = ledger.get(doc.id) ?? [];
  card.push("", "## 장부에 기록된 반영 지식", "");
  if (!entries.length) card.push("- 없음 (장부 도입 이전 원고이거나 아직 기록이 없다. 기록이 없다는 것은 내용이 없다는 뜻이 아니다.)");
  const bySection = new Map();
  for (const e of entries) {
    if (!bySection.has(e.section)) bySection.set(e.section, []);
    bySection.get(e.section).push(e);
  }
  for (const [section, list] of bySection) {
    card.push(`- **${section}**`);
    for (const e of list) card.push(`  - ${e.title} · \`${e.batch}\`${e.status === "integrated" ? "" : " · " + e.status}`);
  }

  const rels = relations.filter(r => r.from === doc.id || r.to === doc.id);
  if (rels.length) {
    card.push("", "## 확인된 의미 관계", "");
    for (const r of rels) {
      const out = r.from === doc.id;
      card.push(`- ${out ? "→" : "←"} \`${out ? r.to : r.from}\` · ${r.type} · 근거 절(${r.from}): ${r.evidence_section}`);
    }
  }
  const props = proposals.filter(p => p.from.doc_id === doc.id || p.to.doc_id === doc.id);
  if (props.length) {
    card.push("", "## 교차 편집 제안 (확정 아님)", "");
    for (const p of props) card.push(`- \`${p.id}\` · ${p.status} · ${p.from.doc_id}#${p.from.section} ↔ ${p.to.doc_id}#${p.to.section}`);
  }
  outputs.set(path.join(cardDir, doc.id + ".md"), card.join("\n") + "\n");
}

const map = [];
map.push("# 위키 전체 지도", "");
map.push("> 자동 생성(`scripts/build-wiki-map.mjs`). 직접 수정하지 않는다. 미게시 원고를 포함한 **모든 원고**를 한 줄씩 싣는다.");
map.push("> 사용 순서: ① 채팅에서 추출한 지식 항목마다 아래 제목·별칭으로 후보를 찾는다 → ② 후보의 문서 카드 `editorial/map/docs/<id>.md`에서 절 목차와 장부 기록을 본다 → ③ 해당 절 본문을 읽고 대조한다. 전문으로 넓히는 조건은 WIKI_PROTOCOL §8A를 따른다.");
map.push("> 지도와 카드는 후보를 찾는 도구일 뿐이다. 중복·반영 여부는 원고 본문을 읽고 판정한다.", "");
map.push(`원고 ${docs.length}개 (미게시 ${docs.filter(d => !d.publish).length}) · 절 ${count(sectionTotal)}개 · 장부 지식 항목 ${ledgerItems}개`, "");
map.push("형식: `id` 제목 — 별칭 · 절 수 · 분량", "");
for (const [category, list] of [...categories].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ko"))) {
  map.push(`## ${category} (${list.length})`, "");
  for (const { doc, chars, sectionCount } of list) {
    const alias = doc.aliases?.length ? " — " + doc.aliases.join(", ") : "";
    map.push(`- \`${doc.id}\` ${doc.title}${alias} · ${sectionCount}절 · ${(chars / 1000).toFixed(1)}천 자${doc.publish ? "" : " · 미게시"}`);
  }
  map.push("");
}
outputs.set(path.join(outDir, "index.md"), map.join("\n").trimEnd() + "\n");

// Write or verify, and remove cards whose documents no longer exist.
const stale = [];
for (const [file, body] of outputs) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current !== body) stale.push(file);
}
const extra = fs.existsSync(cardDir)
  ? fs.readdirSync(cardDir).map(n => path.join(cardDir, n)).filter(f => !outputs.has(f))
  : [];
if (process.argv.includes("--check")) {
  if (stale.length || extra.length) {
    fail("editorial/map is out of date (" + [...stale, ...extra].map(f => path.relative(root, f)).slice(0, 5).join(", ") + "): run node scripts/build-wiki-map.mjs");
  }
  console.log(`OK: wiki map matches ${docs.length} manuscripts and ${count(sectionTotal)} sections`);
} else {
  fs.mkdirSync(cardDir, { recursive: true });
  for (const file of stale) fs.writeFileSync(file, outputs.get(file));
  for (const file of extra) fs.rmSync(file);
  console.log(`Wiki map: ${docs.length} manuscripts, ${count(sectionTotal)} sections; ${stale.length} written, ${extra.length} removed`);
}
