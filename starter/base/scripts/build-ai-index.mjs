#!/usr/bin/env node
/**
 * Generate the public AI navigation files from wiki/manifest.json and
 * wiki/relations.json (published documents only, no network or LLM calls):
 *   AI_INDEX.md, ai/index.json, ai/relations.json, llms.txt
 *
 *   node scripts/build-ai-index.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fail, loadConfig, readJson, root } from "./lib/site.mjs";

const c = loadConfig();
const manifest = readJson("wiki/manifest.json");
const relationSource = readJson("wiki/relations.json");
const TYPES = {
  related_to: "manifest.related의 일반적인 관련성", introduces: "상세 주제의 진입점", elaborates: "기존 주제 심화",
  illustrates: "사례로 구체화", curates: "대상을 선별·배열", contrasts: "차이 대조", challenges: "반론 제기", supports: "논거 제공",
};
const REVIEW = ["unassessed", "needs_review", "reviewed"];

// Every relation must point at an existing heading of its source document.
const aliases = new Set();
for (const d of manifest.documents) {
  for (const a of d.aliases ?? []) {
    if (typeof a !== "string" || !a.trim() || aliases.has(a)) fail("duplicate or invalid alias: " + a);
    aliases.add(a);
  }
  if (d.review_state !== undefined && !REVIEW.includes(d.review_state)) fail(d.id + ": review_state must be " + REVIEW.join("/"));
}
const docs = manifest.documents.filter(d => d.publish === true).sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9));
const ids = new Set(docs.map(d => d.id));
const edges = [], keys = new Set();
const edge = e => {
  const key = [e.from, e.to, e.type].join("::");
  if (keys.has(key)) fail("duplicate relation " + key);
  keys.add(key); edges.push(e);
};
for (const d of docs) for (const to of d.related ?? []) edge({ from: d.id, to, type: "related_to", basis: "manifest.related" });
for (const r of relationSource.relations ?? []) {
  const from = manifest.documents.find(d => d.id === r.from);
  if (!from || !manifest.documents.some(d => d.id === r.to) || r.from === r.to) fail("relation endpoint missing: " + r.from + " → " + r.to);
  if (!TYPES[r.type] || r.type === "related_to" || !r.evidence_section || !r.reason) fail("bad relation " + r.from + " → " + r.to);
  const headings = [...fs.readFileSync(path.join(root, from.path), "utf8").matchAll(/^#{2,6}[ \t]+(.+?)[ \t]*$/gm)].map(m => m[1]);
  if (headings.filter(h => h === r.evidence_section).length !== 1) fail("relation " + r.from + ": heading not found once: " + r.evidence_section);
  if (ids.has(r.from) && ids.has(r.to)) edge({ from: r.from, to: r.to, type: r.type, basis: "curated", evidence_section: r.evidence_section, reason: r.reason });
}

const urls = d => ({ markdown_url: c.rawUrl + d.path, github_url: c.repoUrl + "/blob/" + c.branch + "/" + d.path, page_url: c.url + "notes/" + d.id + "/", app_url: c.url + "#" + d.id });
const index = {
  version: 1, scope: "published_only", site: c.url,
  description: "탐색 메타데이터. 논증과 근거는 Markdown 정본을 읽는다.",
  source_files: ["wiki/manifest.json", "wiki/relations.json"], document_count: docs.length,
  documents: docs.map(d => ({
    id: d.id, title: d.title, aliases: d.aliases ?? [], category: d.category, tags: d.tags ?? [], summary: d.summary,
    review_state: d.review_state ?? "unassessed", review_label: d.status, last_updated_on: d.updated,
    related_ids: d.related ?? [], ...urls(d),
  })),
};
const relations = { version: 1, scope: "published_only", types: TYPES, edge_count: edges.length, edges };

const order = c.categories;
const cats = [...new Set(docs.map(d => d.category))].sort((a, b) =>
  (order.includes(a) ? order.indexOf(a) : order.length) - (order.includes(b) ? order.indexOf(b) : order.length));
const md = ["# AI 탐색 색인", "",
  "> Markdown이 지식의 정본이다. 이 문서는 탐색용이며 본문을 대체하지 않는다. 공개 문서만 나열한다.", "",
  "- [기계용 색인](ai/index.json)", "- [관계](ai/relations.json)", "- [llms.txt](llms.txt)", ""];
const ll = ["# " + c.name, "", "> " + c.description, "",
  "## 이 위키를 읽는 AI에게", "",
  "1. 아래 목록의 제목과 설명에서 질문과 관련된 문서를 고른다.",
  "2. 고른 문서의 링크(본문이 들어 있는 문서 페이지)를 실제로 열어 읽는다. 한 줄 설명만으로 내용을 단정하지 않는다.",
  "3. 문서 페이지 `" + c.url + "notes/<문서-id>/`에 본문이 있다. 원문 Markdown은 `" + c.rawUrl + "wiki/<문서-id>.md`이다.",
  "4. 답할 때 근거가 된 문서와 절 제목을 밝히고, 위키 밖의 지식이나 추론은 구분한다.", "",
  "## Navigation", "",
  "- [AI metadata index](" + c.url + "ai/index.json)", "- [Typed relations](" + c.url + "ai/relations.json)",
  "- [Markdown index](" + c.url + "AI_INDEX.md)", "- [Website](" + c.url + ")", "", "## Published articles", ""];
for (const cat of cats) {
  md.push("## " + cat, ""); ll.push("### " + cat, "");
  for (const d of docs.filter(x => x.category === cat)) {
    md.push("- **[" + d.title + "](" + d.path + ")**" + ((d.aliases ?? []).length ? " · 별칭: " + d.aliases.join(", ") : "") +
      " · 수정: " + d.updated + " · 상태: " + d.status, "  - " + d.summary,
      "  - [문서 페이지](" + c.url + "notes/" + d.id + "/) · [직접 Markdown](" + c.rawUrl + d.path + ")");
    ll.push("- [" + d.title + "](" + c.url + "notes/" + d.id + "/): " + d.summary);
  }
  md.push(""); ll.push("");
}
const outputs = {
  "ai/index.json": JSON.stringify(index, null, 2) + "\n",
  "ai/relations.json": JSON.stringify(relations, null, 2) + "\n",
  "AI_INDEX.md": md.join("\n").trimEnd() + "\n",
  "llms.txt": ll.join("\n").trimEnd() + "\n",
};
let changes = 0;
for (const [file, body] of Object.entries(outputs)) {
  const target = path.join(root, file);
  if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === body) continue;
  if (process.argv.includes("--check")) fail("stale generated file: " + file + " (run node scripts/build.mjs)");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, body); changes++;
}
console.log("AI index: " + docs.length + " public articles, " + edges.length + " relations; " + changes + " files updated");
