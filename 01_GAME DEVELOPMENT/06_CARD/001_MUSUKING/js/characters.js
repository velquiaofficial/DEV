/* むすキングのキャラクターデータ。名前や技はここを編集する。 */
const MUSU_ELEMENTS = {
  fire: { id: "fire", name: "炎" },
  water: { id: "water", name: "水" },
  grass: { id: "grass", name: "草" },
  thunder: { id: "thunder", name: "雷" },
  ice: { id: "ice", name: "氷" },
};

const MUSU_CATEGORIES = {
  attack: { id: "attack", name: "攻撃" },
  magic: { id: "magic", name: "魔法" },
};

/* ♡ は ★ に勝ち、★ は ☾ に勝ち、☾ は ♡ に勝つ。 */
const MUSU_SIGNS = {
  star: { id: "star", mark: "★", beats: "moon" },
  heart: { id: "heart", mark: "♡", beats: "star" },
  moon: { id: "moon", mark: "☾", beats: "heart" },
};

/* 技の属性 → 相手の属性。2 は抜群、0.5 は半減、1 は普通。 */
const MUSU_CHART = {
  fire: { fire: 1, water: 0.5, grass: 2, thunder: 1, ice: 2 },
  water: { fire: 2, water: 1, grass: 0.5, thunder: 1, ice: 1 },
  grass: { fire: 0.5, water: 2, grass: 1, thunder: 1, ice: 1 },
  thunder: { fire: 1, water: 2, grass: 1, thunder: 1, ice: 1 },
  ice: { fire: 0.5, water: 0.5, grass: 2, thunder: 1, ice: 1 },
};

const MUSU_ITEMS = {
  crystal: { id: "crystal", name: "経験結晶", exp: 40 },
};

const MUSU_CHARACTERS = [
  {
    id: "hikari",
    name: "姫宮 ひかり",
    title: "太陽の王女",
    rarity: "UR",
    element: "fire",
    hp: 172,
    hpGrow: 8,
    atk: 36,
    atkGrow: 2,
    mag: 50,
    magGrow: 4,
    blurb: "眩い笑顔で場を照らす、王国の王女。",
    look: {
      style: "long",
      hair: "#ffe29a",
      skin: "#ffe3c8",
      dress: "#fff6d8",
      accent: "#ffd56a",
      eye: "#b86a12",
      accessory: "tiara",
      bg1: "#ff8fb8",
      bg2: "#6a2a78",
    },
    skills: [
      { name: "太陽の口づけ", sign: "heart", element: "fire", category: "magic", power: 32 },
      { name: "黄金の打撃", sign: "star", element: "fire", category: "attack", power: 36 },
      { name: "雷光の加護", sign: "moon", element: "thunder", category: "magic", power: 28, fx: "heal" },
    ],
  },
  {
    id: "tsukino",
    name: "黒咲 月乃",
    title: "月下の剣姫",
    rarity: "SR",
    element: "water",
    hp: 184,
    hpGrow: 8,
    atk: 48,
    atkGrow: 4,
    mag: 34,
    magGrow: 2,
    blurb: "夜にのみ現れる、静かな剣の使い手。",
    look: {
      style: "hime",
      hair: "#2a2340",
      skin: "#ffe0d0",
      dress: "#3a2a68",
      accent: "#efe6ff",
      eye: "#6a48c8",
      accessory: "moon",
      bg1: "#d9ccff",
      bg2: "#241448",
    },
    skills: [
      { name: "月影の斬撃", sign: "moon", element: "water", category: "attack", power: 34 },
      { name: "潮の一閃", sign: "star", element: "water", category: "attack", power: 40 },
      { name: "氷刃", sign: "heart", element: "ice", category: "attack", power: 30, fx: "seal" },
    ],
  },
  {
    id: "sakura",
    name: "花村 さくら",
    title: "桜吹雪の踊り子",
    rarity: "R",
    element: "grass",
    hp: 160,
    hpGrow: 7,
    atk: 46,
    atkGrow: 4,
    mag: 30,
    magGrow: 2,
    blurb: "花弁と共に舞い、一気に押し切る。",
    look: {
      style: "twin",
      hair: "#ff8fb8",
      skin: "#ffe4d4",
      dress: "#ffd0e4",
      accent: "#ff6fa8",
      eye: "#c43b6e",
      accessory: "flower",
      bg1: "#ffe4f2",
      bg2: "#c43b6e",
    },
    skills: [
      { name: "桜吹雪", sign: "heart", element: "grass", category: "attack", power: 38 },
      { name: "花弁の舞", sign: "star", element: "grass", category: "attack", power: 28 },
      { name: "花の雫", sign: "moon", element: "water", category: "magic", power: 30, fx: "heal" },
    ],
  },
  {
    id: "midori",
    name: "青葉 みどり",
    title: "翠風の射手",
    rarity: "R",
    element: "grass",
    hp: 176,
    hpGrow: 8,
    atk: 42,
    atkGrow: 3,
    mag: 36,
    magGrow: 3,
    blurb: "風を読んで矢を放つ、森の守り手。",
    look: {
      style: "bob",
      hair: "#6b4632",
      skin: "#ffe0c6",
      dress: "#d9ffe4",
      accent: "#3ecf7a",
      eye: "#1f7a45",
      accessory: "leaf",
      bg1: "#d8ffe8",
      bg2: "#1e6b45",
    },
    skills: [
      { name: "翠の矢", sign: "star", element: "grass", category: "attack", power: 36 },
      { name: "葉刃", sign: "heart", element: "grass", category: "attack", power: 32, fx: "guard" },
      { name: "雷矢", sign: "moon", element: "thunder", category: "attack", power: 30 },
    ],
  },
  {
    id: "akari",
    name: "紅蓮 あかり",
    title: "紅蓮の魔女",
    rarity: "SR",
    element: "fire",
    hp: 166,
    hpGrow: 7,
    atk: 52,
    atkGrow: 4,
    mag: 40,
    magGrow: 3,
    blurb: "燃えやすい心が、そのまま火力になる。",
    look: {
      style: "wave",
      hair: "#c9184a",
      skin: "#ffd8c4",
      dress: "#ff6a3d",
      accent: "#ffd36a",
      eye: "#8d1d3a",
      accessory: "flame",
      bg1: "#ffb088",
      bg2: "#6a1b3a",
    },
    skills: [
      { name: "紅蓮の拳", sign: "star", element: "fire", category: "attack", power: 40 },
      { name: "炎歩", sign: "heart", element: "fire", category: "attack", power: 34 },
      { name: "黒炎", sign: "moon", element: "fire", category: "magic", power: 30, fx: "seal" },
    ],
  },
  {
    id: "yuki",
    name: "白雪 ゆき",
    title: "氷晶の歌姫",
    rarity: "SR",
    element: "ice",
    hp: 198,
    hpGrow: 9,
    atk: 32,
    atkGrow: 2,
    mag: 46,
    magGrow: 4,
    blurb: "透き通る声で、相手の足を止める。",
    look: {
      style: "long",
      hair: "#f4f8ff",
      skin: "#fff0ea",
      dress: "#e7f6ff",
      accent: "#9ad7ff",
      eye: "#4a78b0",
      accessory: "snow",
      bg1: "#9ad7ff",
      bg2: "#243056",
    },
    skills: [
      { name: "白雪の歌", sign: "moon", element: "ice", category: "magic", power: 30, fx: "heal" },
      { name: "氷の王冠", sign: "heart", element: "ice", category: "magic", power: 36 },
      { name: "霧雨", sign: "star", element: "water", category: "magic", power: 28 },
    ],
  },
  {
    id: "lime",
    name: "星川 らいむ",
    title: "流れ星の見習い",
    rarity: "N",
    element: "thunder",
    hp: 148,
    hpGrow: 6,
    atk: 54,
    atkGrow: 4,
    mag: 28,
    magGrow: 2,
    blurb: "未だ見習い。だが一番星だけは誰より速い。",
    look: {
      style: "pony",
      hair: "#d6ee6a",
      skin: "#ffe6d2",
      dress: "#f4ffc8",
      accent: "#ffe56a",
      eye: "#5a7a14",
      accessory: "star",
      bg1: "#e8ff8a",
      bg2: "#2a4018",
    },
    skills: [
      { name: "流星", sign: "star", element: "thunder", category: "attack", power: 42 },
      { name: "電光", sign: "heart", element: "thunder", category: "attack", power: 30 },
      { name: "若葉", sign: "moon", element: "grass", category: "magic", power: 26, fx: "heal" },
    ],
  },
  {
    id: "rei",
    name: "皇 れい",
    title: "雷帝の継承者",
    rarity: "UR",
    element: "thunder",
    hp: 176,
    hpGrow: 8,
    atk: 46,
    atkGrow: 3,
    mag: 46,
    magGrow: 3,
    blurb: "雷を纏い、王座まであと一歩の位置にいる。",
    look: {
      style: "pony",
      hair: "#cbb6ff",
      skin: "#ffe0d2",
      dress: "#2a2158",
      accent: "#fff4a0",
      eye: "#5a3cb0",
      accessory: "bolt",
      bg1: "#6d5bd0",
      bg2: "#140c28",
    },
    skills: [
      { name: "愛の落雷", sign: "heart", element: "thunder", category: "magic", power: 36 },
      { name: "王雷", sign: "star", element: "thunder", category: "attack", power: 38 },
      { name: "炎帝の一撃", sign: "moon", element: "fire", category: "attack", power: 32, fx: "seal" },
    ],
  },
  {
    id: "natsu",
    name: "夏目 なつ",
    title: "夏祭りの見習い",
    rarity: "N",
    element: "fire",
    hp: 152,
    hpGrow: 6,
    atk: 50,
    atkGrow: 4,
    mag: 30,
    magGrow: 2,
    blurb: "屋台の火を見て、剣の稽古を忘れる。",
    look: {
      style: "pony",
      hair: "#ffb15a",
      skin: "#ffe0c8",
      dress: "#ffd2a8",
      accent: "#ff6a3d",
      eye: "#c45a18",
      accessory: "ribbon",
      bg1: "#ffd0a0",
      bg2: "#8a3418",
    },
    skills: [
      { name: "祭りの火花", sign: "star", element: "fire", category: "attack", power: 34 },
      { name: "金魚の一閃", sign: "heart", element: "fire", category: "attack", power: 28 },
      { name: "夕立", sign: "moon", element: "water", category: "magic", power: 26, fx: "weak" },
    ],
  },
  {
    id: "shizuku",
    name: "水瀬 しずく",
    title: "雨音の見習い",
    rarity: "N",
    element: "water",
    hp: 156,
    hpGrow: 7,
    atk: 32,
    atkGrow: 2,
    mag: 48,
    magGrow: 4,
    blurb: "傘を忘れて、雨の歌だけ覚えて帰った。",
    look: {
      style: "bob",
      hair: "#7eb7e8",
      skin: "#ffe6dc",
      dress: "#d7eeff",
      accent: "#5eb7ff",
      eye: "#2a6ea8",
      accessory: "bell",
      bg1: "#c6e6ff",
      bg2: "#1d4e86",
    },
    skills: [
      { name: "小雨の唄", sign: "heart", element: "water", category: "magic", power: 32, fx: "heal" },
      { name: "水たまり", sign: "star", element: "water", category: "magic", power: 28 },
      { name: "青葉の雫", sign: "moon", element: "grass", category: "magic", power: 24 },
    ],
  },
  {
    id: "momo",
    name: "桃井 もも",
    title: "桃園の見習い",
    rarity: "N",
    element: "grass",
    hp: 150,
    hpGrow: 6,
    atk: 48,
    atkGrow: 4,
    mag: 32,
    magGrow: 2,
    blurb: "桃の枝を杖にして、庭を走り回る。",
    look: {
      style: "twin",
      hair: "#ff9ec4",
      skin: "#ffe4d6",
      dress: "#ffe0ef",
      accent: "#ff8fb8",
      eye: "#c43b6e",
      accessory: "flower",
      bg1: "#ffd6ea",
      bg2: "#a33a62",
    },
    skills: [
      { name: "桃の杖", sign: "star", element: "grass", category: "attack", power: 34 },
      { name: "花吹雪", sign: "heart", element: "grass", category: "attack", power: 28 },
      { name: "甘い雨", sign: "moon", element: "water", category: "magic", power: 24, fx: "heal" },
    ],
  },
  {
    id: "kanna",
    name: "雷堂 かんな",
    title: "稲光の見習い",
    rarity: "N",
    element: "thunder",
    hp: 148,
    hpGrow: 6,
    atk: 52,
    atkGrow: 4,
    mag: 30,
    magGrow: 2,
    blurb: "走ると髪がパチパチ鳴る。本人は気にしていない。",
    look: {
      style: "pony",
      hair: "#ffe56a",
      skin: "#ffe2cc",
      dress: "#fff3b0",
      accent: "#ffd36a",
      eye: "#8a6a10",
      accessory: "bolt",
      bg1: "#fff0a0",
      bg2: "#6a5410",
    },
    skills: [
      { name: "稲光", sign: "star", element: "thunder", category: "attack", power: 36 },
      { name: "静電気", sign: "heart", element: "thunder", category: "attack", power: 28 },
      { name: "野分", sign: "moon", element: "grass", category: "attack", power: 24, fx: "weak" },
    ],
  },
  {
    id: "fuyu",
    name: "冬木 ふゆ",
    title: "霜柱の見習い",
    rarity: "N",
    element: "ice",
    hp: 160,
    hpGrow: 7,
    atk: 30,
    atkGrow: 2,
    mag: 46,
    magGrow: 3,
    blurb: "息が白い日が、一番好き。",
    look: {
      style: "long",
      hair: "#d7e8ff",
      skin: "#fff0ea",
      dress: "#e7f4ff",
      accent: "#9ad7ff",
      eye: "#4a78b0",
      accessory: "snow",
      bg1: "#d5ecff",
      bg2: "#2a4468",
    },
    skills: [
      { name: "霜の息", sign: "moon", element: "ice", category: "magic", power: 32 },
      { name: "薄氷", sign: "heart", element: "ice", category: "magic", power: 28 },
      { name: "霧", sign: "star", element: "water", category: "magic", power: 24, fx: "guard" },
    ],
  },
  {
    id: "hinata",
    name: "日向 ひなた",
    title: "陽だまりの剣士",
    rarity: "R",
    element: "fire",
    hp: 164,
    hpGrow: 7,
    atk: 48,
    atkGrow: 4,
    mag: 34,
    magGrow: 2,
    blurb: "朝日の中で素振りをするのが日課。",
    look: {
      style: "hime",
      hair: "#ffcf70",
      skin: "#ffe3c8",
      dress: "#ffe7c2",
      accent: "#ffb703",
      eye: "#b86a12",
      accessory: "tiara",
      bg1: "#ffe0a0",
      bg2: "#8a4a12",
    },
    skills: [
      { name: "朝日の斬", sign: "star", element: "fire", category: "attack", power: 36 },
      { name: "日向の加護", sign: "heart", element: "fire", category: "magic", power: 30, fx: "heal" },
      { name: "熱風", sign: "moon", element: "fire", category: "attack", power: 32 },
    ],
  },
  {
    id: "umi",
    name: "海咲 うみ",
    title: "潮騒の踊り子",
    rarity: "R",
    element: "water",
    hp: 170,
    hpGrow: 8,
    atk: 46,
    atkGrow: 3,
    mag: 36,
    magGrow: 2,
    blurb: "波の音に合わせて、刃を返す。",
    look: {
      style: "wave",
      hair: "#3ec6d8",
      skin: "#ffe0d4",
      dress: "#b7f3ff",
      accent: "#1aa6c4",
      eye: "#146888",
      accessory: "bell",
      bg1: "#b7f0ff",
      bg2: "#0e5878",
    },
    skills: [
      { name: "潮騒", sign: "heart", element: "water", category: "attack", power: 34 },
      { name: "白波", sign: "star", element: "water", category: "attack", power: 38 },
      { name: "磯の雷", sign: "moon", element: "thunder", category: "attack", power: 28, fx: "seal" },
    ],
  },
  {
    id: "kaede",
    name: "楓原 かえで",
    title: "紅葉の歌い手",
    rarity: "R",
    element: "grass",
    hp: 162,
    hpGrow: 7,
    atk: 34,
    atkGrow: 2,
    mag: 46,
    magGrow: 4,
    blurb: "落ち葉が舞うと、歌が一段高くなる。",
    look: {
      style: "long",
      hair: "#e25a3c",
      skin: "#ffd8c4",
      dress: "#ffd0b0",
      accent: "#ff8a4a",
      eye: "#8d2e22",
      accessory: "leaf",
      bg1: "#ffc2a0",
      bg2: "#6a2418",
    },
    skills: [
      { name: "紅葉の歌", sign: "heart", element: "grass", category: "magic", power: 34, fx: "heal" },
      { name: "落葉", sign: "moon", element: "grass", category: "magic", power: 30 },
      { name: "焚き火", sign: "star", element: "fire", category: "magic", power: 28 },
    ],
  },
  {
    id: "inori",
    name: "天祈 いのり",
    title: "祈雷の巫女",
    rarity: "R",
    element: "thunder",
    hp: 158,
    hpGrow: 7,
    atk: 36,
    atkGrow: 2,
    mag: 48,
    magGrow: 4,
    blurb: "祈りの終わりに、空が一度光る。",
    look: {
      style: "hime",
      hair: "#f4f0ff",
      skin: "#ffe4d8",
      dress: "#efe6ff",
      accent: "#cbb6ff",
      eye: "#5a3cb0",
      accessory: "bell",
      bg1: "#e4d8ff",
      bg2: "#3a2870",
    },
    skills: [
      { name: "祈りの雷", sign: "heart", element: "thunder", category: "magic", power: 36 },
      { name: "御幣", sign: "star", element: "thunder", category: "attack", power: 30 },
      { name: "清めの雨", sign: "moon", element: "water", category: "magic", power: 28, fx: "heal" },
    ],
  },
  {
    id: "homura",
    name: "焔崎 ほむら",
    title: "焔の舞姫",
    rarity: "SR",
    element: "fire",
    hp: 168,
    hpGrow: 7,
    atk: 54,
    atkGrow: 4,
    mag: 38,
    magGrow: 3,
    blurb: "袖が燃えても、舞は止めない。",
    look: {
      style: "wave",
      hair: "#ff4d2e",
      skin: "#ffd4c0",
      dress: "#ff8a4a",
      accent: "#ffd36a",
      eye: "#8d1d3a",
      accessory: "flame",
      bg1: "#ffb080",
      bg2: "#6a1428",
    },
    skills: [
      { name: "焔の舞", sign: "star", element: "fire", category: "attack", power: 40 },
      { name: "紅の袖", sign: "heart", element: "fire", category: "attack", power: 34 },
      { name: "業火", sign: "moon", element: "fire", category: "magic", power: 32, fx: "seal" },
    ],
  },
  {
    id: "aoi",
    name: "蒼井 あおい",
    title: "深海の姫君",
    rarity: "SR",
    element: "water",
    hp: 180,
    hpGrow: 8,
    atk: 34,
    atkGrow: 2,
    mag: 50,
    magGrow: 4,
    blurb: "深い海の底で、歌だけが届く。",
    look: {
      style: "long",
      hair: "#1e4f8a",
      skin: "#ffe0d4",
      dress: "#243e78",
      accent: "#7ec8ff",
      eye: "#163e78",
      accessory: "crown",
      bg1: "#7eb6ff",
      bg2: "#102448",
    },
    skills: [
      { name: "深海の歌", sign: "heart", element: "water", category: "magic", power: 36, fx: "heal" },
      { name: "藍の渦", sign: "moon", element: "water", category: "magic", power: 34 },
      { name: "凍える潮", sign: "star", element: "ice", category: "magic", power: 30 },
    ],
  },
  {
    id: "yura",
    name: "翠川 ゆら",
    title: "翠嵐の槍士",
    rarity: "SR",
    element: "grass",
    hp: 174,
    hpGrow: 8,
    atk: 50,
    atkGrow: 4,
    mag: 38,
    magGrow: 3,
    blurb: "風が緑のとき、槍は一番長い。",
    look: {
      style: "pony",
      hair: "#2f8a52",
      skin: "#ffe0c8",
      dress: "#d8ffe4",
      accent: "#3ecf7a",
      eye: "#1f7a45",
      accessory: "leaf",
      bg1: "#b8ffd0",
      bg2: "#145c34",
    },
    skills: [
      { name: "翠嵐", sign: "star", element: "grass", category: "attack", power: 40 },
      { name: "若竹", sign: "heart", element: "grass", category: "attack", power: 32 },
      { name: "雷雨", sign: "moon", element: "thunder", category: "magic", power: 30, fx: "weak" },
    ],
  },
  {
    id: "seika",
    name: "聖華 せいか",
    title: "白波の女王",
    rarity: "UR",
    element: "water",
    hp: 178,
    hpGrow: 8,
    atk: 38,
    atkGrow: 2,
    mag: 52,
    magGrow: 4,
    blurb: "波頭に立ち、海そのものを従える。",
    look: {
      style: "hime",
      hair: "#f7fbff",
      skin: "#ffe6dc",
      dress: "#e8f7ff",
      accent: "#ffd56a",
      eye: "#2a78b0",
      accessory: "crown",
      bg1: "#d8f4ff",
      bg2: "#163e78",
    },
    skills: [
      { name: "白波の勅", sign: "heart", element: "water", category: "magic", power: 38, fx: "seal" },
      { name: "潮の王冠", sign: "star", element: "water", category: "attack", power: 36 },
      { name: "海鳴りの雷", sign: "moon", element: "thunder", category: "magic", power: 32 },
    ],
  },
  {
    id: "mikoto",
    name: "御門 みこと",
    title: "氷雪の皇女",
    rarity: "UR",
    element: "ice",
    hp: 186,
    hpGrow: 9,
    atk: 36,
    atkGrow: 2,
    mag: 50,
    magGrow: 4,
    blurb: "雪が止むまで、誰も玉座には近づけない。",
    look: {
      style: "long",
      hair: "#eef6ff",
      skin: "#fff0ea",
      dress: "#f4fbff",
      accent: "#d7ecff",
      eye: "#3a68a8",
      accessory: "crown",
      bg1: "#e7f4ff",
      bg2: "#1c3058",
    },
    skills: [
      { name: "氷雪の勅", sign: "moon", element: "ice", category: "magic", power: 38 },
      { name: "銀の王冠", sign: "heart", element: "ice", category: "magic", power: 34, fx: "guard" },
      { name: "吹雪の斬", sign: "star", element: "ice", category: "attack", power: 36 },
    ],
  },
];

function musuHairBack(look) {
  const hair = look.hair;
  const styles = {
    long: `<path d="M96 168 C72 48 228 48 204 168 C232 250 220 340 206 400 L94 400 C80 340 68 250 96 168Z" fill="${hair}"/>`,
    twin: `<path d="M112 150 C96 58 204 58 188 150 L184 196 L116 196Z" fill="${hair}"/>
      <ellipse cx="78" cy="246" rx="26" ry="78" fill="${hair}"/>
      <ellipse cx="222" cy="246" rx="26" ry="78" fill="${hair}"/>
      <circle cx="78" cy="318" r="14" fill="${look.accent}"/>
      <circle cx="222" cy="318" r="14" fill="${look.accent}"/>`,
    bob: `<path d="M100 170 C80 62 220 62 200 170 C214 236 198 258 184 248 C176 214 124 214 116 248 C102 258 86 236 100 170Z" fill="${hair}"/>`,
    hime: `<path d="M98 168 C74 50 226 50 202 168 L214 248 L184 226 L150 270 L116 226 L86 248Z" fill="${hair}"/>
      <path d="M116 146 C112 210 104 250 108 280" stroke="${hair}" stroke-width="22" fill="none" stroke-linecap="round"/>
      <path d="M184 146 C188 210 196 250 192 280" stroke="${hair}" stroke-width="22" fill="none" stroke-linecap="round"/>`,
    pony: `<path d="M104 158 C88 56 212 56 196 158 L188 206 L112 206Z" fill="${hair}"/>
      <path d="M176 118 C230 70 262 150 236 240 C206 200 196 156 176 136Z" fill="${hair}"/>
      <circle cx="196" cy="112" r="8" fill="${look.accent}"/>`,
    wave: `<path d="M98 166 C70 46 236 54 202 160 C232 214 234 310 210 392 C176 350 124 350 90 392 C68 310 70 214 98 166Z" fill="${hair}"/>`,
  };
  return styles[look.style] || styles.long;
}

function musuBangs(look) {
  const hair = look.hair;
  const styles = {
    long: `<path d="M112 150 C114 104 186 104 188 152 C172 136 150 172 128 138 C118 156 112 152 112 150Z" fill="${hair}"/>`,
    twin: `<path d="M114 148 C116 100 184 100 186 148 C168 130 150 160 132 130 C122 148 114 148 114 148Z" fill="${hair}"/>`,
    bob: `<path d="M108 154 C112 102 188 102 192 154 C170 134 150 166 130 134Z" fill="${hair}"/>`,
    hime: `<path d="M110 156 C114 98 186 98 190 156 L168 140 L150 170 L132 140Z" fill="${hair}"/>`,
    pony: `<path d="M116 150 C122 104 182 100 188 148 C168 132 150 160 132 130Z" fill="${hair}"/>`,
    wave: `<path d="M106 156 C110 102 196 98 194 152 C174 134 152 172 128 136 C116 156 108 156 106 156Z" fill="${hair}"/>`,
  };
  return styles[look.style] || styles.long;
}

function musuAccessory(look) {
  const items = {
    tiara: `<path d="M118 128 L130 110 L142 126 L150 102 L158 126 L170 110 L182 128" fill="none" stroke="${look.accent}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="150" cy="100" r="4" fill="${look.accent}"/>`,
    moon: `<path fill="#fff6c8" d="M214 108c8 0 16 10 16 22s-8 18-18 14c8 0 12-6 12-14s-4-16-10-22z"/>`,
    flower: `<g transform="translate(216 124)">
      <circle cx="0" cy="-9" r="6" fill="#ffd0e4"/>
      <circle cx="9" cy="0" r="6" fill="#ffd0e4"/>
      <circle cx="-9" cy="0" r="6" fill="#ffd0e4"/>
      <circle cx="0" cy="9" r="6" fill="#ffd0e4"/>
      <circle r="5" fill="#ffe56a"/>
    </g>`,
    leaf: `<ellipse cx="216" cy="126" rx="8" ry="14" fill="#b6ff8a" transform="rotate(-28 216 126)"/>`,
    flame: `<path d="M216 146 C216 146 200 126 210 112 C212 126 220 122 222 108 C236 130 232 146 216 146Z" fill="#ffd36a"/>`,
    snow: `<g stroke="#ffffff" stroke-width="2" stroke-linecap="round" transform="translate(218 122)">
      <path d="M0 -12 V12 M-10 -6 L10 6 M-10 6 L10 -6"/>
    </g>`,
    star: `<polygon points="218,104 222,116 234,116 224,124 228,136 218,128 208,136 212,124 202,116 214,116" fill="#fff4a8"/>`,
    bolt: `<polygon points="220,100 208,124 216,124 210,148 234,116 222,116 230,100" fill="#fff4a0"/>`,
    crown: `<path d="M206 112 L214 128 L222 114 L230 128 L238 112 L236 136 L208 136Z" fill="${look.accent}"/>
      <circle cx="222" cy="110" r="3" fill="#fff6c8"/>`,
    ribbon: `<path d="M210 118 C222 108 236 122 226 134 C236 146 220 156 210 144 C214 132 206 128 210 118Z" fill="${look.accent}"/>`,
    bell: `<path d="M214 112 H226 L230 128 H210Z" fill="${look.accent}"/>
      <circle cx="220" cy="132" r="3" fill="#fff6c8"/>`,
  };
  return items[look.accessory] || "";
}

function musuWings(look, stage) {
  if (!stage) return "";
  const fill = stage >= 2 ? "#fff3b0" : "#fff8ee";
  const edge = stage >= 2 ? "#ffe08a" : look.accent;
  if (stage >= 2) {
    return `<path d="M102 196 C18 146 6 230 40 318 C78 270 90 236 106 226Z" fill="${fill}"/>
      <path d="M198 196 C282 146 294 230 260 318 C222 270 210 236 194 226Z" fill="${fill}"/>
      <path d="M96 184 C36 142 22 196 52 240" fill="${edge}"/>
      <path d="M204 184 C264 142 278 196 248 240" fill="${edge}"/>
      <path d="M110 204 C52 174 40 236 72 292" fill="none" stroke="#fff" stroke-width="3"/>
      <path d="M190 204 C248 174 260 236 228 292" fill="none" stroke="#fff" stroke-width="3"/>`;
  }
  return `<path d="M108 208 C52 176 40 228 74 286 C98 248 102 228 110 218Z" fill="${fill}" stroke="${edge}" stroke-width="2"/>
    <path d="M192 208 C248 176 260 228 226 286 C202 248 198 228 190 218Z" fill="${fill}" stroke="${edge}" stroke-width="2"/>`;
}

function musuPortrait(ch, stage) {
  const look = ch.look;
  const evolved = stage || 0;
  const bgTop = evolved >= 2 ? "#fff6c8" : evolved === 1 ? "#fff0f6" : look.bg1;
  const aura = evolved >= 2 ? "rgba(255,214,120,0.34)" : evolved === 1 ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.2)";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${bgTop}"/>
        <stop offset="100%" stop-color="${look.bg2}"/>
      </linearGradient>
    </defs>
    <rect width="300" height="420" fill="url(#bg)"/>
    <circle cx="150" cy="168" r="${evolved >= 2 ? 132 : evolved === 1 ? 118 : 108}" fill="${aura}"/>
    <circle cx="46" cy="64" r="22" fill="rgba(255,255,255,0.16)"/>
    <circle cx="252" cy="88" r="14" fill="rgba(255,255,255,0.18)"/>
    ${evolved >= 2 ? `<ellipse cx="150" cy="92" rx="58" ry="16" fill="none" stroke="#fff6c8" stroke-width="4"/>
      <path d="M126 104 L150 82 L174 104" fill="none" stroke="#ffe08a" stroke-width="4" stroke-linejoin="round"/>` : ""}
    <text x="150" y="250" text-anchor="middle" font-size="150" fill="rgba(255,255,255,0.16)" font-family="Yu Gothic, Meiryo, sans-serif">${MUSU_ELEMENTS[ch.element].name}</text>
    ${musuWings(look, evolved)}
    ${musuHairBack(look)}
    ${evolved ? `<path d="M118 128 C138 96 170 98 184 132" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="${evolved >= 2 ? 10 : 7}" stroke-linecap="round"/>` : ""}
    <path d="M112 236 C124 270 98 310 72 420 L228 420 C202 310 176 270 188 236 C172 254 128 254 112 236Z" fill="${look.dress}"/>
    ${evolved >= 2 ? `<path d="M118 248 L150 420 L182 248" fill="rgba(255,220,120,0.42)"/>` : evolved === 1 ? `<path d="M136 260 L150 300 L164 260" fill="${look.accent}" opacity="0.55"/>` : ""}
    <path d="M132 248 L150 268 L168 248 L160 420 L140 420Z" fill="rgba(255,255,255,0.2)"/>
    <ellipse cx="150" cy="164" rx="46" ry="52" fill="${look.skin}"/>
    ${musuBangs(look)}
    <path d="M126 118 Q146 156 138 196" stroke="rgba(255,255,255,0.35)" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="132" cy="166" rx="5.5" ry="7.5" fill="${look.eye}"/>
    <ellipse cx="168" cy="166" rx="5.5" ry="7.5" fill="${look.eye}"/>
    <circle cx="134" cy="164" r="2" fill="#ffffff"/>
    <circle cx="170" cy="164" r="2" fill="#ffffff"/>
    ${evolved >= 2 ? `<circle cx="130" cy="168" r="3.2" fill="#fff6c8"/><circle cx="166" cy="168" r="3.2" fill="#fff6c8"/>` : ""}
    <ellipse cx="116" cy="180" rx="10" ry="6" fill="rgba(255,120,150,0.38)"/>
    <ellipse cx="184" cy="180" rx="10" ry="6" fill="rgba(255,120,150,0.38)"/>
    <path d="M138 190 Q150 200 162 190" fill="none" stroke="#e08aa0" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M132 232 Q150 250 168 232" fill="none" stroke="${evolved >= 2 ? "#fff1a8" : look.accent}" stroke-width="${evolved ? 8 : 6}" stroke-linecap="round"/>
    ${musuAccessory(look)}
    ${evolved >= 2 ? `<path d="M118 124 L132 108 L146 124 L150 100 L154 124 L168 108 L182 124" fill="none" stroke="#fff6c8" stroke-width="3.4" stroke-linejoin="round"/>
      <circle cx="150" cy="98" r="4" fill="#ffe08a"/>
      <circle cx="64" cy="150" r="5" fill="#fff6c8"/>
      <circle cx="240" cy="138" r="4" fill="#fff"/>
      <circle cx="48" cy="220" r="3" fill="#fff6c8"/>` : evolved === 1 ? `<circle cx="78" cy="150" r="4" fill="#fff6c8"/><circle cx="228" cy="142" r="3" fill="#fff"/>` : ""}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* 特性。画面は増やさず、既存の説明と対戦の数値だけに効く。 */
const MUSU_TRAITS = {
  solar: { name: "太陽心", line: "炎が強く、やけどを付ける", elem: { fire: 1.22 }, stab: 0.25, burn: 0.72 },
  moonlit: { name: "月読", line: "☾の技が強く、相手の癖を読む", sign: { moon: 1.42 }, read: 0.74 },
  bloom: { name: "花癒", line: "与えたダメージの一部を回復する", elem: { grass: 1.16 }, drain: 0.3 },
  thorn: { name: "棘", line: "受けたダメージの一部を返す", reflect: 0.24, incoming: 0.9 },
  blaze: { name: "紅蓮", line: "炎が強く、やけどと会心が起きやすい", elem: { fire: 1.28 }, burn: 0.8, crit: 0.16 },
  frost: { name: "氷晶", line: "氷が強く、霜で相手の技を鈍らせる", elem: { ice: 1.22 }, frost: 0.78, incoming: 0.88 },
  spark: { name: "帯電", line: "雷が強く、痺れで技を外させる", elem: { thunder: 1.2 }, shock: 0.55 },
  royal: { name: "王威", line: "受けるダメージが減り、必殺が強い", press: 0.82, super: 1.95, read: 0.68 },
  rush: { name: "速攻", line: "最初の技が大きく、会心しやすい", first: 1.48, crit: 0.18 },
  tide: { name: "潮読", line: "水の技で回復する", elem: { water: 1.2 }, drain: 0.32, drainElem: "water" },
  absorb: { name: "吸収", line: "与えたダメージを大きく回復する", drain: 0.36 },
  storm: { name: "雷鳴", line: "雷と抜群が強く、痺れやすい", elem: { thunder: 1.26 }, shock: 0.66, snare: 0.45 },
  veil: { name: "霧隠", line: "とても硬く、霜を付ける", incoming: 0.7, frost: 0.6 },
  focus: { name: "集中", line: "同じ属性がさらに強く、会心しやすい", stab: 0.5, crit: 0.22 },
  echo: { name: "残響", line: "同じ技がぶつかるとダメージが増える", tie: 1.48, elem: { water: 1.12 } },
  snipe: { name: "特効", line: "抜群のときに一段強い", snare: 0.6, elem: { grass: 1.14 } },
  oath: { name: "誓約", line: "必殺が非常に強く、奥義が貯まりやすい", super: 2.2, gauge: 1, read: 0.62 },
  edge: { name: "会心", line: "会心が非常に出やすい", crit: 0.4, critMul: 1.9, elem: { fire: 1.1 } },
  guard: { name: "堅守", line: "受けるダメージが大きく減る", incoming: 0.72, drain: 0.12 },
  chain: { name: "連撃", line: "勝ちが続くほど技が強くなる", streak: [1.42, 1.78], elem: { grass: 1.1 } },
  queen: { name: "威圧", line: "相手の技を弱め、水と必殺が強い", press: 0.78, elem: { water: 1.18 }, super: 1.8, read: 0.72 },
  endure: { name: "不屈", line: "一度だけ倒れず、氷と霜が強い", endure: true, frost: 0.55, elem: { ice: 1.24 }, incoming: 0.9 },
};

const MUSU_TRAIT_OF = {
  hikari: "solar",
  tsukino: "moonlit",
  sakura: "bloom",
  midori: "thorn",
  akari: "blaze",
  yuki: "frost",
  lime: "spark",
  rei: "royal",
  natsu: "rush",
  shizuku: "tide",
  momo: "absorb",
  kanna: "storm",
  fuyu: "veil",
  hinata: "focus",
  umi: "echo",
  kaede: "snipe",
  inori: "oath",
  homura: "edge",
  aoi: "guard",
  yura: "chain",
  seika: "queen",
  mikoto: "endure",
};

function musuLearnable(ch) {
  const index = MUSU_CHARACTERS.findIndex((row) => row.id === ch.id);
  const signs = ["star", "heart", "moon"];
  const levels = [8, 12, 16];
  const base = ch.skills.map((skill) => ({ ...skill, lv: 1 }));
  const extra = levels.map((lv, i) => {
    const sign = signs[(Math.max(0, index) + i) % 3];
    const src = base.find((skill) => skill.sign === sign);
    return {
      name: `改・${src.name}`,
      sign: src.sign,
      element: src.element,
      category: src.category,
      power: src.power + 18,
      fx: src.fx,
      lv,
    };
  });
  return base.concat(extra);
}

const MUSU_LEADERS = {
  hikari: { name: "太陽の号令", line: "味方の炎技が強くなる", elem: { fire: 1.22 } },
  tsukino: { name: "月下の陣", line: "味方の☾が強くなる", sign: { moon: 1.25 } },
  sakura: { name: "桜の輪", line: "味方の草技が強くなる", elem: { grass: 1.18 } },
  midori: { name: "翠の号令", line: "味方の体力が増える", hp: 1.12 },
  akari: { name: "紅蓮の陣", line: "味方の炎技が強くなる", elem: { fire: 1.2 } },
  yuki: { name: "氷の帳", line: "味方が受けるダメージが減る", guard: 0.9 },
  lime: { name: "星の号令", line: "味方の雷技が強くなる", elem: { thunder: 1.2 } },
  rei: { name: "王の威光", line: "味方の技が強くなる", all: 1.12 },
  natsu: { name: "祭りの音頭", line: "味方の★が強くなる", sign: { star: 1.2 } },
  shizuku: { name: "雨の輪", line: "味方の水技が強くなる", elem: { water: 1.18 } },
  momo: { name: "桃の庇護", line: "味方の体力が増える", hp: 1.15 },
  kanna: { name: "雷鳴の陣", line: "味方の雷技が強くなる", elem: { thunder: 1.22 } },
  fuyu: { name: "霧の帳", line: "味方が受けるダメージが減る", guard: 0.88 },
  hinata: { name: "日向の号令", line: "味方の炎技が強くなる", elem: { fire: 1.16 } },
  umi: { name: "潮の輪", line: "味方の水技が強くなる", elem: { water: 1.2 } },
  kaede: { name: "紅葉の号令", line: "味方の草技が強くなる", elem: { grass: 1.18 } },
  inori: { name: "祈りの輪", line: "味方の♡が強くなる", sign: { heart: 1.2 } },
  homura: { name: "焔の陣", line: "味方の炎技が強くなる", elem: { fire: 1.18 } },
  aoi: { name: "深海の護り", line: "味方が受けるダメージが減る", guard: 0.9 },
  yura: { name: "翠嵐の陣", line: "味方の草技が強くなる", elem: { grass: 1.2 } },
  seika: { name: "女王の威光", line: "味方の技が強くなる", all: 1.15 },
  mikoto: { name: "氷雪の勅", line: "味方の氷技が強くなる", elem: { ice: 1.22 } },
};

const MUSU_COMBOS = {
  hikari: { name: "太陽協演", sign: "star", element: "fire", category: "attack", power: 82, combo: true },
  tsukino: { name: "月下連斬", sign: "star", element: "water", category: "attack", power: 86, combo: true },
  sakura: { name: "桜の輪舞", sign: "heart", element: "grass", category: "attack", power: 84, combo: true },
  midori: { name: "翠風一斉", sign: "star", element: "grass", category: "attack", power: 82, combo: true },
  akari: { name: "紅蓮協演", sign: "star", element: "fire", category: "attack", power: 86, combo: true },
  yuki: { name: "氷の合唱", sign: "heart", element: "ice", category: "magic", power: 82, combo: true },
  lime: { name: "流れ星の輪", sign: "star", element: "thunder", category: "attack", power: 88, combo: true },
  rei: { name: "王雷協演", sign: "heart", element: "thunder", category: "magic", power: 84, combo: true },
  natsu: { name: "祭りの輪", sign: "star", element: "fire", category: "attack", power: 80, combo: true },
  shizuku: { name: "雨音の輪", sign: "heart", element: "water", category: "magic", power: 78, combo: true },
  momo: { name: "桃園協演", sign: "star", element: "grass", category: "attack", power: 80, combo: true },
  kanna: { name: "稲光の輪", sign: "star", element: "thunder", category: "attack", power: 84, combo: true },
  fuyu: { name: "霜の合唱", sign: "moon", element: "ice", category: "magic", power: 80, combo: true },
  hinata: { name: "朝日協演", sign: "star", element: "fire", category: "attack", power: 82, combo: true },
  umi: { name: "潮騒の輪", sign: "star", element: "water", category: "attack", power: 84, combo: true },
  kaede: { name: "紅葉の輪", sign: "heart", element: "grass", category: "magic", power: 80, combo: true },
  inori: { name: "祈りの輪", sign: "heart", element: "thunder", category: "magic", power: 84, combo: true },
  homura: { name: "焔の協演", sign: "star", element: "fire", category: "attack", power: 88, combo: true },
  aoi: { name: "深海の歌", sign: "heart", element: "water", category: "magic", power: 82, combo: true },
  yura: { name: "翠嵐協演", sign: "star", element: "grass", category: "attack", power: 86, combo: true },
  seika: { name: "白波協演", sign: "heart", element: "water", category: "magic", power: 86, combo: true },
  mikoto: { name: "氷雪協演", sign: "moon", element: "ice", category: "magic", power: 88, combo: true },
};

const MUSU_FX = {
  heal: { name: "回復", rate: 0.2 },
  seal: { name: "回復封じ", turns: 2 },
  guard: { name: "防御", rate: 0.6 },
  weak: { name: "弱体", rate: 0.7 },
};

const MUSU = {
  elements: MUSU_ELEMENTS,
  categories: MUSU_CATEGORIES,
  signs: MUSU_SIGNS,
  signOrder: ["star", "heart", "moon"],
  chart: MUSU_CHART,
  items: MUSU_ITEMS,
  traits: MUSU_TRAITS,
  fx: MUSU_FX,
  characters: MUSU_CHARACTERS,
  maxLevel: 99,
  byId(id) {
    return MUSU_CHARACTERS.find((ch) => ch.id === id);
  },
  byRarity(rarity) {
    return MUSU_CHARACTERS.filter((ch) => ch.rarity === rarity);
  },
  expNeed(level) {
    if (level <= 20) return 25 + (level - 1) * 18;
    return 367 + (level - 20) * 12;
  },
  stats(ch, level) {
    const grown = Math.max(0, level - 1);
    return {
      hp: ch.hp + grown * ch.hpGrow,
      atk: ch.atk + grown * ch.atkGrow,
      mag: ch.mag + grown * ch.magGrow,
    };
  },
  effect(attackElement, defendElement) {
    return MUSU_CHART[attackElement][defendElement];
  },
  trait(id) {
    return MUSU_TRAITS[MUSU_TRAIT_OF[id]] || MUSU_TRAITS.solar;
  },
  leader(id) {
    return MUSU_LEADERS[id] || MUSU_LEADERS.hikari;
  },
  combo(id) {
    return MUSU_COMBOS[id] || MUSU_COMBOS.hikari;
  },
  portrait: musuPortrait,
  learnable: musuLearnable,
};
