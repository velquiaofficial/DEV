"use strict";
(async function () {
  if (!window.VQKit) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "app-kit.js";
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  const BANK = [
    { lv: "beginner", prompt: "Introduce yourself in one sentence.", sample: "I'm Yuki and I like games." },
    { lv: "beginner", prompt: "Translate: 今日は晴れです", sample: "It is sunny today." },
    { lv: "beginner", prompt: "Ask where the station is.", sample: "Where is the station?" },
    { lv: "intermediate", prompt: "Describe your morning routine.", sample: "I wake up at seven, brew coffee, then check messages." },
    { lv: "intermediate", prompt: "Give an opinion about remote work.", sample: "Remote work helps me focus, but I miss hallway chats." },
    { lv: "intermediate", prompt: "Translate: 締め切りに間に合わせる", sample: "Meet the deadline." },
    { lv: "advanced", prompt: "Argue for shipping a small MVP first.", sample: "A tiny MVP validates demand before we burn runway." },
    { lv: "advanced", prompt: "Rewrite casually: We regret the inconvenience caused.", sample: "Sorry about the hassle — we're on it." },
    { lv: "advanced", prompt: "Summarize a bug report in 12 words.", sample: "Login fails on Safari when cookies are blocked by default." },
    { lv: "beginner", prompt: "Name three colors.", sample: "Red, blue, and green." },
    { lv: "intermediate", prompt: "Politely decline a meeting.", sample: "Thanks for the invite — can we move it to Thursday?" },
    { lv: "advanced", prompt: "Explain opportunity cost simply.", sample: "Choosing A means you give up the best version of B." }
  ];

  const KEY = "vq_lingua_v2";
  const state = VQ.load(KEY, {
    xp: 0,
    streak: 1,
    history: [],
    wrong: [],
    deck: BANK.slice(),
    idx: 0,
    dailyGoal: 10,
    today: 0,
    day: VQKit.dayKey()
  });
  if (state.day !== VQKit.dayKey()) {
    state.today = 0;
    state.day = VQKit.dayKey();
  }

  function save() {
    VQ.store(KEY, state);
    paint();
  }

  function ensure() {
    if (document.getElementById("lg-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "lg-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>Coach pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>XP</span><strong id="lg-xp">0</strong></div></div>
        <div class="card"><div class="stat"><span>Today</span><strong id="lg-td">0</strong></div></div>
        <div class="card"><div class="stat"><span>Goal</span><strong id="lg-gl">10</strong></div></div>
        <div class="card"><div class="stat"><span>Review</span><strong id="lg-rv">0</strong></div></div>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>SRS review queue</h3>
          <p id="lg-prompt" class="preview"></p>
          <input id="lg-ans" placeholder="Your answer">
          <div class="actions">
            <button class="primary" type="button" id="lg-check">Check</button>
            <button type="button" id="lg-next">Next</button>
            <button type="button" id="lg-hint">Show sample</button>
          </div>
          <p id="lg-fb" class="muted"></p>
        </div>
        <div>
          <h3>Progress</h3>
          <div id="lg-spark"></div>
          <h3 style="margin-top:12px">Weak prompts</h3>
          <ul class="list" id="lg-weak"></ul>
          <button type="button" id="lg-csv">Export history CSV</button>
        </div>
      </div>
    `;
    main.appendChild(el);
    document.getElementById("lg-check").onclick = () => grade(false);
    document.getElementById("lg-next").onclick = () => {
      state.idx = (state.idx + 1) % state.deck.length;
      document.getElementById("lg-ans").value = "";
      document.getElementById("lg-fb").textContent = "";
      paint();
    };
    document.getElementById("lg-hint").onclick = () => {
      const card = current();
      document.getElementById("lg-fb").textContent = "Sample: " + card.sample;
    };
    document.getElementById("lg-csv").onclick = () => {
      VQKit.downloadCSV("lingua-history.csv", state.history, [
        { label: "prompt", key: "prompt" },
        { label: "answer", key: "answer" },
        { label: "ok", key: "ok" },
        { label: "at", get: (r) => new Date(r.at).toISOString() }
      ]);
    };
  }

  function current() {
    const lv = document.getElementById("lv")?.value || "intermediate";
    const pool = state.deck.filter((d) => d.lv === lv);
    const list = pool.length ? pool : state.deck;
    return list[state.idx % list.length];
  }

  function grade() {
    const card = current();
    const ans = document.getElementById("lg-ans").value.trim();
    if (!ans) return VQ.toast("Answer first");
    const ok =
      ans.toLowerCase().split(/\s+/).filter(Boolean).length >= 3 ||
      ans.toLowerCase().includes(card.sample.toLowerCase().slice(0, 8));
    state.history.push({ prompt: card.prompt, answer: ans, ok, at: Date.now() });
    state.today++;
    if (ok) {
      state.xp += 10;
      document.getElementById("lg-fb").textContent = "Nice. +10 XP";
      document.getElementById("lg-fb").className = "ok-text";
    } else {
      state.xp += 3;
      state.wrong.push(card);
      document.getElementById("lg-fb").textContent = "Close — sample: " + card.sample + " (+3 XP)";
      document.getElementById("lg-fb").className = "warn-text";
    }
    VQKit.activity.push("LinguaLoop", (ok ? "OK: " : "Review: ") + card.prompt);
    save();
  }

  function paint() {
    ensure();
    const card = current();
    document.getElementById("lg-prompt").textContent = card.prompt;
    document.getElementById("lg-xp").textContent = state.xp;
    document.getElementById("lg-td").textContent = state.today + " / " + state.dailyGoal;
    document.getElementById("lg-gl").textContent = state.dailyGoal;
    document.getElementById("lg-rv").textContent = state.wrong.length;
    const series = VQKit.weekSeries(state.history, (h) => h.at);
    document.getElementById("lg-spark").innerHTML = VQKit.sparkline(series, 220, 48, "#6ec6ff");
    document.getElementById("lg-weak").innerHTML =
      state.wrong
        .slice(-8)
        .reverse()
        .map((w) => `<li><div>${VQKit.escape(w.prompt)}</div></li>`)
        .join("") || "<div class='empty'>No weak items</div>";
  }

  paint();
  VQKit.bindExportButton("Export Lingua", "lingua.json", () => state);
})();
