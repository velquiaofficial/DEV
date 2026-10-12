import { adjustPlan, planTrip, reviseText } from "../src/planner.js";
import { countdownLine, daysUntil, itineraryShape, seasonBand, tripIcs, walkMinutes } from "../src/tripkit.js";
import { DESTINATIONS } from "../src/destinations.js";

const now = new Date(2026, 8, 27, 23, 16);
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed += 1;
    console.error("FAIL", message);
  }
}

function trip(text, mode) {
  return planTrip(text, mode, now);
}

function clock(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

const onsen = trip("予算 3万円\n東京発\n温泉好き\n1泊2日", "plan");
assert(onsen.ok && onsen.name === "箱根", `onsen winner ${onsen.name} total ${onsen.cost?.total}`);
assert(onsen.cost.total <= 30000, `hakone over budget ${onsen.cost.total}`);
assert(onsen.cost.transport + onsen.cost.lodging + onsen.cost.food + onsen.cost.local + onsen.cost.tickets === onsen.cost.total, "cost parts");
assert(onsen.dates.range.includes("10月3日"), onsen.dates.range);
assert(onsen.days.length === 2, "two days");
assert(onsen.days[0].blocks[0].title.includes("東京"), onsen.days[0].blocks[0].title);
assert(onsen.refused.length === 2, "hakone refusals");
assert(onsen.days[0].blocks.some((block) => block.title.includes("芦ノ湖畔")), "walk kept");
assert(onsen.days[0].home == null, "day one stays");
assert(onsen.days[1].home?.t === "15:05", `home ${onsen.days[1].home?.t}`);
assert(onsen.planDoc?.facts?.length === 6, "plan facts");
assert(onsen.planDoc.facts.find((fact) => fact.label === "帰宅")?.value === "東京 15:05", onsen.planDoc?.facts?.map((fact) => fact.value).join(" / "));
assert(onsen.planDoc.checks.some((item) => item.name === "復路の時刻"), "return check");
assert(onsen.days[1].aim?.includes("15:05"), onsen.days[1].aim);
assert(onsen.days[0].aim?.includes("芦ノ湖畔"), onsen.days[0].aim);
const tight = adjustPlan(onsen, { oneSight: true });
assert(tight.cuts.some((cut) => cut.title.includes("芦ノ湖畔")), "one sight cuts the walk");
assert(!tight.days[0].blocks.some((block) => block.title.includes("芦ノ湖畔")), "walk removed");
console.log("onsen", onsen.name, onsen.cost.total, onsen.alternatives.map((item) => item.name).join(","));

const gachaText = "今週末暇\n予算 1万円";
for (let index = 0; index < 30; index += 1) {
  const drawn = trip(gachaText, "gacha");
  assert(drawn.ok, `gacha miss ${drawn.message}`);
  if (!drawn.ok) continue;
  assert(drawn.cost.total <= 10300, `${drawn.name} ${drawn.cost.total}`);
  assert(drawn.brief.nights === 0, "gacha nights");
  assert(drawn.days.length === 1, "gacha day");
}

const live = trip("予算 2万円\n東京発\nラブライブ\n日帰り", "pilgrimage");
assert(live.ok && live.name === "沼津", `live ${live.name}`);
assert(live.works.some((work) => work.title.includes("サンシャイン")), "work title");

const flower = trip("予算 1万5千円\n東京発\nあの花\n日帰り", "pilgrimage");
assert(flower.ok && flower.name === "秩父", `flower ${flower.name}`);

const kon = trip("予算 1万円\n名古屋発\nけいおん\n日帰り", "pilgrimage");
assert(kon.ok && kon.name === "豊郷", `kon ${kon.name} ${kon.message || ""}`);

const dunk = trip("予算 2万円\n東京発\nスラムダンク\n日帰り", "pilgrimage");
assert(dunk.ok && dunk.name === "鎌倉", `dunk ${dunk.name}`);

const solo = trip("予算 4万円\n大阪発\n一人\n静かな温泉\n1泊2日", "solo");
assert(solo.ok && solo.name === "城崎", `solo ${solo.name} ${solo.cost?.total}`);
console.log("solo", solo.name, solo.cost?.total, solo.alternatives.map((item) => `${item.name}:${item.note || "ok"}`).join(" | "));

const fuji = trip("予算 3万円\n東京発\n富士\n1泊2日", "plan");
assert(fuji.ok && fuji.name === "河口湖", `fuji ${fuji.name}`);

const food = trip("予算 6万円\n東京発\nご飯が目的\n金沢\n1泊2日", "plan");
assert(food.ok && food.name === "金沢", `food ${food.name} ${food.cost?.total}`);

const safe = trip("予算 3万円\n東京発\n箱根\n階段と駐車場が心配\n1泊2日", "safe");
assert(safe.ok && safe.name === "箱根", `safe ${safe.name}`);
assert(safe.cautions.some((item) => item.tag === "駐車場"), "parking caution");

const tokyo = trip("東京都発\n予算 3万円\n温泉\n1泊2日", "plan");
assert(tokyo.ok && tokyo.brief.origin === "東京", `tokyo origin ${tokyo.brief.origin}`);

const kyoto = trip("京都発\n予算 3万円\n温泉\n1泊2日", "plan");
assert(kyoto.ok && kyoto.brief.origin === "京都" && kyoto.name === "有馬", `kyoto ${kyoto.brief.origin} ${kyoto.name}`);

const fukuoka = trip("福岡発\n予算 3万円\n温泉\n1泊2日", "plan");
assert(fukuoka.ok && fukuoka.brief.origin === "福岡", fukuoka.message || fukuoka.name);
const north = trip("予算 8万円\n沖縄発\n北海道\n1泊2日", "plan");
assert(north.ok && north.name === "北海道", north.message || north.name);
const aomori = trip("予算 3万円\n青森発\n1泊2日", "plan");
assert(aomori.ok, aomori.message);

const nobudget = trip("東京発\n温泉", "plan");
assert(!nobudget.ok, "budget required");

const stairs = trip("予算 3万円\n東京発\n温泉\n1泊2日\n階段が苦手", "plan");
assert(stairs.ok && stairs.name === "箱根", `stairs avoid still hakone ${stairs.name}`);

for (const dest of DESTINATIONS) {
  assert(dest.meals.length && dest.spots.length && dest.cautions.length >= 3, `${dest.id} content`);
  assert(dest.solo?.stay && dest.solo.food && dest.solo.quiet, `${dest.id} solo`);
  const blocks = [dest.itinerary.day, dest.itinerary.first, dest.itinerary.last].filter(Boolean).flat();
  assert(blocks.length > 0, `${dest.id} itinerary`);
}

const kyotoOrigin = trip("京都発\n予算 3万円\n温泉\n1泊2日", "plan");
assert(kyotoOrigin.ok && kyotoOrigin.brief.placeId == null && kyotoOrigin.name === "有馬", `kyoto origin ${kyotoOrigin.brief.placeId} ${kyotoOrigin.name}`);

const kyotoDest = trip("予算 2万円\n大阪発\n京都\n日帰り", "plan");
assert(kyotoDest.ok && kyotoDest.name === "京都", `kyoto dest ${kyotoDest.name} ${kyotoDest.message || ""}`);
assert(kyotoDest.season.length > 0, "october season");
assert(kyotoDest.packing.some((item) => item.name === "歩き慣れた靴"), "packing shoes");

const kyotoStay = trip("予算 6万円\n東京発\n京都\n1泊2日", "plan");
assert(kyotoStay.ok && kyotoStay.name === "京都", `kyoto stay ${kyotoStay.name}`);
const departAt = clock(kyotoStay.days[0].blocks[0].t);
const arriveAt = clock(kyotoStay.days[0].blocks[1].t);
assert(arriveAt >= departAt + kyotoStay.cost.minutes, `kyoto clocks ${kyotoStay.days[0].blocks[0].t} ${kyotoStay.days[0].blocks[1].t} ${kyotoStay.cost.minutes}`);
const kyotoSlow = adjustPlan(kyotoStay, { express: false });
assert(kyotoSlow.cuts.some((cut) => cut.title.includes("鴨川")), `dusk cut ${kyotoSlow.cuts.map((cut) => cut.title).join(",")}`);
const kyotoStairs = adjustPlan(kyotoStay, { avoidStairs: true });
assert(kyotoStairs.cuts.some((cut) => cut.title.includes("寺を一つ")), "kyoto stairs");

for (const dest of DESTINATIONS) {
  const origin = Object.entries(dest.access).sort((a, b) => a[1].minutes - b[1].minutes)[0][0];
  const stay = dest.itinerary.first ? "1泊2日" : "日帰り";
  const made = trip(`予算 80000円\n${origin}発\n${dest.name}\n${stay}`, "plan");
  assert(made.ok && made.name === dest.name && made.refused.length >= 2, `${dest.id} refused ${made.name} ${made.refused?.length} ${made.message || ""}`);
}

const nara = trip("予算 1万円\n大阪発\n奈良\n日帰り", "plan");
assert(nara.ok && nara.name === "奈良", `nara ${nara.name}`);

const fast = adjustPlan(onsen, { express: true });
assert(fast.cost.usedSaver === false && fast.cost.total > onsen.cost.total, `express ${fast.cost.total}`);
const pair = adjustPlan(onsen, { party: 2 });
assert(pair.cost.total === onsen.cost.total && pair.cost.groupTotal === onsen.cost.total * 2, "party");

const cheaperText = reviseText("予算 3万円\n東京発\n温泉好き\n1泊2日", "もっと安く", onsen.brief);
const cheaper = trip(cheaperText, "plan");
assert(cheaper.brief.budget < 30000, cheaperText);

const names = new Set(DESTINATIONS.map((dest) => dest.id));
assert(names.size === DESTINATIONS.length, "unique ids");

const later = adjustPlan(onsen, { departAt: "10:00" });
assert(later.days[0].blocks[0].t === "10:00", `depart ${later.days[0].blocks[0].t}`);
assert(later.days[1].home?.t === "15:05", `day2 stays ${later.days[1].home?.t}`);
assert(onsen.verdict.lines[0].includes("この条件から箱根を選んでいます"), onsen.verdict.lines[0]);
const leaned = planTrip("予算 3万円\n東京発\n1泊2日", "plan", now, { visits: ["hakone", "kusatsu", "kinosaki"] });
assert(leaned.ok && !["hakone", "kusatsu", "kinosaki"].includes(leaned.destId), `leaned ${leaned.name}`);
assert(leaned.verdict.lines[0].includes("温泉が多いので、その傾向で"), leaned.verdict.lines[0]);
assert(leaned.verdict.lines.some((line) => line.includes("下げています")), leaned.verdict.lines.join(" / "));
assert(onsen.verdict.lines[0].includes("希望は温泉"), onsen.verdict.lines[0]);
const named = trip("予算 3万円\n東京発\n箱根\n1泊2日", "plan");
assert(named.verdict.lines[0].includes("行き先は箱根です"), named.verdict.lines[0]);
assert(later.verdict?.lines?.some((line) => line.includes("温泉")), later.verdict?.lines?.join(" / "));
assert(later.alerts.some((line) => line.includes("人が集まりやすい")), later.alerts.join(" / "));

const earlyHome = adjustPlan(onsen, { homeBy: "14:00" });
assert(earlyHome.days[1].home?.t === "14:00", `home by ${earlyHome.days[1].home?.t}`);
assert(earlyHome.days[0].blocks.some((block) => block.title.includes("芦ノ湖畔")), "homeBy keeps the first day");

const dated = trip("予算 3万円\n東京発\n温泉好き\n1泊2日\n出発 2026年10月7日", "plan");
assert(dated.ok && dated.dates.range.includes("10月7日（水）"), dated.dates.range);
assert(dated.dates.range.includes("10月8日（木）"), dated.dates.range);
assert(dated.brief.weekendLodging === false, "wednesday lodging");
assert(dated.cost.total === 29600, `weekday stay ${dated.cost.total}`);
assert(dated.cost.usedSaver === false, "weekday fits the faster train");
const locked = trip("予算 3万円\n東京発\n温泉好き\n1泊2日\n出発 2026年10月3日", "plan");
assert(locked.dates.start === "2026-10-03", locked.dates.start);
assert(locked.brief.weekendLodging === true, "saturday lodging");
assert(locked.cost.total === onsen.cost.total, `same saturday fare ${locked.cost.total}`);

const dropped = adjustPlan(onsen, { omitTitle: "芦ノ湖畔を短く歩く" });
assert(dropped.cuts.some((cut) => cut.title.includes("芦ノ湖畔")), "manual drop");
assert(!dropped.days[0].blocks.some((block) => block.title.includes("芦ノ湖畔")), "manual drop removed");
const restored = adjustPlan(dropped, { omitTitle: "芦ノ湖畔を短く歩く" });
assert(restored.days[0].blocks.some((block) => block.title.includes("芦ノ湖畔")), "manual restore");

assert(onsen.alternatives.every((item) => typeof item.minutes === "number"), "alt minutes");
const band = seasonBand(35.45, 10);
assert(band.high > band.low && band.high < 35 && band.low > 0, `${band.low}-${band.high}`);
assert(daysUntil("2026-10-03", now) === 6, "days until saturday");
assert(countdownLine(0) === "きょう出発です。", "countdown today");
assert(tripIcs(onsen).includes("DTSTART;VALUE=DATE:20261003"), "ics start");
assert(walkMinutes(onsen.days) > 0, "walk");
assert(itineraryShape(onsen).includes("箱根") && itineraryShape(onsen).includes("1泊"), itineraryShape(onsen));

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("ok", DESTINATIONS.length, "destinations");
