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

  const KEY = "vq_outreach_v2";
  const state = VQ.load(KEY, {
    leads: [],
    seq: [],
    sent: [],
    personas: ["EC store owner", "Salon manager", "Agency producer", "Indie founder"],
    offers: ["PulsePost automation", "ShelfShot assets", "ReserveKit booking"],
    query: "",
    page: 1,
    scores: {}
  });
  try {
    const legacy = VQ.load("vq_outreach_v1", null);
    if (legacy) {
      state.leads = legacy.leads || state.leads;
      state.seq = legacy.seq || state.seq;
    }
  } catch (_) {}

  function save() {
    VQ.store(KEY, state);
    VQ.store("vq_outreach_v1", { leads: state.leads, seq: state.seq, last: state.last || "" });
    paint();
  }

  function ensure() {
    if (document.getElementById("or-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "or-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>Outreach pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Leads</span><strong id="or1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Sequences</span><strong id="or2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Sent log</span><strong id="or3">0</strong></div></div>
        <div class="card"><div class="stat"><span>Avg score</span><strong id="or4">-</strong></div></div>
      </div>
      <div class="toolbar">
        <button type="button" id="or-fill">Fill persona/offer</button>
        <button type="button" id="or-score">Score current email</button>
        <button type="button" id="or-send">Log as sent to selected leads</button>
        <button type="button" id="or-csv">Leads CSV</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Lead CRM</h3>
          <input id="or-q" placeholder="Filter leads">
          <ul class="list" id="or-leads"></ul>
          <div id="or-pager"></div>
        </div>
        <div>
          <h3>Send velocity (7d)</h3>
          <div id="or-spark"></div>
          <h3 style="margin-top:12px">Snippet library</h3>
          <ul class="list" id="or-snip"></ul>
        </div>
      </div>
    `;
    main.appendChild(el);
    document.getElementById("or-fill").onclick = () => {
      if (document.getElementById("persona")) document.getElementById("persona").value = VQ.pick(state.personas);
      if (document.getElementById("offer")) document.getElementById("offer").value = VQ.pick(state.offers);
      VQ.toast("Filled");
    };
    document.getElementById("or-score").onclick = () => {
      const mail = document.getElementById("mail")?.textContent || "";
      if (!mail || mail.length < 20) return VQ.toast("Generate email first");
      let score = 40;
      if (/件名:/.test(mail)) score += 10;
      if (mail.length > 200 && mail.length < 900) score += 20;
      if (/15分|デモ|候補日/.test(mail)) score += 20;
      if (/突然/.test(mail)) score += 5;
      state.scores[Date.now()] = score;
      VQ.toast("Score " + score + "/100");
      paint();
    };
    document.getElementById("or-send").onclick = () => {
      const mail = document.getElementById("mail")?.textContent || "";
      if (!mail) return VQ.toast("No email");
      const targets = state.leads.slice(0, 5);
      targets.forEach((l) => state.sent.push({ lead: l, at: Date.now(), preview: mail.slice(0, 80) }));
      VQKit.activity.push("Outreach", "Logged sends x" + targets.length);
      save();
      VQ.toast("Logged " + targets.length);
    };
    document.getElementById("or-csv").onclick = () => {
      VQKit.downloadCSV(
        "leads.csv",
        state.leads.map((l) => ({ email: l })),
        [{ label: "email", key: "email" }]
      );
    };
    document.getElementById("or-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("or-q").value;
      state.page = 1;
      paint();
    }, 120);
  }

  function paint() {
    ensure();
    document.getElementById("or1").textContent = state.leads.length;
    document.getElementById("or2").textContent = state.seq.length;
    document.getElementById("or3").textContent = state.sent.length;
    const scores = Object.values(state.scores);
    document.getElementById("or4").textContent = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : "-";

    const filtered = VQKit.search(
      state.leads.map((e) => ({ email: e })),
      state.query,
      ["email"]
    );
    const page = VQKit.paginate(filtered, state.page, 8);
    document.getElementById("or-leads").innerHTML =
      page.slice
        .map((l) => {
          const i = state.leads.indexOf(l.email);
          return `<li><div>${VQKit.escape(l.email)}</div><button data-x="${i}">Del</button></li>`;
        })
        .join("") || "<div class='empty'>Add leads</div>";
    document.querySelectorAll("#or-leads [data-x]").forEach((b) => {
      b.onclick = () => {
        state.leads.splice(+b.dataset.x, 1);
        save();
      };
    });
    VQKit.renderPager(document.getElementById("or-pager"), page, (p) => {
      state.page = p;
      paint();
    });
    document.getElementById("or-spark").innerHTML = VQKit.sparkline(
      VQKit.weekSeries(state.sent, (s) => s.at),
      220,
      48,
      "#ff8b6b"
    );
    document.getElementById("or-snip").innerHTML = [
      "ご都合の良い15分でデモが可能です。",
      "まずは试点（パイロット）から始められます。",
      "効果が見えなければ拡大不要です。"
    ]
      .map((t) => `<li><div>${t}</div><button data-c="1">Copy</button></li>`)
      .join("");
    document.querySelectorAll("#or-snip [data-c]").forEach((b) => {
      b.onclick = async () => {
        await navigator.clipboard.writeText(b.parentElement.querySelector("div").textContent);
        VQ.toast("Copied");
      };
    });
  }

  // sync add lead
  const addL = document.getElementById("addL");
  if (addL) {
    addL.addEventListener("click", () => {
      setTimeout(() => {
        const legacy = VQ.load("vq_outreach_v1", {});
        state.leads = legacy.leads || state.leads;
        save();
      }, 0);
    });
  }

  if (!state.leads.length) state.leads = ["owner@shop.example", "hello@salon.example", "team@studio.example"];
  save();
  VQKit.bindExportButton("Export Outreach", "outreach-pro.json", () => state);
})();
