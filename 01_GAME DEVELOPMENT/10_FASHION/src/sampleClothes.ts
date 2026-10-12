import type {
  ColorName,
  FashionCategory,
  Gender,
  Occasion,
  Product,
  Season,
  Style,
} from "./types";

const shot = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&h=1200&q=70`;

const PHOTOS: Record<FashionCategory, string[]> = {
  tops: [
    "photo-1521572163474-6864f9cf17ab",
    "photo-1576566588028-4147f3842f27",
    "photo-1556821840-3a63f95609a7",
    "photo-1583743814966-8936f5b7be1a",
    "photo-1564257631407-4deb1f99d992",
    "photo-1596755094514-f87e34085b2c",
    "photo-1516257984-b1b4d707412e",
    "photo-1434389677669-e08b4cac3105",
  ],
  bottoms: [
    "photo-1541099649105-f69ad21f3246",
    "photo-1594633312681-425c7b97ccd1",
    "photo-1473966968600-fa801b869a1a",
    "photo-1542272604-787c3835535d",
    "photo-1551488831-00ddcb6c6bd3",
    "photo-1506629082955-511b1aa562c8",
  ],
  onepiece: [
    "photo-1515372039744-b8f02a3ae446",
    "photo-1496747611176-843222e1e57c",
    "photo-1490481651871-ab68de25d43d",
    "photo-1515886657613-9f3515b0c78f",
    "photo-1539109136881-3be0616acf4b",
    "photo-1509631179647-0177331693ae",
  ],
  outer: [
    "photo-1487222477894-8943e31ef7b2",
    "photo-1551028719-00167b16eac5",
    "photo-1507679799987-c73779587ccf",
    "photo-1591047139829-d91aecb6caea",
    "photo-1544022613-e87ca75a784a",
    "photo-1490578474895-699cd4e2cf59",
    "photo-1539533018447-63fcce2678e3",
  ],
  shoes: [
    "photo-1543163521-1bf539c55dd2",
    "photo-1549298916-b41d501d3772",
    "photo-1533867617858-e7b97e060509",
    "photo-1460353581641-37baddab0fa2",
    "photo-1449505278894-297fdb3edbc1",
    "photo-1542291026-7eec264c27ff",
  ],
  bag: [
    "photo-1584917865442-de89df76afd3",
    "photo-1590874103328-eac38a683ce7",
    "photo-1548036328-c9fa89d128fa",
    "photo-1566150905458-1bf1fc113f0d",
    "photo-1594633313593-bab3825d0caf",
  ],
  accessory: [
    "photo-1588850561407-ed78c282e89b",
    "photo-1520903920243-00d872a2d1c9",
    "photo-1535632066927-ab7c9ab60908",
    "photo-1511499767150-a48a237f0083",
    "photo-1611652022419-a9419f74343d",
  ],
};

const ITEM_NAMES: Record<FashionCategory, string[]> = {
  tops: ["Tシャツ", "シャツ", "ブラウス", "ニット", "スウェット", "ポロシャツ", "パーカー", "カットソー", "キャミソール", "タートル"],
  bottoms: ["デニム", "スラックス", "スカート", "ワイドパンツ", "チノパン", "ショートパンツ", "プリーツスカート", "ジョガーパンツ"],
  onepiece: ["シャツワンピース", "ニットワンピ", "キャミワンピ", "オールインワン", "ジャンスカ", "シャツドレス", "ロングワンピ"],
  outer: ["トレンチ", "ジャケット", "コート", "ブルゾン", "ダウン", "シャツジャケット", "テーラード"],
  shoes: ["スニーカー", "ローファー", "ブーツ", "サンダル", "パンプス", "ヒール", "スリッポン"],
  bag: ["トート", "ショルダー", "リュック", "ハンドバッグ", "ミニバッグ", "ボストン"],
  accessory: ["キャップ", "スカーフ", "ベルト", "ネックレス", "ピアス", "サングラス", "手袋"],
};

const MATERIALS = ["コットン", "リネン", "ウール", "デニム", "サテン", "ナイロン", "レザー", "フリース", "シアサッカー", "ツイード"];
const FITS = ["", "オーバーサイズ", "クロップド", "ロング", "リラックス", "ボックス", "スリム", "ワイド"];
const BRANDS = ["nube", "LUMIERE", "mellow", "FORM", "ATELIER N", "PLAIN", "SOIL", "halo", "WEEKDAY NOTE", "KINU"];
const BLURBS = [
  "着回しやすい定番です。",
  "きれいめの日にも、休日にも合います。",
  "色を足したいときに選びやすい一着です。",
  "予算を抑えたい日の候補です。",
  "上に羽織るだけで印象が変わります。",
  "サンプルカタログから選んだ、今の気分向けです。",
];

const TONES: Record<ColorName, string> = {
  black: "#1c1c1c",
  white: "#f4f1ec",
  beige: "#d7c3a5",
  navy: "#243454",
  pink: "#f3a8b8",
  red: "#c83b45",
  brown: "#7a5342",
  blue: "#4d7ea8",
  green: "#6d8f62",
  gray: "#9a9a9a",
  yellow: "#e6c85c",
};

const COLOR_LABEL: Record<ColorName, string> = {
  black: "ブラック",
  white: "ホワイト",
  beige: "ベージュ",
  navy: "ネイビー",
  pink: "ピンク",
  red: "レッド",
  brown: "ブラウン",
  blue: "ブルー",
  green: "グリーン",
  gray: "グレー",
  yellow: "イエロー",
};

const CATEGORIES: FashionCategory[] = ["tops", "bottoms", "onepiece", "outer", "shoes", "bag", "accessory"];
const GENDERS: Gender[] = ["women", "men", "unisex"];
const STYLES: Style[] = ["casual", "elegant", "street", "girly", "mode", "korean", "office"];
const SEASONS: Season[] = ["spring", "summer", "autumn", "winter", "all"];
const OCCASIONS: Occasion[] = ["daily", "date", "work", "party", "travel"];
const COLORS: ColorName[] = ["black", "white", "beige", "navy", "pink", "red", "brown", "blue", "green", "gray", "yellow"];
const PRICES = [300, 500, 980, 1280, 1480, 1980, 2480, 2980, 3480, 3980, 4580, 5280, 5980, 6980, 7980, 8980, 9980, 11800, 13800, 15800, 17800, 19800, 22800, 26800, 32800, 39800];

function at<T>(list: T[], index: number): T {
  return list[((index % list.length) + list.length) % list.length];
}

function uniq<T>(values: T[]): T[] {
  return [...new Set(values)];
}

export const SAMPLE_CLOTHES: Product[] = Array.from({ length: 1000 }, (_, index) => {
  const category = at(CATEGORIES, index);
  const gender = at(GENDERS, Math.floor(index / CATEGORIES.length));
  const style = at(STYLES, Math.floor(index / (CATEGORIES.length * GENDERS.length)));
  const color = at(COLORS, index);
  const season = at(SEASONS, Math.floor(index / COLORS.length));
  const occasion = at(OCCASIONS, Math.floor(index / 4));
  const secondStyle = at(STYLES, STYLES.indexOf(style) + 3);
  const secondColor = at(COLORS, index + 4);
  const secondOccasion = at(OCCASIONS, OCCASIONS.indexOf(occasion) + 2);
  const fit = at(FITS, Math.floor(index / 11));
  const material = at(MATERIALS, index);
  const item = at(ITEM_NAMES[category], Math.floor(index / CATEGORIES.length));
  const price = at(PRICES, index);
  const photos = PHOTOS[category];

  return {
    id: `sample-${String(index + 1).padStart(4, "0")}`,
    kind: "fashion" as const,
    fashionCategory: category,
    name: `${fit}${COLOR_LABEL[color]}${material}${item}`,
    brand: at(BRANDS, index),
    price,
    image: shot(at(photos, index)),
    tone: TONES[color],
    description: `${COLOR_LABEL[color]}の${item}。${at(BLURBS, index)}`,
    gender,
    styles: uniq([style, index % 3 === 0 ? secondStyle : style]),
    seasons: uniq(season === "all" || index % 6 === 0 ? [season, "all" as Season] : [season]),
    occasions: uniq([occasion, secondOccasion]),
    colors: uniq(index % 4 === 0 ? [color, secondColor] : [color]),
    appeal: (index % 5) + 1,
    sizeNote: category === "shoes" ? "22.5–28.0" : category === "bag" || category === "accessory" ? "フリー" : gender === "men" ? "M–XL" : "S–L",
  };
});
