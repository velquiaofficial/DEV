import { DESTINATIONS as CURATED } from "./destinations.js";
import { matchRegion, originTokenSource, resolveAccess, withRegions } from "./regions.js";
import { mealShop, picksFor } from "./places.js";

const DESTINATIONS = withRegions(CURATED);
const ORIGIN_TOKEN = new RegExp(`(${originTokenSource()})(?:発|から)`);

const WEEKDAYS = "日月火水木金土";
const DAY_MAX_MINUTES = 130;
const OVERNIGHT_MAX_MINUTES = 230;

const PREF_DEFS = [
  ["onsen", "温泉", ["温泉"]],
  ["sea", "海", ["海", "海岸"]],
  ["quiet", "静か", ["静か"]],
  ["nature", "自然", ["自然", "山歩き", "登山"]],
  ["food", "食事", ["グルメ", "ご飯", "ごはん", "食べ", "飯"]],
  ["anime", "聖地", ["アニメ", "漫画", "ゲーム", "聖地", "巡礼"]],
  ["history", "歴史", ["歴史", "神社", "寺"]],
  ["town", "街歩き", ["街歩", "古い町", "町並み"]],
  ["solo", "一人", ["一人", "ソロ", "ひとり"]],
];

export function formatYen(value) {
  const amount = Math.round(value);
  const sign = amount < 0 ? "-" : "";
  return `${sign}${new Intl.NumberFormat("ja-JP").format(Math.abs(amount))}円`;
}

export function parseBrief(text, mode, now = new Date()) {
  const source = text || "";
  const budget = parseBudget(source);
  const originInfo = detectOrigin(source);
  const weekday = /平日/.test(source);
  const nightsInfo = parseNights(source, budget);
  const { prefs, prefLabels } = parsePrefs(source, mode);
  const placeId = detectPlace(source);
  const work = detectWork(source);
  const placeName = DESTINATIONS.find((dest) => dest.id === placeId)?.name ?? null;
  const party = parseParty(source);
  const explicitStart = detectStartDate(source, now);
  const dates = buildDates(now, weekday, nightsInfo.nights, explicitStart);
  const weekendStay = explicitStart
    ? includesWeekendNight(explicitStart, nightsInfo.nights)
    : nightsInfo.nights > 0;
  const assumptions = [];

  if (originInfo.assumed) assumptions.push("出発地は東京にしています。");
  if (nightsInfo.assumed) {
    assumptions.push(
      nightsInfo.nights === 0
        ? "予算が小さいので、日帰りにしています。"
        : "泊数の指定がなかったので、1泊にしています。",
    );
  }
  if (party > 1) assumptions.push(`${party}人で見ます。金額の基準はひとり分のままです。`);
  if (explicitStart) {
    assumptions.push(`${explicitStart.getMonth() + 1}月${explicitStart.getDate()}日出発で作っています。`);
    if (nightsInfo.nights > 0 && !weekday && weekendStay) assumptions.push("週末の宿代を入れています。");
    else if (nightsInfo.nights > 0) assumptions.push("平日の宿代で見積もっています。");
  } else if (weekday) assumptions.push("平日スタートで、宿の割増は入れていません。");
  else if (nightsInfo.nights > 0) {
    assumptions.push("次の土曜を起点に、土曜泊の宿代で見積もっています。");
  }

  return {
    text: source,
    mode,
    budget,
    origin: originInfo.origin,
    originAssumed: originInfo.assumed,
    unknownOrigin: originInfo.unknown,
    nights: nightsInfo.nights,
    nightsAssumed: nightsInfo.assumed,
    prefs,
    prefLabels,
    placeId,
    placeName,
    party,
    workId: work?.id ?? null,
    workTitle: work?.title ?? null,
    avoidStairs: /階段.{0,12}(苦手|避け|きつい|無理|少ない|心配|不安)|坂(が|の)?(苦手|きつい|心配|無理|避け)|歩き少な|歩きたくない|平ら/.test(source),
    avoidCrowd: mode === "safe" || /混雑|人混み|人が多|混ま|空いて|人を避け/.test(source),
    oneSight: /ゆったり|欲張ら|一つだけ|詰めない|のんびり|観光は少|歩き少な|歩きたくない|雨/.test(source),
    departAt: readDepart(source),
    homeBy: readHome(source),
    forceExpress: readExpress(source),
    withKids: /子連れ|子供|子ども|キッズ/.test(source),
    weekday,
    weekendLodging: !weekday && nightsInfo.nights > 0 && weekendStay,
    assumptions,
    dates,
  };
}

export function planTrip(text, mode, now = new Date(), options = {}) {
  const brief = parseBrief(text, mode, now);
  const tendency = readTendency(options.visits || []);
  brief.been = tendency.places.map((place) => place.id);
  brief.beenNames = tendency.places.map((place) => place.name);
  brief.lean = brief.prefs.length ? [] : tendency.prefs;
  brief.leanLabels = brief.prefs.length ? [] : tendency.labels;

  if (brief.unknownOrigin) {
    return fail(
      brief,
      `${brief.unknownOrigin}発には対応していません。出発地は都道府県名で書いてください。`,
    );
  }
  if (!brief.budget) {
    return fail(brief, "予算が読み取れませんでした。「3万円」や「1万円」のように書いてください。");
  }

  const ranked = DESTINATIONS.map((dest) => evaluate(dest, brief)).sort(
    (a, b) => b.score - a.score || a.dest.name.localeCompare(b.dest.name, "ja"),
  );
  const feasible = ranked.filter((row) => row.feasible);

  if (!feasible.length) {
    return fail(brief, explainMiss(ranked, brief));
  }

  const choice = mode === "gacha" ? weightedPick(feasible) : feasible[0];
  const alternatives = mode === "gacha" ? [] : pickAlternatives(ranked, choice, brief).map((row) => ({
    id: row.dest.id,
    name: row.dest.name,
    region: row.dest.region,
    tradeoff: row.dest.tradeoff,
    total: row.cost?.total ?? null,
    minutes: row.cost?.minutes ?? null,
    note: alternativeNote(row, brief),
  }));
  return compose(choice.dest, brief, alternatives);
}

export function adjustPlan(result, patch) {
  if (!result?.ok) return result;
  const dest = DESTINATIONS.find((item) => item.id === result.destId);
  if (!resolveAccess(dest, result.brief.origin)) return result;
  const brief = { ...result.brief };
  if (patch.party) brief.party = patch.party;
  if (Object.hasOwn(patch, "express")) brief.forceExpress = patch.express;
  if (Object.hasOwn(patch, "avoidStairs")) brief.avoidStairs = patch.avoidStairs;
  if (Object.hasOwn(patch, "avoidCrowd")) brief.avoidCrowd = patch.avoidCrowd;
  if (Object.hasOwn(patch, "oneSight")) brief.oneSight = patch.oneSight;
  if (Object.hasOwn(patch, "departAt")) brief.departAt = patch.departAt;
  if (Object.hasOwn(patch, "homeBy")) brief.homeBy = patch.homeBy;
  if (patch.omitTitle) {
    const titles = new Set(brief.omitTitles || []);
    if (titles.has(patch.omitTitle)) titles.delete(patch.omitTitle);
    else titles.add(patch.omitTitle);
    brief.omitTitles = [...titles];
  }
  return compose(dest, brief, result.alternatives);
}

export function reviseText(text, note, brief) {
  const trimmed = note.trim();
  if (!trimmed) return text;
  let next = text;
  if (/もっと安く|安くして|予算を抑え/.test(trimmed)) {
    const budget = Math.max(8000, Math.round((brief.budget * 0.75) / 1000) * 1000);
    next = replaceBudget(next, budget);
  }
  if (/3泊|三泊/.test(trimmed)) next = `${stripStay(next)}\n3泊4日`;
  else if (/2泊|二泊/.test(trimmed)) next = `${stripStay(next)}\n2泊3日`;
  else if (/日帰り/.test(trimmed)) next = `${stripStay(next)}\n日帰り`;
  if (/平日/.test(trimmed) && !/平日/.test(next)) next = `${next}\n平日`;
  if (/土曜|週末/.test(trimmed)) next = next.replaceAll("平日", "");
  if (/階段|坂|歩き少な|歩きたくない/.test(trimmed)) next = addLine(next, "階段が苦手");
  if (/午後から|昼すぎ|昼過ぎ/.test(trimmed)) next = addLine(next, "午後から");
  if (/朝早く|始発|早朝/.test(trimmed)) next = addLine(next, "朝早く");
  if (/早めに帰|夕方には|夕方まで/.test(trimmed)) next = addLine(next, "早めに帰る");
  if (/のんびり|ゆっくり|少なめ|雨/.test(trimmed)) next = addLine(next, "のんびり");
  if (/混ま|空いて|人を避け|人混み/.test(trimmed)) next = addLine(next, "混雑を避ける");
  if (/特急|速い列車|急行/.test(trimmed)) next = addLine(next, "速い列車");
  if (/各停|遅い経路|安く移動/.test(trimmed)) next = addLine(next, "遅い経路");
  if (/二人|カップル|ふたり/.test(trimmed)) next = addLine(next, "2人");
  if (/三人|家族/.test(trimmed)) next = addLine(next, "3人");
  if (!next.includes(trimmed)) next = `${next.trim()}\n${trimmed}`;
  return next;
}

function addLine(text, line) {
  if ((text || "").includes(line)) return text;
  return `${(text || "").trim()}\n${line}`;
}

function readDepart(text) {
  const clock = text.match(/(?:出発|出る|発)\s*(\d{1,2})\s*時/) || text.match(/(\d{1,2})\s*時(?:に)?(?:出発|出る)/);
  if (clock) return clockHour(clock[1]);
  if (/午後から|昼すぎ|昼過ぎ/.test(text)) return "12:00";
  if (/朝早く|始発|早朝/.test(text)) return "06:30";
  if (/ゆっくり出|遅めに出/.test(text)) return "10:00";
  return null;
}

function readHome(text) {
  const clock = text.match(/(\d{1,2})\s*時(?:まで|に)?(?:帰|帰宅)/);
  if (clock) return clockHour(clock[1]);
  if (/早めに帰|夕方には帰|夕方まで/.test(text)) return "18:00";
  return null;
}

function readExpress(text) {
  if (/速い列車|特急|急行/.test(text)) return true;
  if (/遅い経路|各停|安く移動/.test(text)) return false;
  return undefined;
}

function clockHour(hour) {
  const value = Math.min(23, Math.max(0, Number.parseInt(hour, 10)));
  return `${String(value).padStart(2, "0")}:00`;
}

const DEPARTURE_LINE = /\n?出発\s*(?:\d{4}年)?\d{1,2}月\d{1,2}日/g;

export function setBudgetLine(text, yen) {
  const label = yen % 10000 === 0
    ? `${yen / 10000}万円`
    : `${Math.floor(yen / 10000)}万${(yen % 10000) / 1000}千円`;
  const line = `予算 ${label}`;
  const base = (text || "").replace(/\n?予算\s*[^\n]+/g, "").trim();
  return base ? `${line}\n${base}` : line;
}

export function setOriginLine(text, origin) {
  const source = text || "";
  if (ORIGIN_TOKEN.test(source)) return source.replace(ORIGIN_TOKEN, `${origin}発`);
  return source.trim() ? `${source.trim()}\n${origin}発` : `${origin}発`;
}

export function setStayLine(text, nights) {
  const line = nights === 0 ? "日帰り" : `${nights}泊${nights + 1}日`;
  const base = (text || "").replace(/\n?日帰り/g, "").replace(/\n?\d+\s*泊(?:\d+\s*日)?/g, "").trim();
  return base ? `${base}\n${line}` : line;
}

export function setPrefLine(text, label) {
  if ((text || "").includes(label)) return text || "";
  return (text || "").trim() ? `${text.trim()}\n${label}` : label;
}

const TENDENCY_SKIP = new Set(["solo", "budget"]);

export function readTendency(ids) {
  const places = [];
  const counts = new Map();
  for (const id of ids || []) {
    const dest = DESTINATIONS.find((item) => item.id === id);
    if (!dest || places.some((place) => place.id === dest.id)) continue;
    places.push({ id: dest.id, name: dest.name });
    for (const tag of dest.tags) {
      if (TENDENCY_SKIP.has(tag)) continue;
      const label = PREF_DEFS.find((row) => row[0] === tag)?.[1];
      if (!label) continue;
      const current = counts.get(tag) || { id: tag, label, count: 0 };
      current.count += 1;
      counts.set(tag, current);
    }
  }
  const ranked = [...counts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"),
  );
  const lead = ranked[0];
  const picked = ranked.filter((item, index) => index === 0 || item.count === lead.count).slice(0, 2);
  const names = places.map((place) => place.name);
  let line = "行った場所を押すと、温泉や街歩きなどの傾向が出ます。";
  if (places.length && picked.length) {
    line = `行った場所は${names.join("、")}です。${picked.map((item) => item.label).join("と")}が多いです。`;
  } else if (places.length) {
    line = `行った場所は${names.join("、")}です。`;
  }
  return {
    places,
    prefs: picked.map((item) => item.id),
    labels: picked.map((item) => item.label),
    line,
  };
}

export function withDeparture(text, date) {
  const line = `出発 ${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  const base = (text || "").replace(DEPARTURE_LINE, "").trim();
  return `${base}\n${line}`;
}

export function withoutDeparture(text) {
  return (text || "").replace(DEPARTURE_LINE, "").trim();
}

export function briefForDestination(dest, brief) {
  const origin = brief?.origin && (brief.origin === "名古屋" || matchRegion(brief.origin)) ? brief.origin : "東京";
  const budget = brief?.budget || 30000;
  const canStay = Boolean(dest.itinerary.first);
  const nights = canStay ? Math.max(brief?.nights || 1, 1) : 0;
  const stay = nights === 0 ? "日帰り" : `${nights}泊${nights + 1}日`;
  const body = `予算 ${budget}円\n${origin}発\n${dest.name}\n${stay}`;
  if (!brief?.dates?.explicit || !brief.dates.start) return body;
  const [year, month, day] = brief.dates.start.split("-").map(Number);
  return withDeparture(body, new Date(year, month - 1, day));
}

export function planToText(result) {
  if (!result?.ok) return "";
  const doc = result.planDoc;
  const party = result.brief.party || 1;
  const lines = [
    `${result.name}　行程`,
    result.dates.range,
    `${result.brief.origin}発　${doc?.nightsLabel || ""}　${party}人`.replace(/\s+/g, " ").trim(),
    result.blurb,
    "",
    ...result.letter,
    "",
  ];
  if (doc) {
    lines.push(`経路　${doc.routeLabel}`, doc.leg.how, `片道およそ${doc.leg.minutes}分　往復 ${formatYen(doc.leg.fare)}`, doc.leg.back, "");
    for (const fact of doc.facts) lines.push(`${fact.label}　${fact.value}`);
    lines.push("");
  }
  if (result.call) lines.push(result.call, "");
  if (result.verdict?.lines?.length) {
    lines.push("選んだ理由");
    for (const line of result.verdict.lines) lines.push(line);
    lines.push("");
  }
  if (result.alerts?.length) {
    lines.push("確認");
    for (const line of result.alerts) lines.push(`・${line}`);
    lines.push("");
  }
  if (result.cuts?.length) {
    lines.push("入れなかった予定");
    for (const cut of result.cuts) lines.push(`・${cut.title}　${cut.reason}`);
    lines.push("");
  }
  if (result.refused?.length) {
    lines.push("行かない場所");
    for (const item of result.refused) lines.push(`・${item.title}　${item.reason}`);
    lines.push("");
  }
  for (const day of result.days) {
    const home = day.home ? `　${day.home.place}着 ${day.home.t}` : "";
    lines.push(`■ ${day.label}　${day.date}${home}`);
    if (day.aim) lines.push(day.aim);
    for (const block of day.blocks) lines.push(`${block.t}　${block.title}　${block.detail}`);
    lines.push("");
  }
  lines.push("費用（ひとり）");
  lines.push(`往復交通　${formatYen(result.cost.transport)}`);
  if (result.brief.nights > 0) lines.push(`宿　${formatYen(result.cost.lodging)}　${result.stayLabel}`);
  lines.push(`食事　${formatYen(result.cost.food)}`);
  lines.push(`現地交通　${formatYen(result.cost.local)}`);
  lines.push(`入場料　${formatYen(result.cost.tickets)}`);
  lines.push(`合計　${formatYen(result.cost.total)}`);
  if (party > 1) lines.push(`${party}人で　${formatYen(result.cost.groupTotal)}`);
  if (doc?.checks?.length) {
    lines.push("", "出発前の確認");
    for (const item of doc.checks) lines.push(`・${item.name}　${item.detail}`);
  }
  if (result.packing?.length) {
    lines.push("", "持ち物");
    for (const item of result.packing) lines.push(`・${item.name}　${item.detail}`);
  }
  lines.push("", "金額と時間は目安です。宿と列車は、出発前に確認してください。");
  return lines.join("\n");
}

function fail(brief, message) {
  return { ok: false, brief, message, alternatives: [] };
}

function parseBudget(text) {
  const mixed = text.match(/(\d+)\s*万\s*(\d+)\s*千/);
  if (mixed) return Number.parseInt(mixed[1], 10) * 10000 + Number.parseInt(mixed[2], 10) * 1000;
  const man = text.match(/(\d+(?:\.\d+)?)\s*万/);
  if (man) return Math.round(Number.parseFloat(man[1]) * 10000);
  const yen = text.match(/(\d{3,7})\s*円/);
  if (yen) return Number.parseInt(yen[1], 10);
  return null;
}

function detectOrigin(text) {
  const hits = [...text.matchAll(/([一-龯]{2,8})(?:発|から)/g)].map((match) => match[1]);
  let unknown = null;
  for (const raw of hits) {
    if (SKIP_ORIGIN.has(raw)) continue;
    const origin = normalizeOrigin(raw);
    if (origin) return { origin, assumed: false, unknown: null };
    unknown = raw;
  }
  if (unknown) return { origin: null, assumed: false, unknown };
  return { origin: "東京", assumed: true, unknown: null };
}

const SKIP_ORIGIN = new Set(["午後", "午前", "早朝", "夕方", "今夜", "今日", "明日", "昨日", "ここ", "そこ", "あちら", "こちら"]);

function normalizeOrigin(raw) {
  if (raw === "名古屋") return "名古屋";
  return matchRegion(raw)?.name ?? null;
}

function parseNights(text, budget) {
  if (/日帰り/.test(text)) return { nights: 0, assumed: false };
  const stay = text.match(/(\d+)\s*泊/);
  if (stay) return { nights: Math.min(3, Number.parseInt(stay[1], 10)), assumed: false };
  const days = text.match(/(?:^|[^\d月])(\d+)\s*日/);
  if (days) {
    return { nights: Math.max(0, Math.min(3, Number.parseInt(days[1], 10) - 1)), assumed: false };
  }
  const nights = budget != null && budget < 16000 ? 0 : 1;
  return { nights, assumed: true };
}

function maskPlaceNames(text) {
  const aliases = DESTINATIONS.flatMap((dest) => dest.aliases).sort((a, b) => b.length - a.length);
  return aliases.reduce((masked, alias) => (alias ? masked.split(alias).join(" ") : masked), text);
}

function parsePrefs(text, mode) {
  const prefs = [];
  const prefLabels = [];
  const add = (id, label) => {
    if (prefs.includes(id)) return;
    prefs.push(id);
    prefLabels.push(label);
  };
  const source = maskPlaceNames(text);
  for (const [id, label, words] of PREF_DEFS) {
    if (words.some((word) => source.includes(word))) add(id, label);
  }
  if (mode === "solo") add("solo", "一人");
  if (mode === "pilgrimage") add("anime", "聖地");
  return { prefs, prefLabels };
}

function detectPlace(text) {
  const aliases = DESTINATIONS.flatMap((dest) => dest.aliases.map((alias) => ({ alias, id: dest.id })));
  aliases.sort((a, b) => b.alias.length - a.alias.length);
  for (const item of aliases) {
    let from = 0;
    while (from < text.length) {
      const index = text.indexOf(item.alias, from);
      if (index < 0) break;
      const rest = text.slice(index + item.alias.length);
      if (!rest.startsWith("発") && !rest.startsWith("から")) return item.id;
      from = index + item.alias.length;
    }
  }
  return null;
}

function parseParty(text) {
  const count = text.match(/([1-6])\s*人/);
  if (count) return Number.parseInt(count[1], 10);
  if (/四人|よにん/.test(text)) return 4;
  if (/三人|家族|さんにん/.test(text)) return 3;
  if (/二人|カップル|ふたり/.test(text)) return 2;
  return 1;
}

function detectWork(text) {
  const works = DESTINATIONS.flatMap((dest) =>
    dest.works.flatMap((work) => work.aliases.map((alias) => ({ alias, id: dest.id, title: work.title }))),
  );
  works.sort((a, b) => b.alias.length - a.alias.length);
  return works.find((item) => text.includes(item.alias)) ?? null;
}

function detectStartDate(text, now) {
  const match = text.match(/出発\s*(?:(\d{4})年)?(\d{1,2})月(\d{1,2})日/);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  let year = match[1] ? Number(match[1]) : now.getFullYear();
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  let date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  if (!match[1]) {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (date < today) date = new Date(year + 1, month - 1, day);
  }
  return date;
}

function includesWeekendNight(start, nights) {
  for (let index = 0; index < nights; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const day = date.getDay();
    if (day === 5 || day === 6) return true;
  }
  return false;
}

function implicitStart(now, weekday) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (now.getHours() >= 17) start.setDate(start.getDate() + 1);
  if (weekday) {
    while (start.getDay() === 0 || start.getDay() === 6) start.setDate(start.getDate() + 1);
  } else {
    const add = (6 - start.getDay() + 7) % 7;
    start.setDate(start.getDate() + add);
  }
  return start;
}

function isoDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function buildDates(now, weekday, nights, explicitStart) {
  const start = explicitStart
    ? new Date(explicitStart.getFullYear(), explicitStart.getMonth(), explicitStart.getDate())
    : implicitStart(now, weekday);
  const perDay = [];
  for (let index = 0; index <= nights; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    perDay.push(formatJapaneseDate(date));
  }
  return {
    range: perDay.length === 1 ? perDay[0] : `${perDay[0]} – ${perDay[perDay.length - 1]}`,
    perDay,
    month: start.getMonth() + 1,
    start: isoDate(start),
    explicit: Boolean(explicitStart),
  };
}

function formatJapaneseDate(date) {
  return `${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAYS[date.getDay()]}）`;
}

function evaluate(dest, brief) {
  const access = resolveAccess(dest, brief.origin);
  if (!access) {
    return { dest, cost: null, shapeOk: false, moneyOk: false, feasible: false, score: -1000 };
  }
  const cost = quote(dest, brief, access);
  const shapeOk = canShape(dest, brief, cost.minutes, access.estimated);
  const forced = brief.placeId === dest.id || brief.workId === dest.id;
  const moneyOk = cost.total <= brief.budget * 1.03 || forced;
  const stairsOk = !(brief.avoidStairs && dest.hardship.stairs >= 3) || forced;
  const workOk = !brief.workId || brief.workId === dest.id;
  const modeOk = brief.mode !== "pilgrimage" || dest.works.length > 0 || brief.placeId === dest.id;
  const feasible = shapeOk && moneyOk && stairsOk && workOk && modeOk;
  let score = scoreDest(dest, brief, cost);
  if (!shapeOk) score -= 200;
  return { dest, cost, shapeOk, moneyOk, feasible, score };
}

function withHotel(dest) {
  const hotel = picksFor(dest)?.hotel;
  return hotel ? `${dest.stay.label}。${hotel}` : dest.stay.label;
}

function quote(dest, brief, access) {
  const party = brief.party || 1;
  const days = brief.nights + 1;
  const lodging = dest.stay.perNight * brief.nights + (brief.weekendLodging ? dest.stay.weekendExtra : 0);
  const food = dest.foodPerDay * days;
  const base = lodging + food + dest.local + dest.tickets;
  const standardTotal = access.roundTrip + base;
  const cap = brief.nights === 0 ? (access.estimated ? 200 : DAY_MAX_MINUTES) : (access.estimated ? 420 : OVERNIGHT_MAX_MINUTES);
  let useSaver = Boolean(access.saver) && standardTotal > brief.budget && access.saver.roundTrip < access.roundTrip;
  if (brief.forceExpress === true) useSaver = false;
  if (brief.forceExpress === false && access.saver && access.saver.minutes <= cap) useSaver = true;
  if (useSaver && access.saver.minutes > cap) useSaver = false;
  const chosen = useSaver ? access.saver : access;
  const total = chosen.roundTrip + base;
  return {
    transport: chosen.roundTrip,
    lodging,
    food,
    local: dest.local,
    tickets: dest.tickets,
    total,
    party,
    groupTotal: total * party,
    minutes: chosen.minutes,
    how: chosen.how,
    usedSaver: useSaver,
    canSave: Boolean(access.saver),
    upgradeExtra: access.saver ? Math.abs(access.roundTrip - access.saver.roundTrip) : 0,
    upgradeHow: access.how,
    saverHow: access.saver?.how ?? null,
  };
}

function compose(dest, brief, alternatives) {
  const cost = quote(dest, brief, resolveAccess(dest, brief.origin));
  const mode = brief.mode;
  const days = buildDays(dest, brief, cost);
  const cuts = days.flatMap((day) => day.cuts);
  const planDoc = writePlanDoc(dest, brief, cost, days);
  const letter = writeLetter(dest, brief, cost, mode);
  if (cuts.length) {
    letter.push(`次の予定は入れていません。${cuts.map((cut) => `「${cut.title}」`).join("、")}。`);
  }
  const stance = [brief.avoidStairs ? "stairs" : "", brief.avoidCrowd ? "crowd" : "", brief.oneSight ? "one" : ""]
    .filter(Boolean)
    .join("+");
  const tuned = [brief.departAt || "-", brief.homeBy || "-", (brief.omitTitles || []).join(",")].join("/");
  return {
    ok: true,
    brief,
    signature: `${dest.id}|${brief.dates.range}|${mode}|${brief.budget}|${brief.party || 1}|${cost.usedSaver ? "slow" : "fast"}|${stance}|${tuned}`,
    destId: dest.id,
    name: dest.name,
    region: dest.region,
    blurb: dest.blurb,
    letter,
    call: writeCall(dest, brief, cost, cuts),
    dates: brief.dates,
    cost,
    stayLabel: withHotel(dest),
    places: picksFor(dest),
    days,
    cuts,
    refused: dest.refusals ?? REFUSALS[dest.id] ?? [],
    meals: dest.meals.map((meal) => {
      const shop = mealShop(meal, picksFor(dest));
      return shop ? { ...meal, shop, name: `${meal.name}（${shop}）` } : meal;
    }),
    spots: dest.spots,
    cautions: dest.cautions,
    solo: dest.solo,
    works: dest.works,
    season: seasonNotes(dest, brief.dates.month),
    packing: packingList(dest, brief),
    planDoc,
    verdict: writeVerdict(dest, brief, cost, alternatives),
    alerts: writeAlerts(dest, brief, cost, days),
    alternatives,
  };
}

function canShape(dest, brief, minutes, estimated) {
  const dayMax = estimated ? 200 : DAY_MAX_MINUTES;
  const nightMax = estimated ? 420 : OVERNIGHT_MAX_MINUTES;
  if (brief.nights === 0) return Boolean(dest.itinerary.day) && minutes <= dayMax;
  return Boolean(dest.itinerary.first && dest.itinerary.last) && minutes <= nightMax;
}

function scoreDest(dest, brief, cost) {
  let score = 36;
  for (const pref of brief.prefs) {
    if (dest.tags.includes(pref)) score += 28;
  }
  if (brief.prefs.includes("onsen")) score += (dest.onsen || 0) * 8;
  const ratio = cost.total / brief.budget;
  if (ratio <= 1 && ratio >= 0.62) score += 24;
  else if (ratio <= 1 && ratio >= 0.4) score += 10;
  else if (ratio <= 1) score += 4;
  else if (ratio <= 1.12) score -= 6;
  else score -= 40;

  if (brief.nights <= 1) score += Math.max(0, 18 - cost.minutes / 25);
  if (brief.nights === 1 && cost.minutes >= 150) score -= 18;
  if (brief.nights === 1 && cost.minutes >= 190) score -= 18;
  if (brief.placeId === dest.id) score += brief.mode === "pilgrimage" ? 80 : 420;
  if (brief.workId === dest.id) score += 420;
  if (brief.mode === "solo" && dest.tags.includes("solo")) score += 26;
  if (brief.mode === "pilgrimage" && dest.works.length) score += 34;
  if (brief.mode === "safe") score += Math.min(dest.cautions.length, 4) * 2;
  if (brief.withKids && dest.hardship.stairs >= 3) score -= 22;
  if (dest.generated && brief.placeId !== dest.id && brief.workId !== dest.id) score -= 28;
  if (cost.minutes >= 240) score -= 36;
  for (const pref of brief.lean || []) {
    if (dest.tags.includes(pref) || (pref === "onsen" && (dest.onsen || 0) >= 4)) score += 26;
    if (pref === "onsen") score += (dest.onsen || 0) * 4;
  }
  if ((brief.been || []).includes(dest.id) && brief.placeId !== dest.id && brief.workId !== dest.id) score -= 80;
  return score;
}

function weightedPick(rows) {
  const weights = rows.map((row) => row.dest.gacha ?? 1);
  let cursor = Math.random() * weights.reduce((sum, weight) => sum + weight, 0);
  for (let index = 0; index < rows.length; index += 1) {
    cursor -= weights[index];
    if (cursor <= 0) return rows[index];
  }
  return rows[rows.length - 1];
}

function pickAlternatives(ranked, winner, brief) {
  const others = ranked.filter((row) => row.dest.id !== winner.dest.id && row.cost);
  const chosen = [];
  const nextFeasible = others.find((row) => row.feasible);
  if (nextFeasible) chosen.push(nextFeasible);
  const themed = others.find(
    (row) => !chosen.includes(row) && brief.prefs.some((pref) => row.dest.tags.includes(pref) || (pref === "onsen" && row.dest.onsen >= 4)),
  );
  if (themed) chosen.push(themed);
  if (chosen.length < 2) {
    const filler = others.find((row) => !chosen.includes(row) && row.shapeOk);
    if (filler) chosen.push(filler);
  }
  return chosen.slice(0, 2);
}

function alternativeNote(row, brief) {
  if (row.feasible) return null;
  if (!row.shapeOk) return "この日数だと、移動が長すぎます。";
  if (!row.moneyOk && row.cost) {
    return `概算${formatYen(row.cost.total)}で、予算を${formatYen(row.cost.total - brief.budget)}超えます。`;
  }
  if (brief.avoidStairs && row.dest.hardship.stairs >= 3) return "階段が多いので、今回は外しています。";
  return null;
}

function explainMiss(ranked, brief) {
  if (brief.workId) {
    const hit = ranked.find((row) => row.dest.id === brief.workId);
    const title = brief.workTitle || "その作品";
    if (hit?.cost && !hit.moneyOk) {
      return `${title}のモデル地は${hit.dest.name}です。概算${formatYen(hit.cost.total)}で、予算を${formatYen(hit.cost.total - brief.budget)}超えます。`;
    }
    if (hit && !hit.shapeOk) {
      return `${brief.origin}から${hit.dest.name}は、この日数だと移動だけで終わります。泊数を足すか、出発地を変えてください。`;
    }
  }

  const shaped = ranked.filter((row) => row.shapeOk && row.cost);
  if (!shaped.length) {
    const span = brief.nights === 0 ? "日帰り" : `${brief.nights}泊`;
    return `${brief.origin}発の${span}で行ける場所がありません。`;
  }
  const affordable = shaped.filter((row) => row.cost.total <= brief.budget * 1.03);
  if (!affordable.length) {
    const cheapest = [...shaped].sort((a, b) => a.cost.total - b.cost.total)[0];
    return `いちばん近いのは${cheapest.dest.name}で、概算${formatYen(cheapest.cost.total)}です。予算${formatYen(brief.budget)}には${formatYen(cheapest.cost.total - brief.budget)}足りません。`;
  }
  if (brief.avoidStairs) {
    return "階段の少ない行き先が、この予算と日数では見つかりませんでした。";
  }
  if (brief.mode === "pilgrimage") {
    return "その条件に合う聖地が見つかりません。ラブライブ、あの花、けいおん、らき☆すた、スラムダンク、時をかける少女のどれかを書くか、日帰りにしてください。";
  }
  return "条件に合う行き先が見つかりませんでした。泊数を一日減らすと、候補が出ることが多いです。";
}

function seasonNotes(dest, month) {
  if (!month) return [];
  const notes = [];
  const coldHeight = ["nikko", "kawaguchiko", "okutama", "kusatsu", "takayama", "matsumoto"].includes(dest.id);
  if ((month >= 10 || month <= 3) && dest.tags.includes("sea")) {
    notes.push("海水浴の季節ではありません。海は眺めて歩く前提で組んでいます。");
  }
  if (month >= 10 && month <= 11 && (coldHeight || dest.id === "hakone")) {
    notes.push("朝晩は冷えます。紅葉は高いところから色づくので、昼の観光バスと待ち時間が重なります。");
  }
  if (dest.id === "kyoto" && month >= 10 && month <= 11) {
    notes.push("紅葉の本番はまだ先でも、休日の清水と嵐山は混みます。寺は朝の一つで止める前提です。");
  }
  if (dest.id === "chichibu" && month >= 5 && month <= 10) {
    notes.push("羊山の芝桜は春です。この時期の秩父は、神社と寺だけで成立させます。");
  }
  if (month >= 12 || month <= 2) {
    notes.push("日没が早い季節です。山側の予定は、15時までに切り上げる前提です。");
  }
  return notes;
}

function packingList(dest, brief) {
  const month = brief.dates?.month;
  const items = [
    { name: "帰りの時刻", detail: "乗る前に復路を決める。現地で次の一本を探さない。" },
    {
      name: "現金",
      detail: dest.tags.includes("onsen")
        ? "小さい食堂と外湯は、カードが使えないことがあります。"
        : "小さい食堂は、カードが使えないことがあります。",
    },
  ];
  if (dest.hardship.stairs >= 2) {
    items.push({ name: "歩き慣れた靴", detail: "坂か階段が、この行程の中に入っています。" });
  }
  if (dest.hardship.parking >= 3) {
    items.push({ name: "車は使わない", detail: "駐車場が狭いので、列車で行く見積もりです。" });
  }
  if (brief.nights > 0) {
    items.push({ name: "すぐ使うものだけ手元に", detail: "荷物は宿か駅に置いてから、観光に出ます。" });
  }
  if (dest.tags.includes("onsen")) {
    items.push({ name: "替えの下着", detail: "湯に二度入る行程です。タオルは宿か日帰り施設で足ります。" });
  }
  if (month && (month >= 10 || month <= 3) && (dest.tags.includes("nature") || dest.tags.includes("onsen") || dest.tags.includes("sea"))) {
    items.push({
      name: "薄い羽織",
      detail: dest.tags.includes("onsen")
        ? "朝の列車と、湯から上がったあとに冷えます。"
        : "朝の列車と、海や山の風で冷えます。",
    });
  }
  if (dest.works.length) {
    items.push({ name: "地図", detail: "聖地は1か所で足ります。バスの時刻を確認してください。" });
  }
  return items;
}

function replaceBudget(text, yen) {
  const stripped = text
    .replace(/予算\s*/g, "")
    .replace(/(\d+)\s*万\s*(\d+)\s*千\s*円?/g, "")
    .replace(/(\d+(?:\.\d+)?)\s*万円?/g, "")
    .replace(/(\d{3,7})\s*円/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
  return `予算 ${yen}円\n${stripped}`;
}

function stripStay(text) {
  return text
    .replace(/日帰り/g, "")
    .replace(/\d+\s*泊\s*\d+\s*日/g, "")
    .replace(/\d+\s*泊/g, "")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function writeLetter(dest, brief, cost, mode) {
  const lines = [
    `${brief.origin}から${dest.name}。${cost.how}。片道およそ${cost.minutes}分です。`,
    dest.secretary,
  ];
  if (cost.total > brief.budget) {
    lines.push(`概算は${formatYen(cost.total)}で、予算より${formatYen(cost.total - brief.budget)}多く見ています。`);
  } else {
    lines.push(`概算${formatYen(cost.total)}。予算のうち${formatYen(brief.budget - cost.total)}は、土産と寄り道の予備です。`);
  }
  if (cost.usedSaver) {
    lines.push(`速い経路（${cost.upgradeHow}）にするとおよそ${formatYen(cost.upgradeExtra)}増えます。今回は遅い経路で作っています。`);
  }
  if ((brief.party || 1) > 1) {
    lines.push(`この金額はひとり分です。${brief.party}人ならおよそ${formatYen(cost.groupTotal)}です。`);
  }
  if (brief.weekendLodging) lines.push("土曜泊の割増を入れています。平日にずらすと、宿はもう少し静かです。");
  if (brief.nights >= 2) lines.push("中日は、新しい場所へ行かず休みにしています。");
  if (mode === "gacha") lines.push("行き先はこちらで選びました。別の場所にする場合は、もう一度選べます。");
  if (mode === "safe") lines.push("混雑、坂、駐車場の注意を先に入れて作っています。");
  if (mode === "pilgrimage" && !brief.workId) {
    lines.push("作品の指定がなかったので、条件に収まる聖地をこちらで選びました。");
  }
  return lines;
}

function buildDays(dest, brief, cost) {
  const raw = brief.nights === 0
    ? [{ label: "日帰り", date: brief.dates.perDay[0], blocks: applyGates(dest.itinerary.day, brief, cost) }]
    : [
        { label: "1日目", date: brief.dates.perDay[0], blocks: applyGates(dest.itinerary.first, brief, cost) },
        ...Array.from({ length: Math.max(0, brief.nights - 1) }, (_, index) => ({
          label: `${index + 2}日目`,
          date: brief.dates.perDay[index + 1],
          blocks: defaultMiddle(dest),
        })),
        {
          label: `${brief.nights + 1}日目`,
          date: brief.dates.perDay[brief.nights],
          blocks: applyGates(dest.itinerary.last, brief, cost),
        },
      ];
  return raw.map((day) => {
    const shifted = pullReturn(shiftDeparture(day.blocks, brief), brief, cost);
    const edited = editBlocks(shifted, dest, brief, cost);
    const home = arrivalHome(edited.blocks, brief, cost);
    const next = { ...day, blocks: edited.blocks, cuts: edited.cuts, home };
    return { ...next, aim: dayAim(next), pace: dayPace(next.blocks) };
  });
}

function shiftDeparture(blocks, brief) {
  if (!brief.departAt) return blocks;
  const outbound = blocks.find((block) => block.title.endsWith("を出る"));
  if (!outbound) return blocks;
  const delta = clockToMinutes(brief.departAt) - clockToMinutes(outbound.t);
  if (!delta) return blocks;
  return blocks.map((block) => ({ ...block, t: minutesToClock(clockToMinutes(block.t) + delta) }));
}

function pullReturn(blocks, brief, cost) {
  if (!brief.homeBy) return blocks;
  const index = blocks.findIndex((block) => block.title.endsWith("へ戻る"));
  if (index < 0) return blocks;
  const leaveBy = clockToMinutes(brief.homeBy) - cost.minutes;
  if (leaveBy < 6 * 60 || clockToMinutes(blocks[index].t) <= leaveBy) return blocks;
  return blocks.map((block, blockIndex) => (
    blockIndex === index ? { ...block, t: minutesToClock(leaveBy) } : block
  ));
}

function dayPace(blocks) {
  const sights = blocks.filter((block) => block.k === "see" && !block.title.includes("荷物")).length;
  if (!blocks.length) return "普通";
  const span = clockToMinutes(blocks[blocks.length - 1].t) - clockToMinutes(blocks[0].t);
  if (sights >= 3 || span >= 12 * 60) return "予定が多い";
  if (sights <= 1 && span <= 8 * 60) return "余裕がある";
  return "普通";
}

function dayAim(day) {
  if (day.home) return `${day.home.t}に${day.home.place}に着く予定です。`;
  const sights = day.blocks.filter((block) => block.k === "see" && !block.title.includes("荷物"));
  if (sights.length === 1) return `この日の観光は「${sights[0].title}」です。夜は宿に戻ります。`;
  if (sights.length > 1) {
    return `この日の観光は${sights.map((block) => `「${block.title}」`).join("と")}です。夜は宿に戻ります。`;
  }
  return "この日は観光を追加しません。";
}

function writePlanDoc(dest, brief, cost, days) {
  const outbound = days[0]?.blocks.find((block) => block.title.endsWith("を出る"));
  const homeDay = [...days].reverse().find((day) => day.home);
  const party = brief.party || 1;
  const over = cost.total > brief.budget;
  const nightsLabel = brief.nights === 0 ? "日帰り" : `${brief.nights}泊${brief.nights + 1}日`;
  return {
    nightsLabel,
    partyLabel: `${party}人`,
    routeLabel: cost.usedSaver ? "遅い経路" : "速い列車",
    facts: [
      { label: "出発", value: outbound ? `${brief.origin} ${outbound.t}` : brief.origin },
      { label: "片道", value: `およそ${cost.minutes}分` },
      { label: "帰宅", value: homeDay ? `${homeDay.home.place} ${homeDay.home.t}` : "現地に泊まる" },
      { label: "日数", value: nightsLabel },
      { label: "ひとり", value: formatYen(cost.total) },
      { label: "予算", value: over ? `${formatYen(cost.total - brief.budget)}超過` : `残り ${formatYen(brief.budget - cost.total)}` },
    ],
    leg: {
      how: cost.how,
      minutes: cost.minutes,
      fare: cost.transport,
      usedSaver: cost.usedSaver,
      back: homeDay
        ? `${homeDay.date}、${homeDay.home.t}に${homeDay.home.place}着の見積もりです。`
        : "最終日まで現地に泊まります。",
    },
    checks: departureChecks(dest, brief, cost, days, homeDay),
  };
}

function departureChecks(dest, brief, cost, days, homeDay) {
  const checks = [];
  if (homeDay) {
    const back = homeDay.blocks.find((block) => block.title.endsWith("へ戻る"));
    checks.push({
      name: "復路の時刻",
      detail: back
        ? `${homeDay.date}の${back.t}に${brief.origin}へ向かう。着は${homeDay.home.t}。現地で次の一本を探さない。`
        : `${homeDay.home.t}に${brief.origin}着で見ています。乗る時刻は出発前に決める。`,
    });
  }
  const luggage = days.flatMap((day) => day.blocks).find((block) => /荷物/.test(`${block.title}${block.detail}`));
  if (luggage) {
    checks.push({ name: "荷物の置き場", detail: `${luggage.t}「${luggage.title}」。${luggage.detail}` });
  }
  if (cost.canSave) {
    checks.push({
      name: "列車",
      detail: cost.usedSaver
        ? `今は遅い経路です。速い列車（${cost.upgradeHow}）にすると、およそ${formatYen(cost.upgradeExtra)}増えます。`
        : `今は速い列車です。遅い経路にすると、およそ${formatYen(cost.upgradeExtra)}下がります。`,
    });
  }
  if (brief.nights > 0) {
    checks.push({
      name: "宿",
      detail: `${withHotel(dest)}。宿はひとり${formatYen(cost.lodging)}で見ています。空室は確認していません。`,
    });
  }
  const meal = days.flatMap((day) => day.blocks).find((block) => block.k === "eat");
  if (meal) {
    checks.push({
      name: "最初の食事",
      detail: `${meal.t}「${meal.title}」。食事はひとり${formatYen(cost.food)}までで見ています。`,
    });
  }
  return checks;
}

function editBlocks(blocks, dest, brief, cost) {
  const dusk = duskAt(brief.dates?.month);
  const hasReturn = blocks.some((block) => block.title.endsWith("へ戻る"));
  const leaveBy = brief.homeBy && hasReturn ? clockToMinutes(brief.homeBy) - cost.minutes : null;
  const sightIndexes = blocks.map((block, index) => (isSight(block) ? index : -1)).filter((index) => index >= 0);
  let keptSights = 0;
  const cuts = [];
  const next = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const reason = reasonToCut(block, {
      brief,
      dusk,
      leaveBy,
      keptSights,
      optional: block.hold === "extra" || sightIndexes.length > 1,
      isCandidate: sightIndexes.includes(index),
    });
    if (reason) cuts.push({ title: block.title, t: block.t, reason });
    else {
      if (isSight(block)) keptSights += 1;
      next.push(block);
    }
  }
  next.sort((a, b) => clockToMinutes(a.t) - clockToMinutes(b.t));
  return { blocks: next, cuts };
}

function reasonToCut(block, ctx) {
  if (ctx.brief.omitTitles?.includes(block.title) && isSight(block)) return "この予定は外しました。";
  const returning = block.title.endsWith("へ戻る") || block.title.endsWith("を出る");
  if (
    ctx.leaveBy != null
    && ctx.leaveBy >= 6 * 60
    && !returning
    && (block.k === "see" || block.k === "eat")
    && clockToMinutes(block.t) >= ctx.leaveBy
  ) {
    return "帰りたい時刻に間に合わないので、外しました。";
  }
  if (!ctx.isCandidate) return null;
  return cutSight(block, ctx);
}

function isSight(block) {
  return block.k === "see" && !block.title.includes("荷物");
}

function cutSight(block, ctx) {
  if (clockToMinutes(block.t) >= ctx.dusk) return "この時刻には外が暗いので、外しました。";
  if ((ctx.brief.avoidStairs || ctx.brief.withKids) && block.hold === "stairs") {
    return "坂か階段が本体なので、外しました。";
  }
  if (ctx.brief.avoidCrowd && ctx.optional && (block.hold === "crowd" || block.hold === "extra")) {
    return "人が重なるので、外しました。";
  }
  if (ctx.brief.oneSight && (block.hold === "extra" || ctx.keptSights >= 1)) {
    return "この日の観光地は、一つで止めています。";
  }
  return null;
}

function duskAt(month) {
  if (month === 12 || month <= 2) return 16 * 60 + 30;
  if (month === 11 || month === 3) return 17 * 60;
  if (month === 10 || month === 4) return 17 * 60 + 30;
  return 18 * 60 + 30;
}

function arrivalHome(blocks, brief, cost) {
  const back = blocks.find((block) => block.title === `${brief.origin}へ戻る`);
  if (!back) return null;
  const total = clockToMinutes(back.t) + cost.minutes;
  const day = Math.floor(total / (24 * 60));
  const rest = total % (24 * 60);
  const hour = Math.floor(rest / 60);
  const minute = rest % 60;
  const clock = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { place: brief.origin, t: day > 0 ? `翌${clock}` : clock };
}

function writeVerdict(dest, brief, cost, alternatives) {
  const hitLabels = brief.prefs
    .filter((pref) => dest.tags.includes(pref) || (pref === "onsen" && (dest.onsen || 0) >= 4))
    .map((id) => PREF_DEFS.find((row) => row[0] === id)?.[1])
    .filter(Boolean);
  const stay = brief.nights === 0 ? "日帰り" : `${brief.nights}泊`;
  const lines = [];
  if (brief.placeId === dest.id) {
    lines.push(`行き先は${dest.name}です。入力どおり、この場所で作っています。`);
  } else if (brief.workId === dest.id) {
    lines.push(`${brief.workTitle}の場所として、${dest.name}を選んでいます。`);
  } else if (brief.leanLabels?.length) {
    const been = brief.beenNames?.length ? `行った場所は${brief.beenNames.join("、")}です。` : "";
    lines.push(`${been}${brief.leanLabels.join("、")}が多いので、その傾向で${dest.name}を選んでいます。`);
  } else {
    const hope = hitLabels.length ? `、希望は${hitLabels.join("、")}` : "";
    lines.push(`条件は${brief.origin}発、${stay}、予算${formatYen(brief.budget)}${hope}です。この条件から${dest.name}を選んでいます。`);
  }
  if ((brief.been || []).includes(dest.id) && brief.placeId !== dest.id) {
    lines.push(`${dest.name}は行った記録にあります。`);
  } else if (brief.beenNames?.length && brief.placeId !== dest.id && brief.workId !== dest.id) {
    lines.push(`行った${brief.beenNames.join("、")}は、今回の候補から下げています。`);
  }
  const next = alternatives?.find((item) => item.total != null);
  if (next) {
    const diff = next.total - cost.total;
    if (diff === 0) lines.push(`次の候補は${next.name}で、費用は同じです。`);
    else lines.push(`次の候補は${next.name}で、ひとり${formatYen(Math.abs(diff))}${diff > 0 ? "高く" : "安く"}なります。`);
  }
  const stair = dest.hardship.stairs >= 4 ? "多い" : dest.hardship.stairs >= 2 ? "あり" : "少ない";
  return {
    lines,
    marks: [
      { label: "予算", value: cost.total <= brief.budget ? "以内" : "超過" },
      { label: "片道", value: `${cost.minutes}分` },
      { label: "坂", value: stair },
      { label: "希望", value: hitLabels.length ? hitLabels.join("・") : brief.leanLabels?.length ? `傾向 ${brief.leanLabels.join("・")}` : "指定なし" },
    ],
  };
}

function writeAlerts(dest, brief, cost, days) {
  const alerts = [];
  if (cost.total > brief.budget) {
    alerts.push(`費用が予算を${formatYen(cost.total - brief.budget)}超えています。`);
  }
  const homeDay = [...days].reverse().find((day) => day.home);
  if (homeDay?.home.t.startsWith("翌")) alerts.push("帰宅が日付をまたぎます。出発を早めるか、泊数を増やしてください。");
  else if (homeDay && clockToMinutes(homeDay.home.t) >= 21 * 60) {
    alerts.push(`帰宅が${homeDay.home.t}です。帰りを早めた方が安全です。`);
  }
  if (dest.hardship.stairs >= 3 && !brief.avoidStairs) alerts.push("坂が多い行き先です。坂を避けると、対象の予定を外せます。");
  if (dest.hardship.crowd >= 3 && !brief.avoidCrowd) alerts.push("人が集まりやすい行き先です。混雑を避けると、重なる予定を外せます。");
  const rushed = days.filter((day) => day.pace === "予定が多い");
  if (rushed.length) alerts.push(`${rushed.map((day) => day.label).join("、")}は予定が多いです。`);
  if (brief.homeBy && cost.minutes >= clockToMinutes(brief.homeBy) - 6 * 60) {
    alerts.push("帰りたい時刻に対して、移動時間が長すぎます。");
  }
  return alerts;
}

function writeCall(dest, brief, cost, cuts) {
  const within = cost.total > brief.budget
    ? `${dest.name}で作りました。費用は予算を超えています。`
    : `${dest.name}で、予算内に収めて作りました。`;
  if (cuts.length) return `${within}${cuts.map((cut) => `「${cut.title}」`).join("、")}は入れていません。`;
  const idle = [];
  if (brief.avoidStairs) idle.push("坂を避ける対象の予定はありません。");
  if (brief.avoidCrowd) idle.push("混雑を避ける対象の予定はありません。");
  if (brief.oneSight) idle.push("観光地はすでに1か所ずつです。");
  if (idle.length) return `${within}${idle.join("")}`;
  return `${within}観光の数は抑えています。`;
}

const REFUSALS = {
  hakone: [
    { title: "大涌谷", reason: "火山ガスで閉じる日がある。主目的にすると、代わりが効きません。" },
    { title: "美術館を足すこと", reason: "旧街道と美術館を同じ午前にすると、帰りの列車が崩れます。" },
  ],
  atami: [
    { title: "駅裏の坂を荷物で上がること", reason: "熱海の失敗は、着いた直後の坂です。" },
    { title: "夜の花火まで風呂を遅らせること", reason: "この予算の取り柄は、宿に戻って湯に入れる近さです。" },
  ],
  kusatsu: [
    { title: "湯畑の売り物", reason: "景色は15分で足ります。買い物が午後を使います。" },
    { title: "夜のイベント", reason: "翌朝のバスが早いので、夜は宿で終えます。" },
  ],
  nikko: [
    { title: "華厳の滝と東照宮を同じ日", reason: "どちらも階段のあとが本番です。膝が残るのは片方だけです。" },
    { title: "中禅寺湖までの日帰り", reason: "バスの往復で、社寺を見る時間がなくなります。" },
  ],
  kawaguchiko: [
    { title: "見えない富士を待つこと", reason: "15分で切り上げる。待っても、雲は晴れません。" },
    { title: "ロープウェイの行列", reason: "並んでいたら捨てる。湖畔の短さが、この旅の本体です。" },
  ],
  kamakura: [
    { title: "昼の小町通り", reason: "昼前から進めません。食事は海岸側か駅です。" },
    { title: "江の島の参道を上り切ること", reason: "階段が本体です。余力がなければ、入口で見ます。" },
  ],
  kawagoe: [
    { title: "菓子屋横丁の中で食べること", reason: "休日の昼は、ほぼ一方通行になります。" },
    { title: "蔵通りの先の店を全部見ること", reason: "時の鐘までで、街としては足りています。" },
  ],
  okutama: [
    { title: "15時以降の奥のバス", reason: "最終を気にして、景色を見られなくなります。" },
    { title: "渓谷の奥まで足すこと", reason: "歩ける川沿いで終えないと、この日は戻れません。" },
  ],
  chichibu: [
    { title: "季節外れの羊山", reason: "芝桜は春です。この時期は、神社と寺だけで成立させます。" },
    { title: "定林寺と街を同じ午後に欲張ること", reason: "帰りのバスが、行程の主役になります。" },
  ],
  numazu: [
    { title: "学校を探すこと", reason: "聖地は海岸と淡島です。住宅地の坂は一本まで。" },
    { title: "内浦の坂を二本歩くこと", reason: "二本目で、港へ戻る時間がなくなります。" },
  ],
  washinomiya: [
    { title: "商店街だった場所で時間を使うこと", reason: "参拝が本編です。通りすがりで足ります。" },
    { title: "周辺を聖地の街並みとして歩くこと", reason: "静かな住宅地です。期待を足すと、何もないように感じます。" },
  ],
  arima: [
    { title: "坂の途中で諦めない温泉寺", reason: "入口までで引き返す日を、先に許しておきます。" },
    { title: "温泉街を端まで歩くこと", reason: "有馬は坂そのものが街です。一本で終えます。" },
  ],
  kinosaki: [
    { title: "外湯を夜に全部回ること", reason: "夜は脱衣所が狭くなります。午後と翌朝に分けます。" },
    { title: "川沿いの店をはしごすること", reason: "湯が本体です。食事は一軒で終えます。" },
  ],
  onomichi: [
    { title: "坂の上の路地を二本", reason: "下りで一本だけ。二本目は荷物と膝で失敗します。" },
    { title: "尾道水道の向こう側", reason: "この日数では、坂の上までで足りています。" },
  ],
  kanazawa: [
    { title: "ひがし茶屋の座敷見学", reason: "通過して、お菓子を一つ。座敷を足すと昼が終わります。" },
    { title: "昼の団体と一緒の兼六園", reason: "開門に合わせます。昼は茶屋の方へ退きます。" },
  ],
  takayama: [
    { title: "人が多い時間のさんまち", reason: "朝の30分のために泊まります。昼に深く入りません。" },
    { title: "朝市を食事の代わりにすること", reason: "見て、何か一つ。食事は店で済ませます。" },
  ],
  toyosato: [
    { title: "校庭で長く待つこと", reason: "内部を見たら、戻る列車の時間です。" },
    { title: "周辺に聖地の街並みを探すこと", reason: "周りは田園と住宅です。校舎だけで完結させます。" },
  ],
  kyoto: [
    { title: "清水、嵐山、伏見稲荷を同じ日", reason: "三つ入れると、どれも見ていない一日になります。" },
    { title: "昼の市バスで寺をはしごすること", reason: "詰まったバスは、時刻表どおりに来ません。" },
  ],
  nara: [
    { title: "鹿せんべい", reason: "餌を見せると囲まれます。買わない方が歩けます。" },
    { title: "東大寺と春日大社を両方", reason: "半日の街です。寺は一つで足ります。" },
  ],
  kurashiki: [
    { title: "美観地区の午後のもう一往復", reason: "川沿いは、午後には人の幅しか残りません。" },
    { title: "夜の美観地区", reason: "朝に歩き切る。夜は駅側で終えます。" },
  ],
  matsumoto: [
    { title: "上高地や乗鞍を足すこと", reason: "足すと、移動だけで1泊が終わります。" },
    { title: "縄手の真ん中で座ること", reason: "通りすぎます。食事は駅側です。" },
  ],
};

function defaultMiddle(dest) {
  const spot = dest.spots[0];
  const meal = dest.meals[0];
  return [
    { t: "08:30", k: "rest", title: "朝は予定を置かない", detail: "この日は移動がない。宿のまわりを、店が開く前に歩く。" },
    { t: "11:00", k: "see", title: spot.name, detail: spot.note },
    { t: "13:00", k: "eat", title: meal.name, detail: meal.note },
    { t: "16:30", k: "stay", title: "宿に戻る", detail: "夜の予定は入れない。翌日の帰りが軽くなる。" },
  ];
}

function applyGates(blocks, brief, cost) {
  const outIndex = blocks.findIndex((block) => block.gate === "out");
  let delta = 0;
  if (outIndex >= 0 && outIndex < blocks.length - 1) {
    const ready = clockToMinutes(blocks[outIndex].t) + cost.minutes + 15;
    const next = clockToMinutes(blocks[outIndex + 1].t);
    if (next < ready) delta = ready - next;
  }

  return blocks.map((block, index) => {
    const t = index > outIndex && delta > 0 ? minutesToClock(clockToMinutes(block.t) + delta) : block.t;
    if (block.gate === "out") {
      return {
        t,
        k: "move",
        title: `${brief.origin}を出る`,
        detail: `${cost.how}。片道およそ${cost.minutes}分。`,
      };
    }
    if (block.gate === "back") {
      return {
        t,
        k: "move",
        title: `${brief.origin}へ戻る`,
        detail: `復路も片道およそ${cost.minutes}分。${cost.usedSaver ? "速い列車にしても、この日は詰めなくていい。" : "座れる時間を先に押さえる。"}`,
      };
    }
    return { t, k: block.k, title: block.title, detail: block.detail, hold: block.hold };
  });
}

function clockToMinutes(clock) {
  const [hour, minute] = clock.split(":").map(Number);
  return hour * 60 + minute;
}

function minutesToClock(total) {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}
