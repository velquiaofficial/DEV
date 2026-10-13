"use strict";

/** ISLEBOUND — original hex settle trial (genre: settler / trade). Not affiliated with any published title. */

const RES = ["wood", "brick", "wheat", "sheep", "ore"];
const RES_JP = { wood: "木", brick: "土", wheat: "麦", sheep: "羊", ore: "石" };
const COLORS = { wood: "#3d8f5a", brick: "#c45c3e", wheat: "#e0b84a", sheep: "#8fbf6a", ore: "#7a8494", desert: "#c2a878" };

const HEXES = [
  { q: 0, r: -2, res: "ore", num: 10 },
  { q: 1, r: -2, res: "wheat", num: 2 },
  { q: 2, r: -2, res: "sheep", num: 9 },
  { q: -1, r: -1, res: "brick", num: 12 },
  { q: 0, r: -1, res: "sheep", num: 6 },
  { q: 1, r: -1, res: "ore", num: 4 },
  { q: 2, r: -1, res: "wheat", num: 10 },
  { q: -2, r: 0, res: "wood", num: 9 },
  { q: -1, r: 0, res: "brick", num: 11 },
  { q: 0, r: 0, res: "desert", num: 0 },
  { q: 1, r: 0, res: "wood", num: 3 },
  { q: 2, r: 0, res: "sheep", num: 8 },
  { q: -2, r: 1, res: "wheat", num: 8 },
  { q: -1, r: 1, res: "wood", num: 3 },
  { q: 0, r: 1, res: "ore", num: 4 },
  { q: 1, r: 1, res: "brick", num: 5 },
  { q: -2, r: 2, res: "sheep", num: 5 },
  { q: -1, r: 2, res: "wheat", num: 6 },
  { q: 0, r: 2, res: "wood", num: 11 }
];

const SIZE = 36;
const ORIGIN = { x: 260, y: 240 };

function axialToPixel(q, r) {
  const x = SIZE * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r) + ORIGIN.x;
  const y = SIZE * ((3 / 2) * r) + ORIGIN.y;
  return { x, y };
}

function hexCorners(x, y) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = ((60 * i) - 30) * Math.PI / 180;
    pts.push([x + SIZE * Math.cos(a), y + SIZE * Math.sin(a)]);
  }
  return pts;
}

function nodeKey(x, y) {
  return Math.round(x) + "," + Math.round(y);
}

function buildGraph() {
  const nodes = new Map();
  const edges = new Map();
  HEXES.forEach((h, hi) => {
    const p = axialToPixel(h.q, h.r);
    const corners = hexCorners(p.x, p.y);
    const keys = corners.map(([x, y]) => {
      const k = nodeKey(x, y);
      if (!nodes.has(k)) nodes.set(k, { x, y, hexes: [] });
      nodes.get(k).hexes.push(hi);
      return k;
    });
    for (let i = 0; i < 6; i++) {
      const a = keys[i];
      const b = keys[(i + 1) % 6];
      const ek = [a, b].sort().join("|");
      if (!edges.has(ek)) edges.set(ek, { a, b });
    }
  });
  return { nodes, edges };
}

const graph = buildGraph();
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

function emptyBag() {
  return { wood: 0, brick: 0, wheat: 0, sheep: 0, ore: 0 };
}

const state = {
  phase: "idle",
  turn: "you",
  setupStep: 0,
  dice: 0,
  robber: HEXES.findIndex((h) => h.res === "desert"),
  buildMode: null,
  you: { res: emptyBag(), settlements: new Set(), cities: new Set(), roads: new Set() },
  ai: { res: emptyBag(), settlements: new Set(), cities: new Set(), roads: new Set() },
  winner: null
};

function other(p) { return p === "you" ? "ai" : "you"; }

function vp(p) {
  const pl = state[p];
  return pl.settlements.size + pl.cities.size * 2;
}

function canAfford(p, cost) {
  return Object.keys(cost).every((k) => state[p].res[k] >= cost[k]);
}
function pay(p, cost) {
  Object.keys(cost).forEach((k) => { state[p].res[k] -= cost[k]; });
}

function nodeDistanceOk(key) {
  const n = graph.nodes.get(key);
  for (const [ok, on] of graph.nodes) {
    if (ok === key) continue;
    const owned =
      state.you.settlements.has(ok) || state.you.cities.has(ok) ||
      state.ai.settlements.has(ok) || state.ai.cities.has(ok);
    if (!owned) continue;
    const dx = n.x - on.x;
    const dy = n.y - on.y;
    if (Math.hypot(dx, dy) < SIZE * 0.95) return false;
  }
  return true;
}

function roadTouches(p, edgeKey) {
  const e = graph.edges.get(edgeKey);
  const pl = state[p];
  if (pl.settlements.has(e.a) || pl.cities.has(e.a) || pl.settlements.has(e.b) || pl.cities.has(e.b)) return true;
  for (const rk of pl.roads) {
    const re = graph.edges.get(rk);
    if (re.a === e.a || re.a === e.b || re.b === e.a || re.b === e.b) return true;
  }
  return false;
}

function produce(num) {
  if (num === 7) {
    ["you", "ai"].forEach((p) => {
      const total = RES.reduce((s, k) => s + state[p].res[k], 0);
      if (total > 7) {
        let drop = Math.floor(total / 2);
        for (const k of RES) {
          while (drop > 0 && state[p].res[k] > 0) {
            state[p].res[k]--;
            drop--;
          }
        }
      }
    });
    setStatus("7！盗賊移動。資源の多い側が半分捨てました。空きヘックスをクリック。");
    state.phase = "robber";
    return;
  }
  HEXES.forEach((h, hi) => {
    if (h.num !== num || hi === state.robber || h.res === "desert") return;
    ["you", "ai"].forEach((p) => {
      const pl = state[p];
      for (const nk of pl.settlements) {
        if (graph.nodes.get(nk).hexes.includes(hi)) pl.res[h.res]++;
      }
      for (const nk of pl.cities) {
        if (graph.nodes.get(nk).hexes.includes(hi)) pl.res[h.res] += 2;
      }
    });
  });
}

function setStatus(t) {
  document.getElementById("status").textContent = t;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  HEXES.forEach((h, hi) => {
    const p = axialToPixel(h.q, h.r);
    const pts = hexCorners(p.x, p.y);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = COLORS[h.res];
    ctx.globalAlpha = hi === state.robber ? 0.45 : 0.92;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(0,0,0,.35)";
    ctx.stroke();
    if (h.num) {
      ctx.fillStyle = "#1a1510";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = h.num === 6 || h.num === 8 ? "#e85d4c" : "#f3e7d3";
      ctx.font = "bold 12px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(h.num), p.x, p.y);
    }
    if (hi === state.robber) {
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(p.x, p.y + (h.num ? 18 : 0), 7, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  for (const [ek, e] of graph.edges) {
    const owner = state.you.roads.has(ek) ? "you" : state.ai.roads.has(ek) ? "ai" : null;
    if (!owner) continue;
    const a = graph.nodes.get(e.a);
    const b = graph.nodes.get(e.b);
    ctx.strokeStyle = owner === "you" ? "#6ec6ff" : "#ff7a6e";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  for (const [k, n] of graph.nodes) {
    let owner = null;
    let city = false;
    if (state.you.cities.has(k)) { owner = "you"; city = true; }
    else if (state.ai.cities.has(k)) { owner = "ai"; city = true; }
    else if (state.you.settlements.has(k)) owner = "you";
    else if (state.ai.settlements.has(k)) owner = "ai";
    if (!owner) continue;
    ctx.fillStyle = owner === "you" ? "#6ec6ff" : "#ff7a6e";
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    if (city) {
      ctx.fillRect(n.x - 8, n.y - 8, 16, 16);
      ctx.strokeRect(n.x - 8, n.y - 8, 16, 16);
    } else {
      ctx.beginPath();
      ctx.moveTo(n.x, n.y - 9);
      ctx.lineTo(n.x + 8, n.y + 7);
      ctx.lineTo(n.x - 8, n.y + 7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }
}

function renderUI() {
  document.getElementById("vp-you").textContent = String(vp("you"));
  document.getElementById("vp-ai").textContent = String(vp("ai"));
  document.getElementById("dice").textContent = state.dice || "-";
  const ul = document.getElementById("res");
  ul.innerHTML = RES.map((k) => `<li>${RES_JP[k]}<b>${state.you.res[k]}</b></li>`).join("");
  const play = state.phase === "play" && state.turn === "you" && !state.winner;
  document.getElementById("btn-roll").disabled = !(play && !state.rolled);
  document.getElementById("btn-road").disabled = !(play && state.rolled);
  document.getElementById("btn-settle").disabled = !(play && state.rolled);
  document.getElementById("btn-city").disabled = !(play && state.rolled);
  document.getElementById("btn-end").disabled = !(play && state.rolled);
  draw();
}

function checkWin() {
  for (const p of ["you", "ai"]) {
    if (vp(p) >= 7) {
      state.winner = p;
      state.phase = "done";
      setStatus(p === "you" ? "勝利！島を制しました。" : "AIの勝利。再挑戦を。");
      return true;
    }
  }
  return false;
}

function nearestNode(mx, my) {
  let best = null;
  let bd = 18;
  for (const [k, n] of graph.nodes) {
    const d = Math.hypot(n.x - mx, n.y - my);
    if (d < bd) { bd = d; best = k; }
  }
  return best;
}

function nearestEdge(mx, my) {
  let best = null;
  let bd = 14;
  for (const [ek, e] of graph.edges) {
    const a = graph.nodes.get(e.a);
    const b = graph.nodes.get(e.b);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const t = Math.max(0, Math.min(1, ((mx - a.x) * dx + (my - a.y) * dy) / (dx * dx + dy * dy || 1)));
    const px = a.x + t * dx;
    const py = a.y + t * dy;
    const d = Math.hypot(mx - px, my - py);
    if (d < bd) { bd = d; best = ek; }
  }
  return best;
}

function nearestHex(mx, my) {
  let best = -1;
  let bd = SIZE;
  HEXES.forEach((h, i) => {
    const p = axialToPixel(h.q, h.r);
    const d = Math.hypot(p.x - mx, p.y - my);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

function placeSettlement(p, key, free) {
  if (state.you.settlements.has(key) || state.ai.settlements.has(key) ||
      state.you.cities.has(key) || state.ai.cities.has(key)) return false;
  if (!nodeDistanceOk(key)) return false;
  const cost = { wood: 1, brick: 1, wheat: 1, sheep: 1 };
  if (!free) {
    if (!canAfford(p, cost)) return false;
    pay(p, cost);
  }
  state[p].settlements.add(key);
  return true;
}

function placeRoad(p, ek, free) {
  if (state.you.roads.has(ek) || state.ai.roads.has(ek)) return false;
  if (!roadTouches(p, ek)) return false;
  const cost = { wood: 1, brick: 1 };
  if (!free) {
    if (!canAfford(p, cost)) return false;
    pay(p, cost);
  }
  state[p].roads.add(ek);
  return true;
}

function upgradeCity(p, key) {
  if (!state[p].settlements.has(key)) return false;
  const cost = { wheat: 2, ore: 3 };
  if (!canAfford(p, cost)) return false;
  pay(p, cost);
  state[p].settlements.delete(key);
  state[p].cities.add(key);
  return true;
}

function setupAdvance() {
  state.setupStep++;
  const order = ["you", "ai", "ai", "you"];
  if (state.setupStep >= 8) {
    state.phase = "play";
    state.turn = "you";
    state.rolled = false;
    setStatus("あなたのターン。サイコロを振ってください。");
    renderUI();
    return;
  }
  const kind = state.setupStep % 2 === 1 ? "settle" : "road";
  state.turn = order[Math.floor((state.setupStep - 1) / 2)];
  state.buildMode = kind;
  if (state.turn === "ai") {
    setStatus("AIが配置中…");
    setTimeout(aiSetup, 400);
  } else {
    setStatus(kind === "settle" ? "集落を頂点に置いてください" : "道を辺に置いてください");
  }
  renderUI();
}

function aiSetup() {
  if (state.buildMode === "settle") {
    const keys = [...graph.nodes.keys()].sort(() => Math.random() - 0.5);
    for (const k of keys) {
      if (placeSettlement("ai", k, true)) break;
    }
  } else {
    const edges = [...graph.edges.keys()].sort(() => Math.random() - 0.5);
    for (const ek of edges) {
      if (placeRoad("ai", ek, true)) break;
    }
  }
  setupAdvance();
}

function stealFrom(victim) {
  const pool = [];
  RES.forEach((k) => {
    for (let i = 0; i < state[victim].res[k]; i++) pool.push(k);
  });
  if (!pool.length) return;
  const got = pool[Math.floor(Math.random() * pool.length)];
  state[victim].res[got]--;
  state[state.turn].res[got]++;
}

function endTurn() {
  if (checkWin()) { renderUI(); return; }
  state.turn = other(state.turn);
  state.rolled = false;
  state.buildMode = null;
  if (state.turn === "ai") {
    setStatus("AIのターン…");
    renderUI();
    setTimeout(aiTurn, 500);
  } else {
    setStatus("あなたのターン。サイコロを振ってください。");
    renderUI();
  }
}

function aiTurn() {
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  state.dice = d1 + d2;
  produce(state.dice);
  if (state.phase === "robber") {
    let hi = Math.floor(Math.random() * HEXES.length);
    if (hi === state.robber) hi = (hi + 1) % HEXES.length;
    state.robber = hi;
    stealFrom("you");
    state.phase = "play";
  }
  state.rolled = true;
  for (let i = 0; i < 3; i++) {
    if (canAfford("ai", { wheat: 2, ore: 3 }) && state.ai.settlements.size) {
      const k = [...state.ai.settlements][0];
      upgradeCity("ai", k);
    } else if (canAfford("ai", { wood: 1, brick: 1, wheat: 1, sheep: 1 })) {
      const keys = [...graph.nodes.keys()].sort(() => Math.random() - 0.5);
      for (const k of keys) if (placeSettlement("ai", k, false)) break;
    } else if (canAfford("ai", { wood: 1, brick: 1 })) {
      const edges = [...graph.edges.keys()].sort(() => Math.random() - 0.5);
      for (const ek of edges) if (placeRoad("ai", ek, false)) break;
    }
  }
  if (checkWin()) { renderUI(); return; }
  endTurn();
}

canvas.addEventListener("click", (ev) => {
  if (state.winner) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
  const my = (ev.clientY - rect.top) * (canvas.height / rect.height);

  if (state.phase === "robber" && state.turn === "you") {
    const hi = nearestHex(mx, my);
    if (hi < 0 || hi === state.robber) return;
    state.robber = hi;
    stealFrom("ai");
    state.phase = "play";
    setStatus("盗賊を移動しました。建設するかターン終了。");
    renderUI();
    return;
  }

  if (state.phase === "setup" && state.turn === "you") {
    if (state.buildMode === "settle") {
      const k = nearestNode(mx, my);
      if (k && placeSettlement("you", k, true)) setupAdvance();
    } else if (state.buildMode === "road") {
      const ek = nearestEdge(mx, my);
      if (ek && placeRoad("you", ek, true)) setupAdvance();
    }
    renderUI();
    return;
  }

  if (state.phase === "play" && state.turn === "you" && state.rolled && state.buildMode) {
    if (state.buildMode === "road") {
      const ek = nearestEdge(mx, my);
      if (ek && placeRoad("you", ek, false)) {
        setStatus("道を建設。続けて建設するかターン終了。");
        state.buildMode = null;
      }
    } else if (state.buildMode === "settle") {
      const k = nearestNode(mx, my);
      if (k && placeSettlement("you", k, false)) {
        setStatus("集落を建設。");
        state.buildMode = null;
        checkWin();
      }
    } else if (state.buildMode === "city") {
      const k = nearestNode(mx, my);
      if (k && upgradeCity("you", k)) {
        setStatus("都市に発展。");
        state.buildMode = null;
        checkWin();
      }
    }
    renderUI();
  }
});

document.getElementById("btn-start").onclick = () => {
  state.phase = "setup";
  state.setupStep = 0;
  state.winner = null;
  ["you", "ai"].forEach((p) => {
    state[p] = { res: emptyBag(), settlements: new Set(), cities: new Set(), roads: new Set() };
  });
  state.robber = HEXES.findIndex((h) => h.res === "desert");
  document.getElementById("btn-start").textContent = "リセット";
  setupAdvance();
};

document.getElementById("btn-roll").onclick = () => {
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  state.dice = d1 + d2;
  state.rolled = true;
  produce(state.dice);
  if (state.phase !== "robber") setStatus("出目 " + state.dice + "。建設するかターン終了。");
  renderUI();
};

document.getElementById("btn-road").onclick = () => {
  if (!canAfford("you", { wood: 1, brick: 1 })) { setStatus("資源不足（道）"); return; }
  state.buildMode = "road";
  setStatus("道を置く辺をクリック");
};
document.getElementById("btn-settle").onclick = () => {
  if (!canAfford("you", { wood: 1, brick: 1, wheat: 1, sheep: 1 })) { setStatus("資源不足（集落）"); return; }
  state.buildMode = "settle";
  setStatus("集落を置く頂点をクリック（隣接禁止）");
};
document.getElementById("btn-city").onclick = () => {
  if (!canAfford("you", { wheat: 2, ore: 3 })) { setStatus("資源不足（都市）"); return; }
  state.buildMode = "city";
  setStatus("自分の集落をクリックして都市化");
};
document.getElementById("btn-end").onclick = () => endTurn();

renderUI();
