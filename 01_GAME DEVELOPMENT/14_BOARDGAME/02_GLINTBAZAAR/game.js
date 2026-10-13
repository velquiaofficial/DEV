"use strict";

/** GLINT BAZAAR — original gem-engine trial. Not affiliated with any published title. */

const GEMS = ["w", "u", "g", "r", "k"];
const LABEL = { w: "白", u: "青", g: "緑", r: "赤", k: "黒", gold: "金" };

function card(pts, bonus, cost) {
  return { pts, bonus, cost, id: Math.random().toString(36).slice(2, 8) };
}

function makeDeck() {
  const d = [];
  const templates = [
    [0, "w", { u: 1, g: 1, r: 1 }],
    [0, "u", { w: 1, g: 1, k: 1 }],
    [0, "g", { w: 1, u: 1, r: 1 }],
    [0, "r", { w: 1, u: 1, g: 1 }],
    [0, "k", { g: 1, r: 1, w: 1 }],
    [1, "w", { u: 2, g: 1 }],
    [1, "u", { r: 2, k: 1 }],
    [1, "g", { w: 2, r: 1 }],
    [1, "r", { k: 2, u: 1 }],
    [1, "k", { g: 2, w: 1 }],
    [2, "w", { k: 3, r: 1 }],
    [2, "u", { w: 3, g: 1 }],
    [2, "g", { u: 3, k: 1 }],
    [2, "r", { g: 3, w: 1 }],
    [3, "k", { r: 3, u: 2 }],
    [3, "w", { g: 4 }],
    [4, "u", { k: 3, r: 2, g: 1 }],
    [5, "g", { w: 3, u: 3 }]
  ];
  for (let i = 0; i < 3; i++) templates.forEach((t) => d.push(card(t[0], t[1], { ...t[2] })));
  return d.sort(() => Math.random() - 0.5);
}

const state = {
  bank: { w: 4, u: 4, g: 4, r: 4, k: 4, gold: 5 },
  market: [],
  deck: [],
  you: { gems: { w: 0, u: 0, g: 0, r: 0, k: 0, gold: 0 }, bonus: { w: 0, u: 0, g: 0, r: 0, k: 0 }, pts: 0 },
  ai: { gems: { w: 0, u: 0, g: 0, r: 0, k: 0, gold: 0 }, bonus: { w: 0, u: 0, g: 0, r: 0, k: 0 }, pts: 0 },
  turn: "you",
  pick: [],
  mode: null,
  active: false,
  winner: null
};

function effective(p, color) {
  return state[p].gems[color] + state[p].bonus[color];
}

function canBuy(p, c) {
  let goldNeed = 0;
  for (const g of GEMS) {
    const need = (c.cost[g] || 0) - state[p].bonus[g];
    if (need <= 0) continue;
    const have = state[p].gems[g];
    if (have >= need) continue;
    goldNeed += need - have;
  }
  return state[p].gems.gold >= goldNeed;
}

function buy(p, c) {
  if (!canBuy(p, c)) return false;
  for (const g of GEMS) {
    let need = Math.max(0, (c.cost[g] || 0) - state[p].bonus[g]);
    const use = Math.min(need, state[p].gems[g]);
    state[p].gems[g] -= use;
    state.bank[g] += use;
    need -= use;
    if (need > 0) {
      state[p].gems.gold -= need;
      state.bank.gold += need;
    }
  }
  state[p].bonus[c.bonus]++;
  state[p].pts += c.pts;
  return true;
}

function setStatus(t) { document.getElementById("status").textContent = t; }

function gemHtml(map, clickable, selected) {
  return [...GEMS, "gold"].map((g) => {
    const sel = selected && selected.includes(g) ? " sel" : "";
    return `<div class="gem${sel}" data-g="${g}"><span class="bon dot-${g}"></span>${LABEL[g]}<b>${map[g]}</b></div>`;
  }).join("");
}

function render() {
  document.getElementById("pts-you").textContent = state.you.pts;
  document.getElementById("pts-ai").textContent = state.ai.pts;
  document.getElementById("turn").textContent = state.winner
    ? (state.winner === "you" ? "YOU WIN" : "AI WIN")
    : (state.turn === "you" ? "Your turn" : "AI thinking…");
  document.getElementById("bank").innerHTML = gemHtml(state.bank, true, state.pick);
  document.getElementById("mine").innerHTML = gemHtml(state.you.gems, false);
  document.getElementById("bonus").innerHTML = GEMS.map((g) =>
    `<div class="gem"><span class="bon dot-${g}"></span>${LABEL[g]}<b>${state.you.bonus[g]}</b></div>`
  ).join("");
  document.getElementById("market").innerHTML = state.market.map((c, i) => {
    const costs = GEMS.filter((g) => c.cost[g]).map((g) =>
      `<span><i class="dot-${g}"></i>${c.cost[g]}</span>`
    ).join("");
    return `<article class="card" data-i="${i}"><div class="pts">${c.pts} pts</div>
      <div><span class="bon dot-${c.bonus}"></span>bonus ${LABEL[c.bonus]}</div>
      <div class="cost">${costs}</div></article>`;
  }).join("");

  const you = state.active && state.turn === "you" && !state.winner;
  document.getElementById("btn-take3").disabled = !you;
  document.getElementById("btn-take2").disabled = !you;
  document.getElementById("btn-pass").disabled = !you;

  document.querySelectorAll("#market .card").forEach((el) => {
    el.onclick = () => {
      if (!you) return;
      const c = state.market[+el.dataset.i];
      if (!buy("you", c)) { setStatus("宝石が足りません"); return; }
      state.market[+el.dataset.i] = state.deck.pop() || null;
      state.market = state.market.filter(Boolean);
      while (state.market.length < 6 && state.deck.length) state.market.push(state.deck.pop());
      setStatus("カード購入 +" + c.pts);
      afterYou();
    };
  });

  document.querySelectorAll("#bank .gem").forEach((el) => {
    el.onclick = () => {
      if (!you || !state.mode) return;
      const g = el.dataset.g;
      if (g === "gold") return;
      if (state.mode === "take3") {
        if (state.pick.includes(g) || state.bank[g] <= 0) return;
        state.pick.push(g);
        if (state.pick.length === 3) finishTake();
        else { setStatus("選択 " + state.pick.map((x) => LABEL[x]).join("·") + "（あと" + (3 - state.pick.length) + "）"); render(); }
      } else if (state.mode === "take2") {
        if (state.bank[g] < 2) { setStatus("その色は2個未満"); return; }
        state.pick = [g, g];
        finishTake();
      }
    };
  });
}

function finishTake() {
  state.pick.forEach((g) => {
    state.bank[g]--;
    state.you.gems[g]++;
  });
  setStatus("宝石を取りました");
  state.mode = null;
  state.pick = [];
  afterYou();
}

function afterYou() {
  if (state.you.pts >= 15) { state.winner = "you"; setStatus("名声15！勝利"); render(); return; }
  state.turn = "ai";
  render();
  setTimeout(aiTurn, 450);
}

function aiTurn() {
  if (state.winner) return;
  let bought = false;
  const order = [...state.market].sort((a, b) => b.pts - a.pts);
  for (const c of order) {
    const idx = state.market.indexOf(c);
    if (idx >= 0 && buy("ai", c)) {
      state.market.splice(idx, 1);
      if (state.deck.length) state.market.push(state.deck.pop());
      bought = true;
      break;
    }
  }
  if (!bought) {
    const avail = GEMS.filter((g) => state.bank[g] > 0).sort(() => Math.random() - 0.5);
    for (let i = 0; i < 3 && i < avail.length; i++) {
      state.bank[avail[i]]--;
      state.ai.gems[avail[i]]++;
    }
  }
  if (state.ai.pts >= 15) { state.winner = "ai"; setStatus("AIが名声15。敗北"); render(); return; }
  state.turn = "you";
  setStatus("あなたのターン。カード購入か宝石取得。");
  render();
}

document.getElementById("btn-start").onclick = () => {
  state.deck = makeDeck();
  state.market = state.deck.splice(0, 6);
  state.bank = { w: 4, u: 4, g: 4, r: 4, k: 4, gold: 5 };
  ["you", "ai"].forEach((p) => {
    state[p] = { gems: { w: 0, u: 0, g: 0, r: 0, k: 0, gold: 0 }, bonus: { w: 0, u: 0, g: 0, r: 0, k: 0 }, pts: 0 };
  });
  state.turn = "you";
  state.active = true;
  state.winner = null;
  state.mode = null;
  state.pick = [];
  setStatus("カードを買うか、宝石を取ってください");
  render();
};

document.getElementById("btn-take3").onclick = () => {
  state.mode = "take3";
  state.pick = [];
  setStatus("在庫から違う色を3つクリック");
  render();
};
document.getElementById("btn-take2").onclick = () => {
  state.mode = "take2";
  state.pick = [];
  setStatus("在庫が2以上の色を1つクリック");
  render();
};
document.getElementById("btn-pass").onclick = () => afterYou();

render();
