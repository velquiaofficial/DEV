/**
 * ログインとお知らせ。screens.login。
 */
function renderLogin() {
  const spec = hubSpec("login");
  const view = hubView("login");
  const portrait = slot(spec.portrait || "assets/hub/login/hero.png", "立ち絵");
  portrait.classList.add("login-hero");
  const board = withPlate(el("div", "login-board"), "assets/hub/ui/panel.png");
  const head = el("div", "login-head");
  head.append(el("p", "login-kicker", "DAILY"), el("h1", "login-heading", spec.heading || ""));
  const days = el("div", "login-days");
  (spec.days || []).forEach((day, index) => {
    const last = index === (spec.days.length - 1);
    const cell = withPlate(el("div", `login-day${index === 0 ? " is-today" : ""}${last ? " is-last" : ""}`), "assets/hub/ui/card.png");
    const icon = slot(`assets/hub/login/${day.item}.png`, day.item || "");
    const dayLabel = index === 0 ? "本日" : (last ? "最終日" : `${day.label || index + 1}日`);
    cell.append(el("span", "login-day-label", dayLabel), icon);
    days.append(cell);
  });
  const notices = el("div", "login-notices");
  (spec.notices || []).forEach((notice, index) => {
    const row = withPlate(el("article", "login-notice"), "assets/hub/ui/banner.png");
    const art = slot(notice.image || `assets/hub/login/notice-${index + 1}.png`, "");
    art.classList.add("login-notice-art");
    const title = el("strong", "login-notice-title", notice.title || "");
    if (notice.tag) title.prepend(el("span", "login-tag", notice.tag));
    row.append(art, title, el("p", "login-notice-body", notice.body || ""));
    notices.append(row);
  });
  board.append(head, days, notices, hubGo(spec.claim || "受け取る", spec.next || "home", "hub-btn is-primary"));
  view.append(portrait, board);
  return view;
}

screens.login = function () {
  showHub(renderLogin());
};
