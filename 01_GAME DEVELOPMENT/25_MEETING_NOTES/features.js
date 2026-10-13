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

  const KEY = "vq_meetnote_v2";
  const state = VQ.load(KEY, {
    meetings: [],
    actions: [],
    tags: ["launch", "design", "ops", "finance"],
    query: "",
    page: 1,
    templates: [
      "アジェンダ:\\n1.\\n2.\\n決定:\\nTODO:",
      "Standup\\n昨日:\\n今日:\\n障害:"
    ]
  });
  try {
    const legacy = VQ.load("vq_meetnote_v1", null);
    if (legacy && !state.meetings.length) Object.assign(state, legacy);
  } catch (_) {}

  function save() {
    VQ.store(KEY, state);
    VQ.store("vq_meetnote_v1", state);
    paint();
  }

  function ensure() {
    if (document.getElementById("mn-pro")) return;
    const main = document.querySelector(".main");
    const el = document.createElement("section");
    el.id = "mn-pro";
    el.className = "card pro-panel";
    el.style.marginTop = "14px";
    el.innerHTML = `
      <h2>MeetNote pro</h2>
      <div class="kpi-row">
        <div class="card"><div class="stat"><span>Meetings</span><strong id="mn1">0</strong></div></div>
        <div class="card"><div class="stat"><span>Open TODOs</span><strong id="mn2">0</strong></div></div>
        <div class="card"><div class="stat"><span>Overdue</span><strong id="mn3">0</strong></div></div>
        <div class="card"><div class="stat"><span>Tags</span><strong id="mn4">0</strong></div></div>
      </div>
      <div class="toolbar">
        <input id="mn-q" placeholder="Search meetings/actions" style="max-width:240px;margin:0">
        <select id="mn-tag" style="max-width:140px;margin:0"><option value="">All tags</option></select>
        <button type="button" id="mn-tpl">Insert template</button>
        <button type="button" id="mn-csv">CSV actions</button>
        <button type="button" id="mn-ics">Export due list</button>
      </div>
      <div class="grid grid-2">
        <div>
          <h3>Action radar</h3>
          <ul class="list" id="mn-act"></ul>
          <div id="mn-pager"></div>
        </div>
        <div>
          <h3>Meetings / week</h3>
          <div id="mn-spark"></div>
          <h3 style="margin-top:12px">Owner load</h3>
          <div id="mn-bars"></div>
        </div>
      </div>
    `;
    main.appendChild(el);
    document.getElementById("mn-q").oninput = VQKit.debounce(() => {
      state.query = document.getElementById("mn-q").value;
      state.page = 1;
      paint();
    }, 120);
    document.getElementById("mn-tag").onchange = () => paint();
    document.getElementById("mn-tpl").onclick = () => {
      const raw = document.getElementById("raw");
      if (raw) raw.value = VQ.pick(state.templates);
    };
    document.getElementById("mn-csv").onclick = () => {
      VQKit.downloadCSV("actions.csv", state.actions, [
        { label: "text", key: "text" },
        { label: "owner", key: "owner" },
        { label: "due", key: "due" },
        { label: "done", key: "done" },
        { label: "meeting", key: "meeting" }
      ]);
    };
    document.getElementById("mn-ics").onclick = () => {
      const open = state.actions.filter((a) => !a.done && a.due);
      VQ.downloadText(
        "due-actions.txt",
        open.map((a) => `${a.due} · ${a.owner || "TBD"} · ${a.text}`).join("\n")
      );
    };
  }

  function paint() {
    ensure();
    const tagSel = document.getElementById("mn-tag");
    const cur = tagSel.value;
    tagSel.innerHTML =
      '<option value="">All tags</option>' +
      state.tags.map((t) => `<option value="${t}">${t}</option>`).join("");
    tagSel.value = cur;

    document.getElementById("mn1").textContent = state.meetings.length;
    document.getElementById("mn2").textContent = state.actions.filter((a) => !a.done).length;
    const today = VQKit.dayKey();
    document.getElementById("mn3").textContent = state.actions.filter(
      (a) => !a.done && a.due && a.due < today
    ).length;
    document.getElementById("mn4").textContent = state.tags.length;

    let actions = state.actions.slice();
    if (state.query) actions = VQKit.search(actions, state.query, ["text", "owner", "meeting"]);
    const page = VQKit.paginate(actions, state.page, 8);
    document.getElementById("mn-act").innerHTML =
      page.slice
        .map((a) => {
          const i = state.actions.indexOf(a);
          const overdue = !a.done && a.due && a.due < today;
          return `<li><div><strong class="${overdue ? "warn-text" : ""}">${VQKit.escape(a.text)}</strong><br><span class="muted">${VQKit.escape(a.owner || "no owner")} · ${a.due || "no due"} · ${VQKit.escape(a.meeting || "")}</span></div>
            <div class="actions"><button data-ok="${i}">${a.done ? "Undo" : "Done"}</button></div></li>`;
        })
        .join("") || "<div class='empty'>No actions</div>";
    document.querySelectorAll("#mn-act [data-ok]").forEach((b) => {
      b.onclick = () => {
        state.actions[+b.dataset.ok].done = !state.actions[+b.dataset.ok].done;
        save();
      };
    });
    VQKit.renderPager(document.getElementById("mn-pager"), page, (p) => {
      state.page = p;
      paint();
    });

    document.getElementById("mn-spark").innerHTML = VQKit.sparkline(
      VQKit.weekSeries(state.meetings, (m) => m.at || Date.now()),
      220,
      48
    );
    const owners = {};
    state.actions.forEach((a) => {
      const o = a.owner || "unassigned";
      owners[o] = (owners[o] || 0) + 1;
    });
    document.getElementById("mn-bars").innerHTML = VQKit.barChart(owners);
  }

  // enhance save meeting
  const saveM = document.getElementById("saveM");
  if (saveM) {
    saveM.addEventListener("click", () => {
      setTimeout(() => {
        try {
          const legacy = VQ.load("vq_meetnote_v1", {});
          state.meetings = legacy.meetings || state.meetings;
          state.actions = legacy.actions || state.actions;
          // tag last meeting
          if (state.meetings[0] && !state.meetings[0].tag) {
            state.meetings[0].tag = VQ.pick(state.tags);
          }
          save();
        } catch (_) {}
      }, 0);
    });
  }

  paint();
  VQKit.bindExportButton("Export MeetNote", "meetnote-pro.json", () => state);
})();
