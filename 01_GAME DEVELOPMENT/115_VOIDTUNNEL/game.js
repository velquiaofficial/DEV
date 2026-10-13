"use strict";
/** VOIDTUNNEL — 専用3レーンラン。ブーストとコインが固有。共有なし。 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_voidtunnel_best_v2";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li><kbd>←→</kbd> / <kbd>A D</kbd>レーン</li><li><kbd>Z</kbd>ブースト</li>";
  document.getElementById("rules").innerHTML =
    "<li>障害回避</li><li>コインでブースト回復</li><li>距離＋コインがスコア</li>";

  let lane, obstacles, coins, score, dist, phase, raf, last, spawnAcc, speed, boost, particles, audio;

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

  function laneX(l) { return 160 + l * 160; }

  function start() {
    lane = 1; obstacles = []; coins = []; score = 0; dist = 0; phase = "play";
    spawnAcc = 0; speed = 4; boost = 50; particles = [];
    hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last);
    status("走れ — Zブースト"); sfx(400, 0.08, "triangle", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = Math.floor(dist) + "m B" + Math.floor(boost);
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;
    const boosting = (keysZ) && boost > 0;
    const spd = speed * (boosting ? 1.55 : 1);
    if (boosting) {
      boost -= 0.45 * k;
      particles.push({ x: laneX(lane) + (Math.random() - 0.5) * 20, y: 400, vx: 0, vy: 2, life: 250, color: "#74c0fc" });
    } else boost = Math.min(100, boost + 0.06 * k);

    dist += spd * k * 0.4;
    score = Math.floor(dist) + coinScore;
    speed = 4 + dist / 220;
    spawnAcc += dt;
    hud();

    if (spawnAcc > Math.max(340, 880 - dist)) {
      spawnAcc = 0;
      const l = Math.floor(Math.random() * 3);
      if (Math.random() < 0.65) obstacles.push({ lane: l, y: -40, h: 36, w: 50 });
      else coins.push({ lane: l, y: -30, r: 10, taken: false });
    }

    obstacles.forEach(function (o) { o.y += spd * k; });
    coins.forEach(function (c) { c.y += spd * k; });
    obstacles = obstacles.filter(function (o) { return o.y < 520; });
    coins = coins.filter(function (c) { return c.y < 520 && !c.taken; });

    const py = 380;
    obstacles.forEach(function (o) {
      if (o.lane === lane && o.y + o.h > py && o.y < py + 34) {
        phase = "over"; status("クラッシュ " + Math.floor(dist) + "m"); sfx(120, 0.2, "sawtooth", 0.04);
      }
    });
    coins.forEach(function (c) {
      if (!c.taken && c.lane === lane && c.y > py - 10 && c.y < py + 34) {
        c.taken = true; coinScore += 15; boost = Math.min(100, boost + 12);
        status("コイン +" + 15); sfx(720, 0.07, "sine", 0.03);
      }
    });
    particles = particles.filter(function (p) { p.life -= dt; p.y += p.vy * k; return p.life > 0; });
  }

  let coinScore = 0;
  let keysZ = false;

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#212529"); g.addColorStop(1, "#495057");
    ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = i === lane ? "rgba(255,212,59,.12)" : "rgba(255,255,255,.04)";
      ctx.fillRect(laneX(i) - 50, 0, 100, canvas.height);
      ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.strokeRect(laneX(i) - 50, 0, 100, canvas.height);
    }
    obstacles.forEach(function (o) {
      ctx.fillStyle = "#ff6b6b";
      ctx.fillRect(laneX(o.lane) - o.w / 2, o.y, o.w, o.h);
    });
    coins.forEach(function (c) {
      if (c.taken) return;
      ctx.fillStyle = "#ffe066";
      ctx.beginPath(); ctx.arc(laneX(c.lane), c.y, c.r, 0, Math.PI * 2); ctx.fill();
    });
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 250); ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 3, 8);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = keysZ && boost > 0 ? "#74c0fc" : "#4dabf7";
    ctx.fillRect(laneX(lane) - 18, 380, 36, 34);
    ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(20, canvas.height - 18, 100, 6);
    ctx.fillStyle = "#74c0fc"; ctx.fillRect(20, canvas.height - 18, 100 * (boost / 100), 6);
    ctx.fillStyle = "#fff"; ctx.font = "800 22px Outfit"; ctx.textAlign = "left";
    ctx.fillText(Math.floor(dist) + " m", 20, 36);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "CRASH" : phase === "pause" ? "PAUSE" : "VOIDTUNNEL", 320, 240);
    }
  }

  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }

  window.addEventListener("keydown", function (e) {
    if (phase !== "play") return;
    if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") lane = Math.max(0, lane - 1);
    if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") lane = Math.min(2, lane + 1);
    if (e.key === "z" || e.key === "Z") keysZ = true;
  });
  window.addEventListener("keyup", function (e) {
    if (e.key === "z" || e.key === "Z") keysZ = false;
  });
  document.getElementById("btn-start").onclick = function () { coinScore = 0; start(); };
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; lane = 1; obstacles = []; coins = []; particles = []; boost = 50; draw();
})();
