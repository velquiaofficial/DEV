/**
 * 編成画面。screens.prepare。
 */
function selectText(key, fallback) {
  return catalog.chapters?.ui?.[key] || fallback;
}

function canDepart(draft) {
  const pin = findPin(draft.stageId);
  const party = draft.parties[draft.partyIndex] || [];
  return !!(pin && !pin.stage.locked && pin.stage.battle && catalog.stages?.[pin.stage.battle] && party.length);
}

function starText(stage) {
  const max = stage.starsMax ?? 3;
  const filled = Math.max(0, Math.min(max, Number(stage.stars ?? 0)));
  return `${"★".repeat(filled)}${"☆".repeat(Math.max(0, max - filled))}`;
}

function showSelect() {
  openScreen("prepare");
}

function selectSlot(index) {
  const draft = ensureDraft();
  draft.slot = index;
  showSelect();
}

function placeMember(id) {
  const draft = ensureDraft();
  const party = draft.parties[draft.partyIndex];
  const from = party.indexOf(id);
  const slot = Math.min(SELECT_PARTY - 1, Math.max(0, draft.slot ?? 0));
  if (from >= 0) {
    if (party[slot] && from !== slot) {
      const displaced = party[slot];
      party[slot] = id;
      party[from] = displaced;
    }
    draft.slot = party.indexOf(id);
  } else if (slot >= party.length) {
    party.push(id);
    draft.slot = party.length - 1;
  } else {
    party[slot] = id;
  }
  if (draft.detailId && !party.includes(draft.detailId)) draft.detailId = "";
  showSelect();
}

function runPartyAction(id) {
  const draft = ensureDraft();
  if (id === "auto") {
    draft.parties[draft.partyIndex] = Object.keys(catalog.characters).slice(0, SELECT_PARTY);
    showSelect();
  } else if (id === "reset") {
    draft.parties[draft.partyIndex] = [];
    showSelect();
  }
}

function depart() {
  if (!canDepart(ensureDraft())) return;
  openScreen("battle");
}

function renderSelect() {
  const draft = ensureDraft();
  syncSelection(draft);
  const ui = catalog.chapters?.ui || {};
  const pin = findPin(draft.stageId);
  const chapter = visibleChapters(draft).find((item) => item.id === draft.chapterId);
  const party = draft.parties[draft.partyIndex] || [];
  const view = el("section", "select");
  const background = backdrop("assets/select/bg.png");
  background.classList.add("select-bg");
  view.append(background, renderSelectTop(), renderSelectMain(draft, ui, chapter, pin, party));
  return view;
}

function renderSelectTop() {
  const ui = catalog.chapters?.ui || {};
  const top = el("header", "select-top");
  const logo = el("div", "select-logo");
  const mark = slot("assets/select/ui/logo.png", "紋");
  mark.classList.add("select-mark");
  const titles = el("div", "select-brand");
  titles.append(el("p", "select-logo-en", ui.logoEn || ""), el("p", "select-logo-ja", ui.logo || ""));
  logo.append(mark, titles);

  const tools = el("div", "select-tools");
  (catalog.wallet || []).forEach((currency) => {
    const chip = el("div", "wallet-chip");
    const icon = slot(`assets/icons/currencies/${currency.id}.png`, currency.mark || currency.id);
    chip.append(icon, el("span", "wallet-value", Number(currency.value || 0).toLocaleString("ja-JP")));
    const plus = chargeButton(currency.id);
    chip.append(plus);
    tools.append(chip);
  });
  ["mail", "gift"].forEach((name) => {
    const button = el("button", "select-icon");
    button.type = "button";
    button.disabled = true;
    button.append(slot(`assets/select/ui/${name}.png`, name));
    tools.append(button);
  });
  const menu = el("button", "select-icon");
  menu.type = "button";
  menu.setAttribute("aria-label", "メニュー");
  menu.append(slot("assets/select/ui/menu.png", "メニュー"));
  menu.addEventListener("click", () => openScreen("intro"));
  tools.append(menu);
  top.append(hubBack("home"), logo, tools);
  return top;
}

function renderSelectMain(draft, ui, chapter, pin, party) {
  const main = el("div", "select-main");
  main.append(renderBoard(draft, chapter), renderParty(draft, ui, pin, party));
  return main;
}

function departState(draft, pin) {
  const party = draft.parties[draft.partyIndex] || [];
  const power = party.reduce((sum, id) => sum + unitPower(catalog.characters[id]), 0);
  if (!pin) return { ready: false, tone: "blocked", note: "ステージを選んでください" };
  if (pin.stage.locked) return { ready: false, tone: "blocked", note: "まだ解放されていません" };
  if (!pin.stage.battle || !catalog.stages?.[pin.stage.battle]) {
    return { ready: false, tone: "blocked", note: "戦闘データが未接続です" };
  }
  if (!party.length) return { ready: false, tone: "blocked", note: "パーティが空です" };
  const recommend = pin.stage.recommend;
  if (recommend != null && power < Number(recommend)) {
    return {
      ready: true,
      tone: "short",
      note: `戦力 ${power.toLocaleString("ja-JP")} / 推奨 ${Number(recommend).toLocaleString("ja-JP")}`,
    };
  }
  const enough = recommend != null ? `推奨戦力 ${Number(recommend).toLocaleString("ja-JP")} を上回っています` : "出撃できます";
  return { ready: true, tone: "ready", note: enough };
}

function storyBook(chapterId) {
  return (catalog.story?.chapters || []).find((item) => item.id === chapterId) || null;
}

function stageStory(chapter, stage) {
  const book = storyBook(chapter?.id);
  if (!book || !stage) return [];
  const scene = storyLines(book.stages?.[stage.id]);
  const opening = chapter.stages?.[0]?.id === stage.id ? storyLines(book.lines) : [];
  return [...opening, ...scene];
}

function renderBoard(draft, chapter) {
  const board = withPlate(el("div", "select-board"), "assets/hub/ui/panel.png");
  board.append(el("p", "board-kicker", "メインストーリー"));

  const chapters = visibleChapters(draft);
  const tabs = el("div", "chapter-tabs");
  tabs.style.gridTemplateColumns = `repeat(${Math.max(chapters.length, 1)}, minmax(0, 1fr))`;
  chapters.forEach((item) => {
    const selected = item.id === draft.chapterId;
    const button = withPlate(el("button", `chapter-tab${selected ? " is-selected" : ""}`), `assets/select/chapters/${item.id}.png`);
    button.type = "button";
    button.append(el("span", "chapter-tab-index", item.label || ""), el("span", "chapter-tab-name", item.title || ""));
    button.addEventListener("click", () => {
      draft.chapterId = item.id;
      const still = (item.stages || []).some((stage) => stage.id === draft.stageId);
      if (!still) draft.stageId = item.stages?.[0]?.id || "";
      showSelect();
    });
    tabs.append(button);
  });

  const grid = el("div", "stage-grid");
  const pin = (chapter?.stages || []).find((stage) => stage.id === draft.stageId) || null;
  (chapter?.stages || []).forEach((stage, index) => {
    const selected = stage.id === draft.stageId;
    const button = withPlate(el("button", `stage-cell${selected ? " is-selected" : ""}${stage.boss ? " is-boss" : ""}${stage.locked ? " is-locked" : ""}`), stage.thumb || `assets/select/stages/${stage.id}.png`);
    button.type = "button";
    button.disabled = !!stage.locked;
    const mark = stage.boss ? "首領" : String(index + 1);
    button.append(el("span", "stage-no", mark), el("span", "stage-label", stage.name || stage.code || ""));
    button.addEventListener("click", () => {
      draft.stageId = stage.id;
      showSelect();
    });
    grid.append(button);
  });

  board.append(tabs, grid, renderStageStory(chapter, pin));
  return board;
}

function renderStageStory(chapter, stage) {
  const panel = withPlate(el("div", "story-panel"), "assets/hub/ui/dialogue.png");
  if (chapter) panel.append(el("p", "story-kicker", `${chapter.label || ""} ${chapter.title || ""}`.trim()));
  if (stage) panel.append(el("p", "story-title", stage.name || ""));
  const lines = stageStory(chapter, stage);
  if (!lines.length) {
    panel.append(el("p", "story-line", stage?.summary || "この場面の文は story.json に足せます"));
    return panel;
  }
  lines.forEach((line) => {
    const row = el("p", "story-line");
    if (line.who) row.append(el("span", "story-who", line.who));
    row.append(document.createTextNode(line.text));
    panel.append(row);
  });
  return panel;
}

function renderParty(draft, ui, pin, party) {
  const aside = withPlate(el("aside", "select-party"), "assets/hub/ui/panel.png");
  const head = el("div", "party-head");
  const title = el("div", "party-title");
  title.append(el("strong", "party-title-ja", ui.party || "パーティ編成"), el("span", "party-title-en", ui.partyEn || ""));
  const total = party.reduce((sum, id) => sum + unitPower(catalog.characters[id]), 0);
  head.append(title, el("p", "party-power", `${ui.power || "総戦力"} ${total.toLocaleString("ja-JP")}`));

  const tabs = el("div", "party-tabs");
  draft.parties.forEach((_, index) => {
    const tab = withPlate(el("button", `party-tab${index === draft.partyIndex ? " is-selected" : ""}`, `パーティ${index + 1}`), index === draft.partyIndex ? "assets/hub/ui/button-gold.png" : "assets/hub/ui/button.png");
    tab.type = "button";
    tab.addEventListener("click", () => {
      draft.partyIndex = index;
      showSelect();
    });
    tabs.append(tab);
  });
  const edit = slot("assets/select/ui/edit.png", "編");
  edit.classList.add("party-edit");
  tabs.append(edit);

  if (draft.detailId && !party.includes(draft.detailId)) draft.detailId = "";
  if (draft.slot == null || draft.slot < 0 || draft.slot >= SELECT_PARTY) draft.slot = 0;
  const cards = el("div", "party-cards");
  for (let index = 0; index < SELECT_PARTY; index += 1) {
    cards.append(renderPartyCard(party[index], ui, index, draft.detailId, draft.slot));
  }

  const roster = el("div", "select-roster");
  Object.entries(catalog.characters).forEach(([id, character]) => {
    const inside = party.includes(id);
    const chip = withPlate(el("button", `roster-chip${inside ? " is-in" : ""}`), "assets/hub/ui/card.png");
    chip.type = "button";
    chip.title = inside ? `${character.name}の枠` : `${character.name}を入れ替える`;
    chip.setAttribute("aria-label", chip.title);
    paintElement(chip, character.element);
    const face = slot(`assets/portraits/${character.image || id}.png`, character.name);
    chip.append(face, el("span", "bench-name", character.name));
    chip.addEventListener("click", () => placeMember(id));
    roster.append(chip);
  });

  const actions = el("div", "party-actions");
  (catalog.chapters?.partyActions || []).forEach((action) => {
    const button = withPlate(el("button", "party-action", action.label), "assets/hub/ui/button.png");
    button.type = "button";
    button.addEventListener("click", () => runPartyAction(action.id));
    actions.append(button);
  });

  aside.append(head, tabs, cards, el("p", "party-hint", "光っている枠と、下のキャラを入れ替えます"), roster, actions);
  if (draft.detailId) aside.append(renderMemberDetail(draft.detailId));
  aside.append(renderStageDetail(pin, ui));
  return aside;
}

function renderPartyCard(id, ui, index, detailId, chosen) {
  if (!id) {
    const empty = withPlate(el("button", `party-card is-empty${chosen === index ? " is-swap" : ""}`), "assets/hub/ui/card.png");
    empty.type = "button";
    empty.append(el("span", "party-empty", String(index + 1)));
    empty.addEventListener("click", () => selectSlot(index));
    return empty;
  }
  const character = catalog.characters[id];
  const card = withPlate(el("article", `party-card${detailId === id ? " is-open" : ""}${chosen === index ? " is-swap" : ""}`), "assets/hub/ui/card.png");
  card.addEventListener("click", () => selectSlot(index));
  paintElement(card, character.element);
  const portrait = slot(`assets/portraits/${character.image || id}.png`, character.name);
  portrait.classList.add("party-portrait");
  const name = el("span", "party-name", character.name);
  const progress = xpProgress(character);
  const level = el("span", "party-level", progress.maxed ? `レベル ${progress.level} 最大` : `レベル ${progress.level}`);
  const xp = el("span", "party-xp");
  const xpFill = el("span");
  xpFill.style.width = progress.need ? `${hpPercent(progress.xp, progress.need)}%` : "100%";
  xp.append(xpFill);
  const power = el("span", "party-card-power");
  const element = slot(`assets/icons/elements/${character.element}.png`, elementInfo(character.element).name);
  element.classList.add("party-element");
  power.append(element, el("span", null, unitPower(character).toLocaleString("ja-JP")));
  const skills = el("span", "party-skills");
  (character.skills || []).forEach((skill, skillIndex) => {
    const info = SKILL_TYPES[skill.type] || { label: "?", name: skill.type || "" };
    const icon = slot(`assets/skills/${id}/${skillIndex + 1}.png`, info.name || info.label);
    icon.title = info.name;
    skills.append(icon);
  });
  const detail = el("button", "party-detail", ui.detail || "詳細");
  detail.type = "button";
  detail.addEventListener("click", (event) => {
    event.stopPropagation();
    const draft = ensureDraft();
    draft.detailId = draft.detailId === id ? "" : id;
    draft.slot = index;
    showSelect();
  });
  card.append(portrait, name, level, xp, power, skills, detail);
  return card;
}

function renderMemberDetail(id) {
  const character = catalog.characters[id];
  const box = el("div", "member-detail");
  paintElement(box, character.element);
  const head = el("div", "member-detail-head");
  head.append(
    el("strong", "member-detail-name", character.name),
    el("span", "member-detail-element", elementInfo(character.element).name)
  );
  const bits = el("p", "member-stats");
  Object.entries(rules().stats || {}).forEach(([key, info]) => {
    if (character.stats?.[key] == null) return;
    const max = character.stats[key];
    const opening = character.start?.[key];
    const text = opening != null && Number(opening) !== Number(max) ? `${opening}/${max}` : String(max);
    bits.append(el("span", "member-stat", `${info.name} ${text}`));
  });
  const progress = xpProgress(character);
  bits.append(el("span", "member-stat", progress.maxed ? "経験値 最大" : `経験値 ${progress.xp}/${progress.need}`));
  box.append(head, bits);
  return box;
}

function enemyVitals(enemy) {
  const max = Number(enemy.stats?.hp ?? enemy.maxHp ?? enemy.hp ?? 0);
  const current = Math.min(max, Number(enemy.start?.hp ?? enemy.hp ?? max));
  return { current, max };
}

function renderStageDetail(pin, ui) {
  const detail = el("div", "stage-detail");
  if (!pin) {
    detail.append(el("p", "detail-empty", "ステージを選ぶ"));
    return detail;
  }
  const stage = pin.stage;
  const battle = stage.battle ? catalog.stages?.[stage.battle] : null;
  const thumb = slot(stage.thumb || `assets/select/stages/${stage.id}.png`, stage.name);
  thumb.classList.add("detail-thumb");
  const body = el("div", "detail-body");
  body.append(el("p", "detail-name", `${stage.code || ""} ${stage.name}`.trim()));
  if (stage.recommend != null) {
    body.append(el("p", "detail-recommend", `${ui.recommend || "推奨戦力"} ${Number(stage.recommend).toLocaleString("ja-JP")}`));
  }
  if (stage.summary) body.append(el("p", "detail-summary", stage.summary));
  if (battle?.wave?.total) body.append(el("p", "detail-waves", `${battle.wave.total}回戦`));
  const waves = battle ? planWaves(battle, catalog.stages, stage.battle) : [];
  const state = departState(ensureDraft(), pin);
  const go = renderDepart(stage, state, ui);
  const head = el("div", "detail-head");
  head.append(thumb, body, go);
  detail.append(head);
  if (waves.length) {
    detail.append(el("p", "detail-label", "回戦"));
    detail.append(renderWavePlan(waves));
  }
  detail.append(el("p", "detail-label", ui.enemies || "主な敵"));
  if (battle?.enemies?.length) detail.append(renderEnemyRoster(battle.enemies));
  else detail.append(el("p", "detail-empty", "このステージには敵データがありません"));
  if (stage.drops?.length) {
    detail.append(el("p", "detail-label", ui.drops || "ドロップ報酬"));
    const drops = el("div", "icon-row");
    stage.drops.forEach((drop) => {
      const id = typeof drop === "string" ? drop : drop.id;
      const label = typeof drop === "string" ? drop : drop.label || drop.id;
      drops.append(slot(`assets/select/drops/${id}.png`, label));
    });
    detail.append(drops);
  }
  return detail;
}

function renderDepart(stage, state, ui) {
  const go = withPlate(el("button", `depart-btn is-${state.tone}`), "assets/hub/ui/button-gold.png");
  go.type = "button";
  go.disabled = !state.ready;
  const mark = slot("assets/select/ui/depart.png", "");
  mark.classList.add("depart-mark");
  const face = el("span", "depart-face");
  face.append(mark, el("span", "depart-swords"), el("span", "depart-label", ui.depart || "出撃"));
  if (stage.cost != null) face.append(el("span", "depart-cost", `-${stage.cost}`));
  go.append(face, el("span", "depart-note", state.note));
  go.addEventListener("click", depart);
  return go;
}

function renderWavePlan(waves) {
  const box = el("div", "wave-plan");
  waves.forEach((group, index) => {
    const row = el("div", "wave-row");
    row.append(el("span", "wave-row-label", `第${index + 1}回戦`));
    row.append(el("span", "wave-row-names", waveRoster(group)));
    box.append(row);
  });
  return box;
}

function renderEnemyRoster(enemies) {
  const list = el("div", "enemy-list");
  enemies.forEach((enemy) => {
    const boss = isBoss(enemy) || Number(enemy.scale) >= 1.5;
    const card = el("article", `enemy-card${boss ? " is-boss" : ""}`);
    paintElement(card, enemy.element);
    const face = slot(`assets/sprites/${look(enemy)}.png`, "");
    face.classList.add("enemy-face");
    const name = el("span", "enemy-name", enemy.name);
    const meta = el("span", "enemy-meta");
    meta.append(el("span", "enemy-element", elementInfo(enemy.element).name));
    if (boss) meta.append(el("span", "enemy-role", "首領"));
    const skill = SKILL_TYPES[enemy.skill?.type];
    if (skill) meta.append(el("span", "enemy-skill", skill.name));
    const vitals = enemyVitals(enemy);
    const bar = el("span", "enemy-hp");
    const fill = el("span");
    fill.style.width = `${hpPercent(vitals.current, vitals.max)}%`;
    bar.append(fill);
    const numbers = el("span", "enemy-hp-text", `${vitals.current.toLocaleString("ja-JP")} / ${vitals.max.toLocaleString("ja-JP")}`);
    const atk = enemy.stats?.atk;
    card.append(face, name, meta, bar, numbers);
    if (atk != null) card.append(el("span", "enemy-atk", `攻撃 ${Number(atk).toLocaleString("ja-JP")}`));
    list.append(card);
  });
  return list;
}

screens.prepare = function () {
  document.getElementById("stage").replaceChildren(renderSelect());
};
