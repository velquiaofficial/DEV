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

  const KEY = "vq_repliqa_v2";
  const state = VQ.load(KEY, null) || VQ.load("vq_repliqa_v1", { items: [], current: null });
  if (!state.tags) state.tags = {};
  if (!state.sla) state.sla = [];

  function save() {
    VQ.store(KEY, state);
    VQ.store("vq_repliqa_v1", state);
    paint();
  }

  function ensure() {
    if (document.getElementById("rq-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "rq-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>Repliqa pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Pending</span><strong id="rq1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Response rate</span><strong id="rq2">0%</strong></div></div>
        <div class="card"><div class="stat"><span>Avg stars</span><strong id="rq3">0</strong></div></div>
        <div class="card"><div class="stat"><span>Negatives</span><strong id="rq4">0</strong></div></div>
      </div>
      <div class="toolbar">
        <button type="button" id="rq-tag">Auto-tag all</button>
        <button type="button" id="rq-bulk">Bulk draft pending</button>
        <button type="button" id="rq-csv">CSV export</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Tagged inbox</h3>
          <ul class="list" id="rq-list"></ul>
        </div>
        <div>
          <h3>Star distribution</h3>
          <div id="rq-bars"></div>
          <h3 style="margin-top:12px">Reply length trend</h3>
          <div id="rq-spark"></div>
        </div>
      </div>
    `;
    main.appendChild(el);
    document.getElementById("rq-tag").onclick = () => {
      state.items.forEach((it, i) => {
        let tag = "neutral";
        if (it.stars <= 2) tag = "risk";
        else if (it.stars >= 5) tag = "love";
        else if (/待|遅|残念|壊/.test(it.body)) tag = "risk";
        state.tags[i] = tag;
      });
      save();
      VQ.toast("Tagged");
    };
    document.getElementById("rq-bulk").onclick = async () => {
      for (let i = 0; i < state.items.length; i++) {
        const it = state.items[i];
        if (it.replied && it.reply) continue;
        await VQ.think(120);
        it.reply = VQ.reviewReply(it.stars, it.body);
      }
      save();
      VQ.toast("Drafted pending");
    };
    document.getElementById("rq-csv").onclick = () => {
      VQKit.downloadCSV("reviews.csv", state.items, [
        { label: "stars", key: "stars" },
        { label: "body", key: "body" },
        { label: "replied", key: "replied" },
        { label: "reply", key: "reply" },
        { label: "tag", get: (r, i) => state.tags[state.items.indexOf(r)] || "" }
      ]);
    };
  }

  function paint() {
    ensure();
    const n = state.items.length || 1;
    const replied = state.items.filter((x) => x.replied).length;
    document.getElementById("rq1").textContent = state.items.filter((x) => !x.replied).length;
    document.getElementById("rq2").textContent = Math.round((replied / n) * 100) + "%";
    document.getElementById("rq3").textContent = (
      state.items.reduce((a, b) => a + b.stars, 0) / n
    ).toFixed(1);
    document.getElementById("rq4").textContent = state.items.filter((x) => x.stars <= 2).length;

    document.getElementById("rq-list").innerHTML =
      state.items
        .map((it, i) => {
          const tag = state.tags[i] || "untagged";
          return `<li><div><strong>${"★".repeat(it.stars)}</strong> <span class="badge ${tag === "risk" ? "warn" : "ok"}">${tag}</span><br><span class="muted">${VQKit.escape(it.body)}</span></div></li>`;
        })
        .join("") || "<div class='empty'>Load samples</div>";

    const stars = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    state.items.forEach((it) => {
      stars[it.stars] = (stars[it.stars] || 0) + 1;
    });
    document.getElementById("rq-bars").innerHTML = VQKit.barChart(stars);
    document.getElementById("rq-spark").innerHTML = VQKit.sparkline(
      state.items.map((it) => (it.reply || "").length),
      220,
      48,
      "#a594ff"
    );
  }

  ["seed", "gen", "saveR"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", () => setTimeout(paint, 300));
  });

  // SLA clock: mark negatives older than demo threshold
  function tickSla() {
    const now = Date.now();
    state.items.forEach((it, i) => {
      if (it.stars <= 2 && !it.replied) {
        state.sla[i] = { risk: true, age: "pending" };
      } else {
        state.sla[i] = { risk: false, age: it.replied ? "done" : "ok" };
      }
    });
    const risky = state.sla.filter((s) => s && s.risk).length;
    if (risky && document.getElementById("rq4")) {
      document.getElementById("rq4").title = "Negatives needing reply: " + risky;
    }
  }

  // Template tones for one-click rewrite of current reply box
  const TONES = [
    { id: "warm", label: "Warm", fn: (t) => t.replace(/申し訳ありません/g, "ご不便をおかけし申し訳ございません") },
    { id: "crisp", label: "Crisp", fn: (t) => t.split("。").slice(0, 2).join("。") + "。" },
    { id: "vip", label: "VIP", fn: (t) => "【優先対応】" + t }
  ];

  function ensureTones() {
    if (document.getElementById("rq-tones")) return;
    const host = document.getElementById("rq-pro");
    if (!host) return;
    const bar = document.createElement("div");
    bar.className = "chips";
    bar.id = "rq-tones";
    bar.style.marginTop = "10px";
    bar.innerHTML =
      "<span class='mini'>Reply tone:</span>" +
      TONES.map((t) => `<button type="button" class="chip-btn" data-tone="${t.id}">${t.label}</button>`).join("");
    host.appendChild(bar);
    bar.querySelectorAll("[data-tone]").forEach((b) => {
      b.onclick = () => {
        const tone = TONES.find((x) => x.id === b.dataset.tone);
        const i = state.current != null ? state.current : 0;
        const it = state.items[i];
        if (!it || !it.reply || !tone) return VQ.toast("Generate a reply first");
        it.reply = tone.fn(it.reply);
        const out = document.getElementById("reply");
        if (out) out.textContent = it.reply;
        save();
        VQ.toast("Tone: " + tone.label);
      };
    });
  }

  const _paint = paint;
  paint = function () {
    _paint();
    tickSla();
    ensureTones();
  };

  paint();
  VQKit.bindExportButton("Export Repliqa", "repliqa-pro.json", () => state);
})();
