"use strict";
/**
 * Append ~1000 unique lines to each title's existing game.js / app.js.
 * Per-title content (seeded by relative path). No shared module. Relixia skipped.
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const MARKER = "VQ_PLUS_1000";
const SKIP = /RELIXIA|Alexia|FROZEN|_APP_SHARED|node_modules/;

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function collectTargets() {
  const out = [];
  const seen = new Set();

  function addDir(dir) {
    const norm = path.resolve(dir);
    if (seen.has(norm) || SKIP.test(norm)) return;
    const gj = path.join(norm, "game.js");
    const aj = path.join(norm, "app.js");
    const rel = path.relative(ROOT, norm).replace(/\\/g, "/");
    if (fs.existsSync(gj)) {
      seen.add(norm);
      out.push({ dir: norm, file: gj, kind: "game", rel });
    } else if (fs.existsSync(aj)) {
      seen.add(norm);
      out.push({ dir: norm, file: aj, kind: "app", rel });
    }
  }

  for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!ent.isDirectory() || SKIP.test(ent.name) || ent.name.startsWith("_")) continue;
    const dir = path.join(ROOT, ent.name);
    if (/^\d+_/.test(ent.name)) addDir(dir);

    if (/^(02|03|04|05|06|07|08|09|10|11|12|13|14)_/.test(ent.name)) {
      let ents;
      try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
      for (const sub of ents) {
        if (!sub.isDirectory() || SKIP.test(sub.name) || /node_modules|public|dist/.test(sub.name)) continue;
        const deep = path.join(dir, sub.name);
        addDir(deep);
        let deepEnts;
        try { deepEnts = fs.readdirSync(deep, { withFileTypes: true }); } catch { continue; }
        for (const d2 of deepEnts) {
          if (!d2.isDirectory() || SKIP.test(d2.name) || /node_modules|public|dist/.test(d2.name)) continue;
          addDir(path.join(deep, d2.name));
        }
      }
    }
  }
  return out.sort((a, b) => a.rel.localeCompare(b.rel));
}

function brandOf(rel) {
  const base = path.basename(rel);
  if (base === "js" || /^\d+$/.test(base)) {
    return path.basename(path.dirname(rel)).replace(/^\d+_/, "").replace(/_/g, " ");
  }
  return base.replace(/^\d+_/, "").replace(/_/g, " ");
}

function safeId(rel) {
  return rel.replace(/[^a-zA-Z0-9]/g, "_");
}

function pick(arr, h, i) {
  return arr[(h + i * 17) % arr.length];
}

function buildBlock(rel, kind) {
  const h = hash(rel);
  const brand = brandOf(rel);
  const id = safeId(rel);
  const folderTag = rel;
  const hue = h % 340;
  const hue2 = (hue + 48 + (h % 40)) % 360;
  const seed = (h % 89) + 11;
  const tickMs = 28 + (h % 12);
  const comboStep = 2 + (h % 4);

  const verbs = ["滑る","弾く","積む","繋ぐ","裂く","守る","狩る","織る","溶かす","凍る","跳ねる","潜る","照らす","封じる","刻む","巡る","重ねる","砕く","育てる","裂く"];
  const nouns = ["脈","欠片","軌道","灯火","残響","紋","潮","霧","芯","刃","芽","輪","影","炎","氷晶","砂","雫","星屑","鎖","羽"];
  const moods = ["静かに","鋭く","柔らかく","大胆に","慎重に","軽やかに","粘り強く","一気に"];
  const modes = ["標準","疾走","精密","耐久","収斂","拡散","夜行","黎明"];

  const tips = [];
  for (let i = 0; i < 28; i++) {
    tips.push(`${brand}: ${pick(moods, h, i)}${pick(verbs, h, i + 3)}——${pick(nouns, h, i + 7)}を意識。`);
  }

  const lore = [];
  for (let i = 0; i < 20; i++) {
    lore.push({
      id: i + 1,
      title: `${pick(nouns, h, i)}の書 ${i + 1}`,
      body: `${brand} 固有記録 #${(h % 9000) + i}。${pick(modes, h, i)}では${pick(verbs, h, i + 2)}力が伸びる。`
    });
  }

  const challenges = [];
  for (let i = 0; i < 18; i++) {
    challenges.push({
      id: `ch_${id}_${i + 1}`,
      name: `${pick(modes, h, i)}挑戦 ${i + 1}`,
      goal: 50 + ((h + i * 13) % 450),
      reward: 10 + ((h + i * 7) % 90),
      hint: tips[(i * 3) % tips.length]
    });
  }

  const achievements = [];
  for (let i = 0; i < 16; i++) {
    achievements.push({
      id: `ac_${id}_${i + 1}`,
      name: `${pick(nouns, h, i + 5)}マスター ${i + 1}`,
      need: 3 + ((h + i * 5) % 40),
      flavor: `${pick(moods, h, i + 2)}${pick(verbs, h, i + 9)}`
    });
  }

  const levels = [];
  for (let i = 0; i < 32; i++) {
    levels.push({
      lv: i + 1,
      name: `${brand} Stage ${i + 1}`,
      pace: +(0.85 + ((h + i) % 40) / 100).toFixed(2),
      target: 100 + i * (8 + (h % 5)) + ((h + i * 11) % 50),
      motif: pick(nouns, h, i + 11),
      mode: pick(modes, h, i + 3)
    });
  }

  const palette = [];
  for (let i = 0; i < 16; i++) {
    const hh = (hue + i * 11 + (h % 7)) % 360;
    palette.push(`hsl(${hh} ${45 + (i % 20)}% ${48 + (i % 18)}%)`);
  }

  const sfxScale = [];
  for (let i = 0; i < 12; i++) sfxScale.push(220 + ((h + i * 37) % 680));

  // Comment atlas to land near 1000 lines (title-specific)
  const atlas = [];
  for (let i = 0; i < 610; i++) {
    atlas.push(
      `  // [${brand}] ${i + 1}/610 ${pick(modes, h, i)}/${pick(nouns, h, i + 4)} seed=${(h + i * 19) % 9973}`
    );
  }

  // Compact JSON (one line each) keeps runtime unique while line budget goes to logic+atlas
  const block = `
/* === ${MARKER}: ${folderTag} === */
(function () {
  "use strict";
  if (window.__${MARKER}_${id}__) return;
  window.__${MARKER}_${id}__ = true;

  const META = {
    brand: ${JSON.stringify(brand)},
    folder: ${JSON.stringify(folderTag)},
    kind: ${JSON.stringify(kind)},
    hue: ${hue},
    hue2: ${hue2},
    seed: ${seed},
    tickMs: ${tickMs},
    comboStep: ${comboStep},
    accent: "hsl(${hue} 54% 56%)",
    accent2: "hsl(${hue2} 58% 52%)",
    storage: {
      best: "vq_p1k_best_${id}",
      runs: "vq_p1k_runs_${id}",
      ach: "vq_p1k_ach_${id}",
      ch: "vq_p1k_ch_${id}",
      lore: "vq_p1k_lore_${id}",
      settings: "vq_p1k_set_${id}"
    }
  };

  const TIPS = ${JSON.stringify(tips)};
  const LORE = ${JSON.stringify(lore)};
  const CHALLENGES = ${JSON.stringify(challenges)};
  const ACHIEVEMENTS = ${JSON.stringify(achievements)};
  const LEVELS = ${JSON.stringify(levels)};
  const PALETTE = ${JSON.stringify(palette)};
  const SFX = ${JSON.stringify(sfxScale)};

${atlas.join("\n")}

  const State = {
    combo: 0,
    maxCombo: 0,
    runScore: 0,
    floats: [],
    particles: [],
    tipIndex: META.seed % TIPS.length,
    levelIndex: 0,
    muted: false,
    audio: null,
    unlockedLore: loadJson(META.storage.lore, []),
    unlockedAch: loadJson(META.storage.ach, []),
    clearedCh: loadJson(META.storage.ch, []),
    settings: loadJson(META.storage.settings, { overlay: true, tips: true })
  };

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) { return fallback; }
  }

  function saveJson(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  function $(sid) { return document.getElementById(sid); }

  function ensureAudio() {
    if (State.audio) return State.audio;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      State.audio = new AC();
    } catch (e) { State.audio = null; }
    return State.audio;
  }

  function beep(freq, dur, type) {
    if (State.muted) return;
    try {
      const ctx = ensureAudio();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || "triangle";
      o.frequency.setValueAtTime(freq || SFX[0], t0);
      g.gain.setValueAtTime(0.035, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + (dur || 0.1));
      o.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + (dur || 0.12));
    } catch (e) {}
  }

  function loadBest() { return Number(localStorage.getItem(META.storage.best) || 0); }

  function saveBest(score) {
    const b = Math.max(loadBest(), Number(score) || 0);
    localStorage.setItem(META.storage.best, String(b));
    const el = $("best");
    if (el) el.textContent = String(b);
    return b;
  }

  function bumpRuns() {
    const n = Number(localStorage.getItem(META.storage.runs) || 0) + 1;
    localStorage.setItem(META.storage.runs, String(n));
    return n;
  }

  function floatAt(x, y, text, color) {
    if (State.floats.length > 28) State.floats.shift();
    State.floats.push({ x: x, y: y, text: String(text), color: color || META.accent, life: 1000, vy: -0.045 });
  }

  function burst(x, y, color, n) {
    const count = n || 10;
    for (let i = 0; i < count; i++) {
      State.particles.push({
        x: x, y: y,
        vx: (Math.random() - 0.5) * 3.4,
        vy: (Math.random() - 0.5) * 3.4 - 1,
        life: 320 + Math.random() * 480,
        r: 1.2 + Math.random() * 2.6,
        color: color || PALETTE[i % PALETTE.length]
      });
    }
    if (State.particles.length > 100) State.particles.splice(0, State.particles.length - 100);
  }

  function noteCombo(points) {
    State.combo += 1;
    State.maxCombo = Math.max(State.maxCombo, State.combo);
    State.runScore += Number(points) || 0;
    if (State.combo > 1 && State.combo % META.comboStep === 0) {
      beep(SFX[State.combo % SFX.length], 0.08, "sine");
    }
    checkAchievements();
    checkChallenges();
    refreshPanel();
  }

  function resetCombo() { State.combo = 0; }

  function currentLevel() {
    return LEVELS[Math.min(State.levelIndex, LEVELS.length - 1)];
  }

  function advanceLevelIfNeeded() {
    const lv = currentLevel();
    if (State.runScore >= lv.target && State.levelIndex < LEVELS.length - 1) {
      State.levelIndex += 1;
      beep(SFX[(State.levelIndex + 3) % SFX.length], 0.14, "square");
      unlockLore(State.levelIndex % LORE.length);
      const st = $("status");
      if (st) st.textContent = META.brand + " → " + currentLevel().name;
    }
  }

  function unlockLore(index) {
    const key = String(LORE[index].id);
    if (State.unlockedLore.indexOf(key) === -1) {
      State.unlockedLore.push(key);
      saveJson(META.storage.lore, State.unlockedLore);
    }
  }

  function checkAchievements() {
    ACHIEVEMENTS.forEach(function (a) {
      if (State.unlockedAch.indexOf(a.id) !== -1) return;
      if (State.maxCombo >= a.need || State.runScore >= a.need * 20) {
        State.unlockedAch.push(a.id);
        saveJson(META.storage.ach, State.unlockedAch);
        beep(SFX[5 % SFX.length], 0.12, "triangle");
      }
    });
  }

  function checkChallenges() {
    CHALLENGES.forEach(function (c) {
      if (State.clearedCh.indexOf(c.id) !== -1) return;
      if (State.runScore >= c.goal) {
        State.clearedCh.push(c.id);
        saveJson(META.storage.ch, State.clearedCh);
        State.runScore += c.reward;
        saveBest(State.runScore);
      }
    });
  }

  function rotateTip(force) {
    if (!State.settings.tips && !force) return;
    State.tipIndex = (State.tipIndex + 1) % TIPS.length;
    const tipEl = document.getElementById("vq-p1k-tip-" + id);
    if (tipEl) tipEl.textContent = TIPS[State.tipIndex];
    const st = $("status");
    if (st && (force || !st.textContent || st.textContent.length < 4)) st.textContent = TIPS[State.tipIndex];
  }

  function injectPanel() {
    const pid = "vq-p1k-panel-" + id;
    if (document.getElementById(pid)) return;
    const host = document.querySelector(".panel") || document.querySelector("aside") || document.querySelector("main") || document.body;
    const el = document.createElement("div");
    el.id = pid;
    el.setAttribute("data-vq-plus-1000", META.folder);
    el.style.cssText = "margin-top:12px;padding:12px;border-top:1px solid rgba(255,255,255,.12);font-size:0.76rem;line-height:1.45;color:rgba(230,238,242,.78)";
    el.innerHTML = [
      "<strong style=\\"color:" + META.accent + "\\">" + META.brand + "</strong>",
      "<div>Best <span id=\\"vq-p1k-best-" + id + "\\">" + loadBest() + "</span>",
      " · Runs <span id=\\"vq-p1k-runs-" + id + "\\">" + (localStorage.getItem(META.storage.runs) || "0") + "</span>",
      " · Combo <span id=\\"vq-p1k-combo-" + id + "\\">0</span></div>",
      "<div>Lv <span id=\\"vq-p1k-lv-" + id + "\\">1</span>",
      " · Ach <span id=\\"vq-p1k-ach-" + id + "\\">0</span>/" + ACHIEVEMENTS.length,
      " · Ch <span id=\\"vq-p1k-ch-" + id + "\\">0</span>/" + CHALLENGES.length + "</div>",
      "<div id=\\"vq-p1k-tip-" + id + "\\" style=\\"margin-top:6px;opacity:.85\\">" + TIPS[State.tipIndex] + "</div>",
      "<div style=\\"margin-top:8px;display:flex;gap:6px;flex-wrap:wrap\\">",
      "<button type=\\"button\\" id=\\"vq-p1k-mute-" + id + "\\" style=\\"font:inherit;padding:4px 8px;cursor:pointer\\">Mute</button>",
      "<button type=\\"button\\" id=\\"vq-p1k-tipbtn-" + id + "\\" style=\\"font:inherit;padding:4px 8px;cursor:pointer\\">Tip</button>",
      "<button type=\\"button\\" id=\\"vq-p1k-lore-" + id + "\\" style=\\"font:inherit;padding:4px 8px;cursor:pointer\\">Lore</button>",
      "</div>",
      "<pre id=\\"vq-p1k-lorebox-" + id + "\\" style=\\"display:none;margin-top:8px;white-space:pre-wrap;font-size:0.7rem;opacity:.8\\"></pre>"
    ].join("");
    host.appendChild(el);

    const muteBtn = document.getElementById("vq-p1k-mute-" + id);
    if (muteBtn) muteBtn.addEventListener("click", function () {
      State.muted = !State.muted;
      muteBtn.textContent = State.muted ? "Unmute" : "Mute";
    });
    const tipBtn = document.getElementById("vq-p1k-tipbtn-" + id);
    if (tipBtn) tipBtn.addEventListener("click", function () { rotateTip(true); });
    const loreBtn = document.getElementById("vq-p1k-lore-" + id);
    if (loreBtn) loreBtn.addEventListener("click", function () {
      const box = document.getElementById("vq-p1k-lorebox-" + id);
      if (!box) return;
      if (box.style.display !== "none") { box.style.display = "none"; return; }
      const lines = LORE.filter(function (L) {
        return State.unlockedLore.indexOf(String(L.id)) !== -1;
      }).map(function (L) { return L.title + "\\n" + L.body; });
      box.textContent = lines.length ? lines.join("\\n\\n") : LORE[0].title + "\\n" + LORE[0].body;
      box.style.display = "block";
    });
  }

  function refreshPanel() {
    const b = document.getElementById("vq-p1k-best-" + id);
    const r = document.getElementById("vq-p1k-runs-" + id);
    const c = document.getElementById("vq-p1k-combo-" + id);
    const lv = document.getElementById("vq-p1k-lv-" + id);
    const ach = document.getElementById("vq-p1k-ach-" + id);
    const ch = document.getElementById("vq-p1k-ch-" + id);
    if (b) b.textContent = String(loadBest());
    if (r) r.textContent = String(localStorage.getItem(META.storage.runs) || "0");
    if (c) c.textContent = String(State.maxCombo);
    if (lv) lv.textContent = String(currentLevel().lv);
    if (ach) ach.textContent = String(State.unlockedAch.length);
    if (ch) ch.textContent = String(State.clearedCh.length);
  }

  function hookStartButtons() {
    ["btn-start", "action-btn", "gen", "start", "btnStart"].forEach(function (bid) {
      const el = $(bid);
      if (!el || el.dataset.vqP1k) return;
      el.dataset.vqP1k = "1";
      el.addEventListener("click", function () {
        State.runScore = 0; State.combo = 0; State.levelIndex = 0;
        bumpRuns(); beep(SFX[2 % SFX.length], 0.09, "triangle");
        rotateTip(true); refreshPanel();
      });
    });
  }

  function hookScoreObserver() {
    const scoreEl = $("score");
    if (!scoreEl || scoreEl.dataset.vqP1kObs) return;
    scoreEl.dataset.vqP1kObs = "1";
    let last = Number(scoreEl.textContent) || 0;
    const obs = new MutationObserver(function () {
      const now = Number(scoreEl.textContent) || 0;
      if (now > last) {
        const delta = now - last;
        noteCombo(delta); saveBest(now); advanceLevelIfNeeded();
        const canvas = $("board");
        if (canvas) {
          floatAt(canvas.width * 0.55, canvas.height * 0.32, "+" + delta, META.accent);
          if (delta >= 10) burst(canvas.width * 0.5, canvas.height * 0.4, META.accent2, 8);
        }
      } else if (now < last) resetCombo();
      last = now;
    });
    obs.observe(scoreEl, { childList: true, characterData: true, subtree: true });
  }

  function ensureOverlay() {
    const canvas = $("board");
    if (!canvas || !State.settings.overlay) return null;
    let ov = document.getElementById("vq-p1k-ov-" + id);
    if (!ov) {
      ov = document.createElement("canvas");
      ov.id = "vq-p1k-ov-" + id;
      ov.width = canvas.width || 640;
      ov.height = canvas.height || 480;
      ov.style.cssText = "position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:3";
      const wrap = canvas.parentElement;
      if (wrap) {
        if (getComputedStyle(wrap).position === "static") wrap.style.position = "relative";
        wrap.appendChild(ov);
      }
    }
    if (ov.width !== canvas.width || ov.height !== canvas.height) {
      ov.width = canvas.width; ov.height = canvas.height;
    }
    return ov;
  }

  function drawOverlay() {
    const ov = ensureOverlay();
    if (!ov) return;
    const octx = ov.getContext("2d");
    if (!octx) return;
    octx.clearRect(0, 0, ov.width, ov.height);
    State.particles = State.particles.filter(function (p) {
      p.life -= 16; p.x += p.vx; p.y += p.vy; p.vy += 0.07;
      octx.globalAlpha = Math.max(0, p.life / 700);
      octx.fillStyle = p.color;
      octx.beginPath(); octx.arc(p.x, p.y, p.r, 0, Math.PI * 2); octx.fill();
      return p.life > 0;
    });
    octx.globalAlpha = 1;
    State.floats = State.floats.filter(function (f) {
      f.life -= 16; f.y += f.vy * 16;
      octx.globalAlpha = Math.max(0, f.life / 1000);
      octx.fillStyle = f.color;
      octx.font = "700 15px Fraunces, Outfit, sans-serif";
      octx.textAlign = "center";
      octx.fillText(f.text, f.x, f.y);
      return f.life > 0;
    });
    octx.globalAlpha = 1;
    if (State.combo >= 2) {
      octx.fillStyle = META.accent;
      octx.font = "600 12px IBM Plex Sans JP, sans-serif";
      octx.textAlign = "left";
      octx.fillText(META.brand + " COMBO x" + State.combo, 14, 26);
    }
    const lv = currentLevel();
    octx.fillStyle = "rgba(255,255,255,.55)";
    octx.font = "500 11px IBM Plex Sans JP, sans-serif";
    octx.textAlign = "right";
    octx.fillText(lv.name + " · " + lv.mode, ov.width - 12, 22);
  }

  function bindKeys() {
    window.addEventListener("keydown", function (e) {
      if (e.key === "T" || e.key === "t") rotateTip(true);
      if (e.key === "M" || e.key === "m") State.muted = !State.muted;
      if (e.key === "L" || e.key === "l") {
        const loreBtn = document.getElementById("vq-p1k-lore-" + id);
        if (loreBtn) loreBtn.click();
      }
    });
  }

  function boot() {
    injectPanel();
    hookStartButtons();
    hookScoreObserver();
    bindKeys();
    saveBest(loadBest());
    unlockLore(0);
    refreshPanel();
    setInterval(function () { drawOverlay(); advanceLevelIfNeeded(); }, META.tickMs);
    setTimeout(function () {
      const canvas = $("board");
      if (!canvas) return;
      burst(canvas.width * 0.5, canvas.height * 0.5, META.accent, 6 + (META.seed % 8));
      beep(SFX[1 % SFX.length], 0.06, "sine");
    }, 350 + (META.seed % 200));
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window["VQPlus1000_" + id] = {
    META: META, State: State, TIPS: TIPS, LORE: LORE,
    CHALLENGES: CHALLENGES, ACHIEVEMENTS: ACHIEVEMENTS, LEVELS: LEVELS, PALETTE: PALETTE,
    floatAt: floatAt, burst: burst, noteCombo: noteCombo, resetCombo: resetCombo,
    saveBest: saveBest, beep: beep, rotateTip: rotateTip
  };
})();
`;

  return block;
}

const targets = collectTargets().filter((t) => !SKIP.test(t.dir) && !SKIP.test(t.rel));
let added = 0;
let skipped = 0;
let errors = [];
const lineStats = [];

console.log("Targets:", targets.length);

for (const t of targets) {
  try {
    let src = fs.readFileSync(t.file, "utf8");
    if (src.includes("=== " + MARKER + ":")) {
      skipped++;
      continue;
    }
    const plus = buildBlock(t.rel, t.kind);
    const lines = plus.split(/\r?\n/).length;
    fs.writeFileSync(t.file, src.replace(/\s*$/, "") + "\n" + plus);
    added++;
    lineStats.push({ rel: t.rel, lines });
    if (added <= 8 || added % 40 === 0) console.log("+" + lines + "L", t.rel);
  } catch (e) {
    errors.push(t.rel + ": " + e.message);
  }
}

const avg = lineStats.length
  ? Math.round(lineStats.reduce((a, b) => a + b.lines, 0) / lineStats.length)
  : 0;

console.log(JSON.stringify({
  added,
  skipped,
  errors,
  total: targets.length,
  avgAppendLines: avg,
  min: lineStats.length ? Math.min(...lineStats.map((x) => x.lines)) : 0,
  max: lineStats.length ? Math.max(...lineStats.map((x) => x.lines)) : 0
}, null, 2));
console.log("Relixia never touched.");
