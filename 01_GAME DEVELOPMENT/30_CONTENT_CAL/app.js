"use strict";
(function () {
  const KEY = "vq_pulsecal_v1";
  const KIND = "calendar";
  const state = VQ.load(KEY, defaultState());

  function defaultState() {
    if (KIND === "calendar") return { items: [], ideas: [], score: {} };
    if (KIND === "competitor") return { rivals: [], cards: [], watch: [] };
    if (KIND === "form") return { fields: [], responses: [], title: "Lead form" };
    if (KIND === "knowledge") return { articles: [], query: "", faq: [] };
    if (KIND === "proposal") return { brief: "", draft: "", lines: [], total: 0 };
    if (KIND === "inventory") return { skus: [], orders: [] };
    if (KIND === "loyalty") return { members: [], campaigns: [] };
    if (KIND === "newsletter") return { issues: [], subjects: [] };
    if (KIND === "analytics") return { kpis: {}, notes: [], report: "" };
    if (KIND === "onboarding") return { steps: [], mails: [], scores: [] };
    return {};
  }

  function save() { VQ.store(KEY, state); render(); }

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.onclick = () => {
      document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll("main section[id^=view-]").forEach((s) => {
        s.classList.toggle("hidden", s.id !== "view-" + btn.dataset.view);
      });
    };
  });

  function host(id) { return document.getElementById("view-" + id); }

  function kpi(vals) {
    return '<div class="kpi-row">' + vals.map((v) =>
      '<div class="card"><div class="stat"><span>' + v[0] + '</span><strong>' + v[1] + '</strong></div></div>'
    ).join("") + '</div>';
  }

  function renderCalendar() {
    host("board").innerHTML = kpi([
      ["Planned", state.items.length],
      ["Ideas", state.ideas.length],
      ["This week", state.items.filter((x) => x.week === "current").length],
      ["Avg score", Object.values(state.score).length ? Math.round(VQKit.avg(Object.values(state.score))) : "-"]
    ]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Schedule item</h2>
          <label>Title</label><input id="c-title" placeholder="Launch teaser">
          <label>Channel</label><select id="c-ch"><option>X</option><option>Instagram</option><option>Newsletter</option><option>Blog</option></select>
          <label>Day</label><select id="c-day"><option>Mon</option><option>Tue</option><option>Wed</option><option>Thu</option><option>Fri</option><option>Sat</option><option>Sun</option></select>
          <div class="actions"><button class="primary" id="c-add" type="button">Add to board</button></div>
        </div>
        <div class="card"><h2>Week board</h2><ul class="list" id="c-list"></ul></div>
      </div>`;
    host("ideas").innerHTML = '<div class="card"><h2>Idea backlog</h2><ul class="list" id="c-ideas"></ul></div>';
    host("export").innerHTML = '<div class="card"><h2>Week plan</h2><pre class="preview" id="c-out"></pre><div class="actions"><button id="c-csv" type="button">CSV</button></div></div>';
    document.getElementById("c-list").innerHTML = state.items.map((it, i) =>
      '<li><div><strong>' + VQKit.escape(it.title) + '</strong><br><span class="muted">' + it.day + ' · ' + it.ch + '</span></div><button data-x="' + i + '">Del</button></li>'
    ).join("") || "<div class='empty'>No posts planned</div>";
    document.querySelectorAll("#c-list [data-x]").forEach((b) => b.onclick = () => { state.items.splice(+b.dataset.x, 1); save(); });
    document.getElementById("c-add").onclick = () => {
      const title = document.getElementById("c-title").value.trim() || "Untitled";
      state.items.push({ title, ch: document.getElementById("c-ch").value, day: document.getElementById("c-day").value, week: "current", at: Date.now() });
      save(); VQ.toast("Scheduled");
    };
    document.getElementById("c-ideas").innerHTML = state.ideas.map((t) => '<li><div>' + VQKit.escape(t) + '</div><span class="badge">idea</span></li>').join("") || "<div class='empty'>Run AI for ideas</div>";
    document.getElementById("c-out").textContent = state.items.map((it) => it.day + " | " + it.ch + " | " + it.title).join("\n") || "Empty plan";
    document.getElementById("c-csv").onclick = () => VQKit.downloadCSV("pulsecal.csv", state.items, [
      { label: "day", key: "day" }, { label: "channel", key: "ch" }, { label: "title", key: "title" }
    ]);
  }

  function renderCompetitor() {
    host("scan").innerHTML = kpi([["Rivals", state.rivals.length], ["Cards", state.cards.length], ["Watch", state.watch.length], ["Threats", state.rivals.filter((r) => r.threat === "high").length]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Add rival</h2>
          <label>Name</label><input id="r-name" placeholder="Competitor Co">
          <label>Positioning</label><textarea id="r-pos" placeholder="Cheap / premium / speed…"></textarea>
          <label>Threat</label><select id="r-th"><option>low</option><option>mid</option><option selected>high</option></select>
          <div class="actions"><button class="primary" id="r-add" type="button">Save rival</button></div>
        </div>
        <div class="card"><h2>Watchlist</h2><ul class="list" id="r-list"></ul></div>
      </div>`;
    host("cards").innerHTML = '<div class="card"><h2>Battle cards</h2><ul class="list" id="r-cards"></ul></div>';
    host("watch").innerHTML = '<div class="card"><h2>Signals</h2><div id="r-bars"></div></div>';
    document.getElementById("r-list").innerHTML = state.rivals.map((r, i) =>
      '<li><div><strong>' + VQKit.escape(r.name) + '</strong><br><span class="muted">' + VQKit.escape(r.pos) + '</span></div><span class="badge ' + (r.threat === "high" ? "danger" : "warn") + '">' + r.threat + '</span></li>'
    ).join("") || "<div class='empty'>Add competitors</div>";
    document.getElementById("r-add").onclick = () => {
      state.rivals.unshift({ name: document.getElementById("r-name").value || "Rival", pos: document.getElementById("r-pos").value || "—", threat: document.getElementById("r-th").value, at: Date.now() });
      save(); VQ.toast("Rival saved");
    };
    document.getElementById("r-cards").innerHTML = state.cards.map((c) => '<li><div><strong>' + VQKit.escape(c.vs) + '</strong><br><span class="muted">' + VQKit.escape(c.body) + '</span></div></li>').join("") || "<div class='empty'>Run AI</div>";
    const mix = VQKit.groupCount(state.rivals, (r) => r.threat);
    document.getElementById("r-bars").innerHTML = VQKit.barChart(mix);
  }

  function renderForm() {
    host("build").innerHTML = kpi([["Fields", state.fields.length], ["Responses", state.responses.length], ["Title", state.title.slice(0, 12)], ["Completion", state.fields.length ? "ready" : "-"]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Form builder</h2>
          <label>Form title</label><input id="f-title" value="${VQKit.escape(state.title)}">
          <label>Field label</label><input id="f-label" placeholder="Company size">
          <label>Type</label><select id="f-type"><option>text</option><option>email</option><option>select</option><option>textarea</option></select>
          <div class="actions"><button class="primary" id="f-add" type="button">Add field</button></div>
        </div>
        <div class="card"><h2>Schema</h2><ul class="list" id="f-fields"></ul></div>
      </div>`;
    host("preview").innerHTML = '<div class="card"><h2>Live preview</h2><div id="f-prev"></div><div class="actions"><button class="primary" id="f-submit" type="button">Submit sample</button></div></div>';
    host("results").innerHTML = '<div class="card"><h2>Responses</h2><ul class="list" id="f-res"></ul></div>';
    document.getElementById("f-fields").innerHTML = state.fields.map((f, i) => '<li><div><strong>' + VQKit.escape(f.label) + '</strong><br><span class="muted">' + f.type + '</span></div><button data-x="' + i + '">Del</button></li>').join("") || "<div class='empty'>No fields</div>";
    document.querySelectorAll("#f-fields [data-x]").forEach((b) => b.onclick = () => { state.fields.splice(+b.dataset.x, 1); save(); });
    document.getElementById("f-add").onclick = () => {
      state.title = document.getElementById("f-title").value || state.title;
      state.fields.push({ label: document.getElementById("f-label").value || "Field", type: document.getElementById("f-type").value });
      save();
    };
    document.getElementById("f-prev").innerHTML = "<h3>" + VQKit.escape(state.title) + "</h3>" + state.fields.map((f, i) =>
      "<label>" + VQKit.escape(f.label) + "</label>" + (f.type === "textarea" ? '<textarea id="fp' + i + '"></textarea>' : '<input id="fp' + i + '" type="' + (f.type === "email" ? "email" : "text") + '">')
    ).join("") || "<div class='empty'>Add fields</div>";
    document.getElementById("f-submit").onclick = () => {
      const row = {};
      state.fields.forEach((f, i) => { row[f.label] = document.getElementById("fp" + i)?.value || ""; });
      state.responses.unshift({ at: Date.now(), row });
      save(); VQ.toast("Response logged");
    };
    document.getElementById("f-res").innerHTML = state.responses.slice(0, 12).map((r) => '<li><div>' + VQKit.escape(JSON.stringify(r.row)) + '</div><span class="badge">' + VQKit.relativeTime(r.at) + '</span></li>').join("") || "<div class='empty'>No responses</div>";
  }

  function renderKnowledge() {
    host("library").innerHTML = kpi([["Articles", state.articles.length], ["FAQ", state.faq.length], ["Query", state.query ? "on" : "off"], ["Chars", state.articles.reduce((s, a) => s + (a.body || "").length, 0)]]) + `
      <div class="card">
        <div class="toolbar"><input id="k-q" placeholder="Search knowledge…" value="${VQKit.escape(state.query)}"><button id="k-go" type="button">Search</button></div>
        <ul class="list" id="k-list"></ul>
      </div>`;
    host("editor").innerHTML = `
      <div class="card">
        <h2>New article</h2>
        <label>Title</label><input id="k-title" placeholder="Refund policy">
        <label>Body</label><textarea id="k-body" placeholder="Steps…"></textarea>
        <div class="actions"><button class="primary" id="k-save" type="button">Publish</button></div>
      </div>`;
    host("faq").innerHTML = '<div class="card"><h2>Generated FAQ</h2><ul class="list" id="k-faq"></ul></div>';
    const filtered = VQKit.search(state.articles, state.query, ["title", "body"]);
    document.getElementById("k-list").innerHTML = filtered.map((a) => '<li><div><strong>' + VQKit.escape(a.title) + '</strong><br><span class="muted">' + VQKit.escape((a.body || "").slice(0, 120)) + '</span></div></li>').join("") || "<div class='empty'>No articles</div>";
    document.getElementById("k-go").onclick = () => { state.query = document.getElementById("k-q").value; save(); };
    document.getElementById("k-save").onclick = () => {
      state.articles.unshift({ title: document.getElementById("k-title").value || "Untitled", body: document.getElementById("k-body").value || "", at: Date.now() });
      save(); VQ.toast("Published");
    };
    document.getElementById("k-faq").innerHTML = state.faq.map((f) => '<li><div><strong>' + VQKit.escape(f.q) + '</strong><br><span class="muted">' + VQKit.escape(f.a) + '</span></div></li>').join("") || "<div class='empty'>Run AI</div>";
  }

  function renderProposal() {
    host("brief").innerHTML = `
      <div class="card">
        <h2>Client brief</h2>
        <label>Client</label><input id="p-client" placeholder="Acme Salon">
        <label>Goal</label><textarea id="p-goal" placeholder="Increase bookings 30%"></textarea>
        <label>Budget (yen)</label><input id="p-budget" type="number" value="300000">
      </div>`;
    host("draft").innerHTML = '<div class="card"><h2>Proposal draft</h2><pre class="preview" id="p-draft">' + VQKit.escape(state.draft || "Run AI") + '</pre></div>';
    host("pricing").innerHTML = kpi([["Line items", state.lines.length], ["Total", VQKit.fmtYen(state.total)], ["Tax 10%", VQKit.fmtYen(Math.floor(state.total * 0.1))], ["Grand", VQKit.fmtYen(state.total + Math.floor(state.total * 0.1))]]) +
      '<div class="card"><h2>Pricing table</h2><table class="table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Sum</th></tr></thead><tbody id="p-lines"></tbody></table></div>';
    document.getElementById("p-lines").innerHTML = state.lines.map((l) => '<tr><td>' + VQKit.escape(l.name) + '</td><td>' + l.qty + '</td><td>' + VQKit.fmtYen(l.price) + '</td><td>' + VQKit.fmtYen(l.sum) + '</td></tr>').join("") || '<tr><td colspan="4" class="muted">No lines</td></tr>';
  }

  function renderInventory() {
    host("stock").innerHTML = kpi([["SKUs", state.skus.length], ["Low", state.skus.filter((s) => s.qty <= s.reorder).length], ["Value", VQKit.fmtYen(state.skus.reduce((a, s) => a + s.qty * s.cost, 0))], ["Orders", state.orders.length]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Add SKU</h2>
          <label>SKU</label><input id="i-sku" placeholder="MUG-350">
          <label>Name</label><input id="i-name" placeholder="Ceramic mug">
          <label>Qty</label><input id="i-qty" type="number" value="12">
          <label>Reorder at</label><input id="i-re" type="number" value="5">
          <label>Unit cost</label><input id="i-cost" type="number" value="800">
          <div class="actions"><button class="primary" id="i-add" type="button">Add</button></div>
        </div>
        <div class="card"><h2>Stock list</h2><ul class="list" id="i-list"></ul></div>
      </div>`;
    host("alerts").innerHTML = '<div class="card"><h2>Low stock</h2><ul class="list" id="i-alerts"></ul></div>';
    host("orders").innerHTML = '<div class="card"><h2>Reorder suggestions</h2><ul class="list" id="i-ord"></ul><div class="actions"><button class="primary" id="i-place" type="button">Queue suggested orders</button></div></div>';
    document.getElementById("i-list").innerHTML = state.skus.map((s) => '<li><div><strong>' + VQKit.escape(s.sku) + '</strong> · ' + VQKit.escape(s.name) + '<br><span class="muted">qty ' + s.qty + ' · reorder ' + s.reorder + '</span></div><span class="badge ' + (s.qty <= s.reorder ? "danger" : "ok") + '">' + s.qty + '</span></li>').join("") || "<div class='empty'>No SKUs</div>";
    document.getElementById("i-add").onclick = () => {
      state.skus.push({ sku: document.getElementById("i-sku").value || "SKU", name: document.getElementById("i-name").value || "Item", qty: +document.getElementById("i-qty").value || 0, reorder: +document.getElementById("i-re").value || 0, cost: +document.getElementById("i-cost").value || 0 });
      save();
    };
    const low = state.skus.filter((s) => s.qty <= s.reorder);
    document.getElementById("i-alerts").innerHTML = low.map((s) => '<li><div>' + VQKit.escape(s.name) + '</div><span class="badge danger">low</span></li>').join("") || "<div class='empty'>All healthy</div>";
    document.getElementById("i-ord").innerHTML = state.orders.map((o) => '<li><div>' + VQKit.escape(o.sku) + ' × ' + o.qty + '</div><span class="badge">' + o.status + '</span></li>').join("") || "<div class='empty'>No orders</div>";
    document.getElementById("i-place").onclick = () => {
      low.forEach((s) => state.orders.unshift({ sku: s.sku, qty: Math.max(10, s.reorder * 2), status: "suggested", at: Date.now() }));
      save(); VQ.toast("Orders queued");
    };
  }

  function renderLoyalty() {
    host("members").innerHTML = kpi([["Members", state.members.length], ["Gold+", state.members.filter((m) => m.tier === "gold" || m.tier === "platinum").length], ["Points", state.members.reduce((a, m) => a + m.points, 0)], ["Campaigns", state.campaigns.length]]) + `
      <div class="grid grid-2">
        <div class="card">
          <h2>Add member</h2>
          <label>Name</label><input id="l-name" placeholder="Yuki">
          <label>Points</label><input id="l-pts" type="number" value="100">
          <label>Tier</label><select id="l-tier"><option>silver</option><option>gold</option><option>platinum</option></select>
          <div class="actions"><button class="primary" id="l-add" type="button">Add</button></div>
        </div>
        <div class="card"><h2>Roster</h2><ul class="list" id="l-list"></ul></div>
      </div>`;
    host("tiers").innerHTML = '<div class="card"><h2>Tier mix</h2><div id="l-donut"></div><div id="l-bars"></div></div>';
    host("campaigns").innerHTML = '<div class="card"><h2>Campaigns</h2><ul class="list" id="l-camp"></ul><div class="actions"><button id="l-new" type="button">New 2× points weekend</button></div></div>';
    document.getElementById("l-list").innerHTML = state.members.map((m) => '<li><div><strong>' + VQKit.escape(m.name) + '</strong><br><span class="muted">' + m.points + ' pts</span></div><span class="badge">' + m.tier + '</span></li>').join("") || "<div class='empty'>No members</div>";
    document.getElementById("l-add").onclick = () => {
      state.members.unshift({ name: document.getElementById("l-name").value || "Member", points: +document.getElementById("l-pts").value || 0, tier: document.getElementById("l-tier").value });
      save();
    };
    const mix = VQKit.groupCount(state.members, (m) => m.tier);
    document.getElementById("l-donut").innerHTML = VQKit.donut(mix, 140);
    document.getElementById("l-bars").innerHTML = VQKit.barChart(mix);
    document.getElementById("l-camp").innerHTML = state.campaigns.map((c) => '<li><div>' + VQKit.escape(c.name) + '</div><span class="badge ok">' + c.mult + '×</span></li>').join("") || "<div class='empty'>No campaigns</div>";
    document.getElementById("l-new").onclick = () => { state.campaigns.unshift({ name: "2× points weekend", mult: 2, at: Date.now() }); save(); };
  }

  function renderNewsletter() {
    const body0 = (state.issues[0] && state.issues[0].body) || "Run AI";
    host("compose").innerHTML =
      '<div class="grid grid-2"><div class="card"><h2>Issue</h2><label>Theme</label><input id="n-theme" placeholder="March studio update"><label>Notes</label><textarea id="n-notes" placeholder="Highlights…"></textarea></div>' +
      '<div class="card"><h2>Draft body</h2><pre class="preview" id="n-body">' + VQKit.escape(body0) + '</pre></div></div>';
    host("subjects").innerHTML = '<div class="card"><h2>Subject lines</h2><ul class="list" id="n-sub"></ul></div>';
    host("archive").innerHTML = '<div class="card"><h2>Archive</h2><ul class="list" id="n-arch"></ul></div>';
    document.getElementById("n-sub").innerHTML = state.subjects.map((s) => '<li><div>' + VQKit.escape(s) + '</div><button data-c="1">Copy</button></li>').join("") || "<div class='empty'>Run AI</div>";
    document.querySelectorAll("#n-sub [data-c]").forEach((b) => b.onclick = () => VQKit.copyText(b.parentElement.querySelector("div").textContent));
    document.getElementById("n-arch").innerHTML = state.issues.map((i) => '<li><div><strong>' + VQKit.escape(i.theme) + '</strong><br><span class="muted">' + VQKit.escape((i.body || "").slice(0, 100)) + '</span></div></li>').join("") || "<div class='empty'>No issues</div>";
  }

  function renderAnalytics() {
    const k = state.kpis;
    host("board").innerHTML = kpi([
      ["Revenue", VQKit.fmtYen(k.revenue || 0)],
      ["Users", k.users || 0],
      ["Conv %", (k.conv || 0) + "%"],
      ["NPS", k.nps || "-"]
    ]) + '<div class="card"><h2>7d trend</h2><div id="a-spark"></div><div id="a-bars" style="margin-top:12px"></div></div>';
    host("funnel").innerHTML = '<div class="card"><h2>Funnel notes</h2><ul class="list" id="a-notes"></ul></div>';
    host("report").innerHTML = '<div class="card"><h2>Weekly narrative</h2><pre class="preview" id="a-rep">' + VQKit.escape(state.report || "Run AI") + '</pre></div>';
    document.getElementById("a-spark").innerHTML = VQKit.sparkline(k.series || [2, 3, 3, 5, 4, 6, 7], 280, 56, "#a594ff");
    document.getElementById("a-bars").innerHTML = VQKit.barChart({ Visit: k.visit || 0, Signup: k.signup || 0, Paid: k.paid || 0 });
    document.getElementById("a-notes").innerHTML = state.notes.map((n) => '<li><div>' + VQKit.escape(n) + '</div></li>').join("") || "<div class='empty'>Seed or run AI</div>";
  }

  function renderOnboarding() {
    host("journey").innerHTML = kpi([["Steps", state.steps.length], ["Done", state.steps.filter((s) => s.done).length], ["Mails", state.mails.length], ["Avg health", state.scores.length ? Math.round(VQKit.avg(state.scores)) : "-"]]) + `
      <div class="card"><h2>Journey checklist</h2><ul class="list" id="o-steps"></ul></div>`;
    host("mails").innerHTML = '<div class="card"><h2>Milestone mails</h2><ul class="list" id="o-mails"></ul></div>';
    host("health").innerHTML = '<div class="card"><h2>Health scores</h2><div id="o-hist"></div></div>';
    document.getElementById("o-steps").innerHTML = state.steps.map((s, i) =>
      '<li><div><strong>' + VQKit.escape(s.title) + '</strong><br><span class="muted">' + VQKit.escape(s.desc || "") + '</span></div><button data-t="' + i + '">' + (s.done ? "Undo" : "Done") + '</button></li>'
    ).join("") || "<div class='empty'>Seed demo</div>";
    document.querySelectorAll("#o-steps [data-t]").forEach((b) => b.onclick = () => { state.steps[+b.dataset.t].done = !state.steps[+b.dataset.t].done; save(); });
    document.getElementById("o-mails").innerHTML = state.mails.map((m) => '<li><div><strong>' + VQKit.escape(m.subject) + '</strong><br><span class="muted">' + VQKit.escape(m.body) + '</span></div><span class="badge">D+' + m.day + '</span></li>').join("") || "<div class='empty'>Run AI</div>";
    document.getElementById("o-hist").innerHTML = VQKit.histogram(state.scores.length ? state.scores : [40, 55, 70, 80], 4);
  }

  function render() {
    if (KIND === "calendar") return renderCalendar();
    if (KIND === "competitor") return renderCompetitor();
    if (KIND === "form") return renderForm();
    if (KIND === "knowledge") return renderKnowledge();
    if (KIND === "proposal") return renderProposal();
    if (KIND === "inventory") return renderInventory();
    if (KIND === "loyalty") return renderLoyalty();
    if (KIND === "newsletter") return renderNewsletter();
    if (KIND === "analytics") return renderAnalytics();
    if (KIND === "onboarding") return renderOnboarding();
  }

  async function runAI() {
    document.getElementById("btn-primary").disabled = true;
    await VQ.think(500);
    if (KIND === "calendar") {
      state.ideas = ["Behind-the-scenes desk", "Customer win story", "Feature drop teaser", "Hiring soft pitch"].map((t) => t);
      state.items.slice(0, 3).forEach((it, i) => { state.score[i] = 60 + i * 8; });
    } else if (KIND === "competitor") {
      if (!state.rivals.length) state.rivals = [{ name: "NovaTools", pos: "Speed-first SMB", threat: "high", at: Date.now() }];
      state.cards = state.rivals.map((r) => ({ vs: r.name, body: "We win on craft + brand. They win on price. Lead with quality proof and faster support SLA." }));
      state.watch = state.rivals.map((r) => r.name);
    } else if (KIND === "form") {
      if (!state.fields.length) state.fields = [{ label: "Work email", type: "email" }, { label: "Team size", type: "select" }, { label: "Goal", type: "textarea" }];
    } else if (KIND === "knowledge") {
      state.faq = (VQ.faqSuggest && VQ.faqSuggest("VaultNote")) || [{ q: "How to reset?", a: "Settings → Security → Reset." }];
      if (!state.articles.length) state.articles = [{ title: "Getting started", body: "Invite team, connect channel, publish first SOP.", at: Date.now() }];
    } else if (KIND === "proposal") {
      const client = document.getElementById("p-client")?.value || "Client";
      const goal = document.getElementById("p-goal")?.value || "Grow revenue";
      const budget = +(document.getElementById("p-budget")?.value || 300000);
      state.draft = ["# Proposal for " + client, "", "## Goal", goal, "", "## Approach", "1. Discover", "2. Build sprint", "3. Launch + measure", "", "## Investment", "Within ¥" + budget.toLocaleString("ja-JP")].join("\n");
      state.lines = [
        { name: "Discovery workshop", qty: 1, price: Math.round(budget * 0.2), sum: Math.round(budget * 0.2) },
        { name: "Build sprint", qty: 1, price: Math.round(budget * 0.55), sum: Math.round(budget * 0.55) },
        { name: "Launch support", qty: 1, price: Math.round(budget * 0.25), sum: Math.round(budget * 0.25) }
      ];
      state.total = state.lines.reduce((a, l) => a + l.sum, 0);
    } else if (KIND === "inventory") {
      if (!state.skus.length) state.skus = [
        { sku: "MUG-350", name: "Ceramic mug", qty: 4, reorder: 8, cost: 800 },
        { sku: "TEE-M", name: "Studio tee M", qty: 22, reorder: 10, cost: 1200 }
      ];
    } else if (KIND === "loyalty") {
      if (!state.members.length) state.members = [
        { name: "Aya", points: 1200, tier: "gold" },
        { name: "Ken", points: 400, tier: "silver" },
        { name: "Mika", points: 3200, tier: "platinum" }
      ];
    } else if (KIND === "newsletter") {
      const theme = document.getElementById("n-theme")?.value || "Studio update";
      const notes = document.getElementById("n-notes")?.value || "Shipped polish, hiring, roadmap.";
      const body = ["Hi there,", "", theme, "", notes, "", "— VELQUIA"].join("\n");
      state.issues.unshift({ theme, body, at: Date.now() });
      state.subjects = [theme + " — what shipped", "3 things from the studio", "Quiet flex: " + theme];
    } else if (KIND === "analytics") {
      state.kpis = { revenue: 1280000, users: 842, conv: 3.4, nps: 42, visit: 4200, signup: 180, paid: 61, series: [3, 4, 4, 6, 5, 7, 8] };
      state.notes = ["Top drop-off: pricing page", "Paid conversion up on mobile", "Support tickets down 12%"];
      state.report = "Week summary: revenue steady, conversion improving on mobile. Focus next week on pricing clarity and onboarding step 2.";
    } else if (KIND === "onboarding") {
      state.steps = [
        { title: "Welcome + goals", desc: "Capture success metric", done: true },
        { title: "Connect channel", desc: "X / IG / store", done: false },
        { title: "First win", desc: "Ship one live asset", done: false },
        { title: "Team invite", desc: "Add 2 collaborators", done: false }
      ];
      state.mails = [
        { day: 0, subject: "Welcome aboard", body: "Here is your checklist." },
        { day: 3, subject: "Need a hand?", body: "Book a 15-min setup call." },
        { day: 7, subject: "First win reminder", body: "Publish one asset this week." }
      ];
      state.scores = [48, 62, 71, 77, 80];
    }
    document.getElementById("btn-primary").disabled = false;
    VQKit.activity.push("PulseCal", "AI run");
    save();
    VQ.toast("AI complete");
  }

  function seed() {
    if (KIND === "calendar" && !state.items.length) {
      state.items = [
        { title: "Teaser A", ch: "X", day: "Tue", week: "current", at: Date.now() },
        { title: "Reel cutdown", ch: "Instagram", day: "Fri", week: "current", at: Date.now() }
      ];
    }
    runAI();
  }

  document.getElementById("btn-primary").onclick = runAI;
  document.getElementById("btn-seed").onclick = seed;
  render();
  VQKit.bindExportButton("Export " + "PulseCal", "pulsecal.json", () => state);
})();
