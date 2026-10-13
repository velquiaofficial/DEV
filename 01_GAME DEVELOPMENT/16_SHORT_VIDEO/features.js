"use strict";
/* +feature pack · ClipForge studio */
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

  const KEY = "vq_clipforge_pro";
  const state = VQ.load(KEY, {
    shotlist: [],
    brolls: [],
    music: [],
    exports: [],
    query: "",
    page: 1,
    pacing: "medium"
  });

  function sync() {
    const core = VQ.load("vq_clipforge_v2", {});
    state._scenes = core.scenes || [];
    state._projects = core.projects || [];
    state._script = core.script || "";
  }

  function save() {
    VQ.store(KEY, state);
    paint();
  }

  function ensure() {
    if (document.getElementById("cf-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "cf-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>ClipForge Pro</h2>
      <p class="muted pro-lead">ショットリスト・Bロール・音楽キュー。上の台本と連携します。</p>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>シーン</span><strong id="cf1">0</strong></div></div>
        <div class="card"><div class="stat"><span>ショット</span><strong id="cf2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Bロール</span><strong id="cf3">0</strong></div></div>
        <div class="card"><div class="stat"><span>書き出し</span><strong id="cf4">0</strong></div></div>
      </div>
      <div class="toolbar">
        <button type="button" id="cf-shots">シーンからショットリスト</button>
        <button type="button" id="cf-broll">Bロール提案</button>
        <button type="button" id="cf-music">音楽キュー提案</button>
        <button type="button" id="cf-export">書き出しプリセット記録</button>
        <button type="button" id="cf-csv">ショットCSV</button>
        <select id="cf-pace"><option value="slow">ゆっくり</option><option value="medium" selected>普通</option><option value="fast">速い</option></select>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>ショットリスト</h3>
          <input id="cf-q" placeholder="ショットを絞り込み">
          <ul class="list" id="cf-shots-list"></ul>
          <div id="cf-pager"></div>
        </div>
        <div>
          <h3>尺カーブ</h3>
          <div id="cf-spark"></div>
          <h3 class="subhead">Bロール / 音楽</h3>
          <ul class="list" id="cf-media"></ul>
          <h3 class="subhead">書き出し履歴</h3>
          <ul class="list" id="cf-ex"></ul>
        </div>
      </div>
    `;
    main.appendChild(el);

    document.getElementById("cf-shots").onclick = () => {
      sync();
      if (!state._scenes.length) return VQ.toast("先に台本を生成してください");
      state.shotlist = state._scenes.map((sc, i) => ({
        id: VQ.uid(),
        n: i + 1,
        title: sc.title,
        in: sc.in,
        out: sc.out,
        cam: sc.cam || "A-roll",
        note: sc.line,
        lens: VQ.pick(["24mm", "35mm", "50mm", "85mm"]),
        move: VQ.pick(["固定", "プッシュイン", "パン", "手持ち"])
      }));
      VQKit.activity.push("ClipForge", "ショットリスト x" + state.shotlist.length);
      save();
      VQ.toast("ショットリストができました");
    };

    document.getElementById("cf-broll").onclick = () => {
      sync();
      const topic = document.getElementById("topic")?.value || "作品";
      state.brolls = [
        topic + " のマクロ寄り",
        "手元／画面収録",
        "雰囲気ワイド · 柔らか光",
        "質感クローズアップ",
        "エンドカード（ロゴ 1.5秒）"
      ];
      save();
      VQ.toast("Bロール案を出しました");
    };

    document.getElementById("cf-music").onclick = () => {
      state.music = [
        { cue: "0:00", mood: "コールドオープンのパッド" },
        { cue: "0:03", mood: "フックのビート" },
        { cue: "中盤", mood: "VO下のベッド" },
        { cue: "終盤", mood: "CTAへのライザー" }
      ];
      save();
      VQ.toast("音楽キューを出しました");
    };

    document.getElementById("cf-export").onclick = () => {
      const dur = +(document.getElementById("dur")?.value || 30);
      state.exports.unshift({
        at: Date.now(),
        preset: VQ.pick(["9:16 1080", "9:16 4K", "1:1 1080"]),
        dur,
        pace: document.getElementById("cf-pace").value
      });
      VQKit.activity.push("ClipForge", "書き出し記録");
      save();
      VQ.toast("書き出しを記録しました");
    };

    document.getElementById("cf-csv").onclick = () => {
      VQKit.downloadCSV("shotlist.csv", state.shotlist, [
        { label: "n", key: "n" },
        { label: "title", key: "title" },
        { label: "in", key: "in" },
        { label: "out", key: "out" },
        { label: "cam", key: "cam" },
        { label: "lens", key: "lens" },
        { label: "move", key: "move" },
        { label: "note", key: "note" }
      ]);
    };

    document.getElementById("cf-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("cf-q").value;
      state.page = 1;
      paint();
    }, 120);

    document.getElementById("cf-pace").onchange = () => {
      state.pacing = document.getElementById("cf-pace").value;
      save();
    };
  }

  function paint() {
    ensure();
    sync();
    document.getElementById("cf-pace").value = state.pacing;
    document.getElementById("cf1").textContent = state._scenes.length;
    document.getElementById("cf2").textContent = state.shotlist.length;
    document.getElementById("cf3").textContent = state.brolls.length;
    document.getElementById("cf4").textContent = state.exports.length;

    const curve = (state._scenes || []).map((s) => (s.out || 0) - (s.in || 0));
    document.getElementById("cf-spark").innerHTML = VQKit.sparkline(curve.length ? curve : [1, 2, 1], 240, 48, "#7ee0c6");

    const filtered = VQKit.search(state.shotlist, state.query, ["title", "note", "cam", "move"]);
    const page = VQKit.paginate(filtered, state.page, 6);
    document.getElementById("cf-shots-list").innerHTML =
      page.slice
        .map(
          (s) =>
            `<li><div><strong>#${s.n} ${VQKit.escape(s.title)}</strong> ${s.in}–${s.out}s<br><span class="muted">${VQKit.escape(s.note || "")}</span></div><span class="badge">${s.lens} · ${s.move}</span></li>`
        )
        .join("") || "<div class='empty'>ショットリストを作成してください</div>";
    VQKit.renderPager(document.getElementById("cf-pager"), page, (p) => {
      state.page = p;
      paint();
    });

    document.getElementById("cf-media").innerHTML =
      state.brolls.map((b) => `<li><div>${VQKit.escape(b)}</div><span class="badge">B</span></li>`).join("") +
      state.music
        .map((m) => `<li><div>${m.cue} — ${VQKit.escape(m.mood)}</div><span class="badge">♪</span></li>`)
        .join("");

    document.getElementById("cf-ex").innerHTML =
      state.exports
        .slice(0, 6)
        .map(
          (e) =>
            `<li><div>${VQKit.escape(e.preset)} · ${e.dur}秒 · ${e.pace}</div><span class="badge">${VQKit.fmtDate(e.at)}</span></li>`
        )
        .join("") || "<div class='empty'>書き出し履歴なし</div>";
  }

  document.getElementById("gen")?.addEventListener("click", () => setTimeout(paint, 400));
  paint();
  VQKit.bindExportButton("ClipForge Pro を書き出し", "clipforge-pro.json", () => state);
})();

