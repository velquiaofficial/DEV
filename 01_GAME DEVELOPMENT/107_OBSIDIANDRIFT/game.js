"use strict";
/** OBSIDIANDRIFT — 専用アステロイド。シールドと鉱石採取が固有。共有なし。 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640; canvas.height = 480;
  const KEY = "vq_obsidiandrift_best_v2";
  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li><kbd>←→</kbd><span>旋回</span></li><li><kbd>↑</kbd><span>加速</span></li><li><kbd>Space</kbd><span>射撃</span></li><li><kbd>Z</kbd><span>シールド</span></li><li><kbd>X</kbd><span>鉱石吸引</span></li>";
  document.getElementById("rules").innerHTML =
    "<li>岩破壊で分裂</li><li>鉱石でスコア</li><li>シールドで衝突耐性</li>";

  let ship, rocks, shots, ores, score, lives, phase, keys, raf, last, cool, shield, tractor, wave, particles, audio;

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

  function mkRock(x, y, r, oreChance) {
    return { x: x, y: y, r: r, vx: (Math.random() - 0.5) * 2.4, vy: (Math.random() - 0.5) * 2.4, ore: Math.random() < (oreChance || 0.35) };
  }

  function spawnWave() {
    rocks = [];
    const n = 3 + wave;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      rocks.push(mkRock(320 + Math.cos(a) * 200, 240 + Math.sin(a) * 160, 28 + Math.random() * 12, 0.4));
    }
  }

  function start() {
    score = 0; lives = 3; wave = 1; shield = 0; tractor = 0; phase = "play"; keys = {}; cool = 0;
    ship = { x: 320, y: 240, a: -Math.PI / 2, vx: 0, vy: 0 }; shots = []; ores = []; particles = [];
    spawnWave(); hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last);
    status("Wave " + wave + " — 岩場掃討"); sfx(300, 0.08, "triangle", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives + (shield > 0 ? " S" : "");
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b)); document.getElementById("best").textContent = b;
  }
  function status(t) { document.getElementById("status").textContent = t; }
  function wrap(o) {
    if (o.x < -40) o.x = canvas.width + 40; if (o.x > canvas.width + 40) o.x = -40;
    if (o.y < -40) o.y = canvas.height + 40; if (o.y > canvas.height + 40) o.y = -40;
  }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16; cool = Math.max(0, cool - dt);
    if (shield > 0) shield -= k;
    if (tractor > 0) tractor -= k;

    if (keys.ArrowLeft) ship.a -= 0.085 * k;
    if (keys.ArrowRight) ship.a += 0.085 * k;
    if (keys.ArrowUp) {
      ship.vx += Math.cos(ship.a) * 0.2 * k;
      ship.vy += Math.sin(ship.a) * 0.2 * k;
    }
    ship.vx *= 0.992; ship.vy *= 0.992;
    ship.x += ship.vx * k; ship.y += ship.vy * k; wrap(ship);

    if (keys[" "] && cool <= 0) {
      shots.push({ x: ship.x, y: ship.y, vx: Math.cos(ship.a) * 7.2 + ship.vx, vy: Math.sin(ship.a) * 7.2 + ship.vy, life: 900 });
      cool = 160; sfx(520, 0.05, "square", 0.02);
    }

    shots.forEach(function (s) { s.x += s.vx * k; s.y += s.vy * k; s.life -= dt; wrap(s); });
    shots = shots.filter(function (s) { return s.life > 0; });
    rocks.forEach(function (r) { r.x += r.vx * k; r.y += r.vy * k; wrap(r); });

    const next = [];
    rocks.forEach(function (r) {
      let hit = false;
      shots.forEach(function (s) {
        if ((s.x - r.x) * (s.x - r.x) + (s.y - r.y) * (s.y - r.y) < r.r * r.r) { s.life = 0; hit = true; }
      });
      if (hit) {
        score += Math.round(50 - r.r); hud();
        sfx(280 + r.r * 2, 0.07, "sawtooth", 0.03);
        for (let i = 0; i < 8; i++) particles.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3, life: 400, r: 1.5, color: "#ced4da" });
        if (r.ore) ores.push({ x: r.x, y: r.y, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), life: 4000 });
        if (r.r > 16) { next.push(mkRock(r.x, r.y, r.r * 0.55, 0.25)); next.push(mkRock(r.x, r.y, r.r * 0.55, 0.25)); }
      } else next.push(r);

      if ((ship.x - r.x) * (ship.x - r.x) + (ship.y - r.y) * (ship.y - r.y) < (r.r + 10) * (r.r + 10)) {
        if (shield > 0) { shield = 0; r.vx += (r.x - ship.x) * 0.05; r.vy += (r.y - ship.y) * 0.05; status("シールド破砕"); sfx(200, 0.1, "triangle", 0.03); }
        else {
          lives--; ship.x = 320; ship.y = 240; ship.vx = ship.vy = 0; hud();
          if (lives <= 0) { phase = "over"; status("ゲームオーバー"); }
          else status("衝突…");
        }
      }
    });
    rocks = next;

    ores.forEach(function (o) {
      if (tractor > 0) {
        o.vx += (ship.x - o.x) * 0.002 * k;
        o.vy += (ship.y - o.y) * 0.002 * k;
      }
      o.x += o.vx * k; o.y += o.vy * k; o.life -= dt; wrap(o);
      if ((o.x - ship.x) * (o.x - ship.x) + (o.y - ship.y) * (o.y - ship.y) < 20 * 20) {
        o.life = 0; score += 30; hud(); sfx(740, 0.08, "sine", 0.03); status("鉱石回収");
      }
    });
    ores = ores.filter(function (o) { return o.life > 0; });
    particles = particles.filter(function (p) { p.life -= dt; p.x += p.vx * k; p.y += p.vy * k; return p.life > 0; });

    if (!rocks.length) {
      wave++; score += 200 + wave * 40; spawnWave(); status("Wave " + wave); sfx(600, 0.12, "triangle", 0.035); hud();
    }
  }

  function draw() {
    ctx.fillStyle = "#050505"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = "rgba(255,255,255," + (0.1 + (i % 5) * 0.05) + ")";
      ctx.fillRect((i * 89) % 640, (i * 57) % 480, 1.5, 1.5);
    }
    ctx.strokeStyle = "#ced4da"; ctx.lineWidth = 2;
    rocks.forEach(function (r) {
      ctx.beginPath();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2, rad = r.r * (0.72 + (i % 3) * 0.12);
        const x = r.x + Math.cos(a) * rad, y = r.y + Math.sin(a) * rad;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
      if (r.ore) { ctx.fillStyle = "#ffd43b"; ctx.beginPath(); ctx.arc(r.x, r.y, 3, 0, Math.PI * 2); ctx.fill(); }
    });
    ores.forEach(function (o) {
      ctx.fillStyle = "#ffd43b"; ctx.beginPath(); ctx.arc(o.x, o.y, 4, 0, Math.PI * 2); ctx.fill();
    });
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 400); ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.r, p.r);
    });
    ctx.globalAlpha = 1;
    ctx.save(); ctx.translate(ship.x, ship.y); ctx.rotate(ship.a);
    if (shield > 0) { ctx.strokeStyle = "rgba(116,192,252,.6)"; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = "#69db7c"; ctx.beginPath();
    ctx.moveTo(14, 0); ctx.lineTo(-10, 9); ctx.lineTo(-6, 0); ctx.lineTo(-10, -9); ctx.closePath(); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = "#fff"; shots.forEach(function (s) { ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3); });
    ctx.fillStyle = "rgba(255,255,255,.5)"; ctx.font = "600 12px IBM Plex Sans JP"; ctx.textAlign = "left";
    ctx.fillText("W" + wave + (tractor > 0 ? "  TRACTOR" : ""), 12, canvas.height - 12);
    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.42)"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit"; ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : phase === "pause" ? "PAUSE" : "OBSIDIANDRIFT", 320, 240);
    }
  }

  function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
  window.addEventListener("keydown", function (e) {
    keys[e.key] = true; if (e.code === "Space") e.preventDefault();
    if ((e.key === "z" || e.key === "Z") && phase === "play" && shield <= 0) { shield = 150; status("シールド展開"); sfx(320, 0.12, "sine", 0.035); hud(); }
    if ((e.key === "x" || e.key === "X") && phase === "play") { tractor = 120; status("鉱石吸引"); sfx(400, 0.1, "triangle", 0.03); }
  });
  window.addEventListener("keyup", function (e) { keys[e.key] = false; });
  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };
  phase = "ready"; wave = 1; ship = { x: 320, y: 240, a: -Math.PI / 2, vx: 0, vy: 0 };
  rocks = [mkRock(120, 120, 30)]; shots = []; ores = []; particles = []; draw();
})();
