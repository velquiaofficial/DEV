"use strict";

/** MOSAIC COURT — original tile-draft trial. Not affiliated with any published title. */

const COLORS = 5;
const HEX = ["#e85d5d", "#5b8dff", "#3ecf8e", "#e0c35a", "#c9a6ff"];
const WALL_PATTERN = [
  [0, 1, 2, 3, 4],
  [4, 0, 1, 2, 3],
  [3, 4, 0, 1, 2],
  [2, 3, 4, 0, 1],
  [1, 2, 3, 4, 0]
];

function emptyWall() {
  return Array.from({ length: 5 }, () => Array(5).fill(null));
}
function emptyPattern() {
  return Array.from({ length: 5 }, (_, i) => ({ color: null, count: 0, size: i + 1 }));
}

const state = {
  bag: [],
  factories: [],
  center: [],
  you: { wall: emptyWall(), pattern: emptyPattern(), floor: [], pts: 0 },
  ai: { wall: emptyWall(), pattern: emptyPattern(), floor: [], pts: 0 },
  turn: "you",
  round: 1,
  selected: null,
  active: false,
  over: false
};

function refillBag() {
  if (state.bag.length < 20) {
    for (let c = 0; c < COLORS; c++) for (let i = 0; i < 16; i++) state.bag.push(c);
    state.bag.sort(() => Math.random() - 0.5);
  }
}

function dealFactories() {
  refillBag();
  state.factories = Array.from({ length: 5 }, () => state.bag.splice(0, 4));
  state.center = [];
}

function setStatus(t) { document.getElementById("status").textContent = t; }

function wallHasColor(wall, row, color) {
  return wall[row].includes(color);
}

function patternAccepts(p, row, color) {
  const line = state[p].pattern[row];
  if (wallHasColor(state[p].wall, row, color)) return false;
  if (line.count === 0) return true;
  return line.color === color && line.count < line.size;
}

function renderWall(el, wall) {
  el.style.gridTemplateColumns = "repeat(5, 34px)";
  el.innerHTML = "";
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const d = document.createElement("div");
      d.className = "cell";
      const col = wall[r][c];
      if (col != null) d.style.background = HEX[col];
      else d.style.opacity = "0.5";
      el.appendChild(d);
    }
  }
}

function render() {
  document.getElementById("pts-you").textContent = state.you.pts;
  document.getElementById("pts-ai").textContent = state.ai.pts;
  document.getElementById("round").textContent = "Round " + state.round;
  const fac = document.getElementById("factories");
  fac.innerHTML = "";
  state.factories.forEach((tiles, fi) => {
    const box = document.createElement("div");
    box.className = "factory";
    tiles.forEach((t, ti) => {
      const d = document.createElement("div");
      d.className = "tile" + (state.selected && state.selected.src === "f" && state.selected.fi === fi && state.selected.color === t ? " sel" : "");
      d.style.background = HEX[t];
      d.onclick = () => pickFactory(fi, t);
      box.appendChild(d);
    });
    fac.appendChild(box);
  });
  if (state.center.length) {
    const box = document.createElement("div");
    box.className = "factory";
    box.title = "中央";
    state.center.forEach((t) => {
      const d = document.createElement("div");
      d.className = "tile" + (state.selected && state.selected.src === "c" && state.selected.color === t ? " sel" : "");
      d.style.background = HEX[t];
      d.onclick = () => pickCenter(t);
      box.appendChild(d);
    });
    fac.appendChild(box);
  }

  renderWall(document.getElementById("wall-you"), state.you.wall);
  renderWall(document.getElementById("wall-ai"), state.ai.wall);

  const pat = document.getElementById("pattern");
  pat.innerHTML = "";
  state.you.pattern.forEach((line, row) => {
    const rowEl = document.createElement("div");
    rowEl.className = "prow";
    for (let i = 0; i < line.size; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (i < line.count) cell.style.background = HEX[line.color];
      rowEl.appendChild(cell);
    }
    rowEl.onclick = () => placeOnRow(row);
    pat.appendChild(rowEl);
  });

  document.getElementById("floor").innerHTML = state.you.floor.map((t) =>
    `<div class="tile" style="background:${HEX[t]}"></div>`
  ).join("");
}

function pickFactory(fi, color) {
  if (!state.active || state.turn !== "you" || state.over) return;
  const tiles = state.factories[fi].filter((t) => t === color);
  if (!tiles.length) return;
  state.selected = { src: "f", fi, color, count: tiles.length };
  setStatus(tiles.length + " 枚選択。置く行をクリック");
  render();
}

function pickCenter(color) {
  if (!state.active || state.turn !== "you" || state.over) return;
  const count = state.center.filter((t) => t === color).length;
  if (!count) return;
  state.selected = { src: "c", color, count };
  setStatus(count + " 枚（中央）。置く行をクリック");
  render();
}

function takeTiles(sel) {
  let got = [];
  if (sel.src === "f") {
    const keep = [];
    state.factories[sel.fi].forEach((t) => {
      if (t === sel.color) got.push(t);
      else keep.push(t);
    });
    state.factories[sel.fi] = [];
    state.center.push(...keep);
  } else {
    state.center = state.center.filter((t) => {
      if (t === sel.color) { got.push(t); return false; }
      return true;
    });
  }
  return got;
}

function placeTiles(p, row, tiles) {
  const line = state[p].pattern[row];
  const color = tiles[0];
  if (!patternAccepts(p, row, color) && line.count > 0) {
    state[p].floor.push(...tiles);
    return;
  }
  if (line.count === 0) line.color = color;
  if (line.color !== color) {
    state[p].floor.push(...tiles);
    return;
  }
  for (const t of tiles) {
    if (line.count < line.size) line.count++;
    else state[p].floor.push(t);
  }
}

function placeOnRow(row) {
  if (!state.selected || state.turn !== "you") return;
  const tiles = takeTiles(state.selected);
  placeTiles("you", row, tiles);
  state.selected = null;
  afterMove();
}

function factoriesEmpty() {
  return state.factories.every((f) => f.length === 0) && state.center.length === 0;
}

function scoreTile(wall, r, c) {
  let pts = 1;
  let left = c - 1, right = c + 1;
  while (left >= 0 && wall[r][left] != null) { pts++; left--; }
  while (right < 5 && wall[r][right] != null) { pts++; right++; }
  if (left === c - 1 && right === c + 1) {
    // only self horizontally — check vertical instead bonus already 1
  } else {
    // already counted horizontal run including self once from pts=1 + neighbors
  }
  let up = r - 1, down = r + 1;
  let v = 0;
  while (up >= 0 && wall[up][c] != null) { v++; up--; }
  while (down < 5 && wall[down][c] != null) { v++; down--; }
  if (v > 0) pts += v;
  // fix double count: if both h and v neighbors, base 1 is fine; if only h, pts is run length; if only v need adjust
  const hNeighbors = (c > 0 && wall[r][c - 1] != null) || (c < 4 && wall[r][c + 1] != null);
  if (!hNeighbors && v > 0) pts = 1 + v;
  if (hNeighbors && v === 0) {
    let run = 1;
    left = c - 1; right = c + 1;
    while (left >= 0 && wall[r][left] != null) { run++; left--; }
    while (right < 5 && wall[r][right] != null) { run++; right++; }
    pts = run;
  }
  if (hNeighbors && v > 0) {
    let hrun = 1;
    left = c - 1; right = c + 1;
    while (left >= 0 && wall[r][left] != null) { hrun++; left--; }
    while (right < 5 && wall[r][right] != null) { hrun++; right--; }
    pts = hrun + v;
  }
  return pts;
}

function wallColFor(row, color) {
  return WALL_PATTERN[row].indexOf(color);
}

function resolveRound() {
  ["you", "ai"].forEach((p) => {
    state[p].pattern.forEach((line, row) => {
      if (line.count === line.size && line.color != null) {
        const col = wallColFor(row, line.color);
        state[p].wall[row][col] = line.color;
        state[p].pts += scoreTile(state[p].wall, row, col);
        line.count = 0;
        line.color = null;
      }
    });
    const pen = [1, 1, 2, 2, 2, 3];
    state[p].floor.forEach((_, i) => {
      state[p].pts -= pen[Math.min(i, pen.length - 1)];
    });
    state[p].pts = Math.max(0, state[p].pts);
    state[p].floor = [];
  });
}

function rowComplete(wall, r) { return wall[r].every((x) => x != null); }

function checkEnd() {
  return ["you", "ai"].some((p) => state[p].wall.some((_, r) => rowComplete(state[p].wall, r)));
}

function afterMove() {
  if (factoriesEmpty()) {
    resolveRound();
    if (checkEnd() || state.round >= 5) {
      state.over = true;
      const msg = state.you.pts > state.ai.pts ? "勝利！" : state.you.pts < state.ai.pts ? "AIの勝ち" : "引き分け";
      setStatus("終了 " + msg + " You " + state.you.pts + " / AI " + state.ai.pts);
      render();
      return;
    }
    state.round++;
    dealFactories();
    state.turn = "you";
    setStatus("ラウンド " + state.round + " — 工房からタイルを選んでください");
    render();
    return;
  }
  state.turn = "ai";
  render();
  setTimeout(aiTurn, 350);
}

function aiTurn() {
  if (state.over) return;
  // pick largest group from a factory
  let best = null;
  state.factories.forEach((tiles, fi) => {
    const counts = {};
    tiles.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
    Object.keys(counts).forEach((c) => {
      const color = +c;
      const count = counts[c];
      if (!best || count > best.count) best = { src: "f", fi, color, count };
    });
  });
  if (!best && state.center.length) {
    const counts = {};
    state.center.forEach((t) => { counts[t] = (counts[t] || 0) + 1; });
    Object.keys(counts).forEach((c) => {
      const color = +c;
      if (!best || counts[c] > best.count) best = { src: "c", color, count: counts[c] };
    });
  }
  if (!best) { afterMove(); return; }
  const tiles = takeTiles(best);
  let placed = false;
  for (let row = 0; row < 5; row++) {
    if (patternAccepts("ai", row, tiles[0])) {
      placeTiles("ai", row, tiles);
      placed = true;
      break;
    }
  }
  if (!placed) state.ai.floor.push(...tiles);
  // continue as afterMove but don't recurse AI
  if (factoriesEmpty()) {
    resolveRound();
    if (checkEnd() || state.round >= 5) {
      state.over = true;
      const msg = state.you.pts > state.ai.pts ? "勝利！" : state.you.pts < state.ai.pts ? "AIの勝ち" : "引き分け";
      setStatus("終了 " + msg + " You " + state.you.pts + " / AI " + state.ai.pts);
      render();
      return;
    }
    state.round++;
    dealFactories();
  }
  state.turn = "you";
  setStatus("あなたのターン");
  render();
}

document.getElementById("btn-start").onclick = () => {
  state.bag = [];
  state.you = { wall: emptyWall(), pattern: emptyPattern(), floor: [], pts: 0 };
  state.ai = { wall: emptyWall(), pattern: emptyPattern(), floor: [], pts: 0 };
  state.round = 1;
  state.over = false;
  state.selected = null;
  state.active = true;
  state.turn = "you";
  dealFactories();
  setStatus("工房のタイル色をクリック → パターン行へ");
  render();
};

render();
