"use strict";

const App = {
  screen: "title",
  humans: [{ name: "プレイヤー1" }, { name: "プレイヤー2" }],
  cpuCount: 4,
  composition: null,
  revealRoles: false,
  game: null,
  deal: null,
  night: null,
  vote: null,
  co: null,
  remind: null,
  modal: null,
  speakerId: "",
  draft: "",
  talkKind: "normal",
  talkTarget: "",
  note: "",
  timerOn: false,
  timerLeft: 180,
  timerRang: false,
  chatTimer: null,
  clock: null,
};

let svgSeq = 0;

const Sfx = {
  on: false,
  ctx: null,
  play(kind) {
    if (!this.on) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!this.ctx) this.ctx = new Ctx();
      if (this.ctx.state === "suspended") this.ctx.resume();
      const notes = { night: [196, 0.55], dawn: [523, 0.28], vote: [349, 0.12], death: [130, 0.45], win: [659, 0.42] };
      const spec = notes[kind] || [440, 0.2];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = spec[0];
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      const now = this.ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + spec[1]);
      osc.start(now);
      osc.stop(now + spec[1] + 0.02);
    } catch (err) {
      /* 音が出せない環境では黙って進む */
    }
  },
};

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function hashStr(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function portraitSVG(player) {
  svgSeq += 1;
  const h = hashStr(player.name + ":" + player.id);
  const skins = ["#f3d0b0", "#e7b892", "#d2996b", "#b97848", "#8d5524", "#f6ddc4"];
  const hairs = ["#221c1a", "#4a3428", "#6e4424", "#c4552a", "#d8c7a2", "#1d3557", "#5c2a3a"];
  const cloths = ["#2f6f4e", "#8d2f2f", "#245b86", "#6b5428", "#4a3d55", "#7a4e32", "#1f4d4a", "#6d4a86"];
  const skin = skins[h % skins.length];
  const hair = hairs[(h >>> 4) % hairs.length];
  const cloth = cloths[(h >>> 8) % cloths.length];
  const style = (h >>> 12) % 5;
  const glasses = (h >>> 16) % 7 === 0;
  const clip = "av" + svgSeq;
  let hairPath = '<path d="M24 38c0-14 7-24 16-24s16 10 16 24c-2-6-8-8-16-8s-14 2-16 8z" fill="' + hair + '"/>';
  if (style === 1) hairPath = '<path d="M22 44c1-20 8-30 18-30s17 10 18 30c-4-10-10-12-18-12s-14 2-18 12z" fill="' + hair + '"/>';
  if (style === 2) hairPath = '<path d="M26 36c0-12 6-20 14-20 9 0 14 8 14 20v6h-8v-4c0-6-3-8-6-8s-6 2-6 8v4h-8z" fill="' + hair + '"/>';
  if (style === 3) hairPath = '<path d="M24 42c0-16 6-26 16-26s16 10 16 26h-6c0-8-4-12-10-12s-10 4-10 12z" fill="' + hair + '"/><path d="M20 46c4 8 10 10 20 10" stroke="' + hair + '" stroke-width="4" fill="none"/>';
  if (style === 4) hairPath = '<path d="M28 34c2-14 22-14 24 0 2 4 4 4 4 4s-2-18-16-18-16 14-16 18c2 0 4-2 4-4z" fill="' + hair + '"/>';
  const eye = player.alive
    ? '<ellipse cx="33" cy="40" rx="2.1" ry="2.3" fill="#2a211c"/><ellipse cx="49" cy="40" rx="2.1" ry="2.3" fill="#2a211c"/>'
    : '<path d="M29 40 h8 M45 40 h8" stroke="#3a2a22" stroke-width="1.7" stroke-linecap="round"/>';
  const glassesSvg = glasses && player.alive
    ? '<circle cx="33" cy="40" r="5.2" fill="none" stroke="#2a211c" stroke-width="1.2"/><circle cx="49" cy="40" r="5.2" fill="none" stroke="#2a211c" stroke-width="1.2"/><path d="M38 40 h6" stroke="#2a211c" stroke-width="1.2"/>'
    : "";
  return (
    '<svg class="avatar-svg" viewBox="0 0 80 80" aria-hidden="true"><defs><clipPath id="' + clip + '"><circle cx="40" cy="40" r="38"/></clipPath></defs>' +
    '<g clip-path="url(#' + clip + ')">' +
    '<rect width="80" height="80" fill="#efe2cc"/>' +
    '<circle cx="40" cy="92" r="40" fill="' + cloth + '"/>' +
    '<rect x="34" y="50" width="12" height="14" rx="4" fill="' + skin + '"/>' +
    '<circle cx="40" cy="40" r="18" fill="' + skin + '"/>' +
    hairPath + eye +
    '<path d="M36 48c2.2 2 6 2 8.2 0" fill="none" stroke="#a56b55" stroke-width="1.3" stroke-linecap="round"/>' +
    glassesSvg +
    "</g></svg>"
  );
}

function roleIcon(id) {
  const paths = {
    villager: '<path d="M3 11 L12 3 L21 11"/><path d="M7 10.5 V21 H17 V10.5"/>',
    seer: '<path d="M2 12 C6 6.5 18 6.5 22 12 C18 17.5 6 17.5 2 12 Z"/><circle cx="12" cy="12" r="2.2"/>',
    medium: '<path d="M12 2.5 C14.5 8 19 10 19 14.5 A7 7 0 0 1 5 14.5 C5 10 9.5 8 12 2.5 Z"/>',
    hunter: '<path d="M12 2.5 L20.5 6.5 V13 C20.5 18 12 21.5 12 21.5 C12 21.5 3.5 18 3.5 13 V6.5 Z"/>',
    mason: '<circle cx="8" cy="12" r="4.2"/><circle cx="16" cy="12" r="4.2"/>',
    cat: '<path d="M5 16 L8 6 L11 12 L12 8 L13 12 L16 6 L19 16 C16 20 8 20 5 16 Z"/><path d="M7 15 H10 M14 15 H17"/>',
    wolf: '<path d="M3 15 L7 4 L10 11 L12 7 L14 11 L17 4 L21 15 L18 19 H6 Z"/><circle cx="9" cy="13" r="0.8"/><circle cx="15" cy="13" r="0.8"/>',
    madman: '<path d="M3 9 C7 3.5 17 3.5 21 9 V15 C17 19 7 19 3 15 Z"/><path d="M8 12 H10.5 M13.5 12 H16"/>',
    hanged: '<path d="M7 3 H17"/><path d="M12 3 V8"/><circle cx="12" cy="13" r="4"/><path d="M12 17 V22"/>',
    fox: '<path d="M4 14 L9 3 L12 9 L15 3 L20 14 C16 20 8 20 4 14 Z"/><path d="M12 16 V21"/>',
  };
  return '<svg class="role-icon" viewBox="0 0 24 24" aria-hidden="true">' + (paths[id] || "") + "</svg>";
}

function entryHumans(game) {
  return game.players.filter((p) => !p.isCpu).sort((a, b) => a.entry - b.entry);
}

function formatTime(sec) {
  const safe = Math.max(0, sec | 0);
  const min = Math.floor(safe / 60);
  const rest = safe % 60;
  return min + ":" + (rest < 10 ? "0" : "") + rest;
}

function playerTotal() {
  return App.humans.length + App.cpuCount;
}

function chips(comp) {
  return Jinro.ROLE_ORDER.filter((id) => comp[id] > 0).map((id) => {
    const meta = Jinro.ROLE_META[id];
    return '<span class="chip" style="--role:' + meta.color + '">' + roleIcon(id) + esc(meta.name) + " " + comp[id] + "</span>";
  }).join("");
}

function circleHTML(game, doomedId) {
  const players = game.players.slice().sort((a, b) => a.seat - b.seat);
  const n = players.length;
  const width = n > 12 ? 62 : n > 8 ? 72 : 84;
  const tokens = players.map((p, index) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
    const x = 50 + Math.cos(angle) * 37;
    const y = 50 + Math.sin(angle) * 36;
    const showRole = game.revealRoles || App.screen === "end";
    let sub = p.isCpu ? "CPU" : "人";
    if (!p.alive) sub = "死亡";
    if (showRole) sub = Jinro.roleName(p.role);
    const cls = ["token", p.alive ? "" : "is-dead", p.id === doomedId ? "is-doomed" : ""].join(" ");
    const claim = (game.claims || []).find((row) => row.playerId === p.id);
    const showCo = claim && p.alive && (App.screen === "day" || App.screen === "vote" || App.screen === "tally");
    const co = showCo ? '<div class="pco">' + esc(Jinro.roleName(claim.role)) + "</div>" : "";
    return (
      '<div class="' + cls + '" style="left:' + x + "%;top:" + y + "%;width:" + width + 'px">' +
      '<div class="avatar">' + portraitSVG(p) + "</div>" +
      '<div class="pname">' + esc(p.name) + "</div>" +
      '<div class="psub">' + esc(sub) + "</div>" + co + "</div>"
    );
  }).join("");
  const center = { morning: "朝", day: "昼", vote: "投票", tally: "開票", end: "結末" }[App.screen] || "";
  return '<div class="circle" data-count="' + n + '"><div class="circle-glow"></div><div class="circle-center"><b>' + esc(center) + "</b><small>" + game.day + "日目</small></div>" + tokens + "</div>";
}

function roleCardHTML(player, game) {
  const meta = Jinro.ROLE_META[player.role];
  const mates = Jinro.matesOf(game, player);
  let extra = "";
  if (player.role === "wolf") {
    extra = mates.length
      ? "仲間の人狼は " + mates.map((m) => m.name + (m.isCpu ? "（CPU）" : "")).join("、") + "。"
      : "仲間の人狼はいない。今夜の獲物は、あなたが決める。";
  }
  if (player.role === "mason") {
    extra = mates.length
      ? "相方の共有者は " + mates.map((m) => m.name + (m.isCpu ? "（CPU）" : "")).join("、") + "。"
      : "相方はいない。";
  }
  return (
    '<article class="role-card" style="--role:' + meta.color + '">' +
    '<div class="role-emblem">' + roleIcon(player.role) + "</div>" +
    '<p class="team-ribbon">' + esc(meta.teamLabel) + "</p>" +
    '<h2 class="role-name">' + esc(meta.name) + "</h2>" +
    '<p class="seat-label">座席 ' + (player.seat + 1) + " ・ " + esc(player.name) + "</p>" +
    '<p>' + esc(meta.detail) + "</p>" +
    (extra ? '<p class="mate-line">' + esc(extra) + "</p>" : "") +
    '<p class="win-line">勝利：' + esc(meta.win) + "</p>" +
    '<p class="comp-line">配役 ' + esc(Jinro.compositionText(game.composition)) + "</p>" +
    "</article>"
  );
}

function rulesHTML() {
  return (
    '<div class="modal-card rules-card">' +
    "<h2>村の掟</h2>" +
    "<h3>流れ</h3><p>役を配ったら夜が来る。能力者だけが行動し、朝に犠牲者を知る。昼に話し合い、投票でひとりを吊ります。同票ならその相手だけで再投票し、また割れれば誰も吊りません。</p>" +
    "<h3>陣営</h3>" +
    "<p><b>村人陣営</b>は、人狼が全滅し、妖狐が残っていなければ勝ち。死んだ村人も含みます。</p>" +
    "<p><b>人狼陣営</b>は、生きている人狼の数が人間以上になると勝ち。狂人は人間の人数に入りますが、勝ちは狼と同じです。妖狐は人間に数えません。</p>" +
    "<p><b>吊人</b>は、投票で吊られた瞬間に単独で勝ちます。その時点で狼の勝ち条件を満たしていても、吊人が優先されます。夜に死んでも吊人は勝てません。</p>" +
    "<p><b>妖狐</b>は、決着のときに生きていれば勝ちます。人狼が全滅しても妖狐が生きていれば村は勝てません。狼が勝つとき妖狐が生きていれば、狼と妖狐の両方の勝ちです。</p>" +
    "<h3>夜の処理</h3>" +
    "<ol><li>狩人が、自分以外のひとりを守る。同じ相手は連続では守れない。</li>" +
    "<li>占い師が占う。妖狐なら呪殺する。</li>" +
    "<li>人狼が襲う。守られていれば無効。妖狐は襲われても死なない。猫又なら、猫又と襲った狼が死ぬ。最初の夜だけ、人狼は襲わない。</li></ol>" +
    "<p>霊媒師は、前日に吊られた人の役職を次の夜に知る。襲撃の死者はわかりません。自分への投票、狼への襲撃、自分の占い、自分の守護はできません。</p>" +
    "<h3>CPUとマナー</h3>" +
    "<p>CPUは配役を知りません。占いの宣言、票の偏り、疑いの発言から判断します。人間が2人でも、足りない席はCPUが埋めます。役職確認と夜の行動、投票は画面を渡してください。死んだ人のプレイヤーは、見た情報を生き残っている人に伝えないでください。</p>" +
    '<button type="button" class="btn btn-primary" data-act="close-modal">閉じる</button></div>'
  );
}

function modalHTML() {
  if (!App.modal) return "";
  if (App.modal === "rules") return '<div class="overlay">' + rulesHTML() + "</div>";
  if (App.modal === "leave") {
    return (
      '<div class="overlay"><div class="modal-card"><h2>村を出ますか</h2><p>この対局は破棄されます。</p>' +
      '<div class="row-actions"><button type="button" class="btn btn-ghost" data-act="close-modal">戻る</button>' +
      '<button type="button" class="btn btn-primary" data-act="leave-yes">タイトルへ</button></div></div></div>'
    );
  }
  if (App.modal.type === "error") {
    return (
      '<div class="overlay"><div class="modal-card"><h2>進めませんでした</h2><p>' + esc(App.modal.text) + "</p>" +
      '<button type="button" class="btn btn-primary" data-act="close-modal">閉じる</button></div></div>'
    );
  }
  return "";
}

function renderTitle() {
  const icons = Jinro.ROLE_ORDER.map((id) => '<span class="mini-role" style="--role:' + Jinro.ROLE_META[id].color + '">' + roleIcon(id) + "<small>" + esc(Jinro.ROLE_META[id].name) + "</small></span>").join("");
  return (
    '<section class="center-screen"><div class="glass title-card">' +
    '<p class="eyebrow">ふたりから遊べる本格人狼</p>' +
    "<h1>月下の人狼</h1>" +
    "<p class=\"lede\">月の下で役を隠し、昼に吊り、夜に襲う。人が2人でも、空いた席にはCPUが座ります。役は10。吊人は、吊られたときだけ勝ちます。</p>" +
    '<div class="role-marquee">' + icons + "</div>" +
    '<div class="row-actions"><button type="button" class="btn btn-primary" data-act="go-setup">村に入る</button>' +
    '<button type="button" class="btn btn-ghost" data-act="rules">掟を読む</button></div></div></section>'
  );
}

function renderSetup() {
  const total = playerTotal();
  const check = Jinro.validateComposition(App.composition, total);
  const names = App.humans.map((human, index) => {
    return (
      '<label class="name-row"><span>人 ' + (index + 1) + '</span>' +
      '<input maxlength="10" data-bind="human-name" data-index="' + index + '" value="' + esc(human.name) + '" />' +
      '<button type="button" class="icon-x" data-act="remove-human" data-index="' + index + '"' + (App.humans.length <= 2 ? " disabled" : "") + ">外す</button></label>"
    );
  }).join("");
  const roles = Jinro.ROLE_ORDER.map((id) => {
    const meta = Jinro.ROLE_META[id];
    return (
      '<div class="role-row" style="--role:' + meta.color + '">' +
      roleIcon(id) +
      "<div><b>" + esc(meta.name) + "</b><small>" + esc(meta.teamLabel) + " ・ " + esc(meta.blurb) + "</small></div>" +
      '<div class="stepper"><button type="button" data-act="role" data-role="' + id + '" data-dir="-1">−</button>' +
      "<strong>" + (App.composition[id] || 0) + "</strong>" +
      '<button type="button" data-act="role" data-role="' + id + '" data-dir="1">＋</button></div></div>'
    );
  }).join("");
  const errors = check.errors.map((err) => "<li>" + esc(err) + "</li>").join("");
  return (
    '<section class="center-screen"><div class="panel setup-panel">' +
    "<header class=\"setup-head\"><div><p class=\"eyebrow\">村の準備</p><h2>誰が座るか</h2></div>" +
    '<button type="button" class="btn btn-ghost" data-act="rules">掟</button></header>' +
    '<p class="hint">2人から遊べます。足りない人数はCPUです。人数を変えると、おすすめの配役に戻ります。吊人は投票で吊られると、その場で単独勝利します。</p>' +
    '<div class="setup-grid"><section><h3>人間</h3>' + names +
    '<button type="button" class="btn btn-ghost" data-act="add-human">人を追加</button>' +
    '<div class="cpu-row"><span>CPU</span><div class="stepper"><button type="button" data-act="cpu" data-dir="-1">−</button><strong>' + App.cpuCount + "</strong>" +
    '<button type="button" data-act="cpu" data-dir="1">＋</button></div><b>合計 ' + total + "人</b></div>" +
    '<label class="check-line"><input id="reveal-toggle" type="checkbox"' + (App.revealRoles ? " checked" : "") + " />練習用に、役職を公開したまま遊ぶ</label>" +
    "</section><section><div class=\"row-between\"><h3>配役</h3>" +
    '<button type="button" class="btn btn-ghost" data-act="preset">おすすめに戻す</button></div>' +
    roles + "</section></div>" +
    (errors ? '<ul class="errors">' + errors + "</ul>" : '<p class="ok-line">この配役で村を開けます。</p>') +
    '<div class="row-actions"><button type="button" class="btn btn-primary" data-act="begin"' + (check.ok ? "" : " disabled") + ">夜が来る前に配る</button></div>" +
    "</div></section>"
  );
}

function renderDeal() {
  const game = App.game;
  const humans = entryHumans(game);
  if (App.deal.stage === "done") {
    return (
      '<section class="center-screen"><div class="glass narrow">' +
      "<h2>役は渡った</h2><p>CPUの役は、本人以外には配っていません。ここからは夜です。画面を見ない番の人は、席を外してください。</p>" +
      chips(game.composition) +
      '<div class="row-actions"><button type="button" class="btn btn-primary" data-act="to-night">第1夜へ</button></div></div></section>'
    );
  }
  const player = humans[App.deal.index];
  if (App.deal.stage === "cover") {
    return (
      '<section class="center-screen"><div class="glass narrow privacy">' +
      '<p class="eyebrow">役職を渡す ' + (App.deal.index + 1) + " / " + humans.length + "</p>" +
      "<h2>" + esc(player.name) + " さん</h2>" +
      "<p>ほかの人は画面から目をそらしてください。準備ができたら、役職を見てください。</p>" +
      '<button type="button" class="btn btn-primary" data-act="deal-open">役職を見る</button></div></section>'
    );
  }
  const next = humans[App.deal.index + 1];
  const label = next ? "閉じる（次は " + next.name + "）" : "全員見た";
  return (
    '<section class="center-screen"><div class="deal-wrap">' +
    roleCardHTML(player, game) +
    '<button type="button" class="btn btn-primary" data-act="deal-next">' + esc(label) + "</button></div></section>"
  );
}

function renderNight() {
  const game = App.game;
  const night = App.night;
  if (night.stage === "intro") {
    const waiting = night.turns.length
      ? "行動できる人から、順に画面を渡します。"
      : "今夜、画面の前で行う行動はありません。夜が明けます。";
    return (
      '<section class="center-screen"><div class="glass narrow">' +
      "<p class=\"eyebrow\">第" + game.day + "夜</p><h2>灯が落ちた</h2><p>" + esc(waiting) + (game.day === 1 ? " 最初の夜は、人狼は襲わない。" : "") + "</p>" +
      '<button type="button" class="btn btn-primary" data-act="night-start">' + (night.turns.length ? "順に行動する" : "夜が明ける") + "</button></div></section>"
    );
  }
  const turn = night.turns[night.index];
  const player = Jinro.getPlayer(game, turn.playerId);
  if (night.stage === "cover") {
    return (
      '<section class="center-screen"><div class="glass narrow privacy">' +
      '<p class="eyebrow">夜の行動 ' + (night.index + 1) + " / " + night.turns.length + "</p>" +
      "<h2>" + esc(player.name) + " さんの番</h2><p>ほかの人は見ないでください。役職と能力は、この先の画面に出ます。</p>" +
      '<button type="button" class="btn btn-primary" data-act="night-open">画面を見る</button></div></section>'
    );
  }
  let body = "";
  if (turn.kind === "medium") {
    const lines = player.memory.medium.map((row) => {
      const target = Jinro.getPlayer(game, row.targetId);
      return "<li>" + row.day + "日目に吊られた " + esc(target.name) + " は<b> " + esc(Jinro.roleName(row.role)) + "</b></li>";
    }).join("");
    body = "<p>霊媒の視界が開いた。吊られた人の役職は、こうだった。</p><ul class=\"info-list\">" + lines + "</ul>";
  } else if (night.locked && turn.kind === "seer") {
    const target = Jinro.getPlayer(game, player.nightPick);
    const label = Jinro.resultLabel(night.preview);
    const curse = night.preview === "fox" ? "この占いが確定すると、相手は呪いで息絶える。" : "";
    body = '<div class="divine-result"><span>占い結果</span><b>' + esc(target.name) + " は " + esc(label) + "</b><p>" + esc(curse) + "</p></div>";
  } else if (night.locked) {
    const target = Jinro.getPlayer(game, player.nightPick);
    const verb = turn.kind === "wolf" ? "獲物に定めた" : "今夜守る";
    body = '<div class="divine-result"><b>' + esc(target.name) + "</b><p>" + verb + "。</p></div>";
  } else {
    const options = Jinro.nightOptions(game, player);
    const help = {
      wolf: "襲う相手を選んでください。人間の狼が複数いるときは、人間側の多数決です。CPUの狼は人間に従います。",
      seer: "占う相手を選んでください。妖狐なら呪殺します。",
      hunter: "守る相手を選んでください。自分は守れず、昨夜と同じ相手は選べません。",
    }[turn.kind];
    let mates = "";
    if (turn.kind === "wolf") {
      const known = Jinro.matesOf(game, player);
      mates = known.length
        ? "<p class=\"mate-line\">仲間: " + esc(known.map((m) => m.name + (m.alive ? "" : "（脱落）")).join("、")) + "</p>"
        : "<p class=\"mate-line\">仲間はいない。</p>";
    }
    body = "<p>" + help + "</p>" + mates + targetGrid(options, night.picked) +
      '<button type="button" class="btn btn-primary" data-act="night-lock"' + (night.picked ? "" : " disabled") + ">" +
      (turn.kind === "wolf" ? "この相手を襲う" : turn.kind === "seer" ? "占う" : "守る") + "</button>";
  }
  const closeLabel = night.index + 1 >= night.turns.length ? "画面を閉じて夜を終える" : "画面を閉じる";
  const close = night.locked || turn.kind === "medium"
    ? '<button type="button" class="btn btn-primary" data-act="night-done">' + closeLabel + "</button>"
    : "";
  return (
    '<section class="center-screen"><div class="glass action-card">' +
    '<p class="eyebrow">' + esc(Jinro.roleName(player.role)) + " ・ " + esc(player.name) + "</p>" +
    body + close + "</div></section>"
  );
}

function targetGrid(options, picked) {
  return '<div class="target-grid">' + options.map((opt) => {
    const player = Jinro.getPlayer(App.game, opt.id);
    const cls = (picked === opt.id ? "is-selected" : "") + (opt.disabled ? " is-disabled" : "");
    return (
      '<button type="button" class="target ' + cls + '" data-act="pick" data-id="' + esc(opt.id) + '"' + (opt.disabled ? " disabled" : "") + ">" +
      portraitSVG(player) + "<span>" + esc(player.name) + "</span>" +
      "<em>" + (player.isCpu ? "CPU" : "人") + "</em>" +
      (opt.reason ? "<small>" + esc(opt.reason) + "</small>" : "") +
      "</button>"
    );
  }).join("") + "</div>";
}

function renderMorning() {
  const game = App.game;
  const deaths = game.morningDeaths || [];
  const faces = deaths.length
    ? deaths.map((death) => {
      const player = Jinro.getPlayer(game, death.playerId);
      const cause = game.revealRoles ? "<small>" + esc(Jinro.causeLabel(death.cause)) + "</small>" : "";
      return '<div class="corpse">' + portraitSVG(player) + "<b>" + esc(player.name) + "</b>" + cause + "</div>";
    }).join("")
    : '<div class="peaceful">誰も死ななかった</div>';
  const last = game.chat.filter((line) => line.kind === "system").slice(-1)[0];
  const button = game.winners
    ? '<button type="button" class="btn btn-primary" data-act="to-end">結果を見る</button>'
    : '<button type="button" class="btn btn-primary" data-act="to-day">昼の議論へ</button>';
  const watch = !game.winners && !Jinro.livingHumans(game).length
    ? '<button type="button" class="btn btn-ghost" data-act="spectate">この先を見届ける</button>'
    : "";
  return (
    '<section class="play-layout"><div class="circle-wrap">' + circleHTML(game) + "</div>" +
    '<div class="panel morning-panel"><p class="eyebrow">' + game.day + '日目の朝</p><h2>' + (deaths.length ? "無残な朝" : "静かな朝") + "</h2>" +
    '<div class="corpse-row">' + faces + "</div><p>" + esc(last ? last.text : "") + "</p>" +
    (game.winners ? "<p class=\"warn-line\">この犠牲で、村の運命は決した。</p>" : "") +
    '<div class="row-actions">' + button + watch + "</div></div></section>"
  );
}

function bubbleHTML(line) {
  if (!line.playerId) return '<div class="bubble system">' + esc(line.text) + "</div>";
  const player = Jinro.getPlayer(App.game, line.playerId);
  const tag = line.tag ? '<span class="tag">' + esc(line.tag) + "</span>" : "";
  return (
    '<div class="bubble ' + esc(line.kind) + '"><div class="who">' + portraitSVG(player) +
    "<b>" + esc(player.name) + "</b>" + tag + "</div><p>" + esc(line.text) + "</p></div>"
  );
}

function chatHTML(game) {
  if (!game.chat.length) return '<p class="hint">まだ発言はない。</p>';
  return game.chat.map(bubbleHTML).join("");
}

function paintDayProgress() {
  const hint = document.getElementById("day-hint");
  const remain = App.game && App.game.dayScript ? App.game.dayScript.length : 0;
  if (hint) hint.textContent = remain ? "CPUの発言が残っています（" + remain + "）" : "発言は出そろった。投票に進める。";
  const ledger = document.querySelector(".ledger");
  if (ledger && App.game) ledger.outerHTML = boardHTML(App.game);
}

function appendLastChat() {
  const log = document.getElementById("chat-log");
  const line = App.game.chat[App.game.chat.length - 1];
  if (!log || !line) return false;
  const placeholder = log.querySelector(":scope > .hint");
  if (placeholder) placeholder.remove();
  log.insertAdjacentHTML("beforeend", bubbleHTML(line));
  log.scrollTop = log.scrollHeight;
  paintDayProgress();
  return true;
}

function boardHTML(game) {
  const board = JinroAI.publicBoard(game);
  const claimItems = board.claims.length
    ? board.claims.map((claim) => "<li><b>" + esc(claim.name) + "</b> " + esc(claim.role) + (claim.detail ? " · " + esc(claim.detail) : "") + "</li>").join("")
    : "<li>まだない</li>";
  const clashItems = board.clashes.length
    ? board.clashes.map((line) => "<li>" + esc(line) + "</li>").join("")
    : "<li>まだない</li>";
  const intentItems = Jinro.livingPlayers(game).filter((player) => game.intents && game.intents[player.id]).map((player) => {
    const target = Jinro.getPlayer(game, game.intents[player.id]);
    return "<li>" + esc(player.name) + " → " + esc(target.name) + "</li>";
  }).join("") || "<li>まだない</li>";
  const leanItems = board.leans.length
    ? board.leans.map((row) => "<li><b>" + esc(row.name) + "</b></li>").join("")
    : "<li>まだ割れていない</li>";
  return (
    '<div class="ledger">' +
    "<div><p>宣言</p><ul>" + claimItems + "</ul></div>" +
    "<div><p>食い違い</p><ul>" + clashItems + "</ul></div>" +
    "<div><p>今日の票</p><ul>" + intentItems + "</ul></div>" +
    "<div><p>疑い</p><ul>" + leanItems + "</ul></div></div>"
  );
}

function renderDay() {
  const game = App.game;
  const humans = Jinro.livingHumans(game);
  if (!App.speakerId || !humans.some((p) => p.id === App.speakerId)) App.speakerId = humans[0] ? humans[0].id : "";
  const speakers = humans.map((p) => '<option value="' + esc(p.id) + '"' + (p.id === App.speakerId ? " selected" : "") + ">" + esc(p.name) + "</option>").join("");
  const living = Jinro.livingPlayers(game).filter((p) => p.id !== App.speakerId);
  const targets = living.map((p) => '<option value="' + esc(p.id) + '"' + (p.id === App.talkTarget ? " selected" : "") + ">" + esc(p.name) + "</option>").join("");
  const remain = (game.dayScript || []).length;
  const watch = !humans.length
    ? '<button type="button" class="btn btn-ghost" data-act="spectate">この先を見届ける</button>'
    : "";
  return (
    '<section class="play-layout"><div class="circle-wrap">' + circleHTML(game) + "</div>" +
    '<div class="panel day-panel"><div class="row-between"><div><p class="eyebrow">' + game.day + '日目の昼</p><h2>議論</h2></div>' +
    timerButton() + "</div>" +
    '<div class="chips">' + chips(game.composition) + "</div>" +
    boardHTML(game) +
    (App.note ? '<p class="warn-line">' + esc(App.note) + "</p>" : "") +
    '<div class="chat-log" id="chat-log">' + chatHTML(game) + "</div>" +
    '<p class="hint" id="day-hint">' + (remain ? "CPUの発言が残っています（" + remain + "）" : "発言は出そろった。投票に進める。") + "</p>" +
    (humans.length ? (
      '<div class="composer"><select data-bind="speaker">' + speakers + "</select>" +
      '<select data-bind="talk-kind">' +
      '<option value="normal"' + (App.talkKind === "normal" ? " selected" : "") + ">通常</option>" +
      '<option value="suspect"' + (App.talkKind === "suspect" ? " selected" : "") + ">疑う</option>" +
      '<option value="defend"' + (App.talkKind === "defend" ? " selected" : "") + ">擁護する</option>" +
      '<option value="self"' + (App.talkKind === "self" ? " selected" : "") + ">自分を疑う</option></select>" +
      '<select data-bind="talk-target"><option value="">対象</option>' + targets + "</select>" +
      '<input maxlength="80" data-bind="draft" value="' + esc(App.draft) + '" placeholder="発言（80字まで）" />' +
      '<button type="button" class="btn btn-ghost" data-act="talk">発言</button></div>' +
      '<div class="row-actions"><button type="button" class="btn btn-ghost" data-act="intent">この人に票を置く</button>' +
      '<button type="button" class="btn btn-ghost" data-act="co">カミングアウト</button>' +
      '<button type="button" class="btn btn-ghost" data-act="remind">役職を確認</button>' +
      (remain ? '<button type="button" class="btn btn-ghost" data-act="flush">発言を最後まで出す</button>' : "") +
      "</div>"
    ) : "<p>生存している人間はいません。CPUだけで村は進みます。</p>") +
    '<div class="row-actions"><button type="button" class="btn btn-primary" data-act="to-vote">投票へ進む</button>' + watch + "</div></div>" +
    overlayHTML() + "</section>"
  );
}

function overlayHTML() {
  if (App.remind) return remindHTML();
  if (App.co) return coHTML();
  return "";
}

function remindHTML() {
  const humans = Jinro.livingHumans(App.game);
  if (App.remind.stage === "who") {
    return '<div class="overlay"><div class="glass narrow"><h2>誰が確認する</h2><p>自分の名前だけ押してください。</p>' +
      humans.map((p) => '<button type="button" class="btn btn-ghost block" data-act="remind-choose" data-id="' + esc(p.id) + '">' + esc(p.name) + "</button>").join("") +
      '<button type="button" class="btn btn-ghost" data-act="remind-close">やめる</button></div></div>';
  }
  const player = Jinro.getPlayer(App.game, App.remind.playerId);
  if (App.remind.stage === "cover") {
    return '<div class="overlay"><div class="glass narrow privacy"><h2>' + esc(player.name) + ' さん</h2><p>ほかの人は見ないでください。</p>' +
      '<button type="button" class="btn btn-primary" data-act="remind-open">役職を見る</button></div></div>';
  }
  return '<div class="overlay"><div class="deal-wrap">' + roleCardHTML(player, App.game) +
    '<button type="button" class="btn btn-primary" data-act="remind-close">閉じる</button></div></div>';
}

function coHTML() {
  const humans = Jinro.livingHumans(App.game);
  if (App.co.stage === "who") {
    return '<div class="overlay"><div class="glass narrow"><h2>誰が宣言する</h2><p>宣言の内容は、確定するまで他の人に見えません。自分の名前を押してください。</p>' +
      humans.map((p) => '<button type="button" class="btn btn-ghost block" data-act="co-choose" data-id="' + esc(p.id) + '">' + esc(p.name) + "</button>").join("") +
      '<button type="button" class="btn btn-ghost" data-act="co-cancel">やめる</button></div></div>';
  }
  const player = Jinro.getPlayer(App.game, App.co.playerId);
  if (App.co.stage === "cover") {
    return '<div class="overlay"><div class="glass narrow privacy"><h2>' + esc(player.name) + ' さんの宣言</h2><p>入力中の画面は秘密です。確定した内容だけが村に伝わります。</p>' +
      '<button type="button" class="btn btn-primary" data-act="co-open">宣言を書く</button></div></div>';
  }
  const roles = ["seer", "medium", "hunter", "mason"];
  const options = roles.map((id) => '<option value="' + id + '"' + (App.co.role === id ? " selected" : "") + ">" + esc(Jinro.roleName(id)) + "</option>").join("");
  let rows = "";
  if (App.co.role === "seer" || App.co.role === "medium" || App.co.role === "mason") {
    const pool = App.co.role === "medium" ? App.game.players.filter((p) => !p.alive) : Jinro.livingPlayers(App.game).filter((p) => p.id !== player.id);
    rows = App.co.rows.map((row, index) => {
      const choices = pool.map((p) => '<option value="' + esc(p.id) + '"' + (row.targetId === p.id ? " selected" : "") + ">" + esc(p.name) + "</option>").join("");
      let extra = "";
      if (App.co.role === "seer") {
        extra = '<select data-bind="co-result" data-index="' + index + '">' +
          ["human", "wolf", "fox"].map((result) => '<option value="' + result + '"' + (row.result === result ? " selected" : "") + ">" + esc(Jinro.resultLabel(result)) + "</option>").join("") +
          "</select>";
      }
      if (App.co.role === "medium") {
        extra = '<select data-bind="co-dead-role" data-index="' + index + '">' +
          Jinro.ROLE_ORDER.map((id) => '<option value="' + id + '"' + (row.role === id ? " selected" : "") + ">" + esc(Jinro.roleName(id)) + "</option>").join("") +
          "</select>";
      }
      return '<div class="co-row"><select data-bind="co-target" data-index="' + index + '"><option value="">対象</option>' + choices + "</select>" + extra +
        '<button type="button" data-act="co-del" data-index="' + index + '">消す</button></div>';
    }).join("");
    rows += '<button type="button" class="btn btn-ghost" data-act="co-add">対象を追加</button>';
  }
  return (
    '<div class="overlay"><div class="glass action-card"><p class="eyebrow">' + esc(player.name) + " の秘密の宣言</p>" +
    "<h2>カミングアウト</h2>" +
    '<label>宣言する役<select data-bind="co-role-select">' + options + "</select></label>" +
    rows +
    (App.co.error ? '<p class="warn-line">' + esc(App.co.error) + "</p>" : "") +
    '<p class="hint">実際の結果が入っているときは、そのままだと本当のことを言います。変えれば嘘になります。</p>' +
    '<div class="row-actions"><button type="button" class="btn btn-ghost" data-act="co-cancel">やめる</button>' +
    '<button type="button" class="btn btn-primary" data-act="co-submit">村に宣言する</button></div></div></div>'
  );
}

function renderVote() {
  const game = App.game;
  const vote = App.vote;
  const voter = Jinro.getPlayer(game, vote.order[vote.index]);
  if (vote.stage === "cover") {
    const revote = game.voteRound > 1 ? "再投票です。" : "";
    return (
      '<section class="center-screen"><div class="glass narrow privacy">' +
      '<p class="eyebrow">' + game.day + "日目の投票 " + (vote.index + 1) + " / " + vote.order.length + "</p>" +
      "<h2>" + esc(voter.name) + " さんの票</h2><p>" + revote + "開票まで、誰に入れたかは秘密です。ほかの人は見ないでください。</p>" +
      '<button type="button" class="btn btn-primary" data-act="vote-open">投票する</button></div></section>'
    );
  }
  const options = Jinro.currentCandidates(game).filter((id) => id !== voter.id).map((id) => ({ id, disabled: false, reason: "" }));
  const names = game.voteRound > 1 ? Jinro.currentCandidates(game).map((id) => Jinro.getPlayer(game, id).name).join("、") : "";
  const said = game.intents && game.intents[voter.id];
  const saidName = said && said !== voter.id ? Jinro.getPlayer(game, said).name : "";
  return (
    '<section class="center-screen"><div class="glass action-card">' +
    "<h2>" + esc(voter.name) + " は誰を吊るか</h2>" +
    (names ? "<p>再投票の対象は " + esc(names) + "。</p>" : "<p>自分には入れられません。</p>") +
    (saidName ? "<p>昼に置いた票は " + esc(saidName) + "。このまま確定しても、変えられます。</p>" : "") +
    targetGrid(options, vote.picked) +
    '<button type="button" class="btn btn-primary" data-act="vote-lock"' + (vote.picked ? "" : " disabled") + ">この票で確定する</button></div></section>"
  );
}

function renderTally() {
  const game = App.game;
  const tally = game.currentTally;
  const entries = tally.candidates.map((id) => ({
    id,
    count: tally.counts[id] || 0,
    voters: tally.ballots.filter((b) => b.targetId === id).map((b) => Jinro.getPlayer(game, b.voterId).name),
  }));
  entries.sort((a, b) => b.count - a.count);
  const max = Math.max.apply(null, entries.map((e) => e.count).concat([1]));
  const bars = entries.map((entry) => {
    const player = Jinro.getPlayer(game, entry.id);
    const doomed = tally.top.length === 1 && tally.top[0] === entry.id;
    return (
      '<div class="bar-row' + (doomed ? " is-doomed" : "") + '">' + portraitSVG(player) +
      "<div><b>" + esc(player.name) + "　" + entry.count + "票</b>" +
      '<div class="bar"><i style="width:' + Math.round((entry.count / max) * 100) + '%"></i></div>' +
      "<small>" + esc(entry.voters.join("、") || "票なし") + "</small></div></div>"
    );
  }).join("");
  let headline = "票は割れた";
  let detail = "再投票になる。";
  let act = "tally-next";
  let label = "再投票へ";
  if (game.phase === "no-execution") {
    headline = "今日は吊らない";
    detail = "再投票も割れた。夜が来る。";
    label = "次の夜へ";
  }
  if (tally.top.length === 1) {
    const hanged = Jinro.getPlayer(game, tally.top[0]);
    headline = hanged.name + " が吊られた";
    detail = game.revealRoles ? "役職は " + Jinro.roleName(hanged.role) + "。" : "役職は、まだ村には明かされていない。";
    label = "次の夜へ";
    if (hanged.role === "hanged" && game.winners) {
      detail = "吊人だった。この瞬間、吊人の単独勝利。";
      label = "結果を見る";
    }
  }
  if (game.winners && !(tally.top.length === 1 && Jinro.getPlayer(game, tally.top[0]).role === "hanged")) {
    label = "結果を見る";
    detail = "吊りのあと、村の運命は決した。";
  }
  const doomed = tally.top.length === 1 ? tally.top[0] : "";
  const watch = !game.winners && game.phase !== "revote" && !Jinro.livingHumans(game).length
    ? '<button type="button" class="btn btn-ghost" data-act="spectate">この先を見届ける</button>'
    : "";
  return (
    '<section class="play-layout"><div class="circle-wrap">' + circleHTML(game, doomed) + "</div>" +
    '<div class="panel"><p class="eyebrow">' + (tally.round > 1 ? "再投票の開票" : "開票") + "</p><h2>" + esc(headline) + "</h2>" +
    '<div class="tally">' + bars + "</div><p>" + esc(detail) + "</p>" +
    '<div class="row-actions"><button type="button" class="btn btn-primary" data-act="' + act + '">' + esc(label) + "</button>" + watch + "</div></div></section>"
  );
}

function renderEnd() {
  const game = App.game;
  const win = game.winners;
  const title = Jinro.winnerTitle(win.teams);
  const winners = win.playerIds.map((id) => Jinro.getPlayer(game, id));
  const roster = game.players.slice().sort((a, b) => a.seat - b.seat).map((p) => {
    const meta = Jinro.ROLE_META[p.role];
    const won = win.playerIds.indexOf(p.id) >= 0;
    const state = p.alive ? "生存" : "死亡・" + Jinro.causeLabel(p.deathCause);
    return (
      '<div class="roster' + (won ? " is-win" : "") + '" style="--role:' + meta.color + '">' +
      portraitSVG(p) + "<div><b>" + esc(p.name) + "</b><small>" + esc(meta.name) + " ・ " + esc(meta.teamLabel) + "</small>" +
      "<small>" + esc(state) + (p.isCpu ? " ・ CPU" : " ・ 人") + "</small></div></div>"
    );
  }).join("");
  const petals = new Array(16).fill(0).map((_, i) => '<i style="left:' + (i * 6.2) + '%;animation-delay:' + (i % 5) * 0.35 + 's"></i>').join("");
  return (
    '<section class="center-screen"><div class="panel end-panel"><div class="petals" aria-hidden="true">' + petals + "</div>" +
    '<p class="eyebrow">決着</p><h2>' + esc(title) + "</h2><p>" + esc(win.reason) + "</p>" +
    '<div class="winner-row">' + winners.map((p) => '<div class="corpse">' + portraitSVG(p) + "<b>" + esc(p.name) + "</b><small>" + esc(Jinro.roleName(p.role)) + "</small></div>").join("") + "</div>" +
    '<div class="roster-grid">' + roster + "</div>" +
    "<details><summary>村の記録</summary><div class=\"chat-log\">" + chatHTML(game) + "</div></details>" +
    '<div class="row-actions"><button type="button" class="btn btn-primary" data-act="rematch">同じ配役でもう一戦</button>' +
    '<button type="button" class="btn btn-ghost" data-act="back-setup">配役を変える</button>' +
    '<button type="button" class="btn btn-ghost" data-act="leave-yes">タイトルへ</button></div></div></section>'
  );
}

function render() {
  svgSeq = 0;
  const focused = document.activeElement;
  App.restoreDraftFocus = !!(focused && focused.dataset && focused.dataset.bind === "draft");
  if (App.restoreDraftFocus) App.draftCursor = focused.selectionStart;
  const root = document.getElementById("app");
  let html = "";
  if (App.screen === "title") html = renderTitle();
  else if (App.screen === "setup") html = renderSetup();
  else if (App.screen === "deal") html = renderDeal();
  else if (App.screen === "night") html = renderNight();
  else if (App.screen === "morning") html = renderMorning();
  else if (App.screen === "day") html = renderDay();
  else if (App.screen === "vote") html = renderVote();
  else if (App.screen === "tally") html = renderTally();
  else if (App.screen === "end") html = renderEnd();
  root.innerHTML = html + modalHTML();
  afterRender();
}

function timerButton() {
  const state = App.timerLeft <= 0 ? " is-up" : App.timerOn ? " is-running" : " is-paused";
  const note = App.timerLeft <= 0 ? "時間です" : App.timerOn ? "議論中" : "停止中";
  return '<button type="button" class="timer' + state + '" id="timer" data-act="timer" title="クリックで一時停止と再開"><span data-timer-readout>' + formatTime(App.timerLeft) + "</span><small>" + note + "</small></button>";
}

function paintTimer() {
  document.querySelectorAll("[data-timer-readout]").forEach((el) => {
    el.textContent = formatTime(App.timerLeft);
  });
  const btn = document.getElementById("timer");
  if (!btn) return;
  btn.classList.toggle("is-running", App.timerOn && App.timerLeft > 0);
  btn.classList.toggle("is-paused", !App.timerOn && App.timerLeft > 0);
  btn.classList.toggle("is-up", App.timerLeft <= 0);
  const note = btn.querySelector("small");
  if (note) note.textContent = App.timerLeft <= 0 ? "時間です" : App.timerOn ? "議論中" : "停止中";
}

function syncScene() {
  const moods = { title: "night", setup: "dusk", deal: "night", night: "night", morning: "dawn", day: "day", vote: "day", tally: "dusk", end: "end" };
  document.body.dataset.mood = moods[App.screen] || "night";
  document.body.dataset.win = App.screen === "end" && App.game && App.game.winners ? App.game.winners.teams.slice().sort().join("-") : "";
  const hud = document.getElementById("hud");
  if (!hud) return;
  if (!App.game || App.screen === "title" || App.screen === "setup") {
    hud.innerHTML = '<span class="hud-mark">月下の人狼</span>';
    return;
  }
  const alive = Jinro.livingPlayers(App.game).length;
  const phase = document.body.dataset.mood === "night" && App.screen === "night" ? "第" + App.game.day + "夜" : "";
  const labels = { deal: "配役", night: "第" + App.game.day + "夜", morning: App.game.day + "日目の朝", day: App.game.day + "日目の昼", vote: App.game.day + "日目の投票", tally: "開票", end: "決着" };
  const clock = App.screen === "day" ? '<span class="hud-alive" data-timer-readout>' + formatTime(App.timerLeft) + "</span>" : "";
  hud.innerHTML = '<span class="hud-mark">月下の人狼</span><span class="hud-phase">' + esc(labels[App.screen] || phase) + "</span>" + clock + '<span class="hud-alive">生存 ' + alive + "</span>" +
    (App.game.revealRoles ? '<span class="practice">練習公開</span>' : "") +
    (App.screen === "title" ? "" : '<button type="button" class="text-btn" data-act="leave-ask">村を出る</button>');
}

function afterRender() {
  syncScene();
  const log = document.getElementById("chat-log");
  if (log) log.scrollTop = log.scrollHeight;
  if (App.restoreDraftFocus) {
    const draft = document.querySelector("[data-bind=draft]");
    if (draft) {
      draft.focus();
      const pos = App.draftCursor == null ? draft.value.length : App.draftCursor;
      try { draft.setSelectionRange(pos, pos); } catch (err) { /* 入力欄がない画面では戻さない */ }
    }
  }
  const sound = document.getElementById("btn-sound");
  if (sound) sound.textContent = Sfx.on ? "音: 入" : "音: 切";
  if (App.screen === "day") ensureDayLoops();
}

function ensureDayLoops() {
  if (!App.chatTimer) {
    App.chatTimer = setInterval(() => {
      if (App.screen !== "day" || !App.game || App.modal || App.co || App.remind) return;
      if (!App.game.dayScript || !App.game.dayScript.length) return;
      const line = App.game.dayScript.shift();
      Jinro.commitScriptLine(App.game, line);
      const remain = App.game.dayScript.length;
      if (line.claim || !remain) render();
      else if (!appendLastChat()) render();
    }, 1100);
  }
  if (!App.clock) {
    App.clock = setInterval(() => {
      if (!App.timerOn || App.screen !== "day") return;
      App.timerLeft -= 1;
      if (App.timerLeft <= 0) {
        App.timerOn = false;
        App.timerLeft = 0;
        paintTimer();
        if (!App.timerRang && App.game) {
          App.timerRang = true;
          App.game.chat.push({ id: "t" + Date.now(), playerId: null, kind: "system", text: "議論の時間だ。投票に進める。", day: App.game.day, tag: "" });
          render();
        }
        return;
      }
      paintTimer();
    }, 1000);
  }
}

function defaultRows(player, role) {
  if (role === "seer" && player.role === "seer" && player.memory.seer.length) {
    return player.memory.seer.map((row) => ({ targetId: row.targetId, result: row.result, day: row.day }));
  }
  if (role === "medium" && player.role === "medium" && player.memory.medium.length) {
    return player.memory.medium.map((row) => ({ targetId: row.targetId, role: row.role, day: row.day }));
  }
  if (role === "mason" && player.role === "mason" && player.memory.mates.length) {
    return [{ targetId: player.memory.mates[0] }];
  }
  if (role === "seer") return [{ targetId: "", result: "human", day: App.game.day }];
  if (role === "medium") return [{ targetId: "", role: "villager", day: App.game.day }];
  if (role === "mason") return [{ targetId: "" }];
  return [];
}

function finishNight() {
  Jinro.resolveNight(App.game);
  App.screen = "morning";
  Sfx.play(App.game.morningDeaths.length ? "death" : "dawn");
  render();
}

function openVote(isRevote) {
  const game = App.game;
  if (!isRevote) Jinro.flushDayScript(game);
  if (isRevote) Jinro.startVotingRound(game, game.revoteCandidates);
  else Jinro.startVotingRound(game);
  const humans = Jinro.livingHumans(game);
  App.vote = { stage: "cover", index: 0, order: humans.map((p) => p.id), picked: null };
  if (!humans.length) {
    const result = Jinro.resolveVotingRound(game);
    App.lastResult = result;
    App.screen = "tally";
    Sfx.play(game.winners ? "win" : result.type === "executed" ? "death" : "vote");
  } else {
    App.screen = "vote";
    Sfx.play("vote");
  }
  render();
}

function run(fn) {
  try {
    fn();
  } catch (err) {
    console.error(err);
    App.modal = { type: "error", text: err.message || String(err) };
    render();
  }
}

const actions = {
  "go-setup"() {
    if (!App.composition) App.composition = Jinro.recommendedComposition(playerTotal());
    App.screen = "setup";
    render();
  },
  rules() {
    App.modal = "rules";
    render();
  },
  "close-modal"() {
    App.modal = null;
    render();
  },
  "leave-ask"() {
    if (!App.game || App.screen === "title" || App.screen === "end") {
      App.screen = "title";
      App.modal = null;
      render();
      return;
    }
    App.modal = "leave";
    render();
  },
  "leave-yes"() {
    App.screen = "title";
    App.game = null;
    App.modal = null;
    App.co = null;
    App.remind = null;
    render();
  },
  "add-human"() {
    if (App.humans.length >= 12 || playerTotal() >= 16) return;
    App.humans.push({ name: "プレイヤー" + (App.humans.length + 1) });
    App.composition = Jinro.recommendedComposition(playerTotal());
    render();
  },
  "remove-human"(btn) {
    if (App.humans.length <= 2) return;
    App.humans.splice(Number(btn.dataset.index), 1);
    if (playerTotal() < 4) App.cpuCount += 4 - playerTotal();
    App.composition = Jinro.recommendedComposition(playerTotal());
    render();
  },
  cpu(btn) {
    const next = App.cpuCount + Number(btn.dataset.dir);
    const total = App.humans.length + next;
    if (next < 0 || total < 4 || total > 16) return;
    App.cpuCount = next;
    App.composition = Jinro.recommendedComposition(total);
    render();
  },
  role(btn) {
    const role = btn.dataset.role;
    const next = Math.max(0, (App.composition[role] || 0) + Number(btn.dataset.dir));
    App.composition = Object.assign({}, App.composition, { [role]: next });
    render();
  },
  preset() {
    App.composition = Jinro.recommendedComposition(playerTotal());
    render();
  },
  begin() {
    const check = Jinro.validateComposition(App.composition, playerTotal());
    if (!check.ok) return;
    App.game = Jinro.createGame({
      humans: App.humans.map((human) => ({ name: human.name })),
      cpuCount: App.cpuCount,
      composition: App.composition,
      revealRoles: App.revealRoles,
    });
    App.deal = { index: 0, stage: "cover" };
    App.screen = "deal";
    App.modal = null;
    render();
  },
  "deal-open"() {
    App.deal.stage = "card";
    render();
  },
  "deal-next"() {
    App.deal.index += 1;
    App.deal.stage = App.deal.index >= entryHumans(App.game).length ? "done" : "cover";
    render();
  },
  "to-night"() {
    Jinro.startNight(App.game);
    App.night = { stage: "intro", index: 0, turns: Jinro.humanNightTurns(App.game), picked: null, locked: false, preview: null };
    App.screen = "night";
    Sfx.play("night");
    render();
  },
  "night-start"() {
    if (!App.night.turns.length) {
      finishNight();
      return;
    }
    App.night.stage = "cover";
    App.night.index = 0;
    render();
  },
  "night-open"() {
    App.night.stage = "action";
    App.night.picked = null;
    App.night.locked = false;
    App.night.preview = null;
    render();
  },
  pick(btn) {
    if (btn.disabled) return;
    if (App.screen === "vote") App.vote.picked = btn.dataset.id;
    else App.night.picked = btn.dataset.id;
    render();
  },
  "night-lock"() {
    const turn = App.night.turns[App.night.index];
    const player = Jinro.getPlayer(App.game, turn.playerId);
    const picked = App.night.picked;
    const allowed = Jinro.nightOptions(App.game, player).some((opt) => opt.id === picked && !opt.disabled);
    if (!allowed) return;
    player.nightPick = picked;
    App.night.locked = true;
    App.night.preview = turn.kind === "seer" ? Jinro.divinePreview(Jinro.getPlayer(App.game, picked)) : null;
    render();
  },
  "night-done"() {
    const turn = App.night.turns[App.night.index];
    const player = Jinro.getPlayer(App.game, turn.playerId);
    if (turn.kind === "medium") Jinro.markMediumRead(player);
    if (turn.kind !== "medium" && !player.nightPick) return;
    App.night.index += 1;
    App.night.picked = null;
    App.night.locked = false;
    App.night.preview = null;
    if (App.night.index >= App.night.turns.length) finishNight();
    else {
      App.night.stage = "cover";
      render();
    }
  },
  "to-day"() {
    if (App.game.winners) {
      App.screen = "end";
      Sfx.play("win");
      render();
      return;
    }
    Jinro.startDay(App.game);
    App.screen = "day";
    App.timerLeft = 180;
    App.timerOn = true;
    App.timerRang = false;
    const first = Jinro.livingHumans(App.game)[0];
    App.speakerId = first ? first.id : "";
    render();
  },
  "to-end"() {
    App.screen = "end";
    Sfx.play("win");
    render();
  },
  flush() {
    Jinro.flushDayScript(App.game);
    render();
  },
  timer() {
    if (App.timerLeft <= 0) {
      App.timerLeft = 180;
      App.timerRang = false;
    }
    App.timerOn = !App.timerOn;
    render();
  },
  talk() {
    const field = document.querySelector("[data-bind=draft]");
    if (field && field.value) App.draft = field.value;
    const speaker = App.speakerId;
    if (!speaker || !App.draft.trim()) return;
    let pressure = null;
    if (App.talkKind === "self") pressure = { kind: "self", targetId: speaker };
    if (App.talkKind === "suspect" || App.talkKind === "defend") {
      if (!App.talkTarget) return;
      pressure = { kind: App.talkKind, targetId: App.talkTarget };
    }
    Jinro.humanTalk(App.game, speaker, App.draft, pressure);
    App.draft = "";
    App.note = "";
    render();
  },
  intent() {
    if (!App.speakerId || !App.talkTarget) {
      App.note = "票を置く相手を、対象から選んでください。";
      render();
      return;
    }
    Jinro.declareIntent(App.game, App.speakerId, App.talkTarget);
    App.note = "";
    render();
  },
  co() {
    const humans = Jinro.livingHumans(App.game);
    if (!humans.length) return;
    if (humans.length === 1) App.co = { stage: "cover", playerId: humans[0].id, role: "seer", rows: [], error: "" };
    else App.co = { stage: "who", playerId: "", role: "seer", rows: [], error: "" };
    render();
  },
  "co-choose"(btn) {
    App.co.playerId = btn.dataset.id;
    App.co.stage = "cover";
    render();
  },
  "co-open"() {
    const player = Jinro.getPlayer(App.game, App.co.playerId);
    App.co.stage = "form";
    App.co.role = "seer";
    App.co.rows = defaultRows(player, "seer");
    App.co.error = "";
    render();
  },
  "co-add"() {
    if (App.co.role === "seer") App.co.rows.push({ targetId: "", result: "human", day: App.game.day });
    else if (App.co.role === "medium") App.co.rows.push({ targetId: "", role: "villager", day: App.game.day });
    else App.co.rows.push({ targetId: "" });
    render();
  },
  "co-del"(btn) {
    App.co.rows.splice(Number(btn.dataset.index), 1);
    render();
  },
  "co-cancel"() {
    App.co = null;
    render();
  },
  "co-submit"() {
    const role = App.co.role;
    const rows = (App.co.rows || []).filter((row) => row.targetId);
    if ((role === "seer" || role === "medium" || role === "mason") && !rows.length) {
      App.co.error = "対象を選んでください。";
      render();
      return;
    }
    const statements = rows.map((row) => {
      if (role === "seer") return { day: row.day || App.game.day, targetId: row.targetId, result: row.result || "human" };
      if (role === "medium") return { day: row.day || App.game.day, targetId: row.targetId, role: row.role || "villager" };
      return { targetId: row.targetId };
    });
    Jinro.humanComingOut(App.game, App.co.playerId, role, statements);
    App.co = null;
    render();
  },
  remind() {
    const humans = Jinro.livingHumans(App.game);
    if (!humans.length) return;
    if (humans.length === 1) App.remind = { stage: "cover", playerId: humans[0].id };
    else App.remind = { stage: "who", playerId: "" };
    render();
  },
  "remind-choose"(btn) {
    App.remind.playerId = btn.dataset.id;
    App.remind.stage = "cover";
    render();
  },
  "remind-open"() {
    App.remind.stage = "card";
    render();
  },
  "remind-close"() {
    App.remind = null;
    render();
  },
  "to-vote"() {
    openVote(false);
  },
  "vote-open"() {
    const voterId = App.vote.order[App.vote.index];
    const said = App.game.intents && App.game.intents[voterId];
    const legal = Jinro.currentCandidates(App.game);
    App.vote.stage = "ballot";
    App.vote.picked = said && said !== voterId && legal.indexOf(said) >= 0 ? said : null;
    render();
  },
  "vote-lock"() {
    const voterId = App.vote.order[App.vote.index];
    Jinro.castVote(App.game, voterId, App.vote.picked);
    App.vote.index += 1;
    App.vote.picked = null;
    if (App.vote.index >= App.vote.order.length) {
      const result = Jinro.resolveVotingRound(App.game);
      App.lastResult = result;
      App.screen = "tally";
      Sfx.play(App.game.winners ? "win" : result.type === "executed" ? "death" : "vote");
    } else App.vote.stage = "cover";
    render();
  },
  "tally-next"() {
    const game = App.game;
    if (game.winners) {
      App.screen = "end";
      Sfx.play("win");
      render();
      return;
    }
    if (game.phase === "revote") {
      openVote(true);
      return;
    }
    Jinro.startNight(game);
    App.night = { stage: "intro", index: 0, turns: Jinro.humanNightTurns(game), picked: null, locked: false, preview: null };
    App.screen = "night";
    Sfx.play("night");
    render();
  },
  spectate() {
    Jinro.runToEnd(App.game);
    if (!App.game.winners) throw new Error("決着まで進めませんでした");
    App.screen = "end";
    App.co = null;
    App.remind = null;
    Sfx.play("win");
    render();
  },
  rematch() {
    const setup = App.game.setup;
    App.humans = setup.humans.map((human) => ({ name: human.name }));
    App.cpuCount = setup.cpuCount;
    App.composition = Object.assign(Jinro.blankComposition(), setup.composition);
    App.revealRoles = setup.revealRoles;
    App.game = Jinro.createGame({
      humans: setup.humans,
      cpuCount: setup.cpuCount,
      composition: setup.composition,
      revealRoles: setup.revealRoles,
    });
    App.deal = { index: 0, stage: "cover" };
    App.screen = "deal";
    App.modal = null;
    render();
  },
  "back-setup"() {
    const setup = App.game.setup;
    App.humans = setup.humans.map((human) => ({ name: human.name }));
    App.cpuCount = setup.cpuCount;
    App.composition = Object.assign(Jinro.blankComposition(), setup.composition);
    App.revealRoles = setup.revealRoles;
    App.game = null;
    App.screen = "setup";
    render();
  },
  sound() {
    Sfx.on = !Sfx.on;
    if (Sfx.on) Sfx.play("dawn");
    const sound = document.getElementById("btn-sound");
    if (sound) sound.textContent = Sfx.on ? "音: 入" : "音: 切";
  },
};

function onClick(event) {
  const btn = event.target.closest("[data-act]");
  if (!btn || btn.disabled) return;
  const act = actions[btn.dataset.act];
  if (!act) return;
  run(() => act(btn));
}

function onField(event) {
  const el = event.target;
  if (!el.dataset) return;
  if (el.dataset.bind === "human-name") App.humans[Number(el.dataset.index)].name = el.value;
  if (el.id === "reveal-toggle") App.revealRoles = el.checked;
  if (el.dataset.bind === "draft") App.draft = el.value;
  if (el.dataset.bind === "speaker") App.speakerId = el.value;
  if (el.dataset.bind === "talk-target") App.talkTarget = el.value;
  if (el.dataset.bind === "talk-kind") App.talkKind = el.value;
  if (el.dataset.bind === "co-role-select" && App.co) {
    const player = Jinro.getPlayer(App.game, App.co.playerId);
    const role = el.value;
    setTimeout(() => {
      if (!App.co) return;
      App.co.role = role;
      App.co.rows = defaultRows(player, role);
      App.co.error = "";
      render();
    }, 0);
    return;
  }
  if (!App.co) return;
  const index = Number(el.dataset.index);
  if (!App.co.rows[index]) return;
  if (el.dataset.bind === "co-target") App.co.rows[index].targetId = el.value;
  if (el.dataset.bind === "co-result") App.co.rows[index].result = el.value;
  if (el.dataset.bind === "co-dead-role") App.co.rows[index].role = el.value;
}

function buildSky() {
  const stars = document.querySelector(".stars");
  if (!stars || stars.childElementCount) return;
  for (let i = 0; i < 72; i += 1) {
    const star = document.createElement("i");
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 58 + "%";
    star.style.animationDelay = Math.random() * 4 + "s";
    const size = Math.random() < 0.15 ? 3 : Math.random() < 0.4 ? 2 : 1;
    star.style.width = size + "px";
    star.style.height = size + "px";
    stars.appendChild(star);
  }
}

function boot() {
  App.composition = Jinro.recommendedComposition(playerTotal());
  buildSky();
  document.body.addEventListener("click", onClick);
  document.body.addEventListener("input", onField);
  document.body.addEventListener("change", onField);
  render();
}

boot();
