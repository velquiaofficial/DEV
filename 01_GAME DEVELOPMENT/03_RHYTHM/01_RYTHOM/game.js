(() => {
  const LANES = [
    { code: "KeyD", label: "D", color: "#ff6b4a", freq: 349.23 },
    { code: "KeyF", label: "F", color: "#ffc857", freq: 440 },
    { code: "KeyJ", label: "J", color: "#3ddc97", freq: 523.25 },
    { code: "KeyK", label: "K", color: "#5eb1ff", freq: 659.25 },
  ];

  const STAGES = [
    {
      name: "もりのあさ",
      level: "やさしい",
      bpm: 96,
      bass: 98,
      pattern: `
0...2...1...3...
0...2...1...3...
0...1...2...3...
0.2.1.3.0...2...
`,
    },
    {
      name: "ネオンどおり",
      level: "ふつう",
      bpm: 120,
      bass: 110,
      pattern: `
0...2...1...3...
0.2.1.3.0.2.1.3.
0..2..1..3..0..2
1...3.0...2.1...
2.0.3.1.2.0.3...
0...1...2...3...
`,
    },
    {
      name: "ほしのうみ",
      level: "むずかしい",
      bpm: 136,
      bass: 123,
      pattern: `
0.1.2.3.0.2.1.3.
0..2.1..3.0..1.2
3.1.0.2.3.1.2.0.
0.2.1...3.0.2..1
1..0.2..3.1..2.0
0.1.2.3.0.1.2.3.
`,
    },
  ];

  const PERFECT = 0.055;
  const GOOD = 0.1;
  const BEST_KEY = "rythom-best";
  const MUSIC_GAIN = 0.4;

  const $ = (id) => document.getElementById(id);
  const game = $("game");
  const noteLayer = $("note-layer");
  const receptorRow = $("receptor-row");
  const pads = $("pads");
  const trail = $("trail");
  const judge = $("judge");
  const highway = $("highway");

  const state = {
    mode: "title",
    stageIndex: 0,
    hp: 100,
    score: 0,
    stageStartScore: 0,
    combo: 0,
    maxCombo: 0,
    perfect: 0,
    good: 0,
    miss: 0,
    notes: [],
    running: false,
    songStart: 0,
    beatDur: 0.6,
    lead: 1.8,
    endAt: 0,
    nextBeat: 0,
    totalBeats: 0,
    hopUntil: 0,
    travel: 0,
    travelTarget: 0,
    muted: false,
  };

  let ctx = null;
  let master = null;
  let noise = null;
  let useAudio = false;
  let perfOrigin = 0;
  let starting = false;
  const keyToLane = Object.fromEntries(LANES.map((lane, i) => [lane.code, i]));
  const receptors = [];
  const stones = [];

  function parseChart(pattern, bpm) {
    const lines = pattern.trim().split(/\n/).map((line) => line.trim()).filter(Boolean);
    const chars = [];
    lines.forEach((line, index) => {
      if (line.length !== 16 || /[^0-3.]/.test(line)) {
        throw new Error(`譜面の${index + 1}小節が正しくありません`);
      }
      chars.push(...line);
    });
    const beatDur = 60 / bpm;
    const eighth = beatDur / 2;
    const countIn = beatDur * 4;
    const notes = [];
    chars.forEach((ch, i) => {
      if (ch === ".") return;
      notes.push({
        lane: Number(ch),
        time: countIn + i * eighth,
        done: false,
        musicOn: false,
        el: null,
      });
    });
    return {
      notes,
      beatDur,
      endAt: countIn + chars.length * eighth + beatDur,
      totalBeats: 4 + chars.length / 2 + 2,
    };
  }

  function now() {
    if (useAudio) return ctx.currentTime;
    return (performance.now() - perfOrigin) / 1000;
  }

  async function bootAudio() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    if (!ctx) {
      ctx = new AudioCtx();
      master = ctx.createGain();
      master.gain.value = state.muted ? 0.0001 : MUSIC_GAIN;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.knee.value = 18;
      comp.ratio.value = 4;
      master.connect(comp);
      comp.connect(ctx.destination);
      const len = Math.floor(ctx.sampleRate * 0.4);
      noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = noise.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
    }
    await Promise.race([
      ctx.resume(),
      new Promise((resolve) => { window.setTimeout(resolve, 500); }),
    ]);
    useAudio = ctx.state === "running";
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(state.muted ? 0.0001 : MUSIC_GAIN, ctx.currentTime);
    return useAudio;
  }

  function burst(time, freq, dur, type, peak, slideTo) {
    if (!useAudio) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, time + dur);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0001), time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  function noiseHit(time, dur, peak, freq) {
    if (!useAudio) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(peak, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(time);
    src.stop(time + dur);
  }

  function scheduleDrums(beat, time) {
    const pos = beat % 4;
    if (pos === 0 || pos === 2) burst(time, 168, 0.16, "sine", 0.85, 46);
    else noiseHit(time, 0.12, 0.22, 1400);
    noiseHit(time, 0.04, 0.07, 5000);
    noiseHit(time + state.beatDur * 0.5, 0.03, 0.05, 6000);
    if (pos === 0) burst(time, STAGES[state.stageIndex].bass, 0.22, "triangle", 0.28);
  }

  function scheduleMelody(note) {
    const freq = LANES[note.lane].freq;
    burst(note.time, freq, 0.18, "triangle", 0.09);
  }

  function hitSound(lane, perfect) {
    const t = now();
    const freq = LANES[lane].freq;
    burst(t, perfect ? freq * 2 : freq, 0.08, "sine", perfect ? 0.08 : 0.05);
  }

  function missSound() {
    burst(now(), 90, 0.12, "sine", 0.08, 50);
  }

  function pumpSchedule() {
    if (!useAudio || !state.running) return;
    const t = now();
    const horizon = t + 0.28;
    while (state.nextBeat < state.totalBeats && state.songStart + state.nextBeat * state.beatDur < horizon) {
      const when = state.songStart + state.nextBeat * state.beatDur;
      if (when >= t - 0.04) scheduleDrums(state.nextBeat, Math.max(when, t));
      state.nextBeat += 1;
    }
    state.notes.forEach((note) => {
      if (note.musicOn || note.time >= horizon) return;
      note.musicOn = true;
      if (note.time >= t - 0.04) scheduleMelody(note);
    });
  }

  function fadeMusic() {
    if (!useAudio) return;
    const t = ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), t);
    master.gain.linearRampToValueAtTime(0.0001, t + 0.35);
  }

  function setPanel(id) {
    document.querySelectorAll(".panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === id);
    });
  }

  function setMode(mode) {
    state.mode = mode;
    game.classList.toggle("is-play", mode === "play");
    game.classList.toggle("is-result", mode === "clear" || mode === "over" || mode === "all");
    if (mode === "title") setPanel("panel-title");
    else if (mode === "play") setPanel("panel-play");
    else setPanel("panel-result");
  }

  function renderHud() {
    const stage = STAGES[state.stageIndex];
    $("hud-stage").textContent = `ステージ ${state.stageIndex + 1} / ${STAGES.length}`;
    $("hud-level").textContent = `${stage.name}・${stage.level}`;
    $("sign-no").textContent = `STAGE ${state.stageIndex + 1}`;
    $("sign-name").textContent = stage.name;
    $("score").textContent = String(state.score);
    $("combo").textContent = String(state.combo);
    $("hp-fill").style.width = `${state.hp}%`;
    $("hp-fill").style.background = state.hp > 50 ? "#3ddc97" : state.hp > 25 ? "#ffc857" : "#ff5d4a";
    const done = state.notes.filter((note) => note.done).length;
    const total = state.notes.length || 1;
    $("progress-fill").style.width = `${(done / total) * 100}%`;
    game.dataset.stage = String(state.stageIndex + 1);
    document.documentElement.style.setProperty("--beat", `${state.beatDur}s`);
  }

  function popJudge(text, color) {
    judge.textContent = text;
    judge.style.color = color;
    judge.classList.remove("pop");
    void judge.offsetWidth;
    judge.classList.add("pop");
  }

  function showToast(text) {
    const toast = $("toast");
    toast.textContent = text;
    toast.classList.remove("show");
    void toast.offsetWidth;
    toast.classList.add("show");
  }

  function progressRatio() {
    const total = state.notes.length || 1;
    return Math.min(1, (state.perfect + state.good) / total);
  }

  function updateTravel() {
    state.travelTarget = progressRatio();
  }

  function updateTrail() {
    const upcoming = state.notes.filter((note) => !note.done).slice(0, 4);
    const startX = 12 + state.travel * 58;
    stones.forEach((stone, index) => {
      const note = upcoming[index];
      stone.hidden = !note;
      if (!note) return;
      stone.style.setProperty("--stone", LANES[note.lane].color);
      stone.textContent = LANES[note.lane].label;
      stone.classList.toggle("next", index === 0);
      stone.style.left = `${Math.min(92, startX + 10 + index * 12)}%`;
    });
  }

  function placeNotes(t) {
    state.notes.forEach((note) => {
      const p = (note.time - t) / state.lead;
      const visible = p < 1.05 && p > -0.18 && !note.done;
      note.el.hidden = !visible;
      if (!visible) return;
      const y = 62 - p * (62 - (-8));
      note.el.style.top = `${y}%`;
      note.el.style.setProperty("--s", String(Math.min(1.08, 0.72 + (1 - Math.max(p, 0)) * 0.36)));
    });
  }

  function miss(note) {
    if (!state.running || note.done) return;
    note.done = true;
    note.el.hidden = true;
    state.miss += 1;
    state.combo = 0;
    state.hp = Math.max(0, state.hp - 14);
    popJudge("ミス", "#ff8d7a");
    missSound();
    highway.classList.remove("shake");
    void highway.offsetWidth;
    highway.classList.add("shake");
    const runner = $("runner");
    runner.classList.remove("stumble");
    void runner.offsetWidth;
    runner.classList.add("stumble");
    renderHud();
    updateTrail();
    if (state.hp <= 0) finish(false);
  }

  function hit(note, perfect) {
    if (!state.running || note.done) return;
    note.done = true;
    note.el.hidden = true;
    state.hopUntil = now() + 0.28;
    if (perfect) {
      state.perfect += 1;
      state.hp = Math.min(100, state.hp + 2);
      popJudge("パーフェクト", "#ffe08a");
    } else {
      state.good += 1;
      popJudge("グッド", "#b8f5cf");
    }
    state.combo += 1;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    const bonus = (state.combo - 1) * (perfect ? 10 : 4);
    state.score += (perfect ? 300 : 100) + bonus;
    if (state.combo === 10 || state.combo === 20 || state.combo === 30) {
      showToast(`${state.combo}コンボ`);
    }
    updateTravel();
    receptors[note.lane].classList.add("hot");
    window.setTimeout(() => receptors[note.lane].classList.remove("hot"), 90);
    hitSound(note.lane, perfect);
    renderHud();
    updateTrail();
  }

  function press(lane) {
    if (!state.running) return;
    const t = now();
    const open = state.notes.filter((note) => !note.done && Math.abs(note.time - t) <= GOOD);
    if (open.length === 0) return;
    const target = open.reduce((best, note) => (
      Math.abs(note.time - t) < Math.abs(best.time - t) ? note : best
    ));
    if (target.lane !== lane) {
      miss(target);
      return;
    }
    hit(target, Math.abs(target.time - t) <= PERFECT);
  }

  function rankOf() {
    const total = state.notes.length || 1;
    const acc = (state.perfect + state.good * 0.5) / total;
    if (state.miss === 0 && state.perfect / total >= 0.9) return ["S", "かんぺきなリズム"];
    if (acc >= 0.85) return ["A", "いいリズム"];
    if (acc >= 0.65) return ["B", "なかなか"];
    return ["C", "つぎはあわせよう"];
  }

  function rememberBest() {
    const prev = Number(localStorage.getItem(BEST_KEY) || 0);
    if (state.score > prev) localStorage.setItem(BEST_KEY, String(state.score));
    $("best").textContent = `ベスト ${Math.max(prev, state.score)}`;
  }

  function showResult(kind) {
    state.running = false;
    fadeMusic();
    const stage = STAGES[state.stageIndex];
    const stageScore = state.score - state.stageStartScore;
    const total = state.notes.length;
    const acc = total ? Math.round(((state.perfect + state.good * 0.5) / total) * 100) : 0;
    const [rank, rankName] = rankOf();
    const failed = kind === "over";
    $("result-kicker").textContent = failed ? "ステージしっぱい" : `ステージ ${state.stageIndex + 1}`;
    $("result-title").textContent = failed ? "おちてしまった" : kind === "all" ? "すべてのステージにたどりついた" : `${stage.name} クリア`;
    $("result-rank").textContent = failed ? "×" : rank;
    $("result-rank-name").textContent = failed ? "もういちど、リズムをきいてみよう" : rankName;
    $("result-stats").innerHTML = [
      ["このステージ", stageScore],
      ["合計スコア", state.score],
      ["精度", `${acc}%`],
      ["パーフェクト", state.perfect],
      ["グッド", state.good],
      ["ミス", state.miss],
    ].map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`).join("");
    $("btn-retry").hidden = kind === "all";
    $("btn-next").hidden = failed || kind === "all";
    const nextStage = STAGES[state.stageIndex + 1];
    $("btn-next").textContent = nextStage ? `つぎへ ${nextStage.name}` : "ゴール";
    $("countdown").textContent = "";
    $("banner").textContent = "";
    try { rememberBest(); } catch { /* 保存できない環境でも遊べるようにする */ }
    setMode(kind === "over" ? "over" : kind === "all" ? "all" : "clear");
  }

  function finish(cleared) {
    if (!state.running) return;
    if (!cleared) {
      showResult("over");
      return;
    }
    if (state.stageIndex >= STAGES.length - 1) showResult("all");
    else showResult("clear");
  }

  function buildNotes() {
    noteLayer.replaceChildren();
    state.notes.forEach((note) => {
      const el = document.createElement("div");
      el.className = "note";
      el.style.setProperty("--lane", note.lane);
      el.style.setProperty("--c", LANES[note.lane].color);
      el.textContent = LANES[note.lane].label;
      el.hidden = true;
      note.el = el;
      noteLayer.appendChild(el);
    });
  }

  function resetStageStats() {
    state.hp = 100;
    state.combo = 0;
    state.maxCombo = 0;
    state.perfect = 0;
    state.good = 0;
    state.miss = 0;
    state.stageStartScore = state.score;
  }

  async function startStage(index, keepScore) {
    if (starting) return;
    starting = true;
    state.running = false;
    try {
    await bootAudio();
    const stage = STAGES[index];
    const chart = parseChart(stage.pattern, stage.bpm);
    state.stageIndex = index;
    if (!keepScore) state.score = 0;
    resetStageStats();
    state.notes = chart.notes;
    state.beatDur = chart.beatDur;
    state.lead = chart.beatDur * 3;
    state.endAt = chart.endAt;
    state.totalBeats = chart.totalBeats;
    state.nextBeat = 0;
    state.running = true;
    state.hopUntil = 0;
    state.travel = 0;
    state.travelTarget = 0;
    $("runner").style.left = "6%";
    $("runner").classList.remove("stumble");
    document.querySelectorAll("[data-depth]").forEach((el) => {
      el.style.transform = "translateX(0)";
    });
    buildNotes();
    setMode("play");
    renderHud();
    updateTrail();
    judge.textContent = "";
    $("banner").textContent = stage.name;
    if (!useAudio) perfOrigin = performance.now();
    state.songStart = now() + 0.06;
    state.notes.forEach((note) => { note.time += state.songStart; });
    state.endAt += state.songStart;
    requestAnimationFrame(frame);
    } finally {
      starting = false;
    }
  }

  function frame() {
    if (!state.running) return;
    const t = now();
    pumpSchedule();
    const beat = (t - state.songStart) / state.beatDur;
    if (beat >= 0 && beat < 4) $("countdown").textContent = String(4 - Math.floor(beat));
    else if (beat < 4.45) $("countdown").textContent = "スタート";
    else $("countdown").textContent = "";
    if (beat > 2) $("banner").textContent = "";

    const phase = ((beat % 1) + 1) % 1;
    const hop = Math.max(0, state.hopUntil - t);
    const hopY = hop > 0 ? Math.sin((1 - hop / 0.28) * Math.PI) * -26 : 0;
    const beatY = Math.sin(Math.min(phase, 1) * Math.PI) * -8;
    state.travel += (state.travelTarget - state.travel) * 0.12;
    const travelX = 6 + state.travel * 62;
    $("runner").style.left = `${travelX}%`;
    $("runner-bob").style.transform = `translateY(${hopY + beatY}px)`;
    document.querySelectorAll("[data-depth]").forEach((el) => {
      const depth = Number(el.dataset.depth) || 40;
      el.style.transform = `translateX(${-state.travel * depth}px)`;
    });
    const ground = document.querySelector(".ground");
    if (ground) {
      ground.style.backgroundPositionX = `${-state.travel * 220}px`;
    }
    updateTrail();

    state.notes.forEach((note) => {
      if (!note.done && t > note.time + GOOD) miss(note);
    });
    if (!state.running) return;
    placeNotes(t);
    if (state.notes.every((note) => note.done) && t > state.endAt - state.beatDur) finish(true);
    if (state.running) requestAnimationFrame(frame);
  }

  function buildStatic() {
    LANES.forEach((lane, index) => {
      const chip = document.createElement("div");
      chip.className = "key-chip";
      chip.style.setProperty("--c", lane.color);
      chip.textContent = lane.label;
      $("key-legend").appendChild(chip);

      const receptor = document.createElement("div");
      receptor.className = "receptor";
      receptor.style.setProperty("--lane", index);
      receptor.style.setProperty("--c", lane.color);
      receptor.textContent = lane.label;
      receptorRow.appendChild(receptor);
      receptors.push(receptor);

      const pad = document.createElement("button");
      pad.type = "button";
      pad.className = "pad";
      pad.style.setProperty("--c", lane.color);
      pad.textContent = lane.label;
      pad.setAttribute("aria-label", `${lane.label}キー`);
      pad.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        pad.classList.add("down");
        press(index);
      });
      pad.addEventListener("pointerup", () => pad.classList.remove("down"));
      pad.addEventListener("pointerleave", () => pad.classList.remove("down"));
      pads.appendChild(pad);

      const stone = document.createElement("div");
      stone.className = "stone";
      stone.hidden = true;
      trail.appendChild(stone);
      stones.push(stone);
    });

    try {
      $("best").textContent = `ベスト ${localStorage.getItem(BEST_KEY) || 0}`;
    } catch { /* プライベート表示ではベストを出さない */ }
  }

  $("btn-start").addEventListener("click", (event) => {
    event.currentTarget.blur();
    startStage(0, false);
  });

  $("btn-retry").addEventListener("click", () => {
    state.score = state.stageStartScore;
    startStage(state.stageIndex, true);
  });

  $("btn-next").addEventListener("click", () => {
    if (state.stageIndex >= STAGES.length - 1) showResult("all");
    else startStage(state.stageIndex + 1, true);
  });

  $("btn-title").addEventListener("click", () => {
    state.running = false;
    fadeMusic();
    $("countdown").textContent = "";
    $("banner").textContent = "";
    game.dataset.stage = "1";
    setMode("title");
  });

  $("btn-mute").addEventListener("click", () => {
    state.muted = !state.muted;
    $("btn-mute").textContent = state.muted ? "おと オフ" : "おと オン";
    $("btn-mute").setAttribute("aria-pressed", String(state.muted));
    if (useAudio) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(state.muted ? 0.0001 : MUSIC_GAIN, ctx.currentTime);
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    const lane = keyToLane[event.code];
    if (lane === undefined) {
      if (event.code === "Escape" && state.mode !== "title") {
        state.running = false;
        fadeMusic();
        $("countdown").textContent = "";
        $("banner").textContent = "";
        game.dataset.stage = "1";
        setMode("title");
      }
      return;
    }
    event.preventDefault();
    const pad = pads.children[lane];
    pad.classList.add("down");
    press(lane);
  });

  window.addEventListener("keyup", (event) => {
    const lane = keyToLane[event.code];
    if (lane === undefined) return;
    pads.children[lane].classList.remove("down");
  });

  document.addEventListener("visibilitychange", () => {
    if (!useAudio || !state.running) return;
    if (document.hidden) ctx.suspend();
    else ctx.resume();
  });

  buildStatic();
})();
