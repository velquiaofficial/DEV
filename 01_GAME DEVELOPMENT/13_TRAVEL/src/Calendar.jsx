import { useEffect, useState } from "react";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

function parseIso(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isoOf(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function addDays(date, count) {
  const next = new Date(date);
  next.setDate(date.getDate() + count);
  return next;
}

export default function Calendar({ start, nights, explicit, hint, onPick, onClear }) {
  const today = new Date();
  const todayIso = isoOf(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
  const startDate = start ? parseIso(start) : null;
  const [view, setView] = useState(() => new Date((startDate || today).getFullYear(), (startDate || today).getMonth(), 1));

  useEffect(() => {
    if (!startDate) return;
    setView(new Date(startDate.getFullYear(), startDate.getMonth(), 1));
  }, [start]);

  const min = new Date(today.getFullYear(), today.getMonth(), 1);
  const max = new Date(today.getFullYear(), today.getMonth() + 14, 1);
  const endIso = startDate ? isoOf(addDays(startDate, nights)) : null;
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const blanks = first.getDay();
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let index = 0; index < blanks; index += 1) cells.push(null);
  for (let day = 1; day <= days; day += 1) cells.push(new Date(view.getFullYear(), view.getMonth(), day));

  function shift(delta) {
    const next = new Date(view.getFullYear(), view.getMonth() + delta, 1);
    if (next < min || next > max) return;
    setView(next);
  }

  return (
    <div className="cal">
      <div className="cal-head">
        <button type="button" onClick={() => shift(-1)} disabled={new Date(view.getFullYear(), view.getMonth() - 1, 1) < min} aria-label="前の月">
          前へ
        </button>
        <p>{view.getFullYear()}年{view.getMonth() + 1}月</p>
        <button type="button" onClick={() => shift(1)} disabled={new Date(view.getFullYear(), view.getMonth() + 1, 1) > max} aria-label="次の月">
          次へ
        </button>
      </div>
      <div className="cal-week" aria-hidden="true">
        {WEEK.map((label) => <span key={label}>{label}</span>)}
      </div>
      <div className="cal-grid" aria-label="出発日">
        {cells.map((date, index) => {
          if (!date) return <span key={`blank-${index}`} />;
          const iso = isoOf(date);
          const past = iso < todayIso;
          const isStart = iso === start;
          const inTrip = start && endIso && iso >= start && iso <= endIso;
          const week = date.getDay();
          const label = `${date.getMonth() + 1}月${date.getDate()}日（${WEEK[week]}）`;
          return (
            <button
              key={iso}
              type="button"
              disabled={past}
              aria-pressed={isStart}
              aria-label={isStart ? `${label}、出発日` : label}
              className={[
                week === 0 ? "sun" : "",
                week === 6 ? "sat" : "",
                inTrip ? "is-trip" : "",
                isStart ? "is-start" : "",
              ].filter(Boolean).join(" ")}
              onClick={() => onPick(date)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      {explicit ? (
        <button type="button" className="cal-clear" onClick={onClear}>日付の指定をやめる</button>
      ) : (
        <p className="cal-note">{hint}</p>
      )}
    </div>
  );
}
