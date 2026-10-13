"use strict";
/* MEADOWVELOX — standalone (inlined elevated engine). */
window.VQ_MARKET = {
  "brand": "MEADOWVELOX",
  "kind": "runner",
  "key": "vq_mkt_meadowvelox_v1",
  "theme": {
    "bg": "#606c38",
    "bg2": "#283618",
    "panel": "rgba(40,54,24,.92)",
    "ink": "#fefae0",
    "muted": "#dda15e",
    "accent": "#bc6c25",
    "accent2": "#fefae0",
    "line": "rgba(221,161,94,.3)",
    "glow": "rgba(188,108,37,.16)",
    "glow2": "rgba(254,250,224,.08)",
    "board": "#283618"
  },
  "params": {},
  "lead": "草原スプリント。",
  "keys": [
    "<kbd>←→</kbd>/<kbd>A D</kbd><span>レーン</span>"
  ],
  "rules": [
    "障害回避・コイン取得",
    "HP0で終了"
  ]
};
/**
 * VELQUIA market-game engine — elevated juice build. Self-contained.
 * Boot via window.VQ_MARKET = { brand, kind, key, theme, params, lead, keys, rules }
 */
(function () {
  const M = window.VQ_MARKET;
  if (!M) throw new Error("VQ_MARKET missing");

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const W = 720, H = 480;
  canvas.width = W; canvas.height = H;

  const $ = (id) => document.getElementById(id);
  const status = (t) => { $("status").textContent = t; };
  const hud = (score, lives, phase) => {
    $("score").textContent = score;
    $("lives").textContent = lives;
    $("phase").textContent = String(phase).toUpperCase();
    const b = Math.max(+localStorage.getItem(M.key) || 0, +score || 0);
    localStorage.setItem(M.key, String(b));
    $("best").textContent = b;
  };

  $("keys").innerHTML = (M.keys || []).map((k) => `<li>${k}</li>`).join("");
  $("rules").innerHTML = (M.rules || []).map((k) => `<li>${k}</li>`).join("");
  $("best").textContent = localStorage.getItem(M.key) || "0";

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];

  let particles = [];
  function burst(x, y, color, n = 10) {
    for (let i = 0; i < n; i++) {
      particles.push({
        x, y, vx: rand(-3, 3), vy: rand(-4, 1), life: rand(300, 700), color, r: rand(2, 4)
      });
    }
  }
  function stepParticles(dt) {
    particles = particles.filter((p) => {
      p.life -= dt; p.x += p.vx; p.y += p.vy; p.vy += 0.12;
      return p.life > 0;
    });
  }
  function drawParticles() {
    particles.forEach((p) => {
      ctx.globalAlpha = clamp(p.life / 700, 0, 1);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function overlay(text) {
    ctx.fillStyle = "rgba(4,10,16,.55)";
    ctx.fillRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(W * 0.3, H * 0.4, W * 0.7, H * 0.6);
    grad.addColorStop(0, M.theme.accent || "#78c4b8");
    grad.addColorStop(1, M.theme.accent2 || "#e8b84a");
    ctx.fillStyle = grad;
    ctx.font = "800 40px Fraunces,Outfit,serif";
    ctx.textAlign = "center";
    ctx.fillText(text, W / 2, H / 2 - 4);
    ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.font = "600 15px Outfit,sans-serif";
    ctx.fillText(M.brand, W / 2, H / 2 + 34);
    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "500 13px Outfit,sans-serif";
    ctx.fillText("クリック / はじめる で再開", W / 2, H / 2 + 58);
  }

  // ───────── KIND: merge (2048-like) ─────────
  function bootMerge() {
    const N = M.params.size || 4;
    const CELL = Math.floor(Math.min(W, H) * 0.78 / N);
    const OX = (W - CELL * N) / 2, OY = (H - CELL * N) / 2 + 10;
    let grid, score, phase, moved;

    function empty() { return Array.from({ length: N }, () => Array(N).fill(0)); }
    function spawn() {
      const free = [];
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!grid[y][x]) free.push([x, y]);
      if (!free.length) return;
      const [x, y] = pick(free);
      grid[y][x] = Math.random() < 0.9 ? 2 : 4;
    }
    function slide(row) {
      const a = row.filter(Boolean);
      for (let i = 0; i < a.length - 1; i++) {
        if (a[i] === a[i + 1]) { a[i] *= 2; score += a[i]; a.splice(i + 1, 1); burst(0, 0, M.theme.accent, 4); }
      }
      while (a.length < N) a.push(0);
      return a;
    }
    function move(dir) {
      if (phase !== "play") return;
      const before = JSON.stringify(grid);
      if (dir === "L" || dir === "R") {
        for (let y = 0; y < N; y++) {
          let row = grid[y].slice();
          if (dir === "R") row.reverse();
          row = slide(row);
          if (dir === "R") row.reverse();
          grid[y] = row;
        }
      } else {
        for (let x = 0; x < N; x++) {
          let col = grid.map((r) => r[x]);
          if (dir === "D") col.reverse();
          col = slide(col);
          if (dir === "D") col.reverse();
          for (let y = 0; y < N; y++) grid[y][x] = col[y];
        }
      }
      if (JSON.stringify(grid) !== before) { spawn(); moved = true; }
      if (!canMove()) { phase = "over"; status("詰み — もう一度挑戦"); }
      const max = Math.max(...grid.flat());
      if (max >= (M.params.goal || 2048)) { phase = "clear"; status("ゴール達成！"); }
      hud(score, max, phase); draw();
    }
    function canMove() {
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        if (!grid[y][x]) return true;
        if (x + 1 < N && grid[y][x] === grid[y][x + 1]) return true;
        if (y + 1 < N && grid[y][x] === grid[y + 1][x]) return true;
      }
      return false;
    }
    function color(v) {
      const t = Math.log2(v || 1);
      const palette = M.params.colors || ["#eee", "#cdc1b4", "#bbada0", "#f2b179", "#f59563", "#f67c5f", "#f65e3b", "#edcf72", "#edcc61", "#edc850", "#edc53f", "#edc22e"];
      return palette[Math.min(palette.length - 1, t | 0)];
    }
    function draw() {
      ctx.fillStyle = M.theme.board || "#1a1a22";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,.06)";
      ctx.fillRect(OX - 8, OY - 8, CELL * N + 16, CELL * N + 16);
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
        const v = grid[y][x];
        const px = OX + x * CELL, py = OY + y * CELL;
        ctx.fillStyle = v ? color(v) : "rgba(255,255,255,.04)";
        round(px + 4, py + 4, CELL - 8, CELL - 8, 10);
        if (v) {
          ctx.fillStyle = v >= 8 ? "#faf8ef" : "#222";
          ctx.font = `800 ${v >= 1000 ? 22 : 28}px Outfit`;
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(String(v), px + CELL / 2, py + CELL / 2 + 1);
        }
      }
      if (phase !== "play") overlay(phase === "clear" ? "CLEAR" : phase === "over" ? "GAME OVER" : M.brand);
    }
    function round(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
    }
    function start() {
      grid = empty(); score = 0; phase = "play"; spawn(); spawn();
      hud(score, 0, phase); status("矢印でスワイプ合成"); draw();
    }
    window.addEventListener("keydown", (e) => {
      const map = { ArrowLeft: "L", ArrowRight: "R", ArrowUp: "U", ArrowDown: "D" };
      if (map[e.key]) { e.preventDefault(); move(map[e.key]); }
    });
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => status(phase === "play" ? "盤面操作中" : "はじめるを押して");
    phase = "ready"; grid = empty(); draw(); overlay(M.brand);
  }

  // ───────── KIND: idle ─────────
  function bootIdle() {
    let coins, dps, tap, upgrades, phase, last, raf;
    const U = M.params.upgrades || [
      { name: "Auto miner", base: 15, pow: 1.35, add: 0.5 },
      { name: "Drill", base: 80, pow: 1.4, add: 3 },
      { name: "Factory", base: 400, pow: 1.45, add: 18 },
      { name: "Satellite", base: 2000, pow: 1.5, add: 90 }
    ];
    function start() {
      coins = 0; dps = 0; tap = M.params.tap || 1; phase = "play";
      upgrades = U.map(() => 0);
      last = performance.now(); cancelAnimationFrame(raf); loop(last);
      status("クリックで採掘・右の強化を購入");
    }
    function cost(i) { return Math.floor(U[i].base * Math.pow(U[i].pow, upgrades[i])); }
    function buy(i) {
      const c = cost(i);
      if (coins < c) return;
      coins -= c; upgrades[i]++; dps += U[i].add; hud(Math.floor(coins), dps.toFixed(1) + "/s", phase);
    }
    function update(dt) {
      if (phase !== "play") return;
      coins += dps * (dt / 1000);
      hud(Math.floor(coins), dps.toFixed(1) + "/s", phase);
    }
    function draw() {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, M.theme.bg || "#0d1b2a"); g.addColorStop(1, M.theme.bg2 || "#1b263b");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // tap orb
      ctx.fillStyle = M.theme.accent || "#ffd166";
      ctx.beginPath(); ctx.arc(260, 240, 70 + Math.sin(performance.now() / 200) * 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#111"; ctx.font = "800 20px Outfit"; ctx.textAlign = "center";
      ctx.fillText("TAP", 260, 246);
      ctx.fillStyle = "#fff"; ctx.font = "800 28px Outfit";
      ctx.fillText(Math.floor(coins).toLocaleString() + " " + (M.params.unit || "G"), 260, 100);
      // upgrade panel
      U.forEach((u, i) => {
        const y = 70 + i * 90;
        ctx.fillStyle = "rgba(255,255,255,.08)";
        roundRect(420, y, 260, 76, 12);
        ctx.fillStyle = "#fff"; ctx.font = "700 16px Outfit"; ctx.textAlign = "left";
        ctx.fillText(`${u.name} ×${upgrades[i]}`, 440, y + 28);
        ctx.fillStyle = M.theme.accent2 || "#06d6a0";
        ctx.fillText(`Cost ${cost(i)}  (+${u.add}/s)`, 440, y + 54);
      });
      drawParticles();
      if (phase !== "play") overlay(M.brand);
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath(); ctx.fill();
    }
    function loop(t) {
      const dt = Math.min(50, t - last); last = t;
      update(dt); stepParticles(dt); draw();
      if (phase === "play") raf = requestAnimationFrame(loop);
    }
    canvas.addEventListener("click", (e) => {
      if (phase !== "play") return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      if (Math.hypot(x - 260, y - 240) < 80) {
        coins += tap; burst(x, y, M.theme.accent, 8); hud(Math.floor(coins), dps.toFixed(1) + "/s", phase);
      }
      U.forEach((_, i) => {
        const uy = 70 + i * 90;
        if (x >= 420 && x <= 680 && y >= uy && y <= uy + 76) buy(i);
      });
    });
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => {
      if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
      else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
    };
    phase = "ready"; coins = 0; dps = 0; upgrades = U.map(() => 0); draw(); overlay(M.brand);
  }

  // ───────── KIND: survivor ─────────
  function bootSurvivor() {
    let player, foes, xpGems, bullets, score, hp, level, xp, phase, keys, raf, last, spawnAcc, atkAcc;
    function start() {
      player = { x: W / 2, y: H / 2, r: 14, speed: 3.2 };
      foes = []; xpGems = []; bullets = []; score = 0; hp = 100; level = 1; xp = 0;
      phase = "play"; keys = {}; spawnAcc = 0; atkAcc = 0;
      last = performance.now(); cancelAnimationFrame(raf); loop(last);
      status("WASD / 矢印で移動。自動攻撃");
    }
    function levelUp() {
      level++; xp = 0; player.speed += 0.15; hp = Math.min(100, hp + 20);
      burst(player.x, player.y, "#ffe66d", 20); status("LEVEL " + level);
    }
    function update(dt) {
      if (phase !== "play") return;
      const k = dt / 16;
      let mx = 0, my = 0;
      if (keys.ArrowLeft || keys.a || keys.A) mx -= 1;
      if (keys.ArrowRight || keys.d || keys.D) mx += 1;
      if (keys.ArrowUp || keys.w || keys.W) my -= 1;
      if (keys.ArrowDown || keys.s || keys.S) my += 1;
      if (mx || my) { const l = Math.hypot(mx, my); player.x += (mx / l) * player.speed * k; player.y += (my / l) * player.speed * k; }
      player.x = clamp(player.x, 20, W - 20); player.y = clamp(player.y, 20, H - 20);
      spawnAcc += dt; atkAcc += dt;
      if (spawnAcc > Math.max(280, 900 - level * 40)) {
        spawnAcc = 0;
        const ang = rand(0, Math.PI * 2);
        foes.push({ x: player.x + Math.cos(ang) * 340, y: player.y + Math.sin(ang) * 340, r: 12, hp: 2 + (level / 3 | 0), speed: 1.1 + level * 0.05 });
      }
      if (atkAcc > Math.max(180, 420 - level * 15)) {
        atkAcc = 0;
        let target = null, best = 1e9;
        foes.forEach((f) => { const d = Math.hypot(f.x - player.x, f.y - player.y); if (d < best) { best = d; target = f; } });
        if (target) {
          const a = Math.atan2(target.y - player.y, target.x - player.x);
          bullets.push({ x: player.x, y: player.y, vx: Math.cos(a) * 7, vy: Math.sin(a) * 7, life: 900 });
        }
      }
      bullets.forEach((b) => { b.x += b.vx * k; b.y += b.vy * k; b.life -= dt; });
      bullets = bullets.filter((b) => b.life > 0);
      foes.forEach((f) => {
        const a = Math.atan2(player.y - f.y, player.x - f.x);
        f.x += Math.cos(a) * f.speed * k; f.y += Math.sin(a) * f.speed * k;
        if (Math.hypot(f.x - player.x, f.y - player.y) < f.r + player.r) {
          hp -= 0.35 * k; if (hp <= 0) { phase = "over"; status("倒れた… スコア " + score); }
        }
      });
      bullets.forEach((b) => {
        foes.forEach((f) => {
          if (f.hp <= 0) return;
          if (Math.hypot(b.x - f.x, b.y - f.y) < f.r + 4) {
            f.hp -= 1; b.life = 0; burst(f.x, f.y, M.theme.accent2 || "#ef476f", 6);
            if (f.hp <= 0) { score += 10; xp += 1; xpGems.push({ x: f.x, y: f.y }); }
          }
        });
      });
      foes = foes.filter((f) => f.hp > 0);
      xpGems = xpGems.filter((g) => {
        const d = Math.hypot(g.x - player.x, g.y - player.y);
        if (d < 28) { xp++; if (xp >= 5 + level * 2) levelUp(); return false; }
        g.x += (player.x - g.x) * 0.05; g.y += (player.y - g.y) * 0.05;
        return true;
      });
      hud(score, Math.ceil(hp) + " HP  Lv" + level, phase);
    }
    function draw() {
      ctx.fillStyle = M.theme.board || "#0b1320"; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 30; i++) { ctx.fillStyle = "rgba(255,255,255,.05)"; ctx.fillRect((i * 97) % W, (i * 53) % H, 2, 2); }
      xpGems.forEach((g) => { ctx.fillStyle = "#06d6a0"; ctx.fillRect(g.x - 3, g.y - 3, 6, 6); });
      foes.forEach((f) => { ctx.fillStyle = M.theme.accent2 || "#ef476f"; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); });
      bullets.forEach((b) => { ctx.fillStyle = "#ffd166"; ctx.fillRect(b.x - 2, b.y - 2, 4, 4); });
      ctx.fillStyle = M.theme.accent || "#4cc9f0"; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#222"; ctx.fillRect(20, 20, 200, 10);
      ctx.fillStyle = "#06d6a0"; ctx.fillRect(20, 20, 2 * clamp(hp, 0, 100), 10);
      drawParticles();
      if (phase !== "play") overlay(phase === "over" ? "GAME OVER" : M.brand);
    }
    function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); stepParticles(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
    window.addEventListener("keydown", (e) => { keys[e.key] = true; });
    window.addEventListener("keyup", (e) => { keys[e.key] = false; });
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => {
      if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
      else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
    };
    phase = "ready"; player = { x: W / 2, y: H / 2, r: 14 }; foes = []; draw(); overlay(M.brand);
  }

  // ───────── KIND: tower ─────────
  function bootTower() {
    let towers, foes, bullets, gold, lives, wave, phase, raf, last, spawnLeft, spawnAcc, selected;
    const path = M.params.path || [[40, 240], [200, 240], [200, 100], [400, 100], [400, 360], [620, 360], [620, 240], [700, 240]];
    function start() {
      towers = []; foes = []; bullets = []; gold = 80; lives = 20; wave = 0; phase = "play";
      spawnLeft = 0; spawnAcc = 0; selected = 0;
      last = performance.now(); cancelAnimationFrame(raf); loop(last);
      status("空き地クリックで砲台設置（$40）。波を耐えろ");
      nextWave();
    }
    function nextWave() {
      wave++; spawnLeft = 6 + wave * 2; spawnAcc = 0;
      status("WAVE " + wave);
    }
    function update(dt) {
      if (phase !== "play") return;
      const k = dt / 16;
      if (spawnLeft > 0) {
        spawnAcc += dt;
        if (spawnAcc > 500) {
          spawnAcc = 0; spawnLeft--;
          foes.push({ i: 0, t: 0, hp: 8 + wave * 3, max: 8 + wave * 3, speed: 0.004 + wave * 0.0002, r: 12 });
        }
      } else if (!foes.length) { gold += 25 + wave * 5; nextWave(); }
      foes.forEach((f) => {
        f.t += f.speed * k;
        while (f.t >= 1 && f.i < path.length - 1) { f.t -= 1; f.i++; }
        if (f.i >= path.length - 1) { lives--; f.hp = 0; if (lives <= 0) { phase = "over"; status("拠点陥落"); } }
      });
      foes = foes.filter((f) => f.hp > 0);
      towers.forEach((tw) => {
        tw.cd -= dt;
        if (tw.cd > 0) return;
        let target = null, best = tw.range;
        foes.forEach((f) => {
          const p = pos(f); const d = Math.hypot(p.x - tw.x, p.y - tw.y);
          if (d < best) { best = d; target = f; }
        });
        if (target) {
          const p = pos(target);
          const a = Math.atan2(p.y - tw.y, p.x - tw.x);
          bullets.push({ x: tw.x, y: tw.y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6, dmg: tw.dmg, life: 800 });
          tw.cd = tw.rate;
        }
      });
      bullets.forEach((b) => { b.x += b.vx * k; b.y += b.vy * k; b.life -= dt; });
      bullets.forEach((b) => {
        foes.forEach((f) => {
          const p = pos(f);
          if (Math.hypot(b.x - p.x, b.y - p.y) < f.r) { f.hp -= b.dmg; b.life = 0; if (f.hp <= 0) { gold += 4; scoreAdd(5); burst(p.x, p.y, "#ffd166", 8); } }
        });
      });
      bullets = bullets.filter((b) => b.life > 0);
      hud(window._score || 0, lives + " ❤  $" + gold + "  W" + wave, phase);
    }
    let _score = 0;
    function scoreAdd(n) { _score += n; window._score = _score; }
    function pos(f) {
      const a = path[Math.min(f.i, path.length - 1)];
      const b = path[Math.min(f.i + 1, path.length - 1)];
      return { x: a[0] + (b[0] - a[0]) * f.t, y: a[1] + (b[1] - a[1]) * f.t };
    }
    function draw() {
      ctx.fillStyle = "#1b4332"; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "#95d5b2"; ctx.lineWidth = 34; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      ctx.strokeStyle = "#d8f3dc"; ctx.lineWidth = 18;
      ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      towers.forEach((tw) => {
        ctx.fillStyle = M.theme.accent || "#4cc9f0";
        ctx.beginPath(); ctx.arc(tw.x, tw.y, 16, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.beginPath(); ctx.arc(tw.x, tw.y, tw.range, 0, Math.PI * 2); ctx.stroke();
      });
      foes.forEach((f) => {
        const p = pos(f);
        ctx.fillStyle = "#e63946"; ctx.beginPath(); ctx.arc(p.x, p.y, f.r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#222"; ctx.fillRect(p.x - 12, p.y - 20, 24, 4);
        ctx.fillStyle = "#06d6a0"; ctx.fillRect(p.x - 12, p.y - 20, 24 * (f.hp / f.max), 4);
      });
      bullets.forEach((b) => { ctx.fillStyle = "#ffd166"; ctx.fillRect(b.x - 2, b.y - 2, 4, 4); });
      drawParticles();
      if (phase !== "play") overlay(phase === "over" ? "DEFEAT" : M.brand);
    }
    function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); stepParticles(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
    canvas.addEventListener("click", (e) => {
      if (phase !== "play") return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      if (gold < 40) { status("ゴールド不足"); return; }
      // avoid path roughly
      for (let i = 0; i < path.length - 1; i++) {
        const ax = path[i][0], ay = path[i][1], bx = path[i + 1][0], by = path[i + 1][1];
        const t = clamp(((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2 || 1), 0, 1);
        const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
        if (Math.hypot(x - px, y - py) < 28) { status("進路の上には置けない"); return; }
      }
      if (towers.some((tw) => Math.hypot(tw.x - x, tw.y - y) < 36)) return;
      gold -= 40;
      towers.push({ x, y, range: 110, dmg: 2, rate: 450, cd: 0 });
      status("砲台設置 -$40");
    });
    $("btn-start").onclick = () => { window._score = 0; _score = 0; start(); };
    $("btn-pause").onclick = () => {
      if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
      else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
    };
    phase = "ready"; towers = []; foes = []; draw(); overlay(M.brand);
  }

  // ───────── KIND: word ─────────
  function bootWord() {
    const WORDS = M.params.words || ["VELQUIA", "ARCADE", "PUZZLE", "RHYTHM", "CASTLE", "PLANET", "ROCKET", "GARDEN", "MIRROR", "NIGHTS"];
    const LEN = M.params.len || 5;
    let answer, guesses, row, col, phase, score;
    function start() {
      const pool = WORDS.filter((w) => w.length === LEN);
      answer = pick(pool.length ? pool : WORDS).toUpperCase();
      guesses = Array.from({ length: 6 }, () => Array(LEN).fill(""));
      row = 0; col = 0; phase = "play"; score = 0;
      hud(score, 6 - row + " left", phase); status("英単語を推測（Enterで確定）"); draw();
    }
    function color(ch, i, guess) {
      if (answer[i] === ch) return "#06d6a0";
      if (answer.includes(ch)) return "#ffd166";
      return "#495057";
    }
    function submit() {
      const g = guesses[row].join("");
      if (g.length < LEN) return;
      if (g === answer) { score += (6 - row) * 100; phase = "clear"; status("正解！ " + answer); hud(score, "OK", phase); draw(); return; }
      row++; col = 0;
      if (row >= 6) { phase = "over"; status("正解は " + answer); }
      hud(score, Math.max(0, 6 - row) + " left", phase); draw();
    }
    function draw() {
      ctx.fillStyle = "#101018"; ctx.fillRect(0, 0, W, H);
      const cell = 56, gap = 8;
      const ox = (W - (cell + gap) * LEN + gap) / 2, oy = 48;
      for (let r = 0; r < 6; r++) for (let c = 0; c < LEN; c++) {
        const ch = guesses[r][c];
        const x = ox + c * (cell + gap), y = oy + r * (cell + gap);
        ctx.fillStyle = r < row || (r === row && phase !== "play" && guesses[r].join("").length === LEN)
          ? (ch ? color(ch, c, guesses[r]) : "#222")
          : "#222";
        if (r === row && phase === "play") ctx.fillStyle = "#2b2d42";
        roundRect(x, y, cell, cell, 8);
        ctx.fillStyle = "#fff"; ctx.font = "800 26px Outfit"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(ch || "", x + cell / 2, y + cell / 2 + 1);
      }
      if (phase !== "play") overlay(phase === "clear" ? "CLEAR" : phase === "over" ? answer : M.brand);
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath(); ctx.fill();
    }
    window.addEventListener("keydown", (e) => {
      if (phase !== "play") return;
      if (e.key === "Enter") submit();
      else if (e.key === "Backspace") { if (col > 0) { col--; guesses[row][col] = ""; draw(); } }
      else if (/^[a-zA-Z]$/.test(e.key) && col < LEN) { guesses[row][col++] = e.key.toUpperCase(); draw(); }
    });
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => status("キーボードで入力");
    phase = "ready"; guesses = Array.from({ length: 6 }, () => Array(LEN).fill("")); draw(); overlay(M.brand);
  }

  // ───────── KIND: quiz ─────────
  function bootQuiz() {
    const Q = M.params.questions || [
      { q: "日本の首都は？", a: ["東京", "大阪", "京都", "名古屋"], i: 0 },
      { q: "1+7=？", a: ["6", "7", "8", "9"], i: 2 },
      { q: "水の化学式は？", a: ["CO2", "H2O", "O2", "NaCl"], i: 1 },
      { q: "太陽系で最も大きい惑星は？", a: ["地球", "火星", "木星", "金星"], i: 2 },
      { q: "二进制の 1010 は？", a: ["8", "10", "12", "15"], i: 1 }
    ];
    let idx, score, phase, locked;
    function start() {
      idx = 0; score = 0; phase = "play"; locked = false;
      hud(score, idx + 1 + "/" + Q.length, phase); status(Q[0].q); draw();
    }
    function answer(i) {
      if (phase !== "play" || locked) return;
      locked = true;
      const ok = i === Q[idx].i;
      if (ok) { score += 100; burst(W / 2, H / 2, "#06d6a0", 16); status("正解！"); }
      else status("不正解… 正解は " + Q[idx].a[Q[idx].i]);
      hud(score, idx + 1 + "/" + Q.length, phase); draw();
      setTimeout(() => {
        idx++; locked = false;
        if (idx >= Q.length) { phase = "clear"; status("終了スコア " + score); }
        else status(Q[idx].q);
        hud(score, Math.min(idx + 1, Q.length) + "/" + Q.length, phase); draw();
      }, 700);
    }
    function draw() {
      ctx.fillStyle = "#14213d"; ctx.fillRect(0, 0, W, H);
      if (phase === "ready") { overlay(M.brand); return; }
      const cur = Q[Math.min(idx, Q.length - 1)];
      ctx.fillStyle = "#fff"; ctx.font = "700 22px Zen Maru Gothic,sans-serif"; ctx.textAlign = "center";
      ctx.fillText(cur.q, W / 2, 80);
      cur.a.forEach((t, i) => {
        const y = 140 + i * 70;
        ctx.fillStyle = "rgba(255,255,255,.08)";
        roundRect(160, y, 400, 56, 12);
        ctx.fillStyle = M.theme.accent || "#fca311"; ctx.font = "700 18px Outfit";
        ctx.fillText(t, W / 2, y + 32);
      });
      if (phase === "clear") overlay("SCORE " + score);
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath(); ctx.fill();
    }
    canvas.addEventListener("click", (e) => {
      if (phase !== "play") return;
      const rect = canvas.getBoundingClientRect();
      const y = (e.clientY - rect.top) * (H / rect.height);
      for (let i = 0; i < 4; i++) {
        const top = 140 + i * 70;
        if (y >= top && y <= top + 56) answer(i);
      }
    });
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => status("選択肢をクリック");
    phase = "ready"; draw();
  }

  // ───────── KIND: runner ─────────
  function bootRunner() {
    let lane, obstacles, coins, score, dist, phase, raf, last, spawnAcc, speed, hp;
    function start() {
      lane = 1; obstacles = []; coins = []; score = 0; dist = 0; hp = 3; phase = "play"; spawnAcc = 0; speed = 5;
      last = performance.now(); cancelAnimationFrame(raf); loop(last); status("レーン変更で回避＆コイン");
    }
    function lx(l) { return 160 + l * 160; }
    function update(dt) {
      if (phase !== "play") return;
      const k = dt / 16; dist += speed * k * 0.5; speed = 5 + dist / 180; spawnAcc += dt;
      score = Math.floor(dist) + coins.filter(() => false).length;
      if (spawnAcc > Math.max(320, 800 - dist / 5)) {
        spawnAcc = 0;
        const l = (Math.random() * 3) | 0;
        if (Math.random() < 0.65) obstacles.push({ lane: l, y: -40, h: 40, w: 46 });
        else coins.push({ lane: l, y: -40, r: 12, took: false });
      }
      obstacles.forEach((o) => o.y += speed * k);
      coins.forEach((c) => c.y += speed * k);
      obstacles = obstacles.filter((o) => o.y < 520);
      coins = coins.filter((c) => c.y < 520 && !c.took);
      const py = 380;
      obstacles.forEach((o) => {
        if (o.lane === lane && o.y + o.h > py && o.y < py + 36) {
          o.y = 999; hp--; burst(lx(lane), py, "#ef476f", 12);
          if (hp <= 0) { phase = "over"; status("クラッシュ " + Math.floor(dist) + "m"); }
        }
      });
      coins.forEach((c) => {
        if (!c.took && c.lane === lane && Math.abs(c.y - py) < 30) {
          c.took = true; score += 20; burst(lx(lane), py, "#ffd166", 8);
        }
      });
      hud(score, hp + " HP  " + Math.floor(dist) + "m", phase);
    }
    function draw() {
      ctx.fillStyle = "#212529"; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = i === lane ? "rgba(76,201,240,.12)" : "rgba(255,255,255,.04)";
        ctx.fillRect(lx(i) - 55, 0, 110, H);
      }
      obstacles.forEach((o) => { ctx.fillStyle = "#e63946"; ctx.fillRect(lx(o.lane) - o.w / 2, o.y, o.w, o.h); });
      coins.forEach((c) => { if (c.took) return; ctx.fillStyle = "#ffd166"; ctx.beginPath(); ctx.arc(lx(c.lane), c.y, c.r, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = M.theme.accent || "#4cc9f0"; ctx.fillRect(lx(lane) - 18, 380, 36, 36);
      drawParticles();
      if (phase !== "play") overlay(phase === "over" ? "CRASH" : M.brand);
    }
    function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); stepParticles(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
    window.addEventListener("keydown", (e) => {
      if (phase !== "play") return;
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") lane = Math.max(0, lane - 1);
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") lane = Math.min(2, lane + 1);
    });
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => {
      if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
      else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
    };
    phase = "ready"; draw(); overlay(M.brand);
  }

  // ───────── KIND: card ─────────
  function bootCard() {
    let deck, hand, enemyHp, playerHp, energy, phase, turn, score;
    function start() {
      deck = shuffle((M.params.cards || [
        { n: "Slash", c: 1, d: 5 }, { n: "Bash", c: 2, d: 9 }, { n: "Guard", c: 1, d: 0, blk: 5 },
        { n: "Fire", c: 2, d: 7 }, { n: "Pierce", c: 1, d: 4 }, { n: "Nova", c: 3, d: 14 }
      ]).flatMap((c) => [c, c, c]));
      hand = []; enemyHp = 40; playerHp = 40; energy = 3; phase = "play"; turn = 1; score = 0;
      drawCards(5); hud(score, playerHp + " / " + enemyHp, phase); status("カードをクリックしてプレイ。Eでターン終了"); draw();
    }
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function drawCards(n) { for (let i = 0; i < n && deck.length; i++) hand.push(deck.pop()); }
    function play(i) {
      const c = hand[i]; if (!c || energy < c.c || phase !== "play") return;
      energy -= c.c; hand.splice(i, 1);
      if (c.blk) { playerHp = Math.min(40, playerHp + c.blk); status(c.n + " で防御 +" + c.blk); }
      if (c.d) { enemyHp -= c.d; score += c.d; burst(520, 180, "#ef476f", 10); status(c.n + " で " + c.d + " ダメージ"); }
      if (enemyHp <= 0) { phase = "clear"; score += 200; status("勝利！"); }
      hud(score, playerHp + " / " + Math.max(0, enemyHp), phase); draw();
    }
    function endTurn() {
      if (phase !== "play") return;
      const dmg = 4 + ((turn / 2) | 0);
      playerHp -= dmg; status("敵の攻撃 -" + dmg);
      if (playerHp <= 0) { phase = "over"; status("敗北…"); }
      turn++; energy = 3; drawCards(Math.max(0, 5 - hand.length));
      hud(score, Math.max(0, playerHp) + " / " + Math.max(0, enemyHp), phase); draw();
    }
    function draw() {
      ctx.fillStyle = "#1a0b2e"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#ef476f"; roundRect(460, 80, 180, 160, 16);
      ctx.fillStyle = "#fff"; ctx.font = "800 18px Outfit"; ctx.textAlign = "center";
      ctx.fillText("ENEMY", 550, 130); ctx.fillText(Math.max(0, enemyHp) + " HP", 550, 170);
      ctx.fillStyle = M.theme.accent || "#4cc9f0"; roundRect(80, 80, 180, 160, 16);
      ctx.fillStyle = "#111"; ctx.fillText("YOU", 170, 130); ctx.fillText(Math.max(0, playerHp) + " HP", 170, 170);
      ctx.fillStyle = "#ffd166"; ctx.fillText("Energy " + energy, W / 2, 60);
      hand.forEach((c, i) => {
        const x = 60 + i * 110;
        ctx.fillStyle = "#2b2d42"; roundRect(x, 300, 100, 140, 12);
        ctx.fillStyle = "#fff"; ctx.font = "700 14px Outfit";
        ctx.fillText(c.n, x + 50, 350);
        ctx.fillText("Cost " + c.c, x + 50, 380);
        ctx.fillText(c.d ? "ATK " + c.d : "BLK " + (c.blk || 0), x + 50, 410);
      });
      ctx.fillStyle = "rgba(255,255,255,.1)"; roundRect(560, 300, 120, 50, 10);
      ctx.fillStyle = "#fff"; ctx.fillText("END (E)", 620, 332);
      drawParticles();
      if (phase !== "play") overlay(phase === "clear" ? "VICTORY" : phase === "over" ? "DEFEAT" : M.brand);
    }
    function roundRect(x, y, w, h, r) {
      ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath(); ctx.fill();
    }
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      if (x >= 560 && x <= 680 && y >= 300 && y <= 350) endTurn();
      hand.forEach((_, i) => {
        const cx = 60 + i * 110;
        if (x >= cx && x <= cx + 100 && y >= 300 && y <= 440) play(i);
      });
    });
    window.addEventListener("keydown", (e) => { if (e.key === "e" || e.key === "E") endTurn(); });
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => status("カードまたは END");
    phase = "ready"; hand = []; draw(); overlay(M.brand);
  }

  // ───────── KIND: sudoku ─────────
  function bootSudoku() {
    let board, given, sel, phase, score, mistakes;
    function start() {
      const full = genFull();
      board = full.map((r) => r.slice());
      given = emptyMask(board, M.params.holes || 40);
      for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) if (!given[y][x]) board[y][x] = 0;
      sel = { x: 0, y: 0 }; phase = "play"; score = 0; mistakes = 0;
      hud(score, mistakes + " miss", phase); status("数字キー1-9で入力。ヒントは与えられた数字"); draw();
    }
    function genFull() {
      const b = Array.from({ length: 9 }, () => Array(9).fill(0));
      function ok(y, x, n) {
        for (let i = 0; i < 9; i++) if (b[y][i] === n || b[i][x] === n) return false;
        const y0 = (y / 3 | 0) * 3, x0 = (x / 3 | 0) * 3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) if (b[y0 + i][x0 + j] === n) return false;
        return true;
      }
      function fill(pos) {
        if (pos === 81) return true;
        const y = pos / 9 | 0, x = pos % 9;
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const n of nums) {
          if (!ok(y, x, n)) continue;
          b[y][x] = n; if (fill(pos + 1)) return true; b[y][x] = 0;
        }
        return false;
      }
      fill(0); return b;
    }
    function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
    function emptyMask(full, holes) {
      const g = full.map((r) => r.map(() => true));
      let h = holes; while (h > 0) {
        const x = (Math.random() * 9) | 0, y = (Math.random() * 9) | 0;
        if (g[y][x]) { g[y][x] = false; h--; }
      }
      return g;
    }
    function draw() {
      ctx.fillStyle = "#f8f9fa"; ctx.fillRect(0, 0, W, H);
      const cell = 44, ox = (W - cell * 9) / 2, oy = 40;
      for (let y = 0; y < 9; y++) for (let x = 0; x < 9; x++) {
        const px = ox + x * cell, py = oy + y * cell;
        ctx.fillStyle = sel.x === x && sel.y === y ? "#cce3de" : ((x / 3 | 0) + (y / 3 | 0)) % 2 ? "#e9ecef" : "#fff";
        ctx.fillRect(px, py, cell - 1, cell - 1);
        if (board[y][x]) {
          ctx.fillStyle = given[y][x] ? "#212529" : "#1d4e89";
          ctx.font = "700 22px Outfit"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText(String(board[y][x]), px + cell / 2, py + cell / 2 + 1);
        }
      }
      ctx.strokeStyle = "#212529"; ctx.lineWidth = 2;
      for (let i = 0; i <= 9; i++) {
        ctx.lineWidth = i % 3 === 0 ? 3 : 1;
        ctx.beginPath(); ctx.moveTo(ox, oy + i * cell); ctx.lineTo(ox + 9 * cell, oy + i * cell); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(ox + i * cell, oy); ctx.lineTo(ox + i * cell, oy + 9 * cell); ctx.stroke();
      }
      if (phase !== "play") overlay(phase === "clear" ? "CLEAR" : M.brand);
    }
    canvas.addEventListener("click", (e) => {
      if (phase !== "play") return;
      const rect = canvas.getBoundingClientRect();
      const cell = 44, ox = (W - cell * 9) / 2, oy = 40;
      const x = Math.floor(((e.clientX - rect.left) * (W / rect.width) - ox) / cell);
      const y = Math.floor(((e.clientY - rect.top) * (H / rect.height) - oy) / cell);
      if (x >= 0 && y >= 0 && x < 9 && y < 9) { sel = { x, y }; draw(); }
    });
    window.addEventListener("keydown", (e) => {
      if (phase !== "play") return;
      if (given[sel.y][sel.x]) return;
      if (e.key >= "1" && e.key <= "9") {
        const n = +e.key;
        // check against solution by validating rules only
        board[sel.y][sel.x] = n;
        score += 10; hud(score, mistakes + " miss", phase);
        if (board.every((r) => r.every(Boolean)) && validAll()) { phase = "clear"; score += 500; status("完成！"); }
        draw();
      }
      if (e.key === "Backspace" || e.key === "0") { board[sel.y][sel.x] = 0; draw(); }
    });
    function validAll() {
      const ok = (arr) => new Set(arr).size === 9 && arr.every((n) => n >= 1 && n <= 9);
      for (let i = 0; i < 9; i++) if (!ok(board[i]) || !ok(board.map((r) => r[i]))) return false;
      for (let by = 0; by < 3; by++) for (let bx = 0; bx < 3; bx++) {
        const block = [];
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) block.push(board[by * 3 + i][bx * 3 + j]);
        if (!ok(block)) return false;
      }
      return true;
    }
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => status("マス選択→数字キー");
    phase = "ready"; board = Array.from({ length: 9 }, () => Array(9).fill(0)); given = board.map((r) => r.map(() => false)); sel = { x: 0, y: 0 }; draw(); overlay(M.brand);
  }

  // ───────── KIND: farm ─────────
  function bootFarm() {
    const N = 6; let tiles, coins, day, phase, selected, raf, last, acc;
    const CROPS = M.params.crops || [
      { name: "Wheat", grow: 4000, sell: 8, cost: 2, color: "#ffd166" },
      { name: "Berry", grow: 6000, sell: 14, cost: 4, color: "#ef476f" },
      { name: "Pump", grow: 9000, sell: 28, cost: 8, color: "#f4a261" }
    ];
    function start() {
      tiles = Array.from({ length: N * N }, () => ({ crop: null, t: 0 }));
      coins = 20; day = 1; phase = "play"; selected = 0; acc = 0;
      last = performance.now(); cancelAnimationFrame(raf); loop(last);
      status("畑をクリックして植え付け。成熟で収穫");
    }
    function update(dt) {
      if (phase !== "play") return;
      tiles.forEach((t) => { if (t.crop != null && t.t < CROPS[t.crop].grow) t.t += dt; });
      acc += dt; if (acc > 15000) { acc = 0; day++; coins += 2; status("Day " + day + " 朝ボーナス +2"); }
      hud(coins, "Day " + day, phase);
    }
    function draw() {
      ctx.fillStyle = "#2d6a4f"; ctx.fillRect(0, 0, W, H);
      const cell = 60, ox = 40, oy = 40;
      tiles.forEach((t, i) => {
        const x = ox + (i % N) * cell, y = oy + (i / N | 0) * cell;
        ctx.fillStyle = "#40916c"; ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);
        if (t.crop != null) {
          const c = CROPS[t.crop]; const p = clamp(t.t / c.grow, 0, 1);
          ctx.fillStyle = c.color; ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, 8 + p * 12, 0, Math.PI * 2); ctx.fill();
          if (p >= 1) { ctx.strokeStyle = "#fff"; ctx.stroke(); }
        }
      });
      CROPS.forEach((c, i) => {
        const y = 40 + i * 70;
        ctx.fillStyle = selected === i ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.25)";
        ctx.fillRect(460, y, 220, 60);
        ctx.fillStyle = c.color; ctx.fillRect(470, y + 15, 30, 30);
        ctx.fillStyle = "#fff"; ctx.font = "700 14px Outfit"; ctx.textAlign = "left";
        ctx.fillText(`${c.name}  $${c.cost} → $${c.sell}`, 515, y + 35);
      });
      drawParticles();
      if (phase !== "play") overlay(M.brand);
    }
    function loop(t) { const dt = Math.min(40, t - last); last = t; update(dt); stepParticles(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
    canvas.addEventListener("click", (e) => {
      if (phase !== "play") return;
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (W / rect.width);
      const y = (e.clientY - rect.top) * (H / rect.height);
      CROPS.forEach((_, i) => { if (x >= 460 && x <= 680 && y >= 40 + i * 70 && y <= 100 + i * 70) selected = i; });
      const cell = 60, ox = 40, oy = 40;
      const tx = Math.floor((x - ox) / cell), ty = Math.floor((y - oy) / cell);
      if (tx < 0 || ty < 0 || tx >= N || ty >= N) return;
      const t = tiles[ty * N + tx];
      if (t.crop != null && t.t >= CROPS[t.crop].grow) {
        coins += CROPS[t.crop].sell; burst(ox + tx * cell + 30, oy + ty * cell + 30, CROPS[t.crop].color, 12);
        t.crop = null; t.t = 0; status("収穫！");
      } else if (t.crop == null) {
        const c = CROPS[selected];
        if (coins < c.cost) { status("お金が足りない"); return; }
        coins -= c.cost; t.crop = selected; t.t = 0;
      }
      hud(coins, "Day " + day, phase);
    });
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => {
      if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
      else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
    };
    phase = "ready"; tiles = []; draw(); overlay(M.brand);
  }

  // ───────── KIND: dodge (bullet hell lite) ─────────
  function bootDodge() {
    let player, bullets, score, phase, keys, raf, last, spawnAcc, hp;
    function start() {
      player = { x: W / 2, y: H - 60, r: 12, speed: 4 };
      bullets = []; score = 0; hp = 3; phase = "play"; keys = {}; spawnAcc = 0;
      last = performance.now(); cancelAnimationFrame(raf); loop(last);
      status("弾幕を避けろ。接触でダメージ");
    }
    function update(dt) {
      if (phase !== "play") return;
      const k = dt / 16;
      if (keys.ArrowLeft || keys.a || keys.A) player.x -= player.speed * k;
      if (keys.ArrowRight || keys.d || keys.D) player.x += player.speed * k;
      if (keys.ArrowUp || keys.w || keys.W) player.y -= player.speed * k;
      if (keys.ArrowDown || keys.s || keys.S) player.y += player.speed * k;
      player.x = clamp(player.x, 16, W - 16); player.y = clamp(player.y, 16, H - 16);
      spawnAcc += dt; score += dt * 0.01;
      const rate = Math.max(40, 160 - score * 0.5);
      if (spawnAcc > rate) {
        spawnAcc = 0;
        const patterns = M.params.pattern || "fan";
        if (patterns === "rain" || Math.random() < 0.5) {
          bullets.push({ x: rand(20, W - 20), y: -10, vx: rand(-0.5, 0.5), vy: rand(2.2, 3.8), r: 5 });
        } else {
          const cx = rand(80, W - 80);
          for (let i = -2; i <= 2; i++) {
            const a = Math.PI / 2 + i * 0.22;
            bullets.push({ x: cx, y: -8, vx: Math.cos(a) * 2.6, vy: Math.sin(a) * 2.6, r: 5 });
          }
        }
      }
      bullets.forEach((b) => { b.x += b.vx * k; b.y += b.vy * k; });
      bullets = bullets.filter((b) => b.y < H + 20 && b.x > -20 && b.x < W + 20);
      bullets.forEach((b) => {
        if (Math.hypot(b.x - player.x, b.y - player.y) < b.r + player.r) {
          b.y = H + 99; hp--; burst(player.x, player.y, "#ef476f", 10);
          if (hp <= 0) { phase = "over"; status("被弾オーバー スコア " + Math.floor(score)); }
        }
      });
      hud(Math.floor(score), hp + " HP", phase);
    }
    function draw() {
      ctx.fillStyle = M.theme.board || "#0a0a12"; ctx.fillRect(0, 0, W, H);
      bullets.forEach((b) => { ctx.fillStyle = M.theme.accent2 || "#f72585"; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = M.theme.accent || "#4cc9f0"; ctx.beginPath(); ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2); ctx.fill();
      drawParticles();
      if (phase !== "play") overlay(phase === "over" ? "GAME OVER" : M.brand);
    }
    function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); stepParticles(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
    window.addEventListener("keydown", (e) => { keys[e.key] = true; });
    window.addEventListener("keyup", (e) => { keys[e.key] = false; });
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => {
      if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
      else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
    };
    phase = "ready"; player = { x: W / 2, y: H - 60, r: 12 }; bullets = []; draw(); overlay(M.brand);
  }

  // ───────── KIND: catch (timing / falling catch) ─────────
  function bootCatch() {
    let basket, falls, score, miss, phase, raf, last, spawnAcc, keys;
    function start() {
      basket = { x: W / 2, w: 70, y: H - 40 }; falls = []; score = 0; miss = 0; phase = "play"; spawnAcc = 0; keys = {};
      last = performance.now(); cancelAnimationFrame(raf); loop(last);
      status("落ちてくるものを受け止めろ。3ミスで終了");
    }
    function update(dt) {
      if (phase !== "play") return;
      const k = dt / 16;
      if (keys.ArrowLeft || keys.a || keys.A) basket.x -= 6 * k;
      if (keys.ArrowRight || keys.d || keys.D) basket.x += 6 * k;
      basket.x = clamp(basket.x, basket.w / 2, W - basket.w / 2);
      spawnAcc += dt;
      if (spawnAcc > Math.max(280, 700 - score * 2)) {
        spawnAcc = 0;
        const good = Math.random() > 0.18;
        falls.push({ x: rand(40, W - 40), y: -20, vy: rand(2.5, 4.2), r: 12, good, color: good ? (M.theme.accent || "#06d6a0") : "#ef476f" });
      }
      falls.forEach((f) => { f.y += f.vy * k; });
      falls = falls.filter((f) => {
        if (f.y > H + 20) { if (f.good) { miss++; if (miss >= 3) { phase = "over"; status("ミス過多"); } } return false; }
        if (f.y > basket.y - 10 && f.y < basket.y + 20 && Math.abs(f.x - basket.x) < basket.w / 2) {
          if (f.good) { score += 10; burst(f.x, f.y, f.color, 8); }
          else { miss++; burst(f.x, f.y, "#ef476f", 8); if (miss >= 3) { phase = "over"; status("毒をキャッチ…"); } }
          return false;
        }
        return true;
      });
      hud(score, miss + "/3 miss", phase);
    }
    function draw() {
      ctx.fillStyle = M.theme.board || "#1b263b"; ctx.fillRect(0, 0, W, H);
      falls.forEach((f) => { ctx.fillStyle = f.color; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); });
      ctx.fillStyle = M.theme.accent2 || "#ffd166";
      ctx.fillRect(basket.x - basket.w / 2, basket.y, basket.w, 16);
      drawParticles();
      if (phase !== "play") overlay(phase === "over" ? "GAME OVER" : M.brand);
    }
    function loop(t) { const dt = Math.min(32, t - last); last = t; update(dt); stepParticles(dt); draw(); if (phase === "play") raf = requestAnimationFrame(loop); }
    window.addEventListener("keydown", (e) => { keys[e.key] = true; });
    window.addEventListener("keyup", (e) => { keys[e.key] = false; });
    $("btn-start").onclick = start;
    $("btn-pause").onclick = () => {
      if (phase === "play") { phase = "pause"; cancelAnimationFrame(raf); status("一時停止"); draw(); }
      else if (phase === "pause") { phase = "play"; last = performance.now(); loop(last); }
    };
    phase = "ready"; basket = { x: W / 2, w: 70, y: H - 40 }; falls = []; draw(); overlay(M.brand);
  }

  const boots = {
    merge: bootMerge,
    idle: bootIdle,
    survivor: bootSurvivor,
    tower: bootTower,
    word: bootWord,
    quiz: bootQuiz,
    runner: bootRunner,
    card: bootCard,
    sudoku: bootSudoku,
    farm: bootFarm,
    dodge: bootDodge,
    catch: bootCatch
  };

  const boot = boots[M.kind];
  if (!boot) {
    status("Unknown kind: " + M.kind);
    return;
  }
  boot();
})();
