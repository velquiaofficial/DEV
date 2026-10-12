import { FILTER_GROUPS } from "../data";
import { toggleIn, yen } from "../logic";
import type { Filters } from "../types";

const BASIC = new Set(["styles", "occasions", "seasons", "genders"]);

export function ConditionFields({
  filters,
  onChange,
  scope,
  showKinds = false,
}: {
  filters: Filters;
  onChange: (filters: Filters) => void;
  scope: "basic" | "full";
  showKinds?: boolean;
}) {
  const groups = FILTER_GROUPS.filter((group) => {
    if (group.key === "kinds") return showKinds;
    if (scope === "basic") return BASIC.has(group.key);
    return true;
  });

  return (
    <>
      {groups.map((group) => {
        const raw = filters[group.key];
        if (!Array.isArray(raw)) return null;
        const selected = raw as string[];
        return (
          <section className="group" key={group.key}>
            <h3>{group.label}</h3>
            {group.hint && <span className="hint">{group.hint}</span>}
            <div className="chips">
              {group.options.map((option) => {
                const on = selected.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={on ? "chip on" : "chip"}
                    aria-pressed={on}
                    onClick={() =>
                      onChange({
                        ...filters,
                        [group.key]: toggleIn(selected, option.id),
                      } as Filters)
                    }
                  >
                    {option.swatch && <i className="dot" style={{ background: option.swatch }} />}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
      {scope === "full" && (
        <>
          <div className="range-row">
            <div className="field-label">
              最低価格
              <span>¥{yen(filters.priceMin)} 未満は出さない</span>
            </div>
            <input
              type="range"
              min={0}
              max={Math.max(1000, filters.budget)}
              step={500}
              value={Math.min(filters.priceMin, filters.budget)}
              aria-label="最低価格"
              onChange={(event) =>
                onChange({ ...filters, priceMin: Number(event.target.value) })
              }
            />
          </div>
          <div className="switch-row">
            <span>残り予算を超えるものも見る</span>
            <button
              type="button"
              className={filters.includeOverBudget ? "switch on" : "switch"}
              role="switch"
              aria-checked={filters.includeOverBudget}
              onClick={() =>
                onChange({ ...filters, includeOverBudget: !filters.includeOverBudget })
              }
            >
              <i />
            </button>
          </div>
        </>
      )}
    </>
  );
}
