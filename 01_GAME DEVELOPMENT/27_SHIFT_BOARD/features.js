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

  const KEY = "vq_shiftly_v2";
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const SLOTS = ["AM", "PM"];
  const state = VQ.load(KEY, null) || VQ.load("vq_shiftly_v1", {
    staff: [],
    week: 0,
    cells: {},
    preferences: {},
    laborCost: {}
  });
  if (!state.preferences) state.preferences = {};
  if (!state.laborCost) state.laborCost = {};

  function save() {
    VQ.store(KEY, state);
    VQ.store("vq_shiftly_v1", state);
    paint();
  }

  function key(d, s) {
    return state.week + ":" + d + ":" + s;
  }

  function ensure() {
    if (document.getElementById("sh-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "sh-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>Shiftly pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Staff</span><strong id="sh1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Filled slots</span><strong id="sh2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Coverage</span><strong id="sh3">0%</strong></div></div>
        <div class="card"><div class="stat"><span>Est. labor</span><strong id="sh4">¥0</strong></div></div>
      </div>
      <div class="toolbar">
        <button type="button" id="sh-fair">Fairness report</button>
        <button type="button" id="sh-pref">Set day-off preference</button>
        <button type="button" id="sh-csv">CSV week</button>
        <button type="button" id="sh-cost">Set hourly cost</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Hours by person</h3>
          <div id="sh-bars"></div>
          <pre id="sh-fairout" class="preview" style="min-height:80px"></pre>
        </div>
        <div>
          <h3>Coverage heatmap</h3>
          <div id="sh-heat"></div>
          <h3 style="margin-top:12px">Preferences</h3>
          <ul class="list" id="sh-pref-list"></ul>
        </div>
      </div>
    `;
    main.appendChild(el);
    document.getElementById("sh-fair").onclick = () => {
      const counts = {};
      Object.values(state.cells).forEach((id) => {
        if (!id) return;
        counts[id] = (counts[id] || 0) + 1;
      });
      const lines = state.staff.map((s) => `${s.name}: ${counts[s.id] || 0} slots`);
      const vals = Object.values(counts);
      const max = Math.max(0, ...vals);
      const min = vals.length ? Math.min(...vals) : 0;
      document.getElementById("sh-fairout").textContent =
        lines.join("\n") + "\n\nSpread: " + (max - min) + " (lower is fairer)";
    };
    document.getElementById("sh-pref").onclick = () => {
      if (!state.staff.length) return VQ.toast("Add staff");
      const s = VQ.pick(state.staff);
      const day = VQ.pick(DAYS);
      state.preferences[s.id] = day;
      save();
      VQ.toast(s.name + " prefers off " + day);
    };
    document.getElementById("sh-csv").onclick = () => {
      const rows = [];
      DAYS.forEach((d) =>
        SLOTS.forEach((slot) => {
          const id = state.cells[key(d, slot)];
          const st = state.staff.find((x) => x.id === id);
          rows.push({ day: d, slot, name: st ? st.name : "", role: st ? st.role : "" });
        })
      );
      VQKit.downloadCSV("shift-week.csv", rows, [
        { label: "day", key: "day" },
        { label: "slot", key: "slot" },
        { label: "name", key: "name" },
        { label: "role", key: "role" }
      ]);
    };
    document.getElementById("sh-cost").onclick = () => {
      if (!state.staff.length) return;
      const s = VQ.pick(state.staff);
      const v = prompt("Hourly yen for " + s.name, String(state.laborCost[s.id] || 1200));
      if (v) state.laborCost[s.id] = +v;
      save();
    };
  }

  function paint() {
    ensure();
    const totalSlots = DAYS.length * SLOTS.length;
    let filled = 0;
    const hours = {};
    Object.entries(state.cells).forEach(([k, id]) => {
      if (!k.startsWith(state.week + ":") || !id) return;
      filled++;
      hours[id] = (hours[id] || 0) + 4;
    });
    document.getElementById("sh1").textContent = state.staff.length;
    document.getElementById("sh2").textContent = filled;
    document.getElementById("sh3").textContent = Math.round((filled / totalSlots) * 100) + "%";
    let labor = 0;
    Object.entries(hours).forEach(([id, h]) => {
      labor += h * (state.laborCost[id] || 1200);
    });
    document.getElementById("sh4").textContent = VQKit.fmtYen(labor);

    const named = {};
    state.staff.forEach((s) => {
      named[s.name] = hours[s.id] || 0;
    });
    document.getElementById("sh-bars").innerHTML = VQKit.barChart(named);

    let heat = "<table class='table'><thead><tr><th></th>" + DAYS.map((d) => "<th>" + d + "</th>").join("") + "</tr></thead><tbody>";
    SLOTS.forEach((slot) => {
      heat += "<tr><th>" + slot + "</th>";
      DAYS.forEach((d) => {
        const id = state.cells[key(d, slot)];
        const prefHit = id && state.preferences[id] === d;
        const st = state.staff.find((x) => x.id === id);
        heat += `<td style="background:${id ? "rgba(109,77,255,.25)" : "transparent"};${prefHit ? "outline:1px solid #e0b84a" : ""}">${st ? st.name : "-"}</td>`;
      });
      heat += "</tr>";
    });
    heat += "</tbody></table>";
    document.getElementById("sh-heat").innerHTML = heat;

    document.getElementById("sh-pref-list").innerHTML =
      Object.entries(state.preferences)
        .map(([id, day]) => {
          const st = state.staff.find((x) => x.id === id);
          return `<li><div>${st ? st.name : id}</div><span class="badge">off ${day}</span></li>`;
        })
        .join("") || "<div class='empty'>No preferences</div>";
  }

  // observe week changes roughly
  ["prevW", "nextW", "fill", "clr", "addS"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", () => setTimeout(paint, 0));
  });

  paint();
  setInterval(paint, 1500);
  VQKit.bindExportButton("Export Shiftly", "shiftly-pro.json", () => state);
})();
