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
  const KEY = "vq_hiringscore_v1_pro";
  const CORE = "vq_hiringscore_v1";
  const BRAND = "HiringScore";
  const ANGLE = "biz";
  const TIPS = ["Same rubric always","Write examples"];
  const state = VQ.load(KEY, { snapshots: [], notes: [], rituals: [], scorecard: [] });

  function ensure() {
    if (document.getElementById("pro-extra")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "pro-extra";
    el.className = "card pro-panel";
    el.innerHTML = `
      <h2>${BRAND} pro desk</h2>
      <p class="mini" style="margin-top:-6px">Angle: ${ANGLE} · standalone pack</p>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Snapshots</span><strong id="px1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Notes</span><strong id="px2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Rituals</span><strong id="px3">0</strong></div></div>
        <div class="card"><div class="stat"><span>Scorecards</span><strong id="px4">0</strong></div></div>
      </div>
      <div class="toolbar">
        <button type="button" id="px-snap">Snapshot</button>
        <button type="button" id="px-note">Ops note</button>
        <button type="button" id="px-ritual">Weekly ritual</button>
        <button type="button" id="px-score">Scorecard+</button>
        <button type="button" id="px-csv">Export notes</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Snapshots</h3>
          <ul class="list" id="px-snaps"></ul>
          <div id="px-spark"></div>
        </div>
        <div>
          <h3>Ops + rituals</h3>
          <ul class="list" id="px-notes"></ul>
          <ul class="list" id="px-rituals"></ul>
          <div id="px-bars" style="margin-top:10px"></div>
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        <h3>Scorecard history</h3>
        <ul class="list" id="px-scores"></ul>
      </div>`;
    main.appendChild(el);
    document.getElementById("px-snap").onclick = () => {
      const core = VQ.load(CORE, {});
      state.snapshots.unshift({ at: Date.now(), bytes: JSON.stringify(core).length });
      VQ.store(KEY, state); paint(); VQ.toast("Snapshot");
    };
    document.getElementById("px-note").onclick = () => {
      state.notes.unshift({ at: Date.now(), text: "Reviewed " + BRAND + " · " + (TIPS[0] || "board") });
      VQ.store(KEY, state); paint();
    };
    document.getElementById("px-ritual").onclick = () => {
      state.rituals.unshift({ at: Date.now(), text: "Weekly: " + (TIPS[state.rituals.length % TIPS.length] || "review") });
      VQ.store(KEY, state); paint(); VQ.toast("Ritual logged");
    };
    document.getElementById("px-score").onclick = () => {
      const core = VQ.load(CORE, { items: [] });
      const n = (core.items || []).length;
      const avg = n ? Math.round(VQKit.avg(core.items.map((x) => +x.score || 0))) : 0;
      state.scorecard.unshift({ at: Date.now(), n, avg, grade: avg >= 75 ? "A" : avg >= 55 ? "B" : "C" });
      VQ.store(KEY, state); paint();
    };
    document.getElementById("px-csv").onclick = () => {
      VQKit.downloadCSV(BRAND.toLowerCase() + "-ops.csv", state.notes, [
        { label: "at", get: (r) => VQKit.fmtDate(r.at) },
        { label: "text", key: "text" }
      ]);
    };
  }

  function paint() {
    ensure();
    document.getElementById("px1").textContent = state.snapshots.length;
    document.getElementById("px2").textContent = state.notes.length;
    document.getElementById("px3").textContent = state.rituals.length;
    document.getElementById("px4").textContent = state.scorecard.length;
    document.getElementById("px-snaps").innerHTML = state.snapshots.slice(0, 6).map((s) =>
      '<li><div>' + s.bytes + ' bytes</div><span class="badge">' + VQKit.relativeTime(s.at) + '</span></li>'
    ).join("") || "<div class='empty'>No snapshots</div>";
    document.getElementById("px-notes").innerHTML = state.notes.slice(0, 5).map((n) =>
      '<li><div>' + VQKit.escape(n.text) + '</div></li>'
    ).join("") || "<div class='empty'>No notes</div>";
    document.getElementById("px-rituals").innerHTML = state.rituals.slice(0, 5).map((n) =>
      '<li><div>' + VQKit.escape(n.text) + '</div><span class="badge">ritual</span></li>'
    ).join("") || "<div class='empty'>No rituals</div>";
    document.getElementById("px-scores").innerHTML = state.scorecard.slice(0, 8).map((s) =>
      '<li><div><strong>' + s.grade + '</strong> · n=' + s.n + ' avg=' + s.avg + '</div><span class="badge">' + VQKit.relativeTime(s.at) + '</span></li>'
    ).join("") || "<div class='empty'>Run scorecard</div>";
    document.getElementById("px-spark").innerHTML = VQKit.sparkline(
      state.snapshots.length ? state.snapshots.map((s) => s.bytes).reverse() : [20, 40, 35, 60],
      220, 40, "#5fd4b3"
    );
    document.getElementById("px-bars").innerHTML = VQKit.barChart({
      snaps: state.snapshots.length || 1,
      notes: state.notes.length || 1,
      rituals: state.rituals.length || 1,
      scores: state.scorecard.length || 1
    });
  }
  paint();
})();
