import { LABELS } from "./data";
import type {
  FashionCategory,
  Filters,
  Look,
  Product,
  ScoredProduct,
} from "./types";

const NEUTRALS = new Set(["black", "white", "beige", "gray", "navy", "brown"]);

const ARRAY_KEYS = [
  "kinds",
  "genders",
  "styles",
  "seasons",
  "occasions",
  "colors",
  "fashionCategories",
  "beautyCategories",
  "skinTypes",
  "personalColors",
  "finishes",
] as const;

export function yen(value: number): string {
  return new Intl.NumberFormat("ja-JP").format(value);
}

export function toggleIn<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export function activeFilterCount(filters: Filters): number {
  let count = 0;
  for (const key of ARRAY_KEYS) {
    if (filters[key].length > 0) count += 1;
  }
  if (filters.priceMin > 0) count += 1;
  if (filters.includeOverBudget) count += 1;
  return count;
}

function overlaps(selected: string[], values: string[] | undefined): boolean {
  if (selected.length === 0) return true;
  return (values ?? []).some((value) => selected.includes(value));
}

function coverage(selected: string[], values: string[] | undefined, weight: number): number {
  if (selected.length === 0) return 0;
  const owned = new Set(values ?? []);
  const hits = selected.filter((value) => owned.has(value)).length;
  return (hits / selected.length) * weight;
}

function genderOk(product: Product, filters: Filters): boolean {
  if (filters.genders.length === 0) return true;
  if (product.gender === "unisex") return true;
  return filters.genders.includes(product.gender);
}

function seasonOk(product: Product, filters: Filters): boolean {
  if (filters.seasons.length === 0) return true;
  if (product.seasons.includes("all")) return true;
  return product.seasons.some((season) => filters.seasons.includes(season));
}

function personalColorOk(product: Product, filters: Filters): boolean {
  if (filters.personalColors.length === 0 || product.kind !== "beauty") return true;
  const owned = product.personalColors ?? [];
  if (owned.includes("neutral")) return true;
  return owned.some((color) => filters.personalColors.includes(color));
}

export function matches(product: Product, filters: Filters, ceiling: number): boolean {
  if (product.price < filters.priceMin) return false;
  if (product.price > ceiling || product.price > filters.budget) return false;
  if (filters.kinds.length > 0 && !filters.kinds.includes(product.kind)) return false;
  if (!genderOk(product, filters) || !seasonOk(product, filters)) return false;
  if (!overlaps(filters.styles, product.styles)) return false;
  if (!overlaps(filters.occasions, product.occasions)) return false;
  if (!overlaps(filters.colors, product.colors)) return false;
  if (product.kind === "fashion" && filters.fashionCategories.length > 0) {
    if (!product.fashionCategory || !filters.fashionCategories.includes(product.fashionCategory)) {
      return false;
    }
  }
  if (product.kind === "beauty" && filters.beautyCategories.length > 0) {
    if (!product.beautyCategory || !filters.beautyCategories.includes(product.beautyCategory)) {
      return false;
    }
  }
  if (product.kind === "beauty") {
    if (!overlaps(filters.skinTypes, product.skinTypes)) return false;
    if (!overlaps(filters.finishes, product.finishes)) return false;
    if (!personalColorOk(product, filters)) return false;
  }
  return true;
}

function wobble(id: string): number {
  let total = 0;
  for (const char of id) total = (total + char.charCodeAt(0) * 13) % 7;
  return total - 3;
}

function priceFit(price: number, budget: number): number {
  if (budget <= 0) return 0;
  const ratio = price / budget;
  if (ratio > 1) return -18;
  if (ratio >= 0.18 && ratio <= 0.62) return 8;
  if (ratio > 0.62 && ratio <= 0.9) return 5;
  if (ratio >= 0.08) return 3;
  return 1;
}

export function compatibility(product: Product, filters: Filters): number {
  let score = 58 + wobble(product.id) + product.appeal * 5;
  score += coverage(filters.styles, product.styles, 10);
  score += coverage(filters.occasions, product.occasions, 8);
  score += coverage(filters.colors, product.colors, 6);
  if (filters.seasons.length > 0) {
    score += product.seasons.includes("all")
      ? 6
      : coverage(filters.seasons, product.seasons, 6);
  }
  if (filters.genders.includes(product.gender)) score += 3;
  if (product.kind === "beauty") {
    score += coverage(filters.skinTypes, product.skinTypes, 8);
    score += coverage(filters.finishes, product.finishes, 5);
    if (filters.personalColors.length > 0) {
      const owned = product.personalColors ?? [];
      score += owned.includes("neutral")
        ? 4
        : coverage(filters.personalColors, owned, 8);
    }
  }
  score += priceFit(product.price, filters.budget);
  return Math.max(52, Math.min(99, Math.round(score)));
}

export function queryProducts(
  products: Product[],
  filters: Filters,
  options?: { excludeIds?: string[]; spent?: number },
): ScoredProduct[] {
  const exclude = new Set(options?.excludeIds ?? []);
  const spent = options?.spent ?? 0;
  const ceiling = filters.includeOverBudget
    ? filters.budget
    : Math.max(0, filters.budget - spent);
  return products
    .filter((product) => !exclude.has(product.id) && matches(product, filters, ceiling))
    .map((product) => ({ ...product, score: compatibility(product, filters) }))
    .sort((a, b) => b.score - a.score || b.appeal - a.appeal || b.price - a.price);
}

function pairOk(a: Product, b: Product): boolean {
  if (a.gender !== "unisex" && b.gender !== "unisex" && a.gender !== b.gender) return false;
  if (a.styles.some((style) => b.styles.includes(style))) return true;
  const aNeutral = a.colors.some((color) => NEUTRALS.has(color));
  const bNeutral = b.colors.some((color) => NEUTRALS.has(color));
  return aNeutral && bNeutral;
}

function sum(items: Product[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}

function mode(values: string[]): string | null {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  let best: string | null = null;
  let bestCount = 0;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
    }
  }
  return best;
}

function titleFor(items: ScoredProduct[], filters: Filters): string {
  const fashion = items.filter((item) => item.kind === "fashion");
  if (fashion.length === 0) {
    const categories = [
      ...new Set(items.map((item) => LABELS[item.beautyCategory ?? ""] ?? "コスメ")),
    ];
    return `${categories.slice(0, 2).join("と")}のセット`;
  }
  const stylePool = fashion.flatMap((item) =>
    item.styles.filter((style) => filters.styles.length === 0 || filters.styles.includes(style)),
  );
  const occasionPool = fashion.flatMap((item) =>
    item.occasions.filter(
      (occasion) => filters.occasions.length === 0 || filters.occasions.includes(occasion),
    ),
  );
  const style = mode(stylePool.length > 0 ? stylePool : fashion.flatMap((item) => item.styles));
  const occasion = mode(
    occasionPool.length > 0 ? occasionPool : fashion.flatMap((item) => item.occasions),
  );
  if (occasion && style) return `${LABELS[occasion]}の${LABELS[style]}`;
  if (style) return `${LABELS[style]}コーデ`;
  return "予算内コーデ";
}

function consider(items: ScoredProduct[], combos: { items: ScoredProduct[]; rank: number }[], remaining: number) {
  if (items.length < 2) return;
  const total = sum(items);
  if (total <= 0 || total > remaining) return;
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i];
      const right = items[j];
      if (left.kind === "fashion" && right.kind === "fashion" && !pairOk(left, right)) return;
    }
  }
  const average = items.reduce((totalScore, item) => totalScore + item.score, 0) / items.length;
  const usage = total / remaining;
  const fit = usage >= 0.4 && usage <= 0.92 ? 10 : 3;
  combos.push({ items, rank: average + fit + items.length * 3 });
}

export function buildLooks(
  products: Product[],
  filters: Filters,
  excludeIds: string[],
  spent: number,
): Look[] {
  const remaining = filters.budget - spent;
  if (remaining < 800) return [];
  const pool = queryProducts(
    products,
    { ...filters, includeOverBudget: false },
    { excludeIds, spent },
  );
  const take = (category: FashionCategory, count: number) =>
    pool.filter((item) => item.fashionCategory === category).slice(0, count);
  const tops = take("tops", 5);
  const bottoms = take("bottoms", 5);
  const dresses = take("onepiece", 4);
  const outers = take("outer", 3);
  const shoes = take("shoes", 4);
  const bags = take("bag", 3);
  const beauty = pool.filter((item) => item.kind === "beauty").slice(0, 8);
  const combos: { items: ScoredProduct[]; rank: number }[] = [];

  for (const top of tops) {
    for (const bottom of bottoms) {
      if (!pairOk(top, bottom)) continue;
      const base = [top, bottom];
      consider(base, combos, remaining);
      const shoe = shoes.find((item) => pairOk(item, top) && sum([...base, item]) <= remaining);
      if (shoe) consider([...base, shoe], combos, remaining);
      const bag = bags.find((item) => pairOk(item, top) && sum([...base, item]) <= remaining);
      if (bag) consider([...base, bag], combos, remaining);
    }
  }

  for (const dress of dresses) {
    const shoe = shoes.find((item) => pairOk(item, dress) && dress.price + item.price <= remaining);
    const bag = bags.find((item) => pairOk(item, dress) && dress.price + item.price <= remaining);
    if (shoe) consider([dress, shoe], combos, remaining);
    if (bag) consider([dress, bag], combos, remaining);
    if (shoe && bag && dress.price + shoe.price + bag.price <= remaining) {
      consider([dress, shoe, bag], combos, remaining);
    }
  }

  for (const outer of outers) {
    for (const top of tops) {
      if (!pairOk(outer, top) || outer.price + top.price > remaining) continue;
      consider([outer, top], combos, remaining);
      const bottom = bottoms.find(
        (item) => pairOk(item, top) && outer.price + top.price + item.price <= remaining,
      );
      if (bottom) consider([outer, top, bottom], combos, remaining);
    }
  }

  for (let i = 0; i < beauty.length; i += 1) {
    for (let j = i + 1; j < beauty.length; j += 1) {
      if (beauty[i].beautyCategory === beauty[j].beautyCategory) continue;
      consider([beauty[i], beauty[j]], combos, remaining);
      for (let k = j + 1; k < Math.min(beauty.length, j + 4); k += 1) {
        if (
          beauty[k].beautyCategory === beauty[i].beautyCategory ||
          beauty[k].beautyCategory === beauty[j].beautyCategory
        ) {
          continue;
        }
        consider([beauty[i], beauty[j], beauty[k]], combos, remaining);
      }
    }
  }

  const seen = new Set<string>();
  const unique = combos
    .sort((a, b) => b.rank - a.rank)
    .filter((combo) => {
      const id = combo.items
        .map((item) => item.id)
        .sort()
        .join("-");
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

  const toLook = (items: ScoredProduct[]): Look => {
    const total = sum(items);
    const score = Math.round(
      items.reduce((totalScore, item) => totalScore + item.score, 0) / items.length,
    );
    const pct = filters.budget > 0 ? Math.round((total / filters.budget) * 100) : 0;
    return {
      id: items
        .map((item) => item.id)
        .sort()
        .join("-"),
      title: titleFor(items, filters),
      blurb: `${items.length}点で、全体予算の${pct}%です。`,
      items,
      total,
      score,
    };
  };

  const picked: Look[] = [];
  const uses = new Map<string, number>();
  const titles = new Map<string, number>();
  for (const combo of unique) {
    if (picked.length >= 6) break;
    if (combo.items.some((item) => (uses.get(item.id) ?? 0) >= 2)) continue;
    const look = toLook(combo.items);
    if ((titles.get(look.title) ?? 0) >= 2) continue;
    picked.push(look);
    titles.set(look.title, (titles.get(look.title) ?? 0) + 1);
    for (const item of combo.items) uses.set(item.id, (uses.get(item.id) ?? 0) + 1);
  }
  if (picked.length < 3) {
    for (const combo of unique) {
      if (picked.length >= 6) break;
      const look = toLook(combo.items);
      if (picked.some((item) => item.id === look.id)) continue;
      picked.push(look);
    }
  }

  const wantsBeauty = filters.kinds.length === 0 || filters.kinds.includes("beauty");
  if (wantsBeauty && !picked.some((look) => look.items.some((item) => item.kind === "beauty"))) {
    const beautyCombo = unique.find((combo) => combo.items.every((item) => item.kind === "beauty"));
    if (beautyCombo) {
      if (picked.length >= 6) picked.pop();
      picked.push(toLook(beautyCombo.items));
    }
  }

  return picked.slice(0, 6);
}
