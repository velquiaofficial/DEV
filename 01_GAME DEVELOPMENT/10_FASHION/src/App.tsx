import { useEffect, useMemo, useRef, useState } from "react";
import { Discover } from "./components/Discover";
import { FilterSheet } from "./components/FilterSheet";
import { Likes } from "./components/Likes";
import { Looks } from "./components/Looks";
import { Setup } from "./components/Setup";
import { IconCards, IconHeart, IconSliders, IconSpark } from "./components/ui";
import { defaultFilters, PRODUCT_MAP, PRODUCTS } from "./data";
import { activeFilterCount, buildLooks, queryProducts, yen } from "./logic";
import type { Filters, Look, Product } from "./types";

type Tab = "discover" | "looks" | "likes";
type Action = { type: "like"; id: string; super: boolean } | { type: "pass"; id: string };

type Saved = {
  ready: boolean;
  filters: Filters;
  likeIds: string[];
  superIds: string[];
  passIds: string[];
};

function loadState(): Saved | null {
  try {
    const raw = localStorage.getItem("pittari-v1");
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<Saved>;
    if (!data.filters || typeof data.filters.budget !== "number") return null;
    const filters = { ...defaultFilters(data.filters.budget), ...data.filters };
    const likeIds = (Array.isArray(data.likeIds) ? data.likeIds : []).filter((id) =>
      PRODUCT_MAP.has(id),
    );
    const superIds = (Array.isArray(data.superIds) ? data.superIds : []).filter((id) =>
      likeIds.includes(id),
    );
    const passIds = (Array.isArray(data.passIds) ? data.passIds : []).filter(
      (id) => PRODUCT_MAP.has(id) && !likeIds.includes(id),
    );
    return { ready: Boolean(data.ready), filters, likeIds, superIds, passIds };
  } catch {
    return null;
  }
}

function loadCoach() {
  try {
    return localStorage.getItem("pittari-coach") !== "1";
  } catch {
    return true;
  }
}

export function App() {
  const saved = useRef(loadState()).current;
  const [ready, setReady] = useState(saved?.ready ?? false);
  const [filters, setFilters] = useState<Filters>(saved?.filters ?? defaultFilters());
  const [likeIds, setLikeIds] = useState<string[]>(saved?.likeIds ?? []);
  const [superIds, setSuperIds] = useState<string[]>(saved?.superIds ?? []);
  const [passIds, setPassIds] = useState<string[]>(saved?.passIds ?? []);
  const [history, setHistory] = useState<Action[]>([]);
  const [frontId, setFrontId] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("discover");
  const [sheet, setSheet] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCoach, setShowCoach] = useState(loadCoach);
  const toastTimer = useRef<number | null>(null);
  const historyRef = useRef<Action[]>([]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "pittari-v1",
        JSON.stringify({ ready, filters, likeIds, superIds, passIds }),
      );
    } catch {
      /* ignore quota */
    }
  }, [ready, filters, likeIds, superIds, passIds]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSheet(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const spent = useMemo(
    () => likeIds.reduce((total, id) => total + (PRODUCT_MAP.get(id)?.price ?? 0), 0),
    [likeIds],
  );
  const remaining = Math.max(0, filters.budget - spent);
  const pool = useMemo(
    () => queryProducts(PRODUCTS, filters, { excludeIds: likeIds, spent }),
    [filters, likeIds, spent],
  );
  const deck = useMemo(() => {
    const list = pool.filter((item) => !passIds.includes(item.id));
    if (!frontId) return list;
    const index = list.findIndex((item) => item.id === frontId);
    if (index <= 0) return list;
    const copy = list.slice();
    const [item] = copy.splice(index, 1);
    copy.unshift(item);
    return copy;
  }, [pool, passIds, frontId]);
  const looks = useMemo(
    () => buildLooks(PRODUCTS, filters, [...likeIds, ...passIds], spent),
    [filters, likeIds, passIds, spent],
  );
  const likedItems = useMemo(
    () =>
      likeIds
        .map((id) => {
          const product = PRODUCT_MAP.get(id);
          return product ? { ...product, superLike: superIds.includes(id) } : null;
        })
        .filter((item): item is Product & { superLike: boolean } => item !== null)
        .sort((a, b) => {
          if (a.superLike !== b.superLike) return a.superLike ? -1 : 1;
          return likeIds.indexOf(b.id) - likeIds.indexOf(a.id);
        }),
    [likeIds, superIds],
  );

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }

  function dismissCoach() {
    setShowCoach(false);
    try {
      localStorage.setItem("pittari-coach", "1");
    } catch {
      /* ignore */
    }
  }

  function updateFilters(next: Filters) {
    const budget = Math.max(0, Math.min(500000, Math.round(next.budget) || 0));
    setFilters({
      ...next,
      budget,
      priceMin: Math.max(0, Math.min(next.priceMin, budget)),
    });
    setFrontId(null);
  }

  function likeProduct(product: Product, superLike: boolean) {
    if (likeIds.includes(product.id)) return;
    if (spent + product.price > filters.budget) {
      notify("残り予算を超えるので、いいねできません");
      return;
    }
    setLikeIds((ids) => [...ids, product.id]);
    if (superLike) setSuperIds((ids) => (ids.includes(product.id) ? ids : [...ids, product.id]));
    setPassIds((ids) => ids.filter((id) => id !== product.id));
    setHistory((items) =>
      [...items, { type: "like" as const, id: product.id, super: superLike }].slice(-40),
    );
    dismissCoach();
  }

  function passProduct(product: Product) {
    setPassIds((ids) => (ids.includes(product.id) ? ids : [...ids, product.id]));
    setHistory((items) => [...items, { type: "pass" as const, id: product.id }].slice(-40));
    dismissCoach();
  }

  function likeLook(look: Look) {
    const fresh = look.items.filter((item) => !likeIds.includes(item.id));
    const cost = fresh.reduce((total, item) => total + item.price, 0);
    if (fresh.length === 0) return;
    if (spent + cost > filters.budget) {
      notify("残り予算を超えるので追加できません");
      return;
    }
    setLikeIds((ids) => [...ids, ...fresh.map((item) => item.id)]);
    setHistory((items) =>
      [
        ...items,
        ...fresh.map((item) => ({ type: "like" as const, id: item.id, super: false })),
      ].slice(-40),
    );
    notify("コーデをいいねしました");
  }

  function unlike(id: string) {
    setLikeIds((ids) => ids.filter((item) => item !== id));
    setSuperIds((ids) => ids.filter((item) => item !== id));
  }

  function undo() {
    const last = historyRef.current[historyRef.current.length - 1];
    if (!last) return;
    setHistory((items) => items.slice(0, -1));
    if (last.type === "like") {
      setLikeIds((ids) => ids.filter((id) => id !== last.id));
      setSuperIds((ids) => ids.filter((id) => id !== last.id));
    } else {
      setPassIds((ids) => ids.filter((id) => id !== last.id));
    }
    setFrontId(last.id);
  }

  function resetSwipes() {
    setLikeIds([]);
    setSuperIds([]);
    setPassIds([]);
    setHistory([]);
    setFrontId(null);
    notify("いいねとスキップをリセットしました");
  }

  const filterCount = activeFilterCount(filters);
  const subtitle =
    tab === "discover"
      ? showCoach
        ? "右スワイプでいいね、左でスキップ"
        : `相性が高い順 · 予算内 ${deck.length}件`
      : tab === "looks"
        ? `残り予算のコーデ ${looks.length}件`
        : `いいね ${likeIds.length}件`;

  return (
    <div className="app">
      {ready ? (
        <>
          <header className="header">
            <div className="logo">pittari</div>
            <button type="button" className={remaining < filters.budget * 0.15 ? "budget-pill low" : "budget-pill"} onClick={() => setSheet(true)}>
              残り <strong>¥{yen(remaining)}</strong>
            </button>
            <button type="button" className="icon-btn" aria-label="条件" onClick={() => setSheet(true)}>
              <IconSliders />
              {filterCount > 0 && <em>{filterCount}</em>}
            </button>
          </header>
          <p className="subhead">{subtitle}</p>
          <main className="main">
            {tab === "discover" && (
              <Discover
                deck={deck}
                budget={filters.budget}
                remaining={remaining}
                totalMatches={pool.length}
                passCount={passIds.length}
                canUndo={history.length > 0}
                hotkeys={!sheet}
                onLike={likeProduct}
                onPass={passProduct}
                onUndo={undo}
                onResetPasses={() => {
                  setPassIds([]);
                  setFrontId(null);
                  notify("スキップを戻しました");
                }}
                onOpenFilters={() => setSheet(true)}
                onSwipe={dismissCoach}
                onReject={() => notify("残り予算を超えるので、いいねできません")}
              />
            )}
            {tab === "looks" && (
              <Looks
                looks={looks}
                budget={filters.budget}
                remaining={remaining}
                likedIds={likeIds}
                onLikeLook={likeLook}
                onOpenFilters={() => setSheet(true)}
              />
            )}
            {tab === "likes" && (
              <Likes
                items={likedItems}
                budget={filters.budget}
                spent={spent}
                onUnlike={unlike}
                onOpenFilters={() => setSheet(true)}
              />
            )}
          </main>
          <nav className="tabbar" aria-label="メイン">
            <button type="button" className={tab === "discover" ? "tab on" : "tab"} onClick={() => setTab("discover")}>
              <IconCards />
              <span>見つける</span>
            </button>
            <button type="button" className={tab === "looks" ? "tab on" : "tab"} onClick={() => setTab("looks")}>
              <IconSpark />
              <span>コーデ</span>
            </button>
            <button type="button" className={tab === "likes" ? "tab on" : "tab"} onClick={() => setTab("likes")}>
              <IconHeart filled={tab === "likes"} />
              <span>いいね</span>
              {likeIds.length > 0 && <em>{likeIds.length}</em>}
            </button>
          </nav>
          {sheet && (
            <FilterSheet
              filters={filters}
              matchCount={pool.length}
              onChange={updateFilters}
              onClose={() => setSheet(false)}
              onResetSwipes={resetSwipes}
            />
          )}
        </>
      ) : (
        <Setup
          filters={filters}
          matchCount={pool.length}
          onChange={updateFilters}
          onStart={() => {
            if (filters.budget >= 500) setReady(true);
          }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
