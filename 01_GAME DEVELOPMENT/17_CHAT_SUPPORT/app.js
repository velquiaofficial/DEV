"use strict";
/* VQ_ENRICHED · full helpdesk */
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    ["widget", "faq", "inbox"].forEach((v) =>
      document.getElementById("view-" + v).classList.toggle("hidden", btn.dataset.view !== v)
    );
  };
});

const KEY = "vq_deskly_v2";
const state = VQ.load(KEY, {
  faq: [
    { q: "料金 プラン price", a: "スタンダードは月額5,000円から。人数で見積します。" },
    { q: "営業 時間 open", a: "自動応答は24時間。有人は平日10–18時です。" },
    { q: "返品 return", a: "到着後7日以内で返品ガイドをご案内します。" },
    { q: "連携 api slack", a: "Slack / メール転送に対応予定です。デモで設定できます。" }
  ],
  log: [],
  esc: [],
  csat: [],
  macros: [
    { name: "Greeting", text: "ご連絡ありがとうございます。Desklyです。" },
    { name: "Handoff", text: "担当者に切り替えます。少々お待ちください。" }
  ]
});

function save() {
  VQ.store(KEY, state);
  render();
}

function bubble(role, text) {
  const d = document.createElement("div");
  d.className = "bubble " + role;
  d.textContent = text;
  const c = document.getElementById("chat");
  c.appendChild(d);
  c.scrollTop = 99999;
}

function ensureStats() {
  if (document.getElementById("desk-kpi")) return;
  const main = document.querySelector(".main");
  const row = document.createElement("div");
  row.id = "desk-kpi";
  row.className = "kpi-row";
  row.innerHTML =
    '<div class="card"><div class="stat"><span>Chats</span><strong id="d1">0</strong></div></div>' +
    '<div class="card"><div class="stat"><span>FAQ</span><strong id="d2">0</strong></div></div>' +
    '<div class="card"><div class="stat"><span>Escalations</span><strong id="d3">0</strong></div></div>' +
    '<div class="card"><div class="stat"><span>CSAT</span><strong id="d4">-</strong></div></div>';
  main.insertBefore(row, main.querySelector(".top")?.nextSibling || main.firstChild);
  const macros = document.createElement("div");
  macros.className = "chips";
  macros.id = "macros";
  const widget = document.getElementById("view-widget");
  if (widget) widget.querySelector(".card")?.appendChild(macros);
}

function render() {
  ensureStats();
  document.getElementById("d1").textContent = state.log.filter((x) => x.role === "user").length;
  document.getElementById("d2").textContent = state.faq.length;
  document.getElementById("d3").textContent = state.esc.length;
  document.getElementById("d4").textContent = state.csat.length
    ? (state.csat.reduce((a, b) => a + b, 0) / state.csat.length).toFixed(1)
    : "-";

  document.getElementById("faqList").innerHTML =
    state.faq
      .map(
        (f, i) =>
          `<li><div><strong>${f.q}</strong><br><span class="muted">${f.a}</span></div><button data-del="${i}">削除</button></li>`
      )
      .join("") || "<li class='muted'>FAQなし</li>";
  document.getElementById("faqList").querySelectorAll("[data-del]").forEach((b) => {
    b.onclick = () => {
      state.faq.splice(+b.dataset.del, 1);
      save();
    };
  });

  document.getElementById("inbox").innerHTML =
    state.log
      .slice(-20)
      .reverse()
      .map(
        (x) =>
          `<li><div><strong>${x.role}</strong><br><span class="muted">${x.text}</span></div><span class="badge">${x.at}</span></li>`
      )
      .join("") || "<li class='muted'>まだありません</li>";

  document.getElementById("escalations").innerHTML =
    state.esc
      .slice()
      .reverse()
      .map((x) => `<li><div>${x.text}</div><span class="badge warn">human</span></li>`)
      .join("") || "<li class='muted'>なし</li>";

  const macros = document.getElementById("macros");
  if (macros) {
    macros.innerHTML = state.macros
      .map((m, i) => `<button class="chip-btn" type="button" data-m="${i}">${m.name}</button>`)
      .join("");
    macros.querySelectorAll("[data-m]").forEach((b) => {
      b.onclick = () => {
        document.getElementById("msg").value = state.macros[+b.dataset.m].text;
      };
    });
  }
}

async function send() {
  const text = document.getElementById("msg").value.trim();
  if (!text) return;
  document.getElementById("msg").value = "";
  bubble("user", text);
  state.log.push({ role: "user", text, at: new Date().toLocaleTimeString("ja-JP") });
  await VQ.think(400);
  let reply = VQ.chatReply(text, state.faq);
  if (/担当|人間|オペレーター|human/i.test(text)) {
    state.esc.push({ text, at: Date.now() });
    reply = "担当者へエスカレーションしました。営業時間内にご連絡します。";
  }
  bubble("bot", reply);
  state.log.push({ role: "bot", text: reply, at: new Date().toLocaleTimeString("ja-JP") });
  // lightweight csat prompt
  if (state.log.filter((x) => x.role === "user").length % 4 === 0) {
    state.csat.push(VQ.pick([4, 5, 5, 3]));
  }
  save();
}

document.getElementById("send").onclick = send;
document.getElementById("msg").onkeydown = (e) => {
  if (e.key === "Enter") send();
};
document.getElementById("addFaq").onclick = () => {
  const q = document.getElementById("fq").value.trim();
  const a = document.getElementById("fa").value.trim();
  if (!q || !a) return;
  state.faq.push({ q, a });
  document.getElementById("fq").value = "";
  document.getElementById("fa").value = "";
  save();
  VQ.toast("FAQ追加");
};

// export + csat controls
(function () {
  const foot = document.querySelector(".side-foot");
  if (foot && !document.getElementById("desk-exp")) {
    const b = document.createElement("button");
    b.id = "desk-exp";
    b.type = "button";
    b.textContent = "Export desk data";
    b.style.marginTop = "8px";
    b.onclick = () => VQ.downloadJSON("deskly.json", state);
    foot.appendChild(b);
  }
})();

bubble("bot", "こんにちは。Deskly AIです。料金・営業時間・返品などお聞きください。");
render();
