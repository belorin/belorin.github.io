#!/usr/bin/env node
/**
 * Generate the editorial wiki map: a compact entry map of every manuscript,
 * one card per document (section outline with line ranges and hashes, ledger
 * entries, relations, proposals) and a knowledge-title reverse index of the
 * ingestion ledgers. Editors read the map first, then only candidate cards,
 * then target sections; the reverse index is searched, not read whole.
 * Derived from wiki/*.md, manifest, relations and ledgers. Do not edit outputs.
 *
 * Usage:
 *   node scripts/build-wiki-map.mjs         # write editorial/map/
 *   node scripts/build-wiki-map.mjs --check # verify editorial/map/ is up to date
 */
import crypto from "node:crypto";
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
const SYNTHESIS_LABELS = { cross: "교차 종합", concept: "개념 길잡이", critique: "편집 비평" };
const hash = text => crypto.createHash("sha256").update(text).digest("hex").slice(0, 8);
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
// Each section covers its own lines only (up to the next heading of any level);
// line numbers are 1-based in the Markdown file, and the hash covers those lines.
function outline(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  if (!/^# /.test(lines[0] ?? "")) fail("expected a first-level heading");
  const sections = [{ level: 1, title: "(도입부)", start: 2, lines: [] }];
  let fenced = false;
  lines.slice(1).forEach((line, i) => {
    if (line.trim().startsWith("```")) fenced = !fenced;
    const heading = !fenced && line.match(/^(#{2,4})[ \t]+(.+?)[ \t]*$/);
    if (heading) sections.push({ level: heading[1].length, title: heading[2].trim(), start: i + 2, lines: [line] });
    else sections.at(-1).lines.push(line);
  });
  return sections.map(s => {
    const own = s.lines.slice(0, s.lines.findLastIndex(l => l.trim()) + 1);
    const body = s.level > 1 ? own.slice(1) : own;
    return { ...s, end: s.start + Math.max(own.length, 1) - 1, hash: hash(own.join("\n")),
      chars: body.join("\n").trim().length, lead: firstSentence(body) };
  }).filter(s => s.level > 1 || s.chars > 0);
}

// Ledger entries grouped by target document.
const ledger = new Map();
const batchIds = readJson("editorial/ingestions/index.json").batches;
let ledgerItems = 0;
const allItems = [];
for (const batchId of batchIds) {
  const batch = readJson(path.join("editorial", "ingestions", batchId + ".json"));
  for (const item of batch.items ?? []) {
    ledgerItems++;
    for (const target of item.targets ?? []) {
      if (!ledger.has(target.doc_id)) ledger.set(target.doc_id, []);
      ledger.get(target.doc_id).push({ batch: batchId, title: item.title, status: item.status, section: target.section });
    }
    allItems.push({ batch: batchId, ...item });
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
  categories.get(category).push({ doc, chars, sectionCount: headed.length, ledgerCount: (ledger.get(doc.id) ?? []).length });

  const card = [];
  card.push("# " + doc.title, "");
  card.push("> 자동 생성 문서 카드. 직접 수정하지 않는다. 판단은 반드시 아래 원고의 해당 절 본문을 읽고 한다.", "");
  card.push(`- id: \`${doc.id}\` · 분류: ${category} · ${doc.publish ? "공개" : "**미게시**"} · 원고: [${doc.path}](../../../${doc.path}) · ${count(chars)}자 · 절 ${headed.length}개`);
  if (doc.aliases?.length) card.push("- 별칭: " + doc.aliases.join(", "));
  if (doc.summary) card.push("- 요약: " + doc.summary);
  if (doc.tags?.length) card.push("- 태그: " + doc.tags.join(", "));
  card.push(`- 수정일: ${doc.updated ?? "없음"} · 실제 증보일: ${doc.last_enriched_on ?? "미확인"} · 검토: ${doc.review_state ?? "없음"}`);
  if (doc.related?.length) card.push("- 관련 문서: " + doc.related.map(id => `\`${id}\``).join(", "));
  if (doc.kind === "synthesis") {
    card.push(`- **종합(${SYNTHESIS_LABELS[doc.synthesis_type]})**: 편집 해석이다. 사실 근거로 인용하지 않으며 대화 지식을 이 글에 증보하지 않는다. 근거 문서: ${doc.based_on.map(id => `\`${id}\``).join(", ")}`);
  }
  const usedBy = docs.filter(d => d.based_on?.includes(doc.id));
  if (usedBy.length) card.push("- 이 문서를 근거로 쓴 종합: " + usedBy.map(d => `\`${d.id}\``).join(", "));

  card.push("", "## 절 목차", "");
  card.push("들여쓰기가 소제목 경로(상위 절 아래의 하위 절)다. `L시작–끝`은 원고 파일에서 그 절 고유 부분(하위 절 제외)의 줄 범위, 글자 수는 그 본문 분량, 8자리 해시는 그 줄들의 내용 지문으로 원고가 바뀌면 달라진다. 첫 문장은 위치 확인용이며 절의 내용을 대표하지 않는다.", "");
  for (const s of sections) {
    const indent = "  ".repeat(Math.max(0, s.level - 2));
    card.push(`${indent}- ${s.title} · L${s.start}–${s.end} · ${count(s.chars)}자 · \`${s.hash}\`${s.lead ? " — " + s.lead : ""}`);
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

// The entry map lists every manuscript on one line. Once it grows past
// SPLIT_AT characters, index.md keeps only each category's count and document
// ids (still a whole-wiki path for cross-domain candidates) and the full lines
// move to one file per category under categories/.
const SPLIT_AT = Number(process.env.WIKI_MAP_SPLIT_AT) || 25000;
const categoryDir = path.join(outDir, "categories");
const categoryFile = category => category.replace(/[\s/]+/g, "-") + ".md";
const synthesisCount = docs.filter(d => d.kind === "synthesis").length;
const header = [
  "# 위키 전체 지도", "",
  "> 자동 생성(`scripts/build-wiki-map.mjs`). 직접 수정하지 않는다. 미게시 원고를 포함한 **모든 원고**를 싣는다.",
  "> 사용 순서: ① 채팅에서 추출한 지식 항목마다 제목·별칭으로 후보를 찾는다 → ② 후보의 문서 카드 `editorial/map/docs/<id>.md`에서 절 목차와 장부 기록을 본다 → ③ 해당 절 본문을 읽고 대조한다. 전문으로 넓히는 조건은 WIKI_PROTOCOL §4를 따른다.",
  "> 지도와 카드는 후보를 찾는 도구일 뿐이다. 중복·반영 여부는 원고 본문을 읽고 판정한다.", "",
  `원고 ${docs.length - synthesisCount}개 (미게시 ${docs.filter(d => !d.publish && d.kind !== "synthesis").length})${synthesisCount ? ` · 종합 ${synthesisCount}편` : ""} · 절 ${count(sectionTotal)}개 · 장부 지식 항목 ${ledgerItems}개`, "",
  "특정 논점이 이미 처리되었는지는 [지식 표제 역색인](knowledge.md)에서 낱말로 **검색**한다(통째로 읽지 않는다). 장부가 없는 원고는 문서 카드의 절 목차로 찾는다.", "",
];
const lineFormat = "형식: `id` 제목 — 별칭 · 절 수 · 분량 · 장부 기록 수. 장부 없음은 장부 도입 이전 원고이거나 기록이 없는 원고이며, 내용이 없다는 뜻이 아니다.";
const synthesisNote = "편집 해석(SYNTHESIS.md). 지식 원고가 아니며 사실 근거로 인용하지 않는다. 대화 지식을 증보할 후보로 삼지 않는다.";
// The synthesis group (category 종합) always comes last, apart from the knowledge articles.
const mapOrder = ([a, x], [b, y]) => (a === "종합") - (b === "종합") || y.length - x.length || a.localeCompare(b, "ko");
const orderedCategories = [...categories].sort(mapOrder);
const docLine = ({ doc, chars, sectionCount, ledgerCount }) => {
  const alias = doc.aliases?.length ? " — " + doc.aliases.join(", ") : "";
  const ledgerNote = ledgerCount ? `장부 ${ledgerCount}건` : "장부 없음";
  const kindNote = doc.kind === "synthesis" ? ` · ${SYNTHESIS_LABELS[doc.synthesis_type]} · 근거 ${doc.based_on.length}편` : ` · ${ledgerNote}`;
  return `- \`${doc.id}\` ${doc.title}${alias} · ${sectionCount}절 · ${(chars / 1000).toFixed(1)}천 자${kindNote}${doc.publish ? "" : " · 미게시"}`;
};
const categoryBody = (category, list) => [
  ...(category === "종합" ? [synthesisNote, ""] : []),
  ...list.map(docLine), "",
];
const single = [...header, lineFormat, ""];
for (const [category, list] of orderedCategories) single.push(`## ${category} (${list.length})`, "", ...categoryBody(category, list));
const singleText = single.join("\n").trimEnd() + "\n";
const split = singleText.length > SPLIT_AT;
if (!split) {
  outputs.set(path.join(outDir, "index.md"), singleText);
} else {
  const index = [...header];
  index.push(`지도가 ${count(SPLIT_AT)}자를 넘어 분류별 파일로 나뉘었다. 아래에서 후보가 있을 만한 분류를 **모두** 열어 제목·별칭을 확인한다. 분야를 넘나드는 주제는 한 분류만 보지 말고, 문서 ID 목록과 역색인 검색으로 다른 분류의 후보도 찾는다.`, "");
  for (const [category, list] of orderedCategories) {
    const file = categoryFile(category);
    index.push(`## ${category} (${list.length}) → [분류 지도](categories/${encodeURI(file)})`, "");
    if (category === "종합") index.push(synthesisNote, "");
    index.push(list.map(({ doc }) => `\`${doc.id}\``).join(" · "), "");
    const page = [`# 분류 지도: ${category} (${list.length})`, "", "> 자동 생성. 직접 수정하지 않는다. [전체 지도로](../index.md)", "", lineFormat, "", ...categoryBody(category, list)];
    outputs.set(path.join(categoryDir, file), page.join("\n").trimEnd() + "\n");
  }
  outputs.set(path.join(outDir, "index.md"), index.join("\n").trimEnd() + "\n");
}

// Reverse index of the ingestion ledgers: knowledge title -> document/section -> batch/status.
const categoryOf = id => byId.get(id)?.category || "미분류";
const where = item => item.targets.map(t => `\`${t.doc_id}\` § ${t.section}`).join("; ");
const knowledge = [];
knowledge.push("# 지식 표제 역색인", "");
knowledge.push("> 자동 생성(`scripts/build-wiki-map.mjs`). 직접 수정하지 않는다. 편집 장부(`editorial/ingestions/`)의 기록을 뒤집은 것이며 새 요약을 담지 않는다.");
knowledge.push("> **통째로 읽지 말고 낱말로 검색한다.** 검색에 걸리지 않았다고 미반영이라고 단정하지 않는다. 장부 도입 이전 원고는 여기 없으므로 문서 카드의 절 목차로도 찾는다. 반영 여부의 최종 판정은 해당 절 본문을 읽고 한다.", "");
knowledge.push(`장부 지식 항목 ${ledgerItems}개 · 형식: 표제 → \`문서\` § 절 · \`처리 배치\``, "");
const pending = allItems.filter(i => i.status !== "integrated");
knowledge.push(`## 보류 항목 (${pending.length})`, "");
for (const item of pending) {
  knowledge.push(`- ${item.title} → ${item.targets.length ? where(item) : "반영 위치 없음"} · \`${item.batch}\` · ${item.status}${item.reason ? " — " + item.reason : ""}`);
}
const integratedByCategory = new Map();
for (const item of allItems.filter(i => i.status === "integrated")) {
  const category = item.targets.length ? categoryOf(item.targets[0].doc_id) : "미분류";
  if (!integratedByCategory.has(category)) integratedByCategory.set(category, []);
  integratedByCategory.get(category).push(item);
}
for (const [category, list] of [...integratedByCategory].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ko"))) {
  knowledge.push("", `## ${category} (${list.length})`, "", "분류는 첫 반영 문서 기준이다. 여러 분야에 걸친 항목은 한 분류에만 실리므로 분류로 범위를 좁히지 말고 검색한다.", "");
  for (const item of list) knowledge.push(`- ${item.title} → ${where(item)} · \`${item.batch}\``);
}
outputs.set(path.join(outDir, "knowledge.md"), knowledge.join("\n").trimEnd() + "\n");

// Write or verify, and remove cards whose documents no longer exist.
const stale = [];
for (const [file, body] of outputs) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current !== body) stale.push(file);
}
const extra = [cardDir, categoryDir].flatMap(dir => fs.existsSync(dir)
  ? fs.readdirSync(dir).map(n => path.join(dir, n)).filter(f => !outputs.has(f))
  : []);
if (process.argv.includes("--check")) {
  if (stale.length || extra.length) {
    fail("editorial/map is out of date (" + [...stale, ...extra].map(f => path.relative(root, f)).slice(0, 5).join(", ") + "): run node scripts/build-wiki-map.mjs");
  }
  console.log(`OK: wiki map matches ${docs.length} manuscripts and ${count(sectionTotal)} sections`);
} else {
  fs.mkdirSync(cardDir, { recursive: true });
  if (split) fs.mkdirSync(categoryDir, { recursive: true });
  for (const file of stale) fs.writeFileSync(file, outputs.get(file));
  for (const file of extra) fs.rmSync(file);
  if (!split && fs.existsSync(categoryDir) && !fs.readdirSync(categoryDir).length) fs.rmdirSync(categoryDir);
  console.log(`Wiki map: ${docs.length} manuscripts, ${count(sectionTotal)} sections${split ? ", split by category" : ""}; ${stale.length} written, ${extra.length} removed`);
}
