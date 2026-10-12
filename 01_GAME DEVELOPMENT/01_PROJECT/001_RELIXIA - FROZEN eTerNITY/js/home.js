/**
 * ホーム。screens.home。
 */
function renderHome() {
  const spec = hubSpec("home");
  const view = hubView("home");
  const draft = ensureDraft();
  const party = draft.parties?.[draft.partyIndex] || [];
  const lead = party[0];
  const leadChar = catalog.characters?.[lead];
  const pin = findPin(draft.stageId);
  const progress = leadChar ? xpProgress(leadChar) : null;
  const power = party.reduce((sum, id) => sum + (catalog.characters?.[id] ? unitPower(catalog.characters[id]) : 0), 0);

  const top = el("header", "home-top");
  const player = slot(spec.player || "assets/hub/home/player.png", leadChar?.name || "顔");
  player.classList.add("home-player");
  const who = el("div", "home-who");
  who.append(
    el("span", "home-player-name", leadChar?.name || ""),
    el("span", "home-rank", progress ? `レベル ${progress.level}` : "")
  );
  const stamina = el("div", "home-stamina");
  const [now, max] = String(spec.stamina || "0/0").split("/");
  const gauge = el("span", "home-stamina-bar");
  const fill = el("span");
  const maxAp = Number(max) || 0;
  fill.style.width = `${maxAp ? Math.min(100, (Number(now) / maxAp) * 100) : 0}%`;
  gauge.append(fill);
  stamina.append(el("span", "home-stamina-label", "スタミナ"), gauge, el("span", null, spec.stamina || ""));
  top.append(player, who, stamina, hubWallet("home-wallet"));

  const hero = slot([
    lead ? `assets/hub/home/${leadChar?.image || lead}.png` : "",
    spec.hero || "assets/hub/home/hero.png"
  ], "");
  hero.classList.add("home-hero");
  if (leadChar) paintElement(hero, leadChar.element);
  hero.addEventListener("click", () => {
    hubState().characterId = lead || Object.keys(catalog.characters || {})[0] || "";
    openScreen("character");
  });

  const plate = withPlate(el("div", "home-plate"), "assets/hub/ui/card.png");
  if (leadChar) paintElement(plate, leadChar.element);
  plate.append(
    el("p", "home-hero-name", leadChar?.name || ""),
    el("p", "home-power", `総戦力 ${power.toLocaleString("ja-JP")}`)
  );

  const quest = withPlate(el("button", "home-quest"), "assets/hub/ui/banner.png");
  quest.type = "button";
  quest.append(
    el("span", "home-quest-kicker", pin?.chapter?.label || "出撃"),
    el("strong", "home-quest-title", pin?.chapter?.title || ""),
    el("span", "home-quest-stage", pin?.stage ? `${pin.stage.code || ""}  ${pin.stage.name || ""}`.trim() : "")
  );
  quest.addEventListener("click", () => openScreen("prepare"));

  const side = el("div", "home-side");
  (spec.side || []).forEach((item) => {
    const button = hubGo(item.label, item.screen, "home-side-btn");
    button.prepend(slot(item.icon || `assets/hub/home/side-${item.screen}.png`, ""));
    side.append(button);
  });

  const strip = el("div", "home-party");
  party.forEach((id) => {
    const character = catalog.characters?.[id];
    if (!character) return;
    const card = withPlate(el("button", "home-party-card"), "assets/hub/ui/card.png");
    card.type = "button";
    paintElement(card, character.element);
    const face = slot(`assets/portraits/${character.image || id}.png`, character.name);
    card.append(face, el("span", null, character.name));
    card.addEventListener("click", () => {
      hubState().characterId = id;
      openScreen("character");
    });
    strip.append(card);
  });

  const nav = el("nav", "home-nav");
  (spec.nav || []).forEach((item) => {
    const button = hubGo(item.label, item.screen, `home-nav-btn${item.primary ? " is-primary" : ""}`);
    button.prepend(slot(item.icon || `assets/hub/home/nav-${item.screen}.png`, ""));
    nav.append(button);
  });
  view.append(top, hero, plate, quest, side, strip, nav);
  return view;
}

screens.home = function () {
  showHub(renderHome());
};
