"use strict";
/**
 * PULSARFORGE — このタイトル専用のブレイクアウト。
 * 共有モジュールなし。パドル蓄脈（Pulse）と多層レンガが固有要素。
 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  canvas.width = 640;
  canvas.height = 480;

  const KEY = "vq_pulsarforge_best_v2";
  const STAGE_KEY = "vq_pulsarforge_stage";

  document.getElementById("best").textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li><kbd>←→</kbd><span>パドル</span></li>" +
    "<li><kbd>Space</kbd><span>発射</span></li>" +
    "<li><kbd>Z</kbd><span>蓄脈ショット</span></li>" +
    "<li><kbd>X</kbd><span>磁界（短）</span></li>";
  document.getElementById("rules").innerHTML =
    "<li>蓄脈が溜まると Z で貫通弾</li>" +
    "<li>多層レンガは色が薄くなる</li>" +
    "<li>全消しで次ステージ</li>" +
    "<li>落とすと残機減少</li>";

  let paddle, balls, bricks, powerups, particles, floats;
  let score, lives, phase, keys, raf, last, stage, pulse, magnetT, combo, audio;

  const STAGES = [
    { rows: 5, cols: 10, multi: 0.15, name: "Warm Pulse" },
    { rows: 6, cols: 10, multi: 0.25, name: "Amber Beat" },
    { rows: 7, cols: 11, multi: 0.35, name: "Crimson Wave" },
    { rows: 7, cols: 12, multi: 0.45, name: "Nova Break" },
    { rows: 8, cols: 12, multi: 0.55, name: "Pulse Storm" }
  ];

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
      g.gain.setValueAtTime(vol || 0.04, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (dur || 0.1));
      o.connect(g);
      g.connect(audio.destination);
      o.start(t0);
      o.stop(t0 + (dur || 0.12));
    } catch (e) { /* ignore */ }
  }

  function floatAt(x, y, text, color) {
    floats.push({ x: x, y: y, text: text, color: color || "#ffd43b", life: 900, vy: -0.05 });
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < (n || 10); i++) {
      particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 4.5,
        vy: (Math.random() - 0.5) * 4.5 - 1,
        life: 280 + Math.random() * 420,
        r: 1.2 + Math.random() * 2.4,
        color: color
      });
    }
  }

  function stageDef() {
    return STAGES[Math.min(stage, STAGES.length - 1)];
  }

  function buildBricks() {
    bricks = [];
    const def = stageDef();
    const colors = ["#ff6b6b", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#ff922b", "#fcc2d7", "#a9e34b"];
    const gapX = 6;
    const gapY = 5;
    const margin = 20;
    const bw = (canvas.width - margin * 2 - gapX * (def.cols - 1)) / def.cols;
    const bh = 16;
    for (let r = 0; r < def.rows; r++) {
      for (let c = 0; c < def.cols; c++) {
        const hp = Math.random() < def.multi ? 2 + (stage > 2 ? 1 : 0) : 1;
        const special = Math.random() < 0.08 ? "pulse" : Math.random() < 0.06 ? "widen" : Math.random() < 0.05 ? "multi" : null;
        bricks.push({
          x: margin + c * (bw + gapX),
          y: 36 + r * (bh + gapY),
          w: bw,
          h: bh,
          hp: hp,
          maxHp: hp,
          color: colors[(r + stage) % colors.length],
          special: special
        });
      }
    }
  }

  function spawnBall(x, y, vx, vy, pierce) {
    balls.push({
      x: x, y: y,
      vx: vx, vy: vy,
      r: pierce ? 5 : 6,
      pierce: pierce || 0,
      trail: []
    });
  }

  function resetBall() {
    balls = [];
    spawnBall(paddle.x + paddle.w / 2, paddle.y - 10, 0, 0, 0);
    balls[0].docked = true;
  }

  function start() {
    score = 0;
    lives = 3;
    stage = Number(localStorage.getItem(STAGE_KEY) || 0);
    if (stage >= STAGES.length) stage = 0;
    phase = "play";
    keys = {};
    pulse = 0;
    magnetT = 0;
    combo = 0;
    powerups = [];
    particles = [];
    floats = [];
    paddle = { x: 270, y: 440, w: 104, h: 12, speed: 7.2, baseW: 104 };
    buildBricks();
    resetBall();
    last = performance.now();
    hud();
    cancelAnimationFrame(raf);
    loop(last);
    status(stageDef().name + " — スペースで発射");
    sfx(420, 0.08, "triangle", 0.035);
  }

  function nextStage() {
    stage = Math.min(stage + 1, STAGES.length - 1);
    localStorage.setItem(STAGE_KEY, String(stage));
    score += 200 + stage * 80;
    pulse = Math.min(100, pulse + 25);
    buildBricks();
    resetBall();
    combo = 0;
    phase = "play";
    status(stageDef().name + " 開始");
    sfx(660, 0.14, "sawtooth", 0.03);
    hud();
  }

  function hud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives + " / P" + Math.floor(pulse);
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b));
    document.getElementById("best").textContent = b;
  }

  function status(t) {
    document.getElementById("status").textContent = t;
  }

  function dropPower(brick) {
    if (!brick.special) return;
    powerups.push({
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h / 2,
      vy: 1.6,
      kind: brick.special,
      r: 8
    });
  }

  function applyPower(kind) {
    if (kind === "pulse") {
      pulse = Math.min(100, pulse + 35);
      floatAt(paddle.x + paddle.w / 2, paddle.y - 20, "PULSE+", "#74c0fc");
      sfx(520, 0.1, "sine", 0.04);
    } else if (kind === "widen") {
      paddle.w = Math.min(160, paddle.w + 18);
      floatAt(paddle.x + paddle.w / 2, paddle.y - 20, "WIDEN", "#69db7c");
      sfx(380, 0.1, "triangle", 0.04);
    } else if (kind === "multi") {
      const base = balls[0] || { x: paddle.x + paddle.w / 2, y: paddle.y - 20, vx: 3, vy: -4 };
      spawnBall(base.x, base.y, -Math.abs(base.vx || 3.2), -(Math.abs(base.vy) || 4), 0);
      spawnBall(base.x, base.y, Math.abs(base.vx || 3.2), -(Math.abs(base.vy) || 4), 0);
      floatAt(base.x, base.y, "MULTI", "#ffa94d");
      sfx(700, 0.1, "square", 0.035);
    }
  }

  function firePulseShot() {
    if (pulse < 40 || phase !== "play") return;
    pulse -= 40;
    const x = paddle.x + paddle.w / 2;
    const y = paddle.y - 12;
    spawnBall(x, y, 0, -7.5, 3);
    burst(x, y, "#74c0fc", 14);
    floatAt(x, y - 10, "蓄脈", "#74c0fc");
    status("蓄脈ショット！");
    sfx(880, 0.12, "sawtooth", 0.04);
    hud();
  }

  function activateMagnet() {
    if (pulse < 20 || phase !== "play") return;
    pulse -= 20;
    magnetT = 90;
    status("磁界展開");
    sfx(300, 0.15, "sine", 0.04);
    hud();
  }

  function hitBrick(ball, b) {
    if (ball.pierce > 0) {
      ball.pierce -= 1;
    } else {
      ball.vy *= -1;
      // nudge to avoid sticky collisions
      ball.y += ball.vy > 0 ? 2 : -2;
    }
    b.hp -= 1;
    combo += 1;
    const gain = 18 + combo * 2 + stage * 4;
    score += gain;
    pulse = Math.min(100, pulse + 2 + (combo > 5 ? 1 : 0));
    floatAt(b.x + b.w / 2, b.y, "+" + gain, b.color);
    burst(b.x + b.w / 2, b.y + b.h / 2, b.color, 6 + combo);
    sfx(340 + combo * 28, 0.07, "square", 0.03);
    if (b.hp <= 0) {
      dropPower(b);
      return false;
    }
    return true;
  }

  function update(dt) {
    if (phase !== "play") return;
    const k = dt / 16;

    if (keys.ArrowLeft || keys.a || keys.A) paddle.x -= paddle.speed * k;
    if (keys.ArrowRight || keys.d || keys.D) paddle.x += paddle.speed * k;
    paddle.x = Math.max(8, Math.min(canvas.width - paddle.w - 8, paddle.x));

    if (magnetT > 0) magnetT -= k;

    // gradual paddle shrink back
    if (paddle.w > paddle.baseW) paddle.w -= 0.01 * k;

    powerups = powerups.filter(function (p) {
      p.y += p.vy * k * 1.4;
      if (p.y > canvas.height) return false;
      if (p.y + p.r >= paddle.y && p.x > paddle.x && p.x < paddle.x + paddle.w) {
        applyPower(p.kind);
        return false;
      }
      return true;
    });

    particles = particles.filter(function (p) {
      p.life -= dt;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.vy += 0.08 * k;
      return p.life > 0;
    });

    floats = floats.filter(function (f) {
      f.life -= dt;
      f.y += f.vy * dt;
      return f.life > 0;
    });

    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];
      if (ball.docked) {
        ball.x = paddle.x + paddle.w / 2;
        ball.y = paddle.y - 10;
        continue;
      }

      if (magnetT > 0) {
        const cx = paddle.x + paddle.w / 2;
        ball.vx += (cx - ball.x) * 0.002 * k;
      }

      ball.trail.push({ x: ball.x, y: ball.y });
      if (ball.trail.length > 8) ball.trail.shift();

      ball.x += ball.vx * k;
      ball.y += ball.vy * k;

      if (ball.x < ball.r || ball.x > canvas.width - ball.r) {
        ball.vx *= -1;
        ball.x = Math.max(ball.r, Math.min(canvas.width - ball.r, ball.x));
        sfx(220, 0.04, "triangle", 0.02);
      }
      if (ball.y < ball.r) {
        ball.vy = Math.abs(ball.vy);
        ball.y = ball.r;
      }

      if (ball.y > canvas.height + 20) {
        balls.splice(i, 1);
        continue;
      }

      if (
        ball.vy > 0 &&
        ball.y + ball.r >= paddle.y &&
        ball.y + ball.r <= paddle.y + paddle.h + 8 &&
        ball.x > paddle.x - 2 &&
        ball.x < paddle.x + paddle.w + 2
      ) {
        const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
        ball.vx = hit * 5.4;
        ball.vy = -Math.abs(ball.vy);
        ball.y = paddle.y - ball.r - 1;
        combo = Math.max(0, combo - 1);
        pulse = Math.min(100, pulse + 1);
        sfx(260, 0.05, "triangle", 0.025);
      }

      for (let bi = bricks.length - 1; bi >= 0; bi--) {
        const b = bricks[bi];
        if (
          ball.x + ball.r > b.x &&
          ball.x - ball.r < b.x + b.w &&
          ball.y + ball.r > b.y &&
          ball.y - ball.r < b.y + b.h
        ) {
          const keep = hitBrick(ball, b);
          if (!keep) bricks.splice(bi, 1);
          if (ball.pierce <= 0) break;
        }
      }
    }

    if (!balls.length) {
      lives -= 1;
      combo = 0;
      hud();
      if (lives <= 0) {
        phase = "over";
        status("ゲームオーバー — はじめるで再挑戦");
        sfx(120, 0.25, "sawtooth", 0.04);
      } else {
        resetBall();
        status("残機 " + lives + " — スペースで再発射");
      }
      return;
    }

    if (!bricks.length) {
      phase = "clear";
      score += 300 + stage * 100;
      hud();
      status("クリア！ 次ステージへ…");
      sfx(540, 0.08, "triangle", 0.04);
      setTimeout(function () {
        if (phase === "clear") nextStage();
      }, 700);
    }

    hud();
  }

  function drawBrick(b) {
    const ratio = b.hp / b.maxHp;
    ctx.globalAlpha = 0.55 + ratio * 0.45;
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    if (b.maxHp > 1) {
      ctx.strokeStyle = "rgba(255,255,255,.35)";
      ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    }
    if (b.special) {
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.font = "700 9px Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(b.special[0].toUpperCase(), b.x + b.w / 2, b.y + b.h * 0.72);
    }
    ctx.globalAlpha = 1;
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, "#1a0e14");
    g.addColorStop(0.55, "#120c1c");
    g.addColorStop(1, "#071018");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // subtle scanlines
    ctx.fillStyle = "rgba(255,255,255,.015)";
    for (let y = 0; y < canvas.height; y += 4) ctx.fillRect(0, y, canvas.width, 1);

    bricks.forEach(drawBrick);

    powerups.forEach(function (p) {
      ctx.beginPath();
      ctx.fillStyle = p.kind === "pulse" ? "#74c0fc" : p.kind === "widen" ? "#69db7c" : "#ffa94d";
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.font = "700 9px Outfit";
      ctx.textAlign = "center";
      ctx.fillText(p.kind[0].toUpperCase(), p.x, p.y + 3);
    });

    // paddle + pulse meter glow
    const glow = pulse / 100;
    ctx.shadowColor = "rgba(116,192,252," + (0.15 + glow * 0.55) + ")";
    ctx.shadowBlur = 8 + glow * 18;
    ctx.fillStyle = "#e9ecef";
    ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
    ctx.shadowBlur = 0;
    if (magnetT > 0) {
      ctx.strokeStyle = "rgba(116,192,252,.45)";
      ctx.beginPath();
      ctx.ellipse(paddle.x + paddle.w / 2, paddle.y, paddle.w * 0.7, 18, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // pulse bar under paddle
    ctx.fillStyle = "rgba(255,255,255,.12)";
    ctx.fillRect(paddle.x, paddle.y + paddle.h + 3, paddle.w, 4);
    ctx.fillStyle = "#74c0fc";
    ctx.fillRect(paddle.x, paddle.y + paddle.h + 3, paddle.w * (pulse / 100), 4);

    balls.forEach(function (ball) {
      ball.trail.forEach(function (t, ti) {
        ctx.globalAlpha = (ti + 1) / ball.trail.length * 0.35;
        ctx.fillStyle = ball.pierce > 0 ? "#74c0fc" : "#ffd43b";
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.r * 0.7, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = ball.pierce > 0 ? "#74c0fc" : "#ffd43b";
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
      ctx.fill();
    });

    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, p.life / 600);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    floats.forEach(function (f) {
      ctx.globalAlpha = Math.max(0, f.life / 900);
      ctx.fillStyle = f.color;
      ctx.font = "700 14px Fraunces, Outfit, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;

    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "600 12px IBM Plex Sans JP, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(stageDef().name + " · COMBO " + combo, 12, 18);

    if (phase !== "play") {
      ctx.fillStyle = "rgba(0,0,0,.42)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "800 28px Outfit";
      ctx.textAlign = "center";
      const msg =
        phase === "over" ? "GAME OVER" :
        phase === "clear" ? "CLEAR" :
        phase === "pause" ? "PAUSE" : "PULSARFORGE";
      ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
      ctx.font = "500 13px IBM Plex Sans JP";
      ctx.fillStyle = "rgba(255,255,255,.7)";
      ctx.fillText("蓄脈 Z / 磁界 X — このタイトル専用", canvas.width / 2, canvas.height / 2 + 28);
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
    if (e.code === "Space") {
      e.preventDefault();
      if (phase === "play") {
        const docked = balls.find(function (b) { return b.docked; });
        if (docked) {
          docked.docked = false;
          docked.vx = 3.2;
          docked.vy = -4.4;
          status("ブレイク！");
          sfx(480, 0.07, "square", 0.03);
        }
      }
    }
    if (e.key === "z" || e.key === "Z") firePulseShot();
    if (e.key === "x" || e.key === "X") activateMagnet();
  });
  window.addEventListener("keyup", function (e) { keys[e.key] = false; });

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

  // ready screen
  phase = "ready";
  stage = Number(localStorage.getItem(STAGE_KEY) || 0);
  score = 0;
  lives = 3;
  pulse = 0;
  combo = 0;
  magnetT = 0;
  keys = {};
  powerups = [];
  particles = [];
  floats = [];
  balls = [];
  paddle = { x: 270, y: 440, w: 104, h: 12, speed: 7.2, baseW: 104 };
  buildBricks();
  spawnBall(320, 430, 0, 0, 0);
  balls[0].docked = true;
  draw();
})();
