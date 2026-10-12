/**
 * タイトル画面。screens.intro。
 */
function renderTitle() {
  const spec = hubSpec("title");
  const view = hubView("title");
  const portrait = slot(spec.portrait || "assets/hub/title/hero.png", "立ち絵");
  portrait.classList.add("title-hero");
  const copy = el("div", "title-copy");
  const logo = slot(spec.logo || "assets/hub/title/logo.png", "紋");
  logo.classList.add("title-logo");
  copy.append(
    logo,
    el("p", "title-kicker", spec.kicker || ""),
    el("h1", "title-ja", spec.title || ""),
    el("p", "title-en", spec.english || ""),
    el("p", "title-tag", spec.tagline || "")
  );
  const actions = el("div", "title-actions");
  (spec.actions || []).forEach((action) => {
    const button = el("button", "title-btn");
    button.type = "button";
    button.append(el("span", "title-btn-label", action.label || ""), el("span", "title-btn-note", action.note || ""));
    withPlate(button, action.screen === "battle" ? "assets/hub/ui/button-gold.png" : "assets/hub/ui/button.png");
    button.addEventListener("click", () => openScreen(action.screen));
    actions.append(button);
  });
  view.append(portrait, copy, actions, el("p", "title-foot", spec.foot || ""));
  return view;
}

screens.intro = function () {
  showHub(renderTitle());
};
