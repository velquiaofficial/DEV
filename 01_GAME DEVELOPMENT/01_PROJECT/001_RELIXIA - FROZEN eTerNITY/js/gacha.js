/**
 * ガチャ。screens.gacha。
 * 絵は assets/hub/gacha に置くと、枠の文字が消えて絵になる。
 */
function gachaData() {
  return catalog.gacha || {};
}

function gachaSpec() {
  return { ...hubSpec("gacha"), ...gachaData() };
}

function gachaBanners() {
  return gachaData().banners || [];
}

function gachaRarity(id) {
  const key = String(id || "");
  const list = gachaData().rarities || [];
  return list.find((item) => item.id === key || item.label === key) || {
    id: key,
    label: key,
    high: false,
    frame: `assets/hub/gacha/frame-${key.toLowerCase()}.png`,
  };
}

function gachaFrame(rarity) {
  return gachaRarity(rarity).frame;
}

function gachaPath(banner, key, folder) {
  if (banner?.[key]) return banner[key];
  return banner?.id ? `assets/hub/gacha/${folder}/${banner.id}.png` : "";
}

function gachaPeriod(banner) {
  if (banner?.period) return banner.period;
  const words = gachaData().words || {};
  const label = banner?.periodLabel ?? words.period ?? "";
  if (banner?.starts && banner?.ends) return `${label}  ${banner.starts} ${words.until || "〜"} ${banner.ends}`.trim();
  return label;
}

function gachaLineup(banner) {
  return banner?.lineup || banner?.pool || [];
}

function currentBanner() {
  const banners = gachaBanners();
  const state = hubState();
  if (state.gachaBanner == null || state.gachaBanner >= banners.length) state.gachaBanner = 0;
  return banners[state.gachaBanner] || {};
}

function gachaCharacter(id) {
  return catalog.characters?.[id] || null;
}

function choosePull(pool) {
  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function summonBanner(count) {
  const banner = currentBanner();
  const pool = gachaLineup(banner);
  const picks = [];
  for (let index = 0; index < count; index += 1) picks.push(choosePull(pool));
  if (count >= 10 && banner.pity) {
    const high = pool.filter((entry) => gachaRarity(entry.rarity).high);
    const hasHigh = picks.some((entry) => entry && gachaRarity(entry.rarity).high);
    if (!hasHigh && high.length) picks[picks.length - 1] = choosePull(high);
  }
  const state = hubState();
  state.gachaPicks = picks.filter(Boolean);
  state.gachaLog = [{ banner: banner.name || "", count, picks: state.gachaPicks.map((entry) => entry.id) }, ...(state.gachaLog || [])].slice(0, 12);
  state.gachaSheet = "result";
  openScreen("gacha");
}

function renderGachaCard(entry, large, sealed) {
  const character = gachaCharacter(entry?.id);
  const rarity = gachaRarity(entry?.rarity);
  const card = withPlate(el("div", `gacha-card${large ? " is-large" : ""}${sealed ? " is-sealed is-deal" : ""}${rarity.shine ? " is-rare" : ""}`), gachaFrame(entry?.rarity));
  const face = slot(
    character ? `assets/portraits/${character.image || entry.id}.png` : `assets/portraits/${entry?.id || "unknown"}.png`,
    character?.name || entry?.id || ""
  );
  face.classList.add("gacha-card-face");
  card.append(
    face,
    el("span", "gacha-card-rarity", rarity.label || ""),
    el("span", "gacha-card-name", character?.name || "")
  );
  if (sealed) {
    const back = slot("assets/hub/gacha/fx/back.png", "");
    back.classList.add("gacha-card-back");
    card.append(back);
    card.addEventListener("animationend", (event) => {
      if (event.target === card) card.classList.remove("is-sealed");
    });
  }
  return card;
}

function renderSummonPlay(picks) {
  const rarities = gachaData().rarities || [];
  const glow = rarities.find((item) => item.glow && picks.some((entry) => gachaRarity(entry.rarity).id === item.id))?.glow || "";
  const play = el("div", `gacha-play${glow ? ` is-${glow}` : ""}`);
  const orb = slot("assets/hub/gacha/fx/orb.png", "");
  orb.classList.add("gacha-orb");
  play.append(el("div", "gacha-wash"), orb);
  for (let index = 0; index < 12; index += 1) {
    const ray = el("span", "gacha-ray");
    ray.style.setProperty("--turn", `${(360 / 12) * index}deg`);
    play.append(ray);
  }
  return play;
}

function finishSummon(play, grid, skip) {
  play?.remove();
  skip?.remove();
  grid?.querySelectorAll(".gacha-card").forEach((card) => {
    card.style.animation = "none";
    card.style.opacity = "1";
    card.classList.remove("is-sealed", "is-deal");
  });
}

function renderGachaTop(spec) {
  const top = el("header", "gacha-top");
  const brand = el("div", "gacha-brand");
  const logo = slot(spec.logo || "assets/hub/gacha/logo.png", "");
  logo.classList.add("gacha-logo");
  const names = el("div", "gacha-brand-copy");
  names.append(el("strong", "gacha-logo-ja", spec.logoTitle || ""), el("span", "gacha-logo-en", spec.logoEnglish || ""));
  brand.append(logo, names);

  const tools = el("div", "gacha-tools");
  tools.append(hubWallet("gacha-wallet"));
  const ticket = el("span", "hub-chip");
  ticket.append(
    slot(spec.ticket || "assets/hub/gacha/ticket.png", spec.ticketLabel || ""),
    el("span", null, Number(spec.tickets || 0).toLocaleString("ja-JP")),
    chargeButton("ticket")
  );
  tools.append(ticket);
  (spec.nav || []).forEach((item) => {
    const button = hubGo(item.label, item.screen, "gacha-nav");
    button.replaceChildren(slot(`assets/hub/gacha/nav-${item.id}.png`, item.label || ""));
    button.setAttribute("aria-label", item.label || "");
    tools.append(button);
  });
  top.append(brand, tools);
  return top;
}

function renderGachaBanners() {
  const rail = el("div", "gacha-banners");
  const state = hubState();
  gachaBanners().forEach((banner, index) => {
    const button = el("button", `gacha-banner${index === state.gachaBanner ? " is-on" : ""}`);
    button.type = "button";
    const thumb = slot(gachaPath(banner, "thumb", "banners"), "");
    thumb.classList.add("gacha-banner-thumb");
    const copy = el("span", "gacha-banner-copy");
    copy.append(el("strong", null, banner.name || ""));
    if (banner.badge) copy.append(el("span", "gacha-badge", banner.badge));
    button.append(thumb, copy);
    button.addEventListener("click", () => {
      state.gachaBanner = index;
      state.gachaPage = 0;
      state.gachaSheet = "";
      openScreen("gacha");
    });
    rail.append(button);
  });
  return rail;
}

function renderGachaHero(banner) {
  const hero = slot(gachaPath(banner, "hero", "heroes"), banner.title || banner.name || "立ち絵");
  hero.classList.add("gacha-hero");
  return hero;
}

function renderGachaCopy(spec, banner) {
  const copy = el("div", "gacha-copy");
  const titleWrap = el("div", "gacha-title-wrap");
  const titleArt = slot(gachaPath(banner, "titleArt", "titles"), "");
  titleArt.classList.add("gacha-title-art");
  titleWrap.append(titleArt, el("h1", "gacha-title", banner.title || ""));
  copy.append(titleWrap);
  if (banner.tagline) copy.append(el("p", "gacha-tagline", banner.tagline));
  const period = gachaPeriod(banner);
  if (period) copy.append(el("p", "gacha-period", period));
  if (banner.rateTitle || banner.rateNote) {
    const rate = withPlate(el("div", "gacha-ratebox"), "assets/hub/ui/banner.png");
    if (banner.rateTitle) rate.append(el("strong", null, banner.rateTitle));
    if (banner.rateNote) rate.append(el("span", null, banner.rateNote));
    copy.append(rate);
  }
  return copy;
}

function renderGachaPulls(spec) {
  const pulls = el("div", "gacha-pulls");
  const once = withPlate(el("button", "gacha-pull is-once"), "assets/hub/gacha/pull-once.png");
  const ten = withPlate(el("button", "gacha-pull is-ten"), "assets/hub/gacha/pull-ten.png");
  once.type = "button";
  ten.type = "button";
  const face = (button, label, cost) => {
    const text = el("span", "gacha-pull-copy");
    text.append(el("strong", null, label), el("span", null, cost));
    const icon = slot(spec.ticket || "assets/hub/gacha/ticket.png", "");
    icon.classList.add("gacha-pull-ticket");
    button.append(text, icon);
  };
  face(once, spec.once || "1回召喚", spec.cost1 || "1");
  face(ten, spec.ten || "10回召喚", spec.cost10 || "10");
  once.addEventListener("click", () => summonBanner(1));
  ten.addEventListener("click", () => summonBanner(10));
  pulls.append(once, ten);
  const links = el("div", "gacha-links");
  [["rates", spec.rates || "提供割合"], ["history", spec.history || "召喚履歴"]].forEach(([sheet, label]) => {
    const button = el("button", "gacha-link", label);
    button.type = "button";
    button.addEventListener("click", () => {
      hubState().gachaSheet = sheet;
      openScreen("gacha");
    });
    links.append(button);
  });
  pulls.append(links);
  return pulls;
}

function renderGachaProfile(spec, banner) {
  const profile = el("aside", "gacha-profile");
  if (banner.quote) profile.append(el("p", "gacha-quote", banner.quote));
  const who = el("div", "gacha-who");
  if (banner.rarity) who.append(el("span", "gacha-rarity", gachaRarity(banner.rarity).label));
  const character = gachaCharacter(banner.characterId);
  if (character) who.append(el("strong", "gacha-who-name", character.name));
  if (banner.voice) who.append(el("span", "gacha-voice", `${gachaData().words?.voice || "声"}  ${banner.voice}`));
  if (banner.characterId && character) {
    const detail = el("button", "gacha-detail", spec.detail || "詳細");
    detail.type = "button";
    detail.addEventListener("click", () => {
      hubState().characterId = banner.characterId;
      openScreen("character");
    });
    who.append(detail);
  }
  profile.append(who);
  return profile;
}

function renderGachaStrip(banner) {
  const pool = gachaLineup(banner);
  const state = hubState();
  const pageSize = gachaData().lineupPage || 8;
  const pages = Math.max(1, Math.ceil(pool.length / pageSize));
  if (state.gachaPage >= pages) state.gachaPage = 0;
  const shown = pool.slice(state.gachaPage * pageSize, state.gachaPage * pageSize + pageSize);
  const strip = el("div", "gacha-strip");
  const row = el("div", "gacha-strip-row");
  shown.forEach((entry) => row.append(renderGachaCard(entry)));
  strip.append(row);
  if (pages > 1) {
    const dots = el("div", "gacha-dots");
    for (let index = 0; index < pages; index += 1) {
      const dot = el("button", `gacha-dot${index === state.gachaPage ? " is-on" : ""}`);
      dot.type = "button";
      dot.setAttribute("aria-label", `${index + 1}ページ`);
      dot.addEventListener("click", () => {
        state.gachaPage = index;
        openScreen("gacha");
      });
      dots.append(dot);
    }
    strip.append(dots);
  }
  return strip;
}

function renderGachaSheet(spec, banner) {
  const state = hubState();
  if (!state.gachaSheet) return null;
  const sheet = withPlate(el("div", "gacha-sheet"), "assets/hub/ui/panel.png");
  const close = el("button", "hub-btn", spec.close || "閉じる");
  close.type = "button";
  close.addEventListener("click", () => {
    state.gachaSheet = "";
    openScreen("gacha");
  });
  if (state.gachaSheet === "result") {
    const picks = state.gachaPicks || [];
    const many = picks.length > 1;
    sheet.classList.add("is-summon");
    const play = renderSummonPlay(picks);
    const title = el("h2", "gacha-sheet-title", banner.title || "召喚");
    const grid = el("div", `gacha-result-grid${many ? " is-many" : ""}`);
    picks.forEach((entry, index) => {
      const card = renderGachaCard(entry, !many, true);
      card.style.animationDelay = `${(many ? 0.95 : 1.05) + index * (many ? 0.14 : 0)}s`;
      grid.append(card);
    });
    const skip = el("button", "gacha-skip", "とばす");
    skip.type = "button";
    skip.addEventListener("click", () => finishSummon(play, grid, skip));
    play.addEventListener("animationend", (event) => {
      if (event.target === play) play.remove();
    });
    const last = grid.lastElementChild;
    last?.addEventListener("animationend", (event) => {
      if (event.target === last) skip.remove();
    });
    sheet.append(play, title, grid, skip, close);
    return sheet;
  }
  if (state.gachaSheet === "history") {
    sheet.append(el("h2", "gacha-sheet-title", spec.history || "召喚履歴"));
    const list = el("div", "gacha-list");
    if (!(state.gachaLog || []).length) list.append(el("p", "gacha-empty", "まだ召喚していません"));
    (state.gachaLog || []).forEach((row) => {
      const names = (row.picks || []).map((id) => gachaCharacter(id)?.name || id).join("、");
      list.append(el("p", "gacha-list-line", `${row.banner || ""}  ${row.count}回  ${names}`));
    });
    sheet.append(list, close);
    return sheet;
  }
  sheet.append(el("h2", "gacha-sheet-title", spec.rates || "提供割合"));
  const list = el("div", "gacha-list");
  (banner.offers || []).forEach((offer) => {
    list.append(el("p", "gacha-list-line", `${offer.label || ""}  ${offer.text || ""}`));
  });
  sheet.append(list, close);
  return sheet;
}

function renderGacha() {
  const spec = gachaSpec();
  const view = hubView("gacha");
  const banner = currentBanner();
  view.append(
    renderGachaHero(banner),
    renderGachaTop(spec),
    renderGachaBanners(),
    renderGachaCopy(spec, banner),
    renderGachaPulls(spec),
    renderGachaProfile(spec, banner),
    renderGachaStrip(banner)
  );
  const sheet = renderGachaSheet(spec, banner);
  if (sheet) view.append(sheet);
  return view;
}

screens.gacha = function () {
  showHub(renderGacha());
};
