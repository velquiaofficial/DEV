"use strict";
/* +feature pack · ReserveKit ops */
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

  const KEY = "vq_reservekit_pro";
  const state = VQ.load(KEY, {
    reminders: [],
    waitlist: [],
    revenue: {},
    query: "",
    page: 1,
    prices: { カット: 4500, カウンセリング: 3000, 体験レッスン: 2000, 整体60分: 6000 }
  });

  function sync() {
    const core = VQ.load("vq_reservekit_v2", {});
    state._bookings = core.bookings || [];
    state._customers = core.customers || {};
    state._noShow = core.noShow || 0;
    state._completed = core.completed || 0;
    state._services = core.services || {};
  }

  function save() {
    VQ.store(KEY, state);
    paint();
  }

  function ensure() {
    if (document.getElementById("rk-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "rk-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>ReserveKit pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Bookings</span><strong id="rp1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Est. revenue</span><strong id="rp2">¥0</strong></div></div>
        <div class="card"><div class="stat"><span>Waitlist</span><strong id="rp3">0</strong></div></div>
        <div class="card"><div class="stat"><span>Reminders</span><strong id="rp4">0</strong></div></div>
      </div>
      <div class="toolbar">
        <button type="button" id="rp-rem">Queue reminders (24h)</button>
        <button type="button" id="rp-wait">Add selected to waitlist</button>
        <button type="button" id="rp-seed">Seed demo week</button>
        <button type="button" id="rp-csv">Bookings CSV</button>
        <input id="rp-q" placeholder="Filter bookings" style="max-width:200px;margin:0">
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Schedule board</h3>
          <ul class="list" id="rp-list"></ul>
          <div id="rp-pager"></div>
        </div>
        <div>
          <h3>Menu revenue mix</h3>
          <div id="rp-donut"></div>
          <div id="rp-bars"></div>
          <h3 style="margin-top:12px">7d volume</h3>
          <div id="rp-spark"></div>
          <h3 style="margin-top:12px">Waitlist / Reminders</h3>
          <ul class="list" id="rp-side"></ul>
        </div>
      </div>
    `;
    main.appendChild(el);

    document.getElementById("rp-rem").onclick = () => {
      sync();
      const soon = state._bookings.filter((b) => !b.status || b.status === "booked");
      soon.forEach((b) => {
        state.reminders.unshift({
          id: VQ.uid(),
          bookingId: b.id,
          name: b.name,
          when: b.when,
          channel: VQ.pick(["SMS", "LINE", "Email"]),
          at: Date.now()
        });
      });
      VQKit.activity.push("ReserveKit", "Reminders x" + soon.length);
      save();
      VQ.toast("Reminders queued");
    };

    document.getElementById("rp-wait").onclick = () => {
      sync();
      const b = state._bookings[0];
      if (!b) return VQ.toast("No booking");
      state.waitlist.unshift({ name: b.name, menu: b.menu, at: Date.now(), note: "Prefer earlier slot" });
      save();
      VQ.toast("Waitlisted " + b.name);
    };

    document.getElementById("rp-seed").onclick = () => {
      const core = VQ.load("vq_reservekit_v2", { bookings: [], customers: {}, noShow: 0, completed: 0, services: state._services });
      const menus = Object.keys(core.services || state.prices);
      for (let i = 0; i < 8; i++) {
        const when = new Date(Date.now() + i * 86400000);
        when.setHours(10 + (i % 6), 0, 0, 0);
        const name = VQ.pick(["Sato", "Suzuki", "Tanaka", "Yamada", "Ito"]);
        const menu = VQ.pick(menus.length ? menus : Object.keys(state.prices));
        core.bookings.push({
          id: VQ.uid(),
          name,
          menu,
          when: when.toISOString().slice(0, 16),
          status: "booked"
        });
        core.customers[name] = (core.customers[name] || 0) + 1;
      }
      VQ.store("vq_reservekit_v2", core);
      if (typeof render === "function") render();
      VQKit.activity.push("ReserveKit", "Seeded demo week");
      save();
      VQ.toast("Seeded 8 bookings");
    };

    document.getElementById("rp-csv").onclick = () => {
      sync();
      VQKit.downloadCSV("bookings.csv", state._bookings, [
        { label: "when", key: "when" },
        { label: "name", key: "name" },
        { label: "menu", key: "menu" },
        { label: "status", key: "status" },
        { label: "price", get: (r) => state.prices[r.menu] || 0 }
      ]);
    };

    document.getElementById("rp-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("rp-q").value;
      state.page = 1;
      paint();
    }, 120);
  }

  function paint() {
    ensure();
    sync();
    let rev = 0;
    const mix = {};
    state._bookings.forEach((b) => {
      if (b.status === "no-show") return;
      const p = state.prices[b.menu] || 3000;
      rev += p;
      mix[b.menu] = (mix[b.menu] || 0) + p;
    });
    document.getElementById("rp1").textContent = state._bookings.length;
    document.getElementById("rp2").textContent = VQKit.fmtYen(rev);
    document.getElementById("rp3").textContent = state.waitlist.length;
    document.getElementById("rp4").textContent = state.reminders.length;

    document.getElementById("rp-donut").innerHTML = VQKit.donut(
      Object.fromEntries(Object.entries(mix).map(([k, v]) => [k, Math.round(v / 1000)])),
      130
    );
    document.getElementById("rp-bars").innerHTML = VQKit.barChart(
      Object.fromEntries(Object.entries(mix).map(([k, v]) => [k, v]))
    );
    document.getElementById("rp-spark").innerHTML = VQKit.sparkline(
      VQKit.weekSeries(state._bookings, (b) => {
        const t = Date.parse(String(b.when).replace(" ", "T"));
        return isNaN(t) ? Date.now() : t;
      }),
      240,
      48,
      "#e0b84a"
    );

    const filtered = VQKit.search(state._bookings, state.query, ["name", "menu", "when", "status"]);
    const page = VQKit.paginate(VQKit.sortBy(filtered, (b) => b.when, "asc"), state.page, 7);
    document.getElementById("rp-list").innerHTML =
      page.slice
        .map(
          (b) =>
            `<li><div><strong>${VQKit.escape(b.name)}</strong> · ${VQKit.escape(b.menu)}<br><span class="muted">${VQKit.escape(b.when)} · ${VQKit.fmtYen(state.prices[b.menu] || 0)}</span></div><span class="badge">${b.status || "booked"}</span></li>`
        )
        .join("") || "<div class='empty'>No bookings</div>";
    VQKit.renderPager(document.getElementById("rp-pager"), page, (p) => {
      state.page = p;
      paint();
    });

    document.getElementById("rp-side").innerHTML =
      state.waitlist
        .slice(0, 4)
        .map((w) => `<li><div>Wait · ${VQKit.escape(w.name)} (${VQKit.escape(w.menu)})</div></li>`)
        .join("") +
      state.reminders
        .slice(0, 4)
        .map((r) => `<li><div>${r.channel} → ${VQKit.escape(r.name)}</div><span class="badge">${VQKit.escape(r.when)}</span></li>`)
        .join("");
  }

  document.getElementById("book")?.addEventListener("click", () => setTimeout(paint, 100));
  paint();
  setInterval(paint, 2000);
  VQKit.bindExportButton("Export ReserveKit pro", "reservekit-pro.json", () => state);
})();
