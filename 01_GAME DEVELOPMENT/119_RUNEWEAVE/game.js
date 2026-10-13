"use strict";
/**
 * RUNEWEAVE — このタイトル専用マージパズル。
 * 固有技: ルーン刻印（同じ数字を1つ生成）
 * 共有エンジンなし。Alexia非接触。
 */
(function () {
  const N = 4;
  const GOAL = 2048;
  const KEY = "vq_119_runeweave_best_v2";
  const PAD = 18;
  const BRAND = "RUNEWEAVE";
  const BLEED = "共鳴";
  const SPECIAL = "rune";

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const H = canvas.height;
  const CELL = (Math.min(W, H) - PAD * 2) / N;

  const el = {
    score: document.getElementById("score"),
    best: document.getElementById("best"),
    max: document.getElementById("max-tile"),
    bleed: document.getElementById("bleed"),
    pressure: document.getElementById("pressure"),
    status: document.getElementById("status"),
    undoLeft: document.getElementById("undo-left"),
    btnStart: document.getElementById("btn-start"),
    btnUndo: document.getElementById("btn-undo")
  };

  const state = {
    grid: null, score: 0, bleed: 0, pressure: 0,
    phase: "ready", undoLeft: 1, specialLeft: 1, snapshot: null,
    anims: [], particles: [], floats: [], shake: 0, pulse: 0, wonOnce: false
  };
  let audioCtx = null;

  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
  }
  function sfx(kind) {
    try {
      ensureAudio(); if (!audioCtx) return;
      const t0 = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      o.connect(gain); gain.connect(audioCtx.destination);
      if (kind === "merge") {
        o.type = "triangle"; o.frequency.setValueAtTime(280 + 45, t0);
        o.frequency.exponentialRampToValueAtTime(520, t0 + 0.09);
        gain.gain.setValueAtTime(0.045, t0); gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
      } else if (kind === "special") {
        o.type = "sawtooth"; o.frequency.setValueAtTime(200, t0);
        o.frequency.exponentialRampToValueAtTime(600, t0 + 0.14);
        gain.gain.setValueAtTime(0.04, t0); gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.16);
      } else if (kind === "win") {
        o.type = "sine"; o.frequency.setValueAtTime(440, t0);
        o.frequency.exponentialRampToValueAtTime(880, t0 + 0.2);
        gain.gain.setValueAtTime(0.04, t0); gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
      } else {
        o.type = "square"; o.frequency.value = 180;
        gain.gain.setValueAtTime(0.03, t0); gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.1);
      }
      o.start(t0); o.stop(t0 + 0.22);
    } catch (e) {}
  }

  function emptyGrid() { return Array.from({ length: N }, () => Array(N).fill(0)); }
  function cloneGrid(g) { return g.map((r) => r.slice()); }
  function cells() {
    const out = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out.push({ x, y, v: state.grid[y][x] });
    return out;
  }
  function empties() { return cells().filter((c) => !c.v); }
  function maxTile() { return Math.max(0, ...state.grid.flat()); }
  function setStatus(t) { if (el.status) el.status.textContent = t; }

  function hud() {
    if (el.score) el.score.textContent = state.score;
    if (el.max) el.max.textContent = maxTile();
    if (el.bleed) el.bleed.textContent = state.bleed;
    if (el.pressure) el.pressure.textContent = state.specialLeft;
    if (el.undoLeft) el.undoLeft.textContent = state.undoLeft;
    const b = Math.max(+localStorage.getItem(KEY) || 0, state.score);
    localStorage.setItem(KEY, String(b));
    if (el.best) el.best.textContent = b;
  }

  function spawn(v) {
    const e = empties();
    if (!e.length) return false;
    const c = e[Math.floor(Math.random() * e.length)];
    state.grid[c.y][c.x] = v || (Math.random() < 0.9 ? 2 : 4);
    state.anims.push({ x: c.x, y: c.y, t: 0, kind: "spawn" });
    return true;
  }

  function slideLine(vals) {
    const filtered = vals.filter((v) => v);
    const merged = [];
    const mergeAt = [];
    let scoreGain = 0;
    for (let i = 0; i < filtered.length; i++) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        const nv = filtered[i] * 2;
        merged.push(nv); mergeAt.push(merged.length - 1);
        scoreGain += nv; i++;
      } else merged.push(filtered[i]);
    }
    while (merged.length < N) merged.push(0);
    return { line: merged, scoreGain, mergeAt };
  }

  function move(dir) {
    if (state.phase !== "play") return false;
    const prev = cloneGrid(state.grid);
    state.snapshot = { grid: cloneGrid(state.grid), score: state.score, bleed: state.bleed, undoLeft: state.undoLeft, specialLeft: state.specialLeft };
    let moved = false;
    let gain = 0;
    const mergeCells = [];

    if (dir === "left" || dir === "right") {
      for (let y = 0; y < N; y++) {
        let vals = state.grid[y].slice();
        if (dir === "right") vals.reverse();
        const res = slideLine(vals);
        if (dir === "right") {
          res.line.reverse();
          res.mergeAt = res.mergeAt.map((i) => N - 1 - i);
        }
        for (let x = 0; x < N; x++) {
          if (state.grid[y][x] !== res.line[x]) moved = true;
          state.grid[y][x] = res.line[x];
        }
        gain += res.scoreGain;
        res.mergeAt.forEach((x) => mergeCells.push({ x, y, v: state.grid[y][x] }));
      }
    } else {
      for (let x = 0; x < N; x++) {
        let vals = [];
        for (let y = 0; y < N; y++) vals.push(state.grid[y][x]);
        if (dir === "down") vals.reverse();
        const res = slideLine(vals);
        if (dir === "down") {
          res.line.reverse();
          res.mergeAt = res.mergeAt.map((i) => N - 1 - i);
        }
        for (let y = 0; y < N; y++) {
          if (state.grid[y][x] !== res.line[y]) moved = true;
          state.grid[y][x] = res.line[y];
        }
        gain += res.scoreGain;
        res.mergeAt.forEach((y) => mergeCells.push({ x, y, v: state.grid[y][x] }));
      }
    }

    if (!moved) { state.grid = prev; return false; }
    state.score += gain;
    if (mergeCells.length) {
      sfx("merge");
      mergeCells.forEach((c) => {
        burst(cellCX(c.x), cellCY(c.y), "hsl(45 55% 55%)", 8);
        floatAt(cellCX(c.x), cellCY(c.y), "+" + c.v, "hsl(45 55% 55%)");
      });
      const bleedGain = applyBleed(mergeCells);
      if (bleedGain) { state.bleed += 1; state.score += bleedGain; setStatus(BLEED + " +" + bleedGain); }
    }
    spawn();
    state.pressure = empties().length;
    if (maxTile() >= GOAL && !state.wonOnce) {
      state.wonOnce = true; state.phase = "won"; sfx("win");
      setStatus("達成 — " + GOAL + "。続けて遊べます。");
    } else if (!canMove()) {
      state.phase = "over"; setStatus("詰み — はじめるで再挑戦"); sfx("dead");
    }
    hud();
    return true;
  }

  function applyBleed(mergeCells) {
    if (!mergeCells.length || Math.random() > 0.35) return 0;
    const m = mergeCells[0];
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (const d of dirs) {
      const nx = m.x + d[0], ny = m.y + d[1];
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      if (state.grid[ny][nx] === m.v && m.v) {
        state.grid[ny][nx] = m.v * 2;
        state.grid[m.y][m.x] = 0;
        return m.v * 2;
      }
    }
    return 0;
  }

  function cellCX(x) { return PAD + x * CELL + CELL / 2; }
  function cellCY(y) { return PAD + y * CELL + CELL / 2; }
  function burst(x, y, color, n) {
    for (let i = 0; i < n; i++) {
      state.particles.push({
        x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4,
        life: 350 + Math.random() * 300, r: 1.5 + Math.random() * 2, color
      });
    }
  }
  function floatAt(x, y, text, color) {
    state.floats.push({ x, y, text, color, life: 800, vy: -0.05 });
  }

  function useSpecial() {
    if (state.phase !== "play" || state.specialLeft <= 0) return;
    state.snapshot = { grid: cloneGrid(state.grid), score: state.score, bleed: state.bleed, undoLeft: state.undoLeft, specialLeft: state.specialLeft };
    let used = false;

    if (SPECIAL === "fold" || SPECIAL === "fuse") {
      // absorb neighbor into max tile
      let mx = 0, my = 0, mv = 0;
      cells().forEach((c) => { if (c.v > mv) { mv = c.v; mx = c.x; my = c.y; } });
      const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (const d of dirs) {
        const nx = mx + d[0], ny = my + d[1];
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
        if (state.grid[ny][nx]) {
          state.grid[my][mx] += state.grid[ny][nx];
          state.score += state.grid[ny][nx];
          state.grid[ny][nx] = 0;
          used = true; break;
        }
      }
    } else if (SPECIAL === "hexpulse") {
      const cx = 1 + Math.floor(Math.random() * 2), cy = 1 + Math.floor(Math.random() * 2);
      [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach((d) => {
        const x = cx + d[0], y = cy + d[1];
        if (x >= 0 && y >= 0 && x < N && y < N && state.grid[y][x]) {
          state.score += Math.floor(state.grid[y][x] / 2);
          state.grid[y][x] = 0; used = true;
        }
      });
    } else if (SPECIAL === "polish") {
      const filled = cells().filter((c) => c.v && c.v < GOAL);
      if (filled.length) {
        const c = filled[Math.floor(Math.random() * filled.length)];
        state.grid[c.y][c.x] *= 2; state.score += state.grid[c.y][c.x]; used = true;
      }
    } else if (SPECIAL === "rune" || SPECIAL === "mint" || SPECIAL === "sprout") {
      const v = SPECIAL === "sprout" ? 4 : 2;
      const n = SPECIAL === "mint" ? 2 : 1;
      for (let i = 0; i < n; i++) if (spawn(v)) used = true;
    } else if (SPECIAL === "crease") {
      const y = Math.floor(Math.random() * N);
      const res = slideLine(state.grid[y].slice());
      state.grid[y] = res.line; state.score += res.scoreGain; used = true;
    } else if (SPECIAL === "bloom") {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (state.grid[y][x] === 2) { state.grid[y][x] = 4; used = true; }
      }
    }

    if (!used) { setStatus("技が使えない…"); return; }
    state.specialLeft -= 1;
    sfx("special");
    setStatus("ルーン刻印（同じ数字を1つ生成）");
    burst(W / 2, H / 2, "hsl(85 50% 48%)", 16);
    if (!canMove()) { state.phase = "over"; setStatus("詰み"); }
    hud();
  }

  function canMove() {
    if (empties().length) return true;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const v = state.grid[y][x];
      if (x + 1 < N && state.grid[y][x + 1] === v) return true;
      if (y + 1 < N && state.grid[y + 1][x] === v) return true;
    }
    return false;
  }

  function start() {
    state.grid = emptyGrid();
    state.score = 0; state.bleed = 0; state.pressure = 0;
    state.phase = "play"; state.undoLeft = 1; state.specialLeft = 1;
    state.wonOnce = false; state.particles = []; state.floats = []; state.anims = [];
    spawn(); spawn();
    hud(); setStatus(BRAND + " — " + "刻印で連鎖を作れ");
    sfx("merge");
  }

  function undo() {
    if (!state.snapshot || state.undoLeft <= 0 || state.phase === "ready") return;
    state.grid = cloneGrid(state.snapshot.grid);
    state.score = state.snapshot.score;
    state.bleed = state.snapshot.bleed;
    state.specialLeft = state.snapshot.specialLeft;
    state.undoLeft -= 1;
    state.phase = "play";
    state.snapshot = null;
    hud(); setStatus("Undo");
  }

  function colorFor(v) {
    if (!v) return "rgba(255,255,255,.06)";
    const t = Math.log2(v);
    const h = (45 + t * 18) % 360;
    return "hsl(" + h + " 55% " + (62 - t * 2) + "%)";
  }

  function draw() {
    ctx.fillStyle = "hsl(" + 45 + " 18% 8%)";
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const px = PAD + x * CELL, py = PAD + y * CELL;
      const v = state.grid ? state.grid[y][x] : 0;
      ctx.fillStyle = colorFor(v);
      round(px + 4, py + 4, CELL - 8, CELL - 8, 10);
      if (v) {
        ctx.fillStyle = v >= 8 ? "#fff" : "#222";
        ctx.font = "800 " + (v >= 1024 ? 22 : 28) + "px Outfit, sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(v), px + CELL / 2, py + CELL / 2 + 1);
      }
    }
    state.particles = state.particles.filter((p) => {
      p.life -= 16; p.x += p.vx; p.y += p.vy;
      ctx.globalAlpha = Math.max(0, p.life / 500);
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      return p.life > 0;
    });
    ctx.globalAlpha = 1;
    state.floats = state.floats.filter((f) => {
      f.life -= 16; f.y += f.vy * 16;
      ctx.globalAlpha = Math.max(0, f.life / 800);
      ctx.fillStyle = f.color; ctx.font = "700 14px Fraunces, Outfit"; ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
      return f.life > 0;
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.font = "600 12px IBM Plex Sans JP"; ctx.textAlign = "left";
    ctx.fillText(BRAND + " 技残 " + state.specialLeft + " · Z", PAD, H - 8);
    if (state.phase === "over" || state.phase === "won" || state.phase === "ready") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      const msg = state.phase === "over" ? "OVER" : state.phase === "won" ? "GOAL" : BRAND;
      ctx.fillText(msg, W / 2, H / 2);
    }
    requestAnimationFrame(draw);
  }

  function round(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
  }

  const map = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "up", ArrowDown: "down" };
  window.addEventListener("keydown", (e) => {
    if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    if (e.key === "z" || e.key === "Z" || e.key === "z") useSpecial();
  });
  let sx = 0, sy = 0;
  canvas.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; });
  canvas.addEventListener("pointerup", (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.hypot(dx, dy) < 24) return;
    if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "right" : "left");
    else move(dy > 0 ? "down" : "up");
  });

  if (el.btnStart) el.btnStart.onclick = start;
  if (el.btnUndo) el.btnUndo.onclick = undo;
  if (el.best) el.best.textContent = localStorage.getItem(KEY) || "0";

  const keysEl = document.getElementById("keys");
  const rulesEl = document.getElementById("rules");
  if (keysEl) keysEl.innerHTML = "<li><kbd>←↑→↓</kbd><span>スライド</span></li><li><kbd>Z</kbd><span>ルーン刻印（同じ数字を1つ生成）</span></li>";
  if (rulesEl) rulesEl.innerHTML = "<li>" + GOAL + " 到達が目標</li><li>" + BLEED + " 連鎖あり</li><li>専用技は1回</li>";

  state.grid = emptyGrid();
  draw();
  setStatus(BRAND + " — はじめるを押して");
})();
