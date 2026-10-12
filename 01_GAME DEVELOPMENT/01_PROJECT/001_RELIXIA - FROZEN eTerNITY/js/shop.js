/**
 * ショップ。screens.shop。
 */
function renderShop() {
  const spec = hubSpec("shop");
  const view = hubView("shop");
  const state = hubState();
  const tabs = spec.tabs || [];
  if (state.shopTab >= tabs.length) state.shopTab = 0;
  const head = el("header", "shop-head");
  head.append(el("h1", "shop-title", "ショップ"), hubWallet());
  const bar = el("div", "shop-tabs");
  tabs.forEach((tab, index) => {
    const button = el("button", `hub-btn${index === state.shopTab ? " is-primary" : ""}`, tab.label);
    button.type = "button";
    button.addEventListener("click", () => {
      state.shopTab = index;
      openScreen("shop");
    });
    bar.append(button);
  });
  const goods = el("div", "shop-goods");
  (tabs[state.shopTab]?.goods || []).forEach((item, index) => {
    const card = withPlate(el("article", `shop-card${index === 0 ? " is-lead" : ""}`), "assets/hub/ui/card.png");
    const icon = slot(`assets/hub/shop/${item.id}.png`, "");
    icon.classList.add("shop-icon");
    card.append(
      icon,
      el("strong", "shop-name", item.name || ""),
      el("span", "shop-note", item.note || ""),
      el("span", "shop-price", item.price || ""),
      el("span", "hub-btn", "購入")
    );
    goods.append(card);
  });
  const board = el("div", "shop-board");
  board.append(head, bar, goods, hubBack("home"));
  view.append(board);
  return view;
}

screens.shop = function () {
  showHub(renderShop());
};
