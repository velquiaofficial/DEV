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

  const KEY = "vq_hireready_v2";
  const STARTER = [
    "リードしたプロジェクトの規模と成果指標を数字で述べる",
    "冲突する優先度をどう裁いたか具体例で話す",
    "失敗から学んだプロセス改善を1つ挙げる",
    "チーム外ステークホルダーとの合意形成を説明する",
    "入社90日で達成したいマイルストーンを3つ言う"
  ];

  const state = VQ.load(KEY, {
    resumes: [],
    answers: [],
    scoreHistory: [],
    checklist: STARTER.map((t) => ({ text: t, done: false })),
    query: "",
    page: 1
  });

  function save() {
    VQ.store(KEY, state);
    paint();
  }

  function ensure() {
    if (document.getElementById("hr-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "hr-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>HireReady pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Resumes</span><strong id="hr1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Answers</span><strong id="hr2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Checklist</span><strong id="hr3">0%</strong></div></div>
        <div class="card"><div class="stat"><span>Avg score</span><strong id="hr4">-</strong></div></div>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Interview checklist</h3>
          <ul class="list" id="hr-check"></ul>
          <button type="button" id="hr-reset">Reset checklist</button>
        </div>
        <div>
          <h3>Answer bank</h3>
          <input id="hr-q" placeholder="Search answers" style="margin-bottom:8px">
          <ul class="list" id="hr-ans"></ul>
          <div id="hr-pager"></div>
          <h3 style="margin-top:12px">Score trend</h3>
          <div id="hr-spark"></div>
          <button type="button" id="hr-csv">Export answers CSV</button>
        </div>
      </div>
    `;
    main.appendChild(el);
    document.getElementById("hr-reset").onclick = () => {
      state.checklist = STARTER.map((t) => ({ text: t, done: false }));
      save();
    };
    document.getElementById("hr-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("hr-q").value;
      state.page = 1;
      paint();
    }, 120);
    document.getElementById("hr-csv").onclick = () => {
      VQKit.downloadCSV("interview-answers.csv", state.answers, [
        { label: "q", key: "q" },
        { label: "a", key: "a" },
        { label: "score", key: "score" },
        { label: "at", get: (r) => new Date(r.at).toISOString() }
      ]);
    };
  }

  function scoreAnswer(text) {
    let s = 50;
    if (text.length > 80) s += 15;
    if (text.length > 160) s += 10;
    if (/\d/.test(text)) s += 15;
    if (/ため|because|result|成果|学び/i.test(text)) s += 10;
    return VQKit.clamp(s, 0, 100);
  }

  // hook coach button
  const coach = document.getElementById("icoach");
  if (coach) {
    coach.addEventListener("click", () => {
      setTimeout(() => {
        const a = document.getElementById("ians")?.value.trim();
        const q = document.getElementById("iq")?.textContent || "";
        if (!a) return;
        const sc = scoreAnswer(a);
        state.answers.unshift({ q, a, score: sc, at: Date.now() });
        state.scoreHistory.push(sc);
        const fb = document.getElementById("ifb");
        if (fb) {
          fb.textContent += ` · Score ${sc}/100` + (sc >= 80 ? " (strong)" : sc >= 60 ? " (ok)" : " (add metrics)");
        }
        VQKit.activity.push("HireReady", "Scored answer " + sc);
        save();
      }, 450);
    });
  }

  const gen = document.getElementById("gen");
  if (gen) {
    gen.addEventListener("click", () => {
      setTimeout(() => {
        const resume = document.getElementById("resumeOut")?.textContent || "";
        if (!resume) return;
        state.resumes.unshift({
          name: document.getElementById("name")?.value || "Candidate",
          role: document.getElementById("role")?.value || "Role",
          body: resume,
          at: Date.now()
        });
        save();
      }, 550);
    });
  }

  function paint() {
    ensure();
    document.getElementById("hr1").textContent = state.resumes.length;
    document.getElementById("hr2").textContent = state.answers.length;
    const done = state.checklist.filter((c) => c.done).length;
    document.getElementById("hr3").textContent =
      Math.round((done / Math.max(state.checklist.length, 1)) * 100) + "%";
    document.getElementById("hr4").textContent = state.scoreHistory.length
      ? Math.round(state.scoreHistory.reduce((a, b) => a + b, 0) / state.scoreHistory.length)
      : "-";

    document.getElementById("hr-check").innerHTML = state.checklist
      .map(
        (c, i) =>
          `<li><div>${VQKit.escape(c.text)}</div><button data-c="${i}">${c.done ? "✓" : "○"}</button></li>`
      )
      .join("");
    document.querySelectorAll("#hr-check [data-c]").forEach((b) => {
      b.onclick = () => {
        state.checklist[+b.dataset.c].done = !state.checklist[+b.dataset.c].done;
        save();
      };
    });

    const filtered = VQKit.search(state.answers, state.query, ["q", "a"]);
    const page = VQKit.paginate(filtered, state.page, 6);
    document.getElementById("hr-ans").innerHTML =
      page.slice
        .map(
          (a) =>
            `<li><div><strong>${VQKit.escape(a.q.slice(0, 60))}</strong><br><span class="muted">${VQKit.escape(a.a.slice(0, 100))}…</span></div><span class="badge">${a.score}</span></li>`
        )
        .join("") || "<div class='empty'>Practice to fill the bank</div>";
    VQKit.renderPager(document.getElementById("hr-pager"), page, (p) => {
      state.page = p;
      paint();
    });
    document.getElementById("hr-spark").innerHTML = VQKit.sparkline(
      state.scoreHistory.slice(-14),
      220,
      48,
      "#7ee0c6"
    );
  }

  paint();
  VQKit.bindExportButton("Export HireReady", "hireready.json", () => state);
})();
