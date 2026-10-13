"use strict";
/**
 * Move games out of 100_ARCADE / 200_MARKET_GAMES / 300_MARKET_GAMES
 * into 01_GAME DEVELOPMENT as 101_NAME, 102_NAME, ... sequential.
 * Never touches Relixia / Alexia.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const CONTAINERS = ["100_ARCADE", "200_MARKET_GAMES", "300_MARKET_GAMES"];
const START = 101;

function listGames(containerDir) {
  if (!fs.existsSync(containerDir)) return [];
  return fs
    .readdirSync(containerDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const m = d.name.match(/^(\d+)_(.+)$/);
      if (!m) return null;
      return { oldName: d.name, num: Number(m[1]), slug: m[2], full: path.join(containerDir, d.name) };
    })
    .filter(Boolean)
    .sort((a, b) => a.num - b.num);
}

function patchBat(dir, newName, port) {
  const bat = path.join(dir, "start-server.bat");
  if (!fs.existsSync(bat)) return;
  const body = `@echo off
cd /d "%~dp0"
echo Starting ${newName} on port ${port} ...
set PORT=${port}
set VQ_OPEN=1
node server.js
pause
`;
  fs.writeFileSync(bat, body, "utf8");
}

function patchProduct(dir, newName, n) {
  const pj = path.join(dir, "product.json");
  if (!fs.existsSync(pj)) return;
  try {
    const data = JSON.parse(fs.readFileSync(pj, "utf8"));
    if (data.id) data.id = newName;
    if (data.slug) data.slug = newName.replace(/^\d+_/, "").toLowerCase();
    if (data.number != null) data.number = n;
    if (data.folder) data.folder = newName;
    fs.writeFileSync(pj, JSON.stringify(data, null, 2) + "\n", "utf8");
  } catch {
    /* ignore */
  }
}

const plan = [];
let n = START;
for (const c of CONTAINERS) {
  const games = listGames(path.join(ROOT, c));
  for (const g of games) {
    const newName = `${n}_${g.slug}`;
    const dest = path.join(ROOT, newName);
    plan.push({ from: g.full, to: dest, newName, n, container: c, oldName: g.oldName });
    n++;
  }
}

// preflight
const collisions = plan.filter((p) => fs.existsSync(p.to));
if (collisions.length) {
  console.error("DEST EXISTS — abort");
  for (const c of collisions) console.error(" ", c.to);
  process.exit(1);
}

console.log("Moving", plan.length, "games →", START, "..", n - 1);
for (const p of plan) {
  fs.renameSync(p.from, p.to);
  let port = "5173";
  const pf = path.join(p.to, "port.txt");
  if (fs.existsSync(pf)) port = String(fs.readFileSync(pf, "utf8")).trim() || port;
  patchBat(p.to, p.newName, port);
  patchProduct(p.to, p.newName, p.n);
  console.log(p.container + "/" + p.oldName, "->", p.newName);
}

// remove empty containers
for (const c of CONTAINERS) {
  const dir = path.join(ROOT, c);
  if (!fs.existsSync(dir)) continue;
  const left = fs.readdirSync(dir).filter((x) => x !== ".DS_Store" && x !== "Thumbs.db");
  if (left.length === 0) {
    fs.rmdirSync(dir);
    console.log("removed empty", c);
  } else {
    console.log("NOT empty, keep:", c, left);
  }
}

console.log("done. next free number:", n);
