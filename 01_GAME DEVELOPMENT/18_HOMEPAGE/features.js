"use strict";
/* +feature pack · SiteSpark studio */
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

  const KEY = "vq_sitespark_pro";
  const state = VQ.load(KEY, {
    seo: {},
    sections: [],
    variants: [],
    audits: [],
    query: "",
    page: 1
  });

  function sync() {
    const core = VQ.load("vq_sitespark_v2", {});
    state._sites = core.sites || [];
    state._html = core.html || "";
    state._theme = core.theme || "violet";
  }

  function save() {
    VQ.store(KEY, state);
    paint();
  }

  function auditHtml(html) {
    const issues = [];
    if (!html) return [{ level: "warn", msg: "No HTML yet" }];
    if (!/<h1/i.test(html)) issues.push({ level: "warn", msg: "Missing H1" });
    if (!/<meta[^>]+description/i.test(html)) issues.push({ level: "info", msg: "No meta description in snippet" });
    if ((html.match(/<img/gi) || []).length === 0) issues.push({ level: "info", msg: "No images detected" });
    if (html.length < 400) issues.push({ level: "warn", msg: "Thin content" });
    if (!/予約|contact|お問い合わせ|cta/i.test(html)) issues.push({ level: "warn", msg: "Weak CTA signal" });
    if (!issues.length) issues.push({ level: "ok", msg: "Looks solid for a demo landing" });
    return issues;
  }

  function ensure() {
    if (document.getElementById("sp-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "sp-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>SiteSpark pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Saved sites</span><strong id="sp1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Section packs</span><strong id="sp2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Headline A/B</span><strong id="sp3">0</strong></div></div>
        <div class="card"><div class="stat"><span>Audits</span><strong id="sp4">0</strong></div></div>
      </div>
      <div class="toolbar">
        <button type="button" id="sp-seo">Generate SEO pack</button>
        <button type="button" id="sp-sec">Build section outline</button>
        <button type="button" id="sp-ab">Headline A/B/C</button>
        <button type="button" id="sp-audit">Run HTML audit</button>
        <button type="button" id="sp-csv">Sites CSV</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>SEO pack</h3>
          <pre id="sp-seo-out" class="preview" style="min-height:120px"></pre>
          <h3 style="margin-top:12px">Sections</h3>
          <ul class="list" id="sp-secs"></ul>
        </div>
        <div>
          <h3>Headline variants</h3>
          <ul class="list" id="sp-ab"></ul>
          <h3 style="margin-top:12px">Audit log</h3>
          <ul class="list" id="sp-aud"></ul>
          <h3 style="margin-top:12px">Library</h3>
          <input id="sp-q" placeholder="Filter sites">
          <ul class="list" id="sp-lib"></ul>
          <div id="sp-pager"></div>
        </div>
      </div>
    `;
    main.appendChild(el);

    document.getElementById("sp-seo").onclick = () => {
      const name = document.getElementById("name")?.value || "VELQUIA Shop";
      const biz = document.getElementById("biz")?.value || "local business";
      const offer = document.getElementById("offer")?.value || "";
      state.seo = {
        title: name + " | " + biz.slice(0, 24),
        description: (offer || name + "の公式サイト。予約・お問い合わせはこちら。").slice(0, 120),
        og: name + " — " + biz,
        keywords: [biz, name, "予約", "公式"].join(", ")
      };
      VQKit.activity.push("SiteSpark", "SEO pack");
      save();
      VQ.toast("SEO ready");
    };

    document.getElementById("sp-sec").onclick = () => {
      const name = document.getElementById("name")?.value || "Shop";
      state.sections = [
        { id: "hero", title: name, copy: "Brand-first hero, one CTA" },
        { id: "proof", title: "Why us", copy: "3 short proof points" },
        { id: "offer", title: "Offer", copy: document.getElementById("offer")?.value || "Core offer" },
        { id: "faq", title: "FAQ", copy: "Pricing · hours · access" },
        { id: "cta", title: "Book", copy: "Primary conversion block" }
      ];
      save();
      VQ.toast("Outline built");
    };

    document.getElementById("sp-ab").onclick = () => {
      const name = document.getElementById("name")?.value || "Shop";
      const offer = document.getElementById("offer")?.value || "体験を予約";
      state.variants = [
        name + "で、今日の選択が変わる。",
        offer + " — まずは15分から。",
        "静かに強い。" + name + "。"
      ];
      save();
      VQ.toast("A/B/C ready");
    };

    document.getElementById("sp-audit").onclick = () => {
      sync();
      const issues = auditHtml(state._html);
      state.audits.unshift({ at: Date.now(), issues });
      save();
      VQ.toast("Audit done");
    };

    document.getElementById("sp-csv").onclick = () => {
      sync();
      VQKit.downloadCSV(
        "sites.csv",
        state._sites,
        [
          { label: "name", key: "name" },
          { label: "biz", key: "biz" },
          { label: "chars", get: (r) => (r.html || "").length }
        ]
      );
    };

    document.getElementById("sp-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("sp-q").value;
      state.page = 1;
      paint();
    }, 120);
  }

  function paint() {
    ensure();
    sync();
    document.getElementById("sp1").textContent = state._sites.length;
    document.getElementById("sp2").textContent = state.sections.length;
    document.getElementById("sp3").textContent = state.variants.length;
    document.getElementById("sp4").textContent = state.audits.length;

    document.getElementById("sp-seo-out").textContent = state.seo.title
      ? Object.entries(state.seo)
          .map(([k, v]) => k + ": " + v)
          .join("\n")
      : "Generate SEO pack";

    document.getElementById("sp-secs").innerHTML =
      state.sections
        .map((s) => `<li><div><strong>${s.id}</strong> · ${VQKit.escape(s.title)}<br><span class="muted">${VQKit.escape(s.copy)}</span></div></li>`)
        .join("") || "<div class='empty'>Build outline</div>";

    document.getElementById("sp-ab").innerHTML =
      state.variants.map((v, i) => `<li><div>${VQKit.escape(v)}</div><span class="badge">${String.fromCharCode(65 + i)}</span></li>`).join("") ||
      "<div class='empty'>Make A/B</div>";

    document.getElementById("sp-aud").innerHTML =
      (state.audits[0]?.issues || [])
        .map((i) => `<li><div>${VQKit.escape(i.msg)}</div><span class="badge ${i.level === "ok" ? "ok" : "warn"}">${i.level}</span></li>`)
        .join("") || "<div class='empty'>Run audit</div>";

    const filtered = VQKit.search(state._sites, state.query, ["name", "biz"]);
    const page = VQKit.paginate(filtered, state.page, 5);
    document.getElementById("sp-lib").innerHTML =
      page.slice
        .map((s) => `<li><div><strong>${VQKit.escape(s.name)}</strong><br><span class="muted">${VQKit.escape(s.biz)}</span></div></li>`)
        .join("") || "<div class='empty'>No sites</div>";
    VQKit.renderPager(document.getElementById("sp-pager"), page, (p) => {
      state.page = p;
      paint();
    });
  }

  document.getElementById("gen")?.addEventListener("click", () => setTimeout(paint, 400));
  document.getElementById("save")?.addEventListener("click", () => setTimeout(paint, 100));
  paint();
  VQKit.bindExportButton("Export SiteSpark pro", "sitespark-pro.json", () => state);
})();
