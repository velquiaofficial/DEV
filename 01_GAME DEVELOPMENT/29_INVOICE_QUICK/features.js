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

  const KEY = "vq_billfold_v2";
  const state = VQ.load(KEY, {
    clients: ["Acme Inc.", "Blue Harbor", "Studio North"],
    catalog: [
      { name: "Design sprint", price: 150000 },
      { name: "Landing page", price: 80000 },
      { name: "Monthly retainer", price: 120000 },
      { name: "Illustration pack", price: 45000 }
    ],
    docs: [],
    lines: [],
    settings: { co: "VELQUIA", bank: "Please pay within 14 days.", tax: 0.1 },
    query: "",
    page: 1
  });
  try {
    const legacy = VQ.load("vq_billfold_v1", null);
    if (legacy) {
      if (legacy.docs) state.docs = legacy.docs;
      if (legacy.settings) state.settings = { ...state.settings, ...legacy.settings };
      if (legacy.lines) state.lines = legacy.lines;
    }
  } catch (_) {}

  function save() {
    VQ.store(KEY, state);
    VQ.store("vq_billfold_v1", {
      lines: state.lines,
      docs: state.docs,
      settings: state.settings,
      preview: state.preview || ""
    });
    paint();
  }

  function ensure() {
    if (document.getElementById("bf-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "bf-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>Billfold pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Docs</span><strong id="bf1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Pipeline ¥</span><strong id="bf2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Clients</span><strong id="bf3">0</strong></div></div>
        <div class="card"><div class="stat"><span>Catalog</span><strong id="bf4">0</strong></div></div>
      </div>
      <div class="toolbar">
        <input id="bf-q" placeholder="Search docs/clients" style="max-width:220px;margin:0">
        <button type="button" id="bf-cat">Add catalog → lines</button>
        <button type="button" id="bf-csv">CSV docs</button>
        <button type="button" id="bf-remind">Payment reminder text</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Documents</h3>
          <ul class="list" id="bf-docs"></ul>
          <div id="bf-pager"></div>
        </div>
        <div>
          <h3>Revenue mix</h3>
          <div id="bf-bars"></div>
          <h3 style="margin-top:12px">Catalog</h3>
          <ul class="list" id="bf-catlist"></ul>
          <div class="row"><input id="bf-cn" placeholder="New item"><input id="bf-cp" type="number" placeholder="Price"><button id="bf-addc" type="button">Add</button></div>
        </div>
      </div>
    `;
    main.appendChild(el);
    document.getElementById("bf-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("bf-q").value;
      state.page = 1;
      paint();
    }, 120);
    document.getElementById("bf-cat").onclick = () => {
      const item = VQ.pick(state.catalog);
      state.lines.push({ name: item.name, qty: 1, price: item.price });
      // sync UI list via rebuild of legacy if needed
      const lines = document.getElementById("lines");
      if (lines) {
        // trigger base rebuild by saving legacy
      }
      save();
      // also update visible lines list in base app
      if (typeof render === "function") {
        try {
          /* base may have render */
        } catch (_) {}
      }
      // force base state if exposed through localStorage reload pattern
      VQ.toast("Catalog line added — rebuild document");
      // inject into base inputs
      if (document.getElementById("iname")) {
        document.getElementById("iname").value = item.name;
        document.getElementById("iqty").value = 1;
        document.getElementById("iprice").value = item.price;
        document.getElementById("addLine")?.click();
      }
    };
    document.getElementById("bf-csv").onclick = () => {
      VQKit.downloadCSV("documents.csv", state.docs, [
        { label: "type", key: "type" },
        { label: "client", key: "client" },
        { label: "total", key: "total" },
        { label: "at", key: "at" }
      ]);
    };
    document.getElementById("bf-remind").onclick = () => {
      const client = document.getElementById("client")?.value || "ご担当者";
      const text = `${client} 様\\n\\nお世話になっております。${state.settings.co}です。\\n下記請求の支払期限が近づいておりますのでご確認ください。\\n\\n${state.settings.bank}\\n\\nどうぞよろしくお願いいたします。`;
      VQ.downloadText("payment-reminder.txt", text.replace(/\\n/g, "\n"));
      VQ.toast("Reminder exported");
    };
    document.getElementById("bf-addc").onclick = () => {
      const name = document.getElementById("bf-cn").value.trim();
      const price = +document.getElementById("bf-cp").value;
      if (!name || !price) return VQ.toast("Name/price required");
      state.catalog.push({ name, price });
      document.getElementById("bf-cn").value = "";
      document.getElementById("bf-cp").value = "";
      save();
    };
  }

  // wrap save doc
  const saveD = document.getElementById("saveD");
  if (saveD) {
    const old = saveD.onclick;
    saveD.onclick = () => {
      if (typeof old === "function") old();
      setTimeout(() => {
        const legacy = VQ.load("vq_billfold_v1", {});
        state.docs = legacy.docs || state.docs;
        save();
      }, 0);
    };
  }

  function paint() {
    ensure();
    document.getElementById("bf1").textContent = state.docs.length;
    document.getElementById("bf2").textContent = VQKit.fmtYen(
      VQKit.sumBy(state.docs, (d) => d.total)
    );
    document.getElementById("bf3").textContent = new Set(state.docs.map((d) => d.client).concat(state.clients)).size;
    document.getElementById("bf4").textContent = state.catalog.length;

    const filtered = VQKit.search(state.docs, state.query, ["client", "type", "at"]);
    const page = VQKit.paginate(filtered, state.page, 6);
    document.getElementById("bf-docs").innerHTML =
      page.slice
        .map(
          (d) =>
            `<li><div><strong>${VQKit.escape(String(d.type).toUpperCase())} · ${VQKit.escape(d.client)}</strong><br><span class="muted">${VQKit.fmtYen(d.total)} · ${VQKit.escape(d.at)}</span></div></li>`
        )
        .join("") || "<div class='empty'>No documents</div>";
    VQKit.renderPager(document.getElementById("bf-pager"), page, (p) => {
      state.page = p;
      paint();
    });

    const mix = VQKit.groupCount(state.docs, (d) => d.type || "doc");
    // value-weighted
    const valued = {};
    state.docs.forEach((d) => {
      valued[d.type || "doc"] = (valued[d.type || "doc"] || 0) + (d.total || 0);
    });
    document.getElementById("bf-bars").innerHTML = VQKit.barChart(valued);
    document.getElementById("bf-catlist").innerHTML = state.catalog
      .map((c) => `<li><div><strong>${VQKit.escape(c.name)}</strong></div><span>${VQKit.fmtYen(c.price)}</span></li>`)
      .join("");

    // client datalist
    let dl = document.getElementById("bf-clients");
    if (!dl) {
      dl = document.createElement("datalist");
      dl.id = "bf-clients";
      document.body.appendChild(dl);
      const client = document.getElementById("client");
      if (client) client.setAttribute("list", "bf-clients");
    }
    dl.innerHTML = state.clients
      .concat(state.docs.map((d) => d.client))
      .filter((v, i, a) => a.indexOf(v) === i)
      .map((c) => `<option value="${VQKit.escape(c)}"></option>`)
      .join("");
  }

  paint();
  VQKit.bindExportButton("Export Billfold", "billfold-pro.json", () => state);
})();
