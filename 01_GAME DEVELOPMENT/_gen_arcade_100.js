"use strict";
/**
 * 100_ARCADE — playable classic-inspired games (original names).
 * Same folder grain as TETORIS / ISLEBOUND: index + style + game + vq-server + port.
 * Relixia untouched.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "100_ARCADE");
const SERVER_SRC = path.join(__dirname, "14_BOARDGAME", "01_ISLEBOUND", "vq-server.js");

const GAMES = [
  { dir: "01_DOTMUNCH", brand: "DOTMUNCH", port: 5201, tag: "maze snack", lead: "迷路で粒を食べてゴーストから逃げる。矢印キーで移動。", kind: "pac" },
  { dir: "02_BRICKPULSE", brand: "BRICKPULSE", port: 5202, tag: "brick break", lead: "パドルで弾を跳ね返し、レンガをすべて壊せ。", kind: "breakout" },
  { dir: "03_SNAKEBIT", brand: "SNAKEBIT", port: 5203, tag: "grow crawl", lead: "餌を食べて伸びる。自分と壁に当たると終わり。", kind: "snake" },
  { dir: "04_STARSWARM", brand: "STARSWARM", port: 5204, tag: "sky defense", lead: "左右移動とスペースで射撃。群れを一掃せよ。", kind: "invaders" },
  { dir: "05_LILYPAD", brand: "LILYPAD", port: 5205, tag: "road hop", lead: "車と川を渡って向こう岸へ。時間切れ注意。", kind: "frog" },
  { dir: "06_PADDLEDUEL", brand: "PADDLEDUEL", port: 5206, tag: "vs AI", lead: "上下でパドル操作。AIと先に7点。", kind: "pong" },
  { dir: "07_ROCKFIELD", brand: "ROCKFIELD", port: 5207, tag: "spin & shoot", lead: "旋回・加速・射撃で岩を砕く。残骸にも注意。", kind: "asteroid" },
  { dir: "08_FLAPGLIDE", brand: "FLAPGLIDE", port: 5208, tag: "tap glide", lead: "スペース／クリックで羽ばたき、柱の間を抜けろ。", kind: "flap" },
  { dir: "09_GEMTRI", brand: "GEMTRI", port: 5209, tag: "match three", lead: "隣と入れ替えて3つ揃え。連鎖で高得点。", kind: "match3" },
  { dir: "10_SWEEPFIELD", brand: "SWEEPFIELD", port: 5210, tag: "clear mines", lead: "数字を手がかりに地雷を避けて開く。右クリックで旗。", kind: "mines" },
  { dir: "11_STACKDROP", brand: "STACKDROP", port: 5211, tag: "block stack", lead: "四角ブロックを積んで列消し。テトリス風の基本操作。", kind: "stack" },
  { dir: "12_MEMORYFLIP", brand: "MEMORYFLIP", port: 5212, tag: "pair memory", lead: "カードをめくってペアを揃えろ。手数を少なく。", kind: "memory" },
  { dir: "13_WHACKBURST", brand: "WHACKBURST", port: 5213, tag: "reaction", lead: "出てきたターゲットを素早く叩け。制限時間あり。", kind: "whack" },
  { dir: "14_AIRHOCK", brand: "AIRHOCK", port: 5214, tag: "table duel", lead: "マウス／矢印でマレット操作。AIとエアホッケー。", kind: "hockey" },
  { dir: "15_TUNNELRUN", brand: "TUNNELRUN", port: 5215, tag: "dodge dash", lead: "左右でレーン変更、障害を避けて距離を稼げ。", kind: "tunnel" }
];

function shellCss(theme) {
  return `:root{
  --bg:${theme.bg};--panel:${theme.panel};--ink:${theme.ink};--muted:${theme.muted};
  --accent:${theme.accent};--accent2:${theme.accent2};--line:${theme.line};
  --font-d:'Outfit',system-ui,sans-serif;--font-b:'Zen Maru Gothic','Hiragino Sans',sans-serif;
}
*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:var(--bg);color:var(--ink);font-family:var(--font-b)}
body{background:
  radial-gradient(900px 500px at 10% -10%,${theme.glow},transparent 55%),
  radial-gradient(700px 400px at 100% 0%,${theme.glow2},transparent 50%),
  linear-gradient(160deg,${theme.bg},${theme.bg2});
}
.shell{max-width:1100px;margin:0 auto;padding:28px 20px 48px}
.hero{margin-bottom:18px}
.eyebrow{margin:0;letter-spacing:.14em;text-transform:uppercase;font:700 .72rem var(--font-d);color:var(--accent)}
h1{margin:.2rem 0 .4rem;font:800 clamp(2rem,5vw,3.2rem)/1 var(--font-d);letter-spacing:.04em}
.lead{margin:0;max-width:40rem;color:var(--muted);line-height:1.55}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:18px;align-items:start}
@media(max-width:860px){.layout{grid-template-columns:1fr}}
.board-wrap{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:14px;box-shadow:0 20px 50px rgba(0,0,0,.25)}
canvas{display:block;width:100%;height:auto;border-radius:12px;background:#000;cursor:crosshair;touch-action:none}
.status{margin:10px 0 0;color:var(--muted);font-size:.92rem;min-height:1.4em}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:16px}
.scores{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
.scores article,.stat{background:rgba(255,255,255,.04);border:1px solid var(--line);border-radius:12px;padding:10px}
.scores span,.stat span{display:block;font:700 .68rem var(--font-d);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.scores strong,.stat strong{font:800 1.4rem/1.1 var(--font-d)}
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px}
button{appearance:none;border:1px solid var(--line);background:rgba(255,255,255,.06);color:var(--ink);border-radius:12px;padding:10px 12px;font:700 .95rem var(--font-b);cursor:pointer;width:100%;margin-top:8px}
button.primary,button#btn-start{background:linear-gradient(135deg,var(--accent),var(--accent2));border:none;color:#111}
button:disabled{opacity:.45;cursor:not-allowed}
.keys{list-style:none;padding:0;margin:14px 0 0;display:grid;gap:6px;color:var(--muted);font-size:.85rem}
.keys kbd{display:inline-block;min-width:1.6em;padding:2px 6px;margin-right:4px;border:1px solid var(--line);border-radius:6px;font:700 .75rem var(--font-d);color:var(--ink)}
.rules{margin:12px 0 0;padding-left:1.1rem;color:var(--muted);font-size:.85rem;line-height:1.45}
`;
}

function indexHtml(g) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0a0c10">
  <title>${g.brand} — VELQUIA</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;700;800&family=Zen+Maru+Gothic:wght@500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="shell">
    <header class="hero">
      <p class="eyebrow">Arcade trial · ${g.tag}</p>
      <h1>${g.brand}</h1>
      <p class="lead">${g.lead}</p>
    </header>
    <div class="layout">
      <section class="board-wrap">
        <canvas id="board" width="640" height="480" aria-label="${g.brand}"></canvas>
        <p id="status" class="status">はじめるを押してスタート</p>
      </section>
      <aside class="panel">
        <div class="stat-grid">
          <div class="stat"><span>スコア</span><strong id="score">0</strong></div>
          <div class="stat"><span>ベスト</span><strong id="best">0</strong></div>
          <div class="stat"><span>残機/段</span><strong id="lives">3</strong></div>
          <div class="stat"><span>状態</span><strong id="phase">READY</strong></div>
        </div>
        <button id="btn-start" type="button" class="primary">はじめる</button>
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

function bat(g) {
  return `@echo off
cd /d "%~dp0"
echo Starting ${g.brand} on port ${g.port} ...
set PORT=${g.port}
set VQ_OPEN=1
node vq-server.js
pause
`;
}

/* ========== GAME ENGINES ========== */

function jsPac() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const KEY = "vq_dotmunch_best";
  const TILE = 20;
  const COLS = 28, ROWS = 24;
  canvas.width = COLS * TILE; canvas.height = ROWS * TILE;

  // 0 wall 1 path 2 pellet 3 power
  const RAW = [
    "############################",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o####.#####.##.#####.####o#",
    "#..........................#",
    "#.####.##.########.##.####.#",
    "#......##....##....##......#",
    "######.##### ## #####.######",
    "     #.##          ##.#     ",
    "######.## ###--### ##.######",
    "      .   #      #   .      ",
    "######.## #      # ##.######",
    "     #.## ######## ##.#     ",
    "######.##          ##.######",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o..##................##..o#",
    "###.##.##.########.##.##.###",
    "#......##....##....##......#",
    "#.##########.##.##########.#",
    "#..........................#",
    "############################",
    "############################",
    "############################"
  ];

  let grid, player, ghosts, score, lives, phase, dir, nextDir, fright, raf, last;
  const bestEl = document.getElementById("best");
  bestEl.textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li><kbd>←↑→↓</kbd><span>移動</span></li><li><kbd>P</kbd><span>一時停止</span></li>";
  document.getElementById("rules").innerHTML = "<li>粒10点・パワーでゴースト逃走</li><li>全粒クリアでステージクリア</li>";

  function resetGrid() {
    grid = RAW.map((row) => row.split("").map((c) => c === "#" ? 0 : c === "o" ? 3 : c === "." ? 2 : c === "-" || c === " " ? 1 : 1));
  }
  function cell(x, y) {
    const c = Math.floor(x), r = Math.floor(y);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 0;
    return grid[r][c];
  }
  function canMove(x, y) { return cell(x, y) !== 0; }

  function spawn() {
    resetGrid();
    player = { x: 13.5, y: 17.5, speed: 0.12 };
    dir = { x: 0, y: 0 }; nextDir = { x: 0, y: 0 };
    ghosts = [
      { x: 13.5, y: 11.5, color: "#ff5a6a", mode: "scatter", tx: 1, ty: 1 },
      { x: 12.5, y: 11.5, color: "#5ad0ff", mode: "scatter", tx: 26, ty: 1 },
      { x: 14.5, y: 11.5, color: "#ff9ad4", mode: "scatter", tx: 1, ty: 22 },
      { x: 13.5, y: 10.5, color: "#ffb84d", mode: "scatter", tx: 26, ty: 22 }
    ];
    fright = 0;
  }

  function start() {
    score = 0; lives = 3; phase = "play"; fright = 0;
    spawn(); last = performance.now();
    setHud();
    cancelAnimationFrame(raf);
    loop(last);
    setStatus("粒を食べろ！");
  }

  function setHud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b));
    bestEl.textContent = b;
  }
  function setStatus(t) { document.getElementById("status").textContent = t; }

  function tryTurn(px, py, d) {
    const nx = px + d.x * 0.2, ny = py + d.y * 0.2;
    return canMove(nx, ny);
  }

  function moveEntity(e, d, speed) {
    if (d.x || d.y) {
      const nx = e.x + d.x * speed, ny = e.y + d.y * speed;
      if (canMove(nx, ny) && canMove(nx + (d.x > 0 ? 0.4 : d.x < 0 ? -0.4 : 0), ny + (d.y > 0 ? 0.4 : d.y < 0 ? -0.4 : 0))) {
        e.x = nx; e.y = ny;
      } else {
        // snap toward center of tile when blocked
        e.x = Math.round(e.x * 2) / 2;
        e.y = Math.round(e.y * 2) / 2;
      }
    }
    if (e.x < 0) e.x = COLS - 0.1;
    if (e.x >= COLS) e.x = 0.1;
  }

  function update(dt) {
    if (phase !== "play") return;
    if (fright > 0) fright -= dt;
    if (nextDir.x || nextDir.y) {
      if (tryTurn(player.x, player.y, nextDir)) dir = { ...nextDir };
    }
    moveEntity(player, dir, player.speed * (dt / 16));
    const c = Math.floor(player.x), r = Math.floor(player.y);
    if (grid[r] && grid[r][c] === 2) { grid[r][c] = 1; score += 10; setHud(); }
    if (grid[r] && grid[r][c] === 3) { grid[r][c] = 1; score += 50; fright = 6000; setHud(); setStatus("パワークック！"); }

    ghosts.forEach((g, i) => {
      const target = fright > 0
        ? { x: g.tx, y: g.ty }
        : (i % 2 === 0 ? { x: player.x, y: player.y } : { x: player.x + dir.x * 4, y: player.y + dir.y * 4 });
      const opts = [{ x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: -1 }];
      let best = opts[0], bestD = 1e9;
      opts.forEach((o) => {
        const nx = g.x + o.x * 0.15, ny = g.y + o.y * 0.15;
        if (!canMove(nx, ny)) return;
        const d = (nx - target.x) ** 2 + (ny - target.y) ** 2;
        const scoreD = fright > 0 ? -d : d;
        if (scoreD < bestD) { bestD = scoreD; best = o; }
      });
      moveEntity(g, best, (fright > 0 ? 0.07 : 0.09) * (dt / 16));
      const dx = g.x - player.x, dy = g.y - player.y;
      if (dx * dx + dy * dy < 0.35) {
        if (fright > 0) { score += 200; g.x = 13.5; g.y = 11.5; setHud(); }
        else {
          lives--; setHud();
          if (lives <= 0) { phase = "over"; setStatus("ゲームオーバー"); setHud(); }
          else { spawn(); setStatus("残機 -1"); }
        }
      }
    });

    let left = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === 2 || grid[y][x] === 3) left++;
    if (left === 0) { phase = "clear"; score += 500; setHud(); setStatus("クリア！もう一度はじめるで次へ"); }
  }

  function draw() {
    ctx.fillStyle = "#061018";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = grid[y][x];
        if (v === 0) {
          ctx.fillStyle = "#1a4d6e";
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
          ctx.strokeStyle = "#2d7aa8";
          ctx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
        } else if (v === 2) {
          ctx.fillStyle = "#f6e7b2";
          ctx.beginPath(); ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 2.2, 0, Math.PI * 2); ctx.fill();
        } else if (v === 3) {
          ctx.fillStyle = "#7ee0c6";
          ctx.beginPath(); ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 5, 0, Math.PI * 2); ctx.fill();
        }
      }
    }
    // player
    const ang = Math.atan2(dir.y, dir.x) || 0;
    const mouth = 0.35 + Math.sin(performance.now() / 80) * 0.2;
    ctx.fillStyle = "#ffe14a";
    ctx.beginPath();
    ctx.moveTo(player.x * TILE, player.y * TILE);
    ctx.arc(player.x * TILE, player.y * TILE, 8, ang + mouth, ang - mouth + Math.PI * 2);
    ctx.closePath(); ctx.fill();
    ghosts.forEach((g) => {
      ctx.fillStyle = fright > 0 ? "#4a6cff" : g.color;
      ctx.beginPath();
      ctx.arc(g.x * TILE, g.y * TILE, 8, Math.PI, 0);
      ctx.lineTo(g.x * TILE + 8, g.y * TILE + 8);
      ctx.lineTo(g.x * TILE + 4, g.y * TILE + 5);
      ctx.lineTo(g.x * TILE, g.y * TILE + 8);
      ctx.lineTo(g.x * TILE - 4, g.y * TILE + 5);
      ctx.lineTo(g.x * TILE - 8, g.y * TILE + 8);
      ctx.closePath(); ctx.fill();
    });
    if (phase === "over" || phase === "ready" || phase === "clear") {
      ctx.fillStyle = "rgba(0,0,0,.45)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "800 28px Outfit,sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : phase === "clear" ? "CLEAR" : "DOTMUNCH", canvas.width / 2, canvas.height / 2);
    }
  }

  function loop(t) {
    const dt = Math.min(32, t - last); last = t;
    update(dt); draw();
    if (phase === "play") raf = requestAnimationFrame(loop);
    else draw();
  }

  const mapKey = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
  window.addEventListener("keydown", (e) => {
    if (mapKey[e.key]) { nextDir = mapKey[e.key]; e.preventDefault(); }
    if (e.key === "p" || e.key === "P") {
      if (phase === "play") { phase = "pause"; setStatus("一時停止"); cancelAnimationFrame(raf); draw(); }
      else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); setStatus("再開"); }
    }
  });
  document.getElementById("btn-start").onclick = () => { phase = "play"; start(); };
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); setStatus("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; spawn(); draw();
})();
`;
}

function jsBreakout() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_brickpulse_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li><kbd>←→</kbd><span>パドル</span></li><li><kbd>Space</kbd><span>発射</span></li>";
  document.getElementById("rules").innerHTML = "<li>全消しでクリア</li><li>落とすと残機減少</li>";

  let paddle, ball, bricks, score, lives, phase, keys, raf, last, launched;

  function buildBricks() {
    bricks = [];
    const colors = ["#ff6b6b", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#b197fc"];
    for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) {
      bricks.push({ x: 24 + c * 60, y: 40 + r * 22, w: 54, h: 16, hp: 1, color: colors[r] });
    }
  }
  function resetBall() {
    ball = { x: paddle.x + paddle.w / 2, y: paddle.y - 10, vx: 0, vy: 0, r: 6 };
    launched = false;
  }
  function start() {
    score = 0; lives = 3; phase = "play"; keys = {};
    paddle = { x: 270, y: 440, w: 100, h: 12, speed: 7 };
    buildBricks(); resetBall(); last = performance.now();
    hud(); cancelAnimationFrame(raf); loop(last);
    status("スペースで発射");
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b));
    document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;
    if (keys.ArrowLeft) paddle.x -= paddle.speed * k;
    if (keys.ArrowRight) paddle.x += paddle.speed * k;
    paddle.x = Math.max(8, Math.min(canvas.width - paddle.w - 8, paddle.x));
    if (!launched) { ball.x = paddle.x + paddle.w / 2; ball.y = paddle.y - 10; return; }
    ball.x += ball.vx * k; ball.y += ball.vy * k;
    if (ball.x < ball.r || ball.x > canvas.width - ball.r) ball.vx *= -1;
    if (ball.y < ball.r) ball.vy *= -1;
    if (ball.y > canvas.height) {
      lives--; hud();
      if (lives <= 0) { phase = "over"; status("ゲームオーバー"); }
      else { resetBall(); status("スペースで再発射"); }
      return;
    }
    if (ball.y + ball.r >= paddle.y && ball.y + ball.r <= paddle.y + paddle.h && ball.x > paddle.x && ball.x < paddle.x + paddle.w && ball.vy > 0) {
      const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
      ball.vx = hit * 5; ball.vy = -Math.abs(ball.vy);
    }
    bricks = bricks.filter((b) => {
      if (ball.x > b.x && ball.x < b.x + b.w && ball.y > b.y && ball.y < b.y + b.h) {
        ball.vy *= -1; score += 20; hud(); return false;
      }
      return true;
    });
    if (!bricks.length) { phase = "clear"; score += 300; hud(); status("ステージクリア！"); }
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#140a1f"); g.addColorStop(1, "#0a1628");
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    bricks.forEach((b) => { ctx.fillStyle = b.color; ctx.fillRect(b.x, b.y, b.w, b.h); });
    ctx.fillStyle = "#e9ecef"; ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.fillStyle = "#ffd43b"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : phase === "clear" ? "CLEAR" : "BRICKPULSE", canvas.width / 2, canvas.height / 2);
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }

  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.code === "Space") {
      e.preventDefault();
      if (phase === "play" && !launched) { launched = true; ball.vx = 3.2; ball.vy = -4.2; status("ブレイク！"); }
    }
  });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; paddle = { x: 270, y: 440, w: 100, h: 12 }; buildBricks(); ball = { x: 320, y: 430, r: 6 }; draw();
})();
`;
}

function jsSnake() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const CELL = 20, COLS = 32, ROWS = 24;
  canvas.width = COLS * CELL; canvas.height = ROWS * CELL;
  const KEY = "vq_snakebit_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li><kbd>←↑→↓</kbd><span>方向</span></li>";
  document.getElementById("rules").innerHTML = "<li>餌+1節</li><li>壁・自分で終了</li>";

  let snake, dir, next, food, score, phase, acc, raf, last;

  function placeFood() {
    do {
      food = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some((s) => s.x === food.x && s.y === food.y));
  }
  function start() {
    snake = [{ x: 10, y: 12 }, { x: 9, y: 12 }, { x: 8, y: 12 }];
    dir = { x: 1, y: 0 }; next = { ...dir }; score = 0; phase = "play"; acc = 0;
    placeFood(); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last); status("はむはむ");
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = snake ? snake.length : 0;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function step() {
    if (next.x !== -dir.x || next.y !== -dir.y) dir = next;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || snake.some((s) => s.x === head.x && s.y === head.y)) {
      phase = "over"; status("ゲームオーバー"); hud(); return;
    }
    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) { score += 10; placeFood(); hud(); }
    else snake.pop();
  }

  function draw() {
    ctx.fillStyle = "#0b1a12"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if ((x + y) % 2 === 0) { ctx.fillStyle = "rgba(255,255,255,.03)"; ctx.fillRect(x * CELL, y * CELL, CELL, CELL); }
    }
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath(); ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, 7, 0, Math.PI * 2); ctx.fill();
    snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? "#69db7c" : "#2f9e44";
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    });
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : "SNAKEBIT", canvas.width / 2, canvas.height / 2);
    }
  }
  function loop(t) {
    const dt = t - last; last = t; acc += dt;
    const interval = Math.max(70, 140 - score);
    while (acc >= interval && phase === "play") { acc -= interval; step(); }
    draw(); if (phase === "play") raf = requestAnimationFrame(loop);
  }

  const map = { ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 } };
  window.addEventListener("keydown", (e) => { if (map[e.key]) { next = map[e.key]; e.preventDefault(); } });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; snake = [{ x: 10, y: 12 }]; food = { x: 20, y: 12 }; draw();
})();
`;
}

function jsInvaders() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_starswarm_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li><kbd>←→</kbd><span>移動</span></li><li><kbd>Space</kbd><span>射撃</span></li>";
  document.getElementById("rules").innerHTML = "<li>全滅でクリア</li><li>被弾・接地で残機減</li>";

  let ship, aliens, bullets, abullets, score, lives, phase, keys, raf, last, dir, tick, cool;

  function spawnAliens() {
    aliens = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
      aliens.push({ x: 60 + c * 60, y: 40 + r * 36, w: 28, h: 18, alive: true });
    }
  }
  function start() {
    score = 0; lives = 3; phase = "play"; keys = {}; dir = 1; tick = 0; cool = 0;
    ship = { x: 300, y: 430, w: 36, h: 14 }; bullets = []; abullets = [];
    spawnAliens(); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last); status("撃て！");
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16; cool = Math.max(0, cool - dt);
    if (keys.ArrowLeft) ship.x -= 5 * k;
    if (keys.ArrowRight) ship.x += 5 * k;
    ship.x = Math.max(10, Math.min(canvas.width - ship.w - 10, ship.x));
    if (keys[" "] && cool <= 0) { bullets.push({ x: ship.x + ship.w / 2, y: ship.y, vy: -8 }); cool = 220; }
    bullets.forEach((b) => b.y += b.vy * k);
    bullets = bullets.filter((b) => b.y > 0);
    tick += dt;
    if (tick > 500) {
      tick = 0;
      let minX = 1e9, maxX = 0, alive = aliens.filter((a) => a.alive);
      alive.forEach((a) => { minX = Math.min(minX, a.x); maxX = Math.max(maxX, a.x + a.w); });
      if (maxX > canvas.width - 20 || minX < 20) { dir *= -1; alive.forEach((a) => a.y += 16); }
      alive.forEach((a) => a.x += 12 * dir);
      if (alive.length && Math.random() < 0.35) {
        const a = alive[Math.floor(Math.random() * alive.length)];
        abullets.push({ x: a.x + a.w / 2, y: a.y + a.h, vy: 4 });
      }
    }
    abullets.forEach((b) => b.y += b.vy * k);
    abullets = abullets.filter((b) => b.y < canvas.height);
    bullets.forEach((b) => {
      aliens.forEach((a) => {
        if (!a.alive) return;
        if (b.x > a.x && b.x < a.x + a.w && b.y > a.y && b.y < a.y + a.h) {
          a.alive = false; b.y = -99; score += 25; hud();
        }
      });
    });
    abullets.forEach((b) => {
      if (b.x > ship.x && b.x < ship.x + ship.w && b.y > ship.y && b.y < ship.y + ship.h) {
        b.y = 999; lives--; hud();
        if (lives <= 0) { phase = "over"; status("ゲームオーバー"); }
      }
    });
    if (aliens.some((a) => a.alive && a.y + a.h >= ship.y)) { phase = "over"; status("侵入された…"); }
    if (aliens.every((a) => !a.alive)) { phase = "clear"; score += 400; hud(); status("クリア！"); }
  }

  function draw() {
    ctx.fillStyle = "#050816"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fillRect((i * 73) % 640, (i * 97) % 480, 2, 2); }
    aliens.forEach((a) => {
      if (!a.alive) return;
      ctx.fillStyle = "#74c0fc"; ctx.fillRect(a.x, a.y, a.w, a.h);
      ctx.fillStyle = "#fff"; ctx.fillRect(a.x + 6, a.y + 5, 4, 4); ctx.fillRect(a.x + 18, a.y + 5, 4, 4);
    });
    ctx.fillStyle = "#69db7c"; ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
    ctx.fillStyle = "#ffe066"; bullets.forEach((b) => ctx.fillRect(b.x - 2, b.y, 4, 10));
    ctx.fillStyle = "#ff8787"; abullets.forEach((b) => ctx.fillRect(b.x - 2, b.y, 4, 10));
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : phase === "clear" ? "CLEAR" : "STARSWARM", canvas.width / 2, canvas.height / 2);
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  window.addEventListener("keydown", (e) => { keys[e.key] = true; if (e.code === "Space") e.preventDefault(); });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; ship = { x: 300, y: 430, w: 36, h: 14 }; aliens = []; bullets = []; abullets = []; spawnAliens(); draw();
})();
`;
}

function jsFrog() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_lilypad_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li><kbd>←↑→↓</kbd><span>ジャンプ</span></li>";
  document.getElementById("rules").innerHTML = "<li>上端ゴールで得点</li><li>車・水・時間切れ注意</li>";

  let frog, cars, logs, score, lives, phase, timer, raf, last, cool;

  function resetFrog() { frog = { x: 310, y: 440, w: 22, h: 22 }; timer = 30; }
  function spawnTraffic() {
    cars = []; logs = [];
    for (let i = 0; i < 5; i++) cars.push({ x: Math.random() * 640, y: 360 - i * 28, w: 50, h: 20, vx: (i % 2 ? 1 : -1) * (2 + i * 0.3), color: ["#ff6b6b", "#ffa94d", "#ffd43b", "#da77f2", "#74c0fc"][i] });
    for (let i = 0; i < 4; i++) logs.push({ x: Math.random() * 640, y: 160 - i * 28, w: 70 + i * 10, h: 20, vx: (i % 2 ? -1 : 1) * (1.4 + i * 0.25) });
  }
  function start() {
    score = 0; lives = 3; phase = "play"; cool = 0;
    resetFrog(); spawnTraffic(); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last); status("向こう岸へ！");
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives + " / " + Math.ceil(timer);
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }
  function die() {
    lives--; hud();
    if (lives <= 0) { phase = "over"; status("ゲームオーバー"); }
    else { resetFrog(); status("やられた…"); }
  }
  function hit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16; cool = Math.max(0, cool - dt); timer -= dt / 1000; hud();
    if (timer <= 0) { die(); return; }
    cars.forEach((c) => { c.x += c.vx * k; if (c.x > 700) c.x = -80; if (c.x < -80) c.x = 700; });
    logs.forEach((l) => { l.x += l.vx * k; if (l.x > 720) l.x = -100; if (l.x < -100) l.x = 720; });
    cars.forEach((c) => { if (hit(frog, c)) die(); });
    // water zone y 60-180
    if (frog.y < 180 && frog.y > 40) {
      const on = logs.find((l) => hit(frog, l));
      if (on) frog.x += on.vx * k;
      else die();
    }
    if (frog.y <= 30) { score += 100; timer = 30; resetFrog(); hud(); status("ゴール！"); }
    if (frog.x < 0 || frog.x > canvas.width - frog.w) die();
  }

  function draw() {
    ctx.fillStyle = "#1b4332"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#40916c"; ctx.fillRect(0, 420, canvas.width, 60);
    ctx.fillStyle = "#2d6a4f"; ctx.fillRect(0, 0, canvas.width, 40);
    ctx.fillStyle = "#333"; ctx.fillRect(0, 220, canvas.width, 180);
    ctx.fillStyle = "#1d3557"; ctx.fillRect(0, 40, canvas.width, 180);
    logs.forEach((l) => { ctx.fillStyle = "#9c6644"; ctx.fillRect(l.x, l.y, l.w, l.h); });
    cars.forEach((c) => { ctx.fillStyle = c.color; ctx.fillRect(c.x, c.y, c.w, c.h); });
    ctx.fillStyle = "#95d5b2"; ctx.fillRect(frog.x, frog.y, frog.w, frog.h);
    ctx.fillStyle = "#081c15"; ctx.fillRect(frog.x + 4, frog.y + 5, 4, 4); ctx.fillRect(frog.x + 14, frog.y + 5, 4, 4);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : "LILYPAD", canvas.width / 2, canvas.height / 2);
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  window.addEventListener("keydown", (e) => {
    if (phase !== "play" || cool > 0) return;
    const step = 28;
    if (e.key === "ArrowLeft") { frog.x -= step; cool = 120; }
    if (e.key === "ArrowRight") { frog.x += step; cool = 120; }
    if (e.key === "ArrowUp") { frog.y -= step; cool = 120; }
    if (e.key === "ArrowDown") { frog.y = Math.min(440, frog.y + step); cool = 120; }
    e.preventDefault();
  });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; resetFrog(); spawnTraffic(); draw();
})();
`;
}

function jsPong() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_paddleduel_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li><kbd>↑↓</kbd><span>パドル</span></li><li><kbd>W S</kbd><span>も可</span></li>";
  document.getElementById("rules").innerHTML = "<li>先に7点で勝利</li><li>右はAI</li>";

  let you, ai, ball, scoreY, scoreA, phase, keys, raf, last;

  function serve(toRight) {
    ball = { x: 320, y: 240, vx: (toRight ? 1 : -1) * 4.2, vy: (Math.random() * 2 - 1) * 3, r: 7 };
  }
  function start() {
    scoreY = 0; scoreA = 0; phase = "play"; keys = {};
    you = { x: 24, y: 200, w: 12, h: 80 }; ai = { x: 604, y: 200, w: 12, h: 80 };
    serve(true); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last); status("試合開始");
  }
  function hud() {
    document.getElementById("score").textContent = scoreY + " - " + scoreA;
    document.getElementById("lives").textContent = "BO7";
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, scoreY);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;
    if (keys.ArrowUp || keys.w || keys.W) you.y -= 6 * k;
    if (keys.ArrowDown || keys.s || keys.S) you.y += 6 * k;
    you.y = Math.max(10, Math.min(canvas.height - you.h - 10, you.y));
    const target = ball.y - ai.h / 2;
    ai.y += Math.sign(target - ai.y) * Math.min(4.2 * k, Math.abs(target - ai.y));
    ai.y = Math.max(10, Math.min(canvas.height - ai.h - 10, ai.y));
    ball.x += ball.vx * k; ball.y += ball.vy * k;
    if (ball.y < ball.r || ball.y > canvas.height - ball.r) ball.vy *= -1;
    function bounce(p) {
      if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w && ball.y > p.y && ball.y < p.y + p.h) {
        ball.vx *= -1.05; ball.vy += (ball.y - (p.y + p.h / 2)) * 0.08;
        ball.x = p.x < 320 ? p.x + p.w + ball.r : p.x - ball.r;
      }
    }
    bounce(you); bounce(ai);
    if (ball.x < 0) { scoreA++; serve(true); hud(); if (scoreA >= 7) { phase = "over"; status("AIの勝ち"); } }
    if (ball.x > canvas.width) { scoreY++; serve(false); hud(); if (scoreY >= 7) { phase = "clear"; status("あなたの勝ち！"); } }
  }

  function draw() {
    ctx.fillStyle = "#111"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,.2)"; ctx.setLineDash([8, 10]);
    ctx.beginPath(); ctx.moveTo(320, 0); ctx.lineTo(320, 480); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#4cc9f0"; ctx.fillRect(you.x, you.y, you.w, you.h);
    ctx.fillStyle = "#f72585"; ctx.fillRect(ai.x, ai.y, ai.w, ai.h);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    ctx.font = "800 36px Outfit"; ctx.textAlign = "center"; ctx.fillText(scoreY + "  " + scoreA, 320, 50);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit";
      ctx.fillText(phase === "clear" ? "YOU WIN" : phase === "over" ? "YOU LOSE" : "PADDLEDUEL", 320, 240);
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  window.addEventListener("keydown", (e) => { keys[e.key] = true; });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; you = { x: 24, y: 200, w: 12, h: 80 }; ai = { x: 604, y: 200, w: 12, h: 80 }; ball = { x: 320, y: 240, r: 7 }; draw();
})();
`;
}

function jsAsteroid() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_rockfield_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li><kbd>←→</kbd><span>旋回</span></li><li><kbd>↑</kbd><span>加速</span></li><li><kbd>Space</kbd><span>射撃</span></li>";
  document.getElementById("rules").innerHTML = "<li>岩をすべて破壊</li><li>分裂にも注意</li>";

  let ship, rocks, shots, score, lives, phase, keys, raf, last, cool;

  function mkRock(x, y, r) {
    return { x, y, r, vx: (Math.random() - 0.5) * 2.5, vy: (Math.random() - 0.5) * 2.5 };
  }
  function start() {
    score = 0; lives = 3; phase = "play"; keys = {}; cool = 0;
    ship = { x: 320, y: 240, a: 0, vx: 0, vy: 0 };
    rocks = [mkRock(80, 80, 36), mkRock(520, 100, 32), mkRock(200, 360, 30), mkRock(480, 340, 28)];
    shots = []; hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last); status("フィールドクリアへ");
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }
  function wrap(o) {
    if (o.x < -40) o.x = canvas.width + 40; if (o.x > canvas.width + 40) o.x = -40;
    if (o.y < -40) o.y = canvas.height + 40; if (o.y > canvas.height + 40) o.y = -40;
  }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16; cool = Math.max(0, cool - dt);
    if (keys.ArrowLeft) ship.a -= 0.08 * k;
    if (keys.ArrowRight) ship.a += 0.08 * k;
    if (keys.ArrowUp) { ship.vx += Math.cos(ship.a) * 0.18 * k; ship.vy += Math.sin(ship.a) * 0.18 * k; }
    ship.vx *= 0.99; ship.vy *= 0.99;
    ship.x += ship.vx * k; ship.y += ship.vy * k; wrap(ship);
    if (keys[" "] && cool <= 0) {
      shots.push({ x: ship.x, y: ship.y, vx: Math.cos(ship.a) * 7 + ship.vx, vy: Math.sin(ship.a) * 7 + ship.vy, life: 900 });
      cool = 180;
    }
    shots.forEach((s) => { s.x += s.vx * k; s.y += s.vy * k; s.life -= dt; wrap(s); });
    shots = shots.filter((s) => s.life > 0);
    rocks.forEach((r) => { r.x += r.vx * k; r.y += r.vy * k; wrap(r); });
    const next = [];
    rocks.forEach((r) => {
      let hit = false;
      shots.forEach((s) => {
        if ((s.x - r.x) ** 2 + (s.y - r.y) ** 2 < r.r * r.r) { s.life = 0; hit = true; }
      });
      if (hit) {
        score += Math.round(40 - r.r); hud();
        if (r.r > 16) { next.push(mkRock(r.x, r.y, r.r * 0.55)); next.push(mkRock(r.x, r.y, r.r * 0.55)); }
      } else next.push(r);
      if ((ship.x - r.x) ** 2 + (ship.y - r.y) ** 2 < (r.r + 10) ** 2) {
        lives--; ship.x = 320; ship.y = 240; ship.vx = ship.vy = 0; hud();
        if (lives <= 0) { phase = "over"; status("ゲームオーバー"); }
      }
    });
    rocks = next;
    if (!rocks.length) { phase = "clear"; score += 500; hud(); status("クリア！"); }
  }

  function draw() {
    ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#ced4da"; ctx.lineWidth = 2;
    rocks.forEach((r) => {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, rad = r.r * (0.75 + (i % 3) * 0.1);
        const x = r.x + Math.cos(a) * rad, y = r.y + Math.sin(a) * rad;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    });
    ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.a);
    ctx.strokeStyle = "#69db7c"; ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(-10, 9); ctx.lineTo(-6, 0); ctx.lineTo(-10, -9); ctx.closePath(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#fff"; shots.forEach((s) => { ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3); });
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : phase === "clear" ? "CLEAR" : "ROCKFIELD", 320, 240);
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  window.addEventListener("keydown", (e) => { keys[e.key] = true; if (e.code === "Space") e.preventDefault(); });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; ship = { x: 320, y: 240, a: 0, vx: 0, vy: 0 }; rocks = [mkRock(120, 120, 30)]; shots = []; draw();
})();
`;
}

function jsFlap() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_flapglide_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li><kbd>Space</kbd><span>羽ばたき</span></li><li>クリックも可</li>";
  document.getElementById("rules").innerHTML = "<li>柱に当たると終了</li><li>通過で得点</li>";

  let bird, pipes, score, phase, raf, last, grav;

  function start() {
    score = 0; phase = "play"; grav = 0.35;
    bird = { x: 140, y: 200, vy: 0, r: 12 };
    pipes = []; for (let i = 0; i < 3; i++) spawnPipe(420 + i * 200);
    hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last); status("スペースで羽ばたき");
  }
  function spawnPipe(x) {
    const gap = 130, top = 60 + Math.random() * 180;
    pipes.push({ x, w: 52, top, gap, passed: false });
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = "1";
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }
  function flap() { if (phase === "play") bird.vy = -6.2; }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;
    bird.vy += grav * k; bird.y += bird.vy * k;
    pipes.forEach((p) => p.x -= 2.6 * k);
    if (pipes[0].x < -60) { pipes.shift(); spawnPipe(pipes[pipes.length - 1].x + 200); }
    pipes.forEach((p) => {
      if (!p.passed && p.x + p.w < bird.x) { p.passed = true; score++; hud(); }
      const inX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + p.w;
      const hitY = bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap;
      if (inX && hitY) { phase = "over"; status("クラッシュ"); }
    });
    if (bird.y > canvas.height - 40 || bird.y < 0) { phase = "over"; status("ゲームオーバー"); }
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#74c0fc"); sky.addColorStop(1, "#a5d8ff");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#2f9e44"; ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
    pipes.forEach((p) => {
      ctx.fillStyle = "#37b24d";
      ctx.fillRect(p.x, 0, p.w, p.top);
      ctx.fillRect(p.x, p.top + p.gap, p.w, canvas.height);
      ctx.fillStyle = "#2b8a3e";
      ctx.fillRect(p.x - 4, p.top - 16, p.w + 8, 16);
      ctx.fillRect(p.x - 4, p.top + p.gap, p.w + 8, 16);
    });
    ctx.fillStyle = "#f08c00"; ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bird.x + 4, bird.y - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#111"; ctx.font = "800 36px Outfit"; ctx.textAlign = "center"; ctx.fillText(String(score), 320, 70);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit";
      ctx.fillText(phase === "over" ? "GAME OVER" : "FLAPGLIDE", 320, 240);
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  window.addEventListener("keydown", (e) => { if (e.code === "Space") { e.preventDefault(); flap(); } });
  canvas.addEventListener("pointerdown", flap);
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; bird = { x: 140, y: 200, vy: 0, r: 12 }; pipes = []; draw();
})();
`;
}

function jsMatch3() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const N = 8, SIZE = 52, PAD = 24;
  canvas.width = PAD * 2 + N * SIZE; canvas.height = PAD * 2 + N * SIZE;
  const KEY = "vq_gemtri_best";
  const COLORS = ["#ff6b6b", "#4dabf7", "#69db7c", "#ffe066", "#b197fc", "#ff922b"];
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li>クリック2つで入替</li>";
  document.getElementById("rules").innerHTML = "<li>3つ以上で消去</li><li>連鎖ボーナス</li>";

  let grid, score, phase, sel, moves;

  function rnd() { return Math.floor(Math.random() * COLORS.length); }
  function emptyBoard() {
    grid = Array.from({ length: N }, () => Array.from({ length: N }, rnd));
    // break initial matches lightly
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      while (matchAt(x, y).length) grid[y][x] = rnd();
    }
  }
  function matchAt(x, y) {
    const c = grid[y][x], cells = [[x, y]];
    let i = x - 1; while (i >= 0 && grid[y][i] === c) { cells.push([i, y]); i--; }
    i = x + 1; while (i < N && grid[y][i] === c) { cells.push([i, y]); i++; }
    if (cells.length >= 3) return cells;
    const vert = [[x, y]];
    let j = y - 1; while (j >= 0 && grid[j][x] === c) { vert.push([x, j]); j--; }
    j = y + 1; while (j < N && grid[j][x] === c) { vert.push([x, j]); j++; }
    return vert.length >= 3 ? vert : [];
  }
  function findAll() {
    const set = new Set();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) matchAt(x, y).forEach(([a, b]) => set.add(a + "," + b));
    return [...set].map((s) => s.split(",").map(Number));
  }
  function collapse() {
    for (let x = 0; x < N; x++) {
      const col = [];
      for (let y = N - 1; y >= 0; y--) if (grid[y][x] !== null) col.push(grid[y][x]);
      for (let y = N - 1; y >= 0; y--) grid[y][x] = col[N - 1 - y] === undefined ? rnd() : col[N - 1 - y];
    }
  }
  function resolve() {
    let chain = 0;
    for (;;) {
      const m = findAll();
      if (!m.length) break;
      m.forEach(([x, y]) => { grid[y][x] = null; });
      chain++; score += m.length * 10 * chain; collapse();
    }
    if (chain) hud();
  }
  function start() {
    score = 0; moves = 30; phase = "play"; sel = null; emptyBoard(); resolve(); hud(); status("入れ替えて揃えろ"); draw();
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = moves;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function draw() {
    ctx.fillStyle = "#14141c"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const px = PAD + x * SIZE, py = PAD + y * SIZE;
      ctx.fillStyle = COLORS[grid[y][x]];
      roundRect(px + 4, py + 4, SIZE - 8, SIZE - 8, 10);
      if (sel && sel.x === x && sel.y === y) {
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke();
      }
    }
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "TIME UP" : "GEMTRI", canvas.width / 2, canvas.height / 2);
    }
  }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
  }

  canvas.addEventListener("click", (e) => {
    if (phase !== "play") return;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * sx - PAD) / SIZE);
    const y = Math.floor(((e.clientY - rect.top) * sy - PAD) / SIZE);
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    if (!sel) { sel = { x, y }; draw(); return; }
    const dx = Math.abs(sel.x - x), dy = Math.abs(sel.y - y);
    if (dx + dy === 1) {
      const a = grid[sel.y][sel.x]; grid[sel.y][sel.x] = grid[y][x]; grid[y][x] = a;
      const matched = findAll().length > 0;
      if (!matched) { grid[y][x] = grid[sel.y][sel.x]; grid[sel.y][sel.x] = a; status("そろわない"); }
      else { moves--; resolve(); status("ナイス"); if (moves <= 0) { phase = "over"; status("手数終了"); } }
      hud();
    }
    sel = null; draw();
  });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => status(phase === "play" ? "盤面操作中（一時停止なし）" : "はじめるを押して");
  phase = "ready"; emptyBoard(); draw();
})();
`;
}

function jsMines() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const COLS = 12, ROWS = 12, MINES = 18, SIZE = 36;
  canvas.width = COLS * SIZE; canvas.height = ROWS * SIZE;
  const KEY = "vq_sweepfield_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li>左クリック:開く</li><li>右クリック:旗</li>";
  document.getElementById("rules").innerHTML = "<li>数字は周囲の地雷数</li><li>地雷以外をすべて開けば勝ち</li>";

  let grid, score, phase, flags, startedAt;

  function neighbors(x, y) {
    const out = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS) out.push([nx, ny]);
    }
    return out;
  }
  function start() {
    score = 0; phase = "play"; flags = 0; startedAt = Date.now();
    grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ mine: false, open: false, flag: false, n: 0 })));
    let placed = 0;
    while (placed < MINES) {
      const x = Math.floor(Math.random() * COLS), y = Math.floor(Math.random() * ROWS);
      if (grid[y][x].mine) continue;
      grid[y][x].mine = true; placed++;
    }
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      grid[y][x].n = neighbors(x, y).filter(([nx, ny]) => grid[ny][nx].mine).length;
    }
    hud(); status("地雷を避けて開け"); draw();
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = (MINES - flags) + " mines";
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }
  function openCell(x, y) {
    const c = grid[y][x];
    if (c.open || c.flag) return;
    c.open = true;
    if (c.mine) { phase = "over"; revealMines(); status("爆発…"); hud(); return; }
    score += 5;
    if (c.n === 0) neighbors(x, y).forEach(([nx, ny]) => openCell(nx, ny));
    const left = grid.flat().filter((t) => !t.mine && !t.open).length;
    if (left === 0) {
      phase = "clear";
      const sec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      score += Math.max(50, 400 - sec);
      status("クリア！ " + sec + "秒");
    }
    hud();
  }
  function revealMines() { grid.forEach((row) => row.forEach((c) => { if (c.mine) c.open = true; })); }

  function draw() {
    const nums = ["", "#1c7ed6", "#2f9e44", "#e03131", "#7048e8", "#f08c00", "#0b7285", "#212529", "#868e96"];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = grid[y][x], px = x * SIZE, py = y * SIZE;
      ctx.fillStyle = c.open ? "#dee2e6" : ((x + y) % 2 ? "#8ce99a" : "#69db7c");
      ctx.fillRect(px, py, SIZE - 1, SIZE - 1);
      if (c.flag && !c.open) {
        ctx.fillStyle = "#e03131"; ctx.fillRect(px + 12, py + 8, 4, 18);
        ctx.beginPath(); ctx.moveTo(px + 16, py + 8); ctx.lineTo(px + 26, py + 13); ctx.lineTo(px + 16, py + 18); ctx.fill();
      }
      if (c.open && c.mine) {
        ctx.fillStyle = "#212529"; ctx.beginPath(); ctx.arc(px + SIZE / 2, py + SIZE / 2, 8, 0, Math.PI * 2); ctx.fill();
      } else if (c.open && c.n) {
        ctx.fillStyle = nums[c.n]; ctx.font = "700 18px Outfit"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(c.n), px + SIZE / 2, py + SIZE / 2 + 1);
      }
    }
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "BOOM" : phase === "clear" ? "CLEAR" : "SWEEPFIELD", canvas.width / 2, canvas.height / 2);
    }
  }

  canvas.addEventListener("click", (e) => {
    if (phase !== "play") return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width) / SIZE);
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height) / SIZE);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return;
    openCell(x, y); draw();
  });
  canvas.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (phase !== "play") return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width) / SIZE);
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height) / SIZE);
    const c = grid[y][x];
    if (c.open) return;
    c.flag = !c.flag; flags += c.flag ? 1 : -1; hud(); draw();
  });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => status("盤面操作中");
  phase = "ready";
  grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => ({ mine: false, open: false, flag: false, n: 0 })));
  draw();
})();
`;
}

function jsStack() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const COLS = 10, ROWS = 20, SIZE = 24;
  canvas.width = COLS * SIZE + 120; canvas.height = ROWS * SIZE;
  const KEY = "vq_stackdrop_best";
  const SHAPES = {
    I: [[1,1,1,1]], O: [[1,1],[1,1]], T: [[0,1,0],[1,1,1]],
    L: [[1,0],[1,0],[1,1]], J: [[0,1],[0,1],[1,1]], S: [[0,1,1],[1,1,0]], Z: [[1,1,0],[0,1,1]]
  };
  const COLORS = { I: "#22b8cf", O: "#fcc419", T: "#cc5de8", L: "#ff922b", J: "#339af0", S: "#51cf66", Z: "#ff6b6b" };
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li><kbd>←→</kbd>移動 <kbd>↑</kbd>回転</li><li><kbd>↓</kbd>ソフト <kbd>Space</kbd>ハード</li>";
  document.getElementById("rules").innerHTML = "<li>横一列で消去</li><li>天井到達で終了</li>";

  let board, piece, next, score, lines, phase, raf, last, dropAcc, keys;

  function empty() { return Array.from({ length: ROWS }, () => Array(COLS).fill(0)); }
  function randPiece() {
    const ids = Object.keys(SHAPES);
    const id = ids[Math.floor(Math.random() * ids.length)];
    return { id, m: SHAPES[id].map((r) => r.slice()), x: 3, y: 0 };
  }
  function rotate(m) {
    const h = m.length, w = m[0].length, out = Array.from({ length: w }, () => Array(h).fill(0));
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[x][h - 1 - y] = m[y][x];
    return out;
  }
  function hits(p, ox, oy, mat) {
    const m = mat || p.m;
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m[0].length; x++) {
      if (!m[y][x]) continue;
      const nx = p.x + x + (ox || 0), ny = p.y + y + (oy || 0);
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
    return false;
  }
  function merge() {
    piece.m.forEach((row, y) => row.forEach((v, x) => {
      if (v && piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.id;
    }));
  }
  function clearLines() {
    let n = 0;
    board = board.filter((row) => { const full = row.every(Boolean); if (full) n++; return !full; });
    while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
    if (n) { lines += n; score += [0, 100, 300, 500, 800][n] || 800; hud(); }
  }
  function spawn() {
    piece = next || randPiece(); next = randPiece();
    if (hits(piece, 0, 0)) { phase = "over"; status("ゲームオーバー"); }
  }
  function start() {
    board = empty(); score = 0; lines = 0; phase = "play"; dropAcc = 0; keys = {}; next = null;
    spawn(); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last); status("スタック開始");
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lines;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }
  function hardDrop() { while (!hits(piece, 0, 1)) piece.y++; lock(); }
  function lock() { merge(); clearLines(); spawn(); }

  function update(dt) {
    if (phase !== "play") return;
    dropAcc += dt;
    const interval = Math.max(120, 700 - lines * 20);
    if (dropAcc >= interval) { dropAcc = 0; if (!hits(piece, 0, 1)) piece.y++; else lock(); }
  }
  function drawCell(x, y, id) {
    ctx.fillStyle = COLORS[id] || "#868e96";
    ctx.fillRect(x * SIZE + 1, y * SIZE + 1, SIZE - 2, SIZE - 2);
  }
  function draw() {
    ctx.fillStyle = "#0b1020"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#151b2e"; ctx.fillRect(0, 0, COLS * SIZE, ROWS * SIZE);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (board[y][x]) drawCell(x, y, board[y][x]);
    if (piece) piece.m.forEach((row, y) => row.forEach((v, x) => { if (v) drawCell(piece.x + x, piece.y + y, piece.id); }));
    ctx.fillStyle = "#fff"; ctx.font = "700 14px Outfit"; ctx.fillText("NEXT", COLS * SIZE + 20, 30);
    if (next) next.m.forEach((row, y) => row.forEach((v, x) => {
      if (!v) return;
      ctx.fillStyle = COLORS[next.id];
      ctx.fillRect(COLS * SIZE + 20 + x * 20, 50 + y * 20, 18, 18);
    }));
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(0, 0, COLS * SIZE, ROWS * SIZE);
      ctx.fillStyle = "#fff"; ctx.font = "800 26px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : "STACKDROP", (COLS * SIZE) / 2, ROWS * SIZE / 2);
      ctx.textAlign = "start";
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  window.addEventListener("keydown", (e) => {
    if (phase !== "play") return;
    if (e.key === "ArrowLeft" && !hits(piece, -1, 0)) piece.x--;
    if (e.key === "ArrowRight" && !hits(piece, 1, 0)) piece.x++;
    if (e.key === "ArrowDown" && !hits(piece, 0, 1)) { piece.y++; score++; }
    if (e.key === "ArrowUp") { const m = rotate(piece.m); if (!hits(piece, 0, 0, m)) piece.m = m; }
    if (e.code === "Space") { e.preventDefault(); hardDrop(); }
    draw();
  });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; board = empty(); piece = randPiece(); next = randPiece(); draw();
})();
`;
}

function jsMemory() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const COLS = 4, ROWS = 3, W = 120, H = 120, GAP = 12;
  canvas.width = COLS * (W + GAP) + GAP; canvas.height = ROWS * (H + GAP) + GAP;
  const KEY = "vq_memoryflip_best";
  const ICONS = ["▲", "●", "■", "◆", "★", "✿"];
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li>クリックでめくる</li>";
  document.getElementById("rules").innerHTML = "<li>同じ絵柄を2枚揃え</li><li>手数少ないほど高得点</li>";

  let cards, open, locked, moves, matched, phase, score;

  function start() {
    const vals = ICONS.concat(ICONS).sort(() => Math.random() - 0.5);
    cards = vals.map((v, i) => ({ v, open: false, done: false, i }));
    open = []; locked = false; moves = 0; matched = 0; score = 0; phase = "play";
    hud(); status("ペアを探せ"); draw();
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = moves;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function draw() {
    ctx.fillStyle = "#1a1030"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    cards.forEach((c, i) => {
      const x = GAP + (i % COLS) * (W + GAP), y = GAP + Math.floor(i / COLS) * (H + GAP);
      ctx.fillStyle = c.done ? "#2b8a3e" : c.open ? "#fff3bf" : "#5c4d7a";
      ctx.beginPath();
      const r = 14; ctx.moveTo(x + r, y); ctx.arcTo(x + W, y, x + W, y + H, r); ctx.arcTo(x + W, y + H, x, y + H, r);
      ctx.arcTo(x, y + H, x, y, r); ctx.arcTo(x, y, x + W, y, r); ctx.closePath(); ctx.fill();
      if (c.open || c.done) {
        ctx.fillStyle = "#212529"; ctx.font = "800 42px Outfit"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(c.v, x + W / 2, y + H / 2);
      }
    });
    if (phase === "clear") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText("CLEAR", canvas.width / 2, canvas.height / 2);
    }
  }

  canvas.addEventListener("click", (e) => {
    if (phase !== "play" || locked) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    const col = Math.floor((px - GAP) / (W + GAP)), row = Math.floor((py - GAP) / (H + GAP));
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return;
    const i = row * COLS + col, c = cards[i];
    if (c.open || c.done) return;
    c.open = true; open.push(c); draw();
    if (open.length === 2) {
      moves++; locked = true;
      const [a, b] = open;
      if (a.v === b.v) {
        a.done = b.done = true; matched++; score += Math.max(20, 120 - moves * 3); open = []; locked = false;
        if (matched === ICONS.length) { phase = "clear"; score += 200; status("全部そろった！"); }
        else status("ペア！");
        hud(); draw();
      } else {
        status("ちがう…");
        setTimeout(() => { a.open = b.open = false; open = []; locked = false; hud(); draw(); }, 650);
      }
      hud();
    }
  });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => status("めくり中");
  phase = "ready"; cards = []; draw();
})();
`;
}

function jsWhack() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_whackburst_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li>クリックで叩く</li>";
  document.getElementById("rules").innerHTML = "<li>制限時間30秒</li><li>金色は高得点・爆弾は減点</li>";

  let holes, active, score, phase, time, raf, last, spawnAcc;

  function layout() {
    holes = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      holes.push({ x: 120 + c * 160, y: 110 + r * 120, r: 42, kind: null, life: 0 });
    }
  }
  function start() {
    score = 0; time = 30; phase = "play"; spawnAcc = 0; active = 0; layout();
    hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last); status("たたけ！");
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = Math.ceil(time) + "s";
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function update(dt) {
    if (phase !== "play") return;
    time -= dt / 1000; spawnAcc += dt; hud();
    if (time <= 0) { phase = "over"; status("タイムアップ"); return; }
    holes.forEach((h) => { if (h.kind) { h.life -= dt; if (h.life <= 0) { h.kind = null; active--; } } });
    if (spawnAcc > 480 && active < 3) {
      spawnAcc = 0;
      const free = holes.filter((h) => !h.kind);
      if (free.length) {
        const h = free[Math.floor(Math.random() * free.length)];
        const roll = Math.random();
        h.kind = roll < 0.12 ? "bomb" : roll < 0.3 ? "gold" : "normal";
        h.life = 900 + Math.random() * 500; active++;
      }
    }
  }
  function draw() {
    ctx.fillStyle = "#3d2914"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    holes.forEach((h) => {
      ctx.fillStyle = "#1c1008"; ctx.beginPath(); ctx.ellipse(h.x, h.y + 18, h.r, h.r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      if (h.kind) {
        ctx.fillStyle = h.kind === "gold" ? "#fcc419" : h.kind === "bomb" ? "#212529" : "#e8590c";
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r * 0.7, 0, Math.PI * 2); ctx.fill();
        if (h.kind === "bomb") { ctx.fillStyle = "#fa5252"; ctx.fillRect(h.x - 2, h.y - h.r * 0.9, 4, 10); }
      }
    });
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "TIME UP" : "WHACKBURST", 320, 240);
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  canvas.addEventListener("click", (e) => {
    if (phase !== "play") return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    holes.forEach((h) => {
      if (!h.kind) return;
      if ((x - h.x) ** 2 + (y - h.y) ** 2 < (h.r * 0.8) ** 2) {
        if (h.kind === "bomb") score = Math.max(0, score - 30);
        else score += h.kind === "gold" ? 50 : 15;
        h.kind = null; active--; hud();
      }
    });
  });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; layout(); draw();
})();
`;
}

function jsHockey() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_airhock_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li>マウスでマレット</li><li>矢印でも可</li>";
  document.getElementById("rules").innerHTML = "<li>先に5点</li><li>右ゴールはAI側</li>";

  let you, ai, puck, scoreY, scoreA, phase, keys, raf, last, pointer;

  function resetPuck(dir) {
    puck = { x: 320, y: 240, vx: dir * 3.5, vy: (Math.random() - 0.5) * 2, r: 10 };
  }
  function start() {
    scoreY = 0; scoreA = 0; phase = "play"; keys = {}; pointer = null;
    you = { x: 100, y: 240, r: 22 }; ai = { x: 540, y: 240, r: 22 };
    resetPuck(1); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last); status("フェイスオフ");
  }
  function hud() {
    document.getElementById("score").textContent = scoreY + " - " + scoreA;
    document.getElementById("lives").textContent = "BO5";
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, scoreY);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }
  function collide(m) {
    const dx = puck.x - m.x, dy = puck.y - m.y, d = Math.hypot(dx, dy), min = puck.r + m.r;
    if (d < min && d > 0) {
      const nx = dx / d, ny = dy / d;
      puck.x = m.x + nx * min; puck.y = m.y + ny * min;
      const dot = puck.vx * nx + puck.vy * ny;
      puck.vx = (puck.vx - 1.8 * dot * nx) + nx * 1.2;
      puck.vy = (puck.vy - 1.8 * dot * ny) + ny * 1.2;
    }
  }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;
    if (pointer) { you.x += (pointer.x - you.x) * 0.35; you.y += (pointer.y - you.y) * 0.35; }
    if (keys.ArrowUp) you.y -= 6 * k; if (keys.ArrowDown) you.y += 6 * k;
    if (keys.ArrowLeft) you.x -= 6 * k; if (keys.ArrowRight) you.x += 6 * k;
    you.x = Math.max(40, Math.min(300, you.x)); you.y = Math.max(40, Math.min(440, you.y));
    ai.y += ((puck.y - ai.y) * 0.08) * k * 8; ai.x += ((520 - ai.x) * 0.05);
    ai.y = Math.max(40, Math.min(440, ai.y));
    puck.x += puck.vx * k; puck.y += puck.vy * k; puck.vx *= 0.995; puck.vy *= 0.995;
    if (puck.y < puck.r || puck.y > canvas.height - puck.r) puck.vy *= -1;
    if (puck.x < 0) {
      if (puck.y > 170 && puck.y < 310) { scoreA++; resetPuck(1); hud(); if (scoreA >= 5) { phase = "over"; status("AIの勝ち"); } }
      else puck.vx *= -1;
    }
    if (puck.x > canvas.width) {
      if (puck.y > 170 && puck.y < 310) { scoreY++; resetPuck(-1); hud(); if (scoreY >= 5) { phase = "clear"; status("あなたの勝ち！"); } }
      else puck.vx *= -1;
    }
    collide(you); collide(ai);
  }
  function draw() {
    ctx.fillStyle = "#0b3d4a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3; ctx.strokeRect(20, 20, 600, 440);
    ctx.beginPath(); ctx.moveTo(320, 20); ctx.lineTo(320, 460); ctx.stroke();
    ctx.beginPath(); ctx.arc(320, 240, 50, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(0, 170, 20, 140); ctx.fillRect(620, 170, 20, 140);
    ctx.fillStyle = "#4cc9f0"; ctx.beginPath(); ctx.arc(you.x, you.y, you.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f72585"; ctx.beginPath(); ctx.arc(ai.x, ai.y, ai.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2); ctx.fill();
    ctx.font = "800 32px Outfit"; ctx.textAlign = "center"; ctx.fillText(scoreY + "  " + scoreA, 320, 56);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit";
      ctx.fillText(phase === "clear" ? "YOU WIN" : phase === "over" ? "YOU LOSE" : "AIRHOCK", 320, 240);
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  });
  window.addEventListener("keydown", (e) => { keys[e.key] = true; });
  window.addEventListener("keyup", (e) => { keys[e.key] = false; });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; you = { x: 100, y: 240, r: 22 }; ai = { x: 540, y: 240, r: 22 }; puck = { x: 320, y: 240, r: 10, vx: 0, vy: 0 }; draw();
})();
`;
}

function jsTunnel() {
  return `"use strict";
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_tunnelrun_best";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li><kbd>←→</kbd> / <kbd>A D</kbd>レーン</li>";
  document.getElementById("rules").innerHTML = "<li>3レーンを走る</li><li>障害回避で距離スコア</li>";

  let lane, obstacles, score, dist, phase, raf, last, spawnAcc, speed;

  function start() {
    lane = 1; obstacles = []; score = 0; dist = 0; phase = "play"; spawnAcc = 0; speed = 4;
    hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last); status("走れ！");
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = Math.floor(dist) + "m";
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }
  function laneX(l) { return 160 + l * 160; }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16; dist += speed * k * 0.4; score = Math.floor(dist); speed = 4 + dist / 200; spawnAcc += dt; hud();
    if (spawnAcc > Math.max(400, 900 - dist)) {
      spawnAcc = 0;
      obstacles.push({ lane: Math.floor(Math.random() * 3), y: -40, h: 36, w: 50 });
    }
    obstacles.forEach((o) => o.y += speed * k);
    obstacles = obstacles.filter((o) => o.y < 520);
    const py = 380;
    obstacles.forEach((o) => {
      if (o.lane === lane && o.y + o.h > py && o.y < py + 34) { phase = "over"; status("クラッシュ " + Math.floor(dist) + "m"); }
    });
  }
  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#212529"); g.addColorStop(1, "#495057");
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === lane ? "rgba(255,212,59,.12)" : "rgba(255,255,255,.04)";
      ctx.fillRect(laneX(i) - 50, 0, 100, canvas.height);
      ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.strokeRect(laneX(i) - 50, 0, 100, canvas.height);
    }
    obstacles.forEach((o) => {
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(laneX(o.lane) - o.w / 2, o.y, o.w, o.h);
    });
    ctx.fillStyle = "#4dabf7";
    ctx.fillRect(laneX(lane) - 18, 380, 36, 34);
    ctx.fillStyle = "#fff"; ctx.font = "800 22px Outfit"; ctx.textAlign = "left";
    ctx.fillText(Math.floor(dist) + " m", 20, 36);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "CRASH" : "TUNNELRUN", 320, 240);
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  window.addEventListener("keydown", (e) => {
    if (phase !== "play") return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") lane = Math.max(0, lane - 1);
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") lane = Math.min(2, lane + 1);
  });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; lane = 1; obstacles = []; draw();
})();
`;
}

const THEMES = {
  pac: { bg: "#07141c", bg2: "#0a1e2a", panel: "rgba(8,24,36,.92)", ink: "#e8f6ff", muted: "#8fb3c9", accent: "#7ee0c6", accent2: "#ffe14a", line: "rgba(126,224,198,.25)", glow: "rgba(126,224,198,.18)", glow2: "rgba(45,122,168,.2)" },
  breakout: { bg: "#140a1f", bg2: "#0a1628", panel: "rgba(20,12,32,.92)", ink: "#f8f0ff", muted: "#b39ddb", accent: "#ff6b6b", accent2: "#ffa94d", line: "rgba(255,107,107,.25)", glow: "rgba(255,107,107,.16)", glow2: "rgba(255,169,77,.14)" },
  snake: { bg: "#081c15", bg2: "#0b1a12", panel: "rgba(8,28,21,.92)", ink: "#e8fff1", muted: "#95d5b2", accent: "#69db7c", accent2: "#ff6b6b", line: "rgba(105,219,124,.25)", glow: "rgba(105,219,124,.16)", glow2: "rgba(47,158,68,.14)" },
  invaders: { bg: "#050816", bg2: "#0b132b", panel: "rgba(8,12,28,.92)", ink: "#e7f5ff", muted: "#99b4d0", accent: "#74c0fc", accent2: "#69db7c", line: "rgba(116,192,252,.25)", glow: "rgba(116,192,252,.16)", glow2: "rgba(105,219,124,.12)" },
  frog: { bg: "#1b4332", bg2: "#081c15", panel: "rgba(27,67,50,.92)", ink: "#e8fff3", muted: "#95d5b2", accent: "#95d5b2", accent2: "#40916c", line: "rgba(149,213,178,.25)", glow: "rgba(64,145,108,.2)", glow2: "rgba(29,53,87,.2)" },
  pong: { bg: "#10080f", bg2: "#0a0a12", panel: "rgba(20,10,24,.92)", ink: "#fff0f6", muted: "#f5a3c7", accent: "#4cc9f0", accent2: "#f72585", line: "rgba(247,37,133,.25)", glow: "rgba(76,201,240,.16)", glow2: "rgba(247,37,133,.14)" },
  asteroid: { bg: "#050505", bg2: "#121212", panel: "rgba(18,18,18,.92)", ink: "#f1f3f5", muted: "#adb5bd", accent: "#69db7c", accent2: "#ced4da", line: "rgba(206,212,218,.2)", glow: "rgba(105,219,124,.12)", glow2: "rgba(255,255,255,.06)" },
  flap: { bg: "#1c7ed6", bg2: "#74c0fc", panel: "rgba(255,255,255,.88)", ink: "#0b1f33", muted: "#3b5b76", accent: "#f08c00", accent2: "#37b24d", line: "rgba(11,31,51,.15)", glow: "rgba(255,255,255,.35)", glow2: "rgba(240,140,0,.18)" },
  match3: { bg: "#101018", bg2: "#1a1528", panel: "rgba(22,18,36,.92)", ink: "#f3f0ff", muted: "#c0b4e0", accent: "#b197fc", accent2: "#ff6b6b", line: "rgba(177,151,252,.25)", glow: "rgba(177,151,252,.16)", glow2: "rgba(255,107,107,.12)" },
  mines: { bg: "#1b4332", bg2: "#2d6a4f", panel: "rgba(27,67,50,.92)", ink: "#f1faee", muted: "#b7e4c7", accent: "#95d5b2", accent2: "#e03131", line: "rgba(149,213,178,.25)", glow: "rgba(149,213,178,.18)", glow2: "rgba(224,49,49,.12)" },
  stack: { bg: "#0b1020", bg2: "#151b2e", panel: "rgba(15,20,40,.92)", ink: "#e7f5ff", muted: "#91a7ff", accent: "#22b8cf", accent2: "#cc5de8", line: "rgba(34,184,207,.25)", glow: "rgba(34,184,207,.16)", glow2: "rgba(204,93,232,.12)" },
  memory: { bg: "#1a1030", bg2: "#2b2148", panel: "rgba(30,22,56,.92)", ink: "#f3f0ff", muted: "#c0b4e0", accent: "#fcc419", accent2: "#5c4d7a", line: "rgba(252,196,25,.25)", glow: "rgba(252,196,25,.14)", glow2: "rgba(92,77,122,.2)" },
  whack: { bg: "#3d2914", bg2: "#5c3d1e", panel: "rgba(61,41,20,.92)", ink: "#fff4e6", muted: "#e8c39e", accent: "#e8590c", accent2: "#fcc419", line: "rgba(232,89,12,.25)", glow: "rgba(232,89,12,.16)", glow2: "rgba(252,196,25,.12)" },
  hockey: { bg: "#062a33", bg2: "#0b3d4a", panel: "rgba(8,40,50,.92)", ink: "#e3fafc", muted: "#99e9f2", accent: "#4cc9f0", accent2: "#f72585", line: "rgba(76,201,240,.25)", glow: "rgba(76,201,240,.16)", glow2: "rgba(247,37,133,.12)" },
  tunnel: { bg: "#212529", bg2: "#343a40", panel: "rgba(33,37,41,.92)", ink: "#f8f9fa", muted: "#adb5bd", accent: "#4dabf7", accent2: "#ff6b6b", line: "rgba(77,171,247,.25)", glow: "rgba(77,171,247,.14)", glow2: "rgba(255,107,107,.12)" }
};

const ENGINES = {
  pac: jsPac,
  breakout: jsBreakout,
  snake: jsSnake,
  invaders: jsInvaders,
  frog: jsFrog,
  pong: jsPong,
  asteroid: jsAsteroid,
  flap: jsFlap,
  match3: jsMatch3,
  mines: jsMines,
  stack: jsStack,
  memory: jsMemory,
  whack: jsWhack,
  hockey: jsHockey,
  tunnel: jsTunnel
};

if (!fs.existsSync(SERVER_SRC)) {
  console.error("Missing vq-server template:", SERVER_SRC);
  process.exit(1);
}
const serverJs = fs.readFileSync(SERVER_SRC, "utf8");

fs.mkdirSync(ROOT, { recursive: true });
let n = 0;
for (const g of GAMES) {
  const dest = path.join(ROOT, g.dir);
  fs.mkdirSync(dest, { recursive: true });
  const theme = THEMES[g.kind];
  fs.writeFileSync(path.join(dest, "index.html"), indexHtml(g), "utf8");
  fs.writeFileSync(path.join(dest, "style.css"), shellCss(theme), "utf8");
  fs.writeFileSync(path.join(dest, "game.js"), ENGINES[g.kind](), "utf8");
  fs.writeFileSync(path.join(dest, "vq-server.js"), serverJs, "utf8");
  fs.writeFileSync(path.join(dest, "port.txt"), String(g.port), "utf8");
  fs.writeFileSync(path.join(dest, "start-server.bat"), bat(g), "utf8");
  fs.writeFileSync(
    path.join(dest, "product.json"),
    JSON.stringify({ id: "100_ARCADE/" + g.dir, brand: g.brand, kind: g.kind, port: g.port, standalone: true, version: "1.0.0" }, null, 2),
    "utf8"
  );
  n++;
  console.log("created", g.dir, "port", g.port);
}
fs.writeFileSync(
  path.join(ROOT, "PORTS.txt"),
  GAMES.map((g) => g.port + "\t" + g.dir + "\t" + g.brand).join("\n") + "\n",
  "utf8"
);
console.log("done", n, "arcade games under 100_ARCADE");
