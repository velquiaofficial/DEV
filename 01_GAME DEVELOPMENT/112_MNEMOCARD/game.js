"use strict";
/** MNEMOCARD — 専用神経衰弱。ピークとストリークが固有。共有なし。 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const COLS = 4, ROWS = 3, W = 120, H = 120, GAP = 12;
  canvas.width = COLS * (W + GAP) + GAP; canvas.height = ROWS * (H + GAP) + GAP;
  const KEY = "vq_mnemocard_best_v2";
  const ICONS = ["▲", "●", "■", "◆", "★", "✿"];
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li>クリックでめくる</li><li><kbd>P</kbd>ピーク（1回）</li>";
  document.getElementById("rules").innerHTML = "<li>同じ絵柄を2枚</li><li>連続正解で倍率</li><li>ピークで全体ちら見せ</li>";

  let cards, open, locked, moves, matched, phase, score, streak, peeks, peeking, audio;

  function sfx(f, d, t, v) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio = audio || new AC(); if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = t || "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.03, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (d || 0.1));
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + (d || 0.12));
    } catch (e) {}
  }

  function start() {
    const vals = ICONS.concat(ICONS).sort(function () { return Math.random() - 0.5; });
    cards = vals.map(function (v, i) { return { v: v, open: false, done: false, i: i }; });
    open = []; locked = false; moves = 0; matched = 0; score = 0; streak = 0; peeks = 1; peeking = false;
    phase = "play"; hud(); status("ペアを探せ — Pでピーク"); draw(); sfx(400, 0.08, "sine", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = moves + " / pk" + peeks;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function doPeek() {
    if (phase !== "play" || peeks <= 0 || peeking) return;
    peeks -= 1; peeking = true;
    cards.forEach(function (c) { if (!c.done) c.open = true; });
    draw(); status("ピーク！"); sfx(520, 0.1, "triangle", 0.03); hud();
    setTimeout(function () {
      cards.forEach(function (c) { if (!c.done) c.open = false; });
      open = []; peeking = false; draw();
    }, 900);
  }

  function draw() {
    ctx.fillStyle = "#1a1030"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    cards.forEach(function (c, i) {
      const x = GAP + (i % COLS) * (W + GAP), y = GAP + Math.floor(i / COLS) * (H + GAP);
      ctx.fillStyle = c.done ? "#2b8a3e" : c.open ? "#fff3bf" : "#5c4d7a";
      ctx.beginPath();
      const r = 14;
      ctx.moveTo(x + r, y); ctx.arcTo(x + W, y, x + W, y + H, r); ctx.arcTo(x + W, y + H, x, y + H, r);
      ctx.arcTo(x, y + H, x, y, r); ctx.arcTo(x, y, x + W, y, r); ctx.closePath(); ctx.fill();
      if (c.open || c.done) {
        ctx.fillStyle = "#212529"; ctx.font = "800 42px Outfit"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(c.v, x + W / 2, y + H / 2);
      }
    });
    if (streak > 1) {
      ctx.fillStyle = "#ffe066"; ctx.font = "700 14px Outfit"; ctx.textAlign = "left";
      ctx.fillText("STREAK x" + streak, 12, canvas.height - 10);
    }
    if (phase === "clear" || phase === "pause") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "clear" ? "CLEAR" : "PAUSE", canvas.width / 2, canvas.height / 2);
    }
  }

  canvas.addEventListener("click", function (e) {
    if (phase !== "play" || locked || peeking) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvas.width / rect.width);
    const py = (e.clientY - rect.top) * (canvas.height / rect.height);
    const col = Math.floor((px - GAP) / (W + GAP)), row = Math.floor((py - GAP) / (H + GAP));
    if (col < 0 || row < 0 || col >= COLS || row >= ROWS) return;
    const i = row * COLS + col, c = cards[i];
    if (c.open || c.done) return;
    c.open = true; open.push(c); sfx(360, 0.05, "square", 0.02); draw();
    if (open.length === 2) {
      moves++; locked = true;
      const a = open[0], b = open[1];
      if (a.v === b.v) {
        a.done = b.done = true; matched++; streak += 1;
        score += Math.max(20, 120 - moves * 3) * streak;
        open = []; locked = false;
        sfx(600 + streak * 40, 0.1, "triangle", 0.035);
        if (matched === ICONS.length) { phase = "clear"; score += 200 + streak * 20; status("全部そろった！"); sfx(740, 0.16, "sine", 0.04); }
        else status("ペア！ x" + streak);
        hud(); draw();
      } else {
        streak = 0; status("ちがう…"); sfx(160, 0.08, "sawtooth", 0.025);
        setTimeout(function () { a.open = b.open = false; open = []; locked = false; hud(); draw(); }, 650);
      }
      hud();
    }
  });

  window.addEventListener("keydown", function (e) {
    if (e.key === "p" || e.key === "P") doPeek();
  });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; status("再開"); draw(); }
  };
  phase = "ready"; cards = []; draw();
})();
