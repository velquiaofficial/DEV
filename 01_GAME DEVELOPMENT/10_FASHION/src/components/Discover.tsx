import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { LABELS, categoryLabel } from "../data";
import { yen } from "../logic";
import type { ScoredProduct } from "../types";
import { IconClose, IconHeart, IconStar, IconUndo, Photo } from "./ui";

type Direction = "like" | "nope" | "super";

export function Discover({
  deck,
  budget,
  remaining,
  totalMatches,
  passCount,
  canUndo,
  hotkeys,
  onLike,
  onPass,
  onUndo,
  onResetPasses,
  onOpenFilters,
  onSwipe,
  onReject,
}: {
  deck: ScoredProduct[];
  budget: number;
  remaining: number;
  totalMatches: number;
  passCount: number;
  canUndo: boolean;
  hotkeys: boolean;
  onLike: (product: ScoredProduct, superLike: boolean) => void;
  onPass: (product: ScoredProduct) => void;
  onUndo: () => void;
  onResetPasses: () => void;
  onOpenFilters: () => void;
  onSwipe: () => void;
  onReject: () => void;
}) {
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [denied, setDenied] = useState(false);
  const [outgoing, setOutgoing] = useState<{ product: ScoredProduct; dir: Direction } | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const dragRef = useRef({ x: 0, y: 0 });
  const lock = useRef(false);

  const act = useCallback(
    (dir: Direction) => {
      const current = deck[0];
      if (!current || lock.current) return;
      if (dir !== "nope" && current.price > remaining) {
        setDenied(true);
        window.setTimeout(() => setDenied(false), 380);
        onReject();
        return;
      }
      lock.current = true;
      setDragging(false);
      setOutgoing({ product: current, dir });
      onSwipe();
      if (dir === "nope") onPass(current);
      else onLike(current, dir === "super");
      window.setTimeout(() => {
        lock.current = false;
        setOutgoing(null);
        setDrag({ x: 0, y: 0 });
        dragRef.current = { x: 0, y: 0 };
      }, 280);
    },
    [deck, onLike, onPass, onReject, onSwipe, remaining],
  );

  useEffect(() => {
    if (!hotkeys) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        act("like");
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        act("nope");
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        act("super");
      } else if (event.key === "Backspace") {
        event.preventDefault();
        onUndo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, hotkeys, onUndo]);

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (lock.current || !deck[0]) return;
    setDragging(true);
    origin.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!dragging) return;
    const next = {
      x: event.clientX - origin.current.x,
      y: event.clientY - origin.current.y,
    };
    dragRef.current = next;
    setDrag(next);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    const x = dragRef.current.x;
    if (x > 110) act("like");
    else if (x < -110) act("nope");
    else {
      dragRef.current = { x: 0, y: 0 };
      setDrag({ x: 0, y: 0 });
    }
  };

  const front = outgoing?.product ?? deck[0];
  const back1 = outgoing ? deck[0] : deck[1];
  const back2 = outgoing ? deck[1] : deck[2];
  const offsetX = outgoing ? (outgoing.dir === "nope" ? -520 : 520) : drag.x;
  const likeOpacity = outgoing
    ? outgoing.dir === "nope"
      ? 0
      : 1
    : Math.min(1, Math.max(0, drag.x / 90));
  const nopeOpacity = outgoing
    ? outgoing.dir === "nope"
      ? 1
      : 0
    : Math.min(1, Math.max(0, -drag.x / 90));

  if (!front) {
    const narrowed = totalMatches === 0;
    return (
      <div className="discover">
        <div className="empty">
          <div className="empty-mark">♡</div>
          <h2>{narrowed ? "条件に合うものがありません" : "一通り見終わりました"}</h2>
          <p>
            {narrowed
              ? "残り予算が足りないか、条件が狭くなっています。いいねを外すと、その分だけカードが戻ります。"
              : passCount > 0
                ? "スキップしたカードを戻すか、条件を変えて続きを探せます。"
                : "予算内のものは、すべていいね済みです。"}
          </p>
          {canUndo && (
            <button type="button" className="primary" onClick={onUndo}>
              直前のスワイプを戻す
            </button>
          )}
          {passCount > 0 && (
            <button type="button" className="ghost" onClick={onResetPasses}>
              スキップを戻す
            </button>
          )}
          <button type="button" className="ghost" onClick={onOpenFilters}>
            条件を変える
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="discover">
      <div className="deck">
        {back2 && (
          <div className="stack back2">
            <article className="card">
              <Card product={back2} budget={budget} />
            </article>
          </div>
        )}
        {back1 && (
          <div className="stack back">
            <article className="card">
              <Card product={back1} budget={budget} />
            </article>
          </div>
        )}
        <div className={denied ? "stack front shake" : "stack front"}>
          <article
            className="card"
            style={{
              transform: `translate(${offsetX}px, ${outgoing ? drag.y * 0.2 : drag.y}px) rotate(${offsetX / 18}deg)`,
              transition: dragging ? "none" : "transform 0.28s ease",
            }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <Card product={front} budget={budget} over={front.price > remaining} />
            <div className="stamp like" style={{ opacity: likeOpacity }}>
              いいね
            </div>
            <div className="stamp nope" style={{ opacity: nopeOpacity }}>
              スキップ
            </div>
          </article>
        </div>
      </div>
      <div className="actions">
        <button type="button" className="round" aria-label="やり直す" disabled={!canUndo} onClick={onUndo}>
          <IconUndo />
        </button>
        <button type="button" className="round nope" aria-label="スキップ" onClick={() => act("nope")}>
          <IconClose />
        </button>
        <button type="button" className="round like" aria-label="いいね" onClick={() => act("like")}>
          <IconHeart filled />
        </button>
        <button type="button" className="round super" aria-label="本命" onClick={() => act("super")}>
          <IconStar />
        </button>
      </div>
      <p className="keys-hint">← スキップ　→ いいね　↑ 本命</p>
    </div>
  );
}

function Card({
  product,
  budget,
  over = false,
}: {
  product: ScoredProduct;
  budget: number;
  over?: boolean;
}) {
  const pct = budget > 0 ? Math.min(100, Math.round((product.price / budget) * 100)) : 0;
  const tags = [
    ...product.styles.slice(0, 2).map((style) => LABELS[style]),
    product.occasions[0] ? LABELS[product.occasions[0]] : "",
  ].filter(Boolean);

  return (
    <>
      <Photo src={product.image} alt={product.name} tone={product.tone} />
      <div className="card-shade" />
      <div className="card-top">
        <div className="card-pills">
          <span className="pill">{categoryLabel(product)}</span>
          {product.gender === "men" && <span className="pill">メンズ</span>}
          {over && <span className="pill warn">予算オーバー</span>}
        </div>
        <span className="score">相性 {product.score}%</span>
      </div>
      <div className="card-body">
        <div className="title-row">
          <p className="brand">{product.brand}</p>
          <div className="price">¥{yen(product.price)}</div>
        </div>
        <h2>{product.name}</h2>
        <div className="tags">
          {tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
          {product.sizeNote && <span className="tag">{product.sizeNote}</span>}
        </div>
        <div className="share">
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="share-label">予算の {pct}%</p>
        <p className="desc">{product.description}</p>
      </div>
    </>
  );
}
