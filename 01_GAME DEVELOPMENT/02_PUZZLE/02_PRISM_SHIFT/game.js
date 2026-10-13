"use strict";

/**
 * Prism Shift — standalone light-routing puzzle.
 * No shared engine. All logic lives in this file.
 */

const DIRS = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 }
};

const CW = { N: "E", E: "S", S: "W", W: "N" };
const STORAGE_KEY = "velquia_prism_shift_v1";

/** Mirror facing: 0 = \, 1 = / */
function reflectMirror(facing, inbound) {
  if (facing === 0) {
    if (inbound === "E") return "S";
    if (inbound === "S") return "E";
    if (inbound === "W") return "N";
    if (inbound === "N") return "W";
  } else {
    if (inbound === "E") return "N";
    if (inbound === "N") return "E";
    if (inbound === "W") return "S";
    if (inbound === "S") return "W";
  }
  return null;
}

/** Prism: continues forward and branches one step clockwise, rotated by facing. */
function prismOutputs(facing, inbound) {
  let branch = CW[inbound];
  for (let i = 0; i < facing % 4; i++) branch = CW[branch];
  if (branch === inbound) return [inbound];
  return [inbound, branch];
}

/**
 * Grid chars:
 *  . empty  # wall  * sink  \ / mirror  A–D prism facing 0–3
 *  E placeholder (emitter placed from emitters list)
 */
const STAGES = [
  {
    id: 1,
    titleJA: "はじめての反射",
    size: 5,
    rows: [
      ".....",
      ".....",
      "E../.",
      ".....",
      "...*."
    ],
    emitters: [{ x: 0, y: 2, dir: "E" }]
    // Flip / → \ at (3,2): E→S into sink.
  },
  {
    id: 2,
    titleJA: "二度まがる",
    size: 6,
    rows: [
      "E.....",
      "......",
      "..\\...",
      "......",
      "..../.",
      ".....*"
    ],
    emitters: [{ x: 0, y: 0, dir: "E" }]
    // Route to bottom-right via two mirrors.
  },
  {
    id: 3,
    titleJA: "壁をよける",
    size: 6,
    rows: [
      "E.#..*",
      "..#...",
      "..#...",
      "../...",
      "......",
      "....\\."
    ],
    emitters: [{ x: 0, y: 0, dir: "E" }]
  },
  {
    id: 4,
    titleJA: "二つの受け皿",
    size: 7,
    rows: [
      "*.....*",
      ".......",
      "...A...",
      "E......",
      ".......",
      "...\\...",
      "......."
    ],
    emitters: [{ x: 0, y: 3, dir: "E" }]
  },
  {
    id: 5,
    titleJA: "交差する光",
    size: 7,
    rows: [
      "..*....",
      ".......",
      "E../...",
      ".......",
      "...\\..*",
      ".......",
      "......."
    ],
    emitters: [{ x: 0, y: 2, dir: "E" }]
  },
  {
    id: 6,
    titleJA: "二本の光源",
    size: 7,
    rows: [
      "E.....*",
      ".......",
      ".../...",
      ".......",
      "E..\\...",
      ".......",
      "*......"
    ],
    emitters: [
      { x: 0, y: 0, dir: "E" },
      { x: 0, y: 4, dir: "E" }
    ]
  },
  {
    id: 7,
    titleJA: "プリズム回廊",
    size: 8,
    rows: [
      "E.......",
      "........",
      "..A.....",
      "........",
      "....B...",
      "........",
      ".......*",
      "*......."
    ],
    emitters: [{ x: 0, y: 0, dir: "E" }]
  },
  {
    id: 8,
    titleJA: "最後の屈折",
    size: 8,
    rows: [
      "E.#....*",
      "..#.....",
      "..#./...",
      "........",
      "...A.#..",
      ".....#..",
      "*....#..",
      ".....\\.."
    ],
    emitters: [{ x: 0, y: 0, dir: "E" }]
  }
];

function cellFromChar(ch, x, y) {
  if (ch === "#") return { type: "wall", x, y };
  if (ch === "*") return { type: "sink", x, y, lit: false };
  if (ch === "\\") return { type: "mirror", facing: 0, x, y };
  if (ch === "/") return { type: "mirror", facing: 1, x, y };
  if (ch === "A") return { type: "prism", facing: 0, x, y };
  if (ch === "B") return { type: "prism", facing: 1, x, y };
  if (ch === "C") return { type: "prism", facing: 2, x, y };
  if (ch === "D") return { type: "prism", facing: 3, x, y };
  return { type: "empty", x, y };
}

function parseStage(stage) {
  const size = stage.size;
  const cells = [];
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      cells[y][x] = cellFromChar(stage.rows[y][x] || ".", x, y);
    }
  }
  for (const em of stage.emitters) {
    cells[em.y][em.x] = { type: "emitter", dir: em.dir, x: em.x, y: em.y };
  }
  return {
    size,
    cells,
    emitters: stage.emitters.map((e) => ({ ...e })),
    titleJA: stage.titleJA,
    id: stage.id
  };
}

function cloneBoard(board) {
  return {
    size: board.size,
    id: board.id,
    titleJA: board.titleJA,
    emitters: board.emitters.map((e) => ({ ...e })),
    cells: board.cells.map((row) => row.map((c) => ({ ...c })))
  };
}

function simulate(board) {
  const size = board.size;
  const beams = [];
  const visited = new Set();
  const queue = board.emitters.map((em) => ({ x: em.x, y: em.y, dir: em.dir }));

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board.cells[y][x].type === "sink") board.cells[y][x].lit = false;
    }
  }

  while (queue.length) {
    const cur = queue.shift();
    const key = `${cur.x},${cur.y},${cur.dir}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const d = DIRS[cur.dir];
    const nx = cur.x + d.x;
    const ny = cur.y + d.y;
    if (nx < 0 || ny < 0 || nx >= size || ny >= size) {
      beams.push({
        x0: cur.x,
        y0: cur.y,
        x1: cur.x + d.x * 0.45,
        y1: cur.y + d.y * 0.45
      });
      continue;
    }

    beams.push({ x0: cur.x, y0: cur.y, x1: nx, y1: ny });

    const cell = board.cells[ny][nx];
    if (cell.type === "wall") continue;

    if (cell.type === "sink") {
      cell.lit = true;
      continue;
    }

    if (cell.type === "mirror") {
      const out = reflectMirror(cell.facing, cur.dir);
      if (out) queue.push({ x: nx, y: ny, dir: out });
      continue;
    }

    if (cell.type === "prism") {
      for (const out of prismOutputs(cell.facing, cur.dir)) {
        queue.push({ x: nx, y: ny, dir: out });
      }
      continue;
    }

    queue.push({ x: nx, y: ny, dir: cur.dir });
  }

  let sinkTotal = 0;
  let sinkLit = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board.cells[y][x].type === "sink") {
        sinkTotal++;
        if (board.cells[y][x].lit) sinkLit++;
      }
    }
  }

  return {
    beams,
    sinkTotal,
    sinkLit,
    cleared: sinkTotal > 0 && sinkLit === sinkTotal
  };
}

function rotateCell(cell) {
  if (cell.type === "mirror") {
    cell.facing = cell.facing === 0 ? 1 : 0;
    return true;
  }
  if (cell.type === "prism") {
    cell.facing = (cell.facing + 1) % 4;
    return true;
  }
  return false;
}

const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const elStage = document.getElementById("stage-label");
const elMoves = document.getElementById("moves");
const elLit = document.getElementById("lit");
const elStatus = document.getElementById("status");
const elLead = document.getElementById("lead");
const btnReset = document.getElementById("btn-reset");
const btnNext = document.getElementById("btn-next");

const state = {
  index: 0,
  board: null,
  moves: 0,
  sim: null,
  pulse: 0,
  cleared: false
};

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return Math.min(Math.max(0, data.index | 0), STAGES.length - 1);
  } catch {
    return 0;
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ index: state.index }));
  } catch {
    /* ignore */
  }
}

function startStage(index) {
  state.index = index;
  state.board = cloneBoard(parseStage(STAGES[index]));
  state.moves = 0;
  state.cleared = false;
  canvas.classList.remove("cleared");
  btnNext.disabled = true;
  elLead.textContent = `${state.board.titleJA} — 鏡とプリズムを回し、光をすべての受け皿へ届ける。`;
  elStatus.textContent = "セルをタップして回転。光が通る経路は自動で更新されます。";
  elStatus.classList.remove("win");
  saveProgress();
  refresh();
}

function refresh() {
  state.sim = simulate(state.board);
  elStage.textContent = `${state.index + 1} / ${STAGES.length}`;
  elMoves.textContent = String(state.moves);
  elLit.textContent = `${state.sim.sinkLit} / ${state.sim.sinkTotal}`;
  if (state.sim.cleared && !state.cleared) {
    state.cleared = true;
    canvas.classList.add("cleared");
    btnNext.disabled = state.index >= STAGES.length - 1;
    elStatus.textContent =
      state.index >= STAGES.length - 1
        ? "全ステージクリア。Prism Shift、完走です。"
        : "クリア！「次のステージ」へ進めます。";
    elStatus.classList.add("win");
  }
  draw();
}

function cellCenter(x, y, pad, cell) {
  return {
    cx: pad + x * cell + cell / 2,
    cy: pad + y * cell + cell / 2
  };
}

function draw() {
  const board = state.board;
  const size = board.size;
  const W = canvas.width;
  const H = canvas.height;
  const pad = 18;
  const cell = (Math.min(W, H) - pad * 2) / size;

  ctx.clearRect(0, 0, W, H);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#122634");
  g.addColorStop(1, "#0a141c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = pad + x * cell;
      const py = pad + y * cell;
      ctx.strokeStyle = "rgba(120,196,184,0.12)";
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
    }
  }

  const pulse = 0.55 + 0.45 * Math.sin(state.pulse * 0.08);
  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = `rgba(232,184,74,${0.55 * pulse})`;
  ctx.shadowBlur = 10;
  ctx.strokeStyle = `rgba(232,184,74,${0.75 + 0.2 * pulse})`;
  ctx.lineWidth = Math.max(2.5, cell * 0.08);
  for (const b of state.sim.beams) {
    const a = cellCenter(b.x0, b.y0, pad, cell);
    const c = cellCenter(b.x1, b.y1, pad, cell);
    ctx.beginPath();
    ctx.moveTo(a.cx, a.cy);
    ctx.lineTo(c.cx, c.cy);
    ctx.stroke();
  }
  ctx.restore();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      drawPiece(board.cells[y][x], pad, cell);
    }
  }
}

function drawPiece(cell, pad, cellSize) {
  const { cx, cy } = cellCenter(cell.x, cell.y, pad, cellSize);
  const r = cellSize * 0.32;

  if (cell.type === "wall") {
    ctx.fillStyle = "#243846";
    ctx.fillRect(
      pad + cell.x * cellSize + 4,
      pad + cell.y * cellSize + 4,
      cellSize - 8,
      cellSize - 8
    );
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      pad + cell.x * cellSize + 4,
      pad + cell.y * cellSize + 4,
      cellSize - 8,
      cellSize - 8
    );
    ctx.clip();
    ctx.strokeStyle = "rgba(140,170,185,0.15)";
    ctx.lineWidth = 1;
    for (let i = -cellSize; i < cellSize * 2; i += 6) {
      ctx.beginPath();
      ctx.moveTo(pad + cell.x * cellSize + i, pad + cell.y * cellSize);
      ctx.lineTo(
        pad + cell.x * cellSize + i + cellSize,
        pad + cell.y * cellSize + cellSize
      );
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (cell.type === "emitter") {
    const grd = ctx.createRadialGradient(cx, cy, 2, cx, cy, r * 1.4);
    grd.addColorStop(0, "#ffe08a");
    grd.addColorStop(0.45, "#e8b84a");
    grd.addColorStop(1, "rgba(232,184,74,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8b84a";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    const d = DIRS[cell.dir];
    ctx.strokeStyle = "#1a1204";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + d.x * r * 0.9, cy + d.y * r * 0.9);
    ctx.stroke();
    return;
  }

  if (cell.type === "sink") {
    const on = cell.lit;
    ctx.fillStyle = on ? "#d4786a" : "#5a2e28";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = on ? "rgba(255,200,180,0.85)" : "rgba(180,100,90,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.95, 0, Math.PI * 2);
    ctx.stroke();
    if (on) {
      ctx.fillStyle = "rgba(255,220,200,0.35)";
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (cell.type === "mirror") {
    ctx.strokeStyle = "#78c4b8";
    ctx.lineWidth = Math.max(3, cellSize * 0.1);
    ctx.lineCap = "round";
    const s = r * 1.15;
    ctx.beginPath();
    if (cell.facing === 0) {
      ctx.moveTo(cx - s, cy - s);
      ctx.lineTo(cx + s, cy + s);
    } else {
      ctx.moveTo(cx - s, cy + s);
      ctx.lineTo(cx + s, cy - s);
    }
    ctx.stroke();
    ctx.fillStyle = "rgba(120,196,184,0.12)";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.35, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (cell.type === "prism") {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((cell.facing * Math.PI) / 2);
    ctx.fillStyle = "#4a9a8e";
    ctx.strokeStyle = "#9fd8cf";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.95, r * 0.85);
    ctx.lineTo(-r * 0.95, r * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function hitCell(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (clientX - rect.left) * scaleX;
  const my = (clientY - rect.top) * scaleY;
  const size = state.board.size;
  const pad = 18;
  const cell = (Math.min(canvas.width, canvas.height) - pad * 2) / size;
  const x = Math.floor((mx - pad) / cell);
  const y = Math.floor((my - pad) / cell);
  if (x < 0 || y < 0 || x >= size || y >= size) return null;
  return { x, y };
}

canvas.addEventListener("click", (ev) => {
  if (state.cleared) return;
  const hit = hitCell(ev.clientX, ev.clientY);
  if (!hit) return;
  const cell = state.board.cells[hit.y][hit.x];
  if (!rotateCell(cell)) {
    elStatus.textContent = "ここは回せません。鏡かプリズムを選んでください。";
    elStatus.classList.remove("win");
    return;
  }
  state.moves += 1;
  elStatus.textContent = "回転しました。経路を確認してください。";
  elStatus.classList.remove("win");
  refresh();
});

btnReset.addEventListener("click", () => startStage(state.index));

btnNext.addEventListener("click", () => {
  if (state.index < STAGES.length - 1) startStage(state.index + 1);
});

function tick() {
  state.pulse += 1;
  if (state.sim) draw();
  requestAnimationFrame(tick);
}

startStage(loadProgress());
requestAnimationFrame(tick);
