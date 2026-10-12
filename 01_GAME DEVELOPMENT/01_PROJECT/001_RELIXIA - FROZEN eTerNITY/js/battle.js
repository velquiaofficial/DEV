/**
 * 戦闘画面。
 * 効果は effects、見た目は FX。画面の開始は screens.battle。
 */
const effects = {
  single(ctx) {
    const foes = living(foesOf(ctx.side));
    const target = ctx.side === "ally" ? currentTarget()?.unit : pick(foes);
    if (!target) return false;
    return dealDamage(ctx.caster, target, roll(resolvePower(ctx.caster, ctx.skill)), ctx.caster.element, ctx.skill, "single");
  },
  aoe(ctx) {
    const foes = living(foesOf(ctx.side));
    if (!foes.length) return false;
    foes.forEach((target) => dealDamage(ctx.caster, target, roll(resolvePower(ctx.caster, ctx.skill)), ctx.caster.element, ctx.skill, "aoe"));
    shockField(ctx.skill.special ? "big" : "wide");
    return true;
  },
  heal(ctx) {
    const friends = living(friendsOf(ctx.side));
    const mode = ctx.skill.target || "lowest";
    let targets = [];
    if (mode === "all") targets = friends;
    else if (mode === "self") targets = ctx.caster.hp > 0 ? [ctx.caster] : [];
    else if (friends.length) targets = [lowestHp(friends)];
    if (!targets.length) return false;
    targets.forEach((target) => dealHeal(ctx.caster, target, roll(resolvePower(ctx.caster, ctx.skill)), ctx.skill));
    return true;
  },
};


const FX = {
  shot(fromNode, toNode, element, special) {
    const field = fromNode.closest(".field");
    if (!field) return;
    const count = special ? 8 : 5;
    after(count, special ? 32 : 40, (index) => {
      if (!fromNode.isConnected || !toNode.isConnected) return;
      const aim = fieldAim(field, fromNode, toNode);
      const spread = (index - (count - 1) / 2) * (special ? 0.05 : 0.045);
      const angle = aim.angle + spread;
      paintLine(field, element, aim.x1, aim.y1, aim.length, angle, "", special);
      const reach = Math.min(aim.length * 0.12, 36);
      placeMuzzle(field, aim.x1 + Math.cos(angle) * reach, aim.y1 + Math.sin(angle) * reach, element, special ? "special" : "shot");
      placeCasing(field, aim.x1, aim.y1 + 6);
    });
  },
  thick(fromNode, toNode, element, special) {
    const field = fromNode.closest(".field");
    if (!field) return;
    const count = special ? 4 : 2;
    after(count, 55, (index) => {
      if (!fromNode.isConnected || !toNode.isConnected) return;
      const aim = fieldAim(field, fromNode, toNode);
      paintLine(field, element, aim.x1, aim.y1 + (index - 1) * 10, aim.length, aim.angle + index * 0.03, "thick", special);
      placeMuzzle(field, aim.x1, aim.y1, element, "special");
    });
  },
  rain(fromNode, toNode, element, special) {
    const field = fromNode.closest(".field");
    if (!field) return;
    const count = special ? 28 : 18;
    after(count, special ? 18 : 24, () => {
      if (!toNode.isConnected) return;
      const aim = fieldAim(field, fromNode, toNode);
      const x = aim.x2 + (Math.random() - 0.5) * (special ? 190 : 120);
      const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.18;
      paintLine(field, element, x, 0, Math.max(24, aim.y2), angle, "rain", special);
    });
  },
  pillar(fromNode, toNode, element, special) {
    const field = fromNode.closest(".field");
    if (!field) return;
    const count = special ? 5 : 3;
    after(count, 60, (index) => {
      if (!toNode.isConnected) return;
      const aim = fieldAim(field, fromNode, toNode);
      const x = aim.x2 + (index - (count - 1) / 2) * 28;
      paintLine(field, element, x, 0, Math.max(24, aim.y2), Math.PI / 2, "pillar", special);
    });
  },
  fan(fromNode, toNode, element, special) {
    const field = fromNode.closest(".field");
    if (!field) return;
    const count = special ? 11 : 7;
    after(count, 28, (index) => {
      if (!fromNode.isConnected || !toNode.isConnected) return;
      const aim = fieldAim(field, fromNode, toNode);
      const angle = aim.angle + (index - (count - 1) / 2) * 0.16;
      paintLine(field, element, aim.x1, aim.y1, aim.length, angle, "fan", special);
      if (index === 0) placeMuzzle(field, aim.x1, aim.y1, element, special ? "special" : "shot");
    });
  },
  arc(fromNode, toNode, element, special) {
    const field = fromNode.closest(".field");
    if (!field) return;
    const count = special ? 10 : 7;
    after(count, 40, () => {
      if (!fromNode.isConnected || !toNode.isConnected) return;
      const aim = fieldAim(field, fromNode, toNode);
      const x = aim.x1 + (aim.x2 - aim.x1) * 0.2 + (Math.random() - 0.5) * 48;
      const y = Math.max(6, Math.min(aim.y1, aim.y2) - 78 - Math.random() * 36);
      const length = Math.hypot(aim.x2 - x, aim.y2 - y);
      const angle = Math.atan2(aim.y2 - y, aim.x2 - x);
      paintLine(field, element, x, y, length, angle, "arc", special);
    });
  },
  bloom(fromNode, toNode, element, special) {
    const field = fromNode.closest(".field");
    if (!field) return;
    const count = special ? 6 : 4;
    after(count, 50, () => {
      if (!toNode.isConnected) return;
      const aim = fieldAim(field, fromNode, toNode);
      const ring = el("div", `fx-bloom${special ? " is-special" : ""}`);
      paintElement(ring, element);
      ring.style.left = `${aim.x2}px`;
      ring.style.top = `${aim.y2}px`;
      field.append(ring);
      ring.addEventListener("animationend", () => ring.remove());
    });
  },
  heal(fromNode, toNode, element) {
    const field = fromNode.closest(".field");
    if (!field || !fromNode.isConnected || !toNode.isConnected) return;
    const aim = fieldAim(field, fromNode, toNode);
    paintLine(field, element, aim.x1, aim.y1, aim.length, aim.angle, "heal", false);
  },
};

function buildBattle(characters, stages, setup) {
  const stage = stages[setup.stageId];
  if (!stage) throw new Error(`未登録の戦闘場所です: ${setup.stageId}`);
  if (!Array.isArray(setup.party) || setup.party.length === 0) {
    throw new Error("編成が空です");
  }

  const party = setup.party.map((id) => {
    const source = characters[id];
    if (!source) throw new Error(`未登録のキャラです: ${id}`);
    return { id, ...structuredClone(source) };
  });
  const wave = readWave(setup.wave ?? stage.wave);
  const waves = planWaves(stage, stages, setup.stageId);
  const current = Math.min(waves.length, Math.max(1, wave.current || 1));

  return {
    chapter: stage.chapter,
    domain: stage.domain,
    waveCurrent: current,
    waveTotal: waves.length,
    time: Number(setup.time ?? stage.time),
    background: stage.background,
    relic: stage.relic,
    stageId: setup.stageId,
    rewardStage: setup.rewardStage || null,
    rewarded: false,
    currencies: CURRENCIES,
    party,
    waves,
    enemies: structuredClone(waves[current - 1]),
  };
}

function stampEnemy(enemy, wave, index) {
  const copy = structuredClone(enemy);
  copy.id = `${copy.image || copy.name || "enemy"}-w${wave}-${index + 1}`;
  return copy;
}

function waveRoster(group) {
  const counts = [];
  group.forEach((enemy) => {
    const found = counts.find((item) => item.name === enemy.name);
    if (found) found.count += 1;
    else counts.push({ name: enemy.name, count: 1 });
  });
  return counts.map((item) => (item.count > 1 ? `${item.name} ${item.count}体` : item.name)).join("、");
}

function chapterTemplates(stages, stageId) {
  const chapter = String(stageId || "").split("-")[0];
  const seen = new Map();
  Object.entries(stages || {}).forEach(([id, stage]) => {
    if (String(id).split("-")[0] !== chapter) return;
    const order = Number(String(id).split("-")[1]) || 0;
    (stage.enemies || []).forEach((enemy) => {
      const key = enemy.image || enemy.name;
      const prev = seen.get(key);
      if (!prev || order >= prev.order) seen.set(key, { order, enemy });
    });
  });
  return [...seen.values()]
    .map((item) => item.enemy)
    .sort((a, b) => (a.scale || 1) - (b.scale || 1) || (isBoss(a) ? 1 : 0) - (isBoss(b) ? 1 : 0));
}

function planWaves(stage, stages, stageId) {
  const total = Math.max(1, readWave(stage.wave).total || 1);
  const formation = stage.enemies || [];
  if (!formation.length) return [[]];
  const templates = chapterTemplates(stages, stageId).filter((enemy) => !isBoss(enemy));
  if (total >= 5 && formation.some((enemy) => isBoss(enemy))) {
    return planBossWaves(formation, templates);
  }
  return planFieldWaves(formation, templates, total);
}

function planFieldWaves(formation, templates, total) {
  const sorted = [...formation].sort((a, b) => (a.scale || 1) - (b.scale || 1));
  const smallScale = sorted[0].scale || 1;
  const vanguard = formation.filter((enemy) => (enemy.scale || 1) <= smallScale + 0.02);
  const openingSource = vanguard.length && vanguard.length < formation.length
    ? vanguard
    : formation.slice(0, Math.max(1, formation.length - 1));
  const opening = openingSource.length === 1 && formation.length > 1
    ? [openingSource[0], openingSource[0]]
    : openingSource;
  const wave1 = opening.map((enemy, index) => stampEnemy(enemy, 1, index));
  const wave2 = formation.map((enemy, index) => stampEnemy(enemy, 2, index));
  const wave3 = formation.map((enemy, index) => stampEnemy(enemy, 3, index));
  const biggest = sorted[sorted.length - 1];
  const known = new Set(formation.map((enemy) => enemy.image || enemy.name));
  const weakestAt = wave3.reduce((at, enemy, index) => ((enemy.scale || 1) < (wave3[at].scale || 1) ? index : at), 0);
  const nextRank = templates.find((enemy) => !known.has(enemy.image || enemy.name) && (enemy.scale || 1) > (wave3[weakestAt].scale || 1) + 0.04);
  if (nextRank && wave3.length) {
    const promoted = stampEnemy(nextRank, 3, weakestAt);
    const ref = biggest.stats || {};
    promoted.stats = {
      hp: Math.round(Number(ref.hp || promoted.stats?.hp || 1) * 1.12),
      atk: Math.round(Number(ref.atk || promoted.stats?.atk || 1) * 1.08),
      def: Math.round(Number(ref.def || promoted.stats?.def || 1) * 1.04),
    };
    promoted.scale = Math.max(Number(promoted.scale) || 1, Number(biggest.scale || 1));
    wave3[weakestAt] = promoted;
  } else if (wave3.length) {
    const lead = wave3.reduce((best, enemy) => ((enemy.scale || 1) > (best.scale || 1) ? enemy : best), wave3[0]);
    lead.stats = {
      ...lead.stats,
      hp: Math.round(Number(lead.stats?.hp || 1) * 1.22),
      atk: Math.round(Number(lead.stats?.atk || 1) * 1.1),
    };
    lead.scale = Number(lead.scale || 1) * 1.12;
  }
  const waves = [wave1, wave2, wave3];
  while (waves.length < total) {
    const wave = waves.length + 1;
    waves.push(formation.map((enemy, index) => stampEnemy(enemy, wave, index)));
  }
  return waves.slice(0, total);
}

function planBossWaves(formation, templates) {
  const boss = formation.find((enemy) => isBoss(enemy));
  const small = templates[0] || boss;
  const medium = templates[Math.min(1, templates.length - 1)] || small;
  const large = templates[templates.length - 1] || medium;
  const group = (wave, parts) => {
    const list = [];
    parts.forEach(([enemy, count]) => {
      for (let index = 0; index < count; index += 1) list.push(stampEnemy(enemy, wave, list.length));
    });
    return list;
  };
  return [
    group(1, [[small, 4]]),
    group(2, [[small, 2], [medium, 2]]),
    group(3, [[medium, 2], [large, 1]]),
    group(4, [[medium, 1], [large, 2]]),
    [stampEnemy(boss, 5, 0)],
  ];
}

function readWave(wave) {
  if (typeof wave === "string") {
    const [current, total] = wave.split("/").map((part) => Number(part));
    return { current, total };
  }
  return { current: Number(wave.current), total: Number(wave.total) };
}

function formatWave() {
  return `${battle.waveCurrent}/${battle.waveTotal}`;
}

function defaultTargetId() {
  const boss = battle.enemies.find((enemy) => isBoss(enemy));
  return (boss || battle.enemies[0]).id;
}

function bindVitals(unit) {
  const bar = rules().bar || "hp";
  unit.stats = { ...(unit.stats || {}) };
  if (unit.stats[bar] == null) unit.stats[bar] = unit.maxHp ?? unit.hp ?? 1;
  unit.maxHp = Number(unit.stats[bar]);
  const opening = unit.start?.[bar];
  unit.hp = Math.min(unit.maxHp, Number(opening ?? unit.hp ?? unit.maxHp));
  unit.hpStart = unit.hp;
}

function readFactor(value) {
  if (typeof value === "string" && value.includes("/")) {
    const [num, den] = value.split("/").map((part) => Number(part.trim()));
    if (den) return num / den;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : 1;
}

function resolvePower(unit, skill) {
  const flat = Number(skill?.power ?? 0);
  if (!skill?.stat) return flat;
  const base = Number(unit?.stats?.[skill.stat] ?? 0);
  return Math.round(base * readFactor(skill.rate ?? 1) + flat);
}

function prepareUnits() {
  battle.party.forEach((member) => {
    bindVitals(member);
    fight.allyCd.set(member.id, 0);
    fight.specialHits.set(member.id, 0);
  });
  battle.enemies.forEach((enemy) => {
    bindVitals(enemy);
  });
  fight.relic = battle.relic;
  fight.clock = battle.time;
  fight.targetId = defaultTargetId();
}

function living(list) {
  return list.filter((unit) => unit.hp > 0);
}

function renderHud() {
  const hud = el("header", "hud");

  const left = el("div", "hud-left");
  const pause = el("button", "round-btn", "II");
  pause.type = "button";
  pause.setAttribute("aria-label", "一時停止");
  pause.addEventListener("click", () => {
    if (fight.result) return;
    fight.paused = !fight.paused;
    pause.classList.toggle("is-on", fight.paused);
    battle.party.forEach(syncMember);
    syncRelic();
  });

  const wave = el("div", "wave-block");
  const waveValue = el("strong", "wave-value", formatWave());
  wave.append(el("span", "wave-kicker", "回戦"), waveValue);
  const timer = el("div", "timer");
  const timeLabel = el("span", "time-value", formatClock(fight.clock));
  timer.append(el("span", "timer-icon", "⏱"), timeLabel);
  left.append(pause, wave, timer);

  const center = el("div", "hud-center");
  center.append(el("h1", "chapter", battle.chapter), el("p", "domain", battle.domain));

  const right = el("div", "hud-right");
  battle.currencies.forEach((currency) => {
    const chip = el("div", "currency");
    chip.append(
      slot(`assets/icons/currencies/${currency.id}.png`, currency.mark),
      el("span", "currency-value", String(currency.value))
    );
    right.append(chip);
  });
  const menu = el("button", "round-btn menu-btn", "☰");
  menu.type = "button";
  menu.setAttribute("aria-label", "メニュー");
  menu.addEventListener("click", () => openScreen("prepare"));
  right.append(menu);

  hud.append(left, center, right);
  fight.ui.pause = pause;
  fight.ui.waveValue = waveValue;
  fight.ui.timeLabel = timeLabel;
  return hud;
}

function renderFieldTools() {
  const tools = el("div", "field-tools");

  const auto = el("button", "auto-btn", "AUTO");
  auto.type = "button";
  auto.classList.toggle("is-on", fight.auto);
  auto.addEventListener("click", () => {
    fight.auto = !fight.auto;
    auto.classList.toggle("is-on", fight.auto);
  });

  const speedButtons = SPEEDS.map((speed) => {
    const button = el("button", "speed-btn", `×${speed}`);
    button.type = "button";
    button.addEventListener("click", () => {
      fight.speed = fight.speed === speed ? 1 : speed;
      speedButtons.forEach((other, index) => {
        other.classList.toggle("is-on", SPEEDS[index] === fight.speed);
      });
    });
    return button;
  });

  tools.append(auto, ...speedButtons);
  return tools;
}

function renderUnit(unit, side) {
  const node = el("div", `unit unit-${side} unit-${unit.id}`);
  const base = side === "enemy" && isBoss(unit) ? 8.4 : 7.4;
  node.style.width = `${base * (unit.scale || 1)}cqi`;
  paintElement(node, unit.element);

  const bar = el("div", "field-hp");
  const fill = el("span", "field-hp-fill");
  fill.style.width = `${hpPercent(unit.hp, unit.maxHp)}%`;
  bar.append(fill);

  const sprite = slot(`assets/sprites/${look(unit)}.png`, unit.name || look(unit));
  sprite.classList.add("sprite");

  node.append(bar, sprite);
  if (side === "enemy") {
    node.classList.add("is-enter");
    node.addEventListener("animationend", (event) => {
      if (event.target === node) node.classList.remove("is-enter");
    });
    node.setAttribute("role", "button");
    node.tabIndex = 0;
    node.setAttribute("aria-label", unit.name);
    node.addEventListener("click", () => selectTarget(unit.id));
  }
  actors.set(unit.id, { unit, node, fill, side });
  return node;
}

function selectTarget(id) {
  const actor = actors.get(id);
  if (!actor || actor.side !== "enemy" || actor.unit.hp <= 0 || fight.result) return;
  fight.targetId = id;
  battle.enemies.forEach(syncEnemy);
}

function currentTarget() {
  const chosen = actors.get(fight.targetId);
  if (chosen && chosen.unit.hp > 0) return chosen;
  const next = living(battle.enemies)[0];
  if (!next) return null;
  selectTarget(next.id);
  return actors.get(next.id);
}

function flashSkill(member, index) {
  const card = cards.get(member.id);
  const button = card && card.skills[index];
  if (!button) return;
  button.classList.remove("is-cast");
  void button.offsetWidth;
  button.classList.add("is-cast");
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function roll(power) {
  const spread = Math.max(1, Math.round(power * (rules().variance ?? 0.12)));
  return power + Math.floor(Math.random() * spread);
}

function incoming(amount, target) {
  const key = rules().defense;
  const scale = Number(rules().defenseScale ?? 0);
  const defense = Number(target?.stats?.[key] ?? 0);
  if (!key || defense <= 0 || scale <= 0) return Math.max(1, Math.round(amount));
  return Math.max(1, Math.round(amount * (scale / (scale + defense))));
}

function friendsOf(side) {
  return side === "ally" ? battle.party : battle.enemies;
}

function foesOf(side) {
  return side === "ally" ? battle.enemies : battle.party;
}

function lowestHp(list) {
  return list.reduce((lowest, unit) => (
    unit.hp / unit.maxHp < lowest.hp / lowest.maxHp ? unit : lowest
  ));
}

function releaseCrystals(enemy, fromNode) {
  const field = document.querySelector("#stage .field");
  if (!field || !fromNode?.isConnected) return;
  const allies = living(battle.party)
    .map((member) => actors.get(member.id))
    .filter((actor) => actor?.node?.isConnected);
  if (!allies.length) return;
  const fieldBox = field.getBoundingClientRect();
  const from = fromNode.getBoundingClientRect();
  const x1 = from.left + from.width * 0.5 - fieldBox.left;
  const y1 = from.top + from.height * 0.42 - fieldBox.top;
  const boss = isBoss(enemy);
  allies.forEach((actor, index) => {
    const copies = boss ? 2 : 1;
    for (let copy = 0; copy < copies; copy += 1) {
      const to = actor.node.getBoundingClientRect();
      const orb = el("span", `crystal${boss ? " is-large" : ""}`);
      paintElement(orb, enemy.element);
      orb.style.left = `${x1}px`;
      orb.style.top = `${y1}px`;
      orb.style.setProperty("--dx", `${to.left + to.width * 0.5 - fieldBox.left - x1}px`);
      orb.style.setProperty("--dy", `${to.top + to.height * 0.4 - fieldBox.top - y1}px`);
      orb.style.setProperty("--lift", `${(index % 2 === 0 ? -1 : 1) * (26 + copy * 18 + index * 7)}px`);
      orb.style.animationDelay = `${index * 0.045 + copy * 0.07}s`;
      field.append(orb);
      orb.addEventListener("animationend", () => {
        orb.remove();
        if (copy === 0) absorbFlash(actor.node, enemy.element);
      });
    }
  });
}

function absorbFlash(node, element) {
  if (!node?.isConnected) return;
  const flash = el("span", "crystal-absorb");
  paintElement(flash, element);
  node.append(flash);
  flash.addEventListener("animationend", () => flash.remove());
}

function refreshUnit(unit) {
  if (battle.party.includes(unit)) syncMember(unit);
  else syncEnemy(unit);
}

function fxName(skill, impact) {
  if (skill?.fx && FX[skill.fx]) return skill.fx;
  if (skill?.special) return "pillar";
  if (skill?.type === "heal" || impact === "heal") return "heal";
  if (impact === "aoe") return "rain";
  return "shot";
}

function dealDamage(from, to, amount, element, skill, impact) {
  if (!to || to.hp <= 0) return false;
  amount = incoming(amount, to);
  to.hp = Math.max(0, to.hp - amount);
  const fromActor = from && actors.get(from.id);
  const toActor = actors.get(to.id);
  const tint = element || from?.element || "light";
  const special = !!skill?.special;
  const heavy = special || impact === "aoe";
  if (fromActor && toActor) launchFx(fromActor.node, toActor.node, tint, fxName(skill, impact), special);
  if (toActor) spawnPopup(toActor.node, amount, tint, "damage", special, heavy);
  if (to.hp <= 0 && battle.enemies.includes(to)) releaseCrystals(to, toActor?.node);
  if (impact !== "aoe") shockField(special ? "big" : "hit");
  refreshUnit(to);
  return true;
}

function dealHeal(from, to, amount, skill) {
  if (!to || to.hp <= 0) return false;
  const before = to.hp;
  to.hp = Math.min(to.maxHp, to.hp + amount);
  const gained = to.hp - before;
  const fromActor = from && actors.get(from.id);
  const toActor = actors.get(to.id);
  const special = !!skill?.special;
  if (gained > 0 && fromActor && toActor && from !== to) launchFx(fromActor.node, toActor.node, "heal", fxName(skill, "heal"), special);
  if (gained > 0 && toActor) spawnPopup(toActor.node, gained, "heal", "heal", special);
  refreshUnit(to);
  return true;
}

/**
 * スキル効果。type の名前がそのままスキル定義の type になる。
 * ctx は { caster, skill, side }。side は "ally" か "enemy"。
 * false を返すと不発で、クールダウンは消費しない。
 * 種類を足すときはここに関数を足し、SKILL_TYPES に表示名を足す。
 */

function cast(caster, skill, side) {
  const effect = effects[skill?.type];
  if (!effect) return false;
  const acted = effect({ caster, skill, side });
  if (!acted) return false;
  const actor = actors.get(caster.id);
  const striking = skill.type === "single" || skill.type === "aoe";
  const duration = skill.special ? 480 : 380;
  if (actor) {
    actor.node.classList.toggle("is-special-act", !!skill.special);
    actor.node.classList.add("is-acting");
    if (striking) actor.node.classList.add("is-strike");
    window.setTimeout(() => actor.node.classList.remove("is-acting", "is-special-act", "is-strike"), duration);
  }
  const card = cards.get(caster.id);
  if (card && striking) {
    card.root.classList.add("is-strike");
    window.setTimeout(() => card.root.classList.remove("is-strike"), duration);
  }
  return true;
}

function noteDamage(member) {
  const special = member.special;
  if (!special) return;
  const need = special.hits || 1;
  const next = Math.min(need, (fight.specialHits.get(member.id) || 0) + 1);
  fight.specialHits.set(member.id, next);
  syncSpecial(member);
}

function hpRatio(unit) {
  return unit?.maxHp > 0 ? unit.hp / unit.maxHp : 0;
}

function healNeed(member, skill) {
  const friends = living(battle.party);
  if (!friends.length || skill.type !== "heal") return 0;
  const mode = skill.target || "lowest";
  if (mode === "self") {
    const ratio = hpRatio(member);
    return ratio < 0.82 ? 1 - ratio : 0;
  }
  if (mode === "all") {
    const hurt = friends.filter((unit) => hpRatio(unit) < 0.85);
    if (hurt.length >= 2) return hurt.reduce((sum, unit) => sum + (1 - hpRatio(unit)), 0);
    return friends.some((unit) => hpRatio(unit) < 0.4) ? 1 : 0;
  }
  const lowest = lowestHp(friends);
  const ratio = hpRatio(lowest);
  return ratio < 0.75 ? 1 - ratio : 0;
}

function attackScore(skill) {
  if (skill.type !== "single" && skill.type !== "aoe") return 0;
  const foes = living(battle.enemies).length;
  if (skill.type === "aoe") return foes >= 2 ? foes : 0.35;
  return foes <= 2 ? 2.2 : 1;
}

function bestSpecial() {
  let best = null;
  living(battle.party).forEach((member) => {
    const special = member.special;
    if (!special) return;
    const need = special.hits || 1;
    if ((fight.specialHits.get(member.id) || 0) < need) return;
    if (special.type === "heal" && healNeed(member, special) <= 0) return;
    const score = special.type === "heal"
      ? healNeed(member, special)
      : attackScore(special) * resolvePower(member, special);
    if (!best || score > best.score) best = { member, score };
  });
  return best;
}

function autoChoice() {
  const ready = living(battle.party).filter((member) => (fight.allyCd.get(member.id) || 0) <= 0);
  let heal = null;
  let attack = null;
  ready.forEach((member) => {
    member.skills.forEach((skill, index) => {
      const need = healNeed(member, skill);
      if (need > (heal?.need || 0)) heal = { member, index, need };
      const score = attackScore(skill) * resolvePower(member, skill);
      if (score > (attack?.score || 0)) attack = { member, index, score };
    });
  });
  const critical = living(battle.party).some((unit) => hpRatio(unit) < 0.4);
  if (critical && heal) return heal;
  const special = bestSpecial();
  if (special) return { member: special.member, special: true };
  if (heal && attack) {
    fight.autoBias = fight.autoBias === "heal" ? "attack" : "heal";
    return fight.autoBias === "heal" ? heal : attack;
  }
  return heal || attack;
}

function playSkill(member, index) {
  if (fight.result || fight.paused || member.hp <= 0) return;
  if ((fight.allyCd.get(member.id) || 0) > 0) return;
  const skill = member.skills[index];
  if (!cast(member, skill, "ally")) return;

  fight.allyCd.set(member.id, skill.cooldown || ALLY_COOLDOWN);
  flashSkill(member, index);
  if (skill.type === "single" || skill.type === "aoe") noteDamage(member);
  gainRelic(skill.relic ?? RELIC_BY_TYPE[skill.type] ?? 8);
  syncMember(member);
  checkEnd();
}

function playSpecial(member) {
  if (fight.result || fight.paused || member.hp <= 0 || !member.special) return;
  const need = member.special.hits || 1;
  if ((fight.specialHits.get(member.id) || 0) < need) return;
  const skill = { ...member.special, special: true };
  if (!cast(member, skill, "ally")) return;
  fight.specialHits.set(member.id, 0);
  gainRelic(skill.relic ?? 16);
  syncMember(member);
  checkEnd();
}

function enemyAct() {
  if (fight.result) return;
  const enemies = living(battle.enemies);
  if (!enemies.length || !living(battle.party).length) return;
  const enemy = pick(enemies);
  if (!cast(enemy, enemy.skill, "enemy")) return;
  checkEnd();
}

function useSub() {
  if (fight.result || fight.paused || fight.relic < 100) return;
  const caster = living(battle.party)[0];
  const skill = rules().sub;
  if (!skill || !caster || !cast(caster, skill, "ally")) return;
  fight.relic = 0;
  syncRelic();
  checkEnd();
}

function gainRelic(amount) {
  fight.relic = Math.min(100, fight.relic + amount);
  syncRelic();
}

function syncEnemy(enemy) {
  const actor = actors.get(enemy.id);
  if (!actor) return;
  actor.fill.style.width = `${hpPercent(enemy.hp, enemy.maxHp)}%`;
  actor.node.classList.toggle("is-down", enemy.hp <= 0);
  actor.node.classList.toggle("is-selected", fight.targetId === enemy.id && enemy.hp > 0);
  actor.node.setAttribute("aria-pressed", fight.targetId === enemy.id && enemy.hp > 0 ? "true" : "false");
}

function syncMember(member) {
  const actor = actors.get(member.id);
  const card = cards.get(member.id);
  const pct = `${hpPercent(member.hp, member.maxHp)}%`;
  const cooling = (fight.allyCd.get(member.id) || 0) > 0;
  const locked = member.hp <= 0 || cooling || !!fight.result || fight.paused;
  if (actor) {
    actor.fill.style.width = pct;
    actor.node.classList.toggle("is-down", member.hp <= 0);
  }
  if (card) {
    card.fill.style.width = pct;
    card.hpText.textContent = formatHp(member.hp);
    card.root.classList.toggle("is-down", member.hp <= 0);
    card.skills.forEach((button) => {
      button.disabled = locked;
    });
    syncSpecial(member);
  }
}

function syncSpecial(member) {
  const card = cards.get(member.id);
  if (!card?.special) return;
  const need = member.special?.hits || 1;
  const have = fight.specialHits.get(member.id) || 0;
  const ready = have >= need && member.hp > 0 && !fight.result && !fight.paused;
  card.special.disabled = !ready;
  card.special.classList.toggle("is-ready", ready);
  card.specialCount.textContent = `${Math.min(have, need)}/${need}`;
}

function syncRelic() {
  fight.ui.relicFill.style.width = `${fight.relic}%`;
  fight.ui.relicValue.textContent = `${Math.floor(fight.relic)}%`;
  const ready = fight.relic >= 100 && !fight.result && !fight.paused;
  fight.ui.subBtn.disabled = !ready;
  fight.ui.subBtn.classList.toggle("is-ready", ready);
}

function updateClock() {
  fight.ui.timeLabel.textContent = formatClock(fight.clock);
}

function updateWave() {
  fight.ui.waveValue.textContent = formatWave();
}

function checkEnd() {
  if (fight.result) return;
  if (!living(battle.enemies).length) {
    if (battle.waveCurrent < battle.waveTotal) advanceWave();
    else finish("win");
  } else if (!living(battle.party).length) finish("lose");
  else if (!actors.get(fight.targetId) || actors.get(fight.targetId).unit.hp <= 0) {
    const next = living(battle.enemies)[0];
    if (next) selectTarget(next.id);
  }
}

function presentWave(wave) {
  battle.enemies.forEach((enemy) => {
    actors.get(enemy.id)?.node.remove();
    actors.delete(enemy.id);
  });
  battle.waveCurrent = wave;
  battle.enemies = structuredClone(battle.waves[wave - 1] || []);
  battle.enemies.forEach((enemy) => {
    bindVitals(enemy);
    fight.ui.enemyLine?.append(renderUnit(enemy, "enemy"));
  });
  fight.enemyCd = 0.45;
  fight.hold = 1.15;
  fight.targetId = defaultTargetId();
  selectTarget(fight.targetId);
  updateWave();
  announceWave();
}

function advanceWave() {
  presentWave(battle.waveCurrent + 1);
}

function announceWave() {
  const field = document.querySelector(".battle .field");
  if (!field) return;
  field.querySelector(".wave-call")?.remove();
  const banner = el("p", "wave-call");
  banner.append(
    el("span", "wave-call-title", `第${battle.waveCurrent}回戦`),
    el("span", "wave-call-sub", waveRoster(battle.enemies))
  );
  field.append(banner);
  banner.addEventListener("animationend", () => banner.remove());
}

function rewardXp(stage) {
  if (stage?.xp != null) return Math.max(0, Number(stage.xp));
  const reward = growthRules().reward || {};
  const recommend = Number(stage?.recommend ?? 0);
  const amount = Number(reward.base ?? 0) + recommend * Number(reward.perRecommend ?? 0);
  const mult = stage?.boss ? Number(reward.boss ?? 1) : 1;
  return Math.max(1, Math.round(amount * mult));
}

function growCharacter(character) {
  const rates = growthRules().growth || {};
  const fallback = Number(rates.all ?? 0.02);
  Object.keys(rules().stats || {}).forEach((key) => {
    const rate = Number(rates[key] ?? fallback);
    if (character.stats?.[key] != null) character.stats[key] = Math.round(Number(character.stats[key]) * (1 + rate));
    if (character.start?.[key] != null) character.start[key] = Math.round(Number(character.start[key]) * (1 + rate));
  });
  character.level = Number(character.level ?? 1) + 1;
}

function statSnapshot(character) {
  const stats = {};
  Object.keys(rules().stats || {}).forEach((key) => {
    if (character?.stats?.[key] != null) stats[key] = Number(character.stats[key]);
  });
  return stats;
}

function statGains(before, after) {
  return Object.keys(rules().stats || {}).map((key) => {
    const gain = Number(after?.[key] ?? 0) - Number(before?.[key] ?? 0);
    if (gain <= 0) return null;
    return { name: rules().stats[key].name || key, gain };
  }).filter(Boolean);
}

function grantXp(character, amount) {
  const before = Number(character.level ?? 1);
  const beforeStats = statSnapshot(character);
  const max = Number(growthRules().maxLevel ?? 99);
  const cap = Math.max(1, Number(growthRules().maxGain ?? 3));
  character.xp = Number(character.xp ?? 0) + amount;
  let gained = 0;
  while (character.level < max && character.xp >= xpNeed(character.level) && gained < cap) {
    character.xp -= xpNeed(character.level);
    growCharacter(character);
    gained += 1;
  }
  if (character.level >= max) character.xp = 0;
  const progress = xpProgress(character);
  return {
    before,
    after: progress.level,
    gained,
    xp: progress.xp,
    need: progress.need,
    maxed: progress.maxed,
    gains: statGains(beforeStats, character.stats),
  };
}

function awardVictory() {
  const amount = rewardXp(battle.rewardStage);
  return battle.party.map((member) => {
    const character = catalog.characters[member.id];
    if (!character) return null;
    return { id: member.id, name: character.name, amount, ...grantXp(character, amount) };
  }).filter(Boolean);
}

function playGrowth(reports) {
  reports.forEach((row, index) => {
    window.setTimeout(() => showGrowth(row), index * 120);
  });
}

function showGrowth(row) {
  const card = cards.get(row.id)?.root;
  const actor = actors.get(row.id)?.node;
  if (actor) actor.append(growthEffect(row, actor, false));
  if (card) card.append(growthEffect(row, card, true));
}

function growthEffect(row, node, detailed) {
  const fx = el("div", `growth${detailed ? " is-card" : " is-field"}${row.gained ? " is-level" : ""}`);
  const burst = el("span", "growth-burst");
  const ring = el("span", "growth-ring");
  const amount = el(
    "span",
    "growth-xp",
    row.maxed && !row.gained ? "経験値 最大" : `経験値 +${Number(row.amount).toLocaleString("ja-JP")}`
  );
  fx.append(burst, ring, amount);
  const meter = el("span", "growth-meter");
  const meterFill = el("span");
  const ratio = row.maxed || !row.need ? 1 : Math.max(0, Math.min(1, Number(row.xp) / Number(row.need)));
  meterFill.style.width = `${Math.round(ratio * 100)}%`;
  meter.append(meterFill);
  fx.append(meter);
  const sparks = row.gained ? 18 : 12;
  for (let index = 0; index < sparks; index += 1) {
    const spark = el("span", "growth-spark");
    spark.style.setProperty("--spin", `${(360 / sparks) * index}deg`);
    spark.style.setProperty("--reach", `${1.8 + (index % 3) * 0.7}cqi`);
    fx.append(spark);
  }
  if (row.gained) {
    node.classList.add("is-level");
    window.setTimeout(() => node.classList.remove("is-level"), 900);
  }
  if (detailed && row.gained) {
    const up = el("div", "growth-up");
    up.append(
      el("span", "growth-beam"),
      el("span", "growth-up-label", "レベルアップ"),
      el("span", "growth-up-level", `レベル ${row.before} → ${row.after}`)
    );
    fx.append(up);
    if (row.gains?.length) {
      const gains = el("div", "growth-gains");
      row.gains.forEach((gain, index) => {
        const line = el("span", "growth-gain", `${gain.name} +${gain.gain.toLocaleString("ja-JP")}`);
        line.style.animationDelay = `${0.12 + index * 0.07}s`;
        gains.append(line);
      });
      fx.append(gains);
    }
    const portrait = node.querySelector(".portrait");
    if (portrait) {
      fx.style.top = `${portrait.offsetTop + portrait.offsetHeight + 2}px`;
      fx.style.bottom = "auto";
    }
  }
  amount.addEventListener("animationend", (event) => {
    if (event.target !== amount) return;
    burst.remove();
    ring.remove();
    fx.querySelector(".growth-meter")?.remove();
    fx.querySelectorAll(".growth-spark").forEach((spark) => spark.remove());
    if (!detailed || !row.gained) fx.remove();
    else amount.remove();
  });
  return fx;
}

function stageOrder() {
  const draft = ensureDraft();
  const list = [];
  visibleChapters(draft).forEach((chapter) => {
    (chapter.stages || []).forEach((stage) => list.push({ chapter, stage }));
  });
  return list;
}

function nextStagePin() {
  const draft = ensureDraft();
  const list = stageOrder();
  const index = list.findIndex((item) => item.stage.id === draft.stageId || item.stage.battle === battle?.stageId);
  return list.slice(index + 1).find((item) => !item.stage.locked && item.stage.battle && catalog.stages?.[item.stage.battle]) || null;
}

function advanceStage() {
  const next = nextStagePin();
  if (next) {
    const draft = ensureDraft();
    draft.chapterId = next.chapter.id;
    draft.modeId = next.chapter.mode || draft.modeId;
    draft.stageId = next.stage.id;
  }
  openScreen("prepare");
}

function playOutcome(outcome) {
  const fx = el("div", `outcome-fx is-${outcome}`);
  const wash = el("div", "outcome-wash");
  const ring = el("div", "outcome-ring");
  fx.append(wash, ring);
  const win = outcome === "win";
  const rays = win ? 12 : 8;
  for (let index = 0; index < rays; index += 1) {
    const ray = el("span", "outcome-ray");
    ray.style.setProperty("--turn", `${(360 / rays) * index}deg`);
    ray.style.animationDelay = `${index * 0.02}s`;
    fx.append(ray);
  }
  const sparks = win ? 24 : 16;
  for (let index = 0; index < sparks; index += 1) {
    const spark = el("span", "outcome-spark");
    spark.style.left = `${6 + Math.random() * 88}%`;
    spark.style.top = `${4 + Math.random() * 88}%`;
    spark.style.setProperty("--drift", `${(Math.random() - 0.5) * 10}cqi`);
    spark.style.animationDelay = `${Math.random() * 0.28}s`;
    fx.append(spark);
  }
  wash.addEventListener("animationend", () => fx.remove());
  document.getElementById("stage").append(fx);
}

function finish(outcome) {
  if (fight.result) return;
  fight.result = outcome;
  battle.party.forEach(syncMember);
  syncRelic();
  playOutcome(outcome);

  const layer = el("div", `result result-${outcome}`);
  layer.append(el("p", "result-title", outcome === "win" ? "勝利" : "敗北"));
  if (outcome === "win" && !battle.rewarded) {
    battle.rewarded = true;
    playGrowth(awardVictory());
  }
  const actions = el("div", "result-actions");
  if (outcome === "win") {
    const forward = el("button", "result-again", "ステージ選択");
    forward.type = "button";
    forward.addEventListener("click", advanceStage);
    actions.append(forward);
  } else {
    const again = el("button", "result-again", "もう一度");
    again.type = "button";
    again.addEventListener("click", resetFight);
    actions.append(again);
    const back = el("button", "result-again", "編成へ");
    back.type = "button";
    back.addEventListener("click", () => openScreen("prepare"));
    actions.append(back);
  }
  layer.append(actions);
  document.getElementById("stage").append(layer);
}

function resetFight() {
  document.querySelector(".result")?.remove();
  document.querySelector(".outcome-fx")?.remove();
  fight.result = null;
  battle.rewarded = false;
  fight.paused = false;
  fight.clock = battle.time;
  fight.enemyCd = ENEMY_INTERVAL;
  fight.autoCd = AUTO_INTERVAL;
  fight.relic = battle.relic;
  fight.ui.pause.classList.remove("is-on");
  battle.party.forEach((member) => {
    member.hp = member.hpStart;
    fight.allyCd.set(member.id, 0);
    fight.specialHits.set(member.id, 0);
  });
  presentWave(1);
  updateClock();
  syncRelic();
  battle.party.forEach(syncMember);
}

function shockField(kind) {
  const field = document.querySelector("#stage .field");
  if (!field) return;
  const name = kind === "big" ? "is-shock-big" : kind === "wide" ? "is-shock-wide" : "is-shock";
  field.classList.remove("is-shock", "is-shock-big", "is-shock-wide");
  void field.offsetWidth;
  field.classList.add(name);
  const flash = el("div", `impact-flash ${name}`);
  field.append(flash);
  flash.addEventListener("animationend", () => flash.remove());
  window.setTimeout(() => field.classList.remove(name), kind === "big" ? 520 : 380);
}

function placeSlash(field, className, x, y, length, angle, element) {
  const slash = el("div", className);
  paintElement(slash, element);
  slash.style.left = `${x}px`;
  slash.style.top = `${y}px`;
  slash.style.width = `${length}px`;
  slash.style.setProperty("--ang", `${angle}rad`);
  field.append(slash);
  slash.addEventListener("animationend", () => slash.remove());
}

function fieldAim(field, fromNode, toNode) {
  const fieldBox = field.getBoundingClientRect();
  const from = fromNode.getBoundingClientRect();
  const to = toNode.getBoundingClientRect();
  const x1 = from.left + from.width / 2 - fieldBox.left;
  const y1 = from.top + from.height * 0.42 - fieldBox.top;
  const x2 = to.left + to.width / 2 - fieldBox.left;
  const y2 = to.top + to.height * 0.42 - fieldBox.top;
  return { x1, y1, x2, y2, length: Math.hypot(x2 - x1, y2 - y1), angle: Math.atan2(y2 - y1, x2 - x1) };
}

function paintLine(field, element, x, y, length, angle, kind, special) {
  const mark = kind === "heal" ? " is-heal" : `${kind ? ` fx-${kind}` : ""}${special ? " is-special" : ""}`;
  placeSlash(field, `slash slash-glow element-${element}${mark}`, x, y, length, angle, element);
  placeSlash(field, `slash element-${element}${mark}`, x, y, length, angle, element);
}

function after(count, gap, fn) {
  for (let index = 0; index < count; index += 1) window.setTimeout(() => fn(index), index * gap);
}

/**
 * 攻撃の見た目。スキルの fx がここの名前になる。
 * 足すときは関数を足し、スキル JSON の fx にその名前を書く。
 */

function spray(field, x, y, element, count) {
  const core = el("div", "fx-core");
  paintElement(core, element);
  core.style.left = `${x}px`;
  core.style.top = `${y}px`;
  field.append(core);
  core.addEventListener("animationend", () => core.remove());
  for (let index = 0; index < count; index += 1) {
    const bit = el("span", "fx-debris");
    paintElement(bit, element);
    bit.style.left = `${x}px`;
    bit.style.top = `${y}px`;
    bit.style.setProperty("--spin", `${(360 / count) * index}deg`);
    bit.style.setProperty("--len", `${1.4 + (index % 4) * 0.7}cqi`);
    field.append(bit);
    bit.addEventListener("animationend", () => bit.remove());
  }
}

function launchFx(fromNode, toNode, element, name, special) {
  const play = FX[name] || FX.shot;
  play(fromNode, toNode, element, special);
  if (name === "heal") return;
  const field = fromNode.closest(".field");
  if (!field || !toNode.isConnected) return;
  const aim = fieldAim(field, fromNode, toNode);
  const heavy = special || name === "rain" || name === "thick" || name === "pillar";
  spray(field, aim.x2, aim.y2, element, heavy ? 16 : 9);
}

function placeMuzzle(field, x, y, element, style) {
  const flash = el("div", `muzzle${style === "special" ? " is-special" : ""}`);
  paintElement(flash, element);
  flash.style.left = `${x}px`;
  flash.style.top = `${y}px`;
  field.append(flash);
  flash.addEventListener("animationend", () => flash.remove());
}

function placeCasing(field, x, y) {
  const casing = el("span", "casing");
  casing.style.left = `${x}px`;
  casing.style.top = `${y}px`;
  casing.style.setProperty("--kick", `${Math.random() < 0.5 ? -1 : 1}`);
  field.append(casing);
  casing.addEventListener("animationend", () => casing.remove());
}

function spawnPopup(node, amount, element, kind, special, heavy) {
  const fx = el("div", `hit-fx element-${element} popup-${kind}${special ? " is-special" : ""}${heavy ? " is-heavy" : ""}`);
  paintElement(fx, element);
  const text = kind === "heal" ? `+${formatHp(amount)}` : formatHp(amount);
  const number = el("span", kind === "heal" ? "hit-num is-heal" : "hit-num", text);
  fx.append(el("span", "hit-burst"), el("span", "hit-ring"), number);
  const sparks = kind === "heal" ? 6 : (special ? 22 : heavy ? 16 : 12);
  for (let index = 0; index < sparks; index += 1) {
    const spark = el("span", "hit-spark");
    spark.style.setProperty("--spin", `${(360 / sparks) * index}deg`);
    fx.append(spark);
  }
  node.append(fx);
  node.classList.add(special ? "is-hit-big" : (kind === "heal" ? "is-healed" : "is-hit"));
  number.addEventListener("animationend", () => fx.remove());
  window.setTimeout(() => node.classList.remove("is-hit", "is-healed", "is-hit-big"), special ? 560 : 440);
}

function renderField() {
  const field = el("section", "field");

  const allies = el("div", "line line-allies");
  battle.party.forEach((member) => allies.append(renderUnit(member, "ally")));

  const enemies = el("div", "line line-enemies");
  battle.enemies.forEach((enemy) => enemies.append(renderUnit(enemy, "enemy")));
  fight.ui.enemyLine = enemies;

  field.append(renderHud(), renderFieldTools(), allies, enemies);
  return field;
}

function renderCard(member) {
  const card = el("article", `card element-${member.element}`);
  paintElement(card, member.element);

  const portrait = slot(`assets/portraits/${look(member)}.png`, member.name);
  portrait.classList.add("portrait");

  const meta = el("div", "card-meta");
  const element = slot(
    `assets/icons/elements/${member.element}.png`,
    elementInfo(member.element).name
  );
  element.classList.add("element-icon");
  const hpText = el("span", "card-hp", formatHp(member.hp));
  meta.append(element, el("span", "card-name", member.name), hpText);

  const hp = el("div", "card-hpbar");
  const fill = el("span");
  fill.style.width = `${hpPercent(member.hp, member.maxHp)}%`;
  hp.append(fill);

  const skills = el("div", "skills");
  const buttons = [];
  member.skills.forEach((skill, index) => {
    const info = SKILL_TYPES[skill.type] || { label: "?", name: skill.type };
    const button = el("button", "skill");
    button.type = "button";
    button.dataset.skillType = skill.type;
    button.title = `${info.name} ${Math.round(resolvePower(member, skill))}`;
    button.setAttribute("aria-label", `${member.name}の${info.name}${index + 1}`);
    button.append(slot(`assets/skills/${member.id}/${index + 1}.png`, info.name || info.label));
    button.addEventListener("click", () => playSkill(member, index));
    buttons.push(button);
    skills.append(button);
  });

  let specialButton = null;
  let specialCount = null;
  if (member.special) {
    const info = SKILL_TYPES[member.special.type] || { name: member.special.type };
    specialButton = el("button", "special");
    specialButton.type = "button";
    specialButton.disabled = true;
    specialButton.title = `必殺 ${info.name} ${Math.round(resolvePower(member, member.special))} / ${member.special.hits}回`;
    specialButton.setAttribute("aria-label", `${member.name}の必殺技`);
    const icon = slot(`assets/skills/${member.id}/special.png`, "必");
    specialCount = el("span", "special-count", `0/${member.special.hits}`);
    specialButton.append(icon, specialCount);
    specialButton.addEventListener("click", () => playSpecial(member));
    skills.append(specialButton);
  }

  card.append(portrait, meta, hp, skills);
  cards.set(member.id, { root: card, hpText, fill, skills: buttons, special: specialButton, specialCount });
  return card;
}

function renderDock() {
  const dock = el("section", "dock");
  const party = el("div", "party");
  party.style.setProperty("--party-size", String(battle.party.length));
  battle.party.forEach((member) => party.append(renderCard(member)));

  const foot = el("footer", "foot");
  const relic = el("div", "relic");
  relic.append(el("span", "relic-label", "RELIC"));
  const track = el("div", "relic-track");
  const relicFill = el("span", "relic-fill");
  relicFill.style.width = `${fight.relic}%`;
  track.append(relicFill);
  const relicValue = el("span", "relic-value", `${fight.relic}%`);
  relic.append(track, relicValue);

  const subs = el("div", "subs");
  battle.party.forEach((member) => {
    const thumb = slot(`assets/portraits/${look(member)}.png`, member.name);
    thumb.classList.add("sub-thumb");
    paintElement(thumb, member.element);
    subs.append(thumb);
  });
  const subBtn = el("button", "sub-btn");
  subBtn.type = "button";
  subBtn.setAttribute("aria-label", "SUB");
  subBtn.append(slot("assets/ui/sub-mark.png", ""), el("span", "sub-label", "SUB"));
  subBtn.addEventListener("click", useSub);

  foot.append(relic, subs, subBtn);
  dock.append(party, foot);
  fight.ui.relicFill = relicFill;
  fight.ui.relicValue = relicValue;
  fight.ui.subBtn = subBtn;
  return dock;
}

function tick(now) {
  if (!fight.live) return;
  if (!tick.last) tick.last = now;
  const dt = Math.min(0.05, (now - tick.last) / 1000) * fight.speed;
  tick.last = now;

  if (!fight.paused && !fight.result) {
    fight.clock = Math.max(0, fight.clock - dt);
    updateClock();

    battle.party.forEach((member) => {
      const left = fight.allyCd.get(member.id) || 0;
      if (left > 0) fight.allyCd.set(member.id, Math.max(0, left - dt));
    });

    if (fight.hold > 0) {
      fight.hold = Math.max(0, fight.hold - dt);
    } else {
      if (fight.auto) {
        fight.autoCd -= dt;
        if (fight.autoCd <= 0) {
          fight.autoCd = AUTO_INTERVAL;
          const choice = autoChoice();
          if (choice?.special) playSpecial(choice.member);
          else if (choice) playSkill(choice.member, choice.index);
        }
      }

      fight.enemyCd -= dt;
      if (fight.enemyCd <= 0) {
        fight.enemyCd = ENEMY_INTERVAL;
        enemyAct();
      }
    }

    battle.party.forEach(syncMember);
  }

  requestAnimationFrame(tick);
}

function mount() {
  const stage = document.getElementById("stage");
  const view = el("section", "battle");
  view.append(backdrop(battle.background || "assets/backgrounds/battle.png"), renderField(), renderDock());
  stage.replaceChildren(view);
  selectTarget(fight.targetId);
  syncRelic();
  battle.party.forEach(syncMember);
  fight.live = true;
  announceWave();
  requestAnimationFrame(tick);
}

function beginBattle(setup) {
  actors.clear();
  cards.clear();
  fight.paused = false;
  fight.auto = true;
  fight.speed = 1;
  fight.result = null;
  fight.ui = {};
  fight.enemyCd = 0.45;
  fight.hold = 1.15;
  fight.autoCd = AUTO_INTERVAL;
  fight.allyCd = new Map();
  fight.specialHits = new Map();
  tick.last = 0;
  battle = buildBattle(catalog.characters, catalog.stages, setup);
  prepareUnits();
  mount();
}

screens.battle = function () {
  beginBattle(battleSetup());
};
