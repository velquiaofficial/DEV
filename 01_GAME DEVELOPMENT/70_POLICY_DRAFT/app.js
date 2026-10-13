"use strict";
(function () {
  const META = {
  "brand": "PolicyDraft",
  "kind": "drafts",
  "angle": "biz",
  "nav": [
    "drafts",
    "owners",
    "reviews"
  ],
  "fields": [
    {
      "id": "title",
      "label": "Policy",
      "type": "text",
      "ph": "Remote work"
    },
    {
      "id": "owner",
      "label": "Owner",
      "type": "text",
      "ph": "HR"
    },
    {
      "id": "body",
      "label": "Body",
      "type": "textarea",
      "ph": "Core hours…"
    }
  ],
  "seeds": [
    {
      "title": "Data retention",
      "owner": "Legal",
      "body": "90-day logs",
      "score": 68
    }
  ],
  "ai": [
    "Simplify language",
    "Add exception",
    "Set review +6m"
  ],
  "tips": [
    "Plain Japanese first",
    "Version stamp"
  ],
  "metrics": [
    "Policies",
    "Owners",
    "Due reviews",
    "Ready"
  ],
  "key": "vq_policydraft_v1"
};
  const KEY = META.key;
  const state = VQ.load(KEY, { items: [], ideas: [], links: [], log: [], score: {} });

  function save() { VQ.store(KEY, state); render(); }
  function host(id) { return document.getElementById("view-" + id); }
  function kpi(rows) {
    return '<div class="kpi-row">' + rows.map((r) =>
      '<div class="card"><div class="stat"><span>' + r[0] + '</span><strong>' + r[1] + '</strong></div></div>'
    ).join("") + "</div>";
  }
  function readFields() {
    const row = { at: Date.now(), score: 50 + Math.floor(Math.random() * 40) };
    META.fields.forEach((fld) => {
      const el = document.getElementById("f-" + fld.id);
      if (!el) return;
      row[fld.id] = fld.type === "number" ? (+el.value || 0) : el.value;
    });
    return row;
  }
  function primaryLabel(row) {
    const f0 = META.fields[0];
    return f0 ? String(row[f0.id] || "Untitled") : "Untitled";
  }
  function secondaryLabel(row) {
    const bits = META.fields.slice(1, 3).map((fld) => row[fld.id]).filter((x) => x !== undefined && x !== "");
    return bits.join(" · ");
  }
  function metricVals() {
    const n = state.items.length;
    const avg = n ? Math.round(VQKit.avg(state.items.map((x) => +x.score || 0))) : "-";
    const ideas = state.ideas.length;
    const links = state.links.length;
    return [
      [META.metrics[0] || "Items", n],
      [META.metrics[1] || "Ideas", ideas],
      [META.metrics[2] || "Links", links],
      [META.metrics[3] || "Avg", avg]
    ];
  }

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll("main section[id^=view-]").forEach((s) => {
        s.classList.toggle("hidden", s.id !== "view-" + btn.dataset.view);
      });
    };
  });

  function renderPrimary() {
    const id = META.nav[0];
    host(id).innerHTML = kpi(metricVals()) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Add · ${META.brand}</h2>
          <label>Policy</label><input id="f-title" type="text" placeholder="Remote work" >
          <label>Owner</label><input id="f-owner" type="text" placeholder="HR" >
          <label>Body</label><textarea id="f-body" placeholder="Core hours…"></textarea>
          <div class="actions"><button class="primary" id="btn-add" type="button">Add</button></div>
        </div>
        <div class="card">
          <h2>Board</h2>
          <ul class="list" id="item-list"></ul>
        </div>
      </div>
      <div class="card" style="margin-top:12px">
        <h2>Distribution</h2>
        <div id="dist-bars"></div>
        <div id="dist-spark" style="margin-top:10px"></div>
      </div>`;
    document.getElementById("item-list").innerHTML = state.items.map((row, i) =>
      '<li><div><strong>' + VQKit.escape(primaryLabel(row)) + '</strong><br><span class="muted">' +
      VQKit.escape(secondaryLabel(row)) + '</span></div><div><span class="badge">' + (row.score || "-") +
      '</span> <button data-x="' + i + '" type="button">Del</button></div></li>'
    ).join("") || "<div class='empty'>Seed demo or add rows</div>";
    document.querySelectorAll("#item-list [data-x]").forEach((b) => {
      b.onclick = () => { state.items.splice(+b.dataset.x, 1); save(); };
    });
    document.getElementById("btn-add").onclick = () => {
      state.items.unshift(readFields());
      state.log.unshift({ at: Date.now(), text: "Added " + primaryLabel(state.items[0]) });
      save();
      VQ.toast("Saved");
    };
    const groupKey = META.fields[1] ? META.fields[1].id : META.fields[0].id;
    const mix = VQKit.groupCount(state.items, (r) => String(r[groupKey] || "—"));
    document.getElementById("dist-bars").innerHTML = VQKit.barChart(mix);
    document.getElementById("dist-spark").innerHTML = VQKit.sparkline(
      state.items.length ? state.items.map((x) => +x.score || 0).slice(0, 24).reverse() : [10, 20, 18, 30, 28, 40],
      280, 48, "#5fd4b3"
    );
  }

  function renderSecondary() {
    const id = META.nav[1];
    host(id).innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <h2>AI / idea backlog</h2>
          <ul class="list" id="idea-list"></ul>
          <div class="actions"><button type="button" id="btn-idea">Pin tip</button></div>
        </div>
        <div class="card">
          <h2>Angle tips · ${META.angle}</h2>
          <ul class="list" id="tip-list"></ul>
          <div id="tip-donut" style="margin-top:12px"></div>
        </div>
      </div>`;
    document.getElementById("idea-list").innerHTML = state.ideas.map((t, i) =>
      '<li><div>' + VQKit.escape(t) + '</div><button data-x="' + i + '" type="button">Del</button></li>'
    ).join("") || "<div class='empty'>Run AI for ideas</div>";
    document.querySelectorAll("#idea-list [data-x]").forEach((b) => {
      b.onclick = () => { state.ideas.splice(+b.dataset.x, 1); save(); };
    });
    document.getElementById("btn-idea").onclick = () => {
      const tip = META.tips[state.ideas.length % META.tips.length] || "Review board";
      state.ideas.unshift(tip);
      save();
    };
    document.getElementById("tip-list").innerHTML = META.tips.map((t) =>
      '<li><div>' + VQKit.escape(t) + '</div><span class="badge">tip</span></li>'
    ).join("");
    const tone = { ideas: state.ideas.length || 1, items: state.items.length || 1, links: state.links.length || 1 };
    document.getElementById("tip-donut").innerHTML = VQKit.donut(tone, 140);
  }

  function renderTertiary() {
    const id = META.nav[2];
    host(id).innerHTML = `
      <div class="grid grid-2">
        <div class="card">
          <h2>Export / links</h2>
          <pre class="preview" id="export-pre"></pre>
          <div class="actions">
            <button type="button" id="btn-csv">CSV</button>
            <button type="button" id="btn-json">JSON</button>
            <button type="button" id="btn-link">Pin workspace link</button>
          </div>
          <ul class="list" id="link-list"></ul>
        </div>
        <div class="card">
          <h2>Activity</h2>
          <ul class="list" id="log-list"></ul>
          <div id="hist" style="margin-top:12px"></div>
        </div>
      </div>`;
    document.getElementById("export-pre").textContent = state.items.slice(0, 12).map((row) =>
      META.fields.map((fld) => fld.id + "=" + row[fld.id]).join(" | ")
    ).join("\n") || "Empty";
    document.getElementById("btn-csv").onclick = () => {
      const cols = META.fields.map((fld) => ({ label: fld.id, key: fld.id }));
      cols.push({ label: "score", key: "score" });
      VQKit.downloadCSV(META.brand.toLowerCase() + ".csv", state.items, cols);
    };
    document.getElementById("btn-json").onclick = () => {
      VQ.downloadJSON(META.brand.toLowerCase() + ".json", { brand: META.brand, angle: META.angle, items: state.items, ideas: state.ideas });
    };
    document.getElementById("btn-link").onclick = () => {
      state.links.unshift({ at: Date.now(), path: META.brand + " · " + META.angle });
      save();
      VQ.toast("Pinned");
    };
    document.getElementById("link-list").innerHTML = state.links.map((l) =>
      '<li><div>' + VQKit.escape(l.path) + '</div><span class="badge">' + VQKit.relativeTime(l.at) + '</span></li>'
    ).join("") || "<div class='empty'>No pins</div>";
    document.getElementById("log-list").innerHTML = state.log.slice(0, 10).map((l) =>
      '<li><div>' + VQKit.escape(l.text) + '</div><span class="badge">' + VQKit.relativeTime(l.at) + '</span></li>'
    ).join("") || "<div class='empty'>No activity</div>";
    document.getElementById("hist").innerHTML = VQKit.histogram(state.items.map((x) => Math.min(5, Math.round((+x.score || 0) / 20))), 5);
  }

  function render() {
    renderPrimary();
    renderSecondary();
    renderTertiary();
  }

  async function runAI() {
    document.getElementById("btn-primary").disabled = true;
    await VQ.think(480);
    META.ai.forEach((line) => {
      if (!state.ideas.includes(line)) state.ideas.unshift(line);
    });
    if (!state.items.length) {
      state.items = META.seeds.map((s) => Object.assign({ at: Date.now() }, s));
    } else {
      state.items.forEach((row, i) => {
        row.score = Math.min(100, (+row.score || 50) + (i % 3) * 2);
      });
    }
    state.log.unshift({ at: Date.now(), text: "AI pass on " + META.brand });
    document.getElementById("btn-primary").disabled = false;
    if (VQKit.activity && VQKit.activity.push) VQKit.activity.push(META.brand, "AI run");
    save();
    VQ.toast("AI complete");
  }

  function seed() {
    if (!state.items.length) state.items = META.seeds.map((s) => Object.assign({ at: Date.now() }, s));
    META.tips.slice(0, 2).forEach((t) => { if (!state.ideas.includes(t)) state.ideas.push(t); });
    state.log.unshift({ at: Date.now(), text: "Seeded " + META.brand });
    save();
    VQ.toast("Demo seeded");
  }

  document.getElementById("btn-primary").onclick = runAI;
  document.getElementById("btn-seed").onclick = seed;
  render();
  if (VQKit.bindExportButton) {
    VQKit.bindExportButton("Export " + META.brand, META.brand.toLowerCase() + "-state.json", () => state);
  }
})();
