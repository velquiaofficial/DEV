"use strict";

/** RAILSPAN — original route-claim trial. Not affiliated with any published title. */

const COLORS = ["red", "blue", "green", "yellow", "black", "wild"];
const HEX = { red: "#e85d5d", blue: "#5b8dff", green: "#3ecf8e", yellow: "#e0c35a", black: "#445", wild: "#d0d6e0" };
const LABEL = { red: "赤", blue: "青", green: "緑", yellow: "黄", black: "黒", wild: "万能" };

const CITIES = [
  { id: "north", name: "北港", x: 100, y: 60 },
  { id: "mine", name: "鉱山", x: 280, y: 80 },
  { id: "lake", name: "湖都", x: 460, y: 70 },
  { id: "cross", name: "交差", x: 320, y: 180 },
  { id: "farm", name: "農園", x: 120, y: 220 },
  { id: "cape", name: "岬", x: 520, y: 200 },
  { id: "south", name: "南湾", x: 300, y: 320 },
  { id: "west", name: "西門", x: 80, y: 320 }
];

const ROUTES = [
  { a: "north", b: "mine", len: 2, color: "red" },
  { a: "mine", b: "lake", len: 2, color: "blue" },
  { a: "north", b: "farm", len: 3, color: "green" },
  { a: "mine", b: "cross", len: 2, color: "yellow" },
  { a: "lake", b: "cape", len: 2, color: "black" },
  { a: "lake", b: "cross", len: 2, color: "red" },
  { a: "farm", b: "cross", len: 2, color: "blue" },
  { a: "cross", b: "cape", len: 3, color: "green" },
  { a: "farm", b: "west", len: 2, color: "yellow" },
  { a: "west", b: "south", len: 2, color: "black" },
  { a: "cross", b: "south", len: 2, color: "red" },
  { a: "cape", b: "south", len: 3, color: "blue" },
  { a: "north", b: "cross", len: 3, color: "wild" },
  { a: "farm", b: "south", len: 3, color: "wild" }
];

const TICKETS = [
  { a: "north", b: "south", pts: 8 },
  { a: "west", b: "lake", pts: 7 },
  { a: "farm", b: "cape", pts: 6 },
  { a: "north", b: "cape", pts: 7 },
  { a: "mine", b: "west", pts: 5 },
  { a: "lake", b: "south", pts: 6 }
];

const SCORE_LEN = { 1: 1, 2: 2, 3: 4, 4: 7 };

const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");

function city(id) { return CITIES.find((c) => c.id === id); }

function makeDeck() {
  const d = [];
  COLORS.forEach((c) => {
    const n = c === "wild" ? 8 : 10;
    for (let i = 0; i < n; i++) d.push(c);
  });
  return d.sort(() => Math.random() - 0.5);
}

const state = {
  deck: [],
  face: [],
  discard: [],
  you: { hand: {}, trains: 20, routes: new Set(), tickets: [], pts: 0 },
  ai: { hand: {}, trains: 20, routes: new Set(), tickets: [], pts: 0 },
  owners: {},
  turn: "you",
  active: false,
  selColor: null,
  over: false
};

function countHand(h) {
  return COLORS.reduce((s, c) => s + (h[c] || 0), 0);
}

function drawCard() {
  if (!state.deck.length) {
    state.deck = state.discard.sort(() => Math.random() - 0.5);
    state.discard = [];
  }
  return state.deck.pop();
}

function give(p, color) {
  state[p].hand[color] = (state[p].hand[color] || 0) + 1;
}

function setStatus(t) { document.getElementById("status").textContent = t; }

function connected(p, a, b) {
  const adj = {};
  CITIES.forEach((c) => { adj[c.id] = []; });
  ROUTES.forEach((r, i) => {
    if (!state[p].routes.has(i)) return;
    adj[r.a].push(r.b);
    adj[r.b].push(r.a);
  });
  const q = [a];
  const seen = new Set([a]);
  while (q.length) {
    const cur = q.shift();
    if (cur === b) return true;
    for (const n of adj[cur]) {
      if (!seen.has(n)) { seen.add(n); q.push(n); }
    }
  }
  return false;
}

function drawMap() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ROUTES.forEach((r, i) => {
    const A = city(r.a);
    const B = city(r.b);
    const owner = state.owners[i];
    ctx.strokeStyle = owner === "you" ? "#5ec8ff" : owner === "ai" ? "#ff8b6b" : HEX[r.color];
    ctx.lineWidth = owner ? 7 : 4;
    ctx.globalAlpha = owner ? 1 : 0.75;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    const mx = (A.x + B.x) / 2;
    const my = (A.y + B.y) / 2;
    ctx.fillStyle = "#0a1218";
    ctx.beginPath();
    ctx.arc(mx, my, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e8f1f8";
    ctx.font = "bold 11px Outfit,sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(r.len), mx, my);
  });
  CITIES.forEach((c) => {
    ctx.fillStyle = "#1c2e3c";
    ctx.strokeStyle = "#8eb6d0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#e8f1f8";
    ctx.font = "12px Zen Maru Gothic,sans-serif";
    ctx.fillText(c.name, c.x, c.y + 28);
  });
}

function render() {
  document.getElementById("pts-you").textContent = state.you.pts;
  document.getElementById("pts-ai").textContent = state.ai.pts;
  document.getElementById("trains").textContent = state.you.trains;
  document.getElementById("hand").innerHTML = COLORS.filter((c) => state.you.hand[c]).map((c) =>
    `<div class="chip${state.selColor === c ? " sel" : ""}" data-c="${c}" style="background:${HEX[c]};color:${c === "yellow" || c === "wild" ? "#111" : "#fff"}">${LABEL[c]}×${state.you.hand[c]}</div>`
  ).join("") || "<span style='color:#7f95a8'>なし</span>";
  document.getElementById("face").innerHTML = state.face.map((c, i) =>
    `<div class="chip" data-f="${i}" style="background:${HEX[c]};color:${c === "yellow" || c === "wild" ? "#111" : "#fff"}">${LABEL[c]}</div>`
  ).join("");
  document.getElementById("tickets").innerHTML = state.you.tickets.map((t) => {
    const ok = connected("you", t.a, t.b);
    return `<li>${city(t.a).name} → ${city(t.b).name}（${t.pts}点）${ok ? "✓" : ""}</li>`;
  }).join("");
  const you = state.active && state.turn === "you" && !state.over;
  document.getElementById("btn-draw").disabled = !you;
  document.getElementById("btn-end").disabled = !state.active || state.over;
  document.querySelectorAll("#hand .chip").forEach((el) => {
    el.onclick = () => {
      if (!you) return;
      state.selColor = el.dataset.c;
      setStatus(LABEL[state.selColor] + "でルートをクリック");
      render();
    };
  });
  document.querySelectorAll("#face .chip").forEach((el) => {
    el.onclick = () => {
      if (!you) return;
      const i = +el.dataset.f;
      const c = state.face[i];
      give("you", c);
      state.face[i] = drawCard();
      const c2 = drawCard();
      if (c2) give("you", c2);
      setStatus("カードを引きました");
      endYou();
    };
  });
  drawMap();
}

function canClaim(p, ri) {
  if (state.owners[ri] != null) return false;
  const r = ROUTES[ri];
  if (state[p].trains < r.len) return false;
  const hand = state[p].hand;
  const need = r.len;
  if (r.color === "wild") {
    // any single color + wilds
    for (const c of COLORS) {
      if (c === "wild") continue;
      if ((hand[c] || 0) + (hand.wild || 0) >= need) return c;
    }
    return false;
  }
  if ((hand[r.color] || 0) + (hand.wild || 0) >= need) return r.color;
  return false;
}

function payClaim(p, ri, color) {
  const r = ROUTES[ri];
  let left = r.len;
  const useMain = Math.min(left, state[p].hand[color] || 0);
  state[p].hand[color] -= useMain;
  left -= useMain;
  state[p].hand.wild -= left;
  for (let i = 0; i < r.len; i++) state.discard.push(color);
  state[p].trains -= r.len;
  state[p].routes.add(ri);
  state.owners[ri] = p;
  state[p].pts += SCORE_LEN[r.len] || r.len;
}

function endYou() {
  if (state.you.trains <= 2) { finalize(); return; }
  state.turn = "ai";
  render();
  setTimeout(aiTurn, 400);
}

function aiTurn() {
  let claimed = false;
  for (let i = 0; i < ROUTES.length; i++) {
    const col = canClaim("ai", i);
    if (col) { payClaim("ai", i, col); claimed = true; break; }
  }
  if (!claimed) {
    give("ai", drawCard());
    give("ai", drawCard());
  }
  if (state.ai.trains <= 2) { finalize(); return; }
  state.turn = "you";
  setStatus("あなたのターン。ルート確保かカード補充。");
  render();
}

function finalize() {
  state.over = true;
  ["you", "ai"].forEach((p) => {
    state[p].tickets.forEach((t) => {
      state[p].pts += connected(p, t.a, t.b) ? t.pts : -Math.ceil(t.pts / 2);
    });
  });
  const msg = state.you.pts > state.ai.pts ? "勝利！" : state.you.pts < state.ai.pts ? "AIの勝ち" : "引き分け";
  setStatus("終了 " + msg + " You " + state.you.pts + " / AI " + state.ai.pts);
  render();
}

canvas.addEventListener("click", (ev) => {
  if (!state.active || state.turn !== "you" || state.over) return;
  const rect = canvas.getBoundingClientRect();
  const mx = (ev.clientX - rect.left) * (canvas.width / rect.width);
  const my = (ev.clientY - rect.top) * (canvas.height / rect.height);
  let best = -1;
  let bd = 18;
  ROUTES.forEach((r, i) => {
    const A = city(r.a);
    const B = city(r.b);
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    const t = Math.max(0, Math.min(1, ((mx - A.x) * dx + (my - A.y) * dy) / (dx * dx + dy * dy || 1)));
    const d = Math.hypot(mx - (A.x + t * dx), my - (A.y + t * dy));
    if (d < bd) { bd = d; best = i; }
  });
  if (best < 0) return;
  const col = canClaim("you", best);
  if (!col) { setStatus("そのルートは取れません"); return; }
  if (state.selColor && state.selColor !== "wild" && state.selColor !== col && ROUTES[best].color !== "wild") {
    // allow if sel matches route or paying with that color on wild route
  }
  const payColor = ROUTES[best].color === "wild"
    ? (state.selColor && state.selColor !== "wild" ? state.selColor : col)
    : col;
  if (ROUTES[best].color !== "wild" && state.selColor && state.selColor !== "wild" && state.selColor !== ROUTES[best].color) {
    setStatus("色が合いません。手札の色を選んでからクリック");
    return;
  }
  payClaim("you", best, payColor === "wild" ? col : payColor);
  state.selColor = null;
  setStatus("ルート確保 +" + (SCORE_LEN[ROUTES[best].len] || ROUTES[best].len));
  endYou();
});

document.getElementById("btn-start").onclick = () => {
  state.deck = makeDeck();
  state.face = [drawCard(), drawCard(), drawCard(), drawCard(), drawCard()];
  state.discard = [];
  state.owners = {};
  state.over = false;
  const tickets = TICKETS.sort(() => Math.random() - 0.5);
  ["you", "ai"].forEach((p, idx) => {
    state[p] = { hand: {}, trains: 20, routes: new Set(), tickets: tickets.slice(idx * 2, idx * 2 + 2), pts: 0 };
    for (let i = 0; i < 4; i++) give(p, drawCard());
  });
  state.turn = "you";
  state.active = true;
  state.selColor = null;
  setStatus("手札の色を選び、ルート線をクリック。または表向き／山札から補充。");
  render();
};

document.getElementById("btn-draw").onclick = () => {
  give("you", drawCard());
  give("you", drawCard());
  setStatus("山札から2枚");
  endYou();
};

document.getElementById("btn-end").onclick = () => finalize();

render();
