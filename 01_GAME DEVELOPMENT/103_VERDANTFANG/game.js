"use strict";
/**
 * VERDANTFANG — このタイトル専用スネーク。
 * 「牙ゲージ」と毒餌／金餌が固有。共有モジュールなし。
 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const CELL = 20;
  const COLS = 32;
  const ROWS = 24;
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;

  const KEY = "vq_verdantfang_best_v2";

  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li><kbd>←↑→↓</kbd><span>方向</span></li>" +
    "<li><kbd>Z</kbd><span>牙ダッシュ</span></li>" +
    "<li><kbd>X</kbd><span>脱皮（短縮）</span></li>";
  document.getElementById("rules").innerHTML =
    "<li>赤=毒（速いが減節）</li>" +
    "<li>金=高得点</li>" +
    "<li>牙ゲージで短距離加速</li>" +
    "<li>壁・自分で終了</li>";

  let snake, dir, next, foods, score, phase, acc, raf, last;
  let fang, venom, moltCD, streak, particles, floats, audio;

  function sfx(freq, dur, type, vol) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audio = audio || new AC();
      if (audio.state === "suspended") audio.resume();
      const t0 = audio.currentTime;
      const o = audio.createOscillator();
      const g = audio.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(vol || 0.035, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (dur || 0.1));
      o.connect(g);
      g.connect(audio.destination);
      o.start(t0);
      o.stop(t0 + (dur || 0.12));
    } catch (e) { /* ignore */ }
  }

  function occupied(x, y) {
    return snake.some(function (s) { return s.x === x && s.y === y; });
  }

  function randCell() {
    let x, y, guard = 0;
    do {
      x = Math.floor(Math.random() * COLS);
      y = Math.floor(Math.random() * ROWS);
      guard++;
    } while ((occupied(x, y) || foods.some(function (f) { return f.x === x && f.y === y; })) && guard < 200);
    return { x: x, y: y };
  }

  function spawnFood(forced) {
    const roll = Math.random();
    const kind = forced || (roll < 0.12 ? "gold" : roll < 0.28 ? "venom" : "bit");
    const cell = randCell();
    foods.push({ x: cell.x, y: cell.y, kind: kind, life: kind === "gold" ? 420 : 9999 });
  }

  function ensureFoods() {
    while (foods.filter(function (f) { return f.kind === "bit" || f.kind === "venom"; }).length < 2) spawnFood();
    if (!foods.some(function (f) { return f.kind === "gold"; }) && Math.random() < 0.02) spawnFood("gold");
  }

  function floatAt(x, y, text, color) {
    floats.push({
      x: x * CELL + CELL / 2,
      y: y * CELL,
      text: text,
      color: color,
      life: 800,
      vy: -0.04
    });
  }

  function burst(cx, cy, color, n) {
    for (let i = 0; i < (n || 8); i++) {
      particles.push({
        x: cx, y: cy,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        life: 300 + Math.random() * 300,
        r: 1.5 + Math.random() * 2,
        color: color
      });
    }
  }

  function start() {
    snake = [
      { x: 10, y: 12 },
      { x: 9, y: 12 },
      { x: 8, y: 12 },
      { x: 7, y: 12 }
    ];
    dir = { x: 1, y: 0 };
    next = { x: 1, y: 0 };
    foods = [];
    score = 0;
    fang = 0;
    venom = 0;
    moltCD = 0;
    streak = 0;
    particles = [];
    floats = [];
    phase = "play";
    acc = 0;
    spawnFood("bit");
    spawnFood("bit");
    spawnFood("venom");
    hud();
    last = performance.now();
    cancelAnimationFrame(raf);
    loop(last);
    status("牙を研げ — BIT!");
    sfx(400, 0.08, "triangle", 0.03);
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = (snake ? snake.length : 0) + " / F" + Math.floor(fang);
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b));
    document.getElementById("best").textContent = b;
  }

  function status(t) {
    document.getElementById("status").textContent = t;
  }

  function fangDash() {
    if (fang < 30 || phase !== "play") return;
    fang -= 30;
    // instant two steps forward (bite lunge)
    for (let i = 0; i < 2; i++) {
      if (phase !== "play") break;
      step(true);
    }
    status("牙ダッシュ");
    sfx(720, 0.1, "sawtooth", 0.035);
    hud();
  }

  function molt() {
    if (moltCD > 0 || snake.length < 6 || phase !== "play") return;
    const cut = Math.min(3, snake.length - 3);
    snake.length -= cut;
    moltCD = 180;
    fang = Math.min(100, fang + 20);
    score += cut * 5;
    floatAt(snake[0].x, snake[0].y, "MOLT", "#a9e34b");
    status("脱皮 −" + cut + "節");
    sfx(280, 0.12, "sine", 0.04);
    hud();
  }

  function eat(food) {
    const head = snake[0];
    if (food.kind === "bit") {
      streak += 1;
      const gain = 10 + streak * 2;
      score += gain;
      fang = Math.min(100, fang + 8);
      floatAt(head.x, head.y, "+" + gain, "#69db7c");
      burst(head.x * CELL + 10, head.y * CELL + 10, "#69db7c", 8);
      sfx(520 + streak * 20, 0.07, "square", 0.03);
      return "grow";
    }
    if (food.kind === "gold") {
      streak += 2;
      score += 40 + streak * 3;
      fang = Math.min(100, fang + 20);
      floatAt(head.x, head.y, "GOLD", "#ffd43b");
      burst(head.x * CELL + 10, head.y * CELL + 10, "#ffd43b", 14);
      sfx(880, 0.12, "triangle", 0.04);
      return "grow2";
    }
    // venom
    venom = 90;
    streak = 0;
    score += 6;
    fang = Math.min(100, fang + 4);
    if (snake.length > 3) snake.pop();
    floatAt(head.x, head.y, "VENOM", "#ff6b6b");
    burst(head.x * CELL + 10, head.y * CELL + 10, "#ff6b6b", 10);
    sfx(180, 0.1, "sawtooth", 0.035);
    status("毒餌 — 加速＆減節");
    return "shrink";
  }

  function step(fromDash) {
    if (next.x !== -dir.x || next.y !== -dir.y) dir = { x: next.x, y: next.y };
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS || occupied(head.x, head.y)) {
      phase = "over";
      status("ゲームオーバー — 牙が折れた");
      sfx(110, 0.22, "sawtooth", 0.04);
      hud();
      return;
    }

    snake.unshift(head);
    fang = Math.min(100, fang + (fromDash ? 0 : 0.35));

    let grew = false;
    for (let i = foods.length - 1; i >= 0; i--) {
      const f = foods[i];
      if (f.x === head.x && f.y === head.y) {
        const result = eat(f);
        foods.splice(i, 1);
        if (result === "grow" || result === "grow2") {
          grew = true;
          if (result === "grow2") snake.push({ x: snake[snake.length - 1].x, y: snake[snake.length - 1].y });
        }
      }
    }
    if (!grew) snake.pop();

    foods = foods.filter(function (f) {
      if (f.kind === "gold") {
        f.life -= 1;
        return f.life > 0;
      }
      return true;
    });
    ensureFoods();
    if (moltCD > 0) moltCD -= 1;
    if (venom > 0) venom -= 1;
    hud();
  }

  function draw() {
    ctx.fillStyle = "#0b1a12";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if ((x + y) % 2 === 0) {
          ctx.fillStyle = "rgba(255,255,255,.03)";
          ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
        }
      }
    }

    foods.forEach(function (f) {
      const cx = f.x * CELL + CELL / 2;
      const cy = f.y * CELL + CELL / 2;
      if (f.kind === "gold") {
        ctx.fillStyle = "#ffd43b";
        ctx.beginPath();
        ctx.arc(cx, cy, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.5)";
        ctx.stroke();
      } else if (f.kind === "venom") {
        ctx.fillStyle = "#ff6b6b";
        ctx.beginPath();
        ctx.moveTo(cx, cy - 7);
        ctx.lineTo(cx + 7, cy + 6);
        ctx.lineTo(cx - 7, cy + 6);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillStyle = "#ff8787";
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    snake.forEach(function (s, i) {
      const t = i / Math.max(1, snake.length - 1);
      if (i === 0) {
        ctx.fillStyle = venom > 0 ? "#ffa8a8" : "#69db7c";
      } else {
        ctx.fillStyle = venom > 0
          ? "rgba(255,107,107," + (0.35 + (1 - t) * 0.4) + ")"
          : "rgba(47,158,68," + (0.45 + (1 - t) * 0.5) + ")";
      }
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
      if (i === 0) {
        // fangs
        ctx.fillStyle = "#f8f9fa";
        ctx.fillRect(s.x * CELL + 5, s.y * CELL + 4, 3, 5);
        ctx.fillRect(s.x * CELL + 12, s.y * CELL + 4, 3, 5);
      }
    });

    // fang meter
    ctx.fillStyle = "rgba(255,255,255,.1)";
    ctx.fillRect(8, canvas.height - 14, 120, 6);
    ctx.fillStyle = "#a9e34b";
    ctx.fillRect(8, canvas.height - 14, 120 * (fang / 100), 6);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "600 11px IBM Plex Sans JP, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("FANG " + Math.floor(fang) + (venom > 0 ? "  VENOM" : ""), 8, canvas.height - 20);

    particles = particles.filter(function (p) {
      p.life -= 16;
      p.x += p.vx;
      p.y += p.vy;
      ctx.globalAlpha = Math.max(0, p.life / 500);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      return p.life > 0;
    });
    ctx.globalAlpha = 1;

    floats = floats.filter(function (f) {
      f.life -= 16;
      f.y += f.vy * 16;
      ctx.globalAlpha = Math.max(0, f.life / 800);
      ctx.fillStyle = f.color;
      ctx.font = "700 13px Fraunces, Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
      return f.life > 0;
    });
    ctx.globalAlpha = 1;

    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.42)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "800 28px Outfit";
      ctx.textAlign = "center";
      ctx.fillText(phase === "over" ? "GAME OVER" : phase === "pause" ? "PAUSE" : "VERDANTFANG", canvas.width / 2, canvas.height / 2);
      ctx.font = "500 13px IBM Plex Sans JP";
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillText("牙ダッシュ Z / 脱皮 X — 専用実装", canvas.width / 2, canvas.height / 2 + 28);
    }
  }

  function loop(t) {
    const dt = t - last;
    last = t;
    acc += dt;
    const base = Math.max(58, 138 - Math.floor(score / 12));
    const interval = venom > 0 ? Math.max(48, base * 0.72) : base;
    while (acc >= interval && phase === "play") {
      acc -= interval;
      step(false);
    }
    draw();
    if (phase === "play") raf = requestAnimationFrame(loop);
  }

  const map = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    a: { x: -1, y: 0 },
    d: { x: 1, y: 0 },
    w: { x: 0, y: -1 },
    s: { x: 0, y: 1 }
  };
  window.addEventListener("keydown", function (e) {
    if (map[e.key]) {
      next = map[e.key];
      e.preventDefault();
    }
    if (e.key === "z" || e.key === "Z") fangDash();
    if (e.key === "x" || e.key === "X") molt();
  });

  document.getElementById("btn-start").onclick = start;
  document.getElementById("btn-pause").onclick = function () {
    if (phase === "play") {
      phase = "pause";
      cancelAnimationFrame(raf);
      status("一時停止");
      draw();
    } else if (phase === "pause") {
      phase = "play";
      last = performance.now();
      loop(last);
    }
  };

  phase = "ready";
  snake = [{ x: 10, y: 12 }, { x: 9, y: 12 }, { x: 8, y: 12 }];
  foods = [{ x: 20, y: 12, kind: "bit", life: 9999 }];
  fang = 0;
  venom = 0;
  particles = [];
  floats = [];
  draw();
})();
