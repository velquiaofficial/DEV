/**
 * ミッション、図鑑、フレンド、設定。screens.extra。
 */
function renderExtra() {
  const spec = hubSpec("extra");
  const view = hubView("extra");
  const state = hubState();
  if (!state.config) state.config = {};
  const menus = spec.menus || [];
  if (!menus.some((item) => item.id === state.extra)) state.extra = menus[0]?.id || "";
  const nav = el("div", "extra-nav");
  menus.forEach((item) => {
    const button = withPlate(el("button", `extra-menu${item.id === state.extra ? " is-on" : ""}`, item.label), item.id === state.extra ? "assets/hub/ui/button-gold.png" : "assets/hub/ui/button.png");
    button.type = "button";
    const icon = slot(`assets/hub/extra/${item.id}.png`, "");
    button.prepend(icon);
    button.addEventListener("click", () => {
      state.extra = item.id;
      openScreen("extra");
    });
    nav.append(button);
  });
  const panel = withPlate(el("div", "extra-panel"), "assets/hub/ui/panel.png");
  panel.append(el("h1", "extra-title", menus.find((item) => item.id === state.extra)?.label || ""));
  if (state.extra === "codex") {
    const list = el("div", "extra-codex");
    Object.entries(catalog.characters || {}).forEach(([id, character]) => {
      const card = withPlate(el("button", "extra-codex-card"), "assets/hub/ui/card.png");
      card.type = "button";
      paintElement(card, character.element);
      const progress = xpProgress(character);
      card.append(
        slot(`assets/portraits/${character.image || id}.png`, character.name),
        el("span", "extra-codex-name", character.name),
        el("span", "extra-codex-meta", `${elementInfo(character.element).name}  レベル ${progress.level}`)
      );
      card.addEventListener("click", () => {
        hubState().characterId = id;
        openScreen("character");
      });
      list.append(card);
    });
    panel.append(list);
  } else if (state.extra === "friend") {
    (spec.friends || []).forEach((friend) => {
      const row = withPlate(el("div", "extra-row"), "assets/hub/ui/card.png");
      const copy = el("div", "extra-copy");
      copy.append(el("strong", null, friend.name || ""), el("span", "extra-note", friend.note || ""));
      row.append(slot(`assets/hub/extra/friends/${friend.id}.png`, friend.name), copy, el("span", "extra-progress", friend.rank || ""));
      panel.append(row);
    });
  } else if (state.extra === "config") {
    (spec.settings || []).forEach((setting) => {
      const values = setting.values || [setting];
      const label = setting.label || setting;
      const id = setting.id || label;
      const index = Number(state.config[id] || 0) % values.length;
      const row = withPlate(el("button", "extra-row extra-setting"), "assets/hub/ui/card.png");
      row.type = "button";
      row.append(el("span", null, label), el("span", "extra-progress", values[index] || ""));
      row.addEventListener("click", () => {
        state.config[id] = (index + 1) % values.length;
        openScreen("extra");
      });
      panel.append(row);
    });
  } else {
    (spec.missions || []).forEach((mission) => {
      const parts = String(mission.progress || "0/1").split("/");
      const done = Number(parts[0]) || 0;
      const total = Number(parts[1]) || 0;
      const row = withPlate(el("div", "extra-row extra-mission"), "assets/hub/ui/card.png");
      const bar = el("span", "extra-bar");
      const fill = el("span");
      fill.style.width = `${total ? Math.min(100, (done / total) * 100) : 0}%`;
      bar.append(fill);
      const copy = el("div", "extra-copy");
      copy.append(el("span", null, mission.name || ""), bar);
      row.append(copy, el("span", "extra-progress", mission.progress || ""));
      panel.append(row);
    });
  }
  panel.append(hubBack("home"));
  view.append(nav, panel);
  return view;
}

screens.extra = function () {
  showHub(renderExtra());
};
