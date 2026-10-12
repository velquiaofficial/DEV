/**
 * 画像なしで進むゲーム。
 * 表示する場所と編成は data/ の JSON から読む。
 *   data/stages.json      戦闘場所（章名、WAVE、制限時間、敵）
 *   data/characters.json  キャラ名簿（名前、属性、ステータス、スキル）
 *   data/stats.json       ステータスの名前と、威力・防御の計算
 *   data/growth.json      経験値、レベル上限、レベルアップで増えるステータス
 *   data/elements.json    属性の名前と枠の色
 *   data/chapters.json    選択画面の章とステージ（battle で戦闘データへつなぐ）
 *   data/story.json       章とステージの物語。足すときは chapters と stages に書く
 *   data/setup.json       最初に選ばれているステージとパーティ
 *   data/wallet.json      選択画面の所持通貨
 *   data/flow.json        画面の名前と、まだ中身がない画面の枠
 *   data/hub.json         戦闘と編成以外の画面。画像パスと、お知らせ・商品・メニュー
 *   data/gacha.json       召喚。期間、ラインナップ、レアリティ。足すときは banners に書く
 * ページを開くと、flow.json の start の画面が開く。
 * 画面を足すときは flow.json の screens に枠を書き、同じ名前の関数を screens に足す。
 * スクリプトは画面ごと。
 *   js/shared.js    共通の状態、画面の切り替え、データの読み込み
 *   js/battle.js    戦闘
 *   js/select.js    編成
 *   js/hub.js       拠点画面の共通部品
 *   js/title.js     タイトル
 *   js/login.js     ログインとお知らせ
 *   js/home.js      ホーム
 *   js/story.js     物語
 *   js/character.js キャラ詳細
 *   js/gacha.js     ガチャ
 *   js/shop.js      ショップ
 *   js/extra.js     ミッション、図鑑、フレンド、設定
 *   js/boot.js      読み込みの開始
 * 体力や攻撃などは stats の数値で決まり、その編成の戦闘へ渡る。
 * 項目を足すときは stats.json に名前を足し、キャラと敵の stats に数値を書く。
 * スキルは type で効果に紐づき、stat と rate でステータスを参照する。
 * rate は 1.5 のような数値か、"5/6" のような分数。power を書くと、その固定値も足される。
 * 効果の追加は battle.js の effects に関数を足す。
 * 見た目はスキルの fx。shot 細い弾、thick 太い軌跡、rain 上からの雨、pillar 縦の柱、fan 扇、arc 落ちる弧、bloom 着弾の輪、heal 回復の光。
 * 省略すると、単体は shot、全体は rain、必殺は pillar、回復は heal。パターンを足すときは battle.js の FX に関数を足す。
 * setup.json に wave と time を書くと、場所の値より優先される。
 * 画像は assets/ に置くと、同名パスのスロットへ自動で入る。
 * 見た目の名前は image。無いときは id。
 *   assets/portraits/<名前>.png  編成カードと戦闘カード（天照なら amaterasu）
 *   assets/sprites/<名前>.png    戦場の立ち絵と選択画面の敵（骨兵は bone、ボスは boss-1 など）
 * 背景は各画面のいちばん後ろ。画像を置くと、その層いっぱいに入る。
 *   assets/backgrounds/chapter-1.png  第1章の戦闘。章ごとに stages.json の background
 *   assets/select/bg.png              編成
 *   assets/hub/home/bg.png            拠点。画面ごとのパスは hub.json の background
 */
var SPEEDS = [2, 3];

var ALLY_COOLDOWN = 2.2;

var ENEMY_INTERVAL = 1.45;

var AUTO_INTERVAL = 0.48;

var SKILL_TYPES = {
  single: { label: "単", name: "単体攻撃" },
  aoe: { label: "全", name: "全体攻撃" },
  heal: { label: "回", name: "回復" },
};

var RELIC_BY_TYPE = { single: 8, aoe: 12, heal: 6 };

var CURRENCIES = [
  { id: "stellar", mark: "★", value: 0 },
  { id: "azure", mark: "◆", value: 0 },
  { id: "coin", mark: "●", value: 0 },
];

var battle = null;

var elements = {};

var actors = new Map();

var cards = new Map();

var fight = {
  paused: false,
  auto: true,
  speed: 1,
  result: null,
  targetId: "boss",
  relic: 0,
  clock: 0,
  enemyCd: ENEMY_INTERVAL,
  autoCd: AUTO_INTERVAL,
  allyCd: new Map(),
  specialHits: new Map(),
  ui: {},
  live: false,
};

var SELECT_PARTY = 5;

var catalog = { characters: null, stages: null, chapters: null, story: null, wallet: null, rules: null, growth: null, flow: null, hub: null, setup: null, draft: null };

var screens = {};

function elementInfo(id) {
  return elements[id] || { name: id || "?", color: "#f6efe2" };
}

function paintElement(node, elementId) {
  const info = elements[elementId];
  if (!info) return;
  node.style.setProperty("--accent", info.color);
  node.dataset.element = elementId;
}

function isBoss(unit) {
  return !!(unit?.boss || unit?.id === "boss");
}

function look(unit) {
  return unit?.image || unit?.id;
}

function rules() {
  return catalog.rules || {};
}

function slot(path, labelText) {
  const paths = (Array.isArray(path) ? path : [path]).filter(Boolean);
  const root = document.createElement("div");
  root.className = "slot";
  root.title = paths[0] || "";

  const img = document.createElement("img");
  img.alt = "";
  img.draggable = false;
  let index = 0;
  img.src = paths[0] || "";

  const label = document.createElement("span");
  label.className = "slot-label";
  label.textContent = labelText ?? (paths[0] || "").split("/").pop().replace(/\.png$/, "");

  const markFilled = () => {
    if (img.naturalWidth > 0) root.classList.add("is-filled");
  };
  img.addEventListener("load", markFilled);
  img.addEventListener("error", () => {
    index += 1;
    if (paths[index]) {
      img.src = paths[index];
      root.title = paths[index];
      return;
    }
    img.remove();
  });

  root.append(img, label);
  queueMicrotask(markFilled);
  return root;
}

function withPlate(node, path) {
  const plate = slot(path, "");
  plate.classList.add("hub-plate");
  node.classList.add("has-plate");
  node.prepend(plate);
  return node;
}

function backdrop(path) {
  const layer = slot(path, "");
  layer.classList.add("backdrop");
  return layer;
}

function hpPercent(current, max) {
  if (!max) return 0;
  return Math.max(0, Math.min(100, (current / max) * 100));
}

function formatHp(value) {
  return Math.ceil(value).toLocaleString("ja-JP");
}

function formatClock(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(total / 60);
  const remain = total % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remain).padStart(2, "0")}`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function growthRules() {
  return catalog.growth || {};
}

function xpNeed(level) {
  const xp = growthRules().xp || {};
  const flat = Number(xp.flat ?? 0);
  const step = Number(xp.step ?? 0);
  const base = Number(xp.base ?? 0);
  const power = Number(xp.power ?? 1);
  return Math.max(1, Math.round(flat + step * level + base * Math.pow(Math.max(1, level), power)));
}

function xpProgress(character) {
  const level = Number(character?.level ?? 1);
  const max = Number(growthRules().maxLevel ?? 99);
  const xp = Number(character?.xp ?? 0);
  const maxed = level >= max;
  return { level, xp, need: maxed ? 0 : xpNeed(level), maxed };
}

function unitPower(character) {
  if (character?.power != null) return Number(character.power);
  return Number(character?.start?.hp ?? character?.stats?.hp ?? 0);
}

function ensureDraft() {
  if (catalog.draft) return catalog.draft;
  const setup = catalog.setup || {};
  const source = setup.parties?.length ? setup.parties : [setup.party || []];
  const parties = source.map((party) => (
    (party || []).filter((id) => catalog.characters?.[id]).slice(0, SELECT_PARTY)
  ));
  while (parties.length < SELECT_PARTY) parties.push([]);
  catalog.draft = {
    modeId: setup.modeId || catalog.chapters?.modes?.find((mode) => !mode.locked)?.id || "",
    chapterId: setup.chapterId || "",
    stageId: setup.stageId || "",
    partyIndex: setup.partyIndex || 0,
    slot: 0,
    parties,
  };
  const pin = findPin(catalog.draft.stageId);
  if (pin) {
    catalog.draft.chapterId = pin.chapter.id;
    catalog.draft.modeId = pin.chapter.mode || catalog.draft.modeId;
  }
  return catalog.draft;
}

function findPin(id) {
  for (const chapter of catalog.chapters?.chapters || []) {
    const stage = (chapter.stages || []).find((item) => item.id === id);
    if (stage) return { chapter, stage };
  }
  for (const chapter of catalog.chapters?.chapters || []) {
    const stage = (chapter.stages || []).find((item) => item.battle === id);
    if (stage) return { chapter, stage };
  }
  return null;
}

function visibleChapters(draft) {
  return (catalog.chapters?.chapters || []).filter((chapter) => !draft.modeId || chapter.mode === draft.modeId);
}

function syncSelection(draft) {
  const chapters = visibleChapters(draft);
  if (!chapters.some((chapter) => chapter.id === draft.chapterId)) {
    draft.chapterId = chapters[0]?.id || "";
  }
  const chapter = chapters.find((item) => item.id === draft.chapterId);
  const stages = chapter?.stages || [];
  if (!stages.some((stage) => stage.id === draft.stageId)) {
    draft.stageId = stages.find((stage) => !stage.locked)?.id || stages[0]?.id || "";
  }
}

function battleSetup() {
  const draft = ensureDraft();
  const pin = findPin(draft.stageId);
  const party = (draft.parties[draft.partyIndex] || []).filter((id) => catalog.characters[id]);
  return {
    stageId: pin?.stage.battle || draft.stageId,
    rewardStage: pin?.stage || null,
    party,
    wave: catalog.setup?.wave,
    time: catalog.setup?.time,
  };
}

function storyLines(raw) {
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  return list.map((line) => {
    if (typeof line === "string") return { who: "", text: line };
    return { who: line?.who || line?.speaker || "", text: line?.text || "" };
  }).filter((line) => line.text);
}

function openScreen(name) {
  fight.live = false;
  tick.last = 0;
  const stage = document.getElementById("stage");
  stage.dataset.screen = name;
  const render = screens[name];
  if (render) {
    render(stage);
    return;
  }
  const spec = catalog.flow?.screens?.[name];
  if (!spec) throw new Error(`未登録の画面です: ${name}`);
  stage.replaceChildren(renderShell(name, spec));
}

function renderShell(name, spec) {
  const view = el("section", `shell shell-${name}`);
  const background = backdrop(spec.background || `assets/screens/${name}.png`);
  background.classList.add("shell-bg");

  const body = el("div", "shell-body");
  if (spec.kicker) body.append(el("p", "shell-kicker", spec.kicker));
  body.append(el("h1", "shell-title", spec.title || name));
  if (spec.subtitle) body.append(el("p", "shell-subtitle", spec.subtitle));

  const regions = el("div", "shell-regions");
  (spec.regions || []).forEach((label) => {
    regions.append(el("div", "shell-region", label));
  });
  if (spec.regions?.length) body.append(regions);

  const actions = el("div", "shell-actions");
  (spec.actions || []).forEach((action) => {
    const button = el("button", "shell-action", action.label);
    button.type = "button";
    button.addEventListener("click", () => openScreen(action.screen));
    actions.append(button);
  });
  body.append(actions);
  view.append(background, body);
  return view;
}

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(path);
  return response.json();
}

async function main() {
  const stage = document.getElementById("stage");
  try {
    const [characters, stages, chapters, story, setup, elementTable, statRules, growth, flow, wallet, hub, gacha] = await Promise.all([
      loadJson("data/characters.json"),
      loadJson("data/stages.json"),
      loadJson("data/chapters.json"),
      loadJson("data/story.json"),
      loadJson("data/setup.json"),
      loadJson("data/elements.json"),
      loadJson("data/stats.json"),
      loadJson("data/growth.json"),
      loadJson("data/flow.json"),
      loadJson("data/wallet.json"),
      loadJson("data/hub.json"),
      loadJson("data/gacha.json"),
    ]);
    elements = elementTable;
    catalog.characters = characters;
    catalog.stages = stages;
    catalog.chapters = chapters;
    catalog.story = story;
    catalog.rules = statRules;
    catalog.growth = growth;
    catalog.flow = flow;
    catalog.wallet = wallet;
    catalog.hub = hub;
    catalog.gacha = gacha;
    catalog.setup = setup;
    openScreen(flow.start || "battle");
  } catch (error) {
    stage.replaceChildren(el("p", "load-error", "戦闘データを読めませんでした。index.html と同じ場所からページを開いてください。"));
    console.error(error);
  }
}

