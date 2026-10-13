"use strict";
/* VQ_ENRICHED */
document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    ["form", "preview", "export"].forEach((v) =>
      document.getElementById("view-" + v).classList.toggle("hidden", btn.dataset.view !== v)
    );
  };
});

const KEY = "vq_sitespark_v2";
const state = VQ.load(KEY, { sites: [], html: "", theme: "violet" });
const themes = {
  violet: { a: "#6d4dff", b: "#2a1840" },
  ocean: { a: "#3ecf8e", b: "#0f2a24" },
  sunset: { a: "#ff8b6b", b: "#2a1810" }
};

function save() {
  VQ.store(KEY, state);
  renderLib();
}

function renderLib() {
  let host = document.getElementById("siteLib");
  if (!host) {
    const exp = document.getElementById("view-export");
    if (!exp) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = "<h2 style='margin-top:16px'>Saved sites</h2><ul class='list' id='siteLib'></ul><div class='chips' id='themes'></div>";
    exp.appendChild(wrap);
    host = document.getElementById("siteLib");
    const th = document.getElementById("themes");
    th.innerHTML = Object.keys(themes)
      .map((t) => `<button class="chip-btn" type="button" data-th="${t}">${t}</button>`)
      .join("");
    th.querySelectorAll("[data-th]").forEach((b) => {
      b.onclick = () => {
        state.theme = b.dataset.th;
        save();
        VQ.toast("Theme: " + state.theme);
      };
    });
  }
  host.innerHTML =
    state.sites
      .map(
        (s, i) =>
          `<li><div><strong>${s.name}</strong><br><span class="muted">${s.biz}</span></div><button data-i="${i}">Load</button></li>`
      )
      .join("") || "<div class='empty'>No saved sites</div>";
  host.querySelectorAll("[data-i]").forEach((b) => {
    b.onclick = () => {
      const s = state.sites[+b.dataset.i];
      document.getElementById("biz").value = s.biz;
      document.getElementById("name").value = s.name;
      document.getElementById("offer").value = s.offer;
      state.html = s.html;
      document.getElementById("frame").srcdoc = s.html;
      document.getElementById("code").textContent = s.html;
      document.querySelector('[data-view="preview"]').click();
    };
  });
}

function themedHtml(biz, name, offer) {
  const t = themes[state.theme] || themes.violet;
  return VQ.siteHtml(biz, name, offer)
    .replace(/#6ec6ff/g, t.a)
    .replace(/#1a2a3a/g, t.b)
    .replace(/#2a1840/g, t.b);
}

document.getElementById("gen").onclick = async () => {
  const biz = document.getElementById("biz").value.trim() || "ローカルビジネス";
  const name = document.getElementById("name").value.trim() || "VELQUIA Shop";
  const offer =
    document.getElementById("offer").value.trim() || "丁寧な接客と、すぐ予約できる体験を。";
  document.getElementById("gen").disabled = true;
  await VQ.think(500);
  state.html = themedHtml(biz, name, offer);
  document.getElementById("frame").srcdoc = state.html;
  document.getElementById("code").textContent = state.html;
  document.getElementById("gen").disabled = false;
  VQ.toast("サイト生成完了");
  document.querySelector('[data-view="preview"]').click();
};

document.getElementById("copy").onclick = async () => {
  if (!state.html) return VQ.toast("先に生成");
  await navigator.clipboard.writeText(state.html);
  VQ.toast("コピーしました");
};

(function () {
  const form = document.getElementById("view-form");
  if (!form || document.getElementById("saveSite")) return;
  const btn = document.createElement("button");
  btn.id = "saveSite";
  btn.type = "button";
  btn.textContent = "Save site";
  btn.onclick = () => {
    if (!state.html) return VQ.toast("Generate first");
    state.sites.unshift({
      biz: document.getElementById("biz").value,
      name: document.getElementById("name").value,
      offer: document.getElementById("offer").value,
      html: state.html
    });
    save();
    VQ.toast("Saved");
  };
  form.appendChild(btn);
})();

renderLib();
