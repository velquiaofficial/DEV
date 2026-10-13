"use strict";
/**
 * 300_MARKET_GAMES — +100 demand games (ports 5401–5500). Relixia untouched.
 * Reuses _market_engine.js (+ dodge / catch kinds).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "300_MARKET_GAMES");
const ENGINE_SRC = path.join(__dirname, "_market_engine.js");
const SERVER_SRC = path.join(__dirname, "14_BOARDGAME", "01_ISLEBOUND", "vq-server.js");
const GEN200 = path.join(__dirname, "_gen_market_200.js");

// Pull THEMES + shell helpers by requiring duplicated minimal copies
const THEMES = {
  dusk: { bg: "#0d1b2a", bg2: "#1b263b", panel: "rgba(13,27,42,.92)", ink: "#e0eefc", muted: "#8ea9c1", accent: "#4cc9f0", accent2: "#f72585", line: "rgba(76,201,240,.25)", glow: "rgba(76,201,240,.16)", glow2: "rgba(247,37,133,.12)", board: "#0b1320" },
  orchard: { bg: "#1b4332", bg2: "#081c15", panel: "rgba(27,67,50,.92)", ink: "#e8fff3", muted: "#95d5b2", accent: "#95d5b2", accent2: "#f4a261", line: "rgba(149,213,178,.25)", glow: "rgba(149,213,178,.18)", glow2: "rgba(244,162,97,.12)", board: "#2d6a4f" },
  candy: { bg: "#3a0ca3", bg2: "#7209b7", panel: "rgba(58,12,163,.9)", ink: "#fff0f6", muted: "#f8b4d9", accent: "#f72585", accent2: "#4cc9f0", line: "rgba(247,37,133,.3)", glow: "rgba(247,37,133,.2)", glow2: "rgba(76,201,240,.12)", board: "#240046" },
  ink: { bg: "#111", bg2: "#222", panel: "rgba(20,20,20,.92)", ink: "#f1f3f5", muted: "#adb5bd", accent: "#ffd166", accent2: "#06d6a0", line: "rgba(255,209,102,.25)", glow: "rgba(255,209,102,.14)", glow2: "rgba(6,214,160,.1)", board: "#1a1a1a" },
  paper: { bg: "#f1faee", bg2: "#e9edc9", panel: "rgba(255,255,255,.9)", ink: "#1d3557", muted: "#457b9d", accent: "#e63946", accent2: "#1d3557", line: "rgba(29,53,87,.15)", glow: "rgba(230,57,70,.12)", glow2: "rgba(69,123,157,.1)", board: "#f8f9fa" },
  magma: { bg: "#1a0a0a", bg2: "#3d0c02", panel: "rgba(40,10,10,.92)", ink: "#ffe5d9", muted: "#f4a261", accent: "#e76f51", accent2: "#ffd166", line: "rgba(231,111,81,.3)", glow: "rgba(231,111,81,.18)", glow2: "rgba(255,209,102,.1)", board: "#1b100a" },
  ice: { bg: "#023e8a", bg2: "#0077b6", panel: "rgba(2,62,138,.9)", ink: "#caf0f8", muted: "#90e0ef", accent: "#00b4d8", accent2: "#ffd166", line: "rgba(144,224,239,.3)", glow: "rgba(0,180,216,.2)", glow2: "rgba(255,209,102,.1)", board: "#03045e" },
  meadow: { bg: "#606c38", bg2: "#283618", panel: "rgba(40,54,24,.92)", ink: "#fefae0", muted: "#dda15e", accent: "#bc6c25", accent2: "#fefae0", line: "rgba(221,161,94,.3)", glow: "rgba(188,108,37,.16)", glow2: "rgba(254,250,224,.08)", board: "#283618" },
  neon: { bg: "#10002b", bg2: "#240046", panel: "rgba(16,0,43,.92)", ink: "#e0aaff", muted: "#c77dff", accent: "#7b2cbf", accent2: "#ff6d00", line: "rgba(199,125,255,.3)", glow: "rgba(123,44,191,.2)", glow2: "rgba(255,109,0,.12)", board: "#0a0014" },
  sand: { bg: "#582f0e", bg2: "#7f4f24", panel: "rgba(88,47,14,.92)", ink: "#faedcd", muted: "#d4a373", accent: "#ccd5ae", accent2: "#e9c46a", line: "rgba(204,213,174,.25)", glow: "rgba(233,196,106,.16)", glow2: "rgba(212,163,115,.12)", board: "#3a1f0a" }
};

const THEME_KEYS = Object.keys(THEMES);

const KIND_META = {
  merge: { keys: ["<kbd>←↑→↓</kbd><span>合成</span>"], rules: ["同数合体", "詰みで終了"] },
  idle: { keys: ["<span>オーブをクリック</span>", "<span>強化を購入</span>"], rules: ["自動収入を伸ばせ"] },
  survivor: { keys: ["<kbd>WASD</kbd><span>移動</span>"], rules: ["自動攻撃", "レベルアップ"] },
  tower: { keys: ["<span>クリックで砲台</span>"], rules: ["進路禁止", "ウェーブ防衛"] },
  word: { keys: ["<kbd>A-Z</kbd>/<kbd>Enter</kbd>"], rules: ["6手以内"] },
  quiz: { keys: ["<span>選択肢クリック</span>"], rules: ["全問でスコア"] },
  runner: { keys: ["<kbd>←→</kbd>レーン"], rules: ["回避とコイン"] },
  card: { keys: ["<span>カード</span>", "<kbd>E</kbd>終了"], rules: ["敵HP0で勝利"] },
  sudoku: { keys: ["<kbd>1-9</kbd>"], rules: ["ユニーク制約"] },
  farm: { keys: ["<span>植え付け／収穫</span>"], rules: ["成熟で売却"] },
  dodge: { keys: ["<kbd>矢印/WASD</kbd>移動"], rules: ["弾幕回避", "HP0で終了"] },
  catch: { keys: ["<kbd>←→</kbd>バスケット"], rules: ["良い物を取れ", "毒/ミス3で終了"] }
};

const BATCHES = [
  { kind: "merge", tag: "合成パズル", lead: "数字を合成して高タイルを作れ。", params: { size: 4, goal: 2048 }, names: ["SUMFORGE", "TWINCELL", "GRIDGLOW", "DOUBLERUNE", "FOLDCORE", "PAIRPULSE", "MERGEBAY", "SYNTHTILE"] },
  { kind: "idle", tag: "放置クリッカー", lead: "タップと強化で資源帝国を回せ。", params: { unit: "G", tap: 1 }, names: ["TAPFORGE", "AUTOVINE", "COINMILL", "DRILLBAY", "IDLEORBIT", "PROFITPOD", "CLICKREEF", "YIELDHIVE"] },
  { kind: "survivor", tag: "サバイバー", lead: "自動攻撃で群れを薙ぎ払い生き残れ。", params: {}, names: ["HORDEFALL", "BLADEORBIT", "SWARMRUN", "VITALRING", "MOBWAVE", "ASHCIRCLE", "SURGEARENA", "PERIMETER"] },
  { kind: "tower", tag: "タワーディフェンス", lead: "砲台を置いて進路を死守せよ。", params: {}, names: ["BASTIONX", "ROUTEHOLD", "SPIKEGRID", "KEEPFIRE", "WALLPULSE", "TURRETLINE", "GATEWATCH", "PATHSEAL"] },
  { kind: "word", tag: "単語当て", lead: "英単語を色ヒントで推測。", params: { len: 5 }, names: ["GLYPHTRY", "LETTERBAY", "TYPEVEIL", "CLUEGRID", "WORDORBIT", "HINTLANE", "ALPHALOCK", "SPELLDOCK"] },
  { kind: "quiz", tag: "四択クイズ", lead: "テンポ良い四択で知識スコア。", params: {}, names: ["FACTDART", "QUIZBEAM", "BRAINLINE", "TRIVIABOX", "MINDCHIP", "ANSWERPAD", "KNOWWAVE", "TESTSPARK"] },
  { kind: "runner", tag: "レーンラン", lead: "3レーンで障害を避け距離を稼げ。", params: {}, names: ["DASHCORE", "LANEBEAT", "SPRINTORB", "BOLTPATH", "RUNPULSE", "STRIDERX", "VELOCITY", "RUSHDOCK"] },
  { kind: "card", tag: "カードバトル", lead: "コスト管理で敵を削りきれ。", params: {}, names: ["DECKSPIKE", "HANDSTORM", "CARDVAULT", "MANABRIDGE", "SLASHDECK", "ARCANEHAND", "DUELPORT", "TRICKLANE"] },
  { kind: "sudoku", tag: "数独", lead: "9×9を論理で埋めろ。", params: { holes: 40 }, names: ["NINELOCK", "DIGITKEEP", "SUDOPULSE", "BOXLOGIC", "CELLCRAFT", "ROWSEAL", "GRIDMIND", "NUMBERDOCK"] },
  { kind: "farm", tag: "農場シミュ", lead: "植え付けから収穫まで回す畑経営。", params: {}, names: ["SOILLOOP", "HARVESTX", "CROPORBIT", "PLOTWAVE", "SEEDMILL", "BARNPULSE", "FIELDCHIP", "GROWDOCK"] },
  { kind: "dodge", tag: "弾幕回避", lead: "弾の雨をすり抜けて生存時間を伸ばせ。", params: { pattern: "fan" }, names: ["BULLETRAIN", "DODGECORE", "VEILSTEP", "SHIFTORBIT", "DANCERING", "MIRAGEPAD", "SLIPWAVE", "AVOIDDOCK"] },
  { kind: "catch", tag: "キャッチアクション", lead: "落ちてくる好物を受け止め、毒は避けろ。", params: {}, names: ["CATCHBAY", "FALLGLOW", "BASKETRX", "DROPPULSE", "GRABORBIT", "CATCHLINE", "FRUITDOCK", "TIMINGPOD"] }
];

// Build exactly 100: take first names round-robin until 100
function buildCatalog() {
  const out = [];
  let i = 0;
  while (out.length < 100) {
    for (const b of BATCHES) {
      if (out.length >= 100) break;
      const name = b.names[i % b.names.length] + (i >= b.names.length ? String((i / b.names.length) | 0) : "");
      // ensure unique brand
      const brand = name.replace(/[^A-Z0-9]/g, "").slice(0, 12);
      const num = String(out.length + 1).padStart(3, "0");
      const theme = THEME_KEYS[out.length % THEME_KEYS.length];
      out.push({
        dir: `${num}_${brand}`,
        brand,
        kind: b.kind,
        theme,
        tag: b.tag,
        lead: b.lead,
        params: b.params
      });
    }
    i++;
  }
  return out;
}

function shellCss(theme) {
  return `:root{--bg:${theme.bg};--panel:${theme.panel};--ink:${theme.ink};--muted:${theme.muted};--accent:${theme.accent};--accent2:${theme.accent2};--line:${theme.line};--font-d:'Outfit',system-ui,sans-serif;--font-b:'Zen Maru Gothic','Hiragino Sans',sans-serif}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;color:var(--ink);font-family:var(--font-b)}
body{background:radial-gradient(900px 500px at 10% -10%,${theme.glow},transparent 55%),radial-gradient(700px 400px at 100% 0%,${theme.glow2},transparent 50%),linear-gradient(160deg,${theme.bg},${theme.bg2})}
.shell{max-width:1100px;margin:0 auto;padding:28px 20px 48px}
.eyebrow{margin:0;letter-spacing:.14em;text-transform:uppercase;font:700 .72rem var(--font-d);color:var(--accent)}
h1{margin:.2rem 0 .4rem;font:800 clamp(2rem,5vw,3.1rem)/1 var(--font-d)}
.lead{margin:0;max-width:40rem;color:var(--muted);line-height:1.55}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:18px}
@media(max-width:860px){.layout{grid-template-columns:1fr}}
.board-wrap,.panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:14px}
canvas{display:block;width:100%;height:auto;border-radius:12px;background:#000;touch-action:none}
.status{margin:10px 0 0;color:var(--muted);font-size:.92rem;min-height:1.4em}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.stat{background:rgba(255,255,255,.05);border:1px solid var(--line);border-radius:12px;padding:10px}
.stat span{display:block;font:700 .68rem var(--font-d);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.stat strong{font:800 1.35rem/1.1 var(--font-d)}
button{appearance:none;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--ink);border-radius:12px;padding:10px 12px;font:700 .95rem var(--font-b);cursor:pointer;width:100%;margin-top:8px}
button.primary{background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:#111}
.keys,.rules{list-style:none;padding:0;margin:12px 0 0;display:grid;gap:6px;color:var(--muted);font-size:.85rem}
.keys kbd{display:inline-block;padding:2px 6px;margin-right:4px;border:1px solid var(--line);border-radius:6px;font:700 .75rem var(--font-d);color:var(--ink)}
.rules{padding-left:1.1rem;list-style:disc}
`;
}

function indexHtml(g) {
  return `<!DOCTYPE html>
<html lang="ja"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${g.brand} — VELQUIA</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&family=Zen+Maru+Gothic:wght@500;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="style.css">
</head><body>
<main class="shell">
<header>
<p class="eyebrow">Market wave 3 · ${g.tag}</p>
<h1>${g.brand}</h1>
<p class="lead">${g.lead}</p>
</header>
<div class="layout">
<section class="board-wrap">
<canvas id="board" width="720" height="480"></canvas>
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
</body></html>
`;
}

const catalog = buildCatalog();
// fix duplicate brands
const seen = new Set();
catalog.forEach((g, idx) => {
  let b = g.brand;
  if (seen.has(b)) b = b.slice(0, 8) + String(idx);
  seen.add(b);
  g.brand = b;
  g.dir = String(idx + 1).padStart(3, "0") + "_" + b;
});

if (!fs.existsSync(ENGINE_SRC) || !fs.existsSync(SERVER_SRC)) {
  console.error("missing templates");
  process.exit(1);
}
const engine = fs.readFileSync(ENGINE_SRC, "utf8");
const server = fs.readFileSync(SERVER_SRC, "utf8");
fs.mkdirSync(ROOT, { recursive: true });

const ports = [];
catalog.forEach((g, i) => {
  const port = 5401 + i;
  const theme = THEMES[g.theme];
  const km = KIND_META[g.kind];
  const dest = path.join(ROOT, g.dir);
  fs.mkdirSync(dest, { recursive: true });
  fs.writeFileSync(path.join(dest, "index.html"), indexHtml(g), "utf8");
  fs.writeFileSync(path.join(dest, "style.css"), shellCss(theme), "utf8");
  fs.writeFileSync(
    path.join(dest, "game.js"),
    `"use strict";\nwindow.VQ_MARKET = ${JSON.stringify({
      brand: g.brand,
      kind: g.kind,
      key: "vq_mkt3_" + g.brand.toLowerCase() + "_v1",
      theme,
      params: g.params,
      keys: km.keys,
      rules: km.rules
    }, null, 2)};\n`,
    "utf8"
  );
  fs.writeFileSync(path.join(dest, "engine.js"), engine, "utf8");
  fs.writeFileSync(path.join(dest, "vq-server.js"), server, "utf8");
  fs.writeFileSync(path.join(dest, "port.txt"), String(port), "utf8");
  fs.writeFileSync(
    path.join(dest, "start-server.bat"),
    `@echo off\ncd /d "%~dp0"\necho Starting ${g.brand} on port ${port} ...\nset PORT=${port}\nset VQ_OPEN=1\nnode vq-server.js\npause\n`,
    "utf8"
  );
  fs.writeFileSync(
    path.join(dest, "product.json"),
    JSON.stringify({ id: "300_MARKET_GAMES/" + g.dir, brand: g.brand, kind: g.kind, genre: g.tag, port, theme: g.theme, standalone: true, version: "1.0.0" }, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(dest, "README.md"),
    `# ${g.brand}\n\n> VELQUIA / 300_MARKET_GAMES · ${g.tag}\n\n## 概要\n\n${g.lead}\n\nエンジン kind: \`${g.kind}\`\n\n## 起動\n\n\`start-server.bat\` → http://127.0.0.1:${port}/\n\nRelixia 非破壊。\n`,
    "utf8"
  );
  ports.push(`${port}\t${g.dir}\t${g.brand}\t${g.kind}`);
  console.log("created", g.dir, g.kind, port);
});

fs.writeFileSync(path.join(ROOT, "PORTS.txt"), ports.join("\n") + "\n", "utf8");
fs.writeFileSync(
  path.join(ROOT, "README.md"),
  `# 300_MARKET_GAMES\n\n需要ジャンル第3波 **${catalog.length}** 本。\n\n- 既存 kind に加え **dodge（弾幕回避）** / **catch（キャッチ）** を追加\n- ポート \`5401\`–\`${5400 + catalog.length}\`\n\n各タイトルの README / start-server.bat を参照。Relixia 非対象。\n`,
  "utf8"
);

// refresh root index
fs.writeFileSync(
  path.join(__dirname, "README.md"),
  `# 01_GAME DEVELOPMENT — README 索引

各ゲーム／アプリフォルダに \`README.md\` があります。

## ゲーム

- [\`300_MARKET_GAMES\`](./300_MARKET_GAMES/README.md) … 需要ジャンル第3波 **100本**（dodge/catch 含む）
- [\`200_MARKET_GAMES\`](./200_MARKET_GAMES/README.md) … 需要ジャンル **100本**
- [\`100_ARCADE\`](./100_ARCADE/README.md) … アーケード **15本**
- \`02_PUZZLE\` … \`14_BOARDGAME\` 既存タイトル群

おおよそ **300本超**（マーケット200 + アーケード15 + アプリ85 + 既存）。

Relixia（\`01_PROJECT\`）は自動生成対象外。

## 再生成

\`\`\`bash
node _gen_market_300.js
node _gen_market_200.js
node _gen_arcade_100.js
\`\`\`
`,
  "utf8"
);

console.log("done", catalog.length, "→", ROOT);
// silence unused
void GEN200;
