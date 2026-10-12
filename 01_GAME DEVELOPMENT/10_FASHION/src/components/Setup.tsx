import { useState } from "react";
import { BUDGET_PRESETS, HERO_IDS, PRODUCT_MAP } from "../data";
import { yen } from "../logic";
import type { Filters, Kind } from "../types";
import { ConditionFields } from "./Conditions";
import { BudgetField } from "./ui";

export function Setup({
  filters,
  matchCount,
  onChange,
  onStart,
}: {
  filters: Filters;
  matchCount: number;
  onChange: (filters: Filters) => void;
  onStart: () => void;
}) {
  const [detailed, setDetailed] = useState(false);
  const mode: "all" | Kind =
    filters.kinds.length === 1 ? filters.kinds[0] : "all";
  const heroes = HERO_IDS.map((id) => PRODUCT_MAP.get(id)).filter((item) => item != null);

  return (
    <section className="setup">
      <div className="setup-scroll">
        <div className="hero" aria-hidden="true">
          {heroes.map((item) => (
            <img
              key={item.id}
              src={item.image}
              alt=""
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ))}
        </div>
        <p className="eyebrow">BUDGET MATCH</p>
        <div className="logo" style={{ fontSize: 42 }}>
          pittari
        </div>
        <h1>予算内で、ときめく。</h1>
        <p className="lead">
          予算を入れると、その金額で買える服とコスメだけがカードになります。右スワイプでいいね、左でスキップ。条件はあとから何枚でも変えられます。
        </p>
        <div className="field-label">
          あなたの予算
          <span>500円以上</span>
        </div>
        <BudgetField
          budget={filters.budget}
          onChange={(budget) => onChange({ ...filters, budget })}
        />
        <div className="presets">
          {BUDGET_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              className={filters.budget === preset ? "chip on" : "chip"}
              onClick={() => onChange({ ...filters, budget: preset })}
            >
              ¥{yen(preset)}
            </button>
          ))}
        </div>
        <div className="field-label">探しもの</div>
        <div className="segment" role="group" aria-label="探しもの">
          {(
            [
              ["all", "両方"],
              ["fashion", "服"],
              ["beauty", "コスメ"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={mode === id ? "on" : ""}
              onClick={() =>
                onChange({
                  ...filters,
                  kinds: id === "all" ? [] : [id],
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
        <ConditionFields
          filters={filters}
          onChange={onChange}
          scope={detailed ? "full" : "basic"}
        />
        <button type="button" className="ghost" onClick={() => setDetailed((value) => !value)}>
          {detailed ? "条件を閉じる" : "肌質や色味など、条件をもっと選ぶ"}
        </button>
      </div>
      <div className="setup-foot">
        <p className="count-line">
          この条件で <strong>{matchCount}件</strong>
        </p>
        <button type="button" className="primary" disabled={filters.budget < 500} onClick={onStart}>
          マッチをはじめる
        </button>
      </div>
    </section>
  );
}
