"use strict";
/**
 * Fix ports after loop bug (all ports were treated as collisions).
 * Deterministic unique ports from folder numbers. Never touches Relixia.
 */
const fs = require("fs");
const path = require("path");
const ROOT = __dirname;
const SKIP = /RELIXIA|Alexia|FROZEN|_APP_SHARED|node_modules/;

function write(p, s) { fs.writeFileSync(p, s, "utf8"); }
function exists(p) { return fs.existsSync(p); }

function portFor(rel, basename) {
  const m = basename.match(/^(\d+)_(.+)$/);
  if (m) {
    const n = +m[1];
    if (n >= 15 && n <= 99) return 5600 + n;           // 5615-5699
    if (n >= 101 && n <= 315) return 5200 + (n - 100); // 5201-5415
  }
  // genre nested — hash path into 6100+
  let h = 0;
  for (let i = 0; i < rel.length; i++) h = (h * 33 + rel.charCodeAt(i)) >>> 0;
  return 6100 + (h % 800);
}

const used = new Set();
const log = [];

function walk(dir, relBase) {
  if (SKIP.test(dir)) return;
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  const hasIndex = exists(path.join(dir, "index.html")) || exists(path.join(dir, "public", "index.html"));
  if (hasIndex && exists(path.join(dir, "server.js"))) {
    const rel = path.relative(ROOT, dir);
    const base = path.basename(dir);
    let port = portFor(rel, base);
    while (used.has(port)) port++;
    used.add(port);
    write(path.join(dir, "port.txt"), String(port) + "\n");
    write(path.join(dir, "start-server.bat"), `@echo off
cd /d "%~dp0"
echo Starting ${base} on port ${port} ...
set PORT=${port}
set VQ_OPEN=1
node server.js
pause
`);
    // refresh README port line if present
    const rm = path.join(dir, "README.md");
    if (exists(rm)) {
      let t = fs.readFileSync(rm, "utf8");
      t = t.replace(/port \*\*\d+\*\*/g, `port **${port}**`);
      t = t.replace(/127\.0\.0\.1:\d+/g, `127.0.0.1:${port}`);
      fs.writeFileSync(rm, t);
    }
    log.push({ rel, port });
  }
  for (const e of ents) {
    if (!e.isDirectory()) continue;
    if (/node_modules|public|dist|_APP/.test(e.name)) continue;
    if (SKIP.test(e.name)) continue;
    walk(path.join(dir, e.name), relBase);
  }
}

walk(ROOT, "");
console.log("fixed ports:", log.length);
console.log("sample:", log.filter((x) => /15_SOCIAL|16_SHORT|123_INK|101_DOT|315_/.test(x.rel)).slice(0, 8));
fs.writeFileSync(path.join(ROOT, "_fix_ports_log.json"), JSON.stringify(log, null, 2));
console.log("Relixia skipped by pattern.");
