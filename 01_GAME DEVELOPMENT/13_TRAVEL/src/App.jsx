import { useEffect, useMemo, useRef, useState } from "react";
import { DESTINATIONS as CURATED } from "./destinations.js";
import { originChoices, resolveAccess, withRegions } from "./regions.js";

const DESTINATIONS = withRegions(CURATED);
import { adjustPlan, briefForDestination, formatYen, parseBrief, planTrip, readTendency, reviseText, setBudgetLine, setOriginLine, setPrefLine, setStayLine, withDeparture, withoutDeparture } from "./planner.js";
import Calendar from "./Calendar.jsx";
import PlanSheet from "./PlanSheet.jsx";
import SearchBoard from "./SearchBoard.jsx";
import LoginScreen from "./LoginScreen.jsx";
import MyPage from "./MyPage.jsx";
import { currentAccount, loadScoped, logoutAccount, saveScoped, updateAccount } from "./account.js";

const STORAGE_KEY = "tabi-hisho-plans-v1";
const BEEN_KEY = "tabi-hisho-been-v1";
const WANT_KEY = "tabi-hisho-want-v1";

const MODES = [
  {
    id: "plan",
    index: "01",
    label: "行程を作る",
    lead: "予算、出発地、泊数を書くと、行程と費用が出ます。",
    action: "行程を作る",
  },
  {
    id: "gacha",
    index: "02",
    label: "おまかせ",
    lead: "予算と出発地を書くと、行き先を一つ選びます。",
    action: "行き先を決める",
  },
  {
    id: "safe",
    index: "03",
    label: "混雑を避ける",
    lead: "混雑、階段、駐車場で困りやすい点を先に入れて作ります。",
    action: "この条件で作る",
  },
  {
    id: "solo",
    index: "04",
    label: "一人旅",
    lead: "一人の宿、食事、静かな時間で作ります。",
    action: "一人旅で作る",
  },
  {
    id: "pilgrimage",
    index: "05",
    label: "聖地",
    lead: "作品名を書くと、その場所の回り方を作ります。",
    action: "巡礼の行程を作る",
  },
];

const PRESETS = {
  plan: "予算 3万円\n東京発\n温泉好き\n1泊2日",
  gacha: "今週末暇\n予算 1万円",
  safe: "予算 3万円\n東京発\n箱根\n階段と駐車場が心配\n1泊2日",
  solo: "予算 4万円\n大阪発\n一人\n静かな温泉\n1泊2日",
  pilgrimage: "予算 2万円\n東京発\nラブライブ\n日帰り",
};

const EXAMPLES = {
  plan: [
    { label: "温泉に1泊", text: PRESETS.plan },
    { label: "富士を見る", text: "予算 3万円\n東京発\n富士\n1泊2日" },
    { label: "金沢で食べる", text: "予算 6万円\n東京発\nご飯が目的\n金沢\n1泊2日" },
  ],
  gacha: [
    { label: "週末1万円", text: PRESETS.gacha },
    { label: "大阪から温泉", text: "今週末暇\n大阪発\n予算 3万円\n温泉" },
  ],
  safe: [
    { label: "箱根の注意点", text: PRESETS.safe },
    { label: "江の島の階段", text: "予算 1万円\n東京発\n江の島\n日帰り\n階段が多いと困る" },
  ],
  solo: [
    { label: "静かな湯", text: PRESETS.solo },
    { label: "ひとりで高山", text: "予算 4万円\n名古屋発\n一人\n静かな街\n高山\n1泊2日" },
  ],
  pilgrimage: [
    { label: "ラブライブ", text: PRESETS.pilgrimage },
    { label: "あの花", text: "予算 1万5千円\n東京発\nあの花\n日帰り" },
    { label: "けいおん", text: "予算 1万円\n名古屋発\nけいおん\n日帰り" },
  ],
};

function briefFromLocation() {
  const hash = window.location.hash;
  if (!hash.startsWith("#plan=")) return "";
  try {
    return decodeURIComponent(hash.slice(6));
  } catch {
    return "";
  }
}

function asIds(value) {
  return Array.isArray(value) ? value.filter((id) => typeof id === "string") : [];
}

function asPlans(value) {
  return Array.isArray(value) ? value.slice(0, 12) : [];
}

export default function App() {
  const [mode, setMode] = useState("plan");
  const [text, setText] = useState(briefFromLocation);
  const [result, setResult] = useState(null);
  const [spinning, setSpinning] = useState(false);
  const [composeKey, setComposeKey] = useState(0);
  const [steps, setSteps] = useState([]);
  const [shown, setShown] = useState(0);
  const [user, setUser] = useState(() => currentAccount());
  const [saved, setSaved] = useState(() => asPlans(loadScoped(STORAGE_KEY, currentAccount()?.id, [])));
  const [been, setBeen] = useState(() => asIds(loadScoped(BEEN_KEY, currentAccount()?.id, [])));
  const [want, setWant] = useState(() => asIds(loadScoped(WANT_KEY, currentAccount()?.id, [])));
  const [desk, setDesk] = useState("search");
  const [bookFilter, setBookFilter] = useState("all");
  const pendingRef = useRef(null);
  const active = MODES.find((item) => item.id === mode);
  const brief = useMemo(() => parseBrief(text, mode), [text, mode]);
  const tendency = useMemo(() => readTendency(been), [been]);
  const dirty = !result || result.brief.text !== text || result.brief.mode !== mode;

  useEffect(() => {
    const initial = briefFromLocation();
    if (initial && parseBrief(initial, "plan").budget) {
      setDesk("plan");
      openPlan(initial, "plan");
    }
    // 共有リンクを開いたときだけ、一度だけ行程を作る。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = text.trim() ? `#plan=${encodeURIComponent(text)}` : "";
    if (window.location.hash === next) return;
    const base = `${window.location.pathname}${window.location.search}`;
    window.history.replaceState(null, "", next ? `${base}${next}` : base);
  }, [text]);

  useEffect(() => {
    if (!spinning) return undefined;
    const lines = pendingRef.current?.lines || [];
    let finish = 0;
    if (!lines.length) {
      setResult(pendingRef.current?.result || null);
      setSpinning(false);
      return undefined;
    }
    setShown(1);
    let count = 1;
    const timer = window.setInterval(() => {
      count += 1;
      setShown(Math.min(count, lines.length));
      if (count >= lines.length) {
        window.clearInterval(timer);
        finish = window.setTimeout(() => {
          setResult(pendingRef.current?.result || null);
          setSpinning(false);
        }, 280);
      }
    }, 420);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(finish);
    };
  }, [spinning, composeKey]);

  function submit(nextText = text, nextMode = mode, visits = been) {
    setSpinning(false);
    setResult(planTrip(nextText, nextMode, new Date(), { visits }));
  }

  function openPlan(nextText = text, nextMode = mode, visits = been) {
    const next = planTrip(nextText, nextMode, new Date(), { visits });
    setDesk("plan");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !next.ok) {
      setResult(next);
      setSpinning(false);
      return;
    }
    const lines = planSteps(next);
    pendingRef.current = { result: next, lines };
    setSteps(lines);
    setShown(0);
    setComposeKey((value) => value + 1);
    setSpinning(true);
  }

  function ask(sentence) {
    const trimmed = sentence.trim();
    if (!trimmed) return;
    const current = parseBrief(text, mode);
    const spoken = parseBrief(trimmed, "plan");
    let next = trimmed;
    if (!spoken.budget) next = setBudgetLine(next, current.budget || 30000);
    if (spoken.originAssumed) {
      next = setOriginLine(next, current.originAssumed ? (user?.origin || "東京") : current.origin);
    }
    next = reviseText(next, trimmed, parseBrief(next, "plan"));
    const nextMode = mode === "gacha" ? "plan" : mode;
    setMode(nextMode);
    setText(next);
    openPlan(next, nextMode);
  }

  function applyConditions({ budget, origin, nights }) {
    let next = setStayLine(setOriginLine(setBudgetLine(text, budget), origin), nights);
    setText(next);
    submit(next, mode);
  }

  function chooseBudget(yen) {
    const nextText = setBudgetLine(text, yen);
    setText(nextText);
    submit(nextText, mode);
  }

  function chooseOrigin(origin) {
    const nextText = setOriginLine(text, origin);
    setText(nextText);
    if (parseBrief(nextText, mode).budget) submit(nextText, mode);
  }

  function chooseStay(nights) {
    const nextText = setStayLine(text, nights);
    setText(nextText);
    if (parseBrief(nextText, mode).budget) submit(nextText, mode);
  }

  function toggleBeen(id) {
    const next = been.includes(id) ? been.filter((item) => item !== id) : [...been, id];
    setBeen(next);
    saveScoped(BEEN_KEY, user?.id, next);
    if (parseBrief(text, mode).budget) submit(text, mode, next);
  }

  function useTendency() {
    let nextText = text;
    if (!parseBrief(nextText, mode).budget) nextText = setBudgetLine(nextText, 30000);
    if (parseBrief(nextText, mode).originAssumed) nextText = setOriginLine(nextText, "東京");
    if (parseBrief(nextText, mode).nightsAssumed) nextText = setStayLine(nextText, 1);
    for (const label of tendency.labels) nextText = setPrefLine(nextText, label);
    setText(nextText);
    openPlan(nextText, mode);
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    setSpinning(false);
    if (nextMode === "gacha") {
      if (!parseBrief(text, nextMode).budget) {
        setDesk("plan");
        setResult(null);
        setSpinning(false);
        return;
      }
      openPlan(text, nextMode);
      return;
    }
    if (!parseBrief(text, nextMode).budget) {
      setResult(null);
      return;
    }
    submit(text, nextMode);
  }

  function remember() {
    if (!result?.ok) return;
    const item = {
      id: `${result.signature}:${Date.now()}`,
      signature: result.signature,
      text,
      mode,
      result,
      savedAt: new Date().toISOString(),
    };
    const next = [item, ...saved.filter((entry) => entry.signature !== item.signature)].slice(0, 12);
    setSaved(next);
    saveScoped(STORAGE_KEY, user?.id, next);
  }

  function forget(id) {
    const next = saved.filter((entry) => entry.id !== id);
    setSaved(next);
    saveScoped(STORAGE_KEY, user?.id, next);
  }

  function toggleWant(id) {
    const next = want.includes(id) ? want.filter((item) => item !== id) : [...want, id];
    setWant(next);
    saveScoped(WANT_KEY, user?.id, next);
  }

  function enter(account) {
    setUser(account);
    setBeen(asIds(loadScoped(BEEN_KEY, account.id, [])));
    setSaved(asPlans(loadScoped(STORAGE_KEY, account.id, [])));
    setWant(asIds(loadScoped(WANT_KEY, account.id, [])));
    setText((current) => (parseBrief(current, "plan").originAssumed ? setOriginLine(current, account.origin || "東京") : current));
    setDesk("search");
  }

  function leave() {
    logoutAccount();
    setUser(null);
    setResult(null);
    setSaved([]);
    setBeen([]);
    setWant([]);
    setDesk("search");
  }

  function changeHome(origin) {
    const next = updateAccount(user.id, { origin });
    if (next) setUser(next);
    chooseOrigin(origin);
  }

  function adjust(patch) {
    setResult((current) => adjustPlan(current, patch));
  }

  function revise(note) {
    if (!result?.brief?.budget) return;
    const nextText = reviseText(text, note, result.brief);
    setText(nextText);
    const nextMode = mode === "gacha" ? "plan" : mode;
    setMode(nextMode);
    openPlan(nextText, nextMode);
  }

  function chooseDate(date) {
    const nextText = withDeparture(text, date);
    setText(nextText);
    if (parseBrief(nextText, mode).budget) submit(nextText, mode);
  }

  function clearDate() {
    const nextText = withoutDeparture(text);
    setText(nextText);
    if (parseBrief(nextText, mode).budget) submit(nextText, mode);
    else setResult(null);
  }

  function adopt(destId, stay = false) {
    const dest = DESTINATIONS.find((item) => item.id === destId);
    if (!dest) return;
    const nextText = briefForDestination(dest, result?.brief || brief);
    const nextMode = mode === "gacha" ? "plan" : mode;
    if (!stay) setDesk("plan");
    setMode(nextMode);
    setText(nextText);
    openPlan(nextText, nextMode);
  }

  function restore(entry) {
    setMode(entry.mode);
    setText(entry.text);
    setSpinning(false);
    setResult(entry.result);
  }

  const alreadySaved = Boolean(result?.ok && saved.some((entry) => entry.signature === result.signature));

  if (!user) return <LoginScreen onEnter={enter} />;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand-row">
          <p className="seal" aria-hidden="true">行</p>
          <h1>旅の行程</h1>
        </div>
        <nav className="side-desk" aria-label="画面">
          <button type="button" aria-current={desk === "search" ? "true" : undefined} onClick={() => setDesk("search")}>
            <NavIcon kind="search" />さがす
          </button>
          <button type="button" aria-current={desk === "plan" ? "true" : undefined} onClick={() => setDesk("plan")}>
            <NavIcon kind="plan" />行程
          </button>
          <button type="button" aria-current={desk === "mine" ? "true" : undefined} onClick={() => setDesk("mine")}>
            <NavIcon kind="mine" />自分
          </button>
          <button type="button" aria-current={desk === "request" ? "true" : undefined} onClick={() => setDesk("request")}>
            <NavIcon kind="write" />入力
          </button>
        </nav>
        <button type="button" className="side-user" onClick={() => setDesk("mine")}>
          <span>{user.name.slice(0, 1)}</span>
          {user.name}
        </button>
      </aside>

      <div className="stage">
        {desk === "search" && (
          <SearchBoard
            destinations={DESTINATIONS}
            brief={brief}
            been={been}
            selectedId={result?.ok ? result.destId : brief.placeId}
            onBudget={chooseBudget}
            onOrigin={chooseOrigin}
            onStay={chooseStay}
            modes={MODES}
            mode={mode}
            modeLead={active.lead}
            name={user.name}
            onMode={selectMode}
            onPick={(id) => adopt(id)}
            onBeen={toggleBeen}
            want={want}
            onWant={toggleWant}
            onAsk={ask}
            onApply={applyConditions}
          />
        )}
        {desk === "mine" && (
          <MyPage
            user={user}
            destinations={CURATED}
            saved={saved}
            been={been}
            want={want}
            onOrigin={changeHome}
            onOpen={(entry) => { restore(entry); setDesk("plan"); }}
            onForget={forget}
            onPick={(id) => adopt(id)}
            onBeen={toggleBeen}
            onLogout={leave}
          />
        )}
        {desk === "plan" && (
          <div className="plan-stage">
            <button type="button" className="text-btn" onClick={() => setDesk("search")}>さがすに戻る</button>
            <PlanSheet
              mode={mode}
              result={spinning ? null : result}
              spinning={spinning}
              steps={steps}
              shown={shown}
              saved={alreadySaved}
              onSave={remember}
              onRedraw={() => openPlan()}
              onAdjust={adjust}
              onRevise={revise}
              onAdopt={adopt}
              beenIds={been}
              onBeen={toggleBeen}
              userId={user.id}
            />
          </div>
        )}
        {desk === "request" && (
      <main className="workspace">
        <section className="request" aria-label="入力">
          <>
          <div className="request-head">
            <h2>入力</h2>
            <p>予算、出発地、泊数を選ぶと、行程が出ます。</p>
          </div>
          <div className="quick">
            <div className="choice-row">
              <span>予算</span>
              {[10000, 20000, 30000, 50000].map((yen) => (
                <button key={yen} type="button" aria-pressed={brief.budget === yen} onClick={() => chooseBudget(yen)}>
                  {yen / 10000}万
                </button>
              ))}
            </div>
            <div className="choice-row">
              <span>出発</span>
              {["東京", "大阪", "名古屋", "京都"].map((origin) => (
                <button key={origin} type="button" aria-pressed={!brief.originAssumed && brief.origin === origin} onClick={() => chooseOrigin(origin)}>
                  {origin}
                </button>
              ))}
            </div>
            <label className="origin-label" htmlFor="origin">都道府県</label>
            <select
              id="origin"
              className="origin-select"
              value={brief.originAssumed ? "" : brief.origin}
              onChange={(event) => {
                if (event.target.value) chooseOrigin(event.target.value);
              }}
            >
              <option value="">出発地を選ぶ</option>
              {originChoices().map((origin) => (
                <option key={origin} value={origin}>{origin}</option>
              ))}
            </select>
            <div className="choice-row">
              <span>泊数</span>
              {[[0, "日帰り"], [1, "1泊"], [2, "2泊"]].map(([nights, label]) => (
                <button key={label} type="button" aria-pressed={!brief.nightsAssumed && brief.nights === nights} onClick={() => chooseStay(nights)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <section className="been" aria-label="行った場所">
            <h2>行った場所</h2>
            <p>{tendency.line}</p>
            <div className="examples">
              {CURATED.map((dest) => (
                <button key={dest.id} type="button" aria-pressed={been.includes(dest.id)} onClick={() => toggleBeen(dest.id)}>
                  {dest.name}
                </button>
              ))}
            </div>
            {tendency.labels.length > 0 && (
              <button type="button" className="tend" onClick={useTendency}>この傾向で作る</button>
            )}
          </section>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              openPlan();
            }}
          >
            <label htmlFor="brief">追加の条件</label>
            <textarea
              id="brief"
              value={text}
              placeholder={"予算 3万円\n東京発\n1泊2日"}
              spellCheck="false"
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                  event.preventDefault();
                  openPlan();
                }
              }}
            />
            <Readout brief={brief} />
            <Calendar
              start={brief.dates.start}
              nights={brief.nights}
              explicit={brief.dates.explicit}
              hint={brief.weekday
                ? "日付を押すと、その日を出発日にします。今は次の平日で組んでいます。"
                : "日付を押すと、その日を出発日にします。今は次の土曜から組んでいます。"}
              onPick={chooseDate}
              onClear={clearDate}
            />
            {dirty && result && !spinning && (
              <p className="dirty">入力を変えています。作成すると、右の行程が更新されます。</p>
            )}
            <button className={mode === "gacha" ? "submit gacha" : "submit"} type="submit" disabled={spinning}>
              {spinning ? "選んでいます" : active.action}
            </button>
            <p className="hint">Ctrl + Enter でも作成できます。</p>
          </form>
          <div className="examples">
            {EXAMPLES[mode].map((example) => (
              <button key={example.label} type="button" onClick={() => {
                setText(example.text);
                openPlan(example.text, mode);
              }}>
                {example.label}
              </button>
            ))}
          </div>
          <section className="saved" aria-label="保存した計画">
            <h2>保存した計画</h2>
            {saved.length === 0 ? (
              <p>まだありません。作った行程は、ここに保存できます。</p>
            ) : (
              <ul>
                {saved.map((entry) => (
                  <li key={entry.id}>
                    <button type="button" onClick={() => restore(entry)}>
                      <strong>{entry.result.name}</strong>
                      <span>{entry.result.dates.range}</span>
                    </button>
                    <button type="button" className="forget" onClick={() => forget(entry.id)} aria-label={`${entry.result.name}を削除`}>
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          </>
        </section>

        <PlanSheet
          mode={mode}
          result={spinning ? null : result}
          spinning={spinning}
          steps={steps}
          shown={shown}
          saved={alreadySaved}
          onSave={remember}
          onRedraw={() => openPlan()}
          onAdjust={adjust}
          onRevise={revise}
          onAdopt={adopt}
          beenIds={been}
          onBeen={toggleBeen}
          userId={user.id}
        />
      </main>
        )}
      </div>
    </div>
  );
}

function planSteps(result) {
  const blocks = (result.days || []).flatMap((day) => day.blocks || []);
  const lines = [result.name];
  const out = blocks.find((block) => block.title.endsWith("を出る"));
  if (out) lines.push(`${out.t}　${result.brief.origin}を出る`);
  if (result.cost?.minutes) lines.push(`片道 ${result.cost.minutes}分`);
  const see = blocks.find((block) => block.k === "see" && !block.title.includes("荷物"));
  if (see) lines.push(see.title);
  const eat = blocks.find((block) => block.k === "eat");
  if (eat) lines.push(eat.title);
  if (result.brief.nights > 0) lines.push(`${result.brief.nights}泊`);
  const home = [...(result.days || [])].reverse().find((day) => day.home);
  if (home?.home) lines.push(`${home.home.t}　${home.home.place}`);
  return lines.slice(0, 6);
}

function NavIcon({ kind }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {kind === "search" && (
        <>
          <circle cx="11" cy="11" r="6" {...common} />
          <path d="M16 16l4 4" {...common} />
        </>
      )}
      {kind === "plan" && <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3-6 3V5a1 1 0 0 1 1-1z" {...common} />}
      {kind === "mine" && (
        <>
          <circle cx="12" cy="8" r="3.2" {...common} />
          <path d="M5 19a7 7 0 0 1 14 0" {...common} />
        </>
      )}
      {kind === "write" && <path d="M5 19h14M8 16l8-8 2 2-8 8H8z" {...common} />}
    </svg>
  );
}

const BOOK_FILTERS = [
  ["all", "すべて"],
  ["onsen", "温泉"],
  ["solo", "一人"],
  ["anime", "聖地"],
  ["food", "食事"],
  ["reachable", "行ける場所"],
];

function Handbook({ brief, filter, onFilter, onPick }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("near");
  const needle = query.trim();
  const places = DESTINATIONS.filter((dest) => {
    if (filter === "reachable" && !resolveAccess(dest, brief.origin)) return false;
    if (filter !== "all" && filter !== "reachable" && !dest.tags.includes(filter)) return false;
    if (!needle) return true;
    const words = { onsen: "温泉", solo: "一人", anime: "聖地", food: "食事", nature: "自然", history: "歴史", town: "街", sea: "海" };
    const blob = `${dest.name}${dest.region}${dest.blurb}${dest.tags.map((tag) => words[tag] || "").join("")}`;
    return blob.includes(needle);
  }).sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "ja");
    const am = resolveAccess(a, brief.origin)?.minutes ?? 9999;
    const bm = resolveAccess(b, brief.origin)?.minutes ?? 9999;
    return am - bm || a.name.localeCompare(b.name, "ja");
  });
  return (
    <div className="book">
      <div className="request-head">
        <h2>行き先</h2>
        <p>{brief.origin ? `${brief.origin}発で行ける場所` : "行き先を選ぶ"}</p>
      </div>
      <label htmlFor="find">検索</label>
      <input id="find" className="find" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="箱根、京都、温泉" />
      <div className="examples">
        {BOOK_FILTERS.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={filter === id} onClick={() => onFilter(id)}>
            {label}
          </button>
        ))}
        <button type="button" aria-pressed={sort === "near"} onClick={() => setSort("near")}>近い順</button>
        <button type="button" aria-pressed={sort === "name"} onClick={() => setSort("name")}>名前順</button>
      </div>
      {places.length === 0 && <p className="hint">その名前の行き先はありません。</p>}
      <ul className="book-list">
        {places.map((dest) => {
          const hop = brief.origin ? resolveAccess(dest, brief.origin) : null;
          return (
            <li key={dest.id} className={`mini tone-${[...dest.name].reduce((total, char) => total + char.charCodeAt(0), 0) % 6}`}>
              <p className="mini-photo" aria-hidden="true">{dest.name.slice(0, 1)}</p>
              <div>
                <p className="kicker">{dest.region}</p>
                <h3>{dest.name}</h3>
                <p>{dest.blurb}</p>
                <p className="book-hop">
                  {hop ? `片道およそ${hop.minutes}分` : "出発地を選ぶと、所要時間が出ます"}
                </p>
                <button type="button" onClick={() => onPick(dest.id)}>この行き先で作る</button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Readout({ brief }) {
  const nights = brief.nights === 0 ? "日帰り" : `${brief.nights}泊${brief.nights + 1}日`;
  return (
    <div className="readout">
      <p>読み取った条件</p>
      <ul>
        <li className={brief.budget ? "" : "missing"}>{brief.budget ? `予算 ${formatYen(brief.budget)}` : "予算が未入力"}</li>
        <li>{brief.unknownOrigin ? `${brief.unknownOrigin}発は未対応` : `${brief.origin}発${brief.originAssumed ? "（仮）" : ""}`}</li>
        <li>{`${nights}${brief.nightsAssumed ? "（仮）" : ""}`}</li>
        {(brief.party || 1) > 1 && <li>{brief.party}人</li>}
        {brief.placeName && <li>{brief.placeName}</li>}
        {brief.workTitle && <li>{brief.workTitle}</li>}
        <li>{brief.prefLabels.length ? brief.prefLabels.join("・") : "希望は未入力"}</li>
        <li>{brief.dates.range}</li>
      </ul>
      {brief.assumptions.length > 0 && (
        <p className="assumptions">{brief.assumptions.join("")}</p>
      )}
    </div>
  );
}
