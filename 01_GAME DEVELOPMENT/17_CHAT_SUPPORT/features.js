"use strict";
/* +feature pack · Deskly ops */
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

  const KEY = "vq_deskly_pro";
  const state = VQ.load(KEY, {
    tickets: [],
    tags: {},
    slaHours: 24,
    agents: ["Aya", "Ken", "Mika"],
    query: "",
    page: 1,
    knowledge: []
  });

  function sync() {
    const core = VQ.load("vq_deskly_v2", {});
    state._faq = core.faq || [];
    state._log = core.log || [];
    state._esc = core.esc || [];
    state._csat = core.csat || [];
  }

  function save() {
    VQ.store(KEY, state);
    paint();
  }

  function ensure() {
    if (document.getElementById("dk-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "dk-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>Deskly pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Open tickets</span><strong id="dk1">0</strong></div></div>
        <div class="card"><div class="stat"><span>SLA risk</span><strong id="dk2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Knowledge</span><strong id="dk3">0</strong></div></div>
        <div class="card"><div class="stat"><span>CSAT</span><strong id="dk4">-</strong></div></div>
      </div>
      <div class="toolbar">
        <button type="button" id="dk-ticket">Ticket from last chat</button>
        <button type="button" id="dk-tag">Auto-tag FAQ</button>
        <button type="button" id="dk-kb">FAQ → knowledge</button>
        <button type="button" id="dk-csv">Tickets CSV</button>
        <input id="dk-q" placeholder="Search tickets" style="max-width:200px;margin:0">
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Ticket board</h3>
          <ul class="list" id="dk-tix"></ul>
          <div id="dk-pager"></div>
        </div>
        <div>
          <h3>Volume (7d)</h3>
          <div id="dk-spark"></div>
          <h3 style="margin-top:12px">Tag mix</h3>
          <div id="dk-bars"></div>
          <h3 style="margin-top:12px">Knowledge snippets</h3>
          <ul class="list" id="dk-kb"></ul>
        </div>
      </div>
    `;
    main.appendChild(el);

    document.getElementById("dk-ticket").onclick = () => {
      sync();
      const lastUser = [...(state._log || [])].reverse().find((x) => x.role === "user");
      if (!lastUser) return VQ.toast("Chat first");
      state.tickets.unshift({
        id: VQ.uid(),
        subject: String(lastUser.text).slice(0, 60),
        body: lastUser.text,
        agent: VQ.pick(state.agents),
        status: "open",
        priority: /返金|壊|緊急|urgent/i.test(lastUser.text) ? "high" : "normal",
        at: Date.now(),
        due: Date.now() + state.slaHours * 3600000
      });
      VQKit.activity.push("Deskly", "Ticket opened");
      save();
      VQ.toast("Ticket created");
    };

    document.getElementById("dk-tag").onclick = () => {
      sync();
      state._faq.forEach((f, i) => {
        let tag = "general";
        if (/料金|price|プラン/.test(f.q)) tag = "billing";
        else if (/返品|return/.test(f.q)) tag = "returns";
        else if (/api|連携|slack/i.test(f.q)) tag = "integrations";
        else if (/営業|時間|open/.test(f.q)) tag = "hours";
        state.tags[i] = tag;
      });
      save();
      VQ.toast("FAQ tagged");
    };

    document.getElementById("dk-kb").onclick = () => {
      sync();
      state.knowledge = state._faq.map((f) => ({
        title: f.q.split(/\s+/)[0],
        body: f.a,
        at: Date.now()
      }));
      save();
      VQ.toast("Knowledge synced");
    };

    document.getElementById("dk-csv").onclick = () => {
      VQKit.downloadCSV("tickets.csv", state.tickets, [
        { label: "id", key: "id" },
        { label: "subject", key: "subject" },
        { label: "agent", key: "agent" },
        { label: "status", key: "status" },
        { label: "priority", key: "priority" },
        { label: "at", get: (r) => VQKit.fmtDate(r.at) }
      ]);
    };

    document.getElementById("dk-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("dk-q").value;
      state.page = 1;
      paint();
    }, 120);
  }

  function paint() {
    ensure();
    sync();
    const open = state.tickets.filter((t) => t.status === "open");
    const risk = open.filter((t) => t.due < Date.now() + 6 * 3600000).length;
    document.getElementById("dk1").textContent = open.length;
    document.getElementById("dk2").textContent = risk;
    document.getElementById("dk3").textContent = state.knowledge.length;
    document.getElementById("dk4").textContent = state._csat.length
      ? (state._csat.reduce((a, b) => a + b, 0) / state._csat.length).toFixed(1)
      : "-";

    document.getElementById("dk-spark").innerHTML = VQKit.sparkline(
      VQKit.weekSeries(state._log.filter((x) => x.role === "user"), (x) => x.at || Date.now()),
      240,
      48,
      "#ff8b6b"
    );
    const tagCounts = {};
    Object.values(state.tags).forEach((t) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
    document.getElementById("dk-bars").innerHTML = VQKit.barChart(tagCounts);

    const filtered = VQKit.search(state.tickets, state.query, ["subject", "agent", "status", "priority"]);
    const page = VQKit.paginate(filtered, state.page, 6);
    document.getElementById("dk-tix").innerHTML =
      page.slice
        .map(
          (t) =>
            `<li><div><strong>${VQKit.escape(t.subject)}</strong><br><span class="muted">${t.agent} · ${t.priority}</span></div><button data-c="${t.id}">Close</button></li>`
        )
        .join("") || "<div class='empty'>No tickets</div>";
    document.querySelectorAll("#dk-tix [data-c]").forEach((b) => {
      b.onclick = () => {
        const t = state.tickets.find((x) => x.id === b.dataset.c);
        if (t) t.status = "closed";
        save();
      };
    });
    VQKit.renderPager(document.getElementById("dk-pager"), page, (p) => {
      state.page = p;
      paint();
    });

    document.getElementById("dk-kb").innerHTML =
      state.knowledge
        .slice(0, 8)
        .map((k) => `<li><div><strong>${VQKit.escape(k.title)}</strong><br><span class="muted">${VQKit.escape(k.body)}</span></div></li>`)
        .join("") || "<div class='empty'>Sync FAQ</div>";
  }

  ["send", "seed", "addFaq"].forEach((id) => {
    document.getElementById(id)?.addEventListener("click", () => setTimeout(paint, 200));
  });
  paint();
  VQKit.bindExportButton("Export Deskly pro", "deskly-pro.json", () => state);
})();
