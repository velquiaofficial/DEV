"use strict";
/* PulsePost pro desk — campaigns, UTM, week fill, charts */

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

  const KEY = "vq_pulse_pro";
  const state = VQ.load(KEY, {
    campaigns: [],
    utm: { source: "x", medium: "social", campaign: "velquia" },
    scores: {},
    query: "",
    page: 1,
    brandVoice: ["落ち着き", "太め", "遊び心", "プレミアム"]
  });

  function syncCore() {
    try {
      const core = VQ.load("vq_pulse_v2", {});
      state._queue = core.queue || [];
      state._templates = core.templates || [];
      state._history = core.history || [];
      state._variants = core.variants || [];
    } catch (_) {
      state._queue = state._queue || [];
    }
  }

  function save() {
    VQ.store(KEY, state);
    paint();
  }

  function scoreCaption(cap) {
    if (!cap) return 0;
    let s = 40;
    const n = [...cap].length;
    if (n > 40 && n < 220) s += 20;
    if (/#/.test(cap)) s += 10;
    if (/？|\?|！|!/.test(cap)) s += 10;
    if (/http|https/.test(cap)) s += 5;
    if (n > 280) s -= 15;
    return VQKit.clamp(s, 0, 100);
  }

  function ensure() {
    if (document.getElementById("pp-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "pp-pro";
    el.className = "card pro-panel";
    el.innerHTML = `
      <h2>PulsePost Pro</h2>
      <p class="muted pro-lead">キャンペーン・スコア・週次スロット・UTM。上の作成画面と連携します。</p>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>未投稿</span><strong id="pp1">0</strong></div></div>
        <div class="card"><div class="stat"><span>キャンペーン</span><strong id="pp2">0</strong></div></div>
        <div class="card"><div class="stat"><span>平均スコア</span><strong id="pp3">-</strong></div></div>
        <div class="card"><div class="stat"><span>7日投稿</span><strong id="pp4">0</strong></div></div>
      </div>
      <div class="toolbar">
        <input id="pp-q" placeholder="キューを絞り込み" style="max-width:220px;margin:0">
        <button type="button" id="pp-score">選択案を採点</button>
        <button type="button" id="pp-camp">キャンペーン化</button>
        <button type="button" id="pp-utm">UTMを付与</button>
        <button type="button" id="pp-csv">キューCSV</button>
        <button type="button" id="pp-week">1週間スロット</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>キャンペーン</h3>
          <ul class="list" id="pp-camps"></ul>
          <h3 class="subhead">絞り込みキュー</h3>
          <ul class="list" id="pp-qlist"></ul>
          <div id="pp-pager"></div>
        </div>
        <div>
          <h3>投稿ペース</h3>
          <div id="pp-spark"></div>
          <h3 class="subhead">チャネル</h3>
          <div id="pp-donut"></div>
          <h3 class="subhead">UTM 既定値</h3>
          <label>source</label><input id="pp-src" autocomplete="off">
          <label>medium</label><input id="pp-med" autocomplete="off">
          <label>campaign</label><input id="pp-cmp" autocomplete="off">
          <button type="button" id="pp-utm-save">UTMを保存</button>
          <div data-kit-activity-host></div>
        </div>
      </div>
    `;
    main.appendChild(el);

    document.getElementById("pp-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("pp-q").value;
      state.page = 1;
      paint();
    }, 120);

    document.getElementById("pp-score").onclick = () => {
      syncCore();
      const core = VQ.load("vq_pulse_v2", {});
      const cap = (core.variants || [])[core.selected || 0];
      if (!cap) return VQ.toast("先に生成してください");
      const sc = scoreCaption(cap);
      state.scores[Date.now()] = sc;
      VQKit.activity.push("PulsePost", "採点 " + sc);
      save();
      VQ.toast("スコア " + sc + "/100");
    };

    document.getElementById("pp-camp").onclick = () => {
      syncCore();
      const core = VQ.load("vq_pulse_v2", {});
      const cap = (core.variants || [])[core.selected || 0];
      if (!cap) return VQ.toast("案を選んでください");
      state.campaigns.unshift({
        id: VQ.uid(),
        name: (document.getElementById("topic")?.value || "キャンペーン").slice(0, 32),
        voice: VQ.pick(state.brandVoice),
        caption: cap,
        at: Date.now(),
        status: "draft"
      });
      VQKit.activity.push("PulsePost", "キャンペーン作成");
      save();
      VQ.toast("キャンペーンを追加しました");
    };

    document.getElementById("pp-utm").onclick = () => {
      const core = VQ.load("vq_pulse_v2", {});
      if (!core.variants || !core.variants.length) return VQ.toast("先に生成してください");
      const i = core.selected || 0;
      const link =
        "https://velquia.example/?" +
        "utm_source=" + encodeURIComponent(state.utm.source) +
        "&utm_medium=" + encodeURIComponent(state.utm.medium) +
        "&utm_campaign=" + encodeURIComponent(state.utm.campaign);
      core.variants[i] = core.variants[i].replace(/\nhttps?:\/\/\S+/g, "") + "\n" + link;
      VQ.store("vq_pulse_v2", core);
      if (typeof render === "function") render();
      VQ.toast("UTMを付けました");
      paint();
    };

    document.getElementById("pp-csv").onclick = () => {
      syncCore();
      VQKit.downloadCSV("pulse-queue.csv", state._queue, [
        { label: "when", key: "when" },
        { label: "channel", key: "channel" },
        { label: "caption", key: "caption" },
        { label: "done", key: "done" }
      ]);
    };

    document.getElementById("pp-week").onclick = () => {
      syncCore();
      const core = VQ.load("vq_pulse_v2", {});
      const base = (core.variants || [])[core.selected || 0];
      if (!base) return VQ.toast("先に案を生成してください");
      const chans = ["X", "Instagram", "Both"];
      for (let d = 0; d < 7; d++) {
        const when = new Date(Date.now() + d * 86400000);
        when.setHours(VQ.bestPostHour(), 0, 0, 0);
        core.queue = core.queue || [];
        core.queue.unshift({
          id: VQ.uid(),
          channel: chans[d % 3],
          caption: base + "\n#day" + (d + 1),
          img: "",
          when: when.toISOString().slice(0, 16).replace("T", " "),
          done: false
        });
      }
      VQ.store("vq_pulse_v2", core);
      if (typeof render === "function") render();
      VQKit.activity.push("PulsePost", "7スロット追加");
      save();
      VQ.toast("1週間分をキューしました");
    };

    document.getElementById("pp-utm-save").onclick = () => {
      state.utm.source = document.getElementById("pp-src").value || "x";
      state.utm.medium = document.getElementById("pp-med").value || "social";
      state.utm.campaign = document.getElementById("pp-cmp").value || "velquia";
      save();
      VQ.toast("UTMを保存しました");
    };

    VQKit.mountActivityPanel(el.querySelector("[data-kit-activity-host]"), "PulsePost");
  }

  function paint() {
    ensure();
    syncCore();
    document.getElementById("pp-src").value = state.utm.source;
    document.getElementById("pp-med").value = state.utm.medium;
    document.getElementById("pp-cmp").value = state.utm.campaign;

    const open = (state._queue || []).filter((q) => !q.done).length;
    document.getElementById("pp1").textContent = open;
    document.getElementById("pp2").textContent = state.campaigns.length;
    const scores = Object.values(state.scores);
    document.getElementById("pp3").textContent = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : "-";
    const series = VQKit.weekSeries(state._queue || [], (q) => {
      const t = Date.parse(String(q.when).replace(" ", "T"));
      return isNaN(t) ? Date.now() : t;
    });
    document.getElementById("pp4").textContent = series.reduce((a, b) => a + b, 0);
    document.getElementById("pp-spark").innerHTML = VQKit.sparkline(series, 240, 52, "#78c4b8");

    const mix = VQKit.groupCount(state._queue || [], (q) => q.channel || "?");
    document.getElementById("pp-donut").innerHTML = VQKit.donut(mix, 140);

    document.getElementById("pp-camps").innerHTML =
      state.campaigns
        .slice(0, 8)
        .map(
          (c) =>
            `<li><div><strong>${VQKit.escape(c.name)}</strong> · ${VQKit.escape(c.voice)}<br><span class="muted">${VQKit.escape(c.caption.slice(0, 90))}…</span></div><span class="badge">${c.status}</span></li>`
        )
        .join("") || "<div class='empty'>キャンペーンなし</div>";

    const filtered = VQKit.search(state._queue || [], state.query, ["caption", "channel", "when"]);
    const page = VQKit.paginate(filtered, state.page, 6);
    document.getElementById("pp-qlist").innerHTML =
      page.slice
        .map(
          (q) =>
            `<li><div><strong>${VQKit.escape(q.channel)}</strong> · ${VQKit.escape(q.when)}<br><span class="muted">${VQKit.escape(q.caption.slice(0, 100))}</span></div><span class="badge ${q.done ? "ok" : "warn"}">${q.done ? "完了" : "未"}</span></li>`
        )
        .join("") || "<div class='empty'>キューは空です</div>";
    VQKit.renderPager(document.getElementById("pp-pager"), page, (p) => {
      state.page = p;
      paint();
    });
  }

  ["btn-gen", "btn-queue", "btn-save-tpl", "btn-clear-q"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("click", () => setTimeout(paint, 200));
  });

  paint();
  VQKit.bindExportButton("PulsePost Pro を書き出し", "pulsepost-pro.json", () => {
    syncCore();
    return state;
  });
})();
