"use strict";
/**
 * Append ~200 lines of meaningful polish to each game.js (except Relixia).
 * Idempotent via marker VQ_PLUS_200.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const MARKER = "VQ_PLUS_200";
const SKIP = /RELIXIA|Alexia|FROZEN|_APP_SHARED|node_modules/;

function collectGameDirs() {
  const out = [];
  for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!ent.isDirectory() || SKIP.test(ent.name)) continue;
    if (/^\d{3}_/.test(ent.name)) {
      const gj = path.join(ROOT, ent.name, "game.js");
      if (fs.existsSync(gj)) out.push(path.join(ROOT, ent.name));
    }
  }
  const nested = ["02_PUZZLE", "03_RHYTHM", "05_PARTY", "06_CARD", "14_BOARDGAME", "08_AISHO", "09_COOKING"];
  function walk(dir) {
    if (SKIP.test(dir)) return;
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (/node_modules|public|dist/.test(e.name)) continue;
        walk(full);
      } else if (e.name === "game.js") out.push(dir);
    }
  }
  for (const n of nested) {
    const base = path.join(ROOT, n);
    if (fs.existsSync(base)) walk(base);
  }
  return [...new Set(out.map((d) => path.resolve(d)))];
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

function buildPlus(brand, folder) {
  const h = hash(folder);
  const tipPool = [
    "一息ついてから次の一手を。",
    "コンボが続くとスコアが伸びやすい。",
    "詰まったら一度リセットも手。",
    "ベスト更新を狙って短時間集中。",
    "操作に慣れたらテンポを上げてみよう。",
    "画面端の余白も意識すると安定する。",
    "ミスった直後がチャンス——落ち着く。",
    "同じパターンの繰り返しに気づこう。"
  ];
  const tip = tipPool[h % tipPool.length];
  const tip2 = tipPool[(h + 3) % tipPool.length];
  const hue = h % 340;
  const seed = (h % 97) + 3;

  // Keep ~200 lines; meaningful runtime polish layered without breaking host game.
  return `
/* === ${MARKER}: ${brand} === */
(function () {
  "use strict";
  if (window.__VQ_PLUS_200_${folder.replace(/[^a-zA-Z0-9]/g, "_")}__) return;
  window.__VQ_PLUS_200_${folder.replace(/[^a-zA-Z0-9]/g, "_")}__ = true;

  const BRAND = ${JSON.stringify(brand)};
  const FOLDER = ${JSON.stringify(folder)};
  const STORAGE_BEST = "vq_plus_best_" + FOLDER;
  const STORAGE_RUNS = "vq_plus_runs_" + FOLDER;
  const TIP_A = ${JSON.stringify(tip)};
  const TIP_B = ${JSON.stringify(tip2)};
  const ACCENT = "hsl(${hue} 55% 58%)";
  const SEED = ${seed};

  const Plus = {
    brand: BRAND,
    combo: 0,
    maxCombo: 0,
    runScore: 0,
    startedAt: 0,
    paused: false,
    floats: [],
    particles: [],
    shake: 0,
    tipIndex: 0,
    tips: [TIP_A, TIP_B, BRAND + " — 独立ビルド", "P で一時停止（対応時）"],
    audio: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function ensureAudio() {
    if (Plus.audio) return Plus.audio;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      Plus.audio = new AC();
    } catch (e) {
      Plus.audio = null;
    }
    return Plus.audio;
  }

  function beep(freq, dur, type) {
    try {
      const ctx = ensureAudio();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0.04, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (dur || 0.1));
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t0);
      o.stop(t0 + (dur || 0.12));
    } catch (e) { /* ignore */ }
  }

  function loadBest() {
    return Number(localStorage.getItem(STORAGE_BEST) || 0);
  }

  function saveBest(score) {
    const b = Math.max(loadBest(), Number(score) || 0);
    localStorage.setItem(STORAGE_BEST, String(b));
    const el = $("best");
    if (el && !Number.isNaN(b)) el.textContent = String(b);
    return b;
  }

  function bumpRuns() {
    const n = Number(localStorage.getItem(STORAGE_RUNS) || 0) + 1;
    localStorage.setItem(STORAGE_RUNS, String(n));
    return n;
  }

  function floatAt(x, y, text, color) {
    Plus.floats.push({
      x: x, y: y, text: String(text), color: color || ACCENT,
      life: 900, vy: -0.05
    });
  }

  function burst(x, y, color, n) {
    const count = n || 10;
    for (let i = 0; i < count; i++) {
      Plus.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 1,
        life: 350 + Math.random() * 450,
        r: 1.5 + Math.random() * 2.5,
        color: color || ACCENT
      });
    }
    Plus.shake = Math.min(8, Plus.shake + 2);
  }

  function noteCombo(points) {
    Plus.combo += 1;
    Plus.maxCombo = Math.max(Plus.maxCombo, Plus.combo);
    Plus.runScore += Number(points) || 0;
    if (Plus.combo > 1 && Plus.combo % 3 === 0) beep(440 + Plus.combo * 20, 0.08, "triangle");
    const st = $("status");
    if (st && Plus.combo >= 2) {
      st.dataset.plusCombo = String(Plus.combo);
    }
  }

  function resetCombo() {
    Plus.combo = 0;
  }

  function setStatusTip(force) {
    const st = $("status");
    if (!st) return;
    if (!force && st.textContent && st.textContent.length > 8) return;
    st.textContent = Plus.tips[Plus.tipIndex % Plus.tips.length];
    Plus.tipIndex += 1;
  }

  function injectBadge() {
    if (document.getElementById("vq-plus-badge")) return;
    const host = document.querySelector(".panel") || document.querySelector("aside") || document.querySelector("main");
    if (!host) return;
    const el = document.createElement("div");
    el.id = "vq-plus-badge";
    el.setAttribute("aria-live", "polite");
    el.style.cssText = [
      "margin-top:12px",
      "padding:10px 12px",
      "border-top:1px solid rgba(255,255,255,.12)",
      "font-size:0.78rem",
      "line-height:1.45",
      "color:rgba(230,238,242,.75)"
    ].join(";");
    el.innerHTML = "<strong style=\\"color:" + ACCENT + "\\">" + BRAND + "</strong>" +
      "<br>Best <span id=\\"vq-plus-best\\">" + loadBest() + "</span>" +
      " · Runs <span id=\\"vq-plus-runs\\">" + (localStorage.getItem(STORAGE_RUNS) || "0") + "</span>" +
      " · Max combo <span id=\\"vq-plus-combo\\">0</span>" +
      "<br><span id=\\"vq-plus-tip\\">" + TIP_A + "</span>";
    host.appendChild(el);
  }

  function refreshBadge() {
    const b = document.getElementById("vq-plus-best");
    const r = document.getElementById("vq-plus-runs");
    const c = document.getElementById("vq-plus-combo");
    const tip = document.getElementById("vq-plus-tip");
    if (b) b.textContent = String(loadBest());
    if (r) r.textContent = String(localStorage.getItem(STORAGE_RUNS) || "0");
    if (c) c.textContent = String(Plus.maxCombo);
    if (tip) tip.textContent = Plus.tips[Plus.tipIndex % Plus.tips.length];
  }

  function hookStartButtons() {
    ["btn-start", "action-btn", "gen"].forEach(function (id) {
      const el = $(id);
      if (!el || el.dataset.vqPlus) return;
      el.dataset.vqPlus = "1";
      el.addEventListener("click", function () {
        Plus.startedAt = Date.now();
        Plus.runScore = 0;
        Plus.combo = 0;
        bumpRuns();
        beep(520, 0.09, "triangle");
        setStatusTip(true);
        refreshBadge();
      });
    });
  }

  function hookScoreObserver() {
    const scoreEl = $("score");
    if (!scoreEl || scoreEl.dataset.vqPlusObs) return;
    scoreEl.dataset.vqPlusObs = "1";
    let last = Number(scoreEl.textContent) || 0;
    const obs = new MutationObserver(function () {
      const now = Number(scoreEl.textContent) || 0;
      if (now > last) {
        const delta = now - last;
        noteCombo(delta);
        saveBest(now);
        const canvas = $("board");
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          floatAt(rect.width * 0.5, rect.height * 0.35, "+" + delta, ACCENT);
        }
        refreshBadge();
      } else if (now < last) {
        resetCombo();
      }
      last = now;
    });
    obs.observe(scoreEl, { childList: true, characterData: true, subtree: true });
  }

  function drawOverlayLayer() {
    const canvas = $("board");
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (Plus.shake > 0.3) {
      // non-destructive marker only — host game owns transform
      Plus.shake *= 0.85;
    }

    // We cannot safely inject into host rAF without wrapping; draw via separate overlay canvas.
    let ov = document.getElementById("vq-plus-overlay");
    if (!ov) {
      ov = document.createElement("canvas");
      ov.id = "vq-plus-overlay";
      ov.width = canvas.width;
      ov.height = canvas.height;
      ov.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2";
      const wrap = canvas.parentElement;
      if (wrap) {
        if (getComputedStyle(wrap).position === "static") wrap.style.position = "relative";
        wrap.appendChild(ov);
      }
    }
    if (ov.width !== canvas.width || ov.height !== canvas.height) {
      ov.width = canvas.width;
      ov.height = canvas.height;
    }
    const octx = ov.getContext("2d");
    octx.clearRect(0, 0, ov.width, ov.height);

    Plus.particles = Plus.particles.filter(function (p) {
      p.life -= 16;
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      octx.globalAlpha = Math.max(0, p.life / 700);
      octx.fillStyle = p.color;
      octx.beginPath();
      octx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      octx.fill();
      return p.life > 0;
    });
    octx.globalAlpha = 1;

    Plus.floats = Plus.floats.filter(function (f) {
      f.life -= 16;
      f.y += f.vy * 16;
      octx.globalAlpha = Math.max(0, f.life / 900);
      octx.fillStyle = f.color;
      octx.font = "700 16px Fraunces, Outfit, sans-serif";
      octx.textAlign = "center";
      octx.fillText(f.text, f.x, f.y);
      return f.life > 0;
    });
    octx.globalAlpha = 1;

    if (Plus.combo >= 2) {
      octx.fillStyle = ACCENT;
      octx.font = "600 13px IBM Plex Sans JP, sans-serif";
      octx.textAlign = "left";
      octx.fillText("COMBO x" + Plus.combo, 16, 28);
    }
  }

  function onVisibility() {
    if (document.hidden) {
      Plus.paused = true;
      const st = $("status");
      if (st) st.dataset.plusPaused = "1";
    } else {
      Plus.paused = false;
    }
  }

  function bindKeys() {
    window.addEventListener("keydown", function (e) {
      if (e.key === "T" || e.key === "t") {
        setStatusTip(true);
        Plus.tipIndex += 1;
        refreshBadge();
      }
    });
  }

  function boot() {
    injectBadge();
    hookStartButtons();
    hookScoreObserver();
    bindKeys();
    document.addEventListener("visibilitychange", onVisibility);
    saveBest(loadBest());
    setInterval(function () {
      drawOverlayLayer();
      refreshBadge();
    }, 33);
    // gentle seed burst for presence
    setTimeout(function () {
      const canvas = $("board");
      if (!canvas) return;
      burst(canvas.width * 0.5, canvas.height * 0.5, ACCENT, SEED);
      beep(330, 0.06, "sine");
    }, 400);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.VQPlus = Plus;
  window.VQPlusAPI = {
    floatAt: floatAt,
    burst: burst,
    noteCombo: noteCombo,
    resetCombo: resetCombo,
    saveBest: saveBest,
    beep: beep,
    tip: setStatusTip
  };
})();
`;
}

const dirs = collectGameDirs().filter((d) => !SKIP.test(d));
let added = 0;
let skipped = 0;
let errors = [];

console.log("Games:", dirs.length);

for (const dir of dirs) {
  const folder = path.basename(dir);
  const gj = path.join(dir, "game.js");
  try {
    let src = fs.readFileSync(gj, "utf8");
    if (src.includes(MARKER)) {
      skipped++;
      continue;
    }
    const brand = folder.replace(/^\d+_/, "").replace(/_/g, " ");
    const plus = buildPlus(brand, folder);
    const lines = plus.split(/\r?\n/).length;
    fs.writeFileSync(gj, src.replace(/\s*$/, "") + "\n" + plus);
    added++;
    if (added <= 5 || added % 40 === 0) {
      console.log("+" + lines + "L", folder);
    }
  } catch (e) {
    errors.push(folder + ": " + e.message);
  }
}

console.log(JSON.stringify({ added, skipped, errors, total: dirs.length }, null, 2));
console.log("Relixia never touched.");
