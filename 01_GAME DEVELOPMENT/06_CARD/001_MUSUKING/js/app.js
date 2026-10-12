const SAVE_KEY = "musuking-save";
const GACHA_COST = 100;
const SELECT_SEC = 10;

function defaultSave() {
  return {
    record: { wins: 0, losses: 0, draws: 0, streak: 0, best: 0 },
    jewels: 500,
    owned: {
      hikari: { level: 1, exp: 0 },
      natsu: { level: 1, exp: 0 },
      shizuku: { level: 1, exp: 0 },
    },
    items: { crystal: 0 },
    lastId: "hikari",
    team: ["hikari", "natsu", "shizuku"],
    pity: { sr: 0, ur: 0 },
  };
}

function normalizeTeam(team, owned, lastId) {
  const ids = [];
  const push = (id) => {
    if (id && owned[id] && !ids.includes(id)) ids.push(id);
  };
  (Array.isArray(team) ? team : []).forEach(push);
  push(lastId);
  Object.keys(owned).forEach(push);
  while (ids.length < 3) ids.push(null);
  return ids.slice(0, 3);
}

function fillFreshParty(save) {
  const record = save.record || {};
  const owned = save.owned || {};
  const hikari = owned.hikari;
  const untouched = !record.wins && !record.losses && !record.draws && save.jewels === 500;
  if (untouched && hikari && hikari.level === 1 && !hikari.exp && Object.keys(owned).length < 3) {
    if (!owned.natsu) owned.natsu = { level: 1, exp: 0 };
    if (!owned.shizuku) owned.shizuku = { level: 1, exp: 0 };
    save.filledParty = true;
  }
  save.team = normalizeTeam(save.team, owned, save.lastId);
  return save;
}

function loadGame() {
  const fresh = defaultSave();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (saved && saved.owned) {
      fresh.record = { ...fresh.record, ...(saved.record || {}) };
      fresh.jewels = Number.isFinite(saved.jewels) ? saved.jewels : fresh.jewels;
      fresh.owned = saved.owned;
      fresh.items = { crystal: (saved.items && saved.items.crystal) || 0 };
      if (saved.pity) {
        fresh.pity.sr = Number.isFinite(saved.pity.sr) ? saved.pity.sr : 0;
        fresh.pity.ur = Number.isFinite(saved.pity.ur) ? saved.pity.ur : 0;
      }
      if (saved.lastId && fresh.owned[saved.lastId]) fresh.lastId = saved.lastId;
      if (Array.isArray(saved.team)) fresh.team = saved.team;
      return fillFreshParty(fresh);
    }
  } catch (e) {
    /* 新規 */
  }
  try {
    const old = JSON.parse(localStorage.getItem("musuking-record") || "null");
    if (old) {
      fresh.record.wins = old.wins || 0;
      fresh.record.losses = old.losses || 0;
      fresh.record.draws = old.draws || 0;
      fresh.record.streak = old.streak || 0;
      fresh.record.best = old.best || 0;
    }
  } catch (e) {
    /* 無視 */
  }
  return fillFreshParty(fresh);
}

const loaded = loadGame();

const state = {
  screen: "title",
  playerId: loaded.lastId,
  enemyId: null,
  playerLevel: 1,
  enemyLevel: 1,
  playerHp: 0,
  enemyHp: 0,
  playerMax: 1,
  enemyMax: 1,
  gauge: 0,
  inputLocked: true,
  introSkipped: false,
  finished: false,
  detailId: null,
  gachaBusy: false,
  gachaResult: null,
  lastReward: null,
  record: loaded.record,
  jewels: loaded.jewels,
  owned: loaded.owned,
  items: loaded.items,
  pity: loaded.pity,
  battle: null,
  payPick: null,
  gachaLine: "all",
  auto: false,
  team: loaded.team,
  side: null,
  learnQueue: [],
  enemyRoster: null,
  resultKind: null,
};

if (loaded.filledParty) saveGame();

const screenEl = () => document.getElementById("screen");

function saveGame() {
  try {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        record: state.record,
        jewels: state.jewels,
        owned: state.owned,
        items: state.items,
        pity: state.pity,
        lastId: state.playerId,
        team: state.team,
      })
    );
  } catch (e) {
    /* 無視 */
  }
}

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function ownedCharacters() {
  return MUSU.characters.filter((ch) => state.owned[ch.id]);
}

function ownedLevel(id) {
  return state.owned[id] ? state.owned[id].level : 1;
}

function ensurePlayer() {
  if (!state.owned[state.playerId]) {
    const first = ownedCharacters()[0];
    state.playerId = first ? first.id : "hikari";
  }
}

function addExp(id, amount) {
  const rec = state.owned[id];
  if (!rec || amount <= 0) return { levels: 0, level: rec ? rec.level : 1, from: rec ? rec.level : 1, capped: false };
  if (rec.level >= MUSU.maxLevel) return { levels: 0, level: rec.level, from: rec.level, capped: true };
  const from = rec.level;
  rec.exp += amount;
  let levels = 0;
  while (rec.level < MUSU.maxLevel && rec.exp >= MUSU.expNeed(rec.level)) {
    rec.exp -= MUSU.expNeed(rec.level);
    rec.level += 1;
    levels += 1;
  }
  if (rec.level >= MUSU.maxLevel) rec.exp = 0;
  return { levels, level: rec.level, from, capped: false };
}

function signHtml(signId) {
  const sign = MUSU.signs[signId];
  if (signId === "moon") {
    return `<span class="sign sign-moon"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M16.2 2.4A9.2 9.2 0 1 0 22.2 16 7.6 7.6 0 1 1 16.2 2.4z"/></svg><span class="sr-only">☾</span></span>`;
  }
  return `<span class="sign sign-${signId}">${sign.mark}</span>`;
}

function expLine(id) {
  const rec = state.owned[id];
  if (!rec) return "";
  const maxed = rec.level >= MUSU.maxLevel;
  const need = maxed ? 1 : MUSU.expNeed(rec.level);
  const pct = maxed ? 100 : Math.max(0, Math.min(100, (rec.exp / need) * 100));
  const text = maxed ? "最大" : `${rec.exp} / ${need}`;
  return `<div class="exp-line" id="player-exp">
    <span class="exp-name">経験値</span>
    <span class="exp-track"><span class="exp-bar" style="width:${pct}%"></span></span>
    <span class="exp-num">${text}</span>
  </div>`;
}

function elementOf(id) {
  return MUSU.elements[id];
}

function traitText(ch) {
  const trait = MUSU.trait(ch.id);
  return `${ch.blurb}　特性「${trait.name}」　${trait.line}`;
}

function blankAilment() {
  return { burn: 0, shock: 0, frost: 0, seal: 0, guard: 0, weak: 0 };
}

function freshBattle() {
  state.battle = {
    turn: 1,
    ailment: { player: blankAilment(), enemy: blankAilment() },
    streak: { player: 0, enemy: 0 },
    endure: { player: true, enemy: true },
    signLog: [],
  };
}

function counterSign(sign) {
  return MUSU.signOrder.find((id) => MUSU.signs[id].beats === sign);
}

function ailmentBits(side) {
  const ailment = state.battle && state.battle.ailment[side];
  if (!ailment) return "";
  const bits = [];
  if (ailment.burn) bits.push("やけど");
  if (ailment.shock) bits.push("痺れ");
  if (ailment.frost) bits.push("霜");
  if (ailment.seal) bits.push("回復封じ");
  if (ailment.guard) bits.push("防御");
  if (ailment.weak) bits.push("弱体");
  return bits.join("・");
}

function ailmentChips(side) {
  const ailment = state.battle && state.battle.ailment[side];
  if (!ailment) return "";
  const bits = [];
  if (ailment.burn) bits.push(`やけど ${ailment.burn}`);
  if (ailment.shock) bits.push(`痺れ ${ailment.shock}`);
  if (ailment.frost) bits.push(`霜 ${ailment.frost}`);
  if (ailment.seal) bits.push(`回復封じ ${ailment.seal}`);
  if (ailment.guard) bits.push("防御");
  if (ailment.weak) bits.push("弱体");
  return bits.map((name) => `<i class="chip">${name}</i>`).join("");
}

function paintAilments() {
  const player = document.getElementById("player-ailments");
  const enemy = document.getElementById("enemy-ailments");
  if (player) player.innerHTML = ailmentChips("player");
  if (enemy) enemy.innerHTML = ailmentChips("enemy");
}

function moveLevels(id) {
  const rec = state.owned[id];
  const blank = { star: 1, heart: 1, moon: 1 };
  if (!rec) return { ...blank };
  if (!rec.moves || typeof rec.moves !== "object") rec.moves = { ...blank };
  const ch = MUSU.byId(id);
  MUSU.signOrder.forEach((sign) => {
    const lv = Number(rec.moves[sign]) || 1;
    const known = MUSU.learnable(ch).some((skill) => skill.sign === sign && skill.lv === lv && skill.lv <= rec.level);
    rec.moves[sign] = known ? lv : 1;
  });
  return rec.moves;
}

function movesLearned(id, from, to) {
  if (!id || to <= from) return [];
  return MUSU.learnable(MUSU.byId(id)).filter((skill) => skill.lv > 1 && skill.lv > from && skill.lv <= to);
}

function equippedList(ch, level, side) {
  const known = MUSU.learnable(ch).filter((skill) => skill.lv <= level);
  if (side === "enemy") {
    return MUSU.signOrder.map((sign) => {
      const options = known.filter((skill) => skill.sign === sign);
      return options.sort((a, b) => b.power - a.power)[0];
    });
  }
  const picked = ch.id && state.owned[ch.id] ? moveLevels(ch.id) : { star: 1, heart: 1, moon: 1 };
  return MUSU.signOrder.map((sign) => known.find((skill) => skill.sign === sign && skill.lv === picked[sign]) || known.find((skill) => skill.sign === sign));
}

function orderedSkills(ch, side) {
  const useEnemy = side === "enemy";
  const level = useEnemy ? state.enemyLevel : ownedLevel(ch.id);
  return equippedList(ch, level || 1, useEnemy ? "enemy" : "player");
}

function readyTeam() {
  return (state.team || []).filter((id) => id && state.owned[id]).slice(0, 3);
}

function teamSlotsHtml() {
  return `<div class="team-row">${[0, 1, 2]
    .map((index) => {
      const id = state.team[index];
      const ch = id && MUSU.byId(id);
      const on = id && id === state.playerId ? " is-on" : "";
      const label = index === 0 ? "リーダー" : String(index + 1);
      return `<button type="button" class="team-slot${on}" data-action="team-slot" data-index="${index}">${label} ${ch ? ch.name : "空"}</button>`;
    })
    .join("")}</div>`;
}

function leaderBox(ch) {
  const lead = MUSU.leader(ch.id);
  const combo = MUSU.combo(ch.id);
  const headId = state.team && state.team[0];
  const head = headId && MUSU.byId(headId);
  const active = head ? MUSU.leader(head.id) : null;
  const now = active
    ? `<p class="key-hint">今のリーダー　${head.name}　${active.name}　${active.line}</p>`
    : "";
  return `<div class="lead-box">
    <p class="key-hint">リーダースキル　${lead.name}　${lead.line}　合体　${MUSU.signs[combo.sign].mark} ${combo.name}　威力 ${combo.power}</p>
    ${now}
  </div>`;
}

function moveBox(ch, stage) {
  const rec = state.owned[ch.id];
  if (!rec) return "";
  const learned = MUSU.learnable(ch).filter((skill) => skill.lv <= rec.level);
  const equipped = moveLevels(ch.id);
  const lines = MUSU.signOrder
    .map((sign) => {
      const options = learned.filter((skill) => skill.sign === sign);
      if (options.length < 2) return "";
      return `<div class="move-line">${options
        .map((skill) => {
          const on = equipped[sign] === skill.lv;
          return `<button type="button" class="move-pick${on ? " is-on" : ""}" data-action="equip" data-id="${ch.id}" data-sign="${sign}" data-lv="${skill.lv}">${MUSU.signs[sign].mark} ${skill.name}${fxName(skill)} ${shownPower(skill, stage)}</button>`;
        })
        .join("")}</div>`;
    })
    .join("");
  if (!lines) return `<p class="key-hint">Lv 8、12、16で強い技を覚える。覚えたら入れ替えられる。</p>`;
  return `<div class="move-box"><p class="key-hint">覚えている技。押すと入れ替わる。</p>${lines}</div>`;
}

function signResult(attackSign, defendSign) {
  if (attackSign === defendSign) return "tie";
  return MUSU.signs[attackSign].beats === defendSign ? "win" : "lose";
}

function effectLabel(mult) {
  if (mult >= 2) return "抜群";
  if (mult <= 0.5) return "半減";
  return "普通";
}

function evoStage(id, level, side) {
  if (side === "enemy") {
    if (level >= 16) return 2;
    if (level >= 8) return 1;
    return 0;
  }
  const rec = id && state.owned[id];
  return rec && rec.evo ? rec.evo : 0;
}

function evoName(stage) {
  if (stage >= 2) return "最終進化";
  if (stage === 1) return "進化";
  return "";
}

function nextEvo(rec) {
  const stage = rec && rec.evo ? rec.evo : 0;
  if (stage >= 2) return null;
  return { stage: stage + 1, need: stage === 0 ? 8 : 16 };
}

function battleStats(ch, level, stage) {
  const base = MUSU.stats(ch, level);
  const mul = 1 + (stage || 0) * 0.16;
  return {
    hp: Math.round(base.hp * mul),
    atk: Math.round(base.atk * mul),
    mag: Math.round(base.mag * mul),
  };
}

function shownPower(skill, stage) {
  return skill.power + (stage || 0) * 6;
}

function fxName(skill) {
  const fx = skill && skill.fx && MUSU.fx[skill.fx];
  return fx ? ` ${fx.name}` : "";
}

function fxScore(skill, hp, max) {
  if (!skill || !skill.fx || !max) return 1;
  const ratio = Math.max(0, hp) / max;
  if (skill.fx === "heal") return 1 + (1 - ratio) * 1.15;
  if (skill.fx === "guard") return ratio < 0.5 ? 1.28 : 1.06;
  if (skill.fx === "seal") return 1.12;
  if (skill.fx === "weak") return 1.08;
  return 1;
}

function coverHits(dealtEnemy, dealtPlayer, notes) {
  const ailment = state.battle.ailment;
  if (ailment.player.guard && dealtPlayer > 0) {
    dealtPlayer = Math.round(dealtPlayer * MUSU.fx.guard.rate);
    ailment.player.guard = 0;
    notes.push("防御");
  }
  if (ailment.enemy.guard && dealtEnemy > 0) {
    dealtEnemy = Math.round(dealtEnemy * MUSU.fx.guard.rate);
    ailment.enemy.guard = 0;
    notes.push("防御");
  }
  if (ailment.player.weak) {
    if (dealtEnemy > 0) dealtEnemy = Math.round(dealtEnemy * MUSU.fx.weak.rate);
    ailment.player.weak = 0;
    notes.push("弱体");
  }
  if (ailment.enemy.weak) {
    if (dealtPlayer > 0) dealtPlayer = Math.round(dealtPlayer * MUSU.fx.weak.rate);
    ailment.enemy.weak = 0;
    notes.push("弱体");
  }
  return { dealtEnemy, dealtPlayer };
}

function stampSkillFx(skill, side, other, connected, notes) {
  if (!connected || !skill || !skill.fx || skill.fx === "heal") return;
  const fx = MUSU.fx[skill.fx];
  if (!fx) return;
  if (skill.fx === "seal") {
    state.battle.ailment[other].seal = fx.turns;
    notes.push("回復封じ");
  } else if (skill.fx === "guard") {
    state.battle.ailment[side].guard = 1;
    notes.push("防御");
  } else if (skill.fx === "weak") {
    state.battle.ailment[other].weak = 1;
    notes.push("弱体");
  }
}

function healFromSkill(skill, side, connected, notes) {
  if (!connected || !skill || skill.fx !== "heal") return 0;
  if (state.battle.ailment[side].seal > 0) {
    if (!notes.includes("回復封じ")) notes.push("回復封じ");
    return 0;
  }
  const max = side === "player" ? state.playerMax : state.enemyMax;
  notes.push("回復");
  return Math.max(1, Math.round(max * MUSU.fx.heal.rate));
}

function blockedHeal(side, amount, notes, label) {
  if (amount <= 0) return 0;
  if (state.battle.ailment[side].seal > 0) {
    if (!notes.includes("回復封じ")) notes.push("回復封じ");
    return 0;
  }
  notes.push(label);
  return amount;
}

function tickSeal() {
  ["player", "enemy"].forEach((side) => {
    const ailment = state.battle.ailment[side];
    if (ailment.seal > 0) ailment.seal -= 1;
  });
}

function evoButton(id) {
  const rec = state.owned[id];
  if (!rec) return "";
  const next = nextEvo(rec);
  if (!next) return `<p class="key-hint">最終進化</p>`;
  const ready = rec.level >= next.need;
  const label = next.stage === 2 ? "最終進化" : "進化";
  return `<button type="button" class="btn btn-sub" data-action="evolve" data-id="${id}" ${ready ? "" : "disabled"}>${label}（Lv ${next.need}）</button>`;
}

function quoteHit(attacker, skill, defender, level, superMul, side) {
  const trait = MUSU.trait(attacker.id);
  const ailment = state.battle.ailment[side];
  const shocked = ailment.shock > 0 && Math.random() < 0.5;
  const frosted = ailment.frost > 0;
  if (ailment.shock > 0) ailment.shock -= 1;
  if (ailment.frost > 0) ailment.frost -= 1;
  let effect = MUSU.effect(skill.element, defender.element);
  if (trait.snare && effect >= 2) effect += trait.snare;
  const stab = skill.element === attacker.element ? 1.5 + (trait.stab || 0) : 1;
  const stage = evoStage(attacker.id, level, side);
  const stats = battleStats(attacker, level, stage);
  const stat = skill.category === "magic" ? stats.mag : stats.atk;
  let dmg = shownPower(skill, stage) * (stat / 50) * stab * effect * superMul;
  if (trait.elem && trait.elem[skill.element]) dmg *= trait.elem[skill.element];
  if (trait.sign && trait.sign[skill.sign]) dmg *= trait.sign[skill.sign];
  const leadId = state.side && state.side[side] && state.side[side][0] && state.side[side][0].id;
  const lead = leadId && MUSU.leader(leadId);
  if (lead) {
    if (lead.all) dmg *= lead.all;
    if (lead.elem && lead.elem[skill.element]) dmg *= lead.elem[skill.element];
    if (lead.sign && lead.sign[skill.sign]) dmg *= lead.sign[skill.sign];
  }
  if (frosted) dmg *= 0.72;
  if (state.battle.turn === 1 && trait.first) dmg *= trait.first;
  const streak = state.battle.streak[side];
  if (trait.streak && streak > 0) dmg *= trait.streak[Math.min(streak, trait.streak.length) - 1];
  let crit = false;
  if (Math.random() < (trait.crit || 0.07)) {
    crit = true;
    dmg *= trait.critMul || 1.55;
  }
  dmg *= 0.94 + Math.random() * 0.12;
  if (shocked) dmg = 0;
  return { dmg: Math.max(shocked ? 0 : 1, Math.round(dmg)), effect, crit, shocked, trait };
}

function stampAilment(trait, skill, ailment) {
  const notes = [];
  if (!trait) return notes;
  if (trait.burn && skill.element === "fire" && Math.random() < trait.burn) {
    ailment.burn = 2;
    notes.push("やけど");
  }
  if (trait.shock && skill.element === "thunder" && Math.random() < trait.shock) {
    ailment.shock = 2;
    notes.push("痺れ");
  }
  if (trait.frost && skill.element === "ice" && Math.random() < trait.frost) {
    ailment.frost = 2;
    notes.push("霜");
  }
  return notes;
}

function burnTick(side, maxHp) {
  const ailment = state.battle.ailment[side];
  if (!ailment.burn) return 0;
  ailment.burn -= 1;
  return Math.max(1, Math.round(maxHp / 14));
}

function holdOn(side, hp) {
  const id = side === "player" ? state.playerId : state.enemyId;
  const trait = MUSU.trait(id);
  if (hp > 0 || !trait.endure || !state.battle.endure[side]) return { hp: Math.max(0, hp), endured: false };
  state.battle.endure[side] = false;
  return { hp: 1, endured: true };
}

function cardMarkup(ch, options = {}) {
  const tag = options.tag || "div";
  const owned = state.owned[ch.id];
  const locked = !options.bright && options.level == null && !owned;
  const levelText = options.level != null ? `Lv ${options.level}` : owned ? `Lv ${owned.level}` : "未所持";
  const stage = options.evo != null ? options.evo : owned && owned.evo ? owned.evo : 0;
  const el = elementOf(ch.element);
  const className = `${options.className || ""} ${locked ? "is-locked" : ""} evo-${stage}`.trim();
  const attrs = options.attrs || "";
  const evoBadge = stage > 0 ? `<span class="badge-evo">${stage >= 2 ? "最終" : "進化"}</span>` : "";
  return `<${tag} class="tcard rarity-${ch.rarity.toLowerCase()} ${className}" data-id="${ch.id}" data-evo="${stage}" ${attrs}>
    <span class="tcard-frame">
      <span class="tcard-top">
        <span class="badge-rarity">${ch.rarity}</span>
        ${evoBadge}
        <span class="badge-el el-${ch.element}">${el.name}</span>
      </span>
      <span class="tcard-art"><img alt="${ch.name}" draggable="false" /></span>
      <span class="tcard-plate">
        <p class="tcard-name">${ch.name}</p>
        <p class="tcard-title">${ch.title}</p>
        <p class="tcard-lv">${levelText}</p>
      </span>
    </span>
  </${tag}>`;
}

function backCardMarkup() {
  return `<div class="tcard is-back" data-back="1"><div class="tcard-frame"><div class="back-mark">?</div></div></div>`;
}

function bindPortrait(img, ch, stage) {
  const evolved = stage || 0;
  img.alt = ch.name;
  img.src = MUSU.portrait(ch, evolved);
  const custom = safeGet(evolved ? `musuking-img-${ch.id}-${evolved}` : `musuking-img-${ch.id}`);
  if (custom) {
    img.src = custom;
    return;
  }
  const file = evolved >= 2 ? `cards/${ch.id}-final.png` : evolved === 1 ? `cards/${ch.id}-evo.png` : `cards/${ch.id}.png`;
  const probe = new Image();
  probe.onload = () => {
    img.src = probe.src;
  };
  probe.src = file;
}

function hydratePortraits(root) {
  root.querySelectorAll(".tcard[data-id]").forEach((el) => {
    const ch = MUSU.byId(el.dataset.id);
    const img = el.querySelector("img");
    if (ch && img) bindPortrait(img, ch, Number(el.dataset.evo || 0));
  });
}

function skillRow(skill, stage) {
  const el = elementOf(skill.element);
  const cat = MUSU.categories[skill.category];
  return `<li class="el-${skill.element}">
    ${signHtml(skill.sign)}
    <span class="mark">${el.name}</span>
    <span class="s-name">${skill.name}</span>
    <span class="s-cat">${cat.name}</span>
    ${skill.fx && MUSU.fx[skill.fx] ? `<span class="s-fx">${MUSU.fx[skill.fx].name}</span>` : ""}
    <span class="s-pow">${shownPower(skill, stage)}</span>
  </li>`;
}

function updateChrome() {
  const r = state.record;
  document.getElementById("record-label").innerHTML =
    `<span>勝利 ${r.wins}</span><span>敗北 ${r.losses}</span><span>引き分け ${r.draws}</span><span>連勝 ${r.streak}</span><span class="rec-jewel">${jewelArt(16)}宝石 ${state.jewels}</span>`;
  const mute = document.getElementById("mute");
  mute.textContent = SFX.muted ? "♪ Off" : "♪ On";
  mute.setAttribute("aria-pressed", String(SFX.muted));
}

function toast(text) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    screenEl().appendChild(el);
  }
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove("show"), 1800);
}

function showTitle() {
  stopSelectTimer();
  state.screen = "title";
  screenEl().innerHTML = `
    <div class="view view-title">
      <p class="kicker">美少女カードバトル</p>
      <div class="logo-wrap">
        <span class="spark a"></span>
        <span class="spark b"></span>
        <span class="spark c"></span>
        <h1 class="logo">むすキング</h1>
      </div>
      <p class="tagline">カードを掲げて、勝負！</p>
      <div class="title-actions">
        <button type="button" class="btn btn-main" data-action="select">対戦開始</button>
        <button type="button" class="btn btn-sub" data-action="gacha">ガチャ</button>
        <button type="button" class="btn btn-ghost" data-action="zukan">図鑑</button>
        <button type="button" class="btn btn-ghost" data-action="help">遊び方</button>
      </div>
    </div>`;
}

function showHelp() {
  state.screen = "help";
  screenEl().innerHTML = `
    <div class="view">
      <div class="view-head">
        <button type="button" class="back" data-action="title">← 戻る</button>
        <h2>遊び方</h2>
      </div>
      <div class="cycle">
        ${["star", "heart", "moon"].map((id) => signHtml(id)).join("")}
        <span class="el-fire">炎</span>
        <span class="el-water">水</span>
        <span class="el-grass">草</span>
        <span class="el-thunder">雷</span>
        <span class="el-ice">氷</span>
      </div>
      <ul class="help-list">
        <li>★ ♡ ☾ から技を1つ選ぶ。♡は★、★は☾、☾は♡に強い。</li>
        <li>勝った側だけダメージ。同じときは、両方に入る。</li>
        <li>炎は草と氷に強く水に弱い。水は炎に強く草に弱い。草は水に強く炎に弱い。雷は水に強い。氷は草に強く、炎と水に弱い。</li>
        <li>攻撃は攻撃の値、魔法は魔法の値。同じ属性の技は1.5倍。</li>
        <li>選ぶ時間は10秒。奥義が3つ貯まると必殺。AUTOを押すと技を自動で選び、もう一度押すと自分で選べる。</li>
        <li>勝利で経験値と宝石。ガチャは通常と属性のラインから引く。同じ仲間はレベルが1つ上がる。</li>
        <li>特性はカードごとに違う。会心や状態異常もある。SRは10回、URは40回で必ず出る。</li>
        <li>3対3で、倒れたら次の仲間が出る。チームはカード選択の3枠。</li>
        <li>Lv 8、12、16で強い技を覚える。カード画面で入れ替えられる。Lv 8で進化、Lv 16で最終進化。レベルは99まで。</li>
        <li>1枠がリーダー。リーダースキルは味方全員にかかる。奥義が3つで、仲間が残っていると合体技。</li>
        <li>勝った技の効果が出る。回復は体力を戻し、回復封じ中は戻らない。防御は次のダメージを減らし、弱体は相手の次の技を弱くする。</li>
      </ul>
      <button type="button" class="btn btn-main" data-action="select">カードを選ぶ</button>
    </div>`;
}

function renderSelect() {
  ensurePlayer();
  const ch = MUSU.byId(state.playerId);
  const rec = state.owned[ch.id];
  const stage = rec.evo || 0;
  const stats = battleStats(ch, rec.level, stage);
  const need = rec.level >= MUSU.maxLevel ? 0 : MUSU.expNeed(rec.level);
  const expPct = need ? Math.min(100, (rec.exp / need) * 100) : 100;
  const el = elementOf(ch.element);
  state.screen = "select";
  screenEl().innerHTML = `
    <div class="view">
      <div class="view-head">
        <button type="button" class="back" data-action="title">← 戻る</button>
        <h2>カードを選ぶ</h2>
      </div>
      <div class="select-layout">
        <div class="select-stage">
          <button type="button" class="nav" data-action="cycle" data-dir="-1" aria-label="前のカード">◀</button>
          <div id="select-card">${cardMarkup(ch, { className: "enter" })}</div>
          <button type="button" class="nav" data-action="cycle" data-dir="1" aria-label="次のカード">▶</button>
        </div>
        <div>
          <p class="ch-name">${ch.name}</p>
          <p class="ch-title">${ch.title}</p>
          <div class="meta-row">
            <span class="pill">${ch.rarity}</span>
            <span class="pill">${el.name}</span>
            <span class="pill">Lv ${rec.level}</span>
            <span class="pill">HP ${stats.hp}</span>
            <span class="pill">攻撃 ${stats.atk}</span>
            <span class="pill">魔法 ${stats.mag}</span>
            <span class="pill">特性 ${MUSU.trait(ch.id).name}</span>
            ${stage ? `<span class="pill">${evoName(stage)}</span>` : ""}
          </div>
          <div class="exp-track" title="経験値"><div class="exp-bar" style="width:${expPct}%"></div></div>
          <p class="key-hint">${need ? `経験値 ${rec.exp} / ${need}` : "最大レベル"}</p>
          <p class="blurb">${traitText(ch)}</p>
          <ul class="skill-list">${orderedSkills(ch, "player").map((skill) => skillRow(skill, stage)).join("")}</ul>
          ${moveBox(ch, stage)}
          ${evoButton(ch.id)}
          ${teamSlotsHtml()}
          <button type="button" class="btn btn-main" data-action="fight" ${readyTeam().length < 3 ? "disabled" : ""}>3対3で勝負！</button>
          ${leaderBox(ch)}
          <p class="key-hint">枠を押すと、見ているカードをその位置に入れる</p>
        </div>
      </div>
      <div class="thumb-row">
        ${ownedCharacters()
          .map((item) =>
            cardMarkup(item, {
              tag: "button",
              className: item.id === ch.id ? "is-selected" : "",
              attrs: `type="button" data-action="pick"`,
            })
          )
          .join("")}
      </div>
    </div>`;
  hydratePortraits(screenEl());
}

function setPlayerId(id) {
  if (!state.owned[id]) return;
  state.playerId = id;
  saveGame();
  renderSelect();
}

function cyclePlayer(dir) {
  const list = ownedCharacters();
  if (!list.length) return;
  const index = Math.max(0, list.findIndex((ch) => ch.id === state.playerId));
  const next = (index + dir + list.length) % list.length;
  SFX.ui();
  setPlayerId(list[next].id);
}

function rollEnemyLevel(playerLevel) {
  const delta = [-1, 0, 0, 1][Math.floor(Math.random() * 4)];
  return Math.max(1, Math.min(MUSU.maxLevel, playerLevel + delta));
}

function randomEnemy(exceptId) {
  const pool = MUSU.characters.filter((ch) => ch.id !== exceptId);
  const list = pool.length ? pool : MUSU.characters;
  return list[Math.floor(Math.random() * list.length)];
}

function showZukan() {
  state.screen = "zukan";
  state.detailId = null;
  screenEl().innerHTML = `
    <div class="view">
      <div class="view-head">
        <button type="button" class="back" data-action="title">← 戻る</button>
        <h2>図鑑</h2>
      </div>
      <p class="hint">所持しているキャラクターには、経験結晶を使える。</p>
      <div class="zukan-grid">
        ${MUSU.characters
          .map((ch) =>
            cardMarkup(ch, {
              tag: "button",
              attrs: `type="button" data-action="detail"`,
            })
          )
          .join("")}
      </div>
      <div class="modal" id="modal"></div>
    </div>`;
  hydratePortraits(screenEl());
}

function openDetail(id) {
  const ch = MUSU.byId(id);
  if (!ch) return;
  state.detailId = id;
  const modal = document.getElementById("modal");
  const owned = state.owned[id];
  const level = owned ? owned.level : 1;
  const stage = owned && owned.evo ? owned.evo : 0;
  const stats = battleStats(ch, level, stage);
  const el = elementOf(ch.element);
  const need = owned && owned.level < MUSU.maxLevel ? MUSU.expNeed(owned.level) : 0;
  const expPct = !owned ? 0 : need ? Math.min(100, (owned.exp / need) * 100) : 100;
  const canUse = owned && state.items.crystal > 0 && owned.level < MUSU.maxLevel;
  modal.innerHTML = `
    <div class="modal-sheet" role="dialog" aria-modal="true" aria-label="${ch.name}">
      <div>${cardMarkup(ch)}</div>
      <div>
        <p class="ch-name">${ch.name}</p>
        <p class="ch-title">${ch.title}</p>
        <div class="meta-row">
          <span class="pill">${ch.rarity}</span>
          <span class="pill">${el.name}</span>
          <span class="pill">${owned ? `Lv ${owned.level}` : "未所持"}</span>
          <span class="pill">HP ${stats.hp}</span>
          <span class="pill">攻撃 ${stats.atk}</span>
          <span class="pill">魔法 ${stats.mag}</span>
          <span class="pill">特性 ${MUSU.trait(ch.id).name}</span>
          ${stage ? `<span class="pill">${evoName(stage)}</span>` : ""}
        </div>
        ${
          owned
            ? `<div class="exp-track"><div class="exp-bar" style="width:${expPct}%"></div></div>
               <p class="key-hint">${need ? `経験値 ${owned.exp} / ${need}` : "最大レベル"}</p>`
            : `<p class="hint">未所持。ガチャで仲間にできる。</p>`
        }
        <p class="blurb">${traitText(ch)}</p>
        ${leaderBox(ch)}
        <ul class="skill-list">${orderedSkills(ch, "player").map((skill) => skillRow(skill, stage)).join("")}</ul>
        ${owned ? moveBox(ch, stage) : ""}
        <div class="modal-actions">
          ${owned ? evoButton(ch.id) : ""}
          ${
            owned
              ? `<button type="button" class="btn btn-sub crystal-btn" data-action="use-crystal" ${canUse ? "" : "disabled"}>${crystalArt(32)}<span>経験結晶を使う（${state.items.crystal}）</span></button>`
              : ""
          }
          <button type="button" class="btn btn-ghost" data-action="close-detail">閉じる</button>
        </div>
      </div>
    </div>`;
  modal.classList.add("is-open");
  hydratePortraits(modal);
}

function closeDetail() {
  state.detailId = null;
  const modal = document.getElementById("modal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.innerHTML = "";
}

function useCrystal() {
  const id = state.detailId;
  if (!id || !state.owned[id] || state.items.crystal <= 0) return;
  if (state.owned[id].level >= MUSU.maxLevel) {
    toast("これ以上は上がらない");
    return;
  }
  state.items.crystal -= 1;
  const up = addExp(id, MUSU.items.crystal.exp);
  saveGame();
  updateChrome();
  showZukan();
  openDetail(id);
  const learned = movesLearned(id, up.from, up.level);
  const moveText = learned.length ? `　${learned.map((skill) => skill.name).join("、")}を覚えた` : "";
  toast(up.levels > 0 ? `レベルが ${up.level} になった！${moveText}` : `経験値 +${MUSU.items.crystal.exp}`);
}

const SHOP_GOODS = [
  { id: "s", name: "宝石の小瓶", kind: "jewel", jewels: 120, price: "120円" },
  { id: "m", name: "宝石の瓶", kind: "jewel", jewels: 600, price: "480円" },
  { id: "l", name: "宝石の宝箱", kind: "jewel", jewels: 1500, price: "980円" },
  { id: "xl", name: "宝石の王冠", kind: "jewel", jewels: 4000, price: "2,400円" },
  { id: "crystal1", name: "経験結晶", kind: "crystal", crystals: 1, price: "160円" },
  { id: "crystal5", name: "経験結晶×5", kind: "crystal", crystals: 5, price: "680円" },
];

let crystalSeq = 0;

function crystalArt(size) {
  crystalSeq += 1;
  const id = `crystal-grad-${crystalSeq}`;
  const px = size || 72;
  return `<svg class="crystal-art" width="${px}" height="${px}" viewBox="0 0 80 80" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="20%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="#fff8dc"/>
        <stop offset="38%" stop-color="#ff8ec8"/>
        <stop offset="100%" stop-color="#6d4dff"/>
      </linearGradient>
    </defs>
    <polygon points="40,4 70,26 58,74 22,74 10,26" fill="url(#${id})" stroke="#ffd56a" stroke-width="2.4" stroke-linejoin="round"/>
    <polygon points="40,4 54,26 40,74 26,26" fill="#fff" opacity="0.28"/>
    <polygon points="40,16 48,28 40,46 32,28" fill="#fff" opacity="0.72"/>
    <polygon points="18,30 40,26 22,70" fill="#ffd56a" opacity="0.35"/>
  </svg>`;
}

function jewelArt(size) {
  crystalSeq += 1;
  const id = `jewel-grad-${crystalSeq}`;
  const px = size || 72;
  return `<svg class="jewel-art" width="${px}" height="${px}" viewBox="0 0 80 80" aria-hidden="true">
    <defs>
      <linearGradient id="${id}" x1="30%" y1="0%" x2="75%" y2="100%">
        <stop offset="0%" stop-color="#fffef4"/>
        <stop offset="30%" stop-color="#ffe08a"/>
        <stop offset="68%" stop-color="#ff4f9a"/>
        <stop offset="100%" stop-color="#7a2cff"/>
      </linearGradient>
    </defs>
    <polygon points="40,4 64,22 72,46 54,76 26,76 8,46 16,22" fill="url(#${id})" stroke="#ffe9a8" stroke-width="2.2" stroke-linejoin="round"/>
    <polygon points="40,4 52,24 40,46 28,24" fill="#fff" opacity="0.5"/>
    <polygon points="16,22 40,24 8,46" fill="#fff" opacity="0.28"/>
    <polygon points="64,22 72,46 54,76" fill="#3a1468" opacity="0.28"/>
    <polygon points="40,16 48,28 40,38 32,28" fill="#fff" opacity="0.82"/>
  </svg>`;
}

function goodsArt(pack, size) {
  if (!pack || pack.kind === "crystal") return crystalArt(size);
  crystalSeq += 1;
  const g = `jg-${crystalSeq}`;
  const glass = `gl-${crystalSeq}`;
  const px = size || 52;
  const head = `<svg class="jewel-art" width="${px}" height="${px}" viewBox="0 0 80 80" aria-hidden="true"><defs>
      <linearGradient id="${g}" x1="30%" y1="0%" x2="80%" y2="100%">
        <stop offset="0%" stop-color="#fffef4"/><stop offset="35%" stop-color="#ffe08a"/><stop offset="72%" stop-color="#ff4f9a"/><stop offset="100%" stop-color="#7a2cff"/>
      </linearGradient>
      <linearGradient id="${glass}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.62"/><stop offset="100%" stop-color="#9fd6ff" stop-opacity="0.22"/>
      </linearGradient>
    </defs>`;
  const gem = (pts) => `<polygon points="${pts}" fill="url(#${g})" stroke="#ffe9a8" stroke-width="1.2" stroke-linejoin="round"/>`;
  if (pack.id === "s") {
    return `${head}
      <rect x="33" y="6" width="14" height="12" rx="3" fill="#e0a24a" stroke="#ffe9a8" stroke-width="1.6"/>
      <path d="M30 22h20l8 44a8 8 0 0 1-8 8H30a8 8 0 0 1-8-8z" fill="url(#${glass})" stroke="#ffe9a8" stroke-width="2"/>
      ${gem("40,34 50,42 46,58 34,58 30,42")}
      <path d="M32 30h7" stroke="#fff" stroke-width="2" opacity="0.75" stroke-linecap="round"/>
    </svg>`;
  }
  if (pack.id === "m") {
    return `${head}
      <rect x="32" y="4" width="16" height="10" rx="3" fill="#e0a24a" stroke="#ffe9a8" stroke-width="1.6"/>
      <path d="M34 14h12l4 8h8l6 42a10 10 0 0 1-10 10H26a10 10 0 0 1-10-10l6-42h8z" fill="url(#${glass})" stroke="#ffe9a8" stroke-width="2"/>
      ${gem("30,38 38,44 34,56 24,56 22,44")}
      ${gem("48,40 56,46 52,60 42,60 40,46")}
      <path d="M30 26h8" stroke="#fff" stroke-width="2" opacity="0.7" stroke-linecap="round"/>
    </svg>`;
  }
  if (pack.id === "l") {
    return `${head}
      <path d="M8 32Q40 8 72 32v10H8z" fill="#a84820" stroke="#ffe9a8" stroke-width="2" stroke-linejoin="round"/>
      <rect x="8" y="40" width="64" height="30" rx="4" fill="#7a2e14" stroke="#ffe9a8" stroke-width="2"/>
      <rect x="34" y="32" width="12" height="38" fill="#ffd56a"/>
      <circle cx="40" cy="54" r="4" fill="#fff4c8" stroke="#c48a3a"/>
      ${gem("18,22 28,26 24,38 14,38 12,26")}
      ${gem("52,20 62,26 58,38 46,38 44,26")}
      ${gem("36,12 46,18 42,30 30,30 28,18")}
    </svg>`;
  }
  return `${head}
    <path d="M10 62 16 28 30 46 40 14 50 46 64 28 70 62Z" fill="#ffd56a" stroke="#fff6d0" stroke-width="2" stroke-linejoin="round"/>
    <rect x="10" y="58" width="60" height="10" rx="3" fill="#e8b44a" stroke="#fff6d0" stroke-width="1.6"/>
    ${gem("40,18 47,27 40,34 33,27")}
    <circle cx="18" cy="32" r="4.5" fill="#7ec8ff" stroke="#fff"/>
    <circle cx="62" cy="32" r="4.5" fill="#ff8ec8" stroke="#fff"/>
    <circle cx="30" cy="48" r="3" fill="#fff"/>
    <circle cx="50" cy="48" r="3" fill="#fff"/>
  </svg>`;
}

function goodsReward(pack) {
  return pack.kind === "crystal" ? `経験結晶 +${pack.crystals}` : `宝石 +${pack.jewels}`;
}

function showPay() {
  state.screen = "pay";
  const pick = SHOP_GOODS.find((pack) => pack.id === state.payPick);
  screenEl().innerHTML = `
    <div class="view">
      <div class="view-head">
        <button type="button" class="back" data-action="gacha">← 戻る</button>
        <h2>課金</h2>
      </div>
      <p class="jewel-count">${jewelArt(28)}<span>宝石 ${state.jewels}</span></p>
      <p class="hint">宝石と経験結晶を購入できる。</p>
      <div class="shop-list">
        ${SHOP_GOODS.map(
          (pack) => `<button type="button" class="shop-row" data-action="pay-pick" data-id="${pack.id}">
            ${goodsArt(pack, 52)}
            <span class="shop-copy"><strong>${pack.name}</strong><span class="shop-jewels">${goodsReward(pack)}</span></span>
            <span class="shop-price">${pack.price}</span>
          </button>`
        ).join("")}
      </div>
      ${
        pick
          ? `<div class="modal is-open">
              <div class="pay-sheet" role="dialog" aria-modal="true" aria-label="購入の確認">
                ${goodsArt(pick, 96)}
                <p class="ch-name">${pick.name}</p>
                <p class="jewel-count">${goodsReward(pick)}</p>
                <p class="shop-price">${pick.price}</p>
                <div class="modal-actions">
                  <button type="button" class="btn btn-main" data-action="pay-buy">購入する</button>
                  <button type="button" class="btn btn-ghost" data-action="pay-cancel">やめる</button>
                </div>
              </div>
            </div>`
          : ""
      }
    </div>`;
}

function buyPack() {
  const pack = SHOP_GOODS.find((row) => row.id === state.payPick);
  if (!pack) return;
  if (pack.kind === "crystal") state.items.crystal += pack.crystals;
  else state.jewels += pack.jewels;
  state.payPick = null;
  saveGame();
  updateChrome();
  showPay();
  toast(`購入した。${goodsReward(pack)}`);
  SFX.win();
}

function addLevel(id, amount) {
  const rec = state.owned[id];
  if (!rec || amount <= 0) return { levels: 0, level: rec ? rec.level : 1 };
  const before = rec.level;
  rec.level = Math.min(MUSU.maxLevel, rec.level + amount);
  if (rec.level >= MUSU.maxLevel) rec.exp = 0;
  const learned = movesLearned(id, before, rec.level);
  if (learned.length) toast(`${MUSU.byId(id).name}が ${learned.map((skill) => skill.name).join("、")} を覚えた`);
  return { levels: rec.level - before, level: rec.level };
}

function gachaResultHtml(result) {
  if (!result) {
    return `<div class="gacha-ball" aria-hidden="true"></div><p class="hint">宝石を入れて、ガチャを引く。</p>`;
  }
  if (result.kind === "item") {
    return `<div class="item-card gacha-pop">
      ${crystalArt(120)}
      <p class="ch-name">${MUSU.items.crystal.name}</p>
      <p>経験値 +${MUSU.items.crystal.exp}</p>
    </div>`;
  }
  const ch = MUSU.byId(result.id);
  const note = result.duplicate
    ? result.levels > 0
      ? `同じ仲間。レベルが ${result.level} になった！`
      : `同じ仲間。すでに最大レベルだ`
    : "新しい仲間！";
  return `<div class="gacha-pop">${cardMarkup(ch, { level: state.owned[ch.id].level })}<p class="hint">${note}</p></div>`;
}

const GACHA_LINES = [
  { id: "all", name: "通常", title: "むすキングガチャ", text: "どの仲間も当たる", cost: 100, face: ["hikari", "yuki", "sakura", "inori", "shizuku"], rates: [["N", 50], ["R", 30], ["SR", 15], ["UR", 5]] },
  { id: "fire", name: "太陽", title: "太陽の召喚", text: "炎の仲間が当たりやすい", element: "fire", cost: 100, focus: 0.7, rates: [["N", 40], ["R", 32], ["SR", 18], ["UR", 10]] },
  { id: "water", name: "潮騒", title: "潮騒の召喚", text: "水の仲間が当たりやすい", element: "water", cost: 100, focus: 0.7, rates: [["N", 40], ["R", 32], ["SR", 18], ["UR", 10]] },
  { id: "grass", name: "翠風", title: "翠風の召喚", text: "草の仲間が当たりやすい", element: "grass", cost: 100, focus: 0.7, rates: [["N", 40], ["R", 32], ["SR", 18], ["UR", 10]] },
  { id: "thunder", name: "雷鳴", title: "雷鳴の召喚", text: "雷の仲間が当たりやすい", element: "thunder", cost: 100, focus: 0.7, rates: [["N", 40], ["R", 32], ["SR", 18], ["UR", 10]] },
  { id: "ice", name: "雪華", title: "雪華の召喚", text: "氷の仲間が当たりやすい", element: "ice", cost: 100, focus: 0.7, rates: [["N", 40], ["R", 32], ["SR", 18], ["UR", 10]] },
  { id: "crown", name: "王冠", title: "王冠の召喚", text: "SRとURだけ", cost: 200, rates: [["SR", 70], ["UR", 30]] },
];

function currentLine() {
  return GACHA_LINES.find((line) => line.id === state.gachaLine) || GACHA_LINES[0];
}

function lineupCast(line) {
  let list = MUSU.characters.slice();
  if (line.face) list = line.face.map((id) => MUSU.byId(id)).filter(Boolean);
  else if (line.element) list = list.filter((ch) => ch.element === line.element);
  else if (line.id === "crown") list = list.filter((ch) => ch.rarity === "UR" || ch.rarity === "SR");
  const order = { UR: 0, SR: 1, R: 2, N: 3 };
  return list.sort((a, b) => order[a.rarity] - order[b.rarity] || a.name.localeCompare(b.name, "ja"));
}

function showGacha() {
  state.screen = "gacha";
  const line = currentLine();
  const cast = lineupCast(line);
  screenEl().innerHTML = `
    <div class="view view-gacha">
      <div class="view-head">
        <button type="button" class="back" data-action="title">← 戻る</button>
        <h2>ガチャ</h2>
      </div>
      <div class="gacha-body">
        <p class="jewel-count">${jewelArt(28)}<span>宝石 ${state.jewels}</span></p>
        <div class="line-list">
          ${GACHA_LINES.map(
            (row) => `<button type="button" class="line-btn${row.id === line.id ? " is-on" : ""}" data-action="gacha-line" data-id="${row.id}">${row.name}</button>`
          ).join("")}
        </div>
        <div class="gacha-stage">${
          state.gachaResult
            ? gachaResultHtml(state.gachaResult)
            : `<div class="gacha-banner">
                <h3>${line.title}</h3>
                <p class="hint">${line.text}</p>
                <div class="gacha-rail">${cast.map((ch) => cardMarkup(ch, { bright: true })).join("")}</div>
                ${oddsHtml(line)}
              </div>`
        }</div>
        <div class="title-actions">
          <button type="button" class="btn btn-main" data-action="pull" ${state.gachaBusy ? "disabled" : ""}>1回引く（${line.cost}）</button>
          <button type="button" class="btn btn-ghost" data-action="pay">課金</button>
        </div>
      </div>
    </div>`;
  hydratePortraits(screenEl());
}

function oddsHtml(line) {
  const banner = line || currentLine();
  const sr = Math.max(0, 10 - state.pity.sr);
  const ur = Math.max(0, 40 - state.pity.ur);
  const rates = banner.rates
    .map(([rarity, weight]) => `<span class="odd odd-${rarity.toLowerCase()}">${rarity} ${weight}%</span>`)
    .join("");
  const focus = banner.element
    ? `<span class="odd">${elementOf(banner.element).name} ${Math.round((banner.focus || 0) * 100)}%</span>`
    : "";
  const hasLow = banner.rates.some(([rarity]) => rarity === "N" || rarity === "R");
  const pity = hasLow
    ? `<span class="odd">SR天井 ${sr}</span><span class="odd">UR天井 ${ur}</span>`
    : `<span class="odd">UR天井 ${ur}</span>`;
  return `<p class="gacha-odds"><span class="odd-label">出る確率</span>${rates}${focus}${pity}</p>`;
}

function rollRarity(line) {
  const has = (rarity) => line.rates.some(([name]) => name === rarity);
  if (state.pity.ur >= 39 && has("UR")) return "UR";
  if (state.pity.sr >= 9 && has("SR") && (has("N") || has("R"))) return Math.random() < 0.25 && has("UR") ? "UR" : "SR";
  const total = line.rates.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [rarity, weight] of line.rates) {
    roll -= weight;
    if (roll < 0) return rarity;
  }
  return line.rates[line.rates.length - 1][0];
}

function bumpPity(rarity) {
  if (rarity === "UR") {
    state.pity.sr = 0;
    state.pity.ur = 0;
    return;
  }
  if (rarity === "SR") {
    state.pity.sr = 0;
    state.pity.ur += 1;
    return;
  }
  state.pity.sr += 1;
  state.pity.ur += 1;
}

function rollPrize() {
  const line = currentLine();
  const rarity = rollRarity(line);
  let pool = MUSU.byRarity(rarity);
  if (line.element && Math.random() < (line.focus || 0)) {
    const focused = pool.filter((ch) => ch.element === line.element);
    if (focused.length) pool = focused;
  }
  const ch = pool[Math.floor(Math.random() * pool.length)];
  return { kind: "character", id: ch.id, rarity, duplicate: !!state.owned[ch.id] };
}

function pullGacha() {
  const cost = currentLine().cost;
  if (state.gachaBusy || state.jewels < cost) {
    if (state.jewels < cost) toast("宝石が足りない");
    return;
  }
  state.gachaBusy = true;
  state.jewels -= cost;
  const prize = rollPrize();
  bumpPity(prize.rarity);
  if (prize.kind === "item") {
    state.items.crystal += 1;
  } else if (prize.duplicate) {
    const up = addLevel(prize.id, 1);
    prize.levels = up.levels;
    prize.level = up.level;
  } else {
    state.owned[prize.id] = { level: 1, exp: 0 };
  }
  state.gachaResult = prize;
  saveGame();
  updateChrome();
  SFX.superFan();
  state.gachaBusy = false;
  showGacha();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitIntro(ms) {
  if (state.introSkipped) return Promise.resolve();
  return new Promise((resolve) => {
    const skip = document.getElementById("skip-catch");
    let settled = false;
    const finish = (skipped) => {
      if (settled) return;
      settled = true;
      if (skipped) state.introSkipped = true;
      clearTimeout(timer);
      if (skip) skip.removeEventListener("click", onSkip);
      resolve();
    };
    const onSkip = () => finish(true);
    const timer = setTimeout(() => finish(false), ms);
    if (skip) skip.addEventListener("click", onSkip);
  });
}

function setHp(bar, numEl, hp, max) {
  const ratio = Math.max(0, hp) / max;
  bar.style.width = `${ratio * 100}%`;
  bar.classList.toggle("low", ratio <= 0.3 && ratio > 0);
  bar.classList.toggle("mid", ratio <= 0.6 && ratio > 0.3);
  numEl.textContent = `${Math.max(0, hp)} / ${max}`;
}

function renderPips() {
  const pips = document.getElementById("pips");
  if (!pips) return;
  pips.innerHTML = [0, 1, 2].map((i) => `<i class="${i < state.gauge ? "on" : ""}"></i>`).join("");
  const skills = document.getElementById("skills");
  if (skills) skills.classList.toggle("super-ready", state.gauge >= 3);
  const dock = document.querySelector(".battle-commands");
  if (dock) dock.classList.toggle("is-ready", state.gauge >= 3 && comboReady("player"));
  const note = document.getElementById("super-note");
  const lead = state.side && state.side.player[0] && MUSU.leader(state.side.player[0].id);
  const leadText = lead ? `リーダー ${lead.name}` : "";
  if (note) {
    if (state.gauge >= 3 && comboReady("player")) note.textContent = `${leadText}　合体が出せる`;
    else if (state.gauge >= 3) note.textContent = `${leadText}　必殺になる`;
    else note.textContent = leadText;
  }
}

function flash(kind) {
  const el = document.createElement("div");
  el.className = `flash flash-${kind}`;
  screenEl().appendChild(el);
  setTimeout(() => el.remove(), kind === "super" ? 720 : 480);
}

function shake(isSuper) {
  const el = screenEl();
  el.classList.remove("shake", "shake-super");
  void el.offsetWidth;
  el.classList.add(isSuper ? "shake-super" : "shake");
}

function popupDamage(card, amount, isSuper) {
  if (amount <= 0) return;
  const el = document.createElement("div");
  el.className = `pop-dmg${isSuper ? " super" : ""}`;
  el.textContent = String(amount);
  card.appendChild(el);
  setTimeout(() => el.remove(), isSuper ? 1100 : 900);
}

let selectTimer = null;
let autoTimer = null;

function autoButton() {
  const on = state.auto;
  return `<button type="button" class="auto-btn${on ? " is-on" : ""}" id="auto-battle" data-action="auto" aria-pressed="${on}">AUTO ${on ? "On" : "Off"}</button>`;
}

function stopAutoPick() {
  clearTimeout(autoTimer);
  autoTimer = null;
}

function autoSkillIndex() {
  const player = MUSU.byId(state.playerId);
  const enemy = MUSU.byId(state.enemyId);
  const shown = orderedSkills(player);
  if (comboReady("player") && Math.random() < 0.55) return "combo";
  if (Math.random() < 0.12) return Math.floor(Math.random() * shown.length);
  const trait = MUSU.trait(player.id);
  const stage = evoStage(player.id, state.playerLevel, "player");
  const stats = battleStats(player, state.playerLevel, stage);
  let best = 0;
  let bestScore = -1;
  shown.forEach((skill, index) => {
    if (!skill) return;
    const stat = skill.category === "magic" ? stats.mag : stats.atk;
    const effect = MUSU.effect(skill.element, enemy.element);
    const stab = skill.element === player.element ? 1.5 + (trait.stab || 0) : 1;
    const elem = trait.elem && trait.elem[skill.element] ? trait.elem[skill.element] : 1;
    const score = stat * shownPower(skill, stage) * effect * stab * elem * fxScore(skill, state.playerHp, state.playerMax);
    if (score > bestScore) {
      bestScore = score;
      best = index;
    }
  });
  return best;
}

function scheduleAutoPick() {
  stopAutoPick();
  if (!state.auto || state.screen !== "battle" || state.finished || state.inputLocked) return;
  autoTimer = setTimeout(() => {
    autoTimer = null;
    if (!state.auto || state.inputLocked || state.screen !== "battle" || state.finished) return;
    onChoose(autoSkillIndex());
  }, 700);
}

function stopSelectTimer() {
  clearInterval(selectTimer);
  selectTimer = null;
  stopAutoPick();
  const box = document.getElementById("select-timer");
  if (box) box.hidden = true;
}

function startSelectTimer() {
  stopSelectTimer();
  if (state.screen !== "battle" || state.finished || state.inputLocked) return;
  let left = SELECT_SEC;
  const box = document.getElementById("select-timer");
  const count = document.getElementById("select-count");
  const bar = document.getElementById("timer-bar");
  if (!box || !count || !bar) return;
  box.hidden = false;
  box.classList.remove("is-low");
  count.textContent = String(left);
  bar.style.transition = "none";
  bar.style.width = "100%";
  void bar.offsetWidth;
  bar.style.transition = `width ${SELECT_SEC}s linear`;
  bar.style.width = "0%";
  selectTimer = setInterval(() => {
    left -= 1;
    if (count.isConnected) count.textContent = String(Math.max(0, left));
    if (box.isConnected) box.classList.toggle("is-low", left <= 3);
    if (left > 0) return;
    stopSelectTimer();
    onChoose(Math.floor(Math.random() * 3));
  }, 1000);
}

function openSkillSelect() {
  if (state.screen !== "battle" || state.finished) return;
  const call = document.getElementById("super-call");
  if (call) {
    call.textContent = "";
    call.classList.remove("is-hot");
  }
  const vs = document.getElementById("vs-skills");
  const effect = document.getElementById("effect");
  const message = document.getElementById("message");
  if (vs) vs.textContent = "";
  if (effect) effect.textContent = "";
  if (message) {
    const prompt = state.auto ? "自動で選んでいる" : state.gauge >= 3 ? "必殺の準備ができた！" : "技を選んで！";
    message.textContent = prompt;
  }
  paintAilments();
  document.querySelectorAll("[data-skill]").forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("chosen");
  });
  const combo = document.querySelector("[data-combo]");
  if (combo) {
    const ready = comboReady("player");
    combo.disabled = !ready;
    combo.classList.toggle("is-ready", ready);
    combo.classList.remove("chosen");
  }
  state.inputLocked = false;
  startSelectTimer();
  scheduleAutoPick();
}

function skillButtons(ch, side) {
  const stage = evoStage(ch.id, side === "enemy" ? state.enemyLevel : state.playerLevel, side);
  return orderedSkills(ch, side)
    .map((skill, index) => {
      const el = elementOf(skill.element);
      const cat = MUSU.categories[skill.category];
      return `<button type="button" class="skill-btn el-${skill.element}" data-skill="${index}" disabled>
        ${signHtml(skill.sign)}
        <span><span class="sub">${el.name}　${cat.name}　威力 ${shownPower(skill, stage)}${fxName(skill)}</span><strong>${skill.name}</strong></span>
      </button>`;
    })
    .join("");
}

function comboButton(ch) {
  const combo = MUSU.combo(ch.id);
  const stage = evoStage(ch.id, state.playerLevel, "player");
  const el = elementOf(combo.element);
  return `<button type="button" class="combo-btn el-${combo.element}" data-combo="1" disabled>
    ${signHtml(combo.sign)}
    <span><span class="sub">${el.name}　威力 ${shownPower(combo, stage)}　奥義が3つで仲間が残っているとき</span><strong>合体　${combo.name}</strong></span>
  </button>`;
}

function aliveCount(side) {
  if (!state.side) return 0;
  const list = side === "player" ? state.side.player : state.side.enemy;
  return list.filter((fighter) => !fighter.ko && fighter.hp > 0).length;
}

function comboReady(side) {
  if (aliveCount(side) < 2) return false;
  if (side === "enemy") return true;
  return state.gauge >= 3;
}

function applyLeaderBody(list) {
  const lead = list[0] && MUSU.leader(list[0].id);
  if (!lead || !lead.hp) return;
  list.forEach((fighter) => {
    fighter.max = Math.round(fighter.max * lead.hp);
    fighter.hp = fighter.max;
  });
}

function benchMarkup(list, active) {
  return list
    .map((fighter, index) => {
      const ko = fighter.ko || fighter.hp <= 0;
      return `<i class="bench-pip${index === active ? " is-on" : ""}${ko ? " is-ko" : ""}">${index + 1}</i>`;
    })
    .join("");
}

function paintBench() {
  const playerBench = document.getElementById("player-bench");
  const enemyBench = document.getElementById("enemy-bench");
  if (playerBench && state.side) playerBench.innerHTML = benchMarkup(state.side.player, state.side.pi);
  if (enemyBench && state.side) enemyBench.innerHTML = benchMarkup(state.side.enemy, state.side.ei);
}

function makeFighter(id, level, side) {
  const ch = MUSU.byId(id);
  const stats = battleStats(ch, level, evoStage(id, level, side));
  return { id, level, hp: stats.hp, max: stats.hp, ko: false };
}

function syncActiveFromSide() {
  const player = state.side.player[state.side.pi];
  const enemy = state.side.enemy[state.side.ei];
  state.playerId = player.id;
  state.playerLevel = player.level;
  state.playerHp = player.hp;
  state.playerMax = player.max;
  state.enemyId = enemy.id;
  state.enemyLevel = enemy.level;
  state.enemyHp = enemy.hp;
  state.enemyMax = enemy.max;
}

function writeActiveHp() {
  state.side.player[state.side.pi].hp = state.playerHp;
  state.side.enemy[state.side.ei].hp = state.enemyHp;
}

function nextAlive(list, index) {
  for (let i = index + 1; i < list.length; i += 1) {
    if (!list[i].ko && list[i].hp > 0) return i;
  }
  return -1;
}

function paintFighter(side) {
  const fighter = side === "player" ? state.side.player[state.side.pi] : state.side.enemy[state.side.ei];
  const ch = MUSU.byId(fighter.id);
  const stage = evoStage(ch.id, fighter.level, side);
  const card = document.getElementById(side === "player" ? "player-card" : "enemy-card");
  if (!card) return;
  card.innerHTML = cardMarkup(ch, { className: "enter", level: fighter.level, evo: stage });
  hydratePortraits(card);
  if (side === "player") {
    const who = document.getElementById("player-who");
    const name = document.getElementById("player-name");
    if (who) who.textContent = `自分　Lv ${fighter.level}　${MUSU.trait(ch.id).name}`;
    if (name) name.textContent = ch.name;
    const mini = document.getElementById("player-skills");
    if (mini) mini.innerHTML = orderedSkills(ch, "player").map((skill) => skillRow(skill, stage)).join("");
    const box = document.getElementById("skills");
    if (box) box.innerHTML = skillButtons(ch, "player");
    const comboSlot = document.getElementById("combo-slot");
    if (comboSlot) comboSlot.innerHTML = comboButton(ch);
    const exp = document.getElementById("player-exp");
    if (exp) exp.outerHTML = expLine(ch.id);
  } else {
    const name = document.getElementById("enemy-name");
    const lv = document.getElementById("enemy-lv");
    if (name) name.textContent = ch.name;
    if (lv) lv.textContent = `Lv ${fighter.level}　${MUSU.trait(ch.id).name}`;
    const mini = document.getElementById("enemy-skills");
    if (mini) {
      mini.hidden = false;
      mini.innerHTML = orderedSkills(ch, "enemy").map((skill) => skillRow(skill, stage)).join("");
    }
  }
  const bar = document.getElementById(side === "player" ? "player-hp" : "enemy-hp");
  const num = document.getElementById(side === "player" ? "player-hp-num" : "enemy-hp-num");
  if (bar && num) setHp(bar, num, fighter.hp, fighter.max);
  paintBench();
}

function renderBattle() {
  const player = MUSU.byId(state.playerId);
  const enemy = MUSU.byId(state.enemyId);
  const playerStage = evoStage(player.id, state.playerLevel, "player");
  screenEl().innerHTML = `
    <div class="view view-battle">
      <div class="fighter enemy">
        <div class="fighter-card" id="enemy-card">${backCardMarkup()}</div>
        <div class="fighter-meta">
          <p class="who"><span class="bench" id="enemy-bench"></span>相手 <span id="enemy-lv"></span></p>
          <h3 id="enemy-name">？？？</h3>
          <div class="hp-wrap">
            <div class="hp-track"><div class="hp-bar" id="enemy-hp"></div></div>
            <span class="hp-num" id="enemy-hp-num"></span>
          </div>
          <ul class="mini-skills" id="enemy-skills" hidden></ul>
          <p class="ailments" id="enemy-ailments"></p>
        </div>
      </div>
      <div class="clash">
        <p class="super-call" id="super-call"></p>
        <p class="vs-skills" id="vs-skills"></p>
        <p class="effect" id="effect"></p>
        <p id="message" aria-live="polite">カードを読込中…</p>
        <p class="select-timer" id="select-timer" hidden>
          <span>残り</span>
          <span id="select-count">10</span>
          <span class="timer-track"><span class="timer-bar" id="timer-bar"></span></span>
        </p>
      </div>
      <div class="fighter player">
        <div class="fighter-meta">
          <p class="who"><span class="bench" id="player-bench"></span><span id="player-who">自分　Lv ${state.playerLevel}　${MUSU.trait(player.id).name}</span></p>
          <h3 id="player-name">${player.name}</h3>
          <div class="hp-wrap">
            <div class="hp-track"><div class="hp-bar" id="player-hp"></div></div>
            <span class="hp-num" id="player-hp-num"></span>
          </div>
          ${expLine(player.id)}
          <ul class="mini-skills" id="player-skills">${orderedSkills(player, "player").map((skill) => skillRow(skill, playerStage)).join("")}</ul>
          <p class="ailments" id="player-ailments"></p>
        </div>
        <div class="fighter-card" id="player-card">${cardMarkup(player, { className: "enter", level: state.playerLevel, evo: playerStage })}</div>
      </div>
      <div class="battle-commands">
        <div class="cmd-head">
          ${autoButton()}
          <p class="super-note" id="super-note"></p>
          <span class="gauge-side"><span>奥義</span><span class="pips" id="pips"></span></span>
        </div>
        <div class="skills" id="skills">
        ${skillButtons(player, "player")}
        </div>
        <div id="combo-slot">${comboButton(player)}</div>
      </div>
    </div>
    <button type="button" class="skip-catch" id="skip-catch"><span>クリックで省略</span></button>`;
  hydratePortraits(screenEl());
  setHp(document.getElementById("player-hp"), document.getElementById("player-hp-num"), state.playerHp, state.playerMax);
  setHp(document.getElementById("enemy-hp"), document.getElementById("enemy-hp-num"), state.enemyHp, state.enemyMax);
  renderPips();
  paintBench();
  document.getElementById("enemy-skills").innerHTML = orderedSkills(enemy, "enemy")
    .map((skill) => skillRow(skill, evoStage(enemy.id, state.enemyLevel, "enemy")))
    .join("");
}

async function startBattle(roster) {
  if (state.screen === "battle" && !state.finished) return;
  stopSelectTimer();
  ensurePlayer();
  if (readyTeam().length < 3) {
    renderSelect();
    toast("仲間を3人そろえて");
    return;
  }
  const avg = Math.round(readyTeam().reduce((sum, id) => sum + ownedLevel(id), 0) / 3);
  const enemies = Array.isArray(roster) && roster.length === 3 ? roster : rollEnemyRoster(avg);
  state.enemyRoster = enemies;
  state.side = {
    player: readyTeam().map((id) => makeFighter(id, ownedLevel(id), "player")),
    enemy: enemies.map((row) => makeFighter(row.id, row.level, "enemy")),
    pi: 0,
    ei: 0,
  };
  applyLeaderBody(state.side.player);
  applyLeaderBody(state.side.enemy);
  state.screen = "battle";
  state.gauge = 0;
  state.inputLocked = true;
  state.introSkipped = false;
  state.finished = false;
  state.lastReward = null;
  state.learnQueue = [];
  syncActiveFromSide();
  freshBattle();
  renderBattle();
  SFX.scan();
  await waitIntro(900);
  const enemyCard = document.getElementById("enemy-card");
  if (state.screen !== "battle" || !enemyCard) return;
  const enemy = MUSU.byId(state.enemyId);
  enemyCard.innerHTML = cardMarkup(enemy, { className: "flip", level: state.enemyLevel, evo: evoStage(enemy.id, state.enemyLevel, "enemy") });
  hydratePortraits(enemyCard);
  document.getElementById("enemy-name").textContent = enemy.name;
  document.getElementById("enemy-lv").textContent = `Lv ${state.enemyLevel}　${MUSU.trait(enemy.id).name}`;
  document.getElementById("enemy-skills").hidden = false;
  document.getElementById("enemy-skills").innerHTML = orderedSkills(enemy, "enemy")
    .map((skill) => skillRow(skill, evoStage(enemy.id, state.enemyLevel, "enemy")))
    .join("");
  document.getElementById("message").textContent = `3対3の勝負だ！　リーダー ${MUSU.leader(state.side.player[0].id).name}`;
  paintBench();
  SFX.ui();
  await waitIntro(800);
  if (state.screen !== "battle") return;
  document.getElementById("skip-catch")?.remove();
  openSkillSelect();
}

function rollEnemyRoster(level) {
  const ids = [];
  while (ids.length < 3) {
    const ch = randomEnemy(ids[ids.length - 1]);
    if (!ids.includes(ch.id)) ids.push(ch.id);
  }
  return ids.map((id) => ({ id, level: rollEnemyLevel(level) }));
}

function cpuSkill(enemy, player) {
  const trait = MUSU.trait(enemy.id);
  const log = state.battle.signLog;
  const last = log[log.length - 1];
  const prev = log[log.length - 2];
  let predicted = null;
  if (last && last === prev) predicted = last;
  else if (log.length) {
    const freq = {};
    log.forEach((sign) => {
      freq[sign] = (freq[sign] || 0) + 1;
    });
    predicted = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
  }
  const skills = orderedSkills(enemy, "enemy");
  if (comboReady("enemy") && Math.random() < 0.2) return MUSU.combo(enemy.id);
  const read = trait.read || 0.4;
  if (predicted && Math.random() < read) {
    const answer = counterSign(predicted);
    const answerSkill = skills.find((skill) => skill.sign === answer);
    if (answerSkill && Math.random() < 0.86) return answerSkill;
  }
  if (Math.random() < 0.1) return skills[Math.floor(Math.random() * skills.length)];
  const stats = battleStats(enemy, state.enemyLevel, evoStage(enemy.id, state.enemyLevel, "enemy"));
  return skills
    .map((skill) => {
      const stat = skill.category === "magic" ? stats.mag : stats.atk;
      const effect = MUSU.effect(skill.element, player.element);
      const stab = skill.element === enemy.element ? 1.5 + (trait.stab || 0) : 1;
      const elem = trait.elem && trait.elem[skill.element] ? trait.elem[skill.element] : 1;
      let signScore = 1;
      if (predicted) {
        const clash = signResult(skill.sign, predicted);
        signScore = clash === "win" ? 1.45 : clash === "lose" ? 0.42 : 0.9;
      }
      return { skill, score: stat * shownPower(skill, evoStage(enemy.id, state.enemyLevel, "enemy")) * effect * stab * elem * signScore * fxScore(skill, state.enemyHp, state.enemyMax) };
    })
    .sort((a, b) => b.score - a.score)[0].skill;
}

function markPicked(listId, index) {
  const list = document.getElementById(listId);
  if (!list) return;
  [...list.children].forEach((li, i) => li.classList.toggle("picked", i === index));
}

async function onChoose(index) {
  if (state.inputLocked || state.screen !== "battle" || state.finished) return;
  const useCombo = index === "combo";
  if (useCombo && !comboReady("player")) return;
  const player = MUSU.byId(state.playerId);
  const enemy = MUSU.byId(state.enemyId);
  const shown = orderedSkills(player, "player");
  const playerSkill = useCombo ? MUSU.combo(player.id) : shown[index];
  if (!playerSkill) return;
  stopSelectTimer();
  state.inputLocked = true;
  document.querySelectorAll("[data-skill], [data-combo]").forEach((btn) => {
    btn.disabled = true;
  });
  if (useCombo) document.querySelector("[data-combo]")?.classList.add("chosen");
  else document.querySelector(`[data-skill="${index}"]`)?.classList.add("chosen");
  if (!useCombo) markPicked("player-skills", index);
  SFX.pick();
  document.getElementById("message").textContent = "相手は技を選んでいる…";
  await sleep(520);
  if (state.screen !== "battle") return;

  const enemySkill = cpuSkill(enemy, player);
  const enemyIsCombo = !!enemySkill.combo;
  const enemyIndex = enemyIsCombo ? -1 : orderedSkills(enemy, "enemy").findIndex((skill) => skill.sign === enemySkill.sign);
  markPicked("enemy-skills", enemyIndex);
  const clash = signResult(playerSkill.sign, enemySkill.sign);
  const playerTrait = MUSU.trait(player.id);
  const enemyTrait = MUSU.trait(enemy.id);
  const usedSuper = !useCombo && state.gauge >= 3 && clash !== "lose";
  if (useCombo || usedSuper) state.gauge = 0;
  const comboMul = (count) => 1 + 0.22 * Math.max(0, count - 1);
  const playerHit = quoteHit(player, playerSkill, enemy, state.playerLevel, useCombo ? comboMul(aliveCount("player")) : usedSuper ? playerTrait.super || 1.5 : 1, "player");
  const enemyHit = quoteHit(enemy, enemySkill, player, state.enemyLevel, enemyIsCombo ? comboMul(aliveCount("enemy")) : 1, "enemy");
  let dealtEnemy = clash === "lose" ? 0 : playerHit.dmg;
  let dealtPlayer = clash === "win" ? 0 : enemyHit.dmg;
  if (clash === "tie") {
    if (playerTrait.tie) dealtEnemy = Math.round(dealtEnemy * playerTrait.tie);
    if (enemyTrait.tie) dealtPlayer = Math.round(dealtPlayer * enemyTrait.tie);
  }
  if (playerTrait.press) dealtPlayer = Math.round(dealtPlayer * playerTrait.press);
  if (enemyTrait.press) dealtEnemy = Math.round(dealtEnemy * enemyTrait.press);
  if (playerTrait.incoming) dealtPlayer = Math.round(dealtPlayer * playerTrait.incoming);
  if (enemyTrait.incoming) dealtEnemy = Math.round(dealtEnemy * enemyTrait.incoming);
  const playerLead = MUSU.leader(state.side.player[0].id);
  const enemyLead = MUSU.leader(state.side.enemy[0].id);
  if (playerLead.guard) dealtPlayer = Math.round(dealtPlayer * playerLead.guard);
  if (enemyLead.guard) dealtEnemy = Math.round(dealtEnemy * enemyLead.guard);
  const notes = [];
  const covered = coverHits(dealtEnemy, dealtPlayer, notes);
  dealtEnemy = covered.dealtEnemy;
  dealtPlayer = covered.dealtPlayer;
  const playerLanded = clash !== "lose" && !playerHit.shocked;
  const enemyLanded = clash !== "win" && !enemyHit.shocked;
  stampSkillFx(playerSkill, "player", "enemy", playerLanded, notes);
  stampSkillFx(enemySkill, "enemy", "player", enemyLanded, notes);
  const reflectEnemy = dealtPlayer > 0 && playerTrait.reflect ? Math.round(dealtPlayer * playerTrait.reflect) : 0;
  const reflectPlayer = dealtEnemy > 0 && enemyTrait.reflect ? Math.round(dealtEnemy * enemyTrait.reflect) : 0;
  const drainPlayer =
    dealtEnemy > 0 && playerTrait.drain && (!playerTrait.drainElem || playerSkill.element === playerTrait.drainElem)
      ? Math.round(dealtEnemy * playerTrait.drain)
      : 0;
  const drainEnemy =
    dealtPlayer > 0 && enemyTrait.drain && (!enemyTrait.drainElem || enemySkill.element === enemyTrait.drainElem)
      ? Math.round(dealtPlayer * enemyTrait.drain)
      : 0;
  const healPlayer = blockedHeal("player", drainPlayer, notes, "吸収") + healFromSkill(playerSkill, "player", playerLanded, notes);
  const healEnemy = blockedHeal("enemy", drainEnemy, notes, "吸収") + healFromSkill(enemySkill, "enemy", enemyLanded, notes);
  const toEnemy = dealtEnemy + reflectEnemy;
  const toPlayer = dealtPlayer + reflectPlayer;
  if (dealtEnemy > 0) notes.push(...stampAilment(playerTrait, playerSkill, state.battle.ailment.enemy));
  if (dealtPlayer > 0) notes.push(...stampAilment(enemyTrait, enemySkill, state.battle.ailment.player));
  if (playerHit.crit && dealtEnemy > 0) notes.push("会心");
  if (useCombo && dealtEnemy > 0) notes.push("合体");
  if (reflectEnemy > 0) notes.push("反射");
  if (playerHit.shocked && clash !== "lose") notes.push("外れた");
  if (dealtEnemy > 0) {
    const gain = (playerHit.effect >= 2 ? 2 : playerHit.effect <= 0.5 ? 0 : 1) + (playerTrait.gauge || 0);
    state.gauge = Math.min(3, state.gauge + gain);
  }
  if (clash === "win") {
    state.battle.streak.player += 1;
    state.battle.streak.enemy = 0;
  } else if (clash === "lose") {
    state.battle.streak.enemy += 1;
    state.battle.streak.player = 0;
  } else {
    state.battle.streak.player = 0;
    state.battle.streak.enemy = 0;
  }
  state.battle.signLog.push(playerSkill.sign);

  const bigHit = usedSuper || (useCombo && clash !== "lose");
  const call = document.getElementById("super-call");
  call.textContent = useCombo && clash !== "lose" ? "合体！" : usedSuper ? "必殺！" : "";
  call.classList.toggle("is-hot", bigHit);
  const playerSign = MUSU.signs[playerSkill.sign].mark;
  const enemySign = MUSU.signs[enemySkill.sign].mark;
  document.getElementById("vs-skills").textContent = `${playerSign} ${playerSkill.name}（${effectLabel(playerHit.effect)}）　対　${enemySign} ${enemySkill.name}（${effectLabel(enemyHit.effect)}）`;
  const clashText = clash === "win" ? "勝った！" : clash === "lose" ? "負けた…" : "ぶつかった！";
  const effectText =
    clash === "lose"
      ? ""
      : playerHit.effect >= 2
        ? "効果は抜群だ！"
        : playerHit.effect <= 0.5
          ? "効果は今ひとつ…"
          : clash === "tie"
            ? "効果は普通だ"
            : "";
  document.getElementById("effect").textContent = [clashText, effectText, ...notes].filter(Boolean).join("　");
  document.getElementById("message").textContent = "";
  if (bigHit) SFX.superFan();
  else if (clash === "win") SFX.advantage();
  else if (clash === "lose") SFX.bad();
  else SFX.clash();

  await sleep(420);
  if (state.screen !== "battle") return;
  state.enemyHp = Math.min(state.enemyMax, state.enemyHp - toEnemy + healEnemy);
  state.playerHp = Math.min(state.playerMax, state.playerHp - toPlayer + healPlayer);
  state.enemyHp -= burnTick("enemy", state.enemyMax);
  state.playerHp -= burnTick("player", state.playerMax);
  tickSeal();
  paintAilments();
  const heldEnemy = holdOn("enemy", state.enemyHp);
  const heldPlayer = holdOn("player", state.playerHp);
  state.enemyHp = heldEnemy.hp;
  state.playerHp = heldPlayer.hp;
  state.battle.turn += 1;
  if (heldPlayer.endured || heldEnemy.endured) document.getElementById("message").textContent = "不屈で持ちこたえた！";
  else if (state.battle.ailment.player.burn || state.battle.ailment.enemy.burn) document.getElementById("message").textContent = "やけどが残っている";
  setHp(document.getElementById("player-hp"), document.getElementById("player-hp-num"), state.playerHp, state.playerMax);
  setHp(document.getElementById("enemy-hp"), document.getElementById("enemy-hp-num"), state.enemyHp, state.enemyMax);
  popupDamage(document.getElementById("enemy-card"), toEnemy, bigHit);
  popupDamage(document.getElementById("player-card"), toPlayer, enemyIsCombo && clash !== "win");
  SFX.hit();
  shake(bigHit);
  if (bigHit) flash("super");
  else if (clash === "win") flash("good");
  else if (clash === "lose") flash("bad");
  else flash("clash");
  renderPips();
  writeActiveHp();

  const playerKo = state.playerHp <= 0;
  const enemyKo = state.enemyHp <= 0;
  if (playerKo) state.side.player[state.side.pi].ko = true;
  if (enemyKo) state.side.enemy[state.side.ei].ko = true;
  const nextP = playerKo ? nextAlive(state.side.player, state.side.pi) : state.side.pi;
  const nextE = enemyKo ? nextAlive(state.side.enemy, state.side.ei) : state.side.ei;
  const playerOut = playerKo && nextP < 0;
  const enemyOut = enemyKo && nextE < 0;
  if (playerOut || enemyOut) {
    state.finished = true;
    if (playerKo) document.querySelector("#player-card .tcard")?.classList.add("ko");
    if (enemyKo) document.querySelector("#enemy-card .tcard")?.classList.add("ko");
    if (!playerOut && enemyOut) document.querySelector("#player-card .tcard")?.classList.add("winner");
    if (playerOut && !enemyOut) document.querySelector("#enemy-card .tcard")?.classList.add("winner");
    paintBench();
    await sleep(900);
    if (state.screen !== "battle") return;
    const kind = playerOut && enemyOut ? "draw" : enemyOut ? "win" : "lose";
    showResult(kind);
    return;
  }
  if (playerKo || enemyKo) {
    if (playerKo) document.querySelector("#player-card .tcard")?.classList.add("ko");
    if (enemyKo) document.querySelector("#enemy-card .tcard")?.classList.add("ko");
    await sleep(700);
    if (state.screen !== "battle") return;
    if (playerKo) {
      state.side.pi = nextP;
      state.gauge = 0;
      state.battle.ailment.player = blankAilment();
      state.battle.streak.player = 0;
      state.battle.endure.player = true;
    }
    if (enemyKo) {
      state.side.ei = nextE;
      state.battle.ailment.enemy = blankAilment();
      state.battle.streak.enemy = 0;
      state.battle.endure.enemy = true;
    }
    syncActiveFromSide();
    paintFighter(playerKo ? "player" : "enemy");
    if (playerKo && enemyKo) paintFighter(playerKo ? "enemy" : "player");
    renderPips();
    const names = [];
    if (playerKo) names.push(`次は${MUSU.byId(state.playerId).name}`);
    if (enemyKo) names.push(`次は${MUSU.byId(state.enemyId).name}`);
    document.getElementById("vs-skills").textContent = "";
    document.getElementById("effect").textContent = "";
    document.getElementById("message").textContent = names.join("　");
    SFX.ui();
    await sleep(800);
    if (state.screen !== "battle" || state.finished) return;
    openSkillSelect();
    return;
  }

  await sleep(700);
  if (state.screen !== "battle" || state.finished) return;
  openSkillSelect();
}

function pushRecord(kind) {
  const r = state.record;
  if (kind === "win") {
    r.wins += 1;
    r.streak += 1;
    r.best = Math.max(r.best, r.streak);
    SFX.win();
  } else if (kind === "lose") {
    r.losses += 1;
    r.streak = 0;
    SFX.lose();
  } else {
    r.draws += 1;
    SFX.clash();
  }
}

function grantReward(kind) {
  const enemyLevel = Math.round(state.side.enemy.reduce((sum, fighter) => sum + fighter.level, 0) / state.side.enemy.length);
  const exp = kind === "win" ? 18 + enemyLevel * 5 : kind === "draw" ? 12 : 8;
  const jewels = kind === "win" ? 12 + enemyLevel * 2 : kind === "draw" ? 4 : 2;
  state.jewels += jewels;
  const notes = [];
  state.learnQueue = [];
  state.side.player.forEach((fighter) => {
    const up = addExp(fighter.id, exp);
    if (up.levels > 0) notes.push(`${MUSU.byId(fighter.id).name} Lv ${up.level}`);
    movesLearned(fighter.id, up.from, up.level).forEach((skill) => {
      state.learnQueue.push({ id: fighter.id, sign: skill.sign, lv: skill.lv, name: skill.name });
    });
  });
  state.lastReward = { exp, jewels, notes };
  saveGame();
  updateChrome();
}

function learnOfferHtml() {
  const offer = state.learnQueue[0];
  if (!offer) return "";
  const ch = MUSU.byId(offer.id);
  const current = equippedList(ch, state.owned[offer.id].level, "player").find((skill) => skill.sign === offer.sign);
  return `<div class="learn-box">
    <p>${ch.name}が ${offer.name} を覚えた</p>
    <p class="hint">${current ? current.name : ""} と入れ替えられる</p>
    <div class="modal-actions">
      <button type="button" class="btn btn-main" data-action="equip-learn">入れ替える</button>
      <button type="button" class="btn btn-ghost" data-action="skip-learn">あとで</button>
    </div>
  </div>`;
}

function paintResult() {
  const kind = state.resultKind;
  const reward = state.lastReward;
  const copy = {
    win: ["勝利！", "自分の勝ちだ！"],
    lose: ["残念…", "負けてしまった"],
    draw: ["引き分け", "相打ちになった"],
  }[kind];
  const growth = reward.notes.length ? `${reward.notes.join("　")}　` : `経験値 +${reward.exp}　`;
  const lead = state.side.player[0];
  const foe = state.side.enemy[0];
  const player = MUSU.byId(lead.id);
  const enemy = MUSU.byId(foe.id);
  const teamLine = (list) => list.map((fighter) => `${MUSU.byId(fighter.id).name}${fighter.ko ? "・倒" : ""}`).join("　");
  screenEl().innerHTML = `
    <div class="view view-result">
      <p class="kicker">${copy[1]}</p>
      <h2 class="result-title">${copy[0]}</h2>
      <p class="hint">自分　${teamLine(state.side.player)}</p>
      <p class="hint">相手　${teamLine(state.side.enemy)}</p>
      <div class="result-cards">
        ${cardMarkup(player, { className: kind === "win" ? "winner" : kind === "lose" ? "ko" : "", level: lead.level, evo: evoStage(player.id, lead.level, "player") })}
        ${cardMarkup(enemy, { className: kind === "lose" ? "winner" : kind === "win" ? "ko" : "", level: foe.level, evo: evoStage(enemy.id, foe.level, "enemy") })}
      </div>
      <p class="hint">${growth}${jewelArt(18)}宝石 +${reward.jewels}${state.record.streak > 1 ? `　${state.record.streak}連勝中` : ""}</p>
      ${learnOfferHtml()}
      <div class="result-actions">
        ${autoButton()}
        <button type="button" class="btn btn-main" data-action="revenge">再戦</button>
        <button type="button" class="btn btn-sub" data-action="next">次の相手</button>
        <button type="button" class="btn btn-ghost" data-action="select">カードを変える</button>
      </div>
    </div>`;
  hydratePortraits(screenEl());
}

function showResult(kind) {
  stopSelectTimer();
  state.screen = "result";
  state.finished = true;
  state.resultKind = kind;
  pushRecord(kind);
  grantReward(kind);
  paintResult();
  if (kind === "win") burst();
}

function burst() {
  const layer = document.createElement("div");
  layer.className = "burst";
  const colors = ["#ff8fbf", "#ffd56a", "#fff", "#c9b6ff"];
  for (let i = 0; i < 28; i += 1) {
    const bit = document.createElement("i");
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.animationDelay = `${Math.random() * 0.25}s`;
    bit.style.background = colors[i % colors.length];
    layer.appendChild(bit);
  }
  screenEl().appendChild(layer);
  setTimeout(() => layer.remove(), 1600);
}

function onAction(action, el) {
  if (action === "title") {
    SFX.ui();
    showTitle();
    return;
  }
  if (action === "help") {
    SFX.ui();
    showHelp();
    return;
  }
  if (action === "select") {
    SFX.ui();
    renderSelect();
    return;
  }
  if (action === "zukan") {
    SFX.ui();
    showZukan();
    return;
  }
  if (action === "gacha") {
    SFX.ui();
    showGacha();
    return;
  }
  if (action === "gacha-line") {
    SFX.ui();
    state.gachaLine = el.dataset.id;
    state.gachaResult = null;
    showGacha();
    return;
  }
  if (action === "pay") {
    SFX.ui();
    state.payPick = null;
    showPay();
    return;
  }
  if (action === "pay-pick") {
    SFX.ui();
    state.payPick = el.dataset.id;
    showPay();
    return;
  }
  if (action === "pay-cancel") {
    SFX.ui();
    state.payPick = null;
    showPay();
    return;
  }
  if (action === "pay-buy") {
    buyPack();
    return;
  }
  if (action === "pull") {
    pullGacha();
    return;
  }
  if (action === "pick") {
    SFX.ui();
    setPlayerId(el.dataset.id);
    return;
  }
  if (action === "cycle") {
    cyclePlayer(Number(el.dataset.dir));
    return;
  }
  if (action === "team-slot") {
    const index = Number(el.dataset.index);
    const id = state.playerId;
    const team = state.team.slice();
    const existing = team.indexOf(id);
    if (existing === index) team[index] = null;
    else if (existing >= 0) {
      team[existing] = team[index];
      team[index] = id;
    } else team[index] = id;
    state.team = team;
    saveGame();
    renderSelect();
    SFX.ui();
    return;
  }
  if (action === "equip") {
    const id = el.dataset.id;
    const rec = state.owned[id];
    if (!rec) return;
    moveLevels(id)[el.dataset.sign] = Number(el.dataset.lv);
    saveGame();
    toast("技を入れ替えた");
    SFX.ui();
    if (state.screen === "zukan") {
      showZukan();
      openDetail(id);
    } else renderSelect();
    return;
  }
  if (action === "equip-learn") {
    const offer = state.learnQueue.shift();
    if (offer && state.owned[offer.id]) moveLevels(offer.id)[offer.sign] = offer.lv;
    saveGame();
    toast("技を入れ替えた");
    paintResult();
    SFX.ui();
    return;
  }
  if (action === "skip-learn") {
    state.learnQueue.shift();
    paintResult();
    SFX.ui();
    return;
  }
  if (action === "fight") {
    SFX.scan();
    startBattle();
    return;
  }
  if (action === "detail") {
    SFX.ui();
    openDetail(el.dataset.id);
    return;
  }
  if (action === "close-detail") {
    closeDetail();
    return;
  }
  if (action === "use-crystal") {
    useCrystal();
    return;
  }
  if (action === "evolve") {
    const id = el.dataset.id;
    const rec = state.owned[id];
    const next = rec && nextEvo(rec);
    if (!next || rec.level < next.need) return;
    rec.evo = next.stage;
    saveGame();
    updateChrome();
    toast(next.stage === 2 ? "最終進化した！" : "進化した！");
    SFX.superFan();
    if (state.screen === "zukan") {
      showZukan();
      openDetail(id);
    } else {
      renderSelect();
    }
    return;
  }
  if (action === "auto") {
    state.auto = !state.auto;
    const btn = document.getElementById("auto-battle");
    if (btn) {
      btn.classList.toggle("is-on", state.auto);
      btn.textContent = state.auto ? "AUTO On" : "AUTO Off";
      btn.setAttribute("aria-pressed", String(state.auto));
    }
    const message = document.getElementById("message");
    if (message && state.screen === "battle" && !state.inputLocked && !state.finished) {
      message.textContent = state.auto ? "自動で選んでいる" : "技を選んで！";
    }
    if (state.auto) scheduleAutoPick();
    else stopAutoPick();
    SFX.ui();
    return;
  }
  if (action === "revenge") {
    startBattle(state.enemyRoster);
    return;
  }
  if (action === "next") {
    startBattle();
  }
}

function boot() {
  ensurePlayer();
  updateChrome();
  showTitle();
  document.getElementById("mute").addEventListener("click", () => {
    SFX.toggle();
    updateChrome();
  });
  screenEl().addEventListener("click", (event) => {
    const combo = event.target.closest("[data-combo]");
    if (combo && screenEl().contains(combo)) {
      onChoose("combo");
      return;
    }
    const skill = event.target.closest("[data-skill]");
    if (skill && screenEl().contains(skill)) {
      onChoose(Number(skill.dataset.skill));
      return;
    }
    const actionEl = event.target.closest("[data-action]");
    if (!actionEl || !screenEl().contains(actionEl)) return;
    if (actionEl.disabled) return;
    onAction(actionEl.dataset.action, actionEl);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.screen === "zukan" && state.detailId) closeDetail();
      else if (state.screen !== "title" && state.screen !== "battle") showTitle();
      return;
    }
    if (state.screen === "select") {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        cyclePlayer(event.key === "ArrowRight" ? 1 : -1);
      }
      if (event.key === "Enter" && !event.target.closest("button")) startBattle();
    }
    if (state.screen === "battle" && !state.inputLocked) {
      if (event.key === "1") onChoose(0);
      if (event.key === "2") onChoose(1);
      if (event.key === "3") onChoose(2);
    }
    if (state.screen === "title" && event.key === "Enter") startBattle();
  });
}

boot();
