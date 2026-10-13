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

  const KEY = "vq_ledger_v2";
  const state = VQ.load(KEY, {
    items: [],
    budget: 80000,
    recurring: [
      { name: "家賃", amt: 70000, cat: "その他", day: 1 },
      { name: "通信費", amt: 5000, cat: "光熱", day: 10 }
    ],
    query: "",
    page: 1,
    receipts: []
  });

  try {
    const legacy = VQ.load("vq_ledgerly_v1", null);
    if (legacy && !state.items.length) {
      state.items = (legacy.items || []).map((x) => ({ ...x, ts: x.at || Date.now() }));
      state.budget = legacy.budget || state.budget;
    }
  } catch (_) {}

  function save() {
    VQ.store(KEY, state);
    // mirror to legacy keys used by base app
    VQ.store("vq_ledgerly_v1", {
      items: state.items,
      budget: state.budget
    });
    paint();
  }

  function ensure() {
    if (document.getElementById("ld-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "ld-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>Ledger pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Spend</span><strong id="ld-sp">¥0</strong></div></div>
        <div class="card"><div class="stat"><span>Budget left</span><strong id="ld-lf">¥0</strong></div></div>
        <div class="card"><div class="stat"><span>Daily avg</span><strong id="ld-av">¥0</strong></div></div>
        <div class="card"><div class="stat"><span>Receipts OCR</span><strong id="ld-rc">0</strong></div></div>
      </div>
      <div class="toolbar">
        <input id="ld-q" placeholder="Search memo/category" style="max-width:220px;margin:0">
        <button type="button" id="ld-rec">Apply recurring</button>
        <button type="button" id="ld-ocr">Fake OCR paste</button>
        <button type="button" id="ld-csv">CSV</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Transactions</h3>
          <ul class="list" id="ld-list"></ul>
          <div id="ld-pager"></div>
        </div>
        <div>
          <h3>Category mix</h3>
          <div id="ld-donut"></div>
          <div id="ld-bars"></div>
          <h3 style="margin-top:12px">7-day spend</h3>
          <div id="ld-spark"></div>
        </div>
      </div>
    `;
    main.appendChild(el);
    document.getElementById("ld-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("ld-q").value;
      state.page = 1;
      paint();
    }, 120);
    document.getElementById("ld-rec").onclick = () => {
      const day = new Date().getDate();
      state.recurring.forEach((r) => {
        if (r.day === day || true) {
          state.items.unshift({
            amt: r.amt,
            cat: r.cat,
            memo: "Recurring: " + r.name,
            ts: Date.now(),
            at: Date.now()
          });
        }
      });
      VQKit.activity.push("Ledgerly", "Recurring applied");
      save();
      VQ.toast("Recurring posted");
    };
    document.getElementById("ld-ocr").onclick = () => {
      const raw = prompt("Paste receipt text", "スターバックス 1280円 食費");
      if (!raw) return;
      const m = raw.match(/(\d{3,6})/);
      const amt = m ? +m[1] : 1000;
      let cat = "その他";
      if (/食|カフェ|ランチ|スタ/.test(raw)) cat = "食費";
      if (/電車|交通|タクシー/.test(raw)) cat = "交通";
      if (/電気|ガス|通信/.test(raw)) cat = "光熱";
      if (/事業|経費|クライアント/.test(raw)) cat = "事業経費";
      state.items.unshift({ amt, cat, memo: "OCR: " + raw, ts: Date.now(), at: Date.now() });
      state.receipts.push({ raw, amt, cat, at: Date.now() });
      save();
      VQ.toast("OCR item added");
    };
    document.getElementById("ld-csv").onclick = () => {
      VQKit.downloadCSV("ledger.csv", state.items, [
        { label: "amt", key: "amt" },
        { label: "cat", key: "cat" },
        { label: "memo", key: "memo" },
        { label: "at", get: (r) => new Date(r.ts || r.at || Date.now()).toISOString() }
      ]);
    };
  }

  const addBtn = document.getElementById("add");
  if (addBtn) {
    addBtn.onclick = () => {
      const amt = +document.getElementById("amt").value;
      if (!amt) return VQ.toast("金額を入力");
      state.items.unshift({
        amt,
        cat: document.getElementById("cat").value,
        memo: document.getElementById("memo").value || "-",
        ts: Date.now(),
        at: Date.now()
      });
      document.getElementById("amt").value = "";
      document.getElementById("memo").value = "";
      save();
      VQ.toast("追加");
    };
  }
  const saveBudget = document.getElementById("saveBudget");
  if (saveBudget) {
    saveBudget.onclick = () => {
      state.budget = +document.getElementById("budget").value || 0;
      save();
      VQ.toast("予算保存");
    };
  }

  function paint() {
    ensure();
    const total = VQKit.sumBy(state.items, (x) => x.amt);
    document.getElementById("ld-sp").textContent = VQKit.fmtYen(total);
    document.getElementById("ld-lf").textContent = VQKit.fmtYen(state.budget - total);
    document.getElementById("ld-av").textContent = VQKit.fmtYen(total / 30);
    document.getElementById("ld-rc").textContent = state.receipts.length;

    // update legacy DOM if present
    if (document.getElementById("total")) document.getElementById("total").textContent = VQKit.fmtYen(total);
    if (document.getElementById("left")) document.getElementById("left").textContent = VQKit.fmtYen(state.budget - total);
    if (document.getElementById("budget")) document.getElementById("budget").value = state.budget;

    const filtered = VQKit.search(state.items, state.query, ["memo", "cat"]);
    const page = VQKit.paginate(
      VQKit.sortBy(filtered, (x) => x.ts || 0, "desc"),
      state.page,
      8
    );
    document.getElementById("ld-list").innerHTML =
      page.slice
        .map((x) => {
          const i = state.items.indexOf(x);
          return `<li><div><strong>${VQKit.fmtYen(x.amt)}</strong> ${VQKit.escape(x.cat)}<br><span class="muted">${VQKit.escape(x.memo)}</span></div><button data-x="${i}">Del</button></li>`;
        })
        .join("") || "<div class='empty'>No rows</div>";
    document.querySelectorAll("#ld-list [data-x]").forEach((b) => {
      b.onclick = () => {
        state.items.splice(+b.dataset.x, 1);
        save();
      };
    });
    VQKit.renderPager(document.getElementById("ld-pager"), page, (p) => {
      state.page = p;
      paint();
    });

    const mix = {};
    state.items.forEach((x) => {
      mix[x.cat] = (mix[x.cat] || 0) + x.amt;
    });
    document.getElementById("ld-donut").innerHTML = VQKit.donut(mix, 140);
    document.getElementById("ld-bars").innerHTML = VQKit.barChart(mix);
    const series = VQKit.weekSeries(state.items, (x) => x.ts || Date.now(), (x) => x.amt);
    document.getElementById("ld-spark").innerHTML = VQKit.sparkline(
      series.map((v) => v / 1000),
      240,
      48,
      "#e0b84a"
    );
  }

  if (!state.items.length) {
    [
      { amt: 1280, cat: "食費", memo: "カフェ" },
      { amt: 480, cat: "交通", memo: "地下鉄" },
      { amt: 3200, cat: "事業経費", memo: "ツール課金" }
    ].forEach((x) => state.items.push({ ...x, ts: Date.now(), at: Date.now() }));
  }
  save();
  VQKit.bindExportButton("Export Ledger", "ledger-full.json", () => state);
})();
