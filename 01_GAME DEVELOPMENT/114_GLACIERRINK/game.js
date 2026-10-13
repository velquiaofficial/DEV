"use strict";
/** GLACIERRINK — 専用エアホッケー。チャージショットが固有。共有なし。 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_glacierrink_best_v2";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li>マウスでマレット</li><li>矢印でも可</li><li><kbd>Z</kbd>チャージショット</li>";
  document.getElementById("rules").innerHTML =
    "<li>先に5点</li><li>チャージで強打</li><li>右ゴールはAI</li>";

  let you, ai, puck, scoreY, scoreA, phase, keys, raf, last, pointer, charge, particles, audio;

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

  function resetPuck(dir) {
    puck = { x: 320, y: 240, vx: dir * 3.2, vy: (Math.random() - 0.5) * 2, r: 10 };
  }

  function start() {
    scoreY = 0; scoreA = 0; phase = "play"; keys = {}; pointer = null; charge = 0; particles = [];
    you = { x: 100, y: 240, r: 22 }; ai = { x: 540, y: 240, r: 22 };
    resetPuck(1); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last);
    status("フェイスオフ — Zチャージ"); sfx(360, 0.08, "triangle", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = scoreY + " - " + scoreA;
    document.getElementById("lives").textContent = "C" + Math.floor(charge);
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, scoreY);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function collide(m, powered) {
    const dx = puck.x - m.x, dy = puck.y - m.y, d = Math.hypot(dx, dy), min = puck.r + m.r;
    if (d < min && d > 0) {
      const nx = dx / d, ny = dy / d;
      puck.x = m.x + nx * min; puck.y = m.y + ny * min;
      const boost = powered ? 2.4 : 1.2;
      const dot = puck.vx * nx + puck.vy * ny;
      puck.vx = (puck.vx - 1.85 * dot * nx) + nx * boost;
      puck.vy = (puck.vy - 1.85 * dot * ny) + ny * boost;
      sfx(powered ? 700 : 320, 0.06, powered ? "sawtooth" : "square", 0.03);
      if (powered) {
        for (let i = 0; i < 10; i++) particles.push({ x: puck.x, y: puck.y, vx: nx * 3 + (Math.random() - 0.5), vy: ny * 3 + (Math.random() - 0.5), life: 300, color: "#4cc9f0" });
        charge = 0; status("チャージショット！");
      }
    }
  }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;
    if (pointer) { you.x += (pointer.x - you.x) * 0.35; you.y += (pointer.y - you.y) * 0.35; }
    if (keys.ArrowUp) you.y -= 6 * k; if (keys.ArrowDown) you.y += 6 * k;
    if (keys.ArrowLeft) you.x -= 6 * k; if (keys.ArrowRight) you.x += 6 * k;
    you.x = Math.max(40, Math.min(300, you.x)); you.y = Math.max(40, Math.min(440, you.y));
    if (keys.z || keys.Z) charge = Math.min(100, charge + 1.6 * k);
    else charge = Math.max(0, charge - 0.4 * k);

    ai.y += ((puck.y - ai.y) * 0.09) * k * 8;
    ai.x += ((520 - ai.x) * 0.05);
    ai.y = Math.max(40, Math.min(440, ai.y));

    puck.x += puck.vx * k; puck.y += puck.vy * k;
    puck.vx *= 0.996; puck.vy *= 0.996;
    if (puck.y < puck.r || puck.y > canvas.height - puck.r) puck.vy *= -1;

    if (puck.x < 0) {
      if (puck.y > 170 && puck.y < 310) {
        scoreA++; resetPuck(1); hud();
        if (scoreA >= 5) { phase = "over"; status("AIの勝ち"); sfx(120, 0.2, "sawtooth", 0.04); }
      } else puck.vx *= -1;
    }
    if (puck.x > canvas.width) {
      if (puck.y > 170 && puck.y < 310) {
        scoreY++; resetPuck(-1); hud();
        if (scoreY >= 5) { phase = "clear"; status("あなたの勝ち！"); sfx(660, 0.16, "triangle", 0.04); }
      } else puck.vx *= -1;
    }
    collide(you, charge > 50); collide(ai, false);
    particles = particles.filter(function (p) { p.life -= dt; p.x += p.vx * k; p.y += p.vy * k; return p.life > 0; });
    hud();
  }

  function draw() {
    ctx.fillStyle = "#0b3d4a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.lineWidth = 3; ctx.strokeRect(20, 20, 600, 440);
    ctx.beginPath(); ctx.moveTo(320, 20); ctx.lineTo(320, 460); ctx.stroke();
    ctx.beginPath(); ctx.arc(320, 240, 50, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.15)"; ctx.fillRect(0, 170, 20, 140); ctx.fillRect(620, 170, 20, 140);
    if (charge > 10) {
      ctx.strokeStyle = "rgba(76,201,240," + (charge / 120) + ")";
      ctx.beginPath(); ctx.arc(you.x, you.y, you.r + 6 + charge / 20, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.fillStyle = "#4cc9f0"; ctx.beginPath(); ctx.arc(you.x, you.y, you.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f72585"; ctx.beginPath(); ctx.arc(ai.x, ai.y, ai.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2); ctx.fill();
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 300); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff"; ctx.font = "800 32px Outfit"; ctx.textAlign = "center";
    ctx.fillText(scoreY + "  " + scoreA, 320, 56);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit";
      ctx.fillText(phase === "clear" ? "YOU WIN" : phase === "over" ? "YOU LOSE" : phase === "pause" ? "PAUSE" : "GLACIERRINK", 320, 240);
    }
  }

  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  canvas.addEventListener("pointermove", function (e) {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) };
  });
  window.addEventListener("keydown", function (e) { keys[e.key] = true; });
  window.addEventListener("keyup", function (e) { keys[e.key] = false; });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; you = { x: 100, y: 240, r: 22 }; ai = { x: 540, y: 240, r: 22 };
  puck = { x: 320, y: 240, r: 10, vx: 0, vy: 0 }; charge = 0; particles = []; draw();
})();
