import { categoryLabel } from "../data";
import { yen } from "../logic";
import type { Product } from "../types";
import { Photo } from "./ui";

export function Likes({
  items,
  budget,
  spent,
  onUnlike,
  onOpenFilters,
}: {
  items: (Product & { superLike: boolean })[];
  budget: number;
  spent: number;
  onUnlike: (id: string) => void;
  onOpenFilters: () => void;
}) {
  const remaining = Math.max(0, budget - spent);
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  return (
    <div className="scroll">
      <section className="summary">
        <div className="summary-top">
          <div>
            <p>使った金額</p>
            <strong>¥{yen(spent)}</strong>
          </div>
          <div>
            <p>予算</p>
            <strong>¥{yen(budget)}</strong>
          </div>
        </div>
        <div className="meter">
          <span style={{ width: `${pct}%` }} />
        </div>
        <p className="summary-note">
          {remaining > 0 ? `まだ ¥${yen(remaining)} 使えます` : "予算いっぱいまで選びました"}
        </p>
      </section>
      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-mark">♡</div>
          <h2>まだいいねがありません</h2>
          <p>カードを右にスワイプすると、ここに残ります。合計が予算を超えるものは保存できません。</p>
          <button type="button" className="ghost" onClick={onOpenFilters}>
            条件を見る
          </button>
        </div>
      ) : (
        items.map((item) => (
          <article className="like-row" key={item.id}>
            <Photo className="thumb" src={item.image} alt="" tone={item.tone} />
            <div>
              <h3>
                {item.name}
                {item.superLike && <span className="star">本命</span>}
              </h3>
              <p className="meta">
                {item.brand} · {categoryLabel(item)}
              </p>
              <p className="meta">¥{yen(item.price)}</p>
            </div>
            <button type="button" className="remove" aria-label={`${item.name}を外す`} onClick={() => onUnlike(item.id)}>
              ×
            </button>
          </article>
        ))
      )}
    </div>
  );
}
