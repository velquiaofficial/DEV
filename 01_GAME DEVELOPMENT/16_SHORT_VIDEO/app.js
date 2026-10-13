"use strict";

/**
 * ClipForge — short-form script / timeline / export
 * Standalone. LocalStorage only.
 */

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    ["script", "timeline", "export"].forEach((v) => {
      const el = document.getElementById("view-" + v);
      if (el) el.classList.toggle("hidden", btn.dataset.view !== v);
    });
  });
});

const KEY = "vq_clipforge_v2";
const state = VQ.load(KEY, {
  script: "",
  scenes: [],
  projects: [],
  hooks: [],
  captions: []
});

const LINES_JA = {
  Cinematic: [
    "フック: 静止画の衝突＋太字テロップ。",
    "世界観をパララックス／UI重ねで開示。",
    "ゲームプレイの一ループを証明。",
    "社会的証明／やわらかいCTA。",
    "強いCTA＋エンドカード。"
  ],
  UGC: [
    "フック: 顔出し近接＋「待って」。",
    "手元／画面収録でリアル感。",
    "ビフォーアフターを速切り。",
    "コメント誘導の問いかけ。",
    "フォローCTAを画面下に固定。"
  ],
  Promo: [
    "フック: 価格／日付を大きく。",
    "ベネフィットを3点テロップ。",
    "デモ映像をテンポよく。",
    "限定性（期限・数量）。",
    "リンク誘導＋ロゴ。"
  ]
};

const VO_JA = ["見て。", "もう一回。", "続きはプロフィール。", "今だけ。", "逃すな。"];
const CAP_JA = ["待ってこれ", "新作予告", "ループ注意", "リンクはプロフ", "今日公開"];

function save() {
  VQ.store(KEY, state);
  renderProjects();
}

function renderProjects() {
  const host = document.getElementById("projects");
  if (!host) return;
  host.innerHTML = state.projects.length
    ? state.projects
        .map(
          (p, i) => `<li>
            <div><strong>${p.title}</strong><br><span class="muted">${p.dur}秒 · ${p.style}</span></div>
            <button type="button" data-load="${i}">読み込み</button>
          </li>`
        )
        .join("")
    : `<div class="empty">保存プロジェクトはまだありません</div>`;
  host.querySelectorAll("[data-load]").forEach((b) => {
    b.onclick = () => {
      const p = state.projects[+b.dataset.load];
      document.getElementById("topic").value = p.title;
      document.getElementById("dur").value = String(p.dur);
      document.getElementById("style").value = p.style;
      state.script = p.script;
      state.scenes = p.scenes;
      state.hooks = p.hooks || [];
      state.captions = p.captions || [];
      paint();
      VQ.toast("読み込みました");
    };
  });
}

function paint() {
  const out = document.getElementById("scriptOut");
  if (out) {
    out.textContent = state.script || "「台本を生成」を押してください";
    out.classList.toggle("has-prompt", !!state.script);
  }

  const scenes = document.getElementById("scenes");
  if (scenes) {
    scenes.innerHTML = state.scenes.length
      ? state.scenes
          .map(
            (s) => `<li>
              <div>
                <strong>${s.title}</strong> ${s.in}–${s.out}秒
                <br><span class="muted">${s.line}</span>
                <br><span class="mini">VO: ${s.vo || "-"} · テロップ: ${s.cap || "-"}</span>
              </div>
              <span class="badge">${s.cam || "A-roll"}</span>
            </li>`
          )
          .join("")
      : `<div class="empty">シーンはまだありません</div>`;
  }

  let hooks = document.getElementById("hooks");
  if (!hooks && document.getElementById("view-script")) {
    const box = document.createElement("div");
    box.className = "card hook-card";
    box.innerHTML = "<h2>フック / キャプション案</h2><ul class='list' id='hooks'></ul>";
    document.getElementById("view-script").appendChild(box);
    hooks = document.getElementById("hooks");
  }
  if (hooks) {
    const items = []
      .concat((state.hooks || []).map((h, i) => `<li><div>${h}</div><span class="badge">H${i + 1}</span></li>`))
      .concat((state.captions || []).map((c, i) => `<li><div>${c}</div><span class="badge">C${i + 1}</span></li>`));
    hooks.innerHTML = items.length
      ? items.join("")
      : `<div class="empty">生成後にフックが表示されます</div>`;
  }

  renderProjects();
}

document.getElementById("gen").onclick = async () => {
  const topic = document.getElementById("topic").value.trim() || "VELQUIA 新作ティーザー";
  const dur = +document.getElementById("dur").value;
  const style = document.getElementById("style").value;
  const btn = document.getElementById("gen");
  btn.disabled = true;
  document.getElementById("scriptOut").textContent = "生成中…";
  await VQ.think(720);

  const beats = Math.max(3, Math.round(dur / 7));
  const lines = LINES_JA[style] || LINES_JA.Cinematic;
  const cams = ["A-roll", "B-roll", "Screen", "Macro", "Endcard"];
  state.scenes = [];
  let t = 0;
  for (let i = 0; i < beats; i++) {
    const len = Math.round(dur / beats);
    state.scenes.push({
      in: t,
      out: t + len,
      title: "シーン " + (i + 1),
      line: lines[i % lines.length],
      vo: VQ.pick(VO_JA),
      cap: VQ.pick(CAP_JA),
      cam: cams[i % cams.length]
    });
    t += len;
  }

  state.hooks = [
    "スクロール止めて — このループ、一回見て。",
    "冒頭3秒を作り直した。見てほしい。",
    topic + " — 予告はここから。"
  ];
  state.captions = [
    "次の推しインディー、見つかるかも",
    "舞台裏だけのテンション",
    "#VELQUIA #gamedev #shorts"
  ];

  state.script = [
    "HOOK (0–3秒): " + state.hooks[0],
    "スタイル: " + style + " · 尺: " + dur + "秒",
    "",
    ...state.scenes.map(
      (s) =>
        `[${s.in}s–${s.out}s] ${s.title} (${s.cam}) — ${s.line}\n  VO: ${s.vo} | テロップ: ${s.cap}`
    ),
    "",
    "CTA: フォローして制作過程を追って。",
    "BGM: 低音パルス → CTAでライザー"
  ].join("\n");

  btn.disabled = false;
  paint();
  VQ.toast("台本パックができました");
};

const copyBtn = document.getElementById("copy");
if (copyBtn) {
  copyBtn.onclick = async () => {
    if (!state.script) return VQ.toast("先に生成してください");
    await navigator.clipboard.writeText(state.script);
    VQ.toast("コピーしました");
  };
}

(function () {
  const exp = document.getElementById("view-export");
  if (!exp || document.getElementById("saveProj")) return;
  const actions = document.createElement("div");
  actions.className = "actions";
  actions.innerHTML =
    '<button class="primary" id="saveProj" type="button">プロジェクト保存</button>' +
    '<button id="exportProj" type="button">JSON書き出し</button>' +
    '<ul class="list" id="projects" style="width:100%;margin-top:12px"></ul>';
  exp.appendChild(actions);
  document.getElementById("saveProj").onclick = () => {
    if (!state.script) return VQ.toast("先に生成してください");
    state.projects.unshift({
      title: document.getElementById("topic").value || "無題",
      dur: +document.getElementById("dur").value,
      style: document.getElementById("style").value,
      script: state.script,
      scenes: state.scenes,
      hooks: state.hooks,
      captions: state.captions
    });
    save();
    VQ.toast("保存しました");
  };
  document.getElementById("exportProj").onclick = () =>
    VQ.downloadJSON("clipforge-project.json", state);
  renderProjects();
})();

paint();
