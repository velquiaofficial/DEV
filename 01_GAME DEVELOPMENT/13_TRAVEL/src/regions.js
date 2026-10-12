/** 都道府県。移動時間と運賃は県庁所在地までの目安。 */
const PREFECTURES = [
  ["hokkaido", "北海道", 43.06, 141.35, "札幌", ["札幌"], "nature", 3],
  ["aomori", "青森", 40.82, 140.74, "青森", [], "nature", 2],
  ["iwate", "岩手", 39.7, 141.15, "盛岡", [], "nature", 2],
  ["miyagi", "宮城", 38.27, 140.87, "仙台", ["仙台"], "food", 1],
  ["akita", "秋田", 39.72, 140.1, "秋田", [], "onsen", 3],
  ["yamagata", "山形", 38.24, 140.36, "山形", [], "nature", 2],
  ["fukushima", "福島", 37.75, 140.47, "福島", [], "nature", 2],
  ["ibaraki", "茨城", 36.34, 140.45, "水戸", [], "nature", 1],
  ["tochigi", "栃木", 36.57, 139.88, "宇都宮", [], "history", 2],
  ["gunma", "群馬", 36.39, 139.06, "前橋", [], "onsen", 4],
  ["saitama", "埼玉", 35.86, 139.65, "さいたま", [], "town", 0],
  ["chiba", "千葉", 35.6, 140.12, "千葉", [], "sea", 1],
  ["tokyo", "東京", 35.68, 139.76, "東京", ["東京都"], "town", 0],
  ["kanagawa", "神奈川", 35.45, 139.64, "横浜", ["横浜"], "sea", 2],
  ["niigata", "新潟", 37.9, 139.02, "新潟", [], "food", 2],
  ["toyama", "富山", 36.7, 137.21, "富山", [], "nature", 2],
  ["ishikawa", "石川", 36.59, 136.63, "金沢", [], "food", 2],
  ["fukui", "福井", 36.07, 136.22, "福井", [], "history", 2],
  ["yamanashi", "山梨", 35.66, 138.57, "甲府", [], "nature", 2],
  ["nagano", "長野", 36.65, 138.18, "長野", [], "nature", 3],
  ["gifu", "岐阜", 35.39, 136.72, "岐阜", [], "history", 2],
  ["shizuoka", "静岡", 34.98, 138.38, "静岡", [], "onsen", 3],
  ["aichi", "愛知", 35.18, 136.91, "名古屋", ["名古屋"], "food", 1],
  ["mie", "三重", 34.73, 136.51, "津", [], "history", 2],
  ["shiga", "滋賀", 35.0, 135.87, "大津", [], "nature", 1],
  ["kyoto", "京都", 35.02, 135.76, "京都", ["京都府"], "history", 1],
  ["osaka", "大阪", 34.69, 135.5, "大阪", ["大阪府"], "food", 0],
  ["hyogo", "兵庫", 34.69, 135.18, "神戸", ["神戸"], "onsen", 3],
  ["nara", "奈良", 34.69, 135.83, "奈良", [], "history", 1],
  ["wakayama", "和歌山", 34.23, 135.17, "和歌山", [], "onsen", 3],
  ["tottori", "鳥取", 35.5, 134.24, "鳥取", [], "nature", 2],
  ["shimane", "島根", 35.47, 133.05, "松江", [], "history", 2],
  ["okayama", "岡山", 34.66, 133.93, "岡山", [], "town", 1],
  ["hiroshima", "広島", 34.4, 132.46, "広島", [], "history", 2],
  ["yamaguchi", "山口", 34.19, 131.47, "山口", [], "history", 2],
  ["tokushima", "徳島", 34.07, 134.56, "徳島", [], "food", 1],
  ["kagawa", "香川", 34.34, 134.04, "高松", [], "food", 1],
  ["ehime", "愛媛", 33.84, 132.77, "松山", [], "onsen", 3],
  ["kochi", "高知", 33.56, 133.53, "高知", [], "nature", 2],
  ["fukuoka", "福岡", 33.61, 130.42, "福岡", [], "food", 1],
  ["saga", "佐賀", 33.25, 130.3, "佐賀", [], "onsen", 3],
  ["nagasaki", "長崎", 32.74, 129.87, "長崎", [], "history", 2],
  ["kumamoto", "熊本", 32.79, 130.74, "熊本", [], "onsen", 4],
  ["oita", "大分", 33.24, 131.61, "大分", [], "onsen", 5],
  ["miyazaki", "宮崎", 31.91, 131.42, "宮崎", [], "nature", 2],
  ["kagoshima", "鹿児島", 31.56, 130.56, "鹿児島", [], "onsen", 4],
  ["okinawa", "沖縄", 26.21, 127.68, "那覇", ["那覇"], "sea", 1],
];

const DEST_POINT = {
  hakone: [35.23, 139.1, "箱根湯本"],
  atami: [35.1, 139.07, "熱海"],
  kusatsu: [36.62, 138.6, "草津温泉"],
  nikko: [36.75, 139.6, "日光"],
  kawaguchiko: [35.5, 138.77, "河口湖"],
  kamakura: [35.32, 139.55, "鎌倉"],
  kawagoe: [35.92, 139.48, "川越"],
  okutama: [35.81, 139.1, "奥多摩"],
  chichibu: [35.99, 139.08, "秩父"],
  numazu: [35.1, 138.86, "沼津"],
  washinomiya: [36.1, 139.67, "久喜"],
  arima: [34.8, 135.25, "有馬温泉"],
  kinosaki: [35.63, 134.81, "城崎温泉"],
  onomichi: [34.41, 133.2, "尾道"],
  kanazawa: [36.56, 136.65, "金沢"],
  takayama: [36.15, 137.25, "高山"],
  toyosato: [35.2, 136.23, "豊郷"],
  kyoto: [35.01, 135.77, "京都"],
  nara: [34.69, 135.83, "奈良"],
  kurashiki: [34.6, 133.77, "倉敷"],
  matsumoto: [36.23, 137.97, "松本"],
};

const AREAS = [
  ["北海道・東北", ["北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島"]],
  ["関東", ["茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川"]],
  ["中部", ["新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重"]],
  ["近畿", ["滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山"]],
  ["中国・四国", ["鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知"]],
  ["九州・沖縄", ["福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"]],
];

function rowToPrefecture([id, name, lat, lon, hub, aliases, tag, onsen]) {
  return { id, name, lat, lon, hub, aliases, tag, onsen };
}

const REGIONS = PREFECTURES.map(rowToPrefecture);

const BY_TOKEN = new Map();
for (const region of REGIONS) {
  BY_TOKEN.set(region.name, region);
  for (const alias of region.aliases) BY_TOKEN.set(alias, region);
}

export function originTokenSource() {
  return [...BY_TOKEN.keys()].sort((a, b) => b.length - a.length).join("|");
}

export function originChoices() {
  const names = REGIONS.map((region) => region.name);
  const aichi = names.indexOf("愛知");
  names.splice(aichi + 1, 0, "名古屋");
  return names;
}

export function regionAreas() {
  return AREAS;
}

export function matchRegion(token) {
  return BY_TOKEN.get(token) ?? null;
}

export function originKeys(name) {
  const keys = new Set([name]);
  const region = BY_TOKEN.get(name);
  if (region) {
    keys.add(region.name);
    for (const alias of region.aliases) keys.add(alias);
  }
  if (name === "名古屋" || name === "愛知") {
    keys.add("名古屋");
    keys.add("愛知");
  }
  return [...keys];
}

function pointOfRegion(name) {
  if (name === "名古屋") return { lat: 35.18, lon: 136.91, hub: "名古屋" };
  const region = BY_TOKEN.get(name);
  if (!region) return null;
  return { lat: region.lat, lon: region.lon, hub: region.hub };
}

function pointOfDest(dest) {
  const known = DEST_POINT[dest.id];
  if (known) return { lat: known[0], lon: known[1], hub: known[2] };
  if (Number.isFinite(dest.lat) && Number.isFinite(dest.lon)) {
    return { lat: dest.lat, lon: dest.lon, hub: dest.hub || dest.name };
  }
  const region = BY_TOKEN.get(dest.region) || BY_TOKEN.get(dest.name);
  if (!region) return null;
  return { lat: region.lat, lon: region.lon, hub: region.hub };
}

function haversine(from, to) {
  const earth = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLon = ((to.lon - from.lon) * Math.PI) / 180;
  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(h)));
}

function yen(value) {
  return Math.max(500, Math.round(value / 100) * 100);
}

function estimateAccess(from, to) {
  const km = haversine(from, to);
  if (from.hub === to.hub || km < 30) {
    return {
      minutes: 45,
      roundTrip: 900,
      how: `${to.hub}の市内を電車で移動`,
      estimated: true,
    };
  }
  if (km < 110) {
    return {
      minutes: Math.round(km * 1.15 + 20),
      roundTrip: yen(km * 18) * 2,
      how: `${from.hub}から在来線で${to.hub}へ`,
      estimated: true,
    };
  }
  if (km < 680) {
    const rail = yen(km * 22 + 800);
    const local = yen(km * 16 + 400);
    return {
      minutes: Math.round(km * 0.34 + 40),
      roundTrip: rail * 2,
      how: `${from.hub}から新幹線で${to.hub}へ`,
      saver: {
        minutes: Math.round(km * 0.7 + 30),
        roundTrip: local * 2,
        how: `${from.hub}から在来線を乗り継いで${to.hub}へ`,
      },
      estimated: true,
    };
  }
  const flight = yen(12000 + km * 10);
  const rail = yen(km * 20 + 2000);
  return {
    minutes: Math.round(150 + km / 80),
    roundTrip: flight * 2,
    how: `${from.hub}から飛行機で${to.hub}へ`,
    saver: {
      minutes: Math.round(km * 0.4 + 80),
      roundTrip: rail * 2,
      how: `${from.hub}から新幹線を乗り継いで${to.hub}へ`,
    },
    estimated: true,
  };
}

export function resolveAccess(dest, origin) {
  if (!origin) return null;
  for (const key of originKeys(origin)) {
    if (dest.access?.[key]) return dest.access[key];
  }
  const from = pointOfRegion(origin);
  const to = pointOfDest(dest);
  if (!from || !to) return null;
  return estimateAccess(from, to);
}

function regionDestination(region) {
  const hub = region.hub;
  return {
    id: `region-${region.id}`,
    name: region.name,
    region: region.name,
    generated: true,
    lat: region.lat,
    lon: region.lon,
    hub,
    blurb: `${hub}を拠点にした行程です。`,
    secretary: `${region.name}は、${hub}に荷物を置いてから動きます。県内を一日で横断せず、代表的な場所を一つにします。`,
    tradeoff: "時間と運賃は、県庁所在地までの目安です。列車と空室は出発前に確認します。",
    tags: [region.tag, "solo"].filter((tag, index, list) => list.indexOf(tag) === index),
    onsen: region.onsen,
    gacha: 0,
    aliases: [region.name],
    hardship: { stairs: 1, crowd: 2, parking: 2 },
    stay: {
      perNight: 9000,
      weekendExtra: 2000,
      label: `${hub}駅の近くのビジネスホテル`,
    },
    foodPerDay: 3500,
    local: 1500,
    tickets: 800,
    access: {},
    meals: [
      { when: "昼", name: `${hub}駅の周辺`, note: "着いてすぐ食べる。観光地の中で店を探して歩き回らない。" },
      { when: "夜", name: "宿の近く", note: "夜は駅に戻って終える。終電を食事の時間に使わない。" },
    ],
    spots: [
      { name: hub, note: "荷物を置いてから出る。この行程の拠点はここです。" },
      { name: `${region.name}の中心`, note: "城、港、社寺のどれか一つ。同じ日にもう一都市を足さない。" },
    ],
    cautions: [
      { tag: "移動", text: `片道の時間は${hub}までの目安です。乗換が増える日は、観光を一つ減らします。` },
      { tag: "宿", text: `${hub}駅から歩ける宿にします。市内の端に泊ると、翌朝の移動が先に尽きます。` },
      { tag: "予定", text: "県内の有名どころを同日に並べない。一つ見て、駅に戻る余地を残します。" },
    ],
    solo: {
      stay: `${hub}駅の近くの一人利用にします。郊外の一棟貸しは、この見積もりに入れていません。`,
      food: "駅のカウンターで昼を終えます。夜は宿の近所で、はしごしません。",
      quiet: "朝、人が出る前に拠点の周りを一回りして、昼の店に入る前に引き上げます。",
    },
    works: [],
    refusals: [
      { title: "県内を同日に横断すること", reason: `${hub}を出て、別の都市まで足すと、帰りが崩れます。` },
      { title: "着いた日に予定を足すこと", reason: "着いた日は荷物と食事だけにします。観光は翌日の一つです。" },
    ],
    itinerary: {
      day: [
        { t: "07:40", gate: "out" },
        { t: "11:00", k: "see", title: `${hub}に荷物を預ける`, detail: "駅のロッカーか、先に宿へ。荷物のまま街に出ない。" },
        { t: "11:40", k: "eat", title: "駅で昼を食べる", detail: "観光地の奥で食事を探さない。" },
        { t: "13:00", k: "see", title: `${region.name}の中心を一つ`, detail: "城、港、社寺のどれか。二つ目は捨てる。" },
        { t: "15:40", gate: "back" },
      ],
      first: [
        { t: "08:00", gate: "out" },
        { t: "12:00", k: "see", title: `${hub}の宿に荷物を置く`, detail: "着いたら拠点を先に決める。観光はそのあとです。" },
        { t: "12:40", k: "eat", title: "駅の近くで昼", detail: "この日の外出は食事まで。夜の街には出ません。" },
        { t: "14:30", k: "stay", title: "宿で休む", detail: "着いた日に予定を足さない。" },
        { t: "18:30", k: "eat", title: "早めの夕食", detail: "宿の近所で終える。" },
      ],
      last: [
        { t: "08:30", k: "see", title: `${region.name}の中心を一つ`, detail: "見る場所は一つ。駅に戻る時刻を先に決める。" },
        { t: "11:00", k: "eat", title: "駅に戻って食事", detail: "帰りの列車の前に食べ終える。" },
        { t: "13:00", gate: "back" },
      ],
    },
  };
}

export function withRegions(curated) {
  const taken = new Set(curated.flatMap((dest) => [dest.name, ...dest.aliases]));
  const extras = REGIONS.filter((region) => !taken.has(region.name)).map(regionDestination);
  return [...curated, ...extras];
}

export function regionPins(places) {
  return REGIONS.map((region) => {
    const dest = places.find((item) => item.name === region.name || item.aliases.includes(region.name));
    return dest
      ? { id: dest.id, name: dest.name, region: dest.region, blurb: dest.blurb, lat: region.lat, lon: region.lon }
      : null;
  }).filter(Boolean);
}
