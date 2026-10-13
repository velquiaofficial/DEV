"use strict";

/**
 * PulsePost — compose / queue / templates / analytics
 * Standalone. LocalStorage only.
 */

document.querySelectorAll(".nav-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    ["compose", "queue", "library", "analytics"].forEach((v) => {
      const el = document.getElementById("view-" + v);
      if (el) el.classList.toggle("hidden", btn.dataset.view !== v);
    });
  });
});

const KEY = "vq_pulse_v2";
const state = VQ.load(KEY, {
  queue: [],
  generated: 0,
  templates: [],
  history: [],
  selected: 0,
  variants: []
});

const PRESETS = [
  { t: "制作進捗ティーザー", p: "moody workshop, WIP desk, soft rim light" },
  { t: "キャラ紹介", p: "character portrait, cinematic rim light, shallow DOF" },
  { t: "セール告知", p: "bold promo poster, clean type, high contrast" },
  { t: "舞台裏メモ", p: "over-shoulder desk shot, notes and sketches" }
];

const topic = document.getElementById("topic");
const tone = document.getElementById("tone");
const imgPrompt = document.getElementById("imgPrompt");
const channel = document.getElementById("channel");

function save() {
  VQ.store(KEY, state);
  render();
}

function charLimit() {
  const ch = channel.value;
  if (ch === "Instagram") return 2200;
  if (ch === "Both") return 280;
  return 280;
}

function render() {
  document.getElementById("k-q").textContent = state.queue.filter((q) => !q.done).length;
  document.getElementById("k-g").textContent = state.generated;
  document.getElementById("k-t").textContent = state.templates.length;
  document.getElementById("k-h").textContent = VQ.bestPostHour() + ":00";

  document.getElementById("presets").innerHTML = PRESETS.map(
    (p, i) =>
      `<button class="chip-btn" data-p="${i}" type="button">${p.t}</button>`
  ).join("");
  document.getElementById("presets").querySelectorAll("[data-p]").forEach((b) => {
    b.onclick = () => {
      const p = PRESETS[+b.dataset.p];
      topic.value = p.t;
      imgPrompt.value = p.p;
    };
  });

  const variantsEl = document.getElementById("variants");
  if (!state.variants.length) {
    variantsEl.innerHTML = `<div class="empty">まだ案がありません。「3案生成」を押してください。</div>`;
  } else {
    variantsEl.innerHTML = state.variants
      .map((v, i) => {
        const n = [...v].length;
        const sel = state.selected === i ? "ok-text is-selected" : "";
        return `<li class="${sel}">
          <div>
            <strong>案 ${i + 1}</strong>
            <br><span class="muted">${v.replace(/\n/g, " ").slice(0, 160)}${v.length > 160 ? "…" : ""}</span>
            <br><span class="mini">${n} 文字</span>
          </div>
          <button data-s="${i}" type="button">選択</button>
        </li>`;
      })
      .join("");
  }
  variantsEl.querySelectorAll("[data-s]").forEach((b) => {
    b.onclick = () => {
      state.selected = +b.dataset.s;
      save();
    };
  });

  const cap = state.variants[state.selected] || "";
  const n = [...cap].length;
  const lim = charLimit();
  const hint = document.getElementById("limitHint");
  if (!cap) {
    hint.textContent = `${channel.value} の目安上限: ${lim} 文字`;
    hint.className = "mini";
  } else {
    hint.textContent = `${n} / ${lim} 文字 · ${channel.value}`;
    hint.className = "mini " + (n > lim ? "warn-text" : "ok-text");
  }

  document.getElementById("hashes").innerHTML = VQ.hashtags(topic.value)
    .map((h) => `<button class="chip-btn" type="button">${h}</button>`)
    .join("");
  document.getElementById("hashes").querySelectorAll(".chip-btn").forEach((b) => {
    b.onclick = () => {
      if (!state.variants[state.selected]) return;
      state.variants[state.selected] += "\n" + b.textContent;
      save();
    };
  });

  document.getElementById("qbody").innerHTML = state.queue
    .map(
      (q, i) => `<tr class="${q.done ? "is-done" : ""}">
        <td>${q.when}</td>
        <td>${q.channel}</td>
        <td>${q.caption.replace(/</g, "&lt;").slice(0, 90)}${q.done ? " ✓" : ""}</td>
        <td class="row-actions">
          <button data-d="${i}" type="button">完了</button>
          <button data-x="${i}" type="button">削除</button>
        </td>
      </tr>`
    )
    .join("");
  document.getElementById("qbody").querySelectorAll("[data-d]").forEach((b) => {
    b.onclick = () => {
      state.queue[+b.dataset.d].done = true;
      save();
    };
  });
  document.getElementById("qbody").querySelectorAll("[data-x]").forEach((b) => {
    b.onclick = () => {
      state.queue.splice(+b.dataset.x, 1);
      save();
    };
  });

  const tplList = document.getElementById("tplList");
  tplList.innerHTML = state.templates.length
    ? state.templates
        .map(
          (t, i) => `<li>
            <div><strong>${t.name}</strong><br><span class="muted">${t.topic}</span></div>
            <button data-use="${i}" type="button">使う</button>
          </li>`
        )
        .join("")
    : `<div class="empty">テンプレはまだありません</div>`;
  tplList.querySelectorAll("[data-use]").forEach((b) => {
    b.onclick = () => {
      const t = state.templates[+b.dataset.use];
      topic.value = t.topic;
      tone.value = t.tone;
      imgPrompt.value = t.img;
      document.querySelector('.nav-btn[data-view="compose"]').click();
      VQ.toast("テンプレを読み込みました");
    };
  });

  const mix = { X: 0, Instagram: 0, Both: 0 };
  state.queue.forEach((q) => {
    mix[q.channel] = (mix[q.channel] || 0) + 1;
  });
  const max = Math.max(1, ...Object.values(mix));
  document.getElementById("bars").innerHTML = Object.entries(mix)
    .map(
      ([k, v]) => `<div class="bar-row">
        <div class="mini">${k} · ${v}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${(v / max) * 100}%"></div></div>
      </div>`
    )
    .join("");
}

document.getElementById("btn-gen").onclick = async () => {
  const t = topic.value.trim() || "VELQUIA スタジオ更新";
  const btn = document.getElementById("btn-gen");
  btn.disabled = true;
  await VQ.think(650);
  state.variants = VQ.variants(t, tone.value, 3);
  state.selected = 0;
  state.generated += 3;
  state.history.unshift({ t, at: Date.now() });
  const box = document.getElementById("imgBox");
  box.textContent = imgPrompt.value.trim() || "editorial key art · " + t;
  box.classList.add("has-prompt");
  btn.disabled = false;
  save();
  VQ.toast("3案できました");
};

document.getElementById("btn-queue").onclick = () => {
  const cap = state.variants[state.selected];
  if (!cap) return VQ.toast("先に生成してください");
  const when =
    document.getElementById("when").value ||
    new Date(Date.now() + 3600000).toISOString().slice(0, 16);
  state.queue.unshift({
    id: VQ.uid(),
    channel: channel.value,
    caption: cap,
    img: imgPrompt.value,
    when: when.replace("T", " "),
    done: false
  });
  save();
  VQ.toast("キューに追加しました");
};

document.getElementById("btn-save-tpl").onclick = () => {
  state.templates.unshift({
    name: (topic.value || "テンプレ").slice(0, 24),
    topic: topic.value,
    tone: tone.value,
    img: imgPrompt.value
  });
  save();
  VQ.toast("テンプレを保存しました");
};

document.getElementById("btn-export-q").onclick = () =>
  VQ.downloadJSON("pulsepost-queue.json", state.queue);

document.getElementById("btn-clear-q").onclick = () => {
  state.queue = state.queue.filter((q) => !q.done);
  save();
};

channel.addEventListener("change", render);

render();
