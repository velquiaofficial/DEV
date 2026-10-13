"use strict";
/**
 * LOTUSCROSS — このタイトル専用フロッガー。
 * 露ドロップと睡蓮の開花レーンが固有。共有なし。
 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640;
  canvas.height = 480;
  const KEY = "vq_lotuscross_best_v2";

  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li><kbd>←↑→↓</kbd><span>ジャンプ</span></li>" +
    "<li><kbd>Z</kbd><span>露ジャンプ（遠）</span></li>" +
    "<li><kbd>X</kbd><span>静止（ログ上）</span></li>";
  document.getElementById("rules").innerHTML =
    "<li>上端の睡蓮へ到達で得点</li>" +
    "<li>露ゲージで大ジャンプ</li>" +
    "<li>車・水・時間切れ注意</li>";

  let frog, cars, logs, pads, dew, score, lives, phase, timer, raf, last, cool;
  let cling, particles, floats, goals, audio;

  function sfx(f, d, t, v) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio = audio || new AC();
      if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime;
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = t || "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(v || 0.035, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (d || 0.1));
      o.connect(g); g.connect(audio.destination);
      o.start(t0); o.stop(t0 + (d || 0.12));
    } catch (e) {}
  }

  function resetFrog() {
    frog = { x: 310, y: 440, w: 22, h: 22 };
    timer = 32;
    cling = false;
  }

  function spawnTraffic() {
    cars = [];
    logs = [];
    pads = [];
    const carColors = ["#ff6b6b", "#ffa94d", "#ffd43b", "#4dabf7", "#69db7c"];
    for (let i = 0; i < 5; i++) {
      cars.push({
        x: Math.random() * 640,
        y: 360 - i * 28,
        w: 46 + (i % 3) * 8,
        h: 20,
        vx: (i % 2 ? 1 : -1) * (2.1 + i * 0.28),
        color: carColors[i]
      });
    }
    for (let i = 0; i < 4; i++) {
      logs.push({
        x: Math.random() * 640,
        y: 160 - i * 28,
        w: 70 + i * 12,
        h: 20,
        vx: (i % 2 ? -1 : 1) * (1.35 + i * 0.22),
        bloom: Math.random() < 0.35
      });
    }
    for (let i = 0; i < 5; i++) {
      pads.push({
        x: 40 + i * 120,
        y: 10,
        w: 48,
        h: 26,
        filled: goals[i] || false
      });
    }
  }

  function start() {
    score = 0; lives = 3; dew = 40; goals = [false, false, false, false, false];
    phase = "play"; cool = 0; particles = []; floats = [];
    resetFrog(); spawnTraffic();
    hud(); last = performance.now(); cancelAnimationFrame(raf); loop(last);
    status("睡蓮へ — 露を溜めて遠跳");
    sfx(360, 0.08, "triangle", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives + " / D" + Math.floor(dew) + " / " + Math.ceil(timer);
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b));
    document.getElementById("best").textContent = b;
  }

  function status(t) { document.getElementById("status").textContent = t; }

  function die() {
    lives -= 1;
    cling = false;
    hud();
    sfx(150, 0.14, "sawtooth", 0.035);
    if (lives <= 0) { phase = "over"; status("ゲームオーバー"); }
    else { resetFrog(); status("落ちた…"); }
  }

  function hit(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 8); i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3 - 0.5,
        life: 300 + Math.random() * 300,
        r: 1.2 + Math.random() * 2,
        color: color
      });
    }
  }

  function tryGoal() {
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (!p.filled && hit(frog, p)) {
        p.filled = true;
        goals[i] = true;
        const bonus = 100 + Math.floor(timer) * 2;
        score += bonus;
        dew = Math.min(100, dew + 25);
        floats.push({ x: p.x + p.w / 2, y: p.y + 20, text: "+" + bonus, color: "#95d5b2", life: 900, vy: -0.04 });
        burst(p.x + p.w / 2, p.y + 12, "#95d5b2", 14);
        sfx(620, 0.12, "triangle", 0.04);
        if (goals.every(Boolean)) {
          score += 250;
          goals = [false, false, false, false, false];
          status("五輪開花！ ボーナス");
          sfx(780, 0.16, "sine", 0.04);
        } else status("ゴール！");
        resetFrog();
        spawnTraffic();
        hud();
        return true;
      }
    }
    return false;
  }

  function dewJump(dx, dy) {
    if (dew < 28 || cool > 0 || phase !== "play") return false;
    dew -= 28;
    frog.x += dx * 2;
    frog.y += dy * 2;
    cool = 160;
    burst(frog.x + 11, frog.y + 11, "#74c0fc", 10);
    status("露ジャンプ");
    sfx(500, 0.09, "sine", 0.035);
    hud();
    return true;
  }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;
    cool = Math.max(0, cool - dt);
    timer -= dt / 1000;
    dew = Math.min(100, dew + dt * 0.004);
    hud();
    if (timer <= 0) { die(); return; }

    cars.forEach(function (c) {
      c.x += c.vx * k;
      if (c.x > 700) c.x = -80;
      if (c.x < -80) c.x = 700;
    });
    logs.forEach(function (l) {
      l.x += l.vx * k;
      if (l.x > 720) l.x = -100;
      if (l.x < -100) l.x = 720;
    });

    cars.forEach(function (c) { if (hit(frog, c)) die(); });

    if (frog.y < 180 && frog.y > 40) {
      const on = logs.find(function (l) { return hit(frog, l); });
      if (on) {
        if (!cling) frog.x += on.vx * k;
        if (on.bloom) dew = Math.min(100, dew + 0.08 * k);
      } else die();
    }

    if (frog.y <= 36) {
      if (!tryGoal()) {
        // missed pad — bank splash
        die();
      }
    }
    if (frog.x < 0 || frog.x > canvas.width - frog.w) die();

    particles = particles.filter(function (p) {
      p.life -= dt; p.x += p.vx * k; p.y += p.vy * k; return p.life > 0;
    });
    floats = floats.filter(function (f) {
      f.life -= dt; f.y += f.vy * dt; return f.life > 0;
    });
  }

  function draw() {
    ctx.fillStyle = "#1b4332";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#40916c";
    ctx.fillRect(0, 420, canvas.width, 60);
    ctx.fillStyle = "#2d6a4f";
    ctx.fillRect(0, 0, canvas.width, 40);
    ctx.fillStyle = "#2b2d42";
    ctx.fillRect(0, 220, canvas.width, 180);
    // lane marks
    ctx.fillStyle = "rgba(255,255,255,.12)";
    for (let x = 0; x < 640; x += 40) ctx.fillRect(x, 308, 18, 3);
    ctx.fillStyle = "#1d3557";
    ctx.fillRect(0, 40, canvas.width, 180);

    logs.forEach(function (l) {
      ctx.fillStyle = l.bloom ? "#b08968" : "#9c6644";
      ctx.fillRect(l.x, l.y, l.w, l.h);
      if (l.bloom) {
        ctx.fillStyle = "#ffc9c9";
        ctx.beginPath();
        ctx.arc(l.x + l.w * 0.5, l.y + 10, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    pads.forEach(function (p) {
      ctx.fillStyle = p.filled ? "#95d5b2" : "#52b788";
      ctx.beginPath();
      ctx.ellipse(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      if (p.filled) {
        ctx.fillStyle = "#fff";
        ctx.font = "700 10px Outfit";
        ctx.textAlign = "center";
        ctx.fillText("●", p.x + p.w / 2, p.y + p.h * 0.7);
      }
    });

    cars.forEach(function (c) {
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = "rgba(0,0,0,.25)";
      ctx.fillRect(c.x + 6, c.y + 4, c.w - 12, 6);
    });

    ctx.fillStyle = cling ? "#b7e4c7" : "#95d5b2";
    ctx.fillRect(frog.x, frog.y, frog.w, frog.h);
    ctx.fillStyle = "#081c15";
    ctx.fillRect(frog.x + 4, frog.y + 5, 4, 4);
    ctx.fillRect(frog.x + 14, frog.y + 5, 4, 4);

    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 500);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
    floats.forEach(function (f) {
      ctx.globalAlpha = Math.max(0, f.life / 900);
      ctx.fillStyle = f.color;
      ctx.font = "700 13px Fraunces, Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(12, canvas.height - 16, 120, 6);
    ctx.fillStyle = "#74c0fc";
    ctx.fillRect(12, canvas.height - 16, 120 * (dew / 100), 6);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "600 11px IBM Plex Sans JP, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("DEW " + Math.floor(dew) + (cling ? "  CLING" : ""), 12, canvas.height - 22);

    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.42)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "800 28px Outfit";
      ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : phase === "pause" ? "PAUSE" : "LOTUSCROSS", canvas.width / 2, canvas.height / 2);
      ctx.font = "500 13px IBM Plex Sans JP";
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillText("露ジャンプ Z / 静止 X — 専用実装", canvas.width / 2, canvas.height / 2 + 28);
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
    if (phase !== "play") return;
    if (e.key === "x" || e.key === "X") {
      cling = !cling;
      status(cling ? "静止" : "解除");
      e.preventDefault();
      return;
    }
    if (cool > 0) return;
    const step = 28;
    if (e.key === "z" || e.key === "Z") {
      // dew jump in last facing — default up
      dewJump(0, -step);
      e.preventDefault();
      return;
    }
    if (e.key === "ArrowLeft") { frog.x -= step; cool = 120; dew = Math.min(100, dew + 2); sfx(300, 0.05, "triangle", 0.02); }
    if (e.key === "ArrowRight") { frog.x += step; cool = 120; dew = Math.min(100, dew + 2); sfx(300, 0.05, "triangle", 0.02); }
    if (e.key === "ArrowUp") { frog.y -= step; cool = 120; dew = Math.min(100, dew + 3); sfx(340, 0.05, "triangle", 0.02); }
    if (e.key === "ArrowDown") { frog.y = Math.min(440, frog.y + step); cool = 120; }
    e.preventDefault();
  });

  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
    else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
  };

  phase = "ready";
  goals = [false, false, false, false, false];
  dew = 40; particles = []; floats = [];
  resetFrog(); spawnTraffic(); draw();
})();
