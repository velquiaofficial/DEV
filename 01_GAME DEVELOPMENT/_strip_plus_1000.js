"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const SKIP = /RELIXIA|Alexia|FROZEN|_APP_SHARED|node_modules/;
const MARK = "/* === VQ_PLUS_1000:";

function walk(dir, out) {
  if (SKIP.test(dir)) return;
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (/node_modules|public|dist|_APP/.test(e.name)) continue;
      walk(full, out);
    } else if (e.name === "game.js" || e.name === "app.js") out.push(full);
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
  if (idx === -1) { skipped++; continue; }
  src = src.slice(0, idx).replace(/\s*$/, "\n");
  fs.writeFileSync(file, src);
  stripped++;
}
console.log(JSON.stringify({ stripped, skipped, total: files.length }, null, 2));
