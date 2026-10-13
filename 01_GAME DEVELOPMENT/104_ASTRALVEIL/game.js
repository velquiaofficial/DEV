"use strict";
/**
 * ASTRALVEIL — このタイトル専用インベーダー系。
 * 星群フォーメーションとノヴァ弾が固有。共有なし。
 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640;
  canvas.height = 480;
  const KEY = "vq_astralveil_best_v2";

  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li><kbd>←→</kbd><span>移動</span></li>" +
    "<li><kbd>Space</kbd><span>射撃</span></li>" +
    "<li><kbd>Z</kbd><span>ノヴァ弾</span></li>" +
    "<li><kbd>X</kbd><span>バリア</span></li>";
  document.getElementById("rules").innerHTML =
    "<li>星群を全滅でウェーブクリア</li>" +
    "<li>ノヴァは星塵ゲージ消費</li>" +
    "<li>被弾・接地で残機減</li>";

  let ship, aliens, bullets, abullets, stars, particles, floats;
  let score, lives, phase, keys, raf, last, dir, tick, cool, wave, stardust, barrier, audio;

  function sfx(f, d, t, v) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio = audio || new AC();
      if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime;
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = t || "square";
      o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.035, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (d || 0.1));
      o.connect(g); g.connect(audio.destination);
      o.start(t0); o.stop(t0 + (d || 0.12));
    } catch (e) {}
  }

  function spawnStars() {
    stars = [];
    for (let i = 0; i < 60; i++) {
      stars.push({ x: (i * 97) % 640, y: (i * 53) % 480, r: 1 + (i % 3) * 0.4, a: 0.15 + (i % 5) * 0.08 });
    }
  }

  function spawnAliens() {
    aliens = [];
    const rows = 3 + Math.min(2, wave);
    const cols = 7 + Math.min(2, wave);
    const kinds = ["scout", "guard", "nova"];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const kind = r === 0 && c % 4 === 0 ? "nova" : kinds[r % 3];
        aliens.push({
          x: 48 + c * (520 / cols),
          y: 36 + r * 34,
          w: 26, h: 18,
          alive: true,
          kind: kind,
          hp: kind === "guard" ? 2 : 1
        });
      }
    }
  }

  function start() {
    score = 0; lives = 3; wave = 1; stardust = 0; barrier = 0;
    phase = "play"; keys = {}; dir = 1; tick = 0; cool = 0;
    ship = { x: 300, y: 430, w: 36, h: 14 };
    bullets = []; abullets = []; particles = []; floats = [];
    spawnStars(); spawnAliens();
    hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last);
    status("Wave " + wave + " — 星群接近");
    sfx(440, 0.08, "triangle", 0.03);
  }

  function nextWave() {
    wave += 1;
    score += 300 + wave * 50;
    stardust = Math.min(100, stardust + 20);
    spawnAliens();
    bullets = []; abullets = [];
    phase = "play";
    status("Wave " + wave);
    sfx(660, 0.12, "sawtooth", 0.03);
    hud();
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives + " / D" + Math.floor(stardust);
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b));
    document.getElementById("best").textContent = b;
  }

  function status(t) { document.getElementById("status").textContent = t; }

  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 8); i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 280 + Math.random() * 320,
        r: 1 + Math.random() * 2,
        color: color
      });
    }
  }

  function fireNova() {
    if (stardust < 45 || phase !== "play") return;
    stardust -= 45;
    bullets.push({ x: ship.x + ship.w / 2, y: ship.y, vy: -6, nova: true, r: 7 });
    burst(ship.x + ship.w / 2, ship.y, "#74c0fc", 12);
    status("ノヴァ発射");
    sfx(900, 0.14, "sine", 0.04);
    hud();
  }

  function raiseBarrier() {
    if (stardust < 25 || phase !== "play") return;
    stardust -= 25;
    barrier = 160;
    status("バリア展開");
    sfx(320, 0.12, "triangle", 0.035);
    hud();
  }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;
    cool = Math.max(0, cool - dt);
    if (barrier > 0) barrier -= k;

    if (keys.ArrowLeft || keys.a) ship.x -= 5.2 * k;
    if (keys.ArrowRight || keys.d) ship.x += 5.2 * k;
    ship.x = Math.max(10, Math.min(canvas.width - ship.w - 10, ship.x));

    if ((keys[" "] || keys.Spacebar) && cool <= 0) {
      bullets.push({ x: ship.x + ship.w / 2, y: ship.y, vy: -8.2, nova: false, r: 3 });
      cool = 200;
      sfx(520, 0.05, "square", 0.02);
    }

    bullets.forEach(function (b) { b.y += b.vy * k; });
    bullets = bullets.filter(function (b) { return b.y > -20; });

    tick += dt;
    const pace = Math.max(280, 520 - wave * 35);
    if (tick > pace) {
      tick = 0;
      const alive = aliens.filter(function (a) { return a.alive; });
      let minX = 1e9, maxX = 0;
      alive.forEach(function (a) {
        minX = Math.min(minX, a.x);
        maxX = Math.max(maxX, a.x + a.w);
      });
      if (alive.length && (maxX > canvas.width - 16 || minX < 16)) {
        dir *= -1;
        alive.forEach(function (a) { a.y += 14; });
      }
      alive.forEach(function (a) { a.x += (10 + wave) * dir; });
      if (alive.length && Math.random() < 0.3 + wave * 0.04) {
        const a = alive[Math.floor(Math.random() * alive.length)];
        abullets.push({
          x: a.x + a.w / 2,
          y: a.y + a.h,
          vy: a.kind === "nova" ? 5.2 : 3.8,
          heavy: a.kind === "guard"
        });
      }
    }

    abullets.forEach(function (b) { b.y += b.vy * k; });
    abullets = abullets.filter(function (b) { return b.y < canvas.height + 10; });

    bullets.forEach(function (b) {
      aliens.forEach(function (a) {
        if (!a.alive) return;
        const pad = b.nova ? 6 : 0;
        if (b.x > a.x - pad && b.x < a.x + a.w + pad && b.y > a.y && b.y < a.y + a.h) {
          a.hp -= b.nova ? 2 : 1;
          if (!b.nova) b.y = -99;
          if (a.hp <= 0) {
            a.alive = false;
            const gain = a.kind === "nova" ? 50 : a.kind === "guard" ? 35 : 20;
            score += gain;
            stardust = Math.min(100, stardust + (a.kind === "nova" ? 12 : 4));
            floats.push({ x: a.x + a.w / 2, y: a.y, text: "+" + gain, color: "#ffe066", life: 700, vy: -0.05 });
            burst(a.x + a.w / 2, a.y + a.h / 2, "#74c0fc", 10);
            sfx(400 + gain * 4, 0.07, "square", 0.03);
          }
        }
      });
    });

    abullets.forEach(function (b) {
      if (b.x > ship.x && b.x < ship.x + ship.w && b.y > ship.y && b.y < ship.y + ship.h) {
        b.y = 999;
        if (barrier > 0) {
          barrier = 0;
          burst(ship.x + ship.w / 2, ship.y, "#69db7c", 10);
          status("バリア破砕");
          return;
        }
        lives -= 1;
        hud();
        sfx(140, 0.15, "sawtooth", 0.04);
        if (lives <= 0) { phase = "over"; status("ゲームオーバー"); }
        else status("被弾… 残機 " + lives);
      }
    });

    if (aliens.some(function (a) { return a.alive && a.y + a.h >= ship.y; })) {
      phase = "over";
      status("星群が地表へ…");
    }
    if (aliens.every(function (a) { return !a.alive; })) {
      phase = "clear";
      status("ウェーブ掃討");
      setTimeout(function () { if (phase === "clear") nextWave(); }, 650);
    }

    particles = particles.filter(function (p) {
      p.life -= dt; p.x += p.vx * k; p.y += p.vy * k; return p.life > 0;
    });
    floats = floats.filter(function (f) {
      f.life -= dt; f.y += f.vy * dt; return f.life > 0;
    });
    hud();
  }

  function drawAlien(a) {
    if (a.kind === "guard") ctx.fillStyle = "#adb5bd";
    else if (a.kind === "nova") ctx.fillStyle = "#da77f2";
    else ctx.fillStyle = "#74c0fc";
    ctx.fillRect(a.x, a.y, a.w, a.h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(a.x + 5, a.y + 5, 4, 4);
    ctx.fillRect(a.x + 16, a.y + 5, 4, 4);
    if (a.hp > 1) {
      ctx.strokeStyle = "rgba(255,255,255,.4)";
      ctx.strokeRect(a.x + 1, a.y + 1, a.w - 2, a.h - 2);
    }
  }

  function draw() {
    ctx.fillStyle = "#050816";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    stars.forEach(function (s) {
      ctx.fillStyle = "rgba(255,255,255," + s.a + ")";
      ctx.fillRect(s.x, s.y, s.r, s.r);
    });

    aliens.forEach(function (a) { if (a.alive) drawAlien(a); });

    if (barrier > 0) {
      ctx.strokeStyle = "rgba(105,219,124," + (0.35 + (barrier / 160) * 0.45) + ")";
      ctx.lineWidth = 2;
      ctx.strokeRect(ship.x - 6, ship.y - 6, ship.w + 12, ship.h + 12);
      ctx.lineWidth = 1;
    }
    ctx.fillStyle = "#69db7c";
    ctx.fillRect(ship.x, ship.y, ship.w, ship.h);
    ctx.fillStyle = "#e9ecef";
    ctx.fillRect(ship.x + 14, ship.y - 6, 8, 6);

    bullets.forEach(function (b) {
      ctx.fillStyle = b.nova ? "#74c0fc" : "#ffe066";
      if (b.nova) {
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      } else ctx.fillRect(b.x - 2, b.y, 4, 10);
    });
    ctx.fillStyle = "#ff8787";
    abullets.forEach(function (b) {
      ctx.fillRect(b.x - (b.heavy ? 3 : 2), b.y, b.heavy ? 6 : 4, 10);
    });

    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 500);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    floats.forEach(function (f) {
      ctx.globalAlpha = Math.max(0, f.life / 700);
      ctx.fillStyle = f.color;
      ctx.font = "700 13px Fraunces, Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(12, canvas.height - 16, 140, 6);
    ctx.fillStyle = "#74c0fc";
    ctx.fillRect(12, canvas.height - 16, 140 * (stardust / 100), 6);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "600 11px IBM Plex Sans JP, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("STARDUST " + Math.floor(stardust) + "  W" + wave, 12, canvas.height - 22);

    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.42)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "800 28px Outfit";
      ctx.textAlign = "center";
      const msg = phase === "over" ? "GAME OVER" : phase === "clear" ? "CLEAR" : phase === "pause" ? "PAUSE" : "ASTRALVEIL";
      ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
      ctx.font = "500 13px IBM Plex Sans JP";
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillText("ノヴァ Z / バリア X — 専用実装", canvas.width / 2, canvas.height / 2 + 28);
    }
  }

  function loop(t) {
    const dt = Math.min(32, t - last);
    last = t;
    update(dt);
    draw();
    if (phase === "play") raf = requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if (e.code === "Space") e.preventDefault();
    if (e.key === "z" || e.key === "Z") fireNova();
    if (e.key === "x" || e.key === "X") raiseBarrier();
  });
  window.addEventListener("keyup", function (e) { keys[e.key] = false; });

  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };

  phase = "ready"; wave = 1; stardust = 0; barrier = 0;
  ship = { x: 300, y: 430, w: 36, h: 14 };
  aliens = []; bullets = []; abullets = []; particles = []; floats = [];
  spawnStars(); spawnAliens(); draw();
})();
