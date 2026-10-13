"use strict";

/** Local demo AI helpers (no external API). Deterministic + light variation. */

window.VQ = {
  toast(msg) {
    let el = document.getElementById("vq-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "vq-toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.add("hidden"), 2200);
  },

  store(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  load(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || "null");
      return v == null ? fallback : v;
    } catch (_) {
      return fallback;
    }
  },

  uid() {
    return Math.random().toString(36).slice(2, 9);
  },

  async think(ms) {
    await new Promise((r) => setTimeout(r, ms || 450 + Math.random() * 400));
  },

  pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  caption(topic, tone) {
    const openers = {
      cool: ["Built different.", "Quiet flex.", "Next round starts now."],
      warm: ["ちょっとだけ、今日の制作メモ。", "届けたいことがあって。", "また触りたくなる体験を。"],
      sales: ["今だけ見逃せないポイント。", "売上につながる一手。", "作業時間、ここで短縮。"]
    };
    const closes = [
      "Stay tuned.",
      "制作の続きもこのアカウントで。",
      "#VELQUIA #AI",
      "詳しくはプロフィールから。"
    ];
    const o = this.pick(openers[tone] || openers.cool);
    return `${o}\n\n${topic.trim()}\n\n${this.pick(closes)}`;
  },

  productCopy(name, features) {
    const f = (features || "").split(/[,、\n]/).map((s) => s.trim()).filter(Boolean);
    const bullets = f.length ? f.map((x) => `・${x}`).join("\n") : "・毎日の作業を自動化\n・見やすいレポート\n・すぐに始められる";
    return `【${name}】\n${name}は、忙しい現場のためのスマートな選択肢です。\n\n${bullets}\n\nまずは無料で試して、効果を実感してください。`;
  },

  siteHtml(biz, name, offer) {
    return `<!DOCTYPE html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${name}</title>
<style>
body{margin:0;font-family:system-ui,sans-serif;background:#0f141c;color:#eef2f8}
.hero{padding:72px 24px;background:linear-gradient(135deg,#1a2a3a,#2a1840);text-align:center}
h1{margin:0 0 12px;font-size:clamp(2rem,5vw,3rem)}
p{opacity:.85;max-width:36rem;margin:0 auto;line-height:1.6}
.cta{display:inline-block;margin-top:22px;padding:12px 20px;border-radius:999px;background:#6ec6ff;color:#071018;text-decoration:none;font-weight:700}
section{padding:40px 24px;max-width:860px;margin:0 auto}
.card{background:#171c26;border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:18px;margin:12px 0}
</style></head><body>
<header class="hero"><p>${biz}</p><h1>${name}</h1><p>${offer}</p>
<a class="cta" href="#contact">お問い合わせ</a></header>
<section><div class="card"><h2>できること</h2><p>${offer}</p></div>
<div class="card" id="contact"><h2>Contact</h2><p>velquia.official@gmail.com</p></div></section>
</body></html>`;
  },

  chatReply(message, faq) {
    const m = message.toLowerCase();
    for (const item of faq || []) {
      if (item.q.split(/\s+/).some((w) => w && m.includes(w.toLowerCase()))) return item.a;
    }
    if (/価格|料金|いくら|price/.test(m)) return "プランは用途に合わせてご案内します。まずはご希望の利用人数を教えてください。";
    if (/営業|時間|open/.test(m)) return "受付は年中無休の自動対応です。有人が必要な内容は営業時間内に引き継ぎます。";
    return "ご質問ありがとうございます。もう少し詳しく教えていただければ、最適な案内をします。";
  },

  interviewQ(role) {
    const common = [
      `${role}として、困難だったプロジェクトをどう乗り越えましたか？`,
      "チームで意見が割れたとき、どう合意形成しますか？",
      "入社後90日で達成したいことを教えてください。"
    ];
    return this.pick(common);
  },

  langReply(level, userText) {
    const tips = {
      beginner: "Nice try! 短く答えるなら: \"I like coffee in the morning.\"",
      intermediate: "Good. Try adding a reason: \"… because it helps me focus.\"",
      advanced: "Solid. Tighten rhythm: cut filler and lead with the verb."
    };
    return `You said: “${userText}”\n\nCoach (${level}): ${tips[level] || tips.intermediate}\n\nNext prompt: Describe your ideal weekend in 2 sentences.`;
  },

  hashtags(topic) {
    const base = ["#VELQUIA", "#gamedev", "#indiedev", "#AI", "#creative"];
    const words = String(topic || "")
      .split(/[\s、,]+/)
      .filter((w) => w.length > 1)
      .slice(0, 4);
    const tagged = words.map((w) => "#" + w.replace(/[^\w\u3040-\u30ff\u4e00-\u9faf]/g, ""));
    return [...new Set(base.concat(tagged))].filter((h) => h.length > 1).slice(0, 8);
  },

  variants(topic, tone, n) {
    const out = [];
    for (let i = 0; i < (n || 3); i++) out.push(this.caption(topic, tone));
    return out;
  },

  bestPostHour() {
    return this.pick([8, 12, 19, 21, 22]);
  },

  meetingDigest(raw) {
    const lines = String(raw || "").split(/\n+/).map((s) => s.trim()).filter(Boolean);
    const actions = lines.filter((l) => /TODO|やる|対応|決定|action/i.test(l)).slice(0, 6);
    const decisions = lines.filter((l) => /決定|OK|採用|go/i.test(l)).slice(0, 4);
    return {
      summary: lines.slice(0, 3).join(" / ") || "短い打ち合わせ。要点を整理しました。",
      decisions: decisions.length ? decisions : ["次回アジェンダを確定する"],
      actions: actions.length ? actions : ["議事録を共有する", "担当者を割り当てる"]
    };
  },

  salesEmail(persona, offer, cta) {
    return [
      `件名: ${offer} — 3分だけご覧ください`,
      "",
      `${persona || "ご担当者"} 様`,
      "",
      `突然のご連絡失礼します。${offer}について、現場の工数を減らす提案です。`,
      "",
      "・導入まで最短当日",
      "・まずは小さく试点（パイロット）可能",
      "・効果が見えなければ拡大不要",
      "",
      cta || "ご都合の良い15分でオンラインデモが可能です。候補日を2ついただけますか？",
      "",
      "VELQUIA"
    ].join("\n");
  },

  reviewReply(stars, body) {
    if (stars >= 4) {
      return `このたびは嬉しいレビューをありがとうございます。『${(body || "").slice(0, 40)}』とのお声、チーム一同励みになります。またのお越しを心よりお待ちしています。`;
    }
    return `貴重なご意見をありがとうございます。ご不便をおかけし申し訳ありません。内容を確認し改善します。差し支えなければ詳細をDMでお知らせください。必ず担当よりご連絡します。`;
  },

  invoiceLines(items) {
    const rows = (items || []).map((it, i) => ({
      no: i + 1,
      name: it.name,
      qty: it.qty || 1,
      price: it.price || 0,
      sum: (it.qty || 1) * (it.price || 0)
    }));
    const sub = rows.reduce((s, r) => s + r.sum, 0);
    const tax = Math.floor(sub * 0.1);
    return { rows, sub, tax, total: sub + tax };
  },

  downloadText(filename, text) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  downloadJSON(filename, obj) {
    this.downloadText(filename, JSON.stringify(obj, null, 2));
  },

  /** Extra generators used by pro feature packs */
  captionScoreHints(text) {
    const hints = [];
    const n = [...String(text || "")].length;
    if (n < 40) hints.push("もう少し具体性を足すと保存率が上がります");
    if (n > 280) hints.push("X向けには280字以内へ圧縮を");
    if (!/#/.test(text || "")) hints.push("ハッシュタグを1–3個追加");
    if (!/[？?！!]/.test(text || "")) hints.push("問いかけ or 感嘆で止めると反応しやすい");
    if (!hints.length) hints.push("バランス良好。投稿候補として十分です");
    return hints;
  },

  sceneBeatSheet(topic, seconds) {
    const dur = Number(seconds) || 30;
    const beats = [
      { t: 0, label: "Hook", line: topic + " — 冒頭3秒で止める" },
      { t: Math.round(dur * 0.15), label: "Problem", line: "現状のつまずきを一文で" },
      { t: Math.round(dur * 0.4), label: "Demo", line: "プロダクト/結果を見せる" },
      { t: Math.round(dur * 0.7), label: "Proof", line: "数字 or ビフォーアフター" },
      { t: Math.round(dur * 0.88), label: "CTA", line: "プロフィールリンク / 予約へ" }
    ];
    return beats;
  },

  faqSuggest(topic) {
    const t = topic || "サービス";
    return [
      { q: t + " 料金", a: "プランは用途に応じて。まずはデモで見積可能です。" },
      { q: t + " 導入期間", a: "最短で当日セットアップ、通常は1週間程度です。" },
      { q: t + " サポート", a: "チャットとメール。営業時間内は有人対応します。" },
      { q: t + " 解約", a: "月単位。違約金なしのスタンダードプランがあります。" }
    ];
  },

  seoBundle(name, biz, offer) {
    return {
      title: (name || "Brand") + " | " + (biz || "Official").slice(0, 28),
      description: String(offer || name + "の公式サイト。").slice(0, 140),
      h1: name || "Brand",
      ogTitle: name || "Brand",
      keywords: [biz, name, "公式", "予約"].filter(Boolean).join(", ")
    };
  },

  shiftFairness(staff, cells) {
    const counts = {};
    staff.forEach((s) => {
      counts[s.id] = 0;
    });
    Object.values(cells || {}).forEach((id) => {
      if (id && counts[id] != null) counts[id]++;
    });
    const vals = Object.values(counts);
    const max = Math.max(0, ...vals);
    const min = vals.length ? Math.min(...vals) : 0;
    return { counts, spread: max - min, max, min };
  },

  emailPersonalize(template, lead) {
    return String(template || "")
      .replace(/\{\{name\}\}/g, lead?.name || "ご担当者様")
      .replace(/\{\{company\}\}/g, lead?.company || "御社")
      .replace(/\{\{offer\}\}/g, lead?.offer || "デモ");
  },

  meetingActions(notes) {
    const lines = String(notes || "")
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const actions = lines.filter((l) => /TODO|アクション|担当|締切|→|->/i.test(l));
    const decisions = lines.filter((l) => /決定|合意|採用|方針/i.test(l));
    return {
      actions: actions.length ? actions : ["フォローアップ日程を確定する"],
      decisions: decisions.length ? decisions : ["次回アジェンダを共有する"]
    };
  },

  resumeBullet(role, skill) {
    return (
      (role || "Member") +
      "として" +
      (skill || "プロジェクト推進") +
      "を担当。成果指標を定義し、週次で改善サイクルを回した。"
    );
  },

  budgetAlert(spent, limit) {
    const s = Number(spent) || 0;
    const l = Number(limit) || 1;
    const pct = Math.round((s / l) * 100);
    if (pct >= 100) return { level: "over", pct, msg: "予算超過" };
    if (pct >= 85) return { level: "warn", pct, msg: "上限間近" };
    if (pct >= 60) return { level: "watch", pct, msg: "進捗注意" };
    return { level: "ok", pct, msg: "余裕あり" };
  },

  bookingSlotSuggest(hour) {
    const h = Number(hour);
    const base = isNaN(h) ? 10 : h;
    return [base, base + 2, base + 4]
      .map((x) => ((x % 24) + "").padStart(2, "0") + ":00")
      .slice(0, 3);
  }
};
