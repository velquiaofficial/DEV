"use strict";
/**
 * Deep-elevate ALL titles except Relixia/Alexia.
 * - merge: INKDOUBLE-class standalone (no engine.js)
 * - other market kinds: config + elevated engine inlined into game.js
 * - arcade / apps / genre: shell + independence polish
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SKIP_RE = /RELIXIA|Alexia|FROZEN|_APP_SHARED|_gen|_elev|_deep|_flatten|_make|_kind/;

function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }
function exists(p) { return fs.existsSync(p); }

function parseCfg(src) {
  const m = src.match(/window\.VQ_MARKET\s*=\s*(\{[\s\S]*\});?\s*$/m) ||
    src.match(/window\.VQ_MARKET\s*=\s*(\{[\s\S]*\});/);
  if (!m) return null;
  try {
    // eslint-disable-next-line no-new-func
    return new Function("return (" + m[1] + ")")();
  } catch {
    return null;
  }
}

function dePurple(theme) {
  const t = { ...(theme || {}) };
  const bad = /#(?:10002b|240046|7b2cbf|c77dff|e0aaff|6d4dff|a594ff|3a2460)/i;
  if (bad.test(t.bg || "") || bad.test(t.accent || "")) {
    t.bg = "#0a1218";
    t.bg2 = "#122430";
    t.panel = "rgba(12,28,38,.92)";
    t.ink = "#e6eef2";
    t.muted = "#8aa0ad";
    t.accent = "#78c4b8";
    t.accent2 = "#e8b84a";
    t.line = "rgba(120,196,184,.25)";
    t.glow = "rgba(120,196,184,.16)";
    t.glow2 = "rgba(232,184,74,.1)";
    t.board = "#0a141c";
  }
  return t;
}

const ENGINE = read(path.join(ROOT, "_elevated_market_engine.js"));
const INK_JS = read(path.join(ROOT, "123_INKDOUBLE", "game.js"));
const INK_CSS = read(path.join(ROOT, "123_INKDOUBLE", "style.css"));
const INK_HTML = read(path.join(ROOT, "123_INKDOUBLE", "index.html"));

function marketStyle(t) {
  t = dePurple(t);
  return `:root{
  --bg:${t.bg || "#071018"};--bg2:${t.bg2 || "#0e1c28"};--ink:${t.ink || "#e6eef2"};--muted:${t.muted || "#8aa0ad"};
  --accent:${t.accent || "#78c4b8"};--accent2:${t.accent2 || "#e8b84a"};
  --panel:rgba(8,18,26,.82);--line:color-mix(in srgb, var(--accent) 28%, transparent);
  --font-d:"Fraunces","Outfit",serif;--font-b:"IBM Plex Sans JP",sans-serif;
}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;color:var(--ink);font-family:var(--font-b);background:var(--bg)}
body{min-height:100vh;background:
  radial-gradient(900px 520px at 12% -8%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 55%),
  radial-gradient(700px 420px at 100% 0%, color-mix(in srgb, var(--accent2) 16%, transparent), transparent 50%),
  linear-gradient(165deg,var(--bg),var(--bg2) 55%,#081018)}
body::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.04;z-index:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:28px 20px 56px}
header{animation:rise .7s ease both}
.eyebrow{margin:0;letter-spacing:.16em;text-transform:uppercase;font:600 .72rem var(--font-b);color:var(--accent)}
h1{margin:.25rem 0 .45rem;font:700 clamp(2.3rem,5.5vw,3.5rem)/1.02 var(--font-d);letter-spacing:-.02em;
  background:linear-gradient(120deg,var(--ink) 35%,var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{margin:0;max-width:38rem;color:var(--muted);line-height:1.55}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:20px;margin-top:1.35rem;animation:rise .85s ease both .06s}
@media(max-width:900px){.layout{grid-template-columns:1fr}}
.board-wrap{border:1px solid var(--line);background:linear-gradient(180deg,rgba(16,36,48,.9),rgba(8,18,26,.96));box-shadow:0 24px 60px rgba(0,0,0,.45)}
canvas{display:block;width:100%;height:auto;touch-action:none;background:#000}
.status{margin:.85rem 0 0;color:var(--muted);font-size:.92rem;min-height:1.45em}
.panel{padding:.2rem 0 0}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.stat{padding:.65rem .5rem;border-top:1px solid var(--line);text-align:center}
.stat span{display:block;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.stat strong{font:600 1.3rem/1.15 var(--font-d)}
button{appearance:none;width:100%;margin-top:8px;border:1px solid var(--line);background:transparent;color:var(--ink);
  padding:.78rem 1rem;font:500 .92rem var(--font-b);cursor:pointer}
button.primary{background:linear-gradient(135deg,var(--accent2),color-mix(in srgb,var(--accent) 55%,var(--accent2)));border:none;color:#141008;font-weight:600}
.keys,.rules{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:7px;color:var(--muted);font-size:.84rem}
.keys kbd{display:inline-block;min-width:1.5em;padding:2px 6px;margin-right:5px;border:1px solid var(--line);font:600 .75rem var(--font-b);color:var(--ink)}
.rules{padding-left:1.1rem;list-style:disc}
@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
`;
}

function marketHtml(cfg) {
  const t = dePurple(cfg.theme || {});
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="${t.bg || "#071018"}">
  <title>${cfg.brand} — VELQUIA</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Sans+JP:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="shell">
    <header>
      <p class="eyebrow">VELQUIA · Standalone · ${cfg.kind}</p>
      <h1>${cfg.brand}</h1>
      <p class="lead">${cfg.lead || ""}</p>
    </header>
    <div class="layout">
      <section class="board-wrap">
        <canvas id="board" width="720" height="480" aria-label="${cfg.brand}"></canvas>
        <p id="status" class="status">はじめるを押してスタート</p>
      </section>
      <aside class="panel">
        <div class="stat-grid">
          <div class="stat"><span>スコア</span><strong id="score">0</strong></div>
          <div class="stat"><span>ベスト</span><strong id="best">0</strong></div>
          <div class="stat"><span>状態値</span><strong id="lives">-</strong></div>
          <div class="stat"><span>フェーズ</span><strong id="phase">READY</strong></div>
        </div>
        <button id="btn-start" class="primary" type="button">はじめる</button>
        <button id="btn-pause" type="button">一時停止</button>
        <ul class="keys" id="keys"></ul>
        <ul class="rules" id="rules"></ul>
      </aside>
    </div>
  </main>
  <script src="game.js"></script>
</body>
</html>
`;
}

function buildMergeStandalone(cfg) {
  const t = dePurple(cfg.theme || {});
  const goal = (cfg.params && cfg.params.goal) || 2048;
  const size = (cfg.params && cfg.params.size) || 4;
  let js = INK_JS
    .replace(/INKDOUBLE — standalone ink-merge puzzle\./g, `${cfg.brand} — standalone merge puzzle.`)
    .replace(/const N = 4;/, `const N = ${size};`)
    .replace(/const GOAL = 2048;/, `const GOAL = ${goal};`)
    .replace(/const KEY = "velquia_inkdouble_v2";/, `const KEY = ${JSON.stringify(cfg.key || ("vq_" + cfg.brand.toLowerCase() + "_v2"))};`)
    .replace(/INKDOUBLE/g, cfg.brand);

  // theme colors in JS overlays/ink
  if (t.accent) {
    js = js.replace(/#e8d48a/g, t.accent2 || t.accent).replace(/#06d6a0/g, t.accent);
  }

  let css = INK_CSS
    .replace(/#0c0c0e/g, t.bg || "#0c0c0e")
    .replace(/#16161a/g, t.bg2 || "#16161a")
    .replace(/#f2efe6/g, t.ink || "#f2efe6")
    .replace(/#8a8680/g, t.muted || "#8a8680")
    .replace(/#e8d48a/g, t.accent2 || "#e8d48a")
    .replace(/#06d6a0/g, t.accent || "#06d6a0");

  let html = INK_HTML
    .replace(/INKDOUBLE/g, cfg.brand)
    .replace(/墨を滑らせ、同じ濃度を重ねて倍化させる。にじみが連鎖するとボーナス。/g, cfg.lead || "同じ数を合成して倍化。にじみ連鎖でボーナス。")
    .replace(/VELQUIA · Ink Merge/g, `VELQUIA · ${cfg.kind || "merge"}`)
    .replace(/content="#0c0c0e"/, `content="${t.bg || "#0c0c0e"}"`);

  return { js, css, html };
}

function buildInlined(cfg) {
  const clean = { ...cfg, theme: dePurple(cfg.theme) };
  const head = `"use strict";\n/* ${clean.brand} — standalone (inlined elevated engine). */\nwindow.VQ_MARKET = ${JSON.stringify(clean, null, 2)};\n`;
  // strip outer "use strict" from engine to avoid duplicate issues — keep as is after config
  const eng = ENGINE.replace(/^"use strict";\s*/, "");
  return head + eng;
}

function readmeFor(cfg, mode) {
  return `# ${cfg.brand}

> VELQUIA standalone · ${cfg.kind}

${cfg.lead || ""}

## 起動

\`start-server.bat\`（このフォルダのみ）

## 構成

| ファイル | 役割 |
|----------|------|
| \`game.js\` | ${mode === "merge" ? "完全独立ロジック（共有エンジンなし）" : "設定＋本編エンジン同梱（単体完結）"} |
| \`index.html\` / \`style.css\` | UI |
| \`server.js\` / \`port.txt\` | ローカル起動 |

Alexia / Relixia は変更しません。
`;
}

const stats = { merge: 0, inlined: 0, arcade: 0, apps: 0, genre: 0, skipped: 0, errors: [] };

// ── Market / numbered 101-315 with VQ_MARKET ──
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!ent.isDirectory() || SKIP_RE.test(ent.name)) continue;
  const m = ent.name.match(/^(\d{3})_/);
  if (!m) continue;
  const num = +m[1];
  if (num < 101 || num > 315) continue;
  if (ent.name === "123_INKDOUBLE") { stats.skipped++; continue; } // already deep

  const dir = path.join(ROOT, ent.name);
  const gj = path.join(dir, "game.js");
  if (!exists(gj)) continue;
  const raw = read(gj);
  if (!raw.includes("VQ_MARKET")) {
    // arcade-like already custom — light polish only later
    continue;
  }
  const cfg = parseCfg(raw);
  if (!cfg || !cfg.brand) {
    stats.errors.push(ent.name + " parse fail");
    continue;
  }

  try {
    if (cfg.kind === "merge") {
      const built = buildMergeStandalone(cfg);
      write(path.join(dir, "game.js"), built.js);
      write(path.join(dir, "style.css"), built.css);
      write(path.join(dir, "index.html"), built.html);
      stats.merge++;
    } else {
      write(path.join(dir, "game.js"), buildInlined(cfg));
      write(path.join(dir, "style.css"), marketStyle(cfg.theme));
      write(path.join(dir, "index.html"), marketHtml(cfg));
      stats.inlined++;
    }
    write(path.join(dir, "README.md"), readmeFor(cfg, cfg.kind === "merge" ? "merge" : "inline"));
    const ej = path.join(dir, "engine.js");
    if (exists(ej)) fs.unlinkSync(ej);
    // product.json bump
    const pj = path.join(dir, "product.json");
    if (exists(pj)) {
      try {
        const p = JSON.parse(read(pj));
        p.standalone = true;
        p.engine = cfg.kind === "merge" ? "none" : "inlined";
        p.version = "2.0.0";
        write(pj, JSON.stringify(p, null, 2) + "\n");
      } catch { /* ignore */ }
    }
  } catch (e) {
    stats.errors.push(ent.name + ": " + e.message);
  }
}

// ── Arcade 101-115: ensure index/style premium + juice flag ──
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!ent.isDirectory()) continue;
  const m = ent.name.match(/^(\d{3})_(.+)$/);
  if (!m) continue;
  const num = +m[1];
  if (num < 101 || num > 115) continue;
  const dir = path.join(ROOT, ent.name);
  const gj = path.join(dir, "game.js");
  if (!exists(gj)) continue;
  let js = read(gj);
  if (js.includes("VQ_MARKET")) continue; // handled above if any
  if (!js.includes("VQ_ARCADE_JUICE")) {
    js = `/* VQ_ARCADE_JUICE */\nwindow.VQJuice=window.VQJuice||{shake(){},frame(c,d){d()},beep(){}};\n` + js;
    write(gj, js);
  }
  // ensure no engine.js
  const ej = path.join(dir, "engine.js");
  if (exists(ej)) fs.unlinkSync(ej);
  const brand = m[2];
  const lead = exists(path.join(dir, "index.html"))
    ? ((read(path.join(dir, "index.html")).match(/class="lead">([^<]+)/) || [])[1] || "")
    : "";
  const hue = (num * 37) % 360;
  const theme = {
    bg: "#071018", bg2: "#0e1c28", ink: "#e6eef2", muted: "#8aa0ad",
    accent: `hsl(${hue} 55% 58%)`, accent2: `hsl(${(hue + 40) % 360} 62% 52%)`
  };
  write(path.join(dir, "style.css"), marketStyle(theme));
  write(path.join(dir, "index.html"), marketHtml({
    brand, kind: "arcade", lead: lead || `${brand} — VELQUIA arcade`, theme
  }).replace('width="720" height="480"', 'width="640" height="480"'));
  write(path.join(dir, "README.md"), readmeFor({ brand, kind: "arcade", lead: lead || brand }, "inline"));
  stats.arcade++;
}

// ── Apps 15-99: ensure elevated shell mark + JA lang ──
const sharedShell = path.join(ROOT, "_APP_SHARED", "shell.css");
let shell = exists(sharedShell) ? read(sharedShell) : null;
if (shell && !shell.includes("/* deep-elevate */")) {
  shell += `
/* deep-elevate */
.main .card:hover{border-color:rgba(120,196,184,.35)}
.primary,button.primary{transition:filter .2s ease,transform .15s ease}
.primary:hover,button.primary:hover{filter:brightness(1.05)}
.side .brand small{opacity:.75}
`;
  write(sharedShell, shell);
}
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!ent.isDirectory()) continue;
  const m = ent.name.match(/^(\d{2})_/);
  if (!m) continue;
  const num = +m[1];
  if (num < 15 || num > 99) continue;
  const dir = path.join(ROOT, ent.name);
  if (shell) {
    const sp = path.join(dir, "shell.css");
    if (exists(sp)) write(sp, shell);
  }
  const idx = path.join(dir, "index.html");
  if (exists(idx)) {
    let h = read(idx);
    h = h.replace(/lang="en"/, 'lang="ja"');
    if (!h.includes("Fraunces") && h.includes("fonts.googleapis")) {
      h = h.replace(
        /family=Inter[^"']*/,
        "family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Sans+JP:wght@400;500;600;700&family=Outfit:wght@600;700;800"
      );
    }
    write(idx, h);
  }
  // ensure server pack
  if (!exists(path.join(dir, "server.js"))) {
    const prism = path.join(ROOT, "02_PUZZLE", "02_PRISM_SHIFT", "server.js");
    if (exists(prism)) write(path.join(dir, "server.js"), read(prism));
  }
  stats.apps++;
}

// ── Genre nested games: mark elevated CSS, ensure server.js ──
function walkIndex(dir, out) {
  if (SKIP_RE.test(dir)) return;
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "dist" || e.name === "public") continue;
      walkIndex(full, out);
    } else if (e.name === "index.html") out.push(dir);
  }
}
const genreRoots = ["02_PUZZLE", "03_RHYTHM", "05_PARTY", "06_CARD", "08_AISHO", "09_COOKING", "10_FASHION", "12_PRESENT", "13_TRAVEL", "14_BOARDGAME", "07_MATCHING", "11_MATCHING"];
for (const gr of genreRoots) {
  const base = path.join(ROOT, gr);
  if (!exists(base)) continue;
  const folders = [];
  walkIndex(base, folders);
  for (const dir of folders) {
    if (SKIP_RE.test(dir)) continue;
    // skip if public/ is the served root only — still ok to touch style at root
    const style = path.join(dir, "style.css");
    const cssDir = path.join(dir, "css", "style.css");
    for (const sp of [style, cssDir]) {
      if (!exists(sp)) continue;
      let css = read(sp);
      if (!css.includes("/* deep-elevate */")) {
        css += `\n/* deep-elevate */\n.shell,main,#app{animation:deRise .65s ease both}@keyframes deRise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}\n`;
        write(sp, css);
        stats.genre++;
      }
    }
    if (!exists(path.join(dir, "server.js"))) {
      const prism = path.join(ROOT, "02_PUZZLE", "02_PRISM_SHIFT", "server.js");
      if (exists(prism)) write(path.join(dir, "server.js"), read(prism));
    }
  }
}

console.log(JSON.stringify(stats, null, 2));
console.log("Relixia/Alexia never written.");
