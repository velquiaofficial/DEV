/**
 * キャラ詳細。screens.character。
 */
function renderCharacter() {
  const view = hubView("character");
  const state = hubState();
  const ids = Object.keys(catalog.characters || {});
  if (!catalog.characters?.[state.characterId]) state.characterId = ids[0] || "";
  const character = catalog.characters?.[state.characterId];
  const board = el("div", "char-board");
  if (!character) {
    board.append(el("p", "detail-empty", "キャラがいません"), hubBack("home"));
    view.append(board);
    return view;
  }
  const art = slot(`assets/portraits/${character.image || state.characterId}.png`, character.name);
  art.classList.add("char-art");
  const body = withPlate(el("div", "char-body"), "assets/hub/ui/panel.png");
  paintElement(body, character.element);
  const progress = xpProgress(character);
  const roster = ids.map((id) => catalog.characters[id]);
  const maxOf = (key) => Math.max(...roster.map((item) => Number(item.stats?.[key] || 0)), 1);
  body.append(
    el("p", "char-kicker", elementInfo(character.element).name),
    el("h1", "char-name", character.name),
    el("p", "char-level", progress.maxed ? `レベル ${progress.level}  最大` : `レベル ${progress.level}`)
  );
  const xp = el("div", "char-xp");
  const xpFill = el("span");
  xpFill.style.width = `${progress.maxed || !progress.need ? 100 : Math.min(100, (progress.xp / progress.need) * 100)}%`;
  xp.append(xpFill);
  body.append(xp, el("p", "char-xp-label", progress.maxed ? "経験値 最大" : `経験値 ${progress.xp.toLocaleString("ja-JP")} / ${progress.need.toLocaleString("ja-JP")}`));

  const stats = el("div", "char-stats");
  Object.entries(rules().stats || {}).forEach(([key, info]) => {
    if (character.stats?.[key] == null) return;
    const value = Number(character.stats[key]);
    const row = el("div", "char-meter");
    const bar = el("span", "char-meter-bar");
    const fill = el("span");
    fill.style.width = `${Math.min(100, (value / maxOf(key)) * 100)}%`;
    bar.append(fill);
    row.append(el("span", "char-meter-label", info.name), bar, el("span", "char-meter-num", value.toLocaleString("ja-JP")));
    stats.append(row);
  });

  const skillRow = (skill, index, path, kind) => {
    const info = SKILL_TYPES[skill.type] || { label: "?", name: skill.type || "" };
    const row = el("div", `char-skill${kind ? ` is-${kind}` : ""}`);
    const icon = slot(path, info.name || info.label);
    icon.title = info.name;
    const copy = el("div", "char-skill-copy");
    const power = Math.round(resolvePower(character, skill));
    copy.append(
      el("strong", null, kind === "special" ? "必殺" : info.name),
      el("span", null, `${power.toLocaleString("ja-JP")}${skill.hits ? `  ×${skill.hits}` : ""}`)
    );
    row.append(icon, copy);
    return row;
  };
  const skills = el("div", "char-skills");
  (character.skills || []).forEach((skill, index) => {
    skills.append(skillRow(skill, index, `assets/skills/${state.characterId}/${index + 1}.png`));
  });
  if (character.special) skills.append(skillRow(character.special, 0, `assets/skills/${state.characterId}/special.png`, "special"));
  body.append(stats, skills, el("p", "char-profile", character.profile || "紹介文は characters.json の profile に書けます。"));
  body.append(hubBack("home"));

  const chips = el("div", "char-roster");
  ids.forEach((id) => {
    const item = catalog.characters[id];
    const button = withPlate(el("button", `roster-chip${id === state.characterId ? " is-in" : ""}`), "assets/hub/ui/card.png");
    button.type = "button";
    paintElement(button, item.element);
    button.append(
      slot(`assets/portraits/${item.image || id}.png`, item.name),
      el("span", null, item.name)
    );
    button.addEventListener("click", () => {
      state.characterId = id;
      openScreen("character");
    });
    chips.append(button);
  });
  board.append(art, body);
  view.append(board, chips);
  return view;
}

screens.character = function () {
  showHub(renderCharacter());
};
