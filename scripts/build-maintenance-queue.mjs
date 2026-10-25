#!/usr/bin/env node
/**
 * Generate the maintenance queue (editorial/maintenance/queue.md) from the
 * manuscripts, manifest, relations, ledgers, crosslink proposals and the
 * maintenance log. Machine signals only: every item still needs a reading of
 * the manuscripts before anything is changed. Also validates the log.
 *
 * Usage:
 *   node scripts/build-maintenance-queue.mjs         # write the queue
 *   node scripts/build-maintenance-queue.mjs --check # verify queue and log
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const readJson = file => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const manifest = readJson("wiki/manifest.json");
const relations = readJson("wiki/relations.json").relations;
const proposals = readJson("editorial/crosslinks/index.json").proposals;
const log = readJson("editorial/maintenance/log.json");
const outputPath = path.join(root, "editorial", "maintenance", "queue.md");
const docs = manifest.documents;
const byId = new Map(docs.map(d => [d.id, d]));

function fail(message) { throw Error(message); }
const count = n => n.toLocaleString("en-US");
const LONG = 10000, SHORT = 1500, SIMILAR_PAIRS = 15;
const GENERIC = new Set(["관련 문서", "참고 자료", "검토 상태", "함께 읽기", "출처", "참고 문헌", "더 읽을거리"]);

// Validate the maintenance log: sequential versions M001, M002, ... with reports.
if (!Array.isArray(log.entries)) fail("maintenance log: entries must be an array");
log.entries.forEach((entry, i) => {
  const expected = "M" + String(i + 1).padStart(3, "0");
  if (entry.version !== expected) fail(`maintenance log: expected ${expected}, got ${entry.version}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? "")) fail(entry.version + ": invalid date");
  if (i && entry.date < log.entries[i - 1].date) fail(entry.version + ": date before previous entry");
  if (entry.report !== `editorial/maintenance/reports/${entry.version}.md`) fail(entry.version + ": report must be editorial/maintenance/reports/" + entry.version + ".md");
  if (!fs.existsSync(path.join(root, entry.report))) fail(entry.version + ": missing report " + entry.report);
  if (typeof entry.scope !== "string" || !entry.scope.trim()) fail(entry.version + ": scope required");
});
const last = log.entries.at(-1) ?? null;

const texts = new Map(docs.map(d => [d.id, fs.readFileSync(path.join(root, d.path), "utf8")]));
const headings = id => Array.from(texts.get(id).matchAll(/^#{2,4}[ \t]+(.+?)[ \t]*$/gm), m => m[1].trim());

// Inbound links from other documents: manifest.related, Markdown links, confirmed relations.
const inbound = new Map(docs.map(d => [d.id, new Set()]));
for (const d of docs) {
  for (const r of d.related ?? []) inbound.get(r)?.add(d.id);
  for (const m of texts.get(d.id).matchAll(/\]\((?:\.\/|#)([a-z0-9-]+)(?:\.md)?\)/g)) {
    if (m[1] !== d.id) inbound.get(m[1])?.add(d.id);
  }
}
for (const r of relations) inbound.get(r.to)?.add(r.from);

const isLinked = (a, b) => (byId.get(a).related ?? []).includes(b) || (byId.get(b).related ?? []).includes(a);
const asymmetric = [];
for (const d of docs) for (const r of d.related ?? []) {
  if (byId.has(r) && !(byId.get(r).related ?? []).includes(d.id)) asymmetric.push([d.id, r]);
}

// Lexical similarity of titles, aliases and headings (character bigrams). Candidates only.
const bigrams = text => {
  const set = new Set();
  for (const word of text.toLowerCase().split(/[\s·,:()'"‘’“”\-—/]+/)) {
    for (let i = 0; i + 1 < word.length; i++) set.add(word.slice(i, i + 2));
  }
  return set;
};
// Syntheses resemble their basis by design and novels are not knowledge
// articles, so both are left out of similarity pairs.
const articles = docs.filter(d => !d.kind);
const signature = new Map(articles.map(d => [d.id, bigrams([d.title, ...(d.aliases ?? []), ...headings(d.id).filter(h => !GENERIC.has(h))].join(" "))]));
const similar = [];
for (let i = 0; i < articles.length; i++) for (let j = i + 1; j < articles.length; j++) {
  const a = signature.get(articles[i].id), b = signature.get(articles[j].id);
  let shared = 0;
  for (const g of a) if (b.has(g)) shared++;
  const score = shared / (a.size + b.size - shared || 1);
  similar.push({ a: articles[i].id, b: articles[j].id, score });
}
similar.sort((x, y) => y.score - x.score || x.a.localeCompare(y.a) || x.b.localeCompare(y.b));

const categoryCounts = new Map();
for (const d of docs) categoryCounts.set(d.category || "미분류", (categoryCounts.get(d.category || "미분류") ?? 0) + 1);
const changed = docs.filter(d => !last || !d.updated || d.updated >= last.date);
const pending = [];
for (const batchId of readJson("editorial/ingestions/index.json").batches) {
  for (const item of readJson(`editorial/ingestions/${batchId}.json`).items ?? []) {
    if (item.status !== "integrated") pending.push({ batchId, item });
  }
}
const open = proposals.filter(p => p.status === "proposed" || p.status === "approved");
const sized = docs.map(d => ({ d, chars: texts.get(d.id).trim().length }));

const out = [];
const doc = id => `\`${id}\``;
out.push("# 정비 대기열", "");
out.push("> 자동 생성(`scripts/build-maintenance-queue.mjs`). 직접 수정하지 않는다. 기계가 원고 전체에서 찾은 **신호**일 뿐이며, 무엇을 고칠지는 [정비 절차](../../MAINTENANCE.md)에 따라 원고를 읽고 판단한다.", "");
out.push(last
  ? `마지막 정비: **${last.version}** (${last.date}) · [보고서](reports/${last.version}.md) · 다음 정비 버전: **M${String(log.entries.length + 1).padStart(3, "0")}**`
  : "마지막 정비: 없음 · 다음 정비 버전: **M001** (첫 정비이므로 모든 문서가 변경 문서로 잡힌다)");
out.push("", `원고 ${docs.length}개 · 변경 문서 ${changed.length} · 고립 ${docs.filter(d => !inbound.get(d.id).size).length} · 한쪽 연결 ${asymmetric.length} · 보류 ${pending.length} · 열린 교차 제안 ${open.length}`, "");

out.push(`## 1. 지난 정비 이후 변경된 문서 (${changed.length})`, "");
out.push(last ? `manifest의 수정일이 ${last.date} 이후(당일 포함)이거나 수정일이 없는 문서. 분류별로 묶었으며, 양이 많으면 분류 단위로 나누어 처리한다.` : "첫 정비이므로 전체 문서. 분류별로 묶었으며, 양이 많으면 분류 단위로 나누어 처리한다.", "");
const changedByCategory = new Map();
for (const d of changed) {
  const c = d.category || "미분류";
  if (!changedByCategory.has(c)) changedByCategory.set(c, []);
  changedByCategory.get(c).push(d);
}
for (const [c, list] of [...changedByCategory].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "ko"))) {
  out.push(`- **${c}** (${list.length}): ${list.map(d => doc(d.id)).join(", ")}`);
}

const orphans = docs.filter(d => !inbound.get(d.id).size);
out.push("", `## 2. 들어오는 연결이 없는 문서 (${orphans.length})`, "");
out.push("다른 문서의 관련 문서·본문 링크·확인된 관계 어디에도 등장하지 않는다. 직접 관련 문서가 있는지 본문을 읽고 확인한다.", "");
for (const d of orphans) out.push(`- ${doc(d.id)} ${d.title}${d.publish ? "" : " · 미게시"}`);

out.push("", `## 3. 한쪽에서만 건 관련 문서 (${asymmetric.length})`, "");
out.push("`A → B`는 A의 관련 문서에 B가 있으나 B에는 A가 없다는 뜻이다. 반대 방향도 직접 관련일 때만 맞춘다.", "");
for (const [a, b] of asymmetric) out.push(`- ${doc(a)} → ${doc(b)}`);

const lonely = docs.filter(d => !(d.related ?? []).length);
out.push("", `## 4. 관련 문서가 없는 문서 (${lonely.length})`, "");
for (const d of lonely) out.push(`- ${doc(d.id)} ${d.title}`);

out.push("", `## 5. 제목·소제목이 비슷한 문서 쌍 (상위 ${SIMILAR_PAIRS})`, "");
out.push("제목·별칭·소제목의 글자 2-gram 유사도(0~1)다. 중복이 아니라 **대조해 볼 후보**이며, 이미 연결된 쌍도 표시한다.", "");
for (const p of similar.slice(0, SIMILAR_PAIRS)) {
  out.push(`- ${doc(p.a)} ↔ ${doc(p.b)} · ${p.score.toFixed(2)}${isLinked(p.a, p.b) ? " · 연결됨" : ""}`);
}

out.push("", `## 6. 보류 항목 (${pending.length})`, "");
for (const { batchId, item } of pending) out.push(`- ${item.title} · \`${batchId}\`${item.reason ? " — " + item.reason : ""}`);
out.push("", `## 7. 열린 교차 편집 제안 (${open.length})`, "");
out.push("정비에서 승인하지 않는다. 판단 근거를 보고서에 적어 사용자 결정을 요청한다.", "");
for (const p of open) out.push(`- \`${p.id}\` · ${p.status} · ${doc(p.from.doc_id)} ↔ ${doc(p.to.doc_id)}`);

out.push("", "## 8. 분량 참고", "");
out.push(`분량만으로 나누거나 합치지 않는다. 내용상 이유가 있을 때만 보고서에 제안한다. 기준: ${count(LONG)}자 초과 / ${count(SHORT)}자 미만.`, "");
const long = sized.filter(x => x.chars > LONG).sort((a, b) => b.chars - a.chars);
const short = sized.filter(x => x.chars < SHORT).sort((a, b) => a.chars - b.chars);
out.push(`- 긴 문서 (${long.length}): ${long.map(x => `${doc(x.d.id)} ${count(x.chars)}자`).join(", ") || "없음"}`);
out.push(`- 짧은 문서 (${short.length}): ${short.map(x => `${doc(x.d.id)} ${count(x.chars)}자`).join(", ") || "없음"}`);

const rare = [...categoryCounts].filter(([, n]) => n <= 1).map(([c]) => c);
out.push("", "## 9. 분류 참고", "");
out.push(`분류 ${categoryCounts.size}개: ${[...categoryCounts].sort((a, b) => b[1] - a[1]).map(([c, n]) => `${c} ${n}`).join(", ")}`);
out.push(`문서가 하나뿐인 분류 ${rare.length}개${rare.length ? ": " + rare.join(", ") : ""}. 분류 체계 변경은 제안만 한다.`);

const body = out.join("\n") + "\n";
const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, "utf8") : null;
if (process.argv.includes("--check")) {
  if (current !== body) fail("editorial/maintenance/queue.md is out of date: run node scripts/build-maintenance-queue.mjs");
  console.log(`OK: maintenance queue and log (${log.entries.length} entries) are valid`);
} else if (current !== body) {
  fs.writeFileSync(outputPath, body);
  console.log("Updated maintenance queue");
} else {
  console.log("No changes: maintenance queue is up to date");
}
