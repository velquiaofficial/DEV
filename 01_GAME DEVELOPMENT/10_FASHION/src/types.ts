export type Kind = "fashion" | "beauty";

export type FashionCategory =
  | "tops"
  | "bottoms"
  | "onepiece"
  | "outer"
  | "shoes"
  | "bag"
  | "accessory";

export type BeautyCategory =
  | "base"
  | "eye"
  | "lip"
  | "skincare"
  | "hair"
  | "fragrance";

export type Style =
  | "casual"
  | "elegant"
  | "street"
  | "girly"
  | "mode"
  | "korean"
  | "office";

export type Season = "spring" | "summer" | "autumn" | "winter" | "all";

export type Occasion = "daily" | "date" | "work" | "party" | "travel";

export type ColorName =
  | "black"
  | "white"
  | "beige"
  | "navy"
  | "pink"
  | "red"
  | "brown"
  | "blue"
  | "green"
  | "gray"
  | "yellow";

export type Gender = "women" | "men" | "unisex";

export type SkinType = "dry" | "combination" | "oily" | "sensitive" | "normal";

export type PersonalColor =
  | "pc-spring"
  | "pc-summer"
  | "pc-autumn"
  | "pc-winter"
  | "neutral";

export type Finish = "matte" | "glow" | "natural" | "sheer";

export type Choice = {
  id: string;
  label: string;
  swatch?: string;
};

export type Product = {
  id: string;
  kind: Kind;
  name: string;
  brand: string;
  price: number;
  image: string;
  tone: string;
  description: string;
  gender: Gender;
  styles: Style[];
  seasons: Season[];
  occasions: Occasion[];
  colors: ColorName[];
  appeal: number;
  fashionCategory?: FashionCategory;
  beautyCategory?: BeautyCategory;
  skinTypes?: SkinType[];
  personalColors?: PersonalColor[];
  finishes?: Finish[];
  sizeNote?: string;
};

export type Filters = {
  budget: number;
  kinds: Kind[];
  genders: Gender[];
  styles: Style[];
  seasons: Season[];
  occasions: Occasion[];
  colors: ColorName[];
  fashionCategories: FashionCategory[];
  beautyCategories: BeautyCategory[];
  skinTypes: SkinType[];
  personalColors: PersonalColor[];
  finishes: Finish[];
  priceMin: number;
  includeOverBudget: boolean;
};

export type ScoredProduct = Product & {
  score: number;
};

export type Look = {
  id: string;
  title: string;
  blurb: string;
  items: ScoredProduct[];
  total: number;
  score: number;
};
