"use strict";
(async function () {
  if (!window.VQKit) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "app-kit.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }
  const KEY = "vq_pantryquest_v1_pro";
  const state = VQ.load(KEY, { links: [], checks: [] });
  function paint() {
    if (!document.getElementById("gx-pro")) {
      const el = document.createElement("section");
      el.id = "gx-pro";
      el.className = "card pro-panel";
      el.innerHTML = `
        <h2>Game link desk</h2>
        <p class="mini" style="margin-top:-6px">Source: 09_COOKING</p>
        <div class="kpi-row">
          <div class="card"><div class="stat"><span>Links</span><strong id="gx1">0</strong></div></div>
          <div class="card"><div class="stat"><span>Checks</span><strong id="gx2">0</strong></div></div>
          <div class="card"><div class="stat"><span>Based on</span><strong style="font-size:.95rem">game</strong></div></div>
          <div class="card"><div class="stat"><span>Relixia files</span><strong style="font-size:.95rem">safe</strong></div></div>
        </div>
        <div class="toolbar">
          <button type="button" id="gx-link">Pin source path</button>
          <button type="button" id="gx-check">Playtest checklist+</button>
        </div>
        <div class="grid grid-2">
          <div><h3>Pinned</h3><ul class="list" id="gx-links"></ul></div>
          <div><h3>Checklist</h3><ul class="list" id="gx-checks"></ul></div>
        </div>`;
      document.querySelector(".main").appendChild(el);
      document.getElementById("gx-link").onclick = () => {
        state.links.unshift({ at: Date.now(), path: "09_COOKING" });
        VQ.store(KEY, state); paint(); VQ.toast("Pinned");
      };
      document.getElementById("gx-check").onclick = () => {
        state.checks.unshift({ at: Date.now(), text: "Verify loop fun in 3 minutes" });
        state.checks.unshift({ at: Date.now(), text: "Export data for designers" });
        VQ.store(KEY, state); paint();
      };
    }
    document.getElementById("gx1").textContent = state.links.length;
    document.getElementById("gx2").textContent = state.checks.length;
    document.getElementById("gx-links").innerHTML = state.links.map((l) =>
      '<li><div>' + VQKit.escape(l.path) + '</div><span class="badge">' + VQKit.relativeTime(l.at) + '</span></li>'
    ).join("") || "<div class='empty'>Pin source game path</div>";
    document.getElementById("gx-checks").innerHTML = state.checks.map((c) =>
      '<li><div>' + VQKit.escape(c.text) + '</div></li>'
    ).join("") || "<div class='empty'>Add checklist</div>";
  }
  paint();
})();
