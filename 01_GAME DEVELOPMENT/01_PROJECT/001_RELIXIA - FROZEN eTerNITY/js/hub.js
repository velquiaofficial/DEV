/**
 * 拠点画面の共通部品。背景、ボタン、画面の状態。
 */
function showHub(view) {
  document.getElementById("stage").replaceChildren(view);
}

function hubState() {
  if (!catalog.hubState) {
    catalog.hubState = { line: 0, characterId: "", shopTab: 0, extra: "mission", gachaBanner: 0, gachaPage: 0, gachaSheet: "", gachaPicks: [], gachaLog: [], log: false };
  }
  return catalog.hubState;
}

function hubSpec(name) {
  return catalog.hub?.[name] || {};
}

function hubView(name) {
  const view = el("section", `hub hub-${name}`);
  const background = backdrop(hubSpec(name).background || `assets/hub/${name}/bg.png`);
  background.classList.add("hub-bg");
  view.append(background, el("div", "hub-shade"));
  return view;
}

function hubGo(label, screen, className) {
  const button = el("button", className || "hub-btn", label);
  button.type = "button";
  const primary = String(className || "").includes("is-primary");
  withPlate(button, primary ? "assets/hub/ui/button-gold.png" : "assets/hub/ui/button.png");
  button.addEventListener("click", () => openScreen(screen));
  return button;
}

function hubBack(screen) {
  return hubGo("戻る", screen || "home", "hub-back");
}

function chargeButton(currencyId) {
  const plus = el("button", "wallet-plus", "+");
  plus.type = "button";
  plus.setAttribute("aria-label", "購入");
  plus.addEventListener("click", (event) => {
    event.stopPropagation();
    openCharge(currencyId);
  });
  return plus;
}

function openCharge(currencyId) {
  document.querySelector(".charge")?.remove();
  const spec = hubSpec("charge");
  const groups = spec.groups || [];
  const offers = spec.offers || [];
  let current = groups.some((group) => group.id === currencyId) ? currencyId : (groups[0]?.id || "");
  let picked = null;
  const layer = withPlate(el("div", "charge"), "assets/hub/ui/panel.png");
  const paint = () => {
    const plate = layer.querySelector(".hub-plate");
    layer.replaceChildren();
    if (plate) layer.append(plate);
    const banner = slot(spec.banner || "assets/hub/charge/banner.png", "");
    banner.classList.add("charge-banner");
    const title = el("h2", "charge-title", spec.title || "購入");
    const tabs = el("div", "charge-tabs");
    groups.forEach((group) => {
      const tab = el("button", `hub-btn${group.id === current ? " is-primary" : ""}`, group.label || "");
      tab.type = "button";
      tab.addEventListener("click", () => {
        current = group.id;
        picked = null;
        paint();
      });
      tabs.append(tab);
    });
    const body = el("div", "charge-body");
    if (picked) {
      const icon = slot(picked.image || `assets/hub/charge/${picked.id}.png`, "");
      icon.classList.add("charge-art");
      const copy = el("div", "charge-confirm");
      copy.append(
        el("strong", "charge-name", picked.name || ""),
        el("span", "charge-note", picked.note || ""),
        el("span", "charge-price", picked.price || ""),
        el("p", "charge-note", spec.note || "")
      );
      const buy = el("button", "hub-btn is-primary", spec.buy || "購入する");
      buy.type = "button";
      buy.addEventListener("click", () => layer.remove());
      const back = el("button", "hub-btn", spec.back || "商品へ戻る");
      back.type = "button";
      back.addEventListener("click", () => {
        picked = null;
        paint();
      });
      body.append(icon, copy, buy, back);
    } else {
      const grid = el("div", "charge-grid");
      offers.filter((offer) => offer.group === current).forEach((offer) => {
        const card = withPlate(el("button", "charge-card"), "assets/hub/ui/card.png");
        card.type = "button";
        const icon = slot(offer.image || `assets/hub/charge/${offer.id}.png`, "");
        icon.classList.add("charge-icon");
        card.append(
          icon,
          el("strong", "charge-name", offer.name || ""),
          el("span", "charge-note", offer.note || ""),
          el("span", "charge-price", offer.price || "")
        );
        card.addEventListener("click", () => {
          picked = offer;
          paint();
        });
        grid.append(card);
      });
      body.append(grid);
    }
    const close = el("button", "hub-btn", spec.close || "閉じる");
    close.type = "button";
    close.addEventListener("click", () => layer.remove());
    layer.append(banner, title, tabs, body, close);
  };
  paint();
  document.getElementById("stage").append(layer);
}

function hubWallet(className) {
  const row = el("div", className || "hub-wallet");
  (catalog.wallet || []).forEach((currency) => {
    const chip = el("span", "hub-chip");
    chip.append(
      slot(`assets/icons/currencies/${currency.id}.png`, currency.mark || ""),
      el("span", null, Number(currency.value || 0).toLocaleString("ja-JP")),
      chargeButton(currency.id)
    );
    row.append(chip);
  });
  return row;
}
