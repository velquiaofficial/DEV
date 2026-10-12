import { defaultFilters } from "../data";
import type { Filters } from "../types";
import { ConditionFields } from "./Conditions";
import { BudgetField } from "./ui";

export function FilterSheet({
  filters,
  matchCount,
  onChange,
  onClose,
  onResetSwipes,
}: {
  filters: Filters;
  matchCount: number;
  onChange: (filters: Filters) => void;
  onClose: () => void;
  onResetSwipes: () => void;
}) {
  return (
    <div className="overlay">
      <button type="button" className="backdrop" aria-label="閉じる" onClick={onClose} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label="条件">
        <div className="handle" />
        <div className="sheet-head">
          <h2>条件</h2>
          <p className="sheet-note">選んだものだけ絞ります。空欄の項目はすべて対象です。</p>
        </div>
        <div className="sheet-body">
          <div className="field-label">
            予算
            <span>この金額を超える単品は出ません</span>
          </div>
          <BudgetField
            compact
            budget={filters.budget}
            onChange={(budget) => onChange({ ...filters, budget })}
          />
          <ConditionFields filters={filters} onChange={onChange} scope="full" showKinds />
          <button
            type="button"
            className="ghost"
            onClick={() => onChange(defaultFilters(filters.budget))}
          >
            条件をクリア
          </button>
          <button type="button" className="ghost" onClick={onResetSwipes}>
            いいねとスキップをやり直す
          </button>
        </div>
        <div className="sheet-foot">
          <button type="button" className="primary" onClick={onClose}>
            {matchCount}件を見る
          </button>
        </div>
      </div>
    </div>
  );
}
