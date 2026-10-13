"use strict";
/** ZEPHYRCREST — 専用フラップ。滑空ゲージと風帯が固有。共有なし。 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_zephyrcrest_best_v2";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li><kbd>Space</kbd><span>羽ばたき</span></li><li><kbd>Z</kbd><span>滑空</span></li><li>クリック可</li>";
  document.getElementById("rules").innerHTML =
    "<li>柱回避で得点</li><li>滑空で落下緩和</li><li>青い風帯で上昇</li>";

  let bird, pipes, winds, score, phase, raf, last, grav, glide, particles, audio;

  function sfx(f, d, t, v) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      audio = audio || new AC(); if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = t || "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.03, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (d || 0.1));
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + (d || 0.12));
    } catch (e) {}
  }

  function spawnPipe(x) {
    const gap = Math.max(110, 140 - score * 1.2), top = 50 + Math.random() * 200;
    pipes.push({ x: x, w: 52, top: top, gap: gap, passed: false });
    if (Math.random() < 0.45) {
      winds.push({ x: x + 70, y: top + 20, w: 36, h: gap - 40, vy: -0.6 });
    }
  }

  function start() {
    score = 0; phase = "play"; grav = 0.34; glide = 70;
    bird = { x: 140, y: 200, vy: 0, r: 12, gliding: false };
    pipes = []; winds = []; particles = [];
    for (let i = 0; i < 3; i++) spawnPipe(420 + i * 210);
    hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last);
    status("羽ばたき＋Z滑空"); sfx(400, 0.08, "triangle", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = "G" + Math.floor(glide);
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }

  function flap() {
    if (phase !== "play") return;
    bird.vy = -6.4; bird.gliding = false;
    glide = Math.min(100, glide + 6);
    sfx(480, 0.06, "square", 0.025);
    for (let i = 0; i < 5; i++) particles.push({ x: bird.x - 8, y: bird.y, vx: -1 - Math.random(), vy: (Math.random() - 0.5) * 2, life: 250, r: 2, color: "#fff" });
  }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;
    const g = bird.gliding && glide > 0 ? grav * 0.28 : grav;
    if (bird.gliding && glide > 0) { glide -= 0.35 * k; bird.vy = Math.min(bird.vy, 2.2); }
    else glide = Math.min(100, glide + 0.08 * k);

    bird.vy += g * k; bird.y += bird.vy * k;
    const spd = 2.5 + Math.min(1.8, score * 0.04);
    pipes.forEach(function (p) { p.x -= spd * k; });
    winds.forEach(function (w) { w.x -= spd * k; });
    if (pipes[0] && pipes[0].x < -60) { pipes.shift(); spawnPipe(pipes[pipes.length - 1].x + 210); }
    winds = winds.filter(function (w) { return w.x > -50; });

    winds.forEach(function (w) {
      if (bird.x > w.x && bird.x < w.x + w.w && bird.y > w.y && bird.y < w.y + w.h) {
        bird.vy += w.vy * k; glide = Math.min(100, glide + 0.2 * k);
      }
    });

    pipes.forEach(function (p) {
      if (!p.passed && p.x + p.w < bird.x) {
        p.passed = true; score++; glide = Math.min(100, glide + 8); hud();
        sfx(560 + score * 10, 0.07, "triangle", 0.03); status("通過 +" + score);
      }
      const inX = bird.x + bird.r > p.x && bird.x - bird.r < p.x + p.w;
      const hitY = bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap;
      if (inX && hitY) { phase = "over"; status("クラッシュ"); sfx(140, 0.18, "sawtooth", 0.04); }
    });
    if (bird.y > canvas.height - 40 || bird.y < 0) { phase = "over"; status("ゲームオーバー"); sfx(140, 0.18, "sawtooth", 0.04); }

    particles = particles.filter(function (p) { p.life -= dt; p.x += p.vx * k; p.y += p.vy * k; return p.life > 0; });
    hud();
  }

  function draw() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#4dabf7"); sky.addColorStop(1, "#a5d8ff");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
    winds.forEach(function (w) {
      ctx.fillStyle = "rgba(116,192,252,.22)";
      ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.strokeStyle = "rgba(255,255,255,.25)";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(w.x + 8 + i * 10, w.y + w.h - 8);
        ctx.lineTo(w.x + 8 + i * 10, w.y + 8);
        ctx.stroke();
      }
    });
    ctx.fillStyle = "#2f9e44"; ctx.fillRect(0, canvas.height - 36, canvas.width, 36);
    pipes.forEach(function (p) {
      ctx.fillStyle = "#37b24d";
      ctx.fillRect(p.x, 0, p.w, p.top);
      ctx.fillRect(p.x, p.top + p.gap, p.w, canvas.height);
      ctx.fillStyle = "#2b8a3e";
      ctx.fillRect(p.x - 4, p.top - 16, p.w + 8, 16);
      ctx.fillRect(p.x - 4, p.top + p.gap, p.w + 8, 16);
    });
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 250); ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = bird.gliding ? "#fcc419" : "#f08c00";
    ctx.beginPath(); ctx.arc(bird.x, bird.y, bird.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(bird.x + 4, bird.y - 3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,.15)"; ctx.fillRect(12, canvas.height - 18, 100, 6);
    ctx.fillStyle = "#74c0fc"; ctx.fillRect(12, canvas.height - 18, 100 * (glide / 100), 6);
    ctx.fillStyle = "#111"; ctx.font = "800 36px Outfit"; ctx.textAlign = "center"; ctx.fillText(String(score), 320, 70);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.35)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit";
      ctx.fillText(phase === "over" ? "GAME OVER" : phase === "pause" ? "PAUSE" : "ZEPHYRCREST", 320, 240);
    }
  }

  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }

  let holdZ = false;
  window.addEventListener("keydown", function (e) {
    if (e.code === "Space") { e.preventDefault(); flap(); }
    if (e.key === "z" || e.key === "Z") { holdZ = true; bird.gliding = true; }
  });
  window.addEventListener("keyup", function (e) {
    if (e.key === "z" || e.key === "Z") { holdZ = false; bird.gliding = false; }
  });
  canvas.addEventListener("pointerdown", flap);
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; bird = { x: 140, y: 200, vy: 0, r: 12, gliding: false }; pipes = []; winds = []; particles = []; glide = 70; draw();
})();
