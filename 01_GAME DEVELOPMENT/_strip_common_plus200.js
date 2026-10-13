"use strict";
/**
 * Remove shared VQ_PLUS_200 blocks from every game.js.
 * Never touches Relixia / Alexia.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SKIP = /RELIXIA|Alexia|FROZEN|_APP_SHARED|node_modules/;
const MARK = "/* === VQ_PLUS_200:";

function walk(dir, out) {
  if (SKIP.test(dir)) return;
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/node_modules|public|dist|_APP/.test(e.name)) continue;
      walk(full, out);
    } else if (e.name === "game.js") out.push(full);
  }
}

const files = [];
walk(ROOT, files);

let stripped = 0;
let skipped = 0;
for (const file of files) {
  if (SKIP.test(file)) { skipped++; continue; }
  let src = fs.readFileSync(file, "utf8");
  const idx = src.indexOf(MARK);
  if (idx === -1) {
    // also try alternate marker forms
    const idx2 = src.indexOf("VQ_PLUS_200");
    if (idx2 === -1) { skipped++; continue; }
    // find line start of that block comment
    const lineStart = src.lastIndexOf("\n", idx2);
    const cut = lineStart === -1 ? 0 : lineStart;
    // only cut if it looks like our appended block near end
    if (cut < src.length * 0.5) { skipped++; continue; }
    src = src.slice(0, cut).replace(/\s*$/, "\n");
    fs.writeFileSync(file, src);
    stripped++;
    continue;
  }
  src = src.slice(0, idx).replace(/\s*$/, "\n");
  fs.writeFileSync(file, src);
  stripped++;
}

console.log(JSON.stringify({ stripped, skipped, total: files.length }, null, 2));
console.log("Common VQ_PLUS_200 removed. Relixia untouched.");
