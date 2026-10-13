"use strict";

/** CROWNSTACK — original deck-building trial. Not affiliated with any published title. */

const CARDS = {
  copper: { name: "銅貨", type: "treasure", cost: 0, coin: 1, vp: 0 },
  silver: { name: "銀貨", type: "treasure", cost: 3, coin: 2, vp: 0 },
  gold: { name: "金貨", type: "treasure", cost: 6, coin: 3, vp: 0 },
  estate: { name: "領地", type: "victory", cost: 2, coin: 0, vp: 1 },
  duchy: { name: "公領", type: "victory", cost: 5, coin: 0, vp: 3 },
  province: { name: "属州", type: "victory", cost: 8, coin: 0, vp: 6 },
  market: { name: "市場", type: "action", cost: 5, coin: 1, vp: 0, draw: 1, buy: 1 },
  smithy: { name: "鍛冶", type: "action", cost: 4, coin: 0, vp: 0, draw: 3 },
  village: { name: "村", type: "action", cost: 3, coin: 0, vp: 0, draw: 1, action: 2 },
  festival: { name: "祭典", type: "action", cost: 5, coin: 2, vp: 0, buy: 1, action: 2 },
  militia: { name: "民兵", type: "action", cost: 4, coin: 2, vp: 0 }
};

const MARKET_KEYS = ["silver", "gold", "estate", "duchy", "province", "market", "smithy", "village", "festival", "militia"];

function cloneCard(key) {
  return { key, ...CARDS[key], uid: Math.random().toString(36).slice(2, 9) };
}

function startingDeck() {
  const d = [];
  for (let i = 0; i < 7; i++) d.push(cloneCard("copper"));
  for (let i = 0; i < 3; i++) d.push(cloneCard("estate"));
  return shuffle(d);
}

function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function makePlayer() {
  const deck = startingDeck();
  return {
    deck,
    discard: [],
    hand: [],
    play: [],
    actions: 1,
    buys: 1,
    coin: 0
  };
}

const state = {
  supply: {},
  you: null,
  ai: null,
  turn: "you",
  active: false,
  over: false
};

function vpOf(p) {
  const all = [...p.deck, ...p.discard, ...p.hand, ...p.play];
  return all.reduce((s, c) => s + (c.vp || 0), 0);
}

function draw(p, n) {
  for (let i = 0; i < n; i++) {
    if (!p.deck.length) {
      p.deck = shuffle(p.discard);
      p.discard = [];
    }
    if (!p.deck.length) break;
    p.hand.push(p.deck.pop());
  }
}

function setStatus(t) { document.getElementById("status").textContent = t; }

function cardHtml(c, dataAttr) {
  return `<article class="card ${c.type}" ${dataAttr}>
    <div class="name">${c.name}</div>
    <div class="cost">コスト ${c.cost}</div>
    <div class="eff">${desc(c)}</div>
  </article>`;
}

function desc(c) {
  const bits = [];
  if (c.coin) bits.push("+" + c.coin + "金");
  if (c.vp) bits.push(c.vp + "VP");
  if (c.draw) bits.push(c.draw + "ドロー");
  if (c.buy) bits.push("+" + c.buy + "購入");
  if (c.action) bits.push("+" + c.action + "アクション");
  if (c.key === "militia") bits.push("相手手札を3枚に");
  return bits.join(" · ") || "—";
}

function render() {
  if (!state.you) return;
  document.getElementById("vp-you").textContent = vpOf(state.you);
  document.getElementById("vp-ai").textContent = vpOf(state.ai);
  document.getElementById("coin").textContent = state.you.coin;
  document.getElementById("buys").textContent = state.you.buys;
  document.getElementById("deckn").textContent = state.you.deck.length;
  document.getElementById("disc").textContent = state.you.discard.length;

  document.getElementById("market").innerHTML = MARKET_KEYS.map((k) => {
    const base = CARDS[k];
    const left = state.supply[k];
    return `<article class="card ${base.type}" data-buy="${k}">
      <div class="name">${base.name} <small>×${left}</small></div>
      <div class="cost">コスト ${base.cost}</div>
      <div class="eff">${desc(base)}</div>
    </article>`;
  }).join("");

  document.getElementById("hand").innerHTML = state.you.hand.map((c, i) =>
    cardHtml(c, `data-hand="${i}"`)
  ).join("") || "<p style='color:#9a8fb0'>手札なし</p>";

  const you = state.active && state.turn === "you" && !state.over;
  document.getElementById("btn-end").disabled = !you;

  document.querySelectorAll("[data-hand]").forEach((el) => {
    el.onclick = () => {
      if (!you) return;
      playCard(+el.dataset.hand);
    };
  });
  document.querySelectorAll("[data-buy]").forEach((el) => {
    el.onclick = () => {
      if (!you) return;
      buyCard(el.dataset.buy);
    };
  });
}

function playCard(i) {
  const p = state.you;
  const c = p.hand[i];
  if (!c) return;
  if (c.type === "action") {
    if (p.actions <= 0) { setStatus("アクションが残っていません"); return; }
    p.actions--;
  } else if (c.type === "victory") {
    setStatus("勝利点カードはプレイしません（自動集計）");
    return;
  }
  p.hand.splice(i, 1);
  p.play.push(c);
  if (c.coin) p.coin += c.coin;
  if (c.draw) draw(p, c.draw);
  if (c.buy) p.buys += c.buy;
  if (c.action) p.actions += c.action;
  if (c.key === "militia") {
    while (state.ai.hand.length > 3) {
      state.ai.discard.push(state.ai.hand.pop());
    }
  }
  setStatus(c.name + " をプレイ");
  render();
}

function buyCard(key) {
  const p = state.you;
  const base = CARDS[key];
  if (!state.supply[key]) { setStatus("売り切れ"); return; }
  if (p.buys <= 0) { setStatus("購入権がありません"); return; }
  // auto-play treasures for convenience if not enough coin showing
  if (p.coin < base.cost) {
    p.hand.slice().forEach((c, idx) => {
      if (c.type === "treasure") {
        const real = p.hand.indexOf(c);
        if (real >= 0) {
          p.hand.splice(real, 1);
          p.play.push(c);
          p.coin += c.coin || 0;
        }
      }
    });
  }
  if (p.coin < base.cost) { setStatus("金が足りません"); render(); return; }
  p.coin -= base.cost;
  p.buys--;
  state.supply[key]--;
  p.discard.push(cloneCard(key));
  setStatus(base.name + " を購入");
  if (key === "province" && state.supply.province === 0) endGame();
  else render();
}

function cleanup(p) {
  p.discard.push(...p.hand, ...p.play);
  p.hand = [];
  p.play = [];
  p.actions = 1;
  p.buys = 1;
  p.coin = 0;
  draw(p, 5);
}

function endYouTurn() {
  // play remaining treasures silently into coin already tracked if they click end without playing
  const p = state.you;
  p.hand.filter((c) => c.type === "treasure").forEach((c) => {
    // leave in hand; cleanup will discard — coin only from played. Auto-add for fairness:
  });
  cleanup(p);
  if (checkEmpty()) { endGame(); return; }
  state.turn = "ai";
  render();
  setTimeout(aiTurn, 400);
}

function aiTurn() {
  const p = state.ai;
  p.actions = 1;
  p.buys = 1;
  p.coin = 0;
  // play actions then treasures
  let guard = 20;
  while (p.actions > 0 && guard--) {
    const idx = p.hand.findIndex((c) => c.type === "action");
    if (idx < 0) break;
    const c = p.hand.splice(idx, 1)[0];
    p.play.push(c);
    p.actions--;
    if (c.coin) p.coin += c.coin;
    if (c.draw) draw(p, c.draw);
    if (c.buy) p.buys += c.buy;
    if (c.action) p.actions += c.action;
  }
  p.hand.slice().forEach((c) => {
    if (c.type === "treasure") {
      const i = p.hand.indexOf(c);
      p.hand.splice(i, 1);
      p.play.push(c);
      p.coin += c.coin || 0;
    }
  });
  const wants = ["province", "gold", "duchy", "festival", "market", "silver", "smithy", "village", "estate"];
  for (const key of wants) {
    if (p.buys <= 0) break;
    const base = CARDS[key];
    if (state.supply[key] > 0 && p.coin >= base.cost) {
      p.coin -= base.cost;
      p.buys--;
      state.supply[key]--;
      p.discard.push(cloneCard(key));
    }
  }
  cleanup(p);
  if (checkEmpty()) { endGame(); return; }
  state.turn = "you";
  setStatus("あなたのターン。アクション→購入→ターン終了");
  render();
}

function checkEmpty() {
  if (state.supply.province <= 0) return true;
  const empty = MARKET_KEYS.filter((k) => state.supply[k] <= 0).length;
  return empty >= 3;
}

function endGame() {
  state.over = true;
  const y = vpOf(state.you);
  const a = vpOf(state.ai);
  const msg = y > a ? "勝利！" : y < a ? "AIの勝ち" : "引き分け";
  setStatus("終了 " + msg + " You " + y + "VP / AI " + a + "VP");
  render();
}

document.getElementById("btn-start").onclick = () => {
  state.supply = {
    copper: 40, silver: 30, gold: 20,
    estate: 12, duchy: 8, province: 6,
    market: 10, smithy: 10, village: 10, festival: 10, militia: 10
  };
  state.you = makePlayer();
  state.ai = makePlayer();
  draw(state.you, 5);
  draw(state.ai, 5);
  state.turn = "you";
  state.active = true;
  state.over = false;
  setStatus("手札のアクション／財宝をクリック。市場で購入。");
  render();
};

document.getElementById("btn-end").onclick = () => endYouTurn();
