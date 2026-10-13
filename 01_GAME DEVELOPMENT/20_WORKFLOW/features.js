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

  const KEY = "vq_flowbase_v2";
  const state = VQ.load(KEY, {
    tasks: [],
    rules: [],
    logs: [],
    slaHours: 24,
    templates: [
      "請求書PDFを整理",
      "週次報告書ドラフト",
      "顧客フォローメール",
      "在庫レポート更新",
      "契約書レビュー依頼"
    ],
    query: "",
    page: 1
  });

  // hydrate from legacy if empty
  try {
    const legacy = VQ.load("vq_flowbase_v1", null);
    if (legacy && !state.tasks.length) {
      state.tasks = legacy.tasks || [];
      state.rules = legacy.rules || [];
      state.logs = legacy.logs || [];
    }
  } catch (_) {}

  function save() {
    VQ.store(KEY, state);
    paint();
  }

  function ensure() {
    if (document.getElementById("fw-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "fw-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>Workflow pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Open</span><strong id="fw-o">0</strong></div></div>
        <div class="card"><div class="stat"><span>Doing</span><strong id="fw-d">0</strong></div></div>
        <div class="card"><div class="stat"><span>SLA risk</span><strong id="fw-s">0</strong></div></div>
        <div class="card"><div class="stat"><span>Rules</span><strong id="fw-r">0</strong></div></div>
      </div>
      <div class="toolbar">
        <input id="fw-q" placeholder="Filter tasks…" style="max-width:220px;margin:0">
        <label class="mini">SLA hours <input id="fw-sla" type="number" value="${state.slaHours}" style="width:70px;margin:0 0 0 6px"></label>
        <button type="button" id="fw-tpl">Add from template</button>
        <button type="button" id="fw-csv">CSV</button>
        <button type="button" id="fw-sim">Simulate 10 tasks</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Filtered tasks</h3>
          <ul class="list" id="fw-list"></ul>
          <div id="fw-pager"></div>
        </div>
        <div>
          <h3>Throughput (7d)</h3>
          <div id="fw-spark"></div>
          <h3 style="margin-top:12px">By column</h3>
          <div id="fw-bars"></div>
        </div>
      </div>
    `;
    main.appendChild(el);

    document.getElementById("fw-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("fw-q").value;
      state.page = 1;
      paint();
    }, 120);
    document.getElementById("fw-sla").onchange = () => {
      state.slaHours = +document.getElementById("fw-sla").value || 24;
      save();
    };
    document.getElementById("fw-tpl").onclick = () => {
      const title = VQ.pick(state.templates);
      addTask(title);
    };
    document.getElementById("fw-csv").onclick = () => {
      VQKit.downloadCSV("workflow-tasks.csv", state.tasks, [
        { label: "title", key: "title" },
        { label: "col", key: "col" },
        { label: "created", get: (r) => (r.created ? new Date(r.created).toISOString() : "") },
        { label: "priority", get: (r) => r.priority || "normal" }
      ]);
      VQ.toast("CSV exported");
    };
    document.getElementById("fw-sim").onclick = () => {
      for (let i = 0; i < 10; i++) addTask(VQ.pick(state.templates) + " #" + VQ.uid().slice(0, 3), true);
      save();
      VQ.toast("Simulated 10");
    };
  }

  function addTask(title, silent) {
    const task = {
      id: VQ.uid(),
      title,
      col: "inbox",
      created: Date.now(),
      priority: VQ.pick(["low", "normal", "high"])
    };
    for (const r of state.rules) {
      if (title.includes(r.trig)) {
        task.col = r.act === "done" ? "done" : "doing";
        state.logs.unshift({
          at: new Date().toLocaleTimeString("ja-JP"),
          msg: "Auto: " + title
        });
        break;
      }
    }
    state.tasks.push(task);
    VQKit.activity.push("Flowbase", "Task: " + title);
    if (!silent) save();
  }

  // wrap legacy add
  const legacyAdd = document.getElementById("addTask");
  if (legacyAdd) {
    legacyAdd.onclick = () => {
      const title = prompt("タスク名");
      if (!title) return;
      addTask(title);
      save();
      VQ.toast("追加");
    };
  }

  function paint() {
    ensure();
    // sync board lists if present
    ["inbox", "doing", "done"].forEach((col) => {
      const el = document.getElementById("col-" + col);
      if (!el) return;
      el.innerHTML =
        state.tasks
          .filter((t) => t.col === col)
          .map(
            (t) =>
              `<li><div>${VQKit.escape(t.title)}<br><span class="mini">${t.priority || "normal"}</span></div>
              <div class="actions"><button data-id="${t.id}" data-to="doing">→</button><button data-id="${t.id}" data-to="done">✓</button></div></li>`
          )
          .join("") || "<li class='muted'>空</li>";
      el.querySelectorAll("button").forEach((b) => {
        b.onclick = () => {
          const t = state.tasks.find((x) => x.id === b.dataset.id);
          if (!t) return;
          t.col = b.dataset.to;
          state.logs.unshift({
            at: new Date().toLocaleTimeString("ja-JP"),
            msg: t.title + " → " + t.col
          });
          save();
        };
      });
    });

    document.getElementById("fw-o").textContent = state.tasks.filter((t) => t.col === "inbox").length;
    document.getElementById("fw-d").textContent = state.tasks.filter((t) => t.col === "doing").length;
    const risk = state.tasks.filter((t) => {
      if (t.col === "done" || !t.created) return false;
      return Date.now() - t.created > state.slaHours * 3600000;
    }).length;
    document.getElementById("fw-s").textContent = risk;
    document.getElementById("fw-r").textContent = state.rules.length;

    const filtered = VQKit.search(state.tasks, state.query, ["title", "col", "priority"]);
    const page = VQKit.paginate(VQKit.sortBy(filtered, (t) => t.created || 0, "desc"), state.page, 8);
    document.getElementById("fw-list").innerHTML =
      page.slice
        .map((t) => {
          const late =
            t.col !== "done" && t.created && Date.now() - t.created > state.slaHours * 3600000;
          return `<li><div><strong class="${late ? "warn-text" : ""}">${VQKit.escape(t.title)}</strong><br><span class="muted">${t.col} · ${t.priority}</span></div></li>`;
        })
        .join("") || "<div class='empty'>No tasks</div>";
    VQKit.renderPager(document.getElementById("fw-pager"), page, (p) => {
      state.page = p;
      paint();
    });

    const series = VQKit.weekSeries(
      state.tasks.filter((t) => t.col === "done"),
      (t) => t.created || Date.now()
    );
    document.getElementById("fw-spark").innerHTML = VQKit.sparkline(series, 220, 48, "#7ee0c6");
    document.getElementById("fw-bars").innerHTML = VQKit.barChart(
      VQKit.groupCount(state.tasks, (t) => t.col)
    );

    const rulesEl = document.getElementById("rules");
    if (rulesEl) {
      rulesEl.innerHTML = state.rules
        .map(
          (r, i) =>
            `<li><div>「${VQKit.escape(r.trig)}」→ ${VQKit.escape(r.act)}</div><button data-r="${i}">削除</button></li>`
        )
        .join("");
      rulesEl.querySelectorAll("[data-r]").forEach((b) => {
        b.onclick = () => {
          state.rules.splice(+b.dataset.r, 1);
          save();
        };
      });
    }
    const logsEl = document.getElementById("logs");
    if (logsEl) {
      logsEl.innerHTML =
        state.logs
          .slice(0, 20)
          .map((l) => `<li><div>${VQKit.escape(l.msg)}</div><span class="badge">${l.at}</span></li>`)
          .join("") || "<li class='muted'>なし</li>";
    }
  }

  const addRule = document.getElementById("addRule");
  if (addRule) {
    addRule.onclick = () => {
      const trig = document.getElementById("trig").value.trim();
      if (!trig) return;
      state.rules.push({ trig, act: document.getElementById("act").value });
      document.getElementById("trig").value = "";
      save();
      VQ.toast("ルール追加");
    };
  }

  if (!state.tasks.length) {
    ["請求書PDFを整理", "週次報告書ドラフト", "顧客フォローメール"].forEach((t) => addTask(t, true));
  }
  save();
  VQKit.bindExportButton("Export Flowbase", "flowbase.json", () => state);
})();
