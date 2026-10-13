"use strict";
/** MISTSWEEP — 専用マインスイーパ。安全パルスと旗ストリークが固有。共有なし。 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const COLS = 12, ROWS = 12, MINES = 18, SIZE = 36;
  canvas.width = COLS * SIZE; canvas.height = ROWS * SIZE;
  const KEY = "vq_mistsweep_best_v2";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li>左クリック:開く</li><li>右クリック:旗</li><li><kbd>Z</kbd>安全パルス</li>";
  document.getElementById("rules").innerHTML =
    "<li>数字は周囲の地雷</li><li>正解旗でストリーク</li><li>パルスで近傍を点灯</li>";

  let grid, score, phase, flags, startedAt, streak, pulses, pulseCells, audio;

  function sfx(f, d, t, v) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio = audio || new AC(); if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = t || "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.03, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (d || 0.1));
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + (d || 0.12));
    } catch (e) {}
  }

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
    score = 0; phase = "play"; flags = 0; streak = 0; pulses = 2; pulseCells = [];
    startedAt = Date.now();
    grid = Array.from({ length: ROWS }, function () {
      return Array.from({ length: COLS }, function () {
        return { mine: false, open: false, flag: false, n: 0 };
      });
    });
    let placed = 0;
    while (placed < MINES) {
      const x = Math.floor(Math.random() * COLS), y = Math.floor(Math.random() * ROWS);
      if (grid[y][x].mine) continue;
      grid[y][x].mine = true; placed++;
    }
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      grid[y][x].n = neighbors(x, y).filter(function (p) { return grid[p[1]][p[0]].mine; }).length;
    }
    hud(); status("フィールド掃討 — Zでパルス"); draw(); sfx(360, 0.08, "triangle", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = (MINES - flags) + " / P" + pulses;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function openCell(x, y) {
    const c = grid[y][x];
    if (c.open || c.flag) return;
    c.open = true;
    if (c.mine) {
      phase = "over"; streak = 0; revealMines(); status("爆発…"); sfx(100, 0.25, "sawtooth", 0.04); hud(); return;
    }
    score += 5 + streak;
    sfx(420 + streak * 15, 0.05, "square", 0.02);
    if (c.n === 0) neighbors(x, y).forEach(function (p) { openCell(p[0], p[1]); });
    const left = grid.flat().filter(function (t) { return !t.mine && !t.open; }).length;
    if (left === 0) {
      phase = "clear";
      const sec = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
      score += Math.max(80, 450 - sec) + streak * 10;
      status("クリア！ " + sec + "秒"); sfx(680, 0.15, "triangle", 0.04);
    }
    hud();
  }

  function revealMines() { grid.forEach(function (row) { row.forEach(function (c) { if (c.mine) c.open = true; }); }); }

  function safePulse() {
    if (phase !== "play" || pulses <= 0) return;
    pulses -= 1;
    const closed = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (!grid[y][x].open && !grid[y][x].mine && !grid[y][x].flag) closed.push([x, y]);
    }
    pulseCells = [];
    for (let i = 0; i < Math.min(4, closed.length); i++) {
      const idx = Math.floor(Math.random() * closed.length);
      const p = closed.splice(idx, 1)[0];
      pulseCells.push({ x: p[0], y: p[1], life: 90 });
    }
    status("安全パルス ×" + pulseCells.length);
    sfx(500, 0.12, "sine", 0.035); hud(); draw();
  }

  function draw() {
    const nums = ["", "#1c7ed6", "#2f9e44", "#e03131", "#7048e8", "#f08c00", "#0b7285", "#212529", "#868e96"];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = grid[y][x], px = x * SIZE, py = y * SIZE;
      const pulsed = pulseCells.some(function (p) { return p.x === x && p.y === y && p.life > 0; });
      ctx.fillStyle = c.open ? "#dee2e6" : pulsed ? "#fff3bf" : ((x + y) % 2 ? "#8ce99a" : "#69db7c");
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
    pulseCells = pulseCells.filter(function (p) { p.life -= 1; return p.life > 0; });
    if (streak > 1) {
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(4, 4, 90, 20);
      ctx.fillStyle = "#fff"; ctx.font = "700 12px Outfit"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText("STREAK " + streak, 10, 8);
    }
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(phase === "over" ? "BOOM" : phase === "clear" ? "CLEAR" : "MISTSWEEP", canvas.width / 2, canvas.height / 2);
    }
  }

  function cellFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width) / SIZE);
    const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height) / SIZE);
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
    return { x: x, y: y };
  }

  canvas.addEventListener("click", function (e) {
    if (phase !== "play") return;
    const p = cellFromEvent(e); if (!p) return;
    openCell(p.x, p.y); draw();
  });
  canvas.addEventListener("contextmenu", function (e) {
    e.preventDefault();
    if (phase !== "play") return;
    const p = cellFromEvent(e); if (!p) return;
    const c = grid[p.y][p.x];
    if (c.open) return;
    c.flag = !c.flag;
    flags += c.flag ? 1 : -1;
    if (c.flag && c.mine) { streak += 1; score += 8 + streak * 2; status("正解旗 +" + streak); sfx(600, 0.07, "triangle", 0.03); }
    else if (c.flag && !c.mine) { streak = 0; status("誤旗"); sfx(200, 0.06, "square", 0.02); }
    hud(); draw();
  });
  window.addEventListener("keydown", function (e) {
    if (e.key === "z" || e.key === "Z") safePulse();
  });

  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; status("再開"); draw(); }
  };
  phase = "ready"; start();
})();
