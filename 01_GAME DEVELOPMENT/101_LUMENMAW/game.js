"use strict";

/**
 * LUMENMAW — maze snack. Standalone only for this title.
 * No shared arcade juice module.
 */
(function () {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const KEY = "vq_lumenmaw_v3";
  const TILE = 20;
  const COLS = 28;
  const ROWS = 24;
  canvas.width = COLS * TILE;
  canvas.height = ROWS * TILE;

  // 0 wall 1 path 2 pellet 3 power 4 fruit
  const RAW = [
    "############################",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o####.#####.##.#####.####o#",
    "#..........................#",
    "#.####.##.########.##.####.#",
    "#......##....##....##......#",
    "######.##### ## #####.######",
    "     #.##          ##.#     ",
    "######.## ###--### ##.######",
    "      .   #      #   .      ",
    "######.## #      # ##.######",
    "     #.## ######## ##.#     ",
    "######.##          ##.######",
    "#............##............#",
    "#.####.#####.##.#####.####.#",
    "#o..##................##..o#",
    "###.##.##.########.##.##.###",
    "#......##....##....##......#",
    "#.##########.##.##########.#",
    "#..........................#",
    "############################",
    "############################",
    "############################"
  ];

  const GHOST_NAMES = ["緋", "蒼", "桃", "橙"];

  let grid, player, ghosts, score, lives, phase, dir, nextDir, fright, raf, last;
  let stage = 1;
  let pelletsEaten = 0;
  let fruit = null;
  let fruitTimer = 0;
  let mouthT = 0;
  let comboEat = 0;
  let audioCtx = null;

  const bestEl = document.getElementById("best");
  bestEl.textContent = localStorage.getItem(KEY) || "0";
  document.getElementById("keys").innerHTML =
    "<li><kbd>←↑→↓</kbd><span>移動</span></li>" +
    "<li><kbd>P</kbd><span>一時停止</span></li>";
  document.getElementById("rules").innerHTML =
    "<li>粒10点・パワー50点・果実100点</li>" +
    "<li>連続でゴーストを食べると加算</li>" +
    "<li>全粒クリアでステージ進行（速度アップ）</li>";

  function beep(f, d) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      const t0 = audioCtx.currentTime;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "square";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.03, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (d || 0.08));
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start(t0);
      o.stop(t0 + 0.1);
    } catch (e) { /* ignore */ }
  }

  function resetGrid() {
    grid = RAW.map((row) =>
      row.split("").map((c) =>
        c === "#" ? 0 : c === "o" ? 3 : c === "." ? 2 : 1
      )
    );
  }

  function cell(x, y) {
    const c = Math.floor(x);
    const r = Math.floor(y);
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return 0;
    return grid[r][c];
  }

  function canMove(x, y) {
    return cell(x, y) !== 0;
  }

  function ghostSpeed() {
    return 0.08 + Math.min(0.05, (stage - 1) * 0.01);
  }

  function spawn() {
    resetGrid();
    pelletsEaten = 0;
    fruit = null;
    fruitTimer = 0;
    comboEat = 0;
    player = { x: 13.5, y: 17.5, speed: 0.11 + Math.min(0.04, (stage - 1) * 0.008) };
    dir = { x: 0, y: 0 };
    nextDir = { x: 0, y: 0 };
    ghosts = [
      { x: 13.5, y: 11.5, color: "#ff5a6a", name: GHOST_NAMES[0], tx: 1, ty: 1, personality: "chase" },
      { x: 12.5, y: 11.5, color: "#5ad0ff", name: GHOST_NAMES[1], tx: 26, ty: 1, personality: "ambush" },
      { x: 14.5, y: 11.5, color: "#ff9ad4", name: GHOST_NAMES[2], tx: 1, ty: 22, personality: "patrol" },
      { x: 13.5, y: 10.5, color: "#ffb84d", name: GHOST_NAMES[3], tx: 26, ty: 22, personality: "wander" }
    ];
    fright = 0;
  }

  function start() {
    score = 0;
    lives = 3;
    stage = 1;
    phase = "play";
    fright = 0;
    spawn();
    last = performance.now();
    setHud();
    cancelAnimationFrame(raf);
    loop(last);
    setStatus("ステージ 1 — 粒を食べろ！");
    beep(440, 0.1);
  }

  function nextStage() {
    stage += 1;
    score += 400 + stage * 100;
    spawn();
    phase = "play";
    setHud();
    setStatus("ステージ " + stage + " — 速度アップ");
    beep(660, 0.12);
    last = performance.now();
    cancelAnimationFrame(raf);
    loop(last);
  }

  function setHud() {
    document.getElementById("score").textContent = score;
    document.getElementById("lives").textContent = lives + " / S" + stage;
    document.getElementById("phase").textContent = phase.toUpperCase();
    const b = Math.max(+localStorage.getItem(KEY) || 0, score);
    localStorage.setItem(KEY, String(b));
    bestEl.textContent = b;
  }

  function setStatus(t) {
    document.getElementById("status").textContent = t;
  }

  function tryTurn(px, py, d) {
    return canMove(px + d.x * 0.2, py + d.y * 0.2);
  }

  function moveEntity(e, d, speed) {
    if (d.x || d.y) {
      const nx = e.x + d.x * speed;
      const ny = e.y + d.y * speed;
      if (
        canMove(nx, ny) &&
        canMove(
          nx + (d.x > 0 ? 0.4 : d.x < 0 ? -0.4 : 0),
          ny + (d.y > 0 ? 0.4 : d.y < 0 ? -0.4 : 0)
        )
      ) {
        e.x = nx;
        e.y = ny;
      } else {
        e.x = Math.round(e.x * 2) / 2;
        e.y = Math.round(e.y * 2) / 2;
      }
    }
    if (e.x < 0) e.x = COLS - 0.1;
    if (e.x >= COLS) e.x = 0.1;
  }

  function ghostTarget(g, i) {
    if (fright > 0) return { x: g.tx, y: g.ty };
    if (g.personality === "chase") return { x: player.x, y: player.y };
    if (g.personality === "ambush") {
      return { x: player.x + dir.x * 4, y: player.y + dir.y * 4 };
    }
    if (g.personality === "patrol") {
      const corners = [
        { x: 1, y: 1 },
        { x: 26, y: 1 },
        { x: 1, y: 22 },
        { x: 26, y: 22 }
      ];
      return corners[(Math.floor(performance.now() / 4000) + i) % 4];
    }
    // wander — mild chase with noise
    return {
      x: player.x + Math.sin(performance.now() / 700 + i) * 3,
      y: player.y + Math.cos(performance.now() / 900 + i) * 3
    };
  }

  function maybeSpawnFruit() {
    if (fruit || fruitTimer > 0) return;
    if (pelletsEaten > 40 && pelletsEaten % 45 < 2) {
      fruit = { x: 13.5, y: 14.5, life: 9000 };
      setStatus("果実出現！");
      beep(880, 0.08);
    }
  }

  function update(dt) {
    if (phase !== "play") return;
    mouthT += dt;
    if (fright > 0) fright -= dt;
    if (fruit) {
      fruit.life -= dt;
      if (fruit.life <= 0) fruit = null;
    }
    if (fruitTimer > 0) fruitTimer -= dt;

    if (nextDir.x || nextDir.y) {
      if (tryTurn(player.x, player.y, nextDir)) dir = { x: nextDir.x, y: nextDir.y };
    }
    moveEntity(player, dir, player.speed * (dt / 16));

    const c = Math.floor(player.x);
    const r = Math.floor(player.y);
    if (grid[r] && grid[r][c] === 2) {
      grid[r][c] = 1;
      score += 10;
      pelletsEaten += 1;
      maybeSpawnFruit();
      beep(220 + (pelletsEaten % 8) * 30, 0.04);
      setHud();
    }
    if (grid[r] && grid[r][c] === 3) {
      grid[r][c] = 1;
      score += 50;
      fright = 5500 + stage * 200;
      comboEat = 0;
      setHud();
      setStatus("パワークック！ ゴーストを chase");
      beep(180, 0.15);
    }

    if (fruit) {
      const dx = fruit.x - player.x;
      const dy = fruit.y - player.y;
      if (dx * dx + dy * dy < 0.4) {
        score += 100;
        fruit = null;
        fruitTimer = 12000;
        setHud();
        setStatus("果実 +100");
        beep(990, 0.1);
      }
    }

    const gSpeed = ghostSpeed();
    ghosts.forEach((g, i) => {
      const target = ghostTarget(g, i);
      const opts = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
      ];
      let best = opts[0];
      let bestD = 1e9;
      opts.forEach((o) => {
        const nx = g.x + o.x * 0.15;
        const ny = g.y + o.y * 0.15;
        if (!canMove(nx, ny)) return;
        const d = (nx - target.x) ** 2 + (ny - target.y) ** 2;
        const scoreD = fright > 0 ? -d : d;
        if (scoreD < bestD) {
          bestD = scoreD;
          best = o;
        }
      });
      moveEntity(g, best, (fright > 0 ? gSpeed * 0.7 : gSpeed) * (dt / 16));

      const dx = g.x - player.x;
      const dy = g.y - player.y;
      if (dx * dx + dy * dy < 0.35) {
        if (fright > 0) {
          comboEat += 1;
          const pts = 200 * comboEat;
          score += pts;
          g.x = 13.5;
          g.y = 11.5;
          setHud();
          setStatus(g.name + " を食べた +" + pts);
          beep(520 + comboEat * 80, 0.1);
        } else {
          lives--;
          setHud();
          if (lives <= 0) {
            phase = "over";
            setStatus("ゲームオーバー — ステージ " + stage);
            setHud();
            beep(110, 0.2);
          } else {
            player.x = 13.5;
            player.y = 17.5;
            dir = { x: 0, y: 0 };
            nextDir = { x: 0, y: 0 };
            fright = 0;
            setStatus("残機 -1");
            beep(150, 0.12);
          }
        }
      }
    });

    let left = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (grid[y][x] === 2 || grid[y][x] === 3) left++;
      }
    }
    if (left === 0) {
      phase = "clear";
      score += 500;
      setHud();
      setStatus("クリア！ はじめる / Enter でステージ " + (stage + 1));
      beep(740, 0.2);
    }
  }

  function draw() {
    // tunnel glow
    const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bg.addColorStop(0, "#061018");
    bg.addColorStop(1, "#0a1a24");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const v = grid[y][x];
        if (v === 0) {
          ctx.fillStyle = "#1a4d6e";
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
          ctx.strokeStyle = "#2d7aa8";
          ctx.strokeRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
        } else if (v === 2) {
          ctx.fillStyle = "#f6e7b2";
          ctx.beginPath();
          ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, 2.2, 0, Math.PI * 2);
          ctx.fill();
        } else if (v === 3) {
          const pulse = 4.5 + Math.sin(mouthT / 120) * 1.2;
          ctx.fillStyle = "#7ee0c6";
          ctx.beginPath();
          ctx.arc(x * TILE + TILE / 2, y * TILE + TILE / 2, pulse, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (fruit) {
      ctx.fillStyle = "#e76f51";
      ctx.beginPath();
      ctx.arc(fruit.x * TILE, fruit.y * TILE, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2a9d8f";
      ctx.fillRect(fruit.x * TILE - 1, fruit.y * TILE - 8, 2, 5);
    }

    const ang = Math.atan2(dir.y, dir.x) || 0;
    const mouth = 0.35 + Math.sin(mouthT / 80) * 0.2;
    ctx.fillStyle = "#ffe14a";
    ctx.beginPath();
    ctx.moveTo(player.x * TILE, player.y * TILE);
    ctx.arc(player.x * TILE, player.y * TILE, 8, ang + mouth, ang - mouth + Math.PI * 2);
    ctx.closePath();
    ctx.fill();

    ghosts.forEach((g) => {
      ctx.fillStyle = fright > 0 ? "#4a6cff" : g.color;
      ctx.beginPath();
      ctx.arc(g.x * TILE, g.y * TILE, 8, Math.PI, 0);
      ctx.lineTo(g.x * TILE + 8, g.y * TILE + 8);
      ctx.lineTo(g.x * TILE + 4, g.y * TILE + 5);
      ctx.lineTo(g.x * TILE, g.y * TILE + 8);
      ctx.lineTo(g.x * TILE - 4, g.y * TILE + 5);
      ctx.lineTo(g.x * TILE - 8, g.y * TILE + 8);
      ctx.closePath();
      ctx.fill();
      // eyes
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(g.x * TILE - 3, g.y * TILE - 1, 2, 0, Math.PI * 2);
      ctx.arc(g.x * TILE + 3, g.y * TILE - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "600 11px IBM Plex Sans JP,sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("STAGE " + stage, 8, 14);

    if (phase === "over" || phase === "ready" || phase === "clear" || phase === "pause") {
      ctx.fillStyle = "rgba(0,0,0,.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#fff";
      ctx.font = "800 28px Fraunces,Outfit,sans-serif";
      ctx.textAlign = "center";
      const title =
        phase === "over"
          ? "GAME OVER"
          : phase === "clear"
            ? "CLEAR"
            : phase === "pause"
              ? "PAUSE"
              : "LUMENMAW";
      ctx.fillText(title, canvas.width / 2, canvas.height / 2);
      ctx.font = "500 13px IBM Plex Sans JP,sans-serif";
      ctx.fillStyle = "rgba(255,255,255,.75)";
      ctx.fillText(
        phase === "clear" ? "Enter / はじめる で次ステージ" : "はじめるでスタート",
        canvas.width / 2,
        canvas.height / 2 + 28
      );
    }
  }

  function loop(t) {
    const dt = Math.min(32, t - last);
    last = t;
    update(dt);
    draw();
    if (phase === "play") raf = requestAnimationFrame(loop);
    else draw();
  }

  const mapKey = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }
  };

  window.addEventListener("keydown", (e) => {
    if (mapKey[e.key]) {
      nextDir = mapKey[e.key];
      e.preventDefault();
    }
    if (e.key === "Enter" && phase === "clear") {
      nextStage();
      return;
    }
    if (e.key === "p" || e.key === "P") {
      if (phase === "play") {
        phase = "pause";
        setStatus("一時停止");
        cancelAnimationFrame(raf);
        draw();
      } else if (phase === "pause") {
        phase = "play";
        last = performance.now();
        loop(last);
        setStatus("再開");
      }
    }
  });

  document.getElementById("btn-start").onclick = () => {
    if (phase === "clear") nextStage();
    else start();
  };
  document.getElementById("btn-pause").onclick = () => {
    if (phase === "play") {
      phase = "pause";
      cancelAnimationFrame(raf);
      setStatus("一時停止");
      draw();
    } else if (phase === "pause") {
      phase = "play";
      last = performance.now();
      loop(last);
    }
  };

  phase = "ready";
  spawn();
  draw();
})();
