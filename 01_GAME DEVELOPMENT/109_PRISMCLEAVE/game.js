"use strict";
/** PRISMCLEAVE — 専用マッチ3。虹ジェムと連鎖フィーバーが固有。共有なし。 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const N = 8, SIZE = 52, PAD = 24;
  canvas.width = PAD * 2 + N * SIZE; canvas.height = PAD * 2 + N * SIZE + 28;
  const KEY = "vq_prismcleave_best_v2";
  const COLORS = ["#ff6b6b", "#4dabf7", "#69db7c", "#ffe066", "#ff922b"];
  const RAINBOW = 5;
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li>隣接2つクリックで入替</li><li><kbd>H</kbd>ヒント</li>";
  document.getElementById("rules").innerHTML = "<li>3つ以上で消去</li><li>4連鎖で虹ジェム</li><li>手数制限あり</li>";

  let grid, score, phase, sel, moves, fever, hint, audio;

  function sfx(f, d, t, v) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio = audio || new AC(); if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = t || "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.03, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (d || 0.1));
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + (d || 0.12));
    } catch (e) {}
  }

  function rnd() { return Math.random() < 0.04 ? RAINBOW : Math.floor(Math.random() * COLORS.length); }
  function emptyBoard() {
    grid = Array.from({ length: N }, function () { return Array.from({ length: N }, rnd); });
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let guard = 0;
      while (matchAt(x, y).length && guard++ < 20) grid[y][x] = rnd();
    }
  }

  function matchAt(x, y) {
    const c = grid[y][x];
    if (c === RAINBOW) return [];
    const cells = [[x, y]];
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
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      matchAt(x, y).forEach(function (p) { set.add(p[0] + "," + p[1]); });
    }
    return [...set].map(function (s) { return s.split(",").map(Number); });
  }

  function collapse() {
    for (let x = 0; x < N; x++) {
      const col = [];
      for (let y = N - 1; y >= 0; y--) if (grid[y][x] !== null) col.push(grid[y][x]);
      for (let y = N - 1; y >= 0; y--) grid[y][x] = col[N - 1 - y] === undefined ? rnd() : col[N - 1 - y];
    }
  }

  function detonateRainbow(x, y) {
    const cells = [];
    for (let i = 0; i < N; i++) { cells.push([x, i]); cells.push([i, y]); }
    return cells;
  }

  function resolve() {
    let chain = 0;
    for (;;) {
      let m = findAll();
      // rainbow auto if adjacent swap created — handled in swap
      if (!m.length) break;
      m.forEach(function (p) { grid[p[1]][p[0]] = null; });
      chain++;
      score += m.length * 12 * chain;
      if (chain >= 4) {
        const spot = m[0];
        if (spot) grid[spot[1]][spot[0]] = RAINBOW;
        fever = 90; status("フィーバー！虹ジェム");
      }
      sfx(400 + chain * 60, 0.08, "sine", 0.03);
      collapse();
    }
    if (chain) hud();
    return chain;
  }

  function start() {
    score = 0; moves = 28; phase = "play"; sel = null; fever = 0; hint = null;
    emptyBoard(); resolve(); hud(); status("ジェムを揃えろ"); draw(); sfx(440, 0.08, "triangle", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = moves + (fever > 0 ? " FVR" : "");
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function findHint() {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dirs = [[1, 0], [0, 1]];
      for (let d = 0; d < dirs.length; d++) {
        const nx = x + dirs[d][0], ny = y + dirs[d][1];
        if (nx >= N || ny >= N) continue;
        const a = grid[y][x]; grid[y][x] = grid[ny][nx]; grid[ny][nx] = a;
        const ok = findAll().length > 0;
        grid[ny][nx] = grid[y][x]; grid[y][x] = a;
        if (ok) return { x: x, y: y, x2: nx, y2: ny };
      }
    }
    return null;
  }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
  }

  function draw() {
    ctx.fillStyle = fever > 0 ? "#1a1428" : "#14141c";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const px = PAD + x * SIZE, py = PAD + y * SIZE;
      const v = grid[y][x];
      if (v === RAINBOW) {
        const g = ctx.createLinearGradient(px, py, px + SIZE, py + SIZE);
        g.addColorStop(0, "#ff6b6b"); g.addColorStop(0.5, "#4dabf7"); g.addColorStop(1, "#ffe066");
        ctx.fillStyle = g;
      } else ctx.fillStyle = COLORS[v];
      roundRect(px + 4, py + 4, SIZE - 8, SIZE - 8, 10);
      if (sel && sel.x === x && sel.y === y) { ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.stroke(); }
      if (hint && ((hint.x === x && hint.y === y) || (hint.x2 === x && hint.y2 === y))) {
        ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2; ctx.stroke();
      }
    }
    ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = "600 12px IBM Plex Sans JP"; ctx.textAlign = "left";
    ctx.fillText("手数 " + moves + (fever > 0 ? " · FEVER" : ""), PAD, canvas.height - 8);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "TIME UP" : "PRISMCLEAVE", canvas.width / 2, canvas.height / 2);
    }
  }

  canvas.addEventListener("click", function (e) {
    if (phase !== "play") return;
    if (fever > 0) fever -= 1;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * sx - PAD) / SIZE);
    const y = Math.floor(((e.clientY - rect.top) * sy - PAD) / SIZE);
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    hint = null;
    if (!sel) { sel = { x: x, y: y }; draw(); return; }
    const dx = Math.abs(sel.x - x), dy = Math.abs(sel.y - y);
    if (dx + dy === 1) {
      const a = grid[sel.y][sel.x], b = grid[y][x];
      grid[sel.y][sel.x] = b; grid[y][x] = a;
      let matched = false;
      if (a === RAINBOW || b === RAINBOW) {
        const rx = a === RAINBOW ? sel.x : x, ry = a === RAINBOW ? sel.y : y;
        detonateRainbow(rx, ry).forEach(function (p) { grid[p[1]][p[0]] = null; });
        score += 80; collapse(); matched = true; sfx(700, 0.12, "sawtooth", 0.035);
      }
      const chain = resolve();
      if (chain || matched) { moves--; matched = true; }
      else { grid[sel.y][sel.x] = a; grid[y][x] = b; status("マッチなし"); sfx(180, 0.06, "square", 0.02); }
      if (matched) { hud(); if (moves <= 0) { phase = "over"; status("手数切れ"); } }
    }
    sel = null; draw();
  });

  window.addEventListener("keydown", function (e) {
    if ((e.key === "h" || e.key === "H") && phase === "play") {
      hint = findHint(); status(hint ? "ヒント表示" : "手なし…シャッフル推奨"); draw();
    }
  });

  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; status("再開"); draw(); }
  };
  phase = "ready"; emptyBoard(); score = 0; moves = 28; fever = 0; draw();
})();
