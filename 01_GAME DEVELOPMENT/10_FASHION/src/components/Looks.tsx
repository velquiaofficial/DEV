import { yen } from "../logic";
import type { Look } from "../types";
import { Photo } from "./ui";

export function Looks({
  looks,
  budget,
  remaining,
  likedIds,
  onLikeLook,
  onOpenFilters,
}: {
  looks: Look[];
  budget: number;
  remaining: number;
  likedIds: string[];
  onLikeLook: (look: Look) => void;
  onOpenFilters: () => void;
}) {
  return (
    <div className="scroll">
      <p className="section-lead">
        残り ¥{yen(remaining)} の中で、条件に合う服とコスメを組み合わせています。セットごと、いいねできます。
      </p>
      {looks.length === 0 && (
        <div className="empty">
          <div className="empty-mark">✧</div>
          <h2>セットが組めません</h2>
          <p>残り予算が少ないか、条件が狭くなっています。単品は「見つける」に残っていることがあります。</p>
          <button type="button" className="primary" onClick={onOpenFilters}>
            条件を変える
          </button>
        </div>
      )}
      {looks.map((look) => {
        const fresh = look.items.filter((item) => !likedIds.includes(item.id));
        const done = fresh.length === 0;
        const remainPct = remaining > 0 ? Math.round((look.total / remaining) * 100) : 0;
        const budgetPct = budget > 0 ? Math.min(100, Math.round((look.total / budget) * 100)) : 0;
        const side = look.items.slice(1, 3);
        return (
          <article className="look" key={look.id}>
            <div className="collage">
              <div className="shot">
                <Photo src={look.items[0].image} alt={look.items[0].name} tone={look.items[0].tone} />
              </div>
              <div className="side">
                {side.map((item) => (
                  <div className="shot" key={item.id}>
                    <Photo src={item.image} alt={item.name} tone={item.tone} />
                  </div>
                ))}
              </div>
            </div>
            <div className="look-body">
              <div className="look-top">
                <h3>{look.title}</h3>
                <span className="score">相性 {look.score}%</span>
              </div>
              <p className="blurb">{look.blurb}</p>
              <ul className="look-items">
                {look.items.map((item) => (
                  <li key={item.id}>
                    <span>{item.name}</span>
                    <b>¥{yen(item.price)}</b>
                  </li>
                ))}
              </ul>
              <div className="title-row">
                <strong>¥{yen(look.total)}</strong>
                <span className="share-label">残り予算の {remainPct}%</span>
              </div>
              <div className="meter">
                <span style={{ width: `${budgetPct}%` }} />
              </div>
              <button
                type="button"
                className={done ? "primary dark" : "primary"}
                disabled={done}
                onClick={() => onLikeLook(look)}
              >
                {done ? "追加済み" : fresh.length < look.items.length ? "残りをいいね" : "このコーデをいいね"}
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
