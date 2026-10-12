import { useMemo, useState } from "react";
import { originChoices, resolveAccess } from "./regions.js";
import { formatYen } from "./planner.js";
import { sceneOf } from "./scenes.js";

const TAGS = [
  ["onsen", "温泉"],
  ["sea", "海"],
  ["nature", "自然"],
  ["history", "歴史"],
  ["town", "街"],
  ["food", "食事"],
  ["solo", "一人"],
  ["anime", "聖地"],
  ["quiet", "静か"],
  ["budget", "安め"],
];

const TAG_WORD = Object.fromEntries(TAGS);

function estimate(dest, brief) {
  const access = resolveAccess(dest, brief.origin);
  if (!access) return null;
  const nights = brief.nights || 0;
  const days = nights + 1;
  const lodging = (dest.stay?.perNight || 0) * nights + (brief.weekendLodging ? dest.stay?.weekendExtra || 0 : 0);
  const base = lodging + (dest.foodPerDay || 0) * days + (dest.local || 0) + (dest.tickets || 0);
  const budget = brief.budget || 0;
  const saver = access.saver;
  const useSaver = Boolean(saver) && budget > 0 && access.roundTrip + base > budget && saver.roundTrip < access.roundTrip;
  const chosen = useSaver ? saver : access;
  return {
    total: chosen.roundTrip + base,
    minutes: chosen.minutes,
    how: chosen.how,
  };
}

export default function SearchBoard({ destinations, brief, been, want = [], selectedId, modes, mode, modeLead, name, onMode, onPick, onBeen, onWant, onAsk, onApply }) {
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState([]);
  const [stairs, setStairs] = useState(false);
  const [crowd, setCrowd] = useState(false);
  const [inBudget, setInBudget] = useState(false);
  const [hideBeen, setHideBeen] = useState(false);
  const [prefectures, setPrefectures] = useState(false);
  const [sort, setSort] = useState("near");
  const [compare, setCompare] = useState([]);
  const [askText, setAskText] = useState("");
  const [budget, setBudget] = useState(brief.budget || 0);
  const [origin, setOrigin] = useState(brief.originAssumed ? "" : brief.origin);
  const [nights, setNights] = useState(brief.nightsAssumed ? null : brief.nights);
  const [applied, setApplied] = useState(null);
  const [gaps, setGaps] = useState([]);

  const rows = useMemo(() => {
    if (!applied) return [];
    const needle = applied.query.trim();
    const view = {
      ...brief,
      budget: applied.budget,
      origin: applied.origin,
      nights: applied.nights,
      originAssumed: false,
      nightsAssumed: false,
    };
    return destinations
      .map((dest) => ({ dest, cost: estimate(dest, view) }))
      .filter(({ dest, cost }) => {
        if (!applied.prefectures && dest.generated) return false;
        if (applied.hideBeen && been.includes(dest.id)) return false;
        if (applied.tags.length && !applied.tags.every((tag) => dest.tags?.includes(tag))) return false;
        if (applied.stairs && (dest.hardship?.stairs ?? 0) >= 3) return false;
        if (applied.crowd && (dest.hardship?.crowd ?? 0) >= 3) return false;
        if (applied.inBudget && view.budget && cost && cost.total > view.budget) return false;
        if (!needle) return true;
        const blob = `${dest.name}${dest.region}${dest.blurb}${(dest.tags || []).map((tag) => TAG_WORD[tag] || "").join("")}`;
        return blob.includes(needle);
      })
      .sort((a, b) => {
        if (applied.sort === "name") return a.dest.name.localeCompare(b.dest.name, "ja");
        if (applied.sort === "cheap") return (a.cost?.total ?? 9e9) - (b.cost?.total ?? 9e9);
        return (a.cost?.minutes ?? 9e9) - (b.cost?.minutes ?? 9e9) || a.dest.name.localeCompare(b.dest.name, "ja");
      });
  }, [applied, destinations, brief, been]);

  function toggleTag(tag) {
    setTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  function toggleCompare(id) {
    setCompare((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  function reset() {
    setQuery("");
    setTags([]);
    setStairs(false);
    setCrowd(false);
    setInBudget(false);
    setHideBeen(false);
    setPrefectures(false);
    setSort("near");
    setCompare([]);
    setBudget(0);
    setOrigin("");
    setNights(null);
    setApplied(null);
    setGaps([]);
  }

  function runSearch(event) {
    event.preventDefault();
    const nextGaps = [];
    if (!budget) nextGaps.push("budget");
    if (!origin) nextGaps.push("origin");
    if (nights == null) nextGaps.push("nights");
    setGaps(nextGaps);
    if (nextGaps.length) {
      setApplied(null);
      return;
    }
    onApply({ budget, origin, nights });
    setApplied({ query, tags: [...tags], stairs, crowd, inBudget, hideBeen, prefectures, sort, budget, origin, nights });
  }

  const compared = compare
    .map((id) => rows.find((row) => row.dest.id === id) || destinations.map((dest) => ({ dest, cost: estimate(dest, brief) })).find((row) => row.dest.id === id))
    .filter(Boolean);

  const activeCount = tags.length + Number(stairs) + Number(crowd) + Number(inBudget) + Number(hideBeen) + Number(prefectures) + Number(Boolean(query.trim()));

  return (
    <div className="search-board">
      <header className="search-top">
        <div>
          <h2>{name ? `${name}さん` : "条件から探す"}</h2>
          <p>{applied ? `${rows.length}件の行き先${activeCount ? ` · 条件 ${activeCount}` : ""}` : ""}</p>
        </div>
        <button type="button" className="text-btn" onClick={reset}>条件をクリア</button>
      </header>

      <form
        className="ask"
        onSubmit={(event) => {
          event.preventDefault();
          if (!askText.trim()) return;
          onAsk(askText);
          setAskText("");
        }}
      >
        <label htmlFor="ask">自由に聞く</label>
        <textarea
          id="ask"
          value={askText}
          placeholder="海でのんびり。3万円。午後から。"
          spellCheck="false"
          onChange={(event) => setAskText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className="examples">
          {["海でのんびり", "坂を避けて温泉", "大阪から2泊"].map((sample) => (
            <button key={sample} type="button" className="chip" onClick={() => onAsk(sample)}>
              {sample}
            </button>
          ))}
        </div>
        <button className="submit" type="submit">この条件で作る</button>
      </form>

      <form className="filters" aria-label="条件検索" onSubmit={runSearch}>
        <input
          className="find search-field"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="箱根、京都、温泉"
          aria-label="行き先を検索"
        />

        <div className="filter-row">
          <span>型</span>
          {modes.map((item) => (
            <button key={item.id} type="button" className="chip" aria-pressed={mode === item.id} onClick={() => onMode(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="hint">{modeLead}</p>
        <div className={gaps.includes("budget") ? "filter-row is-missing" : "filter-row"}>
          <span>予算<em className="req">必須</em></span>
          {[10000, 20000, 30000, 50000, 80000].map((yen) => (
            <button key={yen} type="button" className="chip" aria-pressed={budget === yen} onClick={() => setBudget(yen)}>
              {yen / 10000}万
            </button>
          ))}
          {gaps.includes("budget") && <strong className="need">書いてください</strong>}
        </div>
        <div className={gaps.includes("origin") ? "filter-row is-missing" : "filter-row"}>
          <span>出発<em className="req">必須</em></span>
          {["東京", "大阪", "名古屋", "京都"].map((item) => (
            <button key={item} type="button" className="chip" aria-pressed={origin === item} onClick={() => setOrigin(item)}>
              {item}
            </button>
          ))}
          <select
            className="origin-select filter-select"
            aria-label="都道府県"
            value={origin}
            onChange={(event) => setOrigin(event.target.value)}
          >
            <option value="">都道府県</option>
            {originChoices().map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          {gaps.includes("origin") && <strong className="need">書いてください</strong>}
        </div>
        <div className={gaps.includes("nights") ? "filter-row is-missing" : "filter-row"}>
          <span>泊数<em className="req">必須</em></span>
          {[[0, "日帰り"], [1, "1泊"], [2, "2泊"]].map(([count, label]) => (
            <button key={label} type="button" className="chip" aria-pressed={nights === count} onClick={() => setNights(count)}>
              {label}
            </button>
          ))}
          {gaps.includes("nights") && <strong className="need">書いてください</strong>}
        </div>
        <div className="filter-row">
          <span>好み</span>
          {TAGS.map(([id, label]) => (
            <button key={id} type="button" className="chip" aria-pressed={tags.includes(id)} onClick={() => toggleTag(id)}>
              {label}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <span>絞る</span>
          <button type="button" className="chip" aria-pressed={inBudget} onClick={() => setInBudget((value) => !value)}>予算内</button>
          <button type="button" className="chip" aria-pressed={stairs} onClick={() => setStairs((value) => !value)}>階段少なめ</button>
          <button type="button" className="chip" aria-pressed={crowd} onClick={() => setCrowd((value) => !value)}>混雑少なめ</button>
          <button type="button" className="chip" aria-pressed={hideBeen} onClick={() => setHideBeen((value) => !value)}>行った場所を除く</button>
          <button type="button" className="chip" aria-pressed={prefectures} onClick={() => setPrefectures((value) => !value)}>都道府県も</button>
        </div>
        <div className="filter-row">
          <span>順</span>
          <button type="button" className="chip" aria-pressed={sort === "near"} onClick={() => setSort("near")}>近い順</button>
          <button type="button" className="chip" aria-pressed={sort === "cheap"} onClick={() => setSort("cheap")}>安い順</button>
          <button type="button" className="chip" aria-pressed={sort === "name"} onClick={() => setSort("name")}>名前順</button>
        </div>
        {gaps.length > 0 && <p className="need">必須のところに書いてください</p>}
        <button className="submit" type="submit">検索</button>
      </form>

      {compared.length > 1 && (
        <section className="compare-board" aria-label="比べる">
          <h3>比べる</h3>
          <table>
            <thead>
              <tr>
                <th />
                {compared.map(({ dest }) => <th key={dest.id}>{dest.name}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>片道</th>
                {compared.map(({ dest, cost }) => <td key={dest.id}>{cost ? `${cost.minutes}分` : "—"}</td>)}
              </tr>
              <tr>
                <th>ひとり</th>
                {compared.map(({ dest, cost }) => <td key={dest.id}>{cost ? formatYen(cost.total) : "—"}</td>)}
              </tr>
              <tr>
                <th>坂</th>
                {compared.map(({ dest }) => <td key={dest.id}>{dest.hardship?.stairs ?? "—"}</td>)}
              </tr>
              <tr>
                <th>混雑</th>
                {compared.map(({ dest }) => <td key={dest.id}>{dest.hardship?.crowd ?? "—"}</td>)}
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {applied && rows.length === 0 ? (
        <p className="empty-search">この条件の行き先はありません。条件を一つ外すと出てきます。</p>
      ) : applied ? (
        <ul className="profile-grid">
          {rows.map(({ dest, cost }) => {
            const visited = been.includes(dest.id);
            const picked = selectedId === dest.id;
            const marks = (dest.tags || []).slice(0, 3).map((tag) => TAG_WORD[tag]).filter(Boolean);
            const fit = cost && applied?.budget
              ? (cost.total <= applied.budget ? `予算内 · 残り ${formatYen(applied.budget - cost.total)}` : `${formatYen(cost.total - applied.budget)} オーバー`)
              : "";
            return (
              <li key={dest.id}>
                <article className={picked ? "profile is-current" : "profile"}>
                  <button type="button" className="profile-open" onClick={() => onPick(dest.id)}>
                    <span className="cover" style={{ backgroundImage: `linear-gradient(180deg, rgba(16,32,28,0.05) 30%, rgba(16,32,28,0.72)), url("${sceneOf(dest)}")` }}>
                      <span className="cover-name">
                        <strong>{dest.name}</strong>
                        <small>{cost ? `片道 ${cost.minutes}分 · ${formatYen(cost.total)}` : dest.region}</small>
                      </span>
                      <em>{dest.region}</em>
                    </span>
                    <span className="profile-body">
                      <span className="profile-blurb">{dest.blurb}</span>
                      {fit && <span className={cost.total <= brief.budget ? "fit" : "fit over"}>{fit}</span>}
                      {marks.length > 0 && (
                        <span className="profile-tags">{marks.join(" · ")}</span>
                      )}
                    </span>
                  </button>
                  <div className="profile-actions">
                    <button type="button" className="chip" aria-pressed={compare.includes(dest.id)} onClick={() => toggleCompare(dest.id)}>
                      比べる
                    </button>
                    <button type="button" className="chip" aria-pressed={want.includes(dest.id)} onClick={() => onWant(dest.id)}>
                      行きたい
                    </button>
                    <button type="button" className="chip" aria-pressed={visited} onClick={() => onBeen(dest.id)}>
                      行った
                    </button>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
