const PICKS = {
  hakone: {
    hotel: "箱根湯本ホテル（箱根湯本駅のすぐ）",
    bath: "箱根湯本ホテルの日帰り湯",
    lunch: "箱根そば 箱根湯本店",
    dinner: "箱根そば 箱根湯本店。夜は定食で切り上げる",
    rules: [[/湖畔で/, "桃源台か箱根町のカウンターそば。箱根そばは湯本に戻ってから"]],
  },
  atami: {
    hotel: "熱海温泉 ホテル大野屋（駅と海のあいだ）",
    bath: "ホテル大野屋の湯",
    lunch: "熱海 魚勝（海鮮丼）",
    dinner: "熱海駅前。魚勝は昼で終わり",
  },
  kusatsu: {
    hotel: "草津温泉 ホテルヴィレッジ（湯畑の近く）",
    bath: "西の河原、またはホテルヴィレッジの湯",
    lunch: "湯畑のそば。饅頭は本家ちちやを一つ",
    dinner: "ホテルヴィレッジの近くの定食",
  },
  nikko: {
    hotel: "日光千姫物語（東武日光駅から社寺側。中禅寺湖には泊らない）",
    lunch: "日光 小西本店（湯波。参道を下りたところ）",
    dinner: "東武日光駅前。夜の参道には戻らない",
  },
  kawaguchiko: {
    hotel: "ホテルルートイン河口湖（河口湖駅の近く）",
    lunch: "ほうとう不動 河口湖店",
    dinner: "河口湖駅の近く。湖畔まで夜に歩かない",
  },
  kamakura: {
    hotel: "鎌倉東急REIホテル（鎌倉駅東口）",
    lunch: "しらす問屋 とびっちょ（腰越・江の島側。小町通りではない）",
    dinner: "鎌倉東急REIホテル。西口の食べ歩きには出ない",
    morning: "鎌倉駅東口。とびっちょは昼だけ",
  },
  kawagoe: {
    lunch: "小川菊（うなぎ。蔵の通り。菓子屋横丁の中ではない）",
    snack: "くらづくり本舗（芋菓子は一つ）",
  },
  okutama: {
    lunch: "JR奥多摩駅の売店で弁当。温かい食事なら、バス一区間の「もえぎの湯」",
  },
  chichibu: {
    hotel: "ホテルルートイン秩父（西武秩父駅の近く）",
    lunch: "秩父 わらじかつ いせや",
    dinner: "西武秩父駅前。わらじかつの二回目は量が多い",
  },
  numazu: {
    hotel: "東横INN沼津駅北口",
    lunch: "沼津魚がし鮨（沼津港）",
    dinner: "沼津駅北口。夜の港には戻らない",
  },
  washinomiya: {
    lunch: "久喜駅の山田うどん（鷲宮神社の前では食べない）",
  },
  arima: {
    hotel: "有馬温泉 元湯龍泉閣（有馬温泉駅から歩ける）",
    bath: "太閤の湯（金の湯か銀の湯、空いている方）",
    lunch: "元湯龍泉閣の定食。炭酸せんべいは食後に一枚",
    dinner: "元湯龍泉閣の近く。夜の外湯待ちのあいだに済ませる",
  },
  kinosaki: {
    hotel: "城崎温泉 三木屋（駅から川沿い。蟹のフルコースは取らない）",
    bath: "外湯。駅の湯めぐりで三箇所まで",
    lunch: "城崎温泉駅前の蟹丼を小さく",
    dinner: "三木屋の近くの定食。蟹は昼で終わり",
    morning: "三木屋の朝食。蟹は昼で終わり",
  },
  onomichi: {
    hotel: "尾道第一ホテル（尾道駅前）",
    lunch: "尾道ラーメン 吾一（商店街。坂の下で食べてから上る）",
    dinner: "尾道駅前。夜の坂には出ない",
  },
  kanazawa: {
    hotel: "ホテルフォルツァ金沢（金沢駅東口）",
    lunch: "近江町市場 近江町食堂",
    dinner: "もりもり寿し 金沢駅前店",
  },
  takayama: {
    hotel: "高山グリーンホテル（高山駅前）",
    morning: "宮川朝市（見るだけ。食事の本体は別に）",
    lunch: "味蔵天国（飛騨牛は串か小盛り）",
    dinner: "高山駅前の定食。味蔵天国は昼で終わり",
  },
  toyosato: {
    lunch: "彦根 千成亭（豊郷の校舎では食べない）",
  },
  kyoto: {
    hotel: "ヴィアイン京都駅八条口",
    lunch: "京都駅 京都拉麺小路",
    dinner: "京都駅の周辺。寺の門前で夜の店を探さない",
    snack: "錦市場は一つだけ",
    rules: [[/錦/, "錦市場を一つだけ。食事は京都拉麺小路"]],
  },
  nara: {
    hotel: "コンフォートホテル奈良（奈良駅前）",
    lunch: "柿の葉寿司 平宗（奈良駅。公園の中では食べない）",
    dinner: "奈良駅前。夜の奈良公園には戻らない",
  },
  kurashiki: {
    hotel: "倉敷国際ホテル（倉敷駅前。美観地区の中には泊らない）",
    lunch: "倉敷駅 さんすて倉敷の食堂",
    dinner: "倉敷国際ホテルの近く。夜の川沿いには出ない",
  },
  matsumoto: {
    hotel: "ホテルブエナビスタ（松本駅直結）",
    lunch: "松本 草笛（そば。城の中では食べない）",
    dinner: "松本駅前。縄手通りの真ん中には入らない",
  },
};

export function picksFor(dest) {
  return PICKS[dest?.id] || null;
}

export function placeLine(block, picks) {
  if (!picks || !block) return "";
  const title = block.title || "";
  for (const [re, line] of picks.rules || []) {
    if (re.test(title)) return line;
  }
  if (/菓子|せんべい/.test(title) && picks.snack) return picks.snack;
  const food = block.k === "eat" || (block.k === "rest" && /弁当|朝食|食事/.test(title) && !/風呂|湯/.test(title));
  if (food) {
    if (/朝食/.test(title) || (/朝/.test(title) && !/昼/.test(title))) return picks.morning || picks.lunch || "";
    const hour = Number(String(block.t || "").slice(0, 2));
    if (/夕食|夜|軽く/.test(title) || hour >= 17) return picks.dinner || picks.lunch || "";
    if (/芋|菓子/.test(title)) return picks.snack || picks.lunch || "";
    return picks.lunch || "";
  }
  if (block.k === "stay" || /荷物|宿/.test(title)) {
    if (/外湯|西の河原|昼の湯|昼湯|先に温泉|先に外湯/.test(title) && picks.bath) return picks.bath;
    if (/温泉|湯/.test(title) && !/荷物|宿/.test(title) && picks.bath) return picks.bath;
    return picks.hotel || "";
  }
  return "";
}

export function mealShop(meal, picks) {
  if (!picks || !meal) return "";
  if (meal.when === "夜") return picks.dinner || "";
  if (meal.when === "朝") return picks.morning || "";
  if (meal.when === "おやつ") return picks.snack || "";
  return picks.lunch || "";
}
