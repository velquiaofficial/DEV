"use strict";
/**
 * Elevate non-Alexia titles toward a shared quality bar.
 * NEVER writes under Relixia / Alexia / FROZEN.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SKIP = /RELIXIA|Alexia|FROZEN/;

function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }
function exists(p) { return fs.existsSync(p); }

function listDirs(pred) {
  return fs.readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && pred(d.name) && !SKIP.test(d.name))
    .map((d) => path.join(ROOT, d.name));
}

function parseMarket(gameJs) {
  const brand = (gameJs.match(/"brand"\s*:\s*"([^"]+)"/) || [])[1] || "GAME";
  const lead = (gameJs.match(/"lead"\s*:\s*"([^"]+)"/) || [])[1] || "";
  const accent = (gameJs.match(/"accent"\s*:\s*"(#[0-9a-fA-F]+)"/) || [])[1] || "#78c4b8";
  const accent2 = (gameJs.match(/"accent2"\s*:\s*"(#[0-9a-fA-F]+)"/) || [])[1] || "#e8b84a";
  const bg = (gameJs.match(/"bg"\s*:\s*"(#[0-9a-fA-F]+)"/) || [])[1] || "#071018";
  const bg2 = (gameJs.match(/"bg2"\s*:\s*"(#[0-9a-fA-F]+)"/) || [])[1] || "#0e1c28";
  const ink = (gameJs.match(/"ink"\s*:\s*"(#[0-9a-fA-F]+)"/) || [])[1] || "#e6eef2";
  const muted = (gameJs.match(/"muted"\s*:\s*"(#[0-9a-fA-F]+)"/) || [])[1] || "#8aa0ad";
  return { brand, lead, accent, accent2, bg, bg2, ink, muted };
}

function elevateEngine(src) {
  const juice = `
  // ── elevated juice (SFX / shake / floats) ──
  let shake = 0;
  let floats = [];
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }
  function sfx(type) {
    try {
      ensureAudio();
      if (!audioCtx) return;
      const t0 = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      if (type === "ok") { o.type = "triangle"; o.frequency.setValueAtTime(520, t0); o.frequency.exponentialRampToValueAtTime(780, t0 + 0.08); g.gain.setValueAtTime(0.05, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12); }
      else if (type === "hit") { o.type = "square"; o.frequency.setValueAtTime(180, t0); o.frequency.exponentialRampToValueAtTime(90, t0 + 0.1); g.gain.setValueAtTime(0.04, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12); }
      else if (type === "clear") { o.type = "sine"; o.frequency.setValueAtTime(440, t0); o.frequency.exponentialRampToValueAtTime(880, t0 + 0.18); g.gain.setValueAtTime(0.06, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22); }
      else { o.type = "sine"; o.frequency.value = 330; g.gain.setValueAtTime(0.03, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08); }
      o.start(t0); o.stop(t0 + 0.25);
    } catch (e) { /* ignore */ }
  }
  function boom(x, y, color, n = 14) {
    burst(x, y, color, n);
    shake = Math.min(12, shake + 5);
    sfx("ok");
  }
  function floatText(x, y, text, color) {
    floats.push({ x, y, text, color: color || "#fff", life: 900, vy: -0.045 });
  }
  function stepJuice(dt) {
    if (shake > 0) shake = Math.max(0, shake - dt * 0.04);
    floats = floats.filter((f) => {
      f.life -= dt; f.y += f.vy * dt; return f.life > 0;
    });
  }
  function drawJuice() {
    floats.forEach((f) => {
      ctx.globalAlpha = Math.max(0, f.life / 900);
      ctx.fillStyle = f.color;
      ctx.font = "800 18px Outfit,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
  }
  function withShake(drawFn) {
    ctx.save();
    if (shake > 0) {
      ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
    }
    drawFn();
    ctx.restore();
  }
  function fillArena() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, M.theme.bg2 || M.theme.bg || "#122634");
    g.addColorStop(1, M.theme.board || M.theme.bg || "#0a141c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = M.theme.line || "rgba(120,196,184,.2)";
    ctx.strokeRect(8.5, 8.5, W - 17, H - 17);
  }
  function bindSwipe(handler) {
    let sx = 0, sy = 0;
    canvas.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
    canvas.addEventListener("pointerup", (e) => {
      const dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) < 28 && Math.abs(dy) < 28) return;
      if (Math.abs(dx) > Math.abs(dy)) handler(dx > 0 ? "R" : "L");
      else handler(dy > 0 ? "D" : "U");
    });
  }
`;

  let out = src;
  // inject juice after pick()
  if (!out.includes("function boom(")) {
    out = out.replace(
      /const pick = \(arr\) => arr\[\(Math\.random\(\) \* arr\.length\) \| 0\];\n/,
      `const pick = (arr) => arr[(Math.random() * arr.length) | 0];\n${juice}\n`
    );
  }

  // better overlay
  out = out.replace(
    /function overlay\(text\) \{[\s\S]*?\n  \}/,
    `function overlay(text) {
    ctx.fillStyle = "rgba(4,10,16,.55)";
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(W * 0.3, H * 0.4, W * 0.7, H * 0.6);
    grad.addColorStop(0, M.theme.accent || "#78c4b8");
    grad.addColorStop(1, M.theme.accent2 || "#e8b84a");
    ctx.fillStyle = grad;
    ctx.font = "800 40px Fraunces,Outfit,serif";
    ctx.textAlign = "center";
    ctx.fillText(text, W / 2, H / 2 - 4);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.font = "600 15px Outfit,sans-serif";
    ctx.fillText(M.brand, W / 2, H / 2 + 34);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "500 13px Outfit,sans-serif";
    ctx.fillText("クリック / はじめる で再開", W / 2, H / 2 + 58);
  }`
  );

  // enhance burst to also nudge shake lightly when already elevated
  out = out.replace(
    /function burst\(x, y, color, n = 10\) \{\n      for \(let i = 0; i < n; i\+\+\) \{\n        particles\.push\(\{\n          x, y, vx: rand\(-3, 3\), vy: rand\(-4, 1\), life: rand\(300, 700\), color, r: rand\(2, 4\)\n        \}\);\n      \}\n    \}/,
    `function burst(x, y, color, n = 10) {
      for (let i = 0; i < n; i++) {
        particles.push({
          x, y, vx: rand(-3.5, 3.5), vy: rand(-5, 1), life: rand(320, 820), color, r: rand(2, 5)
        });
      }
      if (typeof shake === "number") shake = Math.min(10, shake + 2);
    }`
  );

  // wire stepJuice into stepParticles calls conceptually by patching stepParticles
  out = out.replace(
    /function stepParticles\(dt\) \{\n      particles = particles\.filter\(\(p\) => \{\n        p\.life -= dt; p\.x \+= p\.vx; p\.y \+= p\.vy; p\.vy \+= 0\.12;\n        return p\.life > 0;\n      \}\);\n    \}/,
    `function stepParticles(dt) {
      particles = particles.filter((p) => {
        p.life -= dt; p.x += p.vx; p.y += p.vy; p.vy += 0.12;
        return p.life > 0;
      });
      if (typeof stepJuice === "function") stepJuice(dt);
    }`
  );

  out = out.replace(
    /function drawParticles\(\) \{\n      particles\.forEach\(\(p\) => \{\n        ctx\.globalAlpha = clamp\(p\.life \/ 700, 0, 1\);\n        ctx\.fillStyle = p\.color;\n        ctx\.beginPath\(\); ctx\.arc\(p\.x, p\.y, p\.r, 0, Math\.PI \* 2\); ctx\.fill\(\);\n      \}\);\n      ctx\.globalAlpha = 1;\n    \}/,
    `function drawParticles() {
      particles.forEach((p) => {
        ctx.globalAlpha = clamp(p.life / 700, 0, 1);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (typeof drawJuice === "function") drawJuice();
    }`
  );

  // mark header
  out = out.replace(
    "VELQUIA market-game engine — self-contained Canvas games.",
    "VELQUIA market-game engine — elevated juice build. Self-contained."
  );

  return out;
}

function marketStyle(t) {
  return `:root{
  --bg:${t.bg};--bg2:${t.bg2};--ink:${t.ink};--muted:${t.muted};
  --accent:${t.accent};--accent2:${t.accent2};
  --panel:rgba(8,18,26,.78);--line:color-mix(in srgb, var(--accent) 28%, transparent);
  --font-d:"Fraunces","Outfit",serif;--font-b:"IBM Plex Sans JP","Zen Maru Gothic",sans-serif;
}
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;color:var(--ink);font-family:var(--font-b);background:var(--bg)}
body{min-height:100vh;background:
  radial-gradient(900px 520px at 12% -8%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 55%),
  radial-gradient(700px 420px at 100% 0%, color-mix(in srgb, var(--accent2) 16%, transparent), transparent 50%),
  linear-gradient(165deg,var(--bg),var(--bg2) 55%,#081018);
  overflow-x:hidden}
body::before{content:"";position:fixed;inset:0;pointer-events:none;opacity:.035;z-index:0;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
.shell{position:relative;z-index:1;max-width:1120px;margin:0 auto;padding:28px 20px 56px}
header{animation:rise .7s ease both}
.eyebrow{margin:0;letter-spacing:.16em;text-transform:uppercase;font:600 .72rem var(--font-b);color:var(--accent)}
h1{margin:.25rem 0 .45rem;font:700 clamp(2.3rem,5.5vw,3.5rem)/1.02 var(--font-d);letter-spacing:-.02em;
  background:linear-gradient(120deg,var(--ink) 35%,var(--accent2));-webkit-background-clip:text;background-clip:text;color:transparent}
.lead{margin:0;max-width:38rem;color:var(--muted);line-height:1.55;font-size:.98rem}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:20px;margin-top:1.35rem;animation:rise .85s ease both .06s}
@media(max-width:900px){.layout{grid-template-columns:1fr}}
.board-wrap{padding:0;border:1px solid var(--line);background:linear-gradient(180deg,rgba(16,36,48,.9),rgba(8,18,26,.96));
  box-shadow:0 24px 60px rgba(0,0,0,.45)}
canvas{display:block;width:100%;height:auto;touch-action:none;background:#000}
.status{margin:.85rem 0 0;padding:0 4px;color:var(--muted);font-size:.92rem;min-height:1.45em}
.panel{padding:.2rem 0 0;animation:rise 1s ease both .12s}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.stat{padding:.65rem .5rem;border-top:1px solid var(--line);text-align:center}
.stat span{display:block;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.stat strong{font:600 1.3rem/1.15 var(--font-d)}
button{appearance:none;width:100%;margin-top:8px;border:1px solid var(--line);background:transparent;color:var(--ink);
  padding:.78rem 1rem;font:500 .92rem var(--font-b);cursor:pointer;transition:transform .15s ease,border-color .2s,filter .2s}
button:active{transform:translateY(1px)}
button.primary{background:linear-gradient(135deg,var(--accent2),color-mix(in srgb,var(--accent) 55%,var(--accent2)));
  border-color:transparent;color:#141008;font-weight:600}
button.primary:hover{filter:brightness(1.06)}
button:not(.primary):hover{border-color:var(--accent);color:var(--accent)}
.keys,.rules{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:7px;color:var(--muted);font-size:.84rem}
.keys kbd{display:inline-block;min-width:1.5em;padding:2px 6px;margin-right:5px;border:1px solid var(--line);font:600 .75rem var(--font-b);color:var(--ink)}
.rules{padding-left:1.1rem;list-style:disc}
@keyframes rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
`;
}

function marketIndex(t) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="${t.bg}">
  <title>${t.brand} — VELQUIA</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Sans+JP:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="shell">
    <header>
      <p class="eyebrow">VELQUIA · Standalone</p>
      <h1>${t.brand}</h1>
      <p class="lead">${t.lead}</p>
    </header>
    <div class="layout">
      <section class="board-wrap">
        <canvas id="board" width="720" height="480" aria-label="${t.brand}"></canvas>
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
  <script src="engine.js"></script>
</body>
</html>
`;
}

function arcadeStyle(hue, name) {
  const accent = `hsl(${hue} 55% 58%)`;
  const accent2 = `hsl(${(hue + 38) % 360} 62% 52%)`;
  return marketStyle({
    bg: "#071018", bg2: "#0e1c28", ink: "#e6eef2", muted: "#8aa0ad",
    accent, accent2
  }).replace("VELQUIA · Standalone", "") + `
/* arcade: ${name} */
.board-wrap{overflow:hidden}
canvas{image-rendering:auto}
`;
}

function elevateArcadeGameJs(src) {
  if (src.includes("VQ_ARCADE_JUICE")) return src;
  const inject = `
/* VQ_ARCADE_JUICE */
(function(){
  const c = document.getElementById("board");
  if (!c) return;
  let shake = 0;
  const _get = c.getContext.bind(c);
  // soft vignette helper available globally
  window.VQJuice = {
    shake(n){ shake = Math.min(14, shake + (n||4)); },
    frame(ctx, draw){
      if (shake>0){ ctx.save(); ctx.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake); draw(); ctx.restore(); shake*=0.88; }
      else draw();
    },
    beep(f){
      try{
        const AC = window.AudioContext||window.webkitAudioContext; if(!AC) return;
        const a = window.__vqAC || (window.__vqAC = new AC());
        if (a.state==="suspended") a.resume();
        const o=a.createOscillator(), g=a.createGain();
        o.connect(g); g.connect(a.destination);
        o.frequency.value=f||440; g.gain.value=0.04;
        o.start(); g.gain.exponentialRampToValueAtTime(0.001, a.currentTime+0.1); o.stop(a.currentTime+0.12);
      }catch(e){}
    }
  };
})();
`;
  return inject + "\n" + src;
}

function elevateAppShell(css) {
  // Retheme away from purple cliché toward ink-steel + teal/amber
  let out = css;
  out = out.replace(/#a594ff/gi, "#78c4b8");
  out = out.replace(/#6d4dff/gi, "#3d8f86");
  out = out.replace(/#7c5cff/gi, "#4a9a8e");
  out = out.replace(/rgba\(109,\s*77,\s*255/gi, "rgba(120, 196, 184");
  out = out.replace(/rgba\(165,\s*148,\s*255/gi, "rgba(232, 184, 74");
  out = out.replace(/--line-strong:[^;]+;/, "--line-strong: rgba(120, 196, 184, 0.35);");
  out = out.replace(/--purple:[^;]+;/, "--purple: #3d8f86;");
  out = out.replace(/--purple-2:[^;]+;/, "--purple-2: #4a9a8e;");
  out = out.replace(/--lavender:[^;]+;/, "--lavender: #78c4b8;");
  if (!out.includes("/* elevated-shell */")) {
    out = "/* elevated-shell */\n" + out;
    out += `
.app .main > .top { animation: vqRise .55s ease both; }
.app .card, .app .kpi-row > * { animation: vqRise .7s ease both; }
@keyframes vqRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.brand { letter-spacing: -0.02em; }
.workspace-banner { border-color: rgba(120,196,184,.25); }
`;
  }
  return out;
}

function elevateAppIndex(html) {
  return html
    .replace(/family=Inter[^"']*/g, "family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Sans+JP:wght@400;500;600;700&family=Outfit:wght@600;700;800")
    .replace(/lang="en"/, 'lang="ja"');
}

// ───────── RUN ─────────
let stats = { market: 0, arcade: 0, apps: 0, genreCss: 0, errors: [] };

const engineBasePath = path.join(ROOT, "216_SUMFORGE", "engine.js");
if (!exists(engineBasePath)) {
  console.error("Missing 216_SUMFORGE/engine.js");
  process.exit(1);
}
const elevatedEngine = elevateEngine(read(engineBasePath));
write(path.join(ROOT, "_elevated_market_engine.js"), elevatedEngine);

// Market 116-315
for (const dir of listDirs((n) => {
  const m = n.match(/^(\d{3})_/);
  if (!m) return false;
  const num = +m[1];
  return num >= 116 && num <= 315;
})) {
  try {
    const gj = path.join(dir, "game.js");
    if (!exists(gj)) { stats.errors.push(dir + " no game.js"); continue; }
    const meta = parseMarket(read(gj));
    write(path.join(dir, "engine.js"), elevatedEngine);
    write(path.join(dir, "style.css"), marketStyle(meta));
    write(path.join(dir, "index.html"), marketIndex(meta));
    stats.market++;
  } catch (e) {
    stats.errors.push(path.basename(dir) + ": " + e.message);
  }
}

// Arcade 101-115
const arcadeHues = [48, 12, 140, 200, 165, 320, 28, 210, 280, 90, 350, 55, 18, 230, 120];
listDirs((n) => {
  const m = n.match(/^(\d{3})_/);
  return m && +m[1] >= 101 && +m[1] <= 115;
}).sort().forEach((dir, i) => {
  try {
    const name = path.basename(dir);
    const hue = arcadeHues[i % arcadeHues.length];
    const accent = `hsl(${hue} 55% 58%)`;
    const accent2 = `hsl(${(hue + 40) % 360} 62% 52%)`;
    const leadMatch = exists(path.join(dir, "index.html"))
      ? (read(path.join(dir, "index.html")).match(/class="lead">([^<]+)/) || [])[1]
      : "";
    const brand = name.replace(/^\d+_/, "");
    write(path.join(dir, "style.css"), arcadeStyle(hue, brand));
    write(path.join(dir, "index.html"), marketIndex({
      brand, lead: leadMatch || `${brand} — VELQUIA arcade`,
      accent, accent2, bg: "#071018"
    }).replace('src="engine.js"></script>', "</script>").replace('<script src="game.js"></script>\n  \n', '<script src="game.js"></script>\n'));
    // fix: arcade has only game.js
    write(path.join(dir, "index.html"), `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#071018">
  <title>${brand} — VELQUIA</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=IBM+Plex+Sans+JP:wght@400;500;600&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="shell">
    <header>
      <p class="eyebrow">VELQUIA · Arcade</p>
      <h1>${brand}</h1>
      <p class="lead">${leadMatch || "矢印キーではじめる。ベストを更新しよう。"}</p>
    </header>
    <div class="layout">
      <section class="board-wrap">
        <canvas id="board" width="640" height="480" aria-label="${brand}"></canvas>
        <p id="status" class="status">はじめるを押してスタート</p>
      </section>
      <aside class="panel">
        <div class="stat-grid">
          <div class="stat"><span>スコア</span><strong id="score">0</strong></div>
          <div class="stat"><span>ベスト</span><strong id="best">0</strong></div>
          <div class="stat"><span>残機/段</span><strong id="lives">-</strong></div>
          <div class="stat"><span>状態</span><strong id="phase">READY</strong></div>
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
`);
    const gj = path.join(dir, "game.js");
    if (exists(gj)) write(gj, elevateArcadeGameJs(read(gj)));
    stats.arcade++;
  } catch (e) {
    stats.errors.push(path.basename(dir) + ": " + e.message);
  }
});

// Apps 15-99
const sharedShell = path.join(ROOT, "_APP_SHARED", "shell.css");
let newShell = null;
if (exists(sharedShell)) {
  newShell = elevateAppShell(read(sharedShell));
  write(sharedShell, newShell);
}
for (const dir of listDirs((n) => {
  const m = n.match(/^(\d{2})_/);
  return m && +m[1] >= 15 && +m[1] <= 99;
})) {
  try {
    const shell = path.join(dir, "shell.css");
    if (exists(shell) && newShell) write(shell, newShell);
    else if (exists(shell)) write(shell, elevateAppShell(read(shell)));
    const idx = path.join(dir, "index.html");
    if (exists(idx)) write(idx, elevateAppIndex(read(idx)));
    stats.apps++;
  } catch (e) {
    stats.errors.push(path.basename(dir) + ": " + e.message);
  }
}

// Genre boardgames UI polish — style.css only if thin
const genreTargets = [
  "14_BOARDGAME/02_GLINTBAZAAR",
  "14_BOARDGAME/03_RAILSPAN",
  "14_BOARDGAME/04_MOSAICCOURT",
  "14_BOARDGAME/05_CROWNSTACK",
  "03_RHYTHM/01_RYTHOM",
  "02_PUZZLE/02_PRISM_SHIFT"
];
for (const rel of genreTargets) {
  const dir = path.join(ROOT, rel);
  if (SKIP.test(dir) || !exists(dir)) continue;
  const stylePath = path.join(dir, "style.css");
  if (!exists(stylePath)) continue;
  let css = read(stylePath);
  if (!css.includes("/* elevated-genre */")) {
    css += `
/* elevated-genre */
body{animation:none}
.shell,main{animation:vqGRise .65s ease both}
@keyframes vqGRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
button.primary,#action-btn{transition:filter .2s ease,transform .15s ease}
button.primary:hover,#action-btn:hover{filter:brightness(1.06)}
`;
    write(stylePath, css);
    stats.genreCss++;
  }
}

console.log(JSON.stringify(stats, null, 2));
console.log("Alexia/Relixia untouched.");
