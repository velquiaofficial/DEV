"use strict";

/**
 * MERGEHAVEN — standalone merge puzzle.
 * No shared engine. All logic in this file.
 */

const N = 4;
const GOAL = 2048;
const KEY = "vq_mkt3_mergehaven_v1";
const PAD = 18;

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
  grid: null,
  score: 0,
  bleed: 0,
  pressure: 0,
  phase: "ready", // ready | play | won | over
  undoLeft: 1,
  snapshot: null,
  anims: [],
  particles: [],
  floats: [],
  shake: 0,
  pulse: 0,
  wonOnce: false
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
    ensureAudio();
    if (!audioCtx) return;
    const t0 = audioCtx.currentTime;
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);
    if (kind === "merge") {
      o.type = "triangle";
      o.frequency.setValueAtTime(280, t0);
      o.frequency.exponentialRampToValueAtTime(520, t0 + 0.09);
      g.gain.setValueAtTime(0.045, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.12);
    } else if (kind === "bleed") {
      o.type = "sine";
      o.frequency.setValueAtTime(660, t0);
      o.frequency.exponentialRampToValueAtTime(220, t0 + 0.16);
      g.gain.setValueAtTime(0.035, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
    } else if (kind === "win") {
      o.type = "sine";
      o.frequency.setValueAtTime(440, t0);
      o.frequency.exponentialRampToValueAtTime(880, t0 + 0.25);
      g.gain.setValueAtTime(0.05, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.3);
    } else {
      o.type = "sine";
      o.frequency.value = 180;
      g.gain.setValueAtTime(0.025, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
    }
    o.start(t0);
    o.stop(t0 + 0.32);
  } catch {
    /* ignore */
  }
}

function emptyGrid() {
  return Array.from({ length: N }, () => Array(N).fill(0));
}

function cloneGrid(g) {
  return g.map((row) => row.slice());
}

function loadBest() {
  return Number(localStorage.getItem(KEY) || 0);
}

function saveBest() {
  const b = Math.max(loadBest(), state.score);
  localStorage.setItem(KEY, String(b));
  el.best.textContent = String(b);
}

function cellCenter(x, y) {
  return {
    cx: PAD + x * CELL + CELL / 2,
    cy: PAD + y * CELL + CELL / 2
  };
}

function burst(x, y, color, n = 12) {
  for (let i = 0; i < n; i++) {
    state.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5 - 1,
      life: 400 + Math.random() * 500,
      r: 1.5 + Math.random() * 3.5,
      color
    });
  }
  state.shake = Math.min(10, state.shake + 3);
}

function floatText(x, y, text, color) {
  state.floats.push({ x, y, text, color, life: 900, vy: -0.04 });
}

function inkColor(v) {
  if (!v) return "#1a1a1e";
  const t = Math.min(1, Math.log2(v) / 11);
  // charcoal → gold → teal bloom for high values
  if (v >= 512) {
    const a = Math.min(1, (Math.log2(v) - 9) / 3);
    return lerpColor("#4cc9f0", "#f72585", a);
  }
  return lerpColor("#2a2a30", "#4cc9f0", t);
}

function lerpColor(a, b, t) {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexRgb(h) {
  const n = h.replace("#", "");
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16)
  };
}

function freeCells(grid) {
  const out = [];
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!grid[y][x]) out.push([x, y]);
    }
  }
  return out;
}

function spawn(grid, forced) {
  const free = freeCells(grid);
  if (!free.length) return false;
  const [x, y] = free[(Math.random() * free.length) | 0];
  let v = forced || (Math.random() < 0.9 ? 2 : 4);
  if (!forced && state.pressure >= 100) {
    v = 8;
    state.pressure = 0;
    setStatus("濃墨が落ちた。");
    sfx("bleed");
  }
  grid[y][x] = v;
  const { cx, cy } = cellCenter(x, y);
  burst(cx, cy, inkColor(v), 8);
  return true;
}

function slideLine(line) {
  const vals = line.filter(Boolean);
  const merged = [];
  let scoreGain = 0;
  const mergeAt = [];
  for (let i = 0; i < vals.length; i++) {
    if (i + 1 < vals.length && vals[i] === vals[i + 1]) {
      const nv = vals[i] * 2;
      merged.push(nv);
      scoreGain += nv;
      mergeAt.push(merged.length - 1);
      i++;
    } else {
      merged.push(vals[i]);
    }
  }
  while (merged.length < N) merged.push(0);
  return { line: merged, scoreGain, mergeAt };
}

function move(dir) {
  if (state.phase !== "play" && state.phase !== "won") return;
  if (state.phase === "won" && state.wonOnce) {
    /* continue after win */
  }

  const before = cloneGrid(state.grid);
  state.snapshot = {
    grid: cloneGrid(state.grid),
    score: state.score,
    bleed: state.bleed,
    pressure: state.pressure
  };

  let scoreGain = 0;
  const mergeCells = [];

  if (dir === "L" || dir === "R") {
    for (let y = 0; y < N; y++) {
      let row = state.grid[y].slice();
      if (dir === "R") row.reverse();
      const res = slideLine(row);
      if (dir === "R") {
        res.line.reverse();
        res.mergeAt = res.mergeAt.map((i) => N - 1 - i);
      }
      state.grid[y] = res.line;
      scoreGain += res.scoreGain;
      res.mergeAt.forEach((x) => mergeCells.push({ x, y, v: state.grid[y][x] }));
    }
  } else {
    for (let x = 0; x < N; x++) {
      let col = state.grid.map((r) => r[x]);
      if (dir === "D") col.reverse();
      const res = slideLine(col);
      if (dir === "D") {
        res.line.reverse();
        res.mergeAt = res.mergeAt.map((i) => N - 1 - i);
      }
      for (let y = 0; y < N; y++) state.grid[y][x] = res.line[y];
      scoreGain += res.scoreGain;
      res.mergeAt.forEach((y) => mergeCells.push({ x, y, v: state.grid[y][x] }));
    }
  }

  if (JSON.stringify(before) === JSON.stringify(state.grid)) {
    state.snapshot = null;
    return;
  }

  state.score += scoreGain;
  if (scoreGain) {
    sfx("merge");
    mergeCells.forEach((c) => {
      const { cx, cy } = cellCenter(c.x, c.y);
      burst(cx, cy, inkColor(c.v), 14);
      floatText(cx, cy - 8, "+" + c.v, "#4cc9f0");
    });
  }

  // Ink bleed: after merges, adjacent equal tiles may double once (chain bonus)
  const bleedGain = applyBleed(mergeCells);
  if (bleedGain) {
    state.score += bleedGain;
    state.bleed += 1;
    state.pressure = Math.min(100, state.pressure + 18);
    sfx("bleed");
    setStatus("にじみ連鎖 +" + bleedGain);
  } else {
    state.pressure = Math.min(100, state.pressure + 6);
  }

  spawn(state.grid);
  afterMove();
}

function applyBleed(mergeCells) {
  if (!mergeCells.length) return 0;
  let gain = 0;
  const used = new Set();
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ];

  for (const m of mergeCells) {
    for (const [dx, dy] of dirs) {
      const nx = m.x + dx;
      const ny = m.y + dy;
      if (nx < 0 || ny < 0 || nx >= N || ny >= N) continue;
      const key = nx + "," + ny;
      if (used.has(key)) continue;
      if (state.grid[ny][nx] === m.v && Math.random() < 0.35) {
        used.add(key);
        used.add(m.x + "," + m.y);
        const nv = m.v * 2;
        state.grid[ny][nx] = 0;
        state.grid[m.y][m.x] = nv;
        gain += nv;
        const { cx, cy } = cellCenter(m.x, m.y);
        burst(cx, cy, "#f72585", 18);
        floatText(cx, cy + 14, "BLEED", "#f72585");
        break;
      }
    }
  }
  return gain;
}

function canMove(grid) {
  if (freeCells(grid).length) return true;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const v = grid[y][x];
      if (x + 1 < N && grid[y][x + 1] === v) return true;
      if (y + 1 < N && grid[y + 1][x] === v) return true;
    }
  }
  return false;
}

function maxTile(grid) {
  return Math.max(0, ...grid.flat());
}

function afterMove() {
  saveBest();
  hud();
  const max = maxTile(state.grid);
  if (max >= GOAL && !state.wonOnce) {
    state.wonOnce = true;
    state.phase = "won";
    canvas.classList.add("cleared");
    setStatus("傑作 — 2048。続けて遊べます。", "win");
    sfx("win");
  } else if (!canMove(state.grid)) {
    state.phase = "over";
    setStatus("墨が乾いた。詰みです。はじめるで再挑戦。", "over");
  } else if (state.phase !== "won") {
    state.phase = "play";
    if (!el.status.classList.contains("win")) {
      setStatus("同じ濃度を重ねて倍化。にじみに注意。");
    }
  }
  el.btnUndo.disabled = !(state.snapshot && state.undoLeft > 0 && (state.phase === "play" || state.phase === "won"));
}

function hud() {
  el.score.textContent = String(state.score);
  el.best.textContent = String(loadBest());
  el.max.textContent = String(maxTile(state.grid || emptyGrid()) || 2);
  el.bleed.textContent = String(state.bleed);
  el.pressure.style.width = state.pressure + "%";
  el.undoLeft.textContent = String(state.undoLeft);
}

function setStatus(text, cls) {
  el.status.textContent = text;
  el.status.classList.remove("win", "over");
  if (cls) el.status.classList.add(cls);
}

function start() {
  ensureAudio();
  state.grid = emptyGrid();
  state.score = 0;
  state.bleed = 0;
  state.pressure = 0;
  state.phase = "play";
  state.undoLeft = 1;
  state.snapshot = null;
  state.wonOnce = false;
  state.particles = [];
  state.floats = [];
  canvas.classList.remove("cleared");
  spawn(state.grid);
  spawn(state.grid);
  hud();
  el.btnUndo.disabled = true;
  el.btnStart.textContent = "もう一度";
  setStatus("墨を流せ。");
  sfx("spawn");
}

function undo() {
  if (!state.snapshot || state.undoLeft <= 0) return;
  if (state.phase !== "play" && state.phase !== "won") return;
  state.grid = cloneGrid(state.snapshot.grid);
  state.score = state.snapshot.score;
  state.bleed = state.snapshot.bleed;
  state.pressure = state.snapshot.pressure;
  state.undoLeft -= 1;
  state.snapshot = null;
  state.phase = "play";
  canvas.classList.remove("cleared");
  hud();
  el.btnUndo.disabled = true;
  setStatus("一手戻した。");
}

function draw() {
  state.pulse += 1;
  if (state.shake > 0) state.shake *= 0.88;

  ctx.save();
  if (state.shake > 0.4) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }

  // paper-ink wash
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#141418");
  g.addColorStop(1, "#0c0c10");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // subtle fiber
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 40; i++) {
    ctx.strokeStyle = "#fff";
    ctx.beginPath();
    const x = (i * 47 + state.pulse * 0.2) % W;
    ctx.moveTo(x, 0);
    ctx.lineTo(x - 30, H);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // slots
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const px = PAD + x * CELL;
      const py = PAD + y * CELL;
      ctx.fillStyle = "rgba(255,255,255,0.03)";
      roundRect(px + 4, py + 4, CELL - 8, CELL - 8, 10);
      ctx.fill();
    }
  }

  if (state.grid) {
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const v = state.grid[y][x];
        if (!v) continue;
        drawTile(x, y, v);
      }
    }
  }

  // particles
  state.particles = state.particles.filter((p) => {
    p.life -= 16;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    ctx.globalAlpha = Math.max(0, p.life / 700);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    return p.life > 0;
  });
  ctx.globalAlpha = 1;

  state.floats = state.floats.filter((f) => {
    f.life -= 16;
    f.y += f.vy * 16;
    ctx.globalAlpha = Math.max(0, f.life / 900);
    ctx.fillStyle = f.color;
    ctx.font = "700 16px Bodoni Moda, serif";
    ctx.textAlign = "center";
    ctx.fillText(f.text, f.x, f.y);
    return f.life > 0;
  });
  ctx.globalAlpha = 1;

  if (state.phase === "ready") {
    overlay("MERGEHAVEN", "はじめるで墨を落とす");
  } else if (state.phase === "over") {
    overlay("乾いた", "詰み — はじめるで再挑戦");
  } else if (state.phase === "won") {
    overlay("傑作", "2048 — 続けてもよい");
  }

  ctx.restore();
  requestAnimationFrame(draw);
}

function drawTile(x, y, v) {
  const px = PAD + x * CELL + 6;
  const py = PAD + y * CELL + 6;
  const s = CELL - 12;
  const col = inkColor(v);

  ctx.save();
  ctx.shadowColor = col;
  ctx.shadowBlur = v >= 128 ? 16 : 6;
  ctx.fillStyle = col;
  roundRect(px, py, s, s, 12);
  ctx.fill();
  ctx.restore();

  // ink rim
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  roundRect(px + 1, py + 1, s - 2, s - 2, 11);
  ctx.stroke();

  ctx.fillStyle = v >= 64 ? "#141410" : "#f2efe6";
  ctx.font = `700 ${v >= 1024 ? 22 : v >= 128 ? 28 : 34}px Bodoni Moda, serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(v), px + s / 2, py + s / 2 + 1);
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function overlay(title, sub) {
  ctx.fillStyle = "rgba(8,8,10,0.55)";
  ctx.fillRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(W * 0.3, H * 0.42, W * 0.7, H * 0.58);
  grad.addColorStop(0, "#4cc9f0");
  grad.addColorStop(1, "#f72585");
  ctx.fillStyle = grad;
  ctx.font = "700 48px Bodoni Moda, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, W / 2, H / 2 - 10);
  ctx.fillStyle = "rgba(242,239,230,0.75)";
  ctx.font = "500 14px IBM Plex Sans JP, sans-serif";
  ctx.fillText(sub, W / 2, H / 2 + 32);
}

function onKey(e) {
  const map = {
    ArrowLeft: "L",
    ArrowRight: "R",
    ArrowUp: "U",
    ArrowDown: "D",
    a: "L",
    d: "R",
    w: "U",
    s: "D"
  };
  if (e.key === "u" || e.key === "U") {
    e.preventDefault();
    undo();
    return;
  }
  if (e.key === "r" || e.key === "R") {
    e.preventDefault();
    start();
    return;
  }
  const dir = map[e.key];
  if (!dir) return;
  e.preventDefault();
  if (state.phase === "ready") start();
  else move(dir);
}

let swipeX = 0;
let swipeY = 0;
canvas.addEventListener("pointerdown", (e) => {
  swipeX = e.clientX;
  swipeY = e.clientY;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener("pointerup", (e) => {
  const dx = e.clientX - swipeX;
  const dy = e.clientY - swipeY;
  if (Math.abs(dx) < 28 && Math.abs(dy) < 28) return;
  if (state.phase === "ready") {
    start();
    return;
  }
  if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? "R" : "L");
  else move(dy > 0 ? "D" : "U");
});

window.addEventListener("keydown", onKey);
el.btnStart.addEventListener("click", start);
el.btnUndo.addEventListener("click", undo);

el.best.textContent = String(loadBest());
hud();
setStatus("はじめるで墨を落とす。矢印キーまたはスワイプで合成。");
requestAnimationFrame(draw);
