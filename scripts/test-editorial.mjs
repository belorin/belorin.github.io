#!/usr/bin/env node
/**
 * Local fixture tests for transcript-free editorial ledger validation.
 * Never stores a real user conversation.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "wiki-ledger-"));
const script = path.resolve("scripts", "validate-editorial.mjs");
const base = path.join(workspace, "editorial", "ingestions");
const manifestPath = path.join(workspace, "wiki", "manifest.json");
const articlePath = path.join(workspace, "wiki", "sample.md");
const indexPath = path.join(base, "index.json");
const batchPath = path.join(base, "ing-20261023-test.json");
const put = (file, obj) => fs.writeFileSync(file, typeof obj === "string" ? obj : JSON.stringify(obj, null, 2));
function run(expectOK, message) {
  const r = spawnSync(process.execPath, [script], { cwd:workspace, encoding:"utf8" });
  assert.equal(r.status === 0, expectOK, message + "\n" + r.stdout + r.stderr);
}
const batch = {
  id:"ing-20261023-test",
  processed_on:"2026-10-23",
  coverage:"visible-partial",
  withheld_count:1,
  items:[
    {id:"k01",kind:"concept",title:"기계적 검증을 위한 가상 개념",status:"integrated",targets:[{doc_id:"sample",section:"분석"}]},
    {id:"k02",kind:"curation",title:"미완인 가상 목록",status:"pending",targets:[],reason:"검수 전"}
  ]
};
try {
  fs.mkdirSync(base, {recursive:true});
  fs.mkdirSync(path.dirname(manifestPath), {recursive:true});
  put(manifestPath, {documents:[{id:"sample",path:"wiki/sample.md"}]});
  put(articlePath, "# 임시 문서\n\n## 분석\n\n본 사례는 프로그램 테스트용 자료이다.\n");
  put(indexPath,{version:1,description:"Test data",batches:[batch.id]});
  put(batchPath,batch);
  run(true,"valid ledger must pass");

  put(batchPath,{...batch,items:[{...batch.items[0],targets:[{doc_id:"sample",section:"없는 소제목"}]}]});
  run(false,"missing heading must fail");

  put(batchPath,{...batch,transcript:"private text"});
  run(false,"unexpected raw transcript field must fail");

  put(batchPath,{...batch,items:[{...batch.items[0],title:"https://chatgpt.com/share/private"}]});
  run(false,"URLs in knowledge titles must fail");

  put(batchPath,batch);
  put(path.join(base,"ing-20261023-orphan.json"),{});
  run(false,"unindexed batch must fail");
  console.log("OK: editorial validator fixture checks passed");
} finally {
  fs.rmSync(workspace, {recursive:true,force:true});
}
