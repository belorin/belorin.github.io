#!/usr/bin/env node
// Generate the basic wiki and every preset (plus a layered combination) into a
// temporary folder, then build, check and render static pages for each.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const create = path.join(here, "create-wiki.mjs");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "starter-"));
const node = (args, cwd) => execFileSync(process.execPath, args, { cwd, stdio: "pipe", encoding: "utf8" });
const presets = fs.readdirSync(path.join(here, "presets")).filter(n => fs.existsSync(path.join(here, "presets", n, "preset.json")));
const cases = [[""], ...presets.map(p => [p]), ["research,timeline"]];

try {
  for (const [preset] of cases) {
    const name = preset || "base";
    const out = path.join(tmp, name.replace(",", "+"));
    const repo = name === "base" ? "tester.github.io" : "wiki-" + name.replace(",", "-");
    node([create, "--out", out, "--owner", "tester", "--repo", repo, ...(preset ? ["--preset", preset] : [])], here);
    node(["scripts/build.mjs", "--check"], out);
    node(["scripts/build-static.mjs", "_site"], out);
    const config = JSON.parse(fs.readFileSync(path.join(out, "site.config.json"), "utf8"));
    const data = JSON.parse(fs.readFileSync(path.join(out, "notes.json"), "utf8"));
    const base = name === "base" ? "/" : "/" + repo + "/";
    assert.ok(data.notes.length >= 2, name + ": has documents");
    assert.equal(data.site.url, "https://tester.github.io" + base, name + ": site url");
    for (const n of data.notes) assert.ok(fs.existsSync(path.join(out, "_site/notes", n.id, "index.html")), name + ": static page " + n.id);
    const page = fs.readFileSync(path.join(out, "_site/notes", data.notes[0].id, "index.html"), "utf8");
    assert.ok(page.includes(`href="${base}style.css?v=`), name + ": static page uses the base path");
    const index = fs.readFileSync(path.join(out, "index.html"), "utf8");
    assert.equal(index.includes('href="#calendar"'), config.features.calendar === true, name + ": calendar link follows config");
    for (const file of ["README.md", "AGENTS.md", "wiki/manifest.json", "wiki/start-here.md"]) {
      assert.doesNotMatch(fs.readFileSync(path.join(out, file), "utf8"), /\{\{|your-github-id|belorin/, name + ": " + file + " fully filled");
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(out, "wiki/manifest.json"), "utf8"));
    for (const d of manifest.documents) {
      assert.equal(d.title, fs.readFileSync(path.join(out, d.path), "utf8").match(/^# (.+)$/m)[1], name + ": title of " + d.id + " follows its heading");
    }
    // Every declared type has a template, and new-doc.mjs can use it.
    for (const [type, t] of Object.entries(config.types)) {
      assert.ok(fs.existsSync(path.join(out, t.template)), name + ": template for " + type);
      node(["scripts/new-doc.mjs", type, "x-" + type, "시험 " + type], out);
    }
    node(["scripts/build.mjs", "--check"], out); // unpublished new documents do not break the build
    console.log("OK: " + name + " (" + data.notes.length + " documents, " + Object.keys(config.types).length + " types)");
  }
  assert.throws(() => node([create, "--out", path.join(tmp, "base"), "--owner", "tester"], here), /not empty/s, "refuses a non-empty folder");
  console.log("OK: starter kit generates " + cases.length + " wikis");
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
