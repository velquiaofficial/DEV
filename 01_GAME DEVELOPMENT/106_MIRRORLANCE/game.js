"use strict";
/** MIRRORLANCE — 専用ピンポン。スマッシュ蓄力とスピンが固有。共有なし。 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_mirrorlance_best_v2";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li><kbd>↑↓</kbd><span>パドル</span></li><li><kbd>Z</kbd><span>スマッシュ蓄力</span></li><li><kbd>X</kbd><span>スピン</span></li>";
  document.getElementById("rules").innerHTML =
    "<li>先に7点</li><li>蓄力で強打</li><li>スピンで軌道変化</li>";

  let you, ai, ball, scoreY, scoreA, phase, keys, raf, last, charge, spinT, particles, floats, audio;

  function sfx(f, d, t, v) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio = audio || new AC(); if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = t || "square"; o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.035, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (d || 0.1));
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + (d || 0.12));
    } catch (e) {}
  }

  function serve(toRight) {
    ball = { x: 320, y: 240, vx: (toRight ? 1 : -1) * 4.0, vy: (Math.random() * 2 - 1) * 2.8, r: 7, spin: 0 };
  }

  function start() {
    scoreY = 0; scoreA = 0; phase = "play"; keys = {}; charge = 0; spinT = 0;
    particles = []; floats = [];
    you = { x: 24, y: 200, w: 12, h: 86 }; ai = { x: 604, y: 200, w: 12, h: 86 };
    serve(true); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last);
    status("デュエル開始 — Z蓄力 / Xスピン"); sfx(420, 0.08, "triangle", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = scoreY + " - " + scoreA;
    document.getElementById("lives").textContent = "C" + Math.floor(charge);
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, scoreY);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function burst(x, y, c, n) {
    for (let i = 0; i < (n || 8); i++) {
      particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 300 + Math.random() * 300, r: 1.5 + Math.random() * 2, color: c });
    }
  }

  function bounce(p, isYou) {
    if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w && ball.y > p.y && ball.y < p.y + p.h) {
      const power = isYou && charge > 40 ? 1.35 + charge / 200 : 1.06;
      ball.vx = Math.abs(ball.vx) * power * (p.x < 320 ? 1 : -1);
      ball.vy += (ball.y - (p.y + p.h / 2)) * 0.09;
      if (isYou && spinT > 0) { ball.spin = (ball.y < p.y + p.h / 2 ? -1 : 1) * 0.12; spinT = 0; }
      if (isYou && charge > 40) { burst(ball.x, ball.y, "#4cc9f0", 14); floats.push({ x: ball.x, y: ball.y, text: "SMASH", color: "#4cc9f0", life: 700, vy: -0.05 }); sfx(700, 0.1, "sawtooth", 0.04); charge = 0; }
      else sfx(380, 0.05, "square", 0.025);
      ball.x = p.x < 320 ? p.x + p.w + ball.r : p.x - ball.r;
    }
  }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;
    if (keys.ArrowUp || keys.w || keys.W) you.y -= 6.2 * k;
    if (keys.ArrowDown || keys.s || keys.S) you.y += 6.2 * k;
    you.y = Math.max(10, Math.min(canvas.height - you.h - 10, you.y));
    if (keys.z || keys.Z) charge = Math.min(100, charge + 1.8 * k);
    else charge = Math.max(0, charge - 0.6 * k);
    if (spinT > 0) spinT -= k;

    const aiSpeed = 3.6 + Math.min(2, Math.abs(ball.vx) * 0.15);
    const target = ball.y - ai.h / 2 + Math.sin(performance.now() / 400) * 8;
    ai.y += Math.sign(target - ai.y) * Math.min(aiSpeed * k, Math.abs(target - ai.y));
    ai.y = Math.max(10, Math.min(canvas.height - ai.h - 10, ai.y));

    ball.vy += ball.spin * k;
    ball.spin *= 0.985;
    ball.x += ball.vx * k; ball.y += ball.vy * k;
    if (ball.y < ball.r || ball.y > canvas.height - ball.r) { ball.vy *= -1; sfx(220, 0.04, "triangle", 0.02); }
    bounce(you, true); bounce(ai, false);

    if (ball.x < 0) {
      scoreA++; serve(true); hud(); burst(40, ball.y, "#f72585", 12);
      if (scoreA >= 7) { phase = "over"; status("AIの勝ち"); sfx(120, 0.2, "sawtooth", 0.04); }
      else status("失点");
    }
    if (ball.x > canvas.width) {
      scoreY++; serve(false); hud(); burst(600, ball.y, "#4cc9f0", 12);
      if (scoreY >= 7) { phase = "clear"; status("あなたの勝ち！"); sfx(660, 0.16, "triangle", 0.04); }
      else status("得点！");
    }

    particles = particles.filter(function (p) { p.life -= dt; p.x += p.vx * k; p.y += p.vy * k; return p.life > 0; });
    floats = floats.filter(function (f) { f.life -= dt; f.y += f.vy * dt; return f.life > 0; });
    hud();
  }

  function draw() {
    ctx.fillStyle = "#0d1117"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.setLineDash([8, 10]);
    ctx.beginPath(); ctx.moveTo(320, 0); ctx.lineTo(320, 480); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = "#4cc9f0"; ctx.fillRect(you.x, you.y, you.w, you.h);
    if (charge > 10) {
      ctx.fillStyle = "rgba(76,201,240," + (charge / 200) + ")";
      ctx.fillRect(you.x - 4, you.y, 4, you.h * (charge / 100));
    }
    ctx.fillStyle = "#f72585"; ctx.fillRect(ai.x, ai.y, ai.w, ai.h);
    ctx.fillStyle = spinT > 0 ? "#ffe066" : "#fff";
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2); ctx.fill();
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 500); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    floats.forEach(function (f) {
      ctx.globalAlpha = Math.max(0, f.life / 700); ctx.fillStyle = f.color;
      ctx.font = "700 14px Outfit"; ctx.textAlign = "center"; ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff"; ctx.font = "800 36px Outfit"; ctx.textAlign = "center";
    ctx.fillText(scoreY + "  " + scoreA, 320, 50);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.42)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit";
      ctx.fillText(phase === "clear" ? "YOU WIN" : phase === "over" ? "YOU LOSE" : phase === "pause" ? "PAUSE" : "MIRRORLANCE", 320, 240);
    }
  }

  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  window.addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if ((e.key === "x" || e.key === "X") && phase === "play") { spinT = 90; status("スピン構え"); sfx(500, 0.07, "sine", 0.03); }
  });
  window.addEventListener("keyup", function (e) { keys[e.key] = false; });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; you = { x: 24, y: 200, w: 12, h: 86 }; ai = { x: 604, y: 200, w: 12, h: 86 };
  ball = { x: 320, y: 240, r: 7, vx: 0, vy: 0, spin: 0 }; charge = 0; particles = []; floats = []; draw();
})();
