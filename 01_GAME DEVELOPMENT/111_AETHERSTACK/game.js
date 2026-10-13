"use strict";
/** AETHERSTACK — 専用テトリス風。パーフェクト消しとホールドが固有。共有なし。 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const COLS = 10, ROWS = 20, SIZE = 24;
  canvas.width = COLS * SIZE + 120; canvas.height = ROWS * SIZE;
  const KEY = "vq_aetherstack_best_v2";
  const SHAPES = {
    I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]], T: [[0, 1, 0], [1, 1, 1]],
    L: [[1, 0], [1, 0], [1, 1]], J: [[0, 1], [0, 1], [1, 1]],
    S: [[0, 1, 1], [1, 1, 0]], Z: [[1, 1, 0], [0, 1, 1]]
  };
  const COLORS = { I: "#22b8cf", O: "#fcc419", T: "#cc5de8", L: "#ff922b", J: "#339af0", S: "#51cf66", Z: "#ff6b6b" };
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li><kbd>←→</kbd>移動 <kbd>↑</kbd>回転</li><li><kbd>↓</kbd>ソフト <kbd>Space</kbd>ハード</li><li><kbd>C</kbd>ホールド</li>";
  document.getElementById("rules").innerHTML =
    "<li>横一列消去</li><li>4列でパーフェクト</li><li>ホールド1回/ピース</li>";

  let board, piece, next, hold, holdUsed, score, lines, combo, phase, raf, last, dropAcc, flash, audio;

  function sfx(f, d, t, v) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio = audio || new AC(); if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = t || "square"; o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.03, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (d || 0.1));
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + (d || 0.12));
    } catch (e) {}
  }

  function empty() { return Array.from({ length: ROWS }, function () { return Array(COLS).fill(0); }); }
  function randPiece() {
    const ids = Object.keys(SHAPES);
    const id = ids[Math.floor(Math.random() * ids.length)];
    return { id: id, m: SHAPES[id].map(function (r) { return r.slice(); }), x: 3, y: 0 };
  }
  function rotate(m) {
    const h = m.length, w = m[0].length;
    const out = Array.from({ length: w }, function () { return Array(h).fill(0); });
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
    piece.m.forEach(function (row, y) {
      row.forEach(function (v, x) {
        if (v && piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.id;
      });
    });
  }
  function clearLines() {
    let n = 0;
    board = board.filter(function (row) {
      const full = row.every(Boolean);
      if (full) n++;
      return !full;
    });
    while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
    if (n) {
      combo += 1;
      const base = [0, 100, 300, 500, 800][n] || 800;
      const bonus = n === 4 ? 400 : 0;
      score += (base + bonus) * combo;
      lines += n;
      flash = 12;
      if (n === 4) status("パーフェクト！");
      else status(n + "ライン ×" + combo);
      sfx(360 + n * 80, 0.1, n === 4 ? "sawtooth" : "triangle", 0.035);
      hud();
    } else combo = 0;
  }
  function spawn() {
    piece = next || randPiece(); next = randPiece(); holdUsed = false;
    if (hits(piece, 0, 0)) { phase = "over"; status("ゲームオーバー"); sfx(120, 0.2, "sawtooth", 0.04); }
  }
  function doHold() {
    if (holdUsed || phase !== "play") return;
    holdUsed = true;
    if (!hold) { hold = { id: piece.id, m: SHAPES[piece.id].map(function (r) { return r.slice(); }), x: 3, y: 0 }; spawn(); }
    else {
      const tmp = hold;
      hold = { id: piece.id, m: SHAPES[piece.id].map(function (r) { return r.slice(); }), x: 3, y: 0 };
      piece = { id: tmp.id, m: SHAPES[tmp.id].map(function (r) { return r.slice(); }), x: 3, y: 0 };
      if (hits(piece, 0, 0)) { phase = "over"; status("ゲームオーバー"); }
    }
    sfx(300, 0.06, "sine", 0.025); status("ホールド");
  }
  function start() {
    board = empty(); score = 0; lines = 0; combo = 0; phase = "play"; dropAcc = 0;
    hold = null; holdUsed = false; next = null; flash = 0;
    spawn(); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last);
    status("スタック開始"); sfx(400, 0.08, "triangle", 0.03);
  }
  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lines + (combo > 1 ? " c" + combo : "");
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }
  function hardDrop() { while (!hits(piece, 0, 1)) { piece.y++; score += 2; } lock(); }
  function lock() { merge(); clearLines(); spawn(); }

  function update(dt) {
    if (phase !== "play") return;
    dropAcc += dt;
    if (flash > 0) flash -= 1;
    const interval = Math.max(110, 680 - lines * 18);
    if (dropAcc >= interval) { dropAcc = 0; if (!hits(piece, 0, 1)) piece.y++; else lock(); }
  }
  function drawCell(x, y, id) {
    ctx.fillStyle = COLORS[id] || "#868e96";
    ctx.fillRect(x * SIZE + 1, y * SIZE + 1, SIZE - 2, SIZE - 2);
  }
  function draw() {
    ctx.fillStyle = flash > 0 ? "#1a2038" : "#0b1020";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#151b2e"; ctx.fillRect(0, 0, COLS * SIZE, ROWS * SIZE);
    // ghost
    if (piece && phase === "play") {
      let gy = 0; while (!hits(piece, 0, gy + 1)) gy++;
      ctx.globalAlpha = 0.25;
      piece.m.forEach(function (row, y) {
        row.forEach(function (v, x) { if (v) drawCell(piece.x + x, piece.y + y + gy, piece.id); });
      });
      ctx.globalAlpha = 1;
    }
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (board[y][x]) drawCell(x, y, board[y][x]);
    if (piece) piece.m.forEach(function (row, y) {
      row.forEach(function (v, x) { if (v) drawCell(piece.x + x, piece.y + y, piece.id); });
    });
    ctx.fillStyle = "#fff"; ctx.font = "700 13px Outfit"; ctx.textAlign = "left";
    ctx.fillText("NEXT", COLS * SIZE + 20, 30);
    if (next) next.m.forEach(function (row, y) {
      row.forEach(function (v, x) {
        if (!v) return;
        ctx.fillStyle = COLORS[next.id];
        ctx.fillRect(COLS * SIZE + 20 + x * 20, 50 + y * 20, 18, 18);
      });
    });
    ctx.fillStyle = "#fff"; ctx.fillText("HOLD", COLS * SIZE + 20, 140);
    if (hold) hold.m.forEach(function (row, y) {
      row.forEach(function (v, x) {
        if (!v) return;
        ctx.fillStyle = COLORS[hold.id];
        ctx.fillRect(COLS * SIZE + 20 + x * 20, 160 + y * 20, 18, 18);
      });
    });
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.45)"; ctx.fillRect(0, 0, COLS * SIZE, ROWS * SIZE);
      ctx.fillStyle = "#fff"; ctx.font = "800 26px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : phase === "pause" ? "PAUSE" : "AETHERSTACK", (COLS * SIZE) / 2, ROWS * SIZE / 2);
      ctx.textAlign = "start";
    }
  }
  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }

  window.addEventListener("keydown", function (e) {
    if (phase !== "play") return;
    if (e.key === "ArrowLeft" && !hits(piece, -1, 0)) piece.x--;
    if (e.key === "ArrowRight" && !hits(piece, 1, 0)) piece.x++;
    if (e.key === "ArrowDown" && !hits(piece, 0, 1)) { piece.y++; score++; }
    if (e.key === "ArrowUp") { const m = rotate(piece.m); if (!hits(piece, 0, 0, m)) { piece.m = m; sfx(280, 0.04, "triangle", 0.02); } }
    if (e.code === "Space") { e.preventDefault(); hardDrop(); }
    if (e.key === "c" || e.key === "C") doHold();
    draw();
  });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; board = empty(); piece = randPiece(); next = randPiece(); hold = null; draw();
})();
