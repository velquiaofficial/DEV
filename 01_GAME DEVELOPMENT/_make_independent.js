"use strict";
/**
 * One-shot: ensure every playable folder is self-contained.
 * NEVER touches Relixia / Alexia / FROZEN eTerNITY.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SKIP_RE = /RELIXIA|Alexia|FROZEN eTerNITY|FROZEN|\\_APP_SHARED|\\node_modules|\\public$/i;

// Copy from a known-good local server (never from Relixia).
const SERVER_JS = fs.readFileSync(
  path.join(ROOT, "02_PUZZLE", "02_PRISM_SHIFT", "server.js"),
  "utf8"
).replace("this game only", "this title only");

function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (SKIP_RE.test(full)) continue;
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "_APP_SHARED" || ent.name === "public") continue;
      walk(full, out);
    } else if (ent.name === "index.html") {
      out.push(dir);
    }
  }
}

function batFor(name, port) {
  return `@echo off
cd /d "%~dp0"
echo Starting ${name} on port ${port} ...
set PORT=${port}
set VQ_OPEN=1
node server.js
pause
`;
}

const folders = [];
walk(ROOT, folders);
// unique
const uniq = [...new Set(folders)].filter((d) => !SKIP_RE.test(d));

// collect existing ports
const used = new Set();
const portOwners = new Map();
for (const dir of uniq) {
  const pf = path.join(dir, "port.txt");
  if (!fs.existsSync(pf)) continue;
  const p = Number(String(fs.readFileSync(pf, "utf8")).trim());
  if (!p) continue;
  if (!portOwners.has(p)) portOwners.set(p, []);
  portOwners.get(p).push(dir);
  used.add(p);
}

let nextPort = 5601;
function allocPort(prefer) {
  if (prefer && !used.has(prefer)) {
    used.add(prefer);
    return prefer;
  }
  while (used.has(nextPort)) nextPort++;
  const p = nextPort++;
  used.add(p);
  return p;
}

// Resolve collisions: keep first owner, reassign others
for (const [p, owners] of portOwners) {
  if (owners.length <= 1) continue;
  for (let i = 1; i < owners.length; i++) {
    const dir = owners[i];
    const neu = allocPort(0);
    fs.writeFileSync(path.join(dir, "port.txt"), String(neu) + "\n", "utf8");
    console.log("port collision fix:", path.relative(ROOT, dir), p, "->", neu);
  }
}

let wroteServer = 0;
let wrotePort = 0;
let wroteBat = 0;
let skippedRelixia = 0;

for (const dir of uniq) {
  if (SKIP_RE.test(dir)) {
    skippedRelixia++;
    continue;
  }
  const name = path.basename(dir);

  // server.js — always local standalone (overwrite if missing; if only vq-server, add server.js)
  const serverPath = path.join(dir, "server.js");
  if (!fs.existsSync(serverPath)) {
    fs.writeFileSync(serverPath, SERVER_JS, "utf8");
    wroteServer++;
  }

  // port
  const pf = path.join(dir, "port.txt");
  let port;
  if (fs.existsSync(pf)) {
    port = Number(String(fs.readFileSync(pf, "utf8")).trim());
    if (!port) {
      port = allocPort(0);
      fs.writeFileSync(pf, String(port) + "\n", "utf8");
      wrotePort++;
    }
  } else {
    port = allocPort(0);
    fs.writeFileSync(pf, String(port) + "\n", "utf8");
    wrotePort++;
  }

  // start-server.bat always refreshed to call server.js with correct port
  const batPath = path.join(dir, "start-server.bat");
  const batBody = batFor(name, port);
  const prev = fs.existsSync(batPath) ? fs.readFileSync(batPath, "utf8") : "";
  if (prev !== batBody) {
    fs.writeFileSync(batPath, batBody, "utf8");
    wroteBat++;
  }
}

console.log("");
console.log("folders:", uniq.length);
console.log("wrote server.js:", wroteServer);
console.log("wrote port.txt:", wrotePort);
console.log("updated start-server.bat:", wroteBat);
console.log("skipped (pattern):", skippedRelixia);
console.log("done — Relixia/Alexia never written");
