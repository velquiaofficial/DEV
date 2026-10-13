"use strict";
/* +feature pack · ShelfShot studio */
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

  const KEY = "vq_shelfshot_v2";
  const state = VQ.load(KEY, {
    items: [],
    favorites: [],
    channelStats: { Amazon: 0, 楽天: 0, Shopify: 0, SNS広告: 0 },
    page: 1,
    query: "",
    abTests: []
  });

  // migrate old library if present in DOM flow
  function save() {
    VQ.store(KEY, state);
    paint();
  }

  function ensureUI() {
    if (document.getElementById("ss-extra")) return;
    const main = document.querySelector(".main");
    const box = document.createElement("section");
    box.id = "ss-extra";
    box.className = "card pro-panel";
    box.style.marginTop = "14px";
    box.innerHTML = `
      <h2>Asset studio pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Assets</span><strong id="ss-n">0</strong></div></div>
        <div class="card"><div class="stat"><span>Favorites</span><strong id="ss-f">0</strong></div></div>
        <div class="card"><div class="stat"><span>A/B tests</span><strong id="ss-ab">0</strong></div></div>
        <div class="card"><div class="stat"><span>7d trend</span><strong id="ss-spark"></strong></div></div>
      </div>
      <div class="toolbar">
        <input id="ss-q" placeholder="Search assets…" style="max-width:240px;margin:0">
        <button type="button" id="ss-csv">CSV export</button>
        <button type="button" id="ss-abmake">Create A/B from last</button>
        <button type="button" id="ss-bulk">Bulk 5 variants</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Library</h3>
          <ul class="list" id="ss-lib"></ul>
          <div id="ss-pager"></div>
        </div>
        <div>
          <h3>Channel mix</h3>
          <div id="ss-bars"></div>
          <h3 style="margin-top:12px">A/B headlines</h3>
          <ul class="list" id="ss-ablist"></ul>
        </div>
      </div>
      <div data-kit-activity-host></div>
    `;
    main.appendChild(box);

    document.getElementById("ss-q").oninput = VQKit.debounce((e) => {
      state.query = document.getElementById("ss-q").value;
      state.page = 1;
      paint();
    }, 120);

    document.getElementById("ss-csv").onclick = () => {
      VQKit.downloadCSV(
        "shelfshot-assets.csv",
        state.items,
        [
          { label: "name", get: (r) => r.name },
          { label: "channel", get: (r) => r.ch },
          { label: "at", get: (r) => r.at },
          { label: "body", get: (r) => r.body }
        ]
      );
      VQKit.activity.push("ShelfShot", "CSV exported");
      VQ.toast("CSV ready");
    };

    document.getElementById("ss-abmake").onclick = () => {
      if (!state.items[0]) return VQ.toast("Generate/save an asset first");
      const base = state.items[0].name;
      state.abTests.unshift({
        id: VQ.uid(),
        a: base + " — 今日から、選び方が変わる。",
        b: base + "を選ぶ人が増えています。",
        c: "【新着】" + base + " 詳細はこちら",
        at: Date.now()
      });
      save();
      VQ.toast("A/B pack created");
    };

    document.getElementById("ss-bulk").onclick = async () => {
      const name = document.getElementById("pname")?.value.trim() || "プレミアム商品";
      const feats = document.getElementById("feats")?.value || "品質, 使いやすさ";
      const ch = document.getElementById("ch")?.value || "Amazon";
      document.getElementById("ss-bulk").disabled = true;
      for (let i = 0; i < 5; i++) {
        await VQ.think(180);
        const body = VQ.productCopy(name + " #" + (i + 1), feats);
        state.items.unshift({
          name: name + " v" + (i + 1),
          ch,
          body,
          at: new Date().toLocaleString("ja-JP"),
          ts: Date.now()
        });
        state.channelStats[ch] = (state.channelStats[ch] || 0) + 1;
      }
      document.getElementById("ss-bulk").disabled = false;
      VQKit.activity.push("ShelfShot", "Bulk generated 5 variants");
      save();
      VQ.toast("5 variants saved");
    };

    VQKit.mountActivityPanel(box.querySelector("[data-kit-activity-host]"), "ShelfShot");
  }

  // Hook original save button if present
  const origSave = document.getElementById("save");
  if (origSave) {
    const prev = origSave.onclick;
    origSave.onclick = () => {
      if (typeof prev === "function") prev();
      const out = document.getElementById("out")?.textContent || "";
      if (!out || out.includes("ここに") || out.includes("Results")) return;
      const name = document.getElementById("pname")?.value || "商品";
      const ch = document.getElementById("ch")?.value || "Amazon";
      state.items.unshift({
        name,
        ch,
        body: out,
        at: new Date().toLocaleString("ja-JP"),
        ts: Date.now()
      });
      state.channelStats[ch] = (state.channelStats[ch] || 0) + 1;
      VQKit.activity.push("ShelfShot", "Saved asset: " + name);
      save();
    };
  }

  function paint() {
    ensureUI();
    document.getElementById("ss-n").textContent = state.items.length;
    document.getElementById("ss-f").textContent = state.favorites.length;
    document.getElementById("ss-ab").textContent = state.abTests.length;
    const series = VQKit.weekSeries(state.items, (x) => x.ts || Date.now(), () => 1);
    document.getElementById("ss-spark").innerHTML = VQKit.sparkline(series, 140, 34, "#a594ff");

    const filtered = VQKit.search(state.items, state.query, ["name", "ch", "body"]);
    const page = VQKit.paginate(filtered, state.page, 6);
    document.getElementById("ss-lib").innerHTML =
      page.slice
        .map((it, idx) => {
          const real = state.items.indexOf(it);
          const fav = state.favorites.includes(it.name);
          return `<li><div><strong>${VQKit.escape(it.name)}</strong> · ${VQKit.escape(it.ch)}<br><span class="muted">${VQKit.escape(it.body.slice(0, 90))}…</span></div>
            <div class="actions"><button type="button" data-fav="${real}">${fav ? "★" : "☆"}</button>
            <button type="button" data-use="${real}">Use</button>
            <button type="button" data-del="${real}">Del</button></div></li>`;
        })
        .join("") || "<div class='empty'>No assets</div>";

    document.querySelectorAll("[data-fav]").forEach((b) => {
      b.onclick = () => {
        const name = state.items[+b.dataset.fav]?.name;
        if (!name) return;
        const i = state.favorites.indexOf(name);
        if (i >= 0) state.favorites.splice(i, 1);
        else state.favorites.push(name);
        save();
      };
    });
    document.querySelectorAll("[data-use]").forEach((b) => {
      b.onclick = () => {
        const it = state.items[+b.dataset.use];
        if (!it) return;
        if (document.getElementById("pname")) document.getElementById("pname").value = it.name;
        if (document.getElementById("out")) document.getElementById("out").textContent = it.body;
        VQ.toast("Loaded");
      };
    });
    document.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = () => {
        state.items.splice(+b.dataset.del, 1);
        save();
      };
    });

    VQKit.renderPager(document.getElementById("ss-pager"), page, (p) => {
      state.page = p;
      paint();
    });
    document.getElementById("ss-bars").innerHTML = VQKit.barChart(state.channelStats);
    document.getElementById("ss-ablist").innerHTML =
      state.abTests
        .map(
          (t) =>
            `<li><div><strong>A</strong> ${VQKit.escape(t.a)}<br><strong>B</strong> ${VQKit.escape(t.b)}<br><strong>C</strong> ${VQKit.escape(t.c)}</div></li>`
        )
        .join("") || "<div class='empty'>No A/B yet</div>";
  }

  paint();
  VQKit.bindExportButton("Export ShelfShot", "shelfshot-full.json", () => state);
})();
