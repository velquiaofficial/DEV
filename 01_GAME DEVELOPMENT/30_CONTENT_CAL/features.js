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
  const KEY = "vq_pulsecal_v1_pro";
  const state = VQ.load(KEY, { snapshots: [], notes: [] });
  function ensure() {
    if (document.getElementById("pro-extra")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "pro-extra";
    el.className = "card pro-panel";
    el.innerHTML = `
      <h2>PulseCal ops</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Snapshots</span><strong id="px1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Notes</span><strong id="px2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Last</span><strong id="px3">-</strong></div></div>
        <div class="card"><div class="stat"><span>Health</span><strong id="px4">OK</strong></div></div>
      </div>
      <div class="toolbar">
        <button type="button" id="px-snap">Snapshot state</button>
        <button type="button" id="px-note">Add ops note</button>
        <button type="button" id="px-csv">Notes CSV</button>
      </div>
      <div class="grid grid-2">
        <div><h3>Snapshots</h3><ul class="list" id="px-snaps"></ul></div>
        <div><h3>Ops notes</h3><ul class="list" id="px-notes"></ul><div id="px-spark"></div></div>
      </div>`;
    main.appendChild(el);
    document.getElementById("px-snap").onclick = () => {
      const core = VQ.load("vq_pulsecal_v1", {});
      state.snapshots.unshift({ at: Date.now(), bytes: JSON.stringify(core).length });
      VQ.store(KEY, state);
      paint();
      VQ.toast("Snapshot saved");
    };
    document.getElementById("px-note").onclick = () => {
      state.notes.unshift({ at: Date.now(), text: "Reviewed " + "PulseCal" + " pipeline" });
      VQ.store(KEY, state);
      paint();
    };
    document.getElementById("px-csv").onclick = () => {
      VQKit.downloadCSV("pulsecal-notes.csv", state.notes, [
        { label: "at", get: (r) => VQKit.fmtDate(r.at) },
        { label: "text", key: "text" }
      ]);
    };
  }
  function paint() {
    ensure();
    document.getElementById("px1").textContent = state.snapshots.length;
    document.getElementById("px2").textContent = state.notes.length;
    document.getElementById("px3").textContent = state.snapshots[0] ? VQKit.relativeTime(state.snapshots[0].at) : "-";
    document.getElementById("px-snaps").innerHTML = state.snapshots.slice(0, 6).map((s) =>
      '<li><div>' + s.bytes + ' bytes</div><span class="badge">' + VQKit.relativeTime(s.at) + '</span></li>'
    ).join("") || "<div class='empty'>No snapshots</div>";
    document.getElementById("px-notes").innerHTML = state.notes.slice(0, 6).map((n) =>
      '<li><div>' + VQKit.escape(n.text) + '</div></li>'
    ).join("") || "<div class='empty'>No notes</div>";
    document.getElementById("px-spark").innerHTML = VQKit.sparkline(state.snapshots.map((s) => s.bytes), 220, 40, "#5fd4b3");
  }
  paint();
})();
