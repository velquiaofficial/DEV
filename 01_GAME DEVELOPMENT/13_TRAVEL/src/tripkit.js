import { matchRegion } from "./regions.js";

const STORE = "tabi-hisho-desk-v1";

export function placeLat(regionName) {
  return matchRegion(regionName)?.lat ?? 35.7;
}

export function seasonBand(lat, month) {
  const mean = 15.5 - (lat - 35.2) * 1.1;
  const swing = 11 + Math.max(0, lat - 35) * 0.15;
  const mid = mean + swing * Math.cos(((month - 7.5) / 12) * Math.PI * 2);
  const high = Math.round(mid + 4);
  const low = Math.round(mid - 5);
  let rain = "雨は少なめです";
  if (month >= 6 && month <= 7 && lat < 41) rain = "梅雨で雨が多い時期です";
  else if ((month === 8 || month === 9) && lat < 36) rain = "にわか雨が多い時期です";
  else if ((month === 12 || month <= 2) && lat > 36.5) rain = "雪のことがある時期です";
  else if (month === 9 || month === 10) rain = "通り雨がある時期です";
  const sunsetHour = 17.8 + 1.2 * Math.cos(((month - 6) / 12) * Math.PI * 2);
  const hour = Math.floor(sunsetHour);
  const minute = Math.round((sunsetHour - hour) * 60);
  return {
    high,
    low,
    rain,
    sunset: `${hour}:${String(minute).padStart(2, "0")}`,
  };
}

export function daysUntil(startIso, now = new Date()) {
  if (!startIso) return null;
  const [year, month, day] = startIso.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((start.getTime() - today.getTime()) / 86400000);
}

export function countdownLine(days) {
  if (days == null) return "";
  if (days > 0) return `出発まであと${days}日です。`;
  if (days === 0) return "きょう出発です。";
  return "出発日を過ぎています。日付を選び直してください。";
}

export function itineraryShape(result) {
  const sights = (result.days || [])
    .flatMap((day) => day.blocks)
    .filter((block) => block.k === "see" && !/荷物/.test(block.title)).length;
  const outbound = result.days?.[0]?.blocks?.find((block) => block.title.endsWith("を出る"));
  const leave = outbound ? `${outbound.t}に${result.brief.origin}を出て` : `${result.brief.origin}から`;
  const stay = result.brief.nights === 0 ? "その日のうちに戻ります。" : `夜は宿で、${result.brief.nights}泊です。`;
  return `${leave}、${result.name}へ向かいます。観光は${sights}か所。${stay}`;
}

export function walkMinutes(days) {
  const sights = (days || []).flatMap((day) => day.blocks).filter((block) => block.k === "see" && !/荷物/.test(block.title));
  return sights.length * 40;
}

export function tripIcs(result) {
  const start = result.dates.start.replaceAll("-", "");
  const last = addIsoDays(result.dates.start, result.brief.nights + 1).replaceAll("-", "");
  const summary = `${result.name}の行程`;
  const description = `${result.brief.origin}発　${result.dates.range}　ひとり${result.cost.total}円`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//tabi-kotei//JP",
    "BEGIN:VEVENT",
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${last}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

export function downloadIcs(result) {
  const blob = new Blob([tripIcs(result)], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${result.name}-行程.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

export function deskKey(result) {
  return `${result.destId}|${result.dates.start}|${result.brief.nights}`;
}

function deskStore(userId) {
  return userId ? `${STORE}:${userId}` : STORE;
}

export function readDesk(key, userId) {
  const empty = { packed: {}, checks: {}, extra: [], memo: "", spare: 0 };
  try {
    const all = JSON.parse(localStorage.getItem(deskStore(userId)) || "{}");
    return { ...empty, ...all[key] };
  } catch {
    return empty;
  }
}

export function writeDesk(key, value, userId) {
  try {
    const name = deskStore(userId);
    const all = JSON.parse(localStorage.getItem(name) || "{}");
    all[key] = value;
    localStorage.setItem(name, JSON.stringify(all));
  } catch {
    /* 保存できない環境では、この画面のあいだだけ保持する */
  }
}

function addIsoDays(iso, days) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${mm}-${dd}`;
}
