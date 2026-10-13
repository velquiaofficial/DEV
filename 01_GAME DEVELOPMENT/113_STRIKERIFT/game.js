"use strict";
/** STRIKERIFT — 専用モグラ叩き。コンボとフィーバーが固有。共有なし。 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_strikerift_best_v2";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML = "<li>クリックで叩く</li><li><kbd>Z</kbd>バースト（フィーバー中）</li>";
  document.getElementById("rules").innerHTML = "<li>30秒</li><li>金高得点・爆弾減点</li><li>連続でフィーバー</li>";

  let holes, active, score, phase, time, raf, last, spawnAcc, combo, fever, particles, audio;

  function sfx(f, d, t, v) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio = audio || new AC(); if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = t || "square"; o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.03, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (d || 0.1));
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + (d || 0.12));
    } catch (e) {}
  }

  function layout() {
    holes = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
      holes.push({ x: 120 + c * 160, y: 110 + r * 120, r: 42, kind: null, life: 0 });
    }
  }

  function start() {
    score = 0; time = 30; phase = "play"; spawnAcc = 0; active = 0; combo = 0; fever = 0; particles = [];
    layout(); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last);
    status("たたけ！"); sfx(400, 0.08, "triangle", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = Math.ceil(time) + "s" + (fever > 0 ? " FVR" : "");
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function burstAll() {
    if (fever <= 0 || phase !== "play") return;
    holes.forEach(function (h) {
      if (!h.kind || h.kind === "bomb") return;
      score += (h.kind === "gold" ? 40 : 12) + combo;
      particles.push({ x: h.x, y: h.y, life: 400, color: "#fcc419" });
      h.kind = null; active = Math.max(0, active - 1);
    });
    fever = 0; combo += 2; status("バースト！"); sfx(800, 0.14, "sawtooth", 0.04); hud();
  }

  function update(dt) {
    if (phase !== "play") return;
    time -= dt / 1000; spawnAcc += dt;
    if (fever > 0) fever -= dt;
    hud();
    if (time <= 0) { phase = "over"; status("タイムアップ"); sfx(140, 0.2, "sawtooth", 0.035); return; }
    holes.forEach(function (h) {
      if (h.kind) { h.life -= dt; if (h.life <= 0) { h.kind = null; active--; combo = Math.max(0, combo - 1); } }
    });
    const pace = fever > 0 ? 320 : Math.max(320, 520 - score);
    if (spawnAcc > pace && active < (fever > 0 ? 5 : 3)) {
      spawnAcc = 0;
      const free = holes.filter(function (h) { return !h.kind; });
      if (free.length) {
        const h = free[Math.floor(Math.random() * free.length)];
        const roll = Math.random();
        h.kind = roll < 0.12 ? "bomb" : roll < 0.32 ? "gold" : "normal";
        h.life = (fever > 0 ? 700 : 900) + Math.random() * 500;
        active++;
      }
    }
    particles = particles.filter(function (p) { p.life -= dt; return p.life > 0; });
  }

  function draw() {
    ctx.fillStyle = fever > 0 ? "#4a2810" : "#3d2914";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    holes.forEach(function (h) {
      ctx.fillStyle = "#1c1008";
      ctx.beginPath(); ctx.ellipse(h.x, h.y + 18, h.r, h.r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      if (h.kind) {
        ctx.fillStyle = h.kind === "gold" ? "#fcc419" : h.kind === "bomb" ? "#212529" : "#e8590c";
        ctx.beginPath(); ctx.arc(h.x, h.y, h.r * 0.7, 0, Math.PI * 2); ctx.fill();
        if (h.kind === "bomb") { ctx.fillStyle = "#fa5252"; ctx.fillRect(h.x - 2, h.y - h.r * 0.9, 4, 10); }
      }
    });
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 400); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    if (combo > 1) {
      ctx.fillStyle = "#ffe066"; ctx.font = "800 20px Outfit"; ctx.textAlign = "left";
      ctx.fillText("COMBO " + combo, 20, 40);
    }
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "TIME UP" : phase === "pause" ? "PAUSE" : "STRIKERIFT", 320, 240);
    }
  }

  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }

  canvas.addEventListener("click", function (e) {
    if (phase !== "play") return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    let hit = false;
    holes.forEach(function (h) {
      if (!h.kind) return;
      if ((x - h.x) * (x - h.x) + (y - h.y) * (y - h.y) < (h.r * 0.8) * (h.r * 0.8)) {
        hit = true;
        if (h.kind === "bomb") {
          score = Math.max(0, score - 30); combo = 0; fever = 0; status("爆弾…"); sfx(100, 0.15, "sawtooth", 0.04);
        } else {
          combo += 1;
          score += (h.kind === "gold" ? 50 : 15) + combo * 2;
          if (combo >= 5 && fever <= 0) { fever = 4000; status("フィーバー！ Zでバースト"); sfx(900, 0.12, "sine", 0.04); }
          else { status(h.kind === "gold" ? "GOLD!" : "HIT x" + combo); sfx(500 + combo * 30, 0.06, "square", 0.025); }
          particles.push({ x: h.x, y: h.y, life: 350, color: h.kind === "gold" ? "#fcc419" : "#ff922b" });
        }
        h.kind = null; active--; hud();
      }
    });
    if (!hit) combo = Math.max(0, combo - 1);
  });

  window.addEventListener("keydown", function (e) {
    if (e.key === "z" || e.key === "Z") burstAll();
  });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; layout(); particles = []; draw();
})();
