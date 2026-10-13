"use strict";
/**
 * Loop ~300 titles (except Alexia/Relixia), elevate each carefully & uniquely.
 * One folder at a time — no shared runtime dependency introduced.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SKIP = /RELIXIA|Alexia|FROZEN|_APP_SHARED|node_modules|\\public$|\\dist$|_loop|_deep|_elev|_flatten|_make|_gen/;

function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }
function exists(p) { return fs.existsSync(p); }

function hashHue(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  // avoid purple band ~260-300
  let hue = h % 340;
  if (hue > 250 && hue < 310) hue = (hue + 80) % 340;
  return hue;
}

function themeFromName(name) {
  const hue = hashHue(name);
  const h2 = (hue + 42) % 360;
  return {
    hue,
    accent: `hsl(${hue} 52% 56%)`,
    accent2: `hsl(${h2} 58% 52%)`,
    bg: `hsl(${hue} 18% 7%)`,
    bg2: `hsl(${hue} 16% 11%)`,
    ink: "#eef2f4",
    muted: "hsl(200 10% 62%)"
  };
}

function collectTargets() {
  const out = [];
  const seen = new Set();
  function add(dir) {
    const norm = path.resolve(dir);
    if (seen.has(norm) || SKIP.test(norm)) return;
    if (!exists(path.join(norm, "index.html")) && !exists(path.join(norm, "public", "index.html"))) return;
    seen.add(norm);
    out.push(norm);
  }

  for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!ent.isDirectory() || SKIP.test(ent.name)) continue;
    const m = ent.name.match(/^(\d+)_/);
    if (m) {
      const n = +m[1];
      if (n >= 15 && n <= 315) add(path.join(ROOT, ent.name));
    }
  }

  const genre = [
    "02_PUZZLE", "03_RHYTHM", "05_PARTY", "06_CARD",
    "08_AISHO", "09_COOKING", "10_FASHION", "12_PRESENT", "13_TRAVEL", "14_BOARDGAME",
    "07_MATCHING", "11_MATCHING"
  ];
  function walk(dir) {
    if (SKIP.test(dir)) return;
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (/node_modules|public|dist/.test(e.name)) continue;
        walk(full);
      } else if (e.name === "index.html") add(dir);
    }
  }
  for (const g of genre) {
    const base = path.join(ROOT, g);
    if (exists(base)) walk(base);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function brandOf(dir) {
  const base = path.basename(dir);
  const m = base.match(/^\d+_(.+)$/);
  return m ? m[1].replace(/_/g, " ") : base;
}

function ensureServer(dir) {
  if (exists(path.join(dir, "server.js"))) return false;
  const src = path.join(ROOT, "02_PUZZLE", "02_PRISM_SHIFT", "server.js");
  if (!exists(src)) return false;
  write(path.join(dir, "server.js"), read(src));
  return true;
}

function ensurePort(dir, used) {
  const pf = path.join(dir, "port.txt");
  if (exists(pf)) {
    const p = Number(String(read(pf)).trim());
    if (p && !used.has(p)) { used.add(p); return p; }
    if (p && used.has(p)) {
      // collision — reassign
    } else if (p) { used.add(p); return p; }
  }
  let p = 5700;
  while (used.has(p)) p++;
  used.add(p);
  write(pf, String(p) + "\n");
  return p;
}

function ensureBat(dir, port) {
  const name = path.basename(dir);
  const body = `@echo off
cd /d "%~dp0"
echo Starting ${name} on port ${port} ...
set PORT=${port}
set VQ_OPEN=1
node server.js
pause
`;
  write(path.join(dir, "start-server.bat"), body);
}

function elevateApp(dir, t) {
  const brand = brandOf(dir);
  const id = path.basename(dir);
  let changed = [];

  // unique CSS appendix
  const shell = path.join(dir, "shell.css");
  if (exists(shell)) {
    let css = read(shell);
    const marker = `/* loop-elevate:${id} */`;
    if (!css.includes(marker)) {
      // strip prior loop markers for this re-run cleanliness
      css = css.replace(/\/\* loop-elevate:[\s\S]*?(?=\/\* loop-elevate:|$)/g, "").trimEnd() + "\n";
      css += `
${marker}
.app.loop-brand {
  --bg: ${t.bg};
  --bg-elev: ${t.bg2};
  --accent: ${t.accent};
  --accent2: ${t.accent2};
  --ink: ${t.ink};
  --muted: ${t.muted};
  --display: "Fraunces", "IBM Plex Sans JP", serif;
  --line-strong: color-mix(in srgb, ${t.accent} 40%, transparent);
}
.app.loop-brand .brand {
  font-family: var(--display);
  font-weight: 700;
  font-size: 1.45rem;
  letter-spacing: -0.02em;
}
.app.loop-brand .brand small {
  display: block; margin-top: 0.3rem;
  font-size: 0.7rem; font-weight: 500; color: var(--muted);
  font-family: "IBM Plex Sans JP", sans-serif;
}
.app.loop-brand .side {
  background: linear-gradient(180deg, color-mix(in srgb, ${t.bg2} 90%, black), ${t.bg});
  border-right-color: color-mix(in srgb, ${t.accent} 28%, transparent);
}
.app.loop-brand .nav-btn.active {
  background: color-mix(in srgb, ${t.accent} 16%, transparent);
  border-color: color-mix(in srgb, ${t.accent} 40%, transparent);
}
.app.loop-brand .top h1 { font-family: var(--display); font-weight: 700; }
.app.loop-brand .workspace-banner { border-color: color-mix(in srgb, ${t.accent} 30%, transparent); }
.app.loop-brand .primary, .app.loop-brand button.primary {
  background: linear-gradient(135deg, ${t.accent2}, ${t.accent});
  color: #141008; border: none;
}
`;
      write(shell, css);
      changed.push("shell");
    }
  }

  const idx = path.join(dir, "index.html");
  if (exists(idx)) {
    let html = read(idx);
    const before = html;
    html = html.replace(/lang="en"/, 'lang="ja"');
    if (!html.includes("loop-brand") && html.includes('class="app"')) {
      html = html.replace('class="app"', 'class="app loop-brand"');
    } else if (!html.includes("loop-brand") && /class="app [^"]*"/.test(html)) {
      html = html.replace(/class="app /, 'class="app loop-brand ');
    }
    if (!html.includes("Fraunces") && html.includes("fonts.googleapis")) {
      html = html.replace(
        /href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+"/,
        'href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Sans+JP:wght@400;500;600;700&display=swap"'
      );
    }
    // theme-color from bg
    if (/theme-color" content="/.test(html)) {
      html = html.replace(/theme-color" content="[^"]*"/, `theme-color" content="${hslToHex(t.bg)}"`);
    }
    if (html !== before) { write(idx, html); changed.push("html"); }
  }

  // product.json — fix obvious mojibake / bump
  const pj = path.join(dir, "product.json");
  if (exists(pj)) {
    try {
      let raw = read(pj);
      let data;
      try { data = JSON.parse(raw); } catch { data = {}; }
      const looksBroken = /逕|繝|縺|蜉|繧/.test(JSON.stringify(data));
      if (looksBroken || !data.brand) {
        data.id = data.id || id;
        data.brand = data.brand && !looksBroken ? data.brand : brand.replace(/\s+/g, "");
        data.title = looksBroken || !data.title ? `${data.brand} — VELQUIA` : data.title;
        data.lead = looksBroken || !data.lead ? `${data.brand} スタンドアロンデモ。このフォルダだけで動作します。` : data.lead;
        data.status = data.status || "demo";
        data.standalone = true;
        data.version = "2.1.0";
        write(pj, JSON.stringify(data, null, 2) + "\n");
        changed.push("product");
      } else if (!data.standalone || data.version !== "2.1.0") {
        data.standalone = true;
        data.version = "2.1.0";
        write(pj, JSON.stringify(data, null, 2) + "\n");
        changed.push("product");
      }
    } catch { /* ignore */ }
  }

  writeReadme(dir, brand, "app", t);
  changed.push("readme");
  return changed;
}

function hslToHex(hsl) {
  // hsl(H S% L%) approx to hex for meta
  const m = String(hsl).match(/hsl\((\d+)/);
  if (!m) return "#0a1218";
  const h = (+m[1]) / 360, s = 0.18, l = 0.07;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * c).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function elevateGame(dir, t) {
  const brand = brandOf(dir);
  const id = path.basename(dir);
  const changed = [];

  const style = path.join(dir, "style.css");
  if (exists(style)) {
    let css = read(style);
    const marker = `/* loop-elevate:${id} */`;
    if (!css.includes(marker)) {
      css = css.replace(/\/\* loop-elevate:[\s\S]*$/m, "").trimEnd() + "\n";
      css += `
${marker}
:root{
  --loop-accent:${t.accent};
  --loop-accent2:${t.accent2};
}
.eyebrow{color:var(--loop-accent)!important}
button.primary,#btn-start,#action-btn{
  background:linear-gradient(135deg,var(--loop-accent2),var(--loop-accent))!important;
  color:#141008!important;border:none!important;
}
`;
      write(style, css);
      changed.push("style");
    }
  }

  const idx = path.join(dir, "index.html");
  if (exists(idx)) {
    let html = read(idx);
    const before = html;
    html = html.replace(/lang="en"/, 'lang="ja"');
    if (!html.includes("Fraunces") && html.includes("fonts.googleapis.com")) {
      html = html.replace(
        /href="https:\/\/fonts\.googleapis\.com\/css2\?[^"]+"/,
        'href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Sans+JP:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap"'
      );
    }
    if (html !== before) { write(idx, html); changed.push("html"); }
  }

  // drop orphan engine if index no longer loads it
  const ej = path.join(dir, "engine.js");
  const idxPath = path.join(dir, "index.html");
  if (exists(ej) && exists(idxPath) && !read(idxPath).includes("engine.js")) {
    try { fs.unlinkSync(ej); changed.push("drop-engine"); } catch { /* */ }
  }

  writeReadme(dir, brand, "game", t);
  changed.push("readme");
  return changed;
}

function writeReadme(dir, brand, kind, t) {
  const id = path.basename(dir);
  const port = exists(path.join(dir, "port.txt")) ? String(read(path.join(dir, "port.txt"))).trim() : "?";
  const body = `# ${brand}

> VELQUIA ${kind === "app" ? "アプリ" : "ゲーム"} · \`${id}\`  
> 単独フォルダ完結 · port **${port}**

## 起動

\`start-server.bat\` → http://127.0.0.1:${port}/

## メモ

- Alexia / Relixia とは独立
- テーマアクセント: ${t.accent}
- バージョンループ更新: 2.1.0
`;
  write(path.join(dir, "README.md"), body);
}

// ───────── MAIN LOOP ─────────
const targets = collectTargets();
const usedPorts = new Set();
// seed used ports
for (const dir of targets) {
  const pf = path.join(dir, "port.txt");
  if (exists(pf)) {
    const p = Number(String(read(pf)).trim());
    if (p) usedPorts.add(p);
  }
}

const stats = { total: targets.length, apps: 0, games: 0, other: 0, errors: [] };
const log = [];

console.log("Loop targets:", targets.length);

for (let i = 0; i < targets.length; i++) {
  const dir = targets[i];
  const rel = path.relative(ROOT, dir);
  if (SKIP.test(dir) || /RELIXIA|Alexia|FROZEN/.test(dir)) {
    log.push({ i, rel, skip: true });
    continue;
  }
  try {
    const t = themeFromName(path.basename(dir));
    const isApp = exists(path.join(dir, "shell.css")) && exists(path.join(dir, "app-kit.js"));
    const isGame = exists(path.join(dir, "game.js")) || exists(path.join(dir, "style.css"));

    ensureServer(dir);
    const port = ensurePort(dir, usedPorts);
    ensureBat(dir, port);

    let changed;
    if (isApp) {
      changed = elevateApp(dir, t);
      stats.apps++;
    } else if (isGame) {
      changed = elevateGame(dir, t);
      stats.games++;
    } else {
      // public-only vite apps etc.
      writeReadme(dir, brandOf(dir), "app", t);
      stats.other++;
      changed = ["readme"];
    }

    if ((i + 1) % 25 === 0 || i === 0 || i === targets.length - 1) {
      console.log(`[${i + 1}/${targets.length}] ${rel} · ${changed.join(",")}`);
    }
    log.push({ i, rel, changed, port });
  } catch (e) {
    stats.errors.push(rel + ": " + e.message);
    console.error("ERR", rel, e.message);
  }
}

write(path.join(ROOT, "_loop_elevate_300_log.json"), JSON.stringify({ stats, log }, null, 2));
console.log(JSON.stringify(stats, null, 2));
console.log("Alexia/Relixia never touched.");
