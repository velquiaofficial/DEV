"use strict";
/* VQ_ENRICHED */
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    ["calendar", "customers", "campaigns"].forEach((v) =>
      document.getElementById("view-" + v).classList.toggle("hidden", btn.dataset.view !== v)
    );
  };
});

const KEY = "vq_reservekit_v2";
const state = VQ.load(KEY, {
  bookings: [],
  customers: {},
  noShow: 0,
  completed: 0,
  services: { カット: 45, カウンセリング: 30, 体験レッスン: 60, 整体60分: 60 }
});

function save() {
  VQ.store(KEY, state);
  render();
}

function ensureKpi() {
  if (document.getElementById("rk-kpi")) return;
  const row = document.createElement("div");
  row.id = "rk-kpi";
  row.className = "kpi-row";
  row.innerHTML =
    '<div class="card"><div class="stat"><span>Bookings</span><strong id="r1">0</strong></div></div>' +
    '<div class="card"><div class="stat"><span>Customers</span><strong id="r2">0</strong></div></div>' +
    '<div class="card"><div class="stat"><span>Completed</span><strong id="r3">0</strong></div></div>' +
    '<div class="card"><div class="stat"><span>No-show</span><strong id="r4">0</strong></div></div>';
  const main = document.querySelector(".main");
  main.insertBefore(row, main.querySelector(".top").nextSibling);
}

function render() {
  ensureKpi();
  document.getElementById("r1").textContent = state.bookings.length;
  document.getElementById("r2").textContent = Object.keys(state.customers).length;
  document.getElementById("r3").textContent = state.completed;
  document.getElementById("r4").textContent = state.noShow;

  const upcoming = state.bookings.slice().sort((a, b) => a.when.localeCompare(b.when));
  document.getElementById("upcoming").innerHTML =
    upcoming
      .map(
        (b) =>
          `<li><div><strong>${b.name}</strong> · ${b.menu} (${state.services[b.menu] || 30}m)<br><span class="muted">${b.when.replace("T", " ")}${b.status ? " · " + b.status : ""}</span></div><div class="actions"><button data-ok="${b.id}">Done</button><button data-ns="${b.id}">No-show</button><button data-i="${b.id}">取消</button></div></li>`
      )
      .join("") || "<li class='muted'>予約なし</li>";

  document.getElementById("upcoming").querySelectorAll("[data-i]").forEach((btn) => {
    btn.onclick = () => {
      state.bookings = state.bookings.filter((x) => x.id !== btn.dataset.i);
      save();
    };
  });
  document.getElementById("upcoming").querySelectorAll("[data-ok]").forEach((btn) => {
    btn.onclick = () => {
      const b = state.bookings.find((x) => x.id === btn.dataset.ok);
      if (!b) return;
      b.status = "done";
      state.completed++;
      save();
    };
  });
  document.getElementById("upcoming").querySelectorAll("[data-ns]").forEach((btn) => {
    btn.onclick = () => {
      const b = state.bookings.find((x) => x.id === btn.dataset.ns);
      if (!b) return;
      b.status = "no-show";
      state.noShow++;
      save();
    };
  });

  document.getElementById("custs").innerHTML =
    Object.values(state.customers)
      .map(
        (c) =>
          `<li><div><strong>${c.name}</strong><br><span class="muted">来店 ${c.visits} · 最終 ${c.last || "-"} · LTV目安 ¥${(c.visits * 4000).toLocaleString()}</span></div><span class="badge ok">CRM</span></li>`
      )
      .join("") || "<li class='muted'>なし</li>";
}

document.getElementById("book").onclick = () => {
  const name = document.getElementById("cname").value.trim() || "ゲスト";
  const when = document.getElementById("when").value;
  if (!when) return VQ.toast("日時を選択");
  // simple overlap check
  const overlap = state.bookings.some((b) => b.when === when && b.status !== "no-show");
  if (overlap) return VQ.toast("同じ枠に予約があります");
  const menu = document.getElementById("menu").value;
  state.bookings.push({ id: VQ.uid(), name, when, menu, status: "booked" });
  if (!state.customers[name]) state.customers[name] = { name, visits: 0, last: "" };
  state.customers[name].visits++;
  state.customers[name].last = when.slice(0, 10);
  document.getElementById("cname").value = "";
  save();
  VQ.toast("予約しました");
};

document.getElementById("remind").onclick = () => {
  const list = Object.values(state.customers).filter((c) => {
    if (!c.last) return true;
    return (Date.now() - new Date(c.last)) / 86400000 >= 30;
  });
  document.getElementById("remindList").innerHTML =
    list
      .map(
        (c) =>
          `<li><div><strong>${c.name}</strong><br><span class="muted">${c.name}様、ご無沙汰しております。次回ご予約はいかがですか？（ReserveKit）</span></div><button type="button" data-copy="1">Copy</button></li>`
      )
      .join("") || "<li class='muted'>対象なし</li>";
  document.getElementById("remindList").querySelectorAll("[data-copy]").forEach((b) => {
    b.onclick = async () => {
      await navigator.clipboard.writeText(b.parentElement.querySelector(".muted").textContent);
      VQ.toast("Copied");
    };
  });
  VQ.toast(list.length + "件");
};

(function () {
  const foot = document.querySelector(".side-foot");
  if (foot && !document.getElementById("rk-exp")) {
    const b = document.createElement("button");
    b.id = "rk-exp";
    b.type = "button";
    b.textContent = "Export CRM";
    b.style.marginTop = "8px";
    b.onclick = () => VQ.downloadJSON("reservekit.json", state);
    foot.appendChild(b);
  }
})();

render();
