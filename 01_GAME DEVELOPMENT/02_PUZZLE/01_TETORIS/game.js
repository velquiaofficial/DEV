(() => {
  const COLS = 16;
  const ROWS = 22;
  const SIZE = 40;
  const HALF = SIZE / 2;
  const TH = (SIZE * Math.sqrt(3)) / 2;
  const PAD = 8;
  const VIEW_W = PAD * 2 + (COLS + 1) * HALF;
  const VIEW_H = PAD * 2 + ROWS * TH;
  const SQRT3 = Math.sqrt(3);
  const LOCK_MS = 500;
  const MAX_RESETS = 12;
  const DAS_MS = 150;
  const ARR_MS = 35;
  const BEST_KEY = "sankaku-best";
  const SOUND_KEY = "sankaku-sound";
  const KICKS = [
    [0, 0], [2, 0], [-2, 0], [0, -2], [0, 2], [4, 0], [-4, 0],
    [1, 1], [-1, 1], [1, -1], [-1, -1], [2, -2], [-2, -2]
  ];

  const COLORS = {
    1: { fill: "#ff5d73", light: "#ffd5dc" },
    2: { fill: "#3ec6ff", light: "#d9f5ff" },
    3: { fill: "#ffb020", light: "#ffe7b8" },
    4: { fill: "#8b7cff", light: "#e3defd" },
    5: { fill: "#2ee6a6", light: "#d5ffef" },
    6: { fill: "#ff7a45", light: "#ffd7c4" },
    7: { fill: "#ff6bb5", light: "#ffd6ea" },
    8: { fill: "#d6e34a", light: "#f6ffc4" },
    9: { fill: "#5b8cff", light: "#d5e2ff" },
    10: { fill: "#ff4fa3", light: "#ffd0e6" },
    11: { fill: "#b8fff2", light: "#eafffa" },
    12: { fill: "#ffb3d9", light: "#ffe4f2" },
    13: { fill: "#ffe08a", light: "#fff4cc" }
  };

  const PIECES = [
    { id: "山", color: 1, cells: [[0, 0], [-1, 1], [0, 1], [1, 1]] },
    { id: "棒", color: 2, cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
    { id: "鉤", color: 3, cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
    { id: "斜", color: 4, cells: [[1, 0], [2, 0], [3, 0], [4, 0]] },
    { id: "槍", color: 5, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
    { id: "刃", color: 6, cells: [[0, 0], [-3, 1], [-2, 1], [-1, 1], [0, 1]] },
    { id: "枝", color: 7, cells: [[0, 0], [0, 1], [1, 1], [2, 1], [1, 2]] },
    { id: "凸", color: 8, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [2, 1]] },
    { id: "尺", color: 9, cells: [[0, 0], [0, 1], [1, 1], [2, 1], [3, 1]] },
    { id: "冠", color: 10, cells: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]] },
    { id: "板", color: 11, easy: true, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]] },
    { id: "梁", color: 12, easy: true, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0]] },
    { id: "床", color: 13, easy: true, cells: [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1]] }
  ];

  const boardCanvas = document.getElementById("board");
  const nextCanvas = document.getElementById("next");
  const bctx = boardCanvas.getContext("2d");
  const nctx = nextCanvas.getContext("2d");
  const screenEl = document.getElementById("screen");
  const hintEl = document.getElementById("board-hint");
  const bannerEl = document.getElementById("banner");
  const layerEl = document.getElementById("board-layer");
  const layerBtn = document.getElementById("layer-btn");
  const actionBtn = document.getElementById("action-btn");
  const soundBtn = document.getElementById("sound-btn");
  const statusEl = document.getElementById("status");
  const holdEl = document.getElementById("hold");
  const scoreEl = document.getElementById("score");
  const bestEl = document.getElementById("best");
  const levelEl = document.getElementById("level");
  const clearsEl = document.getElementById("clears");
  const chainEl = document.getElementById("chain");
  const maxChainEl = document.getElementById("max-chain");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  const failures = [];

  let phase = "title";
  let piece = null;
  let queue = [];
  let bag = [];
  let holdId = null;
  let holdUsed = false;
  let score = 0;
  let best = loadBest();
  let lines = 0;
  let level = 1;
  let chain = 0;
  let maxChain = 0;
  let record = false;
  let grounded = false;
  let lockTimer = 0;
  let dropAcc = 0;
  let dasDir = 0;
  let das = 0;
  let arr = 0;
  let lastDir = 0;
  let soundOn = loadSound();
  let ac = null;
  let bannerTimer = 0;
  let shake = 0;
  let particles = [];
  let decor = [];
  let demoCells = null;
  let demoColor = 2;
  let demoAcc = 0;

  const keys = { left: false, right: false, down: false };
  const touch = { left: false, right: false, soft: false };

  function check(name, ok) {
    if (!ok) failures.push(name);
  }

  function cellUp(x, y) {
    return ((x + y) & 1) === 0;
  }

  function centroid(x, y) {
    const y0 = y * SQRT3;
    return cellUp(x, y) ? [x + 1, y0 + (2 * SQRT3) / 3] : [x + 1, y0 + SQRT3 / 3];
  }

  function cornersOf(x, y) {
    const y0 = y * SQRT3;
    if (cellUp(x, y)) return [[x + 1, y0], [x, y0 + SQRT3], [x + 2, y0 + SQRT3]];
    return [[x, y0], [x + 2, y0], [x + 1, y0 + SQRT3]];
  }

  function cellKey(c) {
    return c[0] + "," + c[1];
  }

  function neighbors(x, y) {
    return cellUp(x, y) ? [[x - 1, y], [x + 1, y], [x, y + 1]] : [[x - 1, y], [x + 1, y], [x, y - 1]];
  }

  function connected(cells) {
    if (cells.length < 3) return false;
    const set = new Set(cells.map(cellKey));
    if (set.size !== cells.length) return false;
    const seen = new Set([cellKey(cells[0])]);
    const stack = [cells[0]];
    while (stack.length) {
      const [x, y] = stack.pop();
      for (const [a, b] of neighbors(x, y)) {
        const k = a + "," + b;
        if (set.has(k) && !seen.has(k)) {
          seen.add(k);
          stack.push([a, b]);
        }
      }
    }
    return seen.size === cells.length;
  }

  function snap(px, py) {
    const y0 = Math.round(py / SQRT3);
    const x0 = Math.round(px - 1);
    let best = null;
    let bestD = 1e9;
    for (let y = y0 - 2; y <= y0 + 2; y++) {
      for (let x = x0 - 3; x <= x0 + 3; x++) {
        const c = centroid(x, y);
        const d = (c[0] - px) * (c[0] - px) + (c[1] - py) * (c[1] - py);
        if (d < bestD) {
          bestD = d;
          best = [x, y];
        }
      }
    }
    return { x: best[0], y: best[1], d: Math.sqrt(bestD) };
  }

  function meanCentroid(cells) {
    let sx = 0;
    let sy = 0;
    for (const [x, y] of cells) {
      const c = centroid(x, y);
      sx += c[0];
      sy += c[1];
    }
    return [sx / cells.length, sy / cells.length];
  }

  function rotateCells(cells, dir) {
    const ang = dir * (Math.PI / 3);
    const verts = [];
    for (const [x, y] of cells) {
      for (const v of cornersOf(x, y)) {
        if (!verts.some((u) => Math.abs(u[0] - v[0]) < 1e-6 && Math.abs(u[1] - v[1]) < 1e-6)) verts.push(v);
      }
    }
    const cur = meanCentroid(cells);
    const curKey = cells.map(cellKey).sort().join("|");
    let best = null;
    let bestD = Infinity;
    for (const origin of verts) {
      const next = [];
      let maxD = 0;
      for (const [x, y] of cells) {
        const c = centroid(x, y);
        const dx = c[0] - origin[0];
        const dy = c[1] - origin[1];
        const hit = snap(
          dx * Math.cos(ang) - dy * Math.sin(ang) + origin[0],
          dx * Math.sin(ang) + dy * Math.cos(ang) + origin[1]
        );
        maxD = Math.max(maxD, hit.d);
        next.push([hit.x, hit.y]);
      }
      if (maxD > 0.3) continue;
      if (!connected(next)) continue;
      const nk = next.map(cellKey).sort().join("|");
      if (nk === curKey) continue;
      const m = meanCentroid(next);
      const dist = (m[0] - cur[0]) * (m[0] - cur[0]) + (m[1] - cur[1]) * (m[1] - cur[1]);
      if (dist < bestD) {
        bestD = dist;
        best = next;
      }
    }
    return best;
  }

  function placeSpawn(cells) {
    const minY = Math.min(...cells.map((c) => c[1]));
    const minX = Math.min(...cells.map((c) => c[0]));
    const oy = -minY;
    let ox = -minX;
    if (((ox + oy) & 1) !== 0) ox += 1;
    const shifted = cells.map(([x, y]) => [x + ox, y + oy]);
    const sMin = Math.min(...shifted.map((c) => c[0]));
    const sMax = Math.max(...shifted.map((c) => c[0]));
    let slide = Math.round((COLS - 1 - (sMin + sMax)) / 2);
    if (slide & 1) slide += 1;
    return shifted.map(([x, y]) => [x + slide, y]);
  }

  function kindById(id) {
    return PIECES.find((p) => p.id === id);
  }

  function blocked(cells) {
    for (const [x, y] of cells) {
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
    return false;
  }

  function clearBoard() {
    for (let y = 0; y < ROWS; y++) board[y].fill(0);
  }

  function fullRows() {
    const rows = [];
    for (let y = 0; y < ROWS; y++) {
      let full = true;
      for (let x = 0; x < COLS; x++) {
        if (!board[y][x]) {
          full = false;
          break;
        }
      }
      if (full) rows.push(y);
    }
    return rows;
  }

  function compact(cleared) {
    const next = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    for (let y = 0; y < ROWS; y++) {
      if (cleared.has(y)) continue;
      let drop = 0;
      for (const row of cleared) if (row > y) drop += 1;
      const ny = y + drop;
      for (let x = 0; x < COLS; x++) next[ny][x] = board[y][x];
    }
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) board[y][x] = next[y][x];
    }
  }

  function linePoints(n) {
    const table = [0, 100, 300, 500, 800];
    if (n < table.length) return table[n];
    return 800 + (n - 4) * 400;
  }

  function pullId() {
    if (!bag.length) {
      bag = [];
      for (const p of PIECES) {
        bag.push(p.id);
        if (p.easy) bag.push(p.id);
      }
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = bag[i];
        bag[i] = bag[j];
        bag[j] = tmp;
      }
    }
    return bag.pop();
  }

  function fillQueue() {
    while (queue.length < 3) queue.push(pullId());
  }

  function centerX(cells) {
    let sum = 0;
    for (const [x] of cells) sum += x;
    return sum / cells.length;
  }

  function shifted(cells, dx, dy) {
    return cells.map(([x, y]) => [x + dx, y + dy]);
  }

  function bestDrop(cells, homeX) {
    const cx = centerX(cells);
    const options = [[1, 1], [-1, 1]];
    options.sort((a, b) => {
      const da = Math.abs(cx + a[0] - homeX);
      const db = Math.abs(cx + b[0] - homeX);
      if (da !== db) return da - db;
      return a[0] - b[0];
    });
    for (const [dx, dy] of options) {
      const next = shifted(cells, dx, dy);
      if (!blocked(next)) return next;
    }
    return null;
  }

  function descendCells(cells, homeX) {
    const mid = bestDrop(cells, homeX);
    if (!mid) return null;
    const end = bestDrop(mid, homeX);
    if (!end) return { cells: mid, rows: 1 };
    return { cells: end, rows: 2 };
  }

  function dropPiece() {
    if (!piece) return 0;
    const step = descendCells(piece.cells, piece.homeX);
    if (!step) return 0;
    piece.cells = step.cells;
    return step.rows;
  }

  function spawnFrom(id) {
    const kind = kindById(id);
    const cells = placeSpawn(kind.cells);
    piece = { id: kind.id, color: kind.color, cells: cells, lockResets: 0, homeX: centerX(cells) };
    grounded = false;
    lockTimer = 0;
    dropAcc = 0;
    return !blocked(cells);
  }

  function spawnNext() {
    fillQueue();
    const id = queue.shift();
    fillQueue();
    holdUsed = false;
    return spawnFrom(id);
  }

  function addScore(n) {
    if (!n) return;
    score += n;
    if (score > best) {
      best = score;
      record = true;
      saveBest();
    }
    updateHud();
  }

  function burst(x, y, color) {
    const p = pixelOf(x, y);
    for (let i = 0; i < 4; i++) {
      particles.push({
        x: p[0],
        y: p[1],
        vx: (Math.random() - 0.5) * 90,
        vy: (Math.random() - 0.85) * 110,
        life: 1,
        color: color
      });
    }
  }

  function resolveClears() {
    const rows = fullRows();
    if (!rows.length) {
      chain = 0;
      return 0;
    }
    for (const y of rows) {
      for (let x = 0; x < COLS; x++) burst(x, y, board[y][x]);
    }
    addScore(linePoints(rows.length) * level);
    compact(new Set(rows));
    const lastName = rows.length + "列";
    if (rows.length >= 4) shake = Math.min(8, shake + 4);
    chain = 1;
    if (chain > maxChain) maxChain = chain;
    lines += rows.length;
    const prev = level;
    level = 1 + Math.floor(lines / 10);
    toneClear(rows.length);
    if (level !== prev) announce("レベル " + level);
    else announce(lastName);
    updateHud();
    return rows.length;
  }

  function commitLock() {
    if (!piece) return;
    let above = false;
    for (const [x, y] of piece.cells) {
      if (y < 0) {
        above = true;
        continue;
      }
      board[y][x] = piece.color;
    }
    piece = null;
    grounded = false;
    tone(150, 0.05, "triangle", 0.03, -40);
    resolveClears();
    if (above || !spawnNext()) gameOver();
    else syncUi();
  }

  function gravityMs() {
    return Math.max(80, Math.round(1080 - (level - 1) * 70));
  }

  function nudgeLock() {
    if (!piece || !grounded) return;
    if (piece.lockResets < MAX_RESETS) {
      piece.lockResets += 1;
      lockTimer = 0;
    }
  }

  function tryMove(dx, dy) {
    if (!piece) return false;
    const next = piece.cells.map(([x, y]) => [x + dx, y + dy]);
    if (blocked(next)) return false;
    piece.cells = next;
    return true;
  }

  function markGrounded() {
    grounded = !descendCells(piece.cells, piece.homeX);
  }

  function tryShift(dir, silent) {
    if (phase !== "play" || !piece) return false;
    if (!tryMove(dir * 2, 0)) return false;
    piece.homeX = centerX(piece.cells);
    markGrounded();
    nudgeLock();
    if (!silent) tone(520, 0.025, "square", 0.015);
    return true;
  }

  function rotate(dir) {
    if (phase !== "play" || !piece) return false;
    const spun = rotateCells(piece.cells, dir);
    if (!spun) return false;
    for (const [dx, dy] of KICKS) {
      const moved = spun.map(([x, y]) => [x + dx, y + dy]);
      if (!blocked(moved)) {
        piece.cells = moved;
        piece.homeX = centerX(moved);
        markGrounded();
        nudgeLock();
        tone(640, 0.04, "triangle", 0.02, 80);
        return true;
      }
    }
    return false;
  }

  function hardDrop() {
    if (phase !== "play" || !piece) return 0;
    let rows = 0;
    let step = 0;
    while ((step = dropPiece())) rows += step;
    addScore(rows * 2);
    tone(200, 0.05, "square", 0.028, -30);
    commitLock();
    return rows;
  }

  function doHold() {
    if (phase !== "play" || !piece || holdUsed) return;
    const current = piece.id;
    if (!holdId) {
      holdId = current;
      if (!spawnNext()) gameOver();
    } else {
      const swap = holdId;
      holdId = current;
      holdUsed = true;
      if (!spawnFrom(swap)) gameOver();
    }
    holdUsed = true;
    tone(480, 0.04, "sine", 0.02, 60);
    syncUi();
  }

  function horizDir() {
    const left = keys.left || touch.left;
    const right = keys.right || touch.right;
    if (left && right) return lastDir || -1;
    if (left) return -1;
    if (right) return 1;
    return 0;
  }

  function updateDas(dt) {
    const dir = horizDir();
    if (!dir) {
      dasDir = 0;
      return;
    }
    if (dir !== dasDir) {
      dasDir = dir;
      das = 0;
      arr = 0;
      lastDir = dir;
      tryShift(dir, false);
      return;
    }
    das += dt;
    if (das < DAS_MS) return;
    arr += dt;
    while (arr >= ARR_MS) {
      arr -= ARR_MS;
      if (!tryShift(dir, true)) break;
    }
  }

  function updatePlay(dt) {
    updateDas(dt);
    if (phase !== "play" || !piece) return;
    const soft = keys.down || touch.soft;
    dropAcc += dt;
    const step = soft ? 36 : gravityMs();
    while (dropAcc >= step && phase === "play" && piece) {
      dropAcc -= step;
      const rows = dropPiece();
      if (rows) {
        grounded = false;
        lockTimer = 0;
        if (soft) addScore(rows);
      } else {
        grounded = true;
        break;
      }
    }
    if (grounded && phase === "play" && piece) {
      lockTimer += dt;
      if (lockTimer >= LOCK_MS) commitLock();
    }
  }

  function buildDecor() {
    decor = [];
    for (let y = ROWS - 7; y < ROWS; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        if ((x * 3 + y * 2) % 5 === 0) continue;
        decor.push([x, y, 1 + ((x + y) % 4)]);
      }
    }
    demoCells = placeSpawn(PIECES[1].cells);
    demoColor = 2;
  }

  function updateDemo(dt) {
    if (reduceMotion || !demoCells) return;
    demoAcc += dt;
    if (demoAcc < 260) return;
    demoAcc = 0;
    if (Math.random() < 0.4) {
      const spun = rotateCells(demoCells, 1);
      if (spun && spun.every(([x, y]) => x >= 0 && x < COLS && y >= 0)) demoCells = spun;
    }
    const next = descendCells(demoCells, centerX(demoCells));
    const landed = !next || next.cells.some(([x, y]) => y >= ROWS - 7);
    if (landed) {
      const kind = PIECES[Math.floor(Math.random() * PIECES.length)];
      demoCells = placeSpawn(kind.cells);
      demoColor = kind.color;
    } else {
      demoCells = next.cells;
    }
  }

  function stepParticles(dt) {
    const next = [];
    for (const p of particles) {
      p.life -= dt / 520;
      if (p.life <= 0) continue;
      p.x += p.vx * dt / 1000;
      p.y += p.vy * dt / 1000;
      p.vy += 180 * dt / 1000;
      next.push(p);
    }
    particles = next;
    if (shake > 0.2) shake *= 0.86;
    else shake = 0;
  }

  function pixelOf(x, y) {
    const c = centroid(x, y);
    return [PAD + c[0] * HALF, PAD + c[1] * (TH / SQRT3)];
  }

  function traceTri(ctx, x, y, size) {
    const half = size / 2;
    const h = (size * SQRT3) / 2;
    const x0 = x * half;
    const y0 = y * h;
    ctx.beginPath();
    if (cellUp(x, y)) {
      ctx.moveTo(x0 + half, y0);
      ctx.lineTo(x0, y0 + h);
      ctx.lineTo(x0 + size, y0 + h);
    } else {
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0 + size, y0);
      ctx.lineTo(x0 + half, y0 + h);
    }
    ctx.closePath();
  }

  function drawCell(ctx, x, y, color, alpha, ghost) {
    ctx.save();
    ctx.translate(PAD, PAD);
    ctx.globalAlpha = alpha;
    traceTri(ctx, x, y, SIZE);
    if (ghost) {
      ctx.strokeStyle = COLORS[color].light;
      ctx.lineWidth = 1.6;
      ctx.stroke();
    } else {
      ctx.fillStyle = COLORS[color].fill;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.38)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();
  }

  function ghostCells() {
    if (!piece) return null;
    let cells = piece.cells;
    let guard = 0;
    while (guard < 60) {
      guard += 1;
      const step = descendCells(cells, piece.homeX);
      if (!step) break;
      cells = step.cells;
    }
    return cells === piece.cells ? null : cells;
  }

  function drawBoard() {
    const dpr = boardCanvas.width / VIEW_W || 1;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    bctx.clearRect(0, 0, VIEW_W, VIEW_H);
    bctx.fillStyle = "#07141c";
    bctx.fillRect(0, 0, VIEW_W, VIEW_H);

    bctx.save();
    bctx.translate(PAD, PAD);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        traceTri(bctx, x, y, SIZE);
        bctx.fillStyle = y < 2 ? "rgba(255,90,110,0.07)" : "rgba(255,255,255,0.025)";
        bctx.fill();
        bctx.strokeStyle = "rgba(170,220,210,0.08)";
        bctx.lineWidth = 1;
        bctx.stroke();
      }
    }
    bctx.restore();

    if (phase === "title") {
      for (const [x, y, color] of decor) drawCell(bctx, x, y, color, 0.9, false);
      if (demoCells) for (const [x, y] of demoCells) drawCell(bctx, x, y, demoColor, 1, false);
    } else {
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (board[y][x]) drawCell(bctx, x, y, board[y][x], 1, false);
        }
      }
      const ghost = ghostCells();
      if (ghost && phase === "play") {
        for (const [x, y] of ghost) if (y >= 0) drawCell(bctx, x, y, piece.color, 0.9, true);
      }
      if (piece && (phase === "play" || phase === "paused")) {
        for (const [x, y] of piece.cells) if (y >= 0) drawCell(bctx, x, y, piece.color, 1, false);
      }
    }

    for (const p of particles) {
      bctx.globalAlpha = Math.max(0, p.life);
      bctx.fillStyle = COLORS[p.color] ? COLORS[p.color].light : "#fff";
      bctx.beginPath();
      bctx.moveTo(p.x, p.y - 4);
      bctx.lineTo(p.x + 3.5, p.y + 3);
      bctx.lineTo(p.x - 3.5, p.y + 3);
      bctx.closePath();
      bctx.fill();
    }
    bctx.globalAlpha = 1;

    if (shake > 0.25 && !reduceMotion) {
      const x = (Math.random() - 0.5) * shake * 2;
      const y = (Math.random() - 0.5) * shake * 2;
      screenEl.style.transform = "translate(" + x.toFixed(2) + "px," + y.toFixed(2) + "px)";
    } else {
      screenEl.style.transform = "";
    }
  }

  function previewBox(cells, size) {
    const half = size / 2;
    const h = (size * SQRT3) / 2;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [x, y] of cells) {
      const pts = cellUp(x, y)
        ? [[x * half + half, y * h], [x * half, y * h + h], [x * half + size, y * h + h]]
        : [[x * half, y * h], [x * half + size, y * h], [x * half + half, y * h + h]];
      for (const [px, py] of pts) {
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      }
    }
    return { minX, minY, maxX, maxY };
  }

  function drawPreviewPiece(ctx, cells, color, slotX, slotY, slotW, slotH) {
    let size = 16;
    let box = previewBox(cells, size);
    const fit = Math.min(1, (slotW - 8) / (box.maxX - box.minX), (slotH - 8) / (box.maxY - box.minY));
    size *= fit;
    box = previewBox(cells, size);
    const bw = box.maxX - box.minX;
    const bh = box.maxY - box.minY;
    const ox = slotX + (slotW - bw) / 2 - box.minX;
    const oy = slotY + (slotH - bh) / 2 - box.minY;
    const half = size / 2;
    const h = (size * SQRT3) / 2;
    for (const [x, y] of cells) {
      ctx.save();
      ctx.translate(ox, oy);
      ctx.beginPath();
      const x0 = x * half;
      const y0 = y * h;
      if (cellUp(x, y)) {
        ctx.moveTo(x0 + half, y0);
        ctx.lineTo(x0, y0 + h);
        ctx.lineTo(x0 + size, y0 + h);
      } else {
        ctx.moveTo(x0, y0);
        ctx.lineTo(x0 + size, y0);
        ctx.lineTo(x0 + half, y0 + h);
      }
      ctx.closePath();
      ctx.fillStyle = COLORS[color].fill;
      ctx.fill();
      ctx.restore();
    }
  }

  function drawNext() {
    const logicalW = 312;
    const logicalH = 132;
    const dpr = nextCanvas.width / logicalW || 1;
    nctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nctx.clearRect(0, 0, logicalW, logicalH);
    nctx.font = '700 13px "Zen Maru Gothic", sans-serif';
    nctx.textAlign = "center";
    for (let i = 0; i < 3; i++) {
      const slotX = 6 + i * 102;
      nctx.strokeStyle = "rgba(158,232,212,0.2)";
      nctx.strokeRect(slotX + 0.5, 6.5, 94, 96);
      const id = queue[i];
      if (!id) continue;
      const kind = kindById(id);
      drawPreviewPiece(nctx, kind.cells, kind.color, slotX, 10, 94, 74);
      nctx.fillStyle = COLORS[kind.color].light;
      nctx.fillText(kind.id, slotX + 47, 94);
    }
  }

  function fitCanvases() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    boardCanvas.width = Math.round(VIEW_W * dpr);
    boardCanvas.height = Math.round(VIEW_H * dpr);
    nextCanvas.width = Math.round(312 * dpr);
    nextCanvas.height = Math.round(132 * dpr);
    // Keep next preview un-squashed (CSS may stretch canvas otherwise)
    const nextBox = nextCanvas.getBoundingClientRect();
    const nextAspect = 312 / 132;
    let nw = Math.max(120, nextBox.width || nextCanvas.parentElement?.clientWidth || 280);
    let nh = nw / nextAspect;
    if (nextBox.height > 8 && nh > nextBox.height) {
      nh = nextBox.height;
      nw = nh * nextAspect;
    }
    nextCanvas.style.setProperty("width", Math.floor(nw) + "px", "important");
    nextCanvas.style.setProperty("height", Math.floor(nh) + "px", "important");

    const stage = document.querySelector(".stage");
    const rect = stage.getBoundingClientRect();
    // Fallback when stage collapsed (short mobile / embedded browser)
    const fallbackH = Math.max(180, Math.floor(window.innerHeight * 0.48));
    const availW = Math.max(64, rect.width - 22);
    let availH = rect.height - 22;
    if (availH < 100) availH = fallbackH;
    const aspect = VIEW_W / VIEW_H;
    let w = availW;
    let h = w / aspect;
    if (h > availH) {
      h = availH;
      w = h * aspect;
    }
    w = Math.max(96, Math.floor(w));
    h = Math.max(160, Math.floor(h));
    boardCanvas.style.setProperty("width", w + "px", "important");
    boardCanvas.style.setProperty("height", h + "px", "important");
  }

  function updateHud() {
    scoreEl.textContent = score.toLocaleString("ja-JP");
    bestEl.textContent = best.toLocaleString("ja-JP");
    levelEl.textContent = String(level);
    clearsEl.textContent = String(lines);
    chainEl.textContent = chain > 0 ? String(chain) : "-";
    maxChainEl.textContent = maxChain > 0 ? String(maxChain) : "-";
  }

  function syncHold() {
    if (!holdId) {
      holdEl.textContent = "ホールド なし";
      holdEl.style.color = "";
      return;
    }
    const kind = kindById(holdId);
    holdEl.textContent = "ホールド " + kind.id;
    holdEl.style.color = COLORS[kind.color].light;
  }

  function announce(text) {
    bannerEl.textContent = text;
    bannerEl.classList.add("show");
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => bannerEl.classList.remove("show"), 1000);
  }

  function syncUi() {
    updateHud();
    syncHold();
    hintEl.hidden = phase !== "title";
    if (phase === "paused") {
      layerEl.hidden = false;
      document.getElementById("layer-kicker").textContent = "ポーズ";
      document.getElementById("layer-title").textContent = "一時停止";
      document.getElementById("layer-sub").textContent = "Pキーで再開";
      layerBtn.textContent = "つづける";
      actionBtn.textContent = "はじめから";
      statusEl.textContent = "止まっています。";
    } else if (phase === "over") {
      layerEl.hidden = false;
      document.getElementById("layer-kicker").textContent = record ? "新記録" : "上まで届いた";
      document.getElementById("layer-title").textContent = record ? "ベスト更新！" : "積めなくなった";
      document.getElementById("layer-sub").textContent = "スコア " + score.toLocaleString("ja-JP");
      layerBtn.textContent = "もう一度";
      actionBtn.textContent = "もう一度";
      statusEl.textContent = record ? "ベストを更新した。" : "三角が天辺まで届いた。";
    } else if (phase === "play") {
      layerEl.hidden = true;
      actionBtn.textContent = "はじめから";
      const rest = 10 - (lines % 10);
      statusEl.textContent = "次のレベルまで " + (rest === 0 ? 10 : rest) + "列";
    } else {
      layerEl.hidden = true;
      actionBtn.textContent = "はじめる";
      statusEl.textContent = "横一列を埋めると消える。";
    }
  }

  function startGame() {
    clearBoard();
    particles = [];
    queue = [];
    bag = [];
    holdId = null;
    holdUsed = false;
    score = 0;
    lines = 0;
    level = 1;
    chain = 0;
    record = false;
    piece = null;
    fillQueue();
    phase = "play";
    if (!spawnNext()) gameOver();
    syncUi();
    fitCanvases();
    tone(523, 0.06, "triangle", 0.03, 40);
  }

  function togglePause() {
    if (phase === "play") {
      phase = "paused";
      syncUi();
    } else if (phase === "paused") {
      phase = "play";
      syncUi();
    }
  }

  function gameOver() {
    phase = "over";
    piece = null;
    tone(196, 0.28, "sawtooth", 0.035, -140);
    syncUi();
  }

  function loadBest() {
    try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch (e) { return 0; }
  }

  function saveBest() {
    try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) { /* 表示だけ続ける */ }
  }

  function loadSound() {
    try { return localStorage.getItem(SOUND_KEY) !== "0"; } catch (e) { return true; }
  }

  function unlockAudio() {
    if (!soundOn) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!ac) ac = new Ctx();
    if (ac.state === "suspended") ac.resume();
  }

  function tone(freq, dur, type, vol, slide) {
    if (!soundOn || !ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function toneClear(n) {
    tone(520 + n * 50, 0.08, "triangle", 0.04, 120);
    setTimeout(() => tone(680 + n * 30, 0.12, "sine", 0.035, 40), 70);
  }

  function onAction() {
    unlockAudio();
    if (phase === "paused" || phase === "play") startGame();
    else startGame();
  }

  function onLayer() {
    unlockAudio();
    if (phase === "paused") togglePause();
    else startGame();
  }

  function runSelfTest() {
    for (const p of PIECES) {
      check(p.id + " connected", connected(p.cells));
      check(p.id + " right", connected(p.cells.map(([x, y]) => [x + 2, y])));
      check(p.id + " down", connected(p.cells.map(([x, y]) => [x, y + 2])));
      const spawned = placeSpawn(p.cells);
      const spun = rotateCells(p.cells, 1);
      check(p.id + " spawn", connected(spawned) && spawned.every(([x, y]) => x >= 0 && x < COLS && y >= 0 && y < 8));
      check(p.id + " spin", !!(spun && spun.length === p.cells.length && connected(spun)));
    }
    let cur = PIECES[1].cells.map((c) => [c[0], c[1]]);
    let changed = false;
    for (let i = 0; i < 6; i++) {
      const next = rotateCells(cur, 1);
      check("rot" + i, !!(next && connected(next)));
      if (!next) break;
      if (cur.map(cellKey).sort().join("|") !== next.map(cellKey).sort().join("|")) changed = true;
      cur = next;
    }
    check("bar rotates", changed);

    clearBoard();
    board[18][0] = 2;
    board[19][0] = 4;
    for (let x = 0; x < COLS; x++) board[20][x] = 1;
    const rows = fullRows();
    check("full row", rows.length === 1 && rows[0] === 20);
    compact(new Set(rows));
    check("above dropped one", board[20][0] === 4 && board[19][0] === 2 && board[18][0] === 0);
    check("no second line", fullRows().length === 0);
    clearBoard();
    for (let x = 0; x < COLS; x++) {
      board[21][x] = x === 0 ? 0 : 1;
      board[20][x] = 2;
    }
    board[19][4] = 3;
    board[18][4] = 4;
    const found = fullRows();
    check("only one full", found.length === 1 && found[0] === 20);
    compact(new Set(found));
    check("partial row kept", board[21][0] === 0 && board[21][1] === 1);
    check("stack dropped", board[20][4] === 3 && board[19][4] === 4 && board[18][4] === 0);
    check("still one gap", fullRows().length === 0);
    clearBoard();

    for (const p of PIECES) {
      let cells = placeSpawn(p.cells);
      const home = centerX(cells);
      let guard = 0;
      while (guard < 50) {
        guard += 1;
        const step = descendCells(cells, home);
        if (!step) break;
        cells = step.cells;
        check(p.id + " fall connected", connected(cells));
      }
      const maxY = Math.max(...cells.map((c) => c[1]));
      check(p.id + " reaches floor", maxY === ROWS - 1);
      let touchesFloor = false;
      for (const [x, y] of cells) {
        if (y === ROWS - 1) touchesFloor = true;
      }
      check(p.id + " on bottom row", touchesFloor);
    }
    clearBoard();
    for (let x = 0; x < COLS; x++) board[ROWS - 1][x] = 1;
    for (const p of PIECES) {
      let cells = placeSpawn(p.cells);
      const home = centerX(cells);
      let guard = 0;
      while (guard < 50) {
        guard += 1;
        const step = descendCells(cells, home);
        if (!step) break;
        cells = step.cells;
      }
      const low = Math.max(...cells.map((c) => c[1]));
      check(p.id + " rests on stack", low >= ROWS - 3);
    }
    clearBoard();
  }

  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(e.key)) e.preventDefault();
    if (e.key === "ArrowLeft") keys.left = true;
    if (e.key === "ArrowRight") keys.right = true;
    if (e.key === "ArrowDown") keys.down = true;
    if (e.repeat) return;
    unlockAudio();
    if (e.key === "ArrowUp" || e.key === "z" || e.key === "Z") rotate(1);
    if (e.key === "x" || e.key === "X") rotate(-1);
    if (e.key === "c" || e.key === "C" || e.key === "Shift") doHold();
    if (e.key === " ") hardDrop();
    if (e.key === "p" || e.key === "P") togglePause();
    if (e.key === "Enter" && phase !== "play") onAction();
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft") keys.left = false;
    if (e.key === "ArrowRight") keys.right = false;
    if (e.key === "ArrowDown") keys.down = false;
  });

  actionBtn.addEventListener("click", onAction);
  layerBtn.addEventListener("click", onLayer);
  soundBtn.addEventListener("click", () => {
    soundOn = !soundOn;
    soundBtn.textContent = soundOn ? "音オン" : "音オフ";
    soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
    try { localStorage.setItem(SOUND_KEY, soundOn ? "1" : "0"); } catch (e) { /* 無視 */ }
    if (soundOn) unlockAudio();
  });
  soundBtn.textContent = soundOn ? "音オン" : "音オフ";
  soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");

  document.querySelectorAll(".touch button").forEach((btn) => {
    const act = btn.dataset.act;
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      unlockAudio();
      if (phase === "title" || phase === "over") startGame();
      if (act === "left") touch.left = true;
      if (act === "right") touch.right = true;
      if (act === "soft") touch.soft = true;
      if (act === "rot") rotate(1);
      if (act === "hard") hardDrop();
      if (act === "hold") doHold();
    });
  });

  window.addEventListener("pointerup", () => {
    touch.left = false;
    touch.right = false;
    touch.soft = false;
  });
  window.addEventListener("pointercancel", () => {
    touch.left = false;
    touch.right = false;
    touch.soft = false;
  });

  let ptr = null;
  boardCanvas.addEventListener("pointerdown", (e) => {
    if (phase !== "play") return;
    ptr = { id: e.pointerId, x: e.clientX, y: e.clientY, ox: e.clientX, oy: e.clientY };
  });
  boardCanvas.addEventListener("pointermove", (e) => {
    if (!ptr || ptr.id !== e.pointerId || phase !== "play") return;
    const rect = boardCanvas.getBoundingClientRect();
    const col = Math.max(18, rect.width / COLS);
    if (e.clientX - ptr.x <= -col) {
      tryShift(-1, false);
      ptr.x = e.clientX;
    } else if (e.clientX - ptr.x >= col) {
      tryShift(1, false);
      ptr.x = e.clientX;
    }
    if (e.clientY - ptr.y > col * 1.15) {
      const rows = dropPiece();
      if (rows) {
        grounded = false;
        lockTimer = 0;
        addScore(rows);
      }
      ptr.y = e.clientY;
    }
  });
  boardCanvas.addEventListener("pointerup", (e) => {
    if (!ptr || ptr.id !== e.pointerId) return;
    const dx = e.clientX - ptr.ox;
    const dy = e.clientY - ptr.oy;
    if (Math.hypot(dx, dy) < 14) rotate(1);
    ptr = null;
  });
  boardCanvas.addEventListener("pointercancel", () => { ptr = null; });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && phase === "play") togglePause();
  });
  window.addEventListener("resize", fitCanvases);

  function loop(now) {
    loop.last = loop.last || now;
    const dt = Math.min(48, now - loop.last);
    loop.last = now;
    if (phase === "play") updatePlay(dt);
    else if (phase === "title") updateDemo(dt);
    stepParticles(dt);
    drawBoard();
    drawNext();
    requestAnimationFrame(loop);
  }

  runSelfTest();
  buildDecor();
  fillQueue();
  fitCanvases();
  syncUi();
  requestAnimationFrame(loop);

  window.__san = {
    failures: failures,
    start: startGame,
    hardDrop: hardDrop,
    rotate: () => rotate(1),
    left: () => tryShift(-1, true),
    hold: doHold,
    pause: togglePause,
    fillRow: (y, color) => {
      for (let x = 0; x < COLS; x++) board[y][x] = color;
    },
    resolve: resolveClears,
    state: () => ({
      phase: phase,
      score: score,
      lines: lines,
      level: level,
      chain: chain,
      piece: piece ? piece.cells.map((c) => c.slice()) : null,
      color: piece ? piece.color : 0,
      id: piece ? piece.id : "",
      hold: holdId,
      queue: queue.slice(),
      up: piece ? piece.cells.filter(([x, y]) => cellUp(x, y)).length : 0
    }),
    cell: (x, y) => board[y][x],
    connected: connected
  };
})();
