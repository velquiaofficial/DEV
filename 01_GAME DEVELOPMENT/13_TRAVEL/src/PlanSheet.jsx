import { useState } from "react";
import { formatYen, planToText } from "./planner.js";
import TripDesk from "./TripDesk.jsx";
import { itineraryShape } from "./tripkit.js";
import { sceneOf } from "./scenes.js";
import { placeLine } from "./places.js";

const KIND = {
  move: "移動",
  see: "観光地",
  eat: "食事",
  stay: "宿",
  rest: "自由時間",
};

export default function PlanSheet({ mode, result, spinning, steps = [], shown = 0, saved, beenIds, onBeen, onSave, onRedraw, onAdjust, onRevise, onAdopt, userId }) {
  return (
    <article className="sheet" aria-live="polite" aria-busy={spinning}>
      {spinning ? (
        <div className="compose">
          {steps.slice(0, shown).map((line) => <p key={line}>{line}</p>)}
        </div>
      ) : !result ? (
        <div className="reel-stage idle">
          <h2>まだ行程がありません。</h2>
          <p>行き先を選ぶと、ここに出ます。</p>
        </div>
      ) : (
        <SheetBody
          mode={mode}
          result={result}
          saved={saved}
          onSave={onSave}
          onRedraw={onRedraw}
          onAdjust={onAdjust}
          onRevise={onRevise}
          onAdopt={onAdopt}
          beenIds={beenIds}
          onBeen={onBeen}
          userId={userId}
        />
      )}
    </article>
  );
}

function SheetBody({ mode, result, saved, beenIds = [], onBeen, onSave, onRedraw, onAdjust, onRevise, onAdopt, userId }) {
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);
  const showSolo = mode === "solo" || result.brief?.prefs?.includes("solo");
  const showWorks = mode === "pilgrimage" || Boolean(result.brief?.workId);

  async function copyPlan() {
    const body = planToText(result);
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      const area = document.createElement("textarea");
      area.value = body;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const doc = result.planDoc;

  return (
    <>
      <header
        className={result.ok ? "mast photo-mast" : "mast"}
        style={result.ok ? { backgroundImage: `linear-gradient(180deg, rgba(16,32,28,0.05) 20%, rgba(16,32,28,0.72)), url("${sceneOf({ id: result.destId })}")` } : undefined}
      >
        <p className="stamp">{result.ok ? "行程" : "未作成"}</p>
        <p className="eyebrow">{result.ok ? result.dates.range : "作成できませんでした"}</p>
        <h2>{result.ok ? result.name : "この条件では作れません"}</h2>
        {result.ok && result.verdict?.lines?.[0] && <p className="why">{result.verdict.lines[0]}</p>}
        <p className="blurb">{result.ok ? `${result.region}　${result.blurb}` : result.message}</p>
        {result.ok && <p className="shape">{itineraryShape(result)}</p>}
      </header>
      {doc && (
        <ul className="facts">
          {doc.facts.map((fact) => (
            <li key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </li>
          ))}
        </ul>
      )}

      {result.ok ? (
        <>
          <Choices result={result} onAdjust={onAdjust} />

          {result.alerts?.length > 0 && (
            <ul className="alerts">
              {result.alerts.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}

          {result.verdict && <Verdict verdict={result.verdict} />}

          <div className="letter">
            {result.letter.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>

          {doc && <Leg doc={doc} cost={result.cost} />}

          <Judgment result={result} onAdjust={onAdjust} />

          {result.season?.length > 0 && (
            <section className="season">
              <h3>季節</h3>
              {result.season.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </section>
          )}

          {mode === "safe" && <Cautions items={result.cautions} lead />}
          {showWorks && result.works.length > 0 && <Works works={result.works} />}
          {!showWorks && result.works.length > 0 && (
            <p className="aside">この行き先には、{result.works.map((work) => work.title).join("、")}のモデル地も含まれます。</p>
          )}
          {showSolo && <Solo solo={result.solo} />}

          <section className="days">
            <h3>スケジュール</h3>
            {result.days.map((day) => (
              <section key={day.label} className="day">
                <header>
                  <h4>{day.label}</h4>
                  <span>
                    {day.date}
                    {day.home ? `　${day.home.place}着 ${day.home.t}` : "　この日は宿泊"}
                    {day.pace ? `　${day.pace}` : ""}
                  </span>
                </header>
                {day.aim && <p className="day-aim">{day.aim}</p>}
                <ol className="timeline">
                  {day.blocks.map((block, index) => (
                    <li key={`${block.t}-${index}`} className={`kind-${block.k}`}>
                      <time dateTime={block.t}>{block.t}</time>
                      <div className="stop">
                        <span className="thumb" aria-hidden="true">{block.title.slice(0, 1)}</span>
                        <div>
                        <p className="kicker">{KIND[block.k]}</p>
                        <h5>{block.title}</h5>
                        <p>{block.detail}</p>
                        {placeLine(block, result.places) && <p className="place-name">{placeLine(block, result.places)}</p>}
                        {block.k === "see" && !block.title.includes("荷物") && (
                          <button type="button" className="drop" onClick={() => onAdjust({ omitTitle: block.title })}>
                            外す
                          </button>
                        )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </section>

          {mode !== "safe" && <Cautions items={result.cautions} />}

          <div className="split">
            <section>
              <h3>食事</h3>
              <ul className="menu">
                {result.meals.map((meal) => (
                  <li key={meal.name}>
                    <span>{meal.when}</span>
                    <strong>{meal.name}</strong>
                    <p>{meal.note}</p>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h3>観光地</h3>
              <ul className="menu">
                {result.spots.map((spot) => (
                  <li key={spot.name}>
                    <strong>{spot.name}</strong>
                    <p>{spot.note}</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <Cost result={result} />

          <TripDesk result={result} userId={userId} />

          {result.alternatives.length > 0 && (
            <section className="alts">
              <h3>ほかの候補</h3>
              <ul>
                {result.alternatives.map((alt) => (
                  <li key={alt.id || alt.name}>
                    <div>
                      <strong>{alt.name}</strong>
                      <span>{alt.region}</span>
                    </div>
                    <p>{alt.tradeoff}</p>
                    {alt.note && <p className="warn">{alt.note}</p>}
                    {alt.total != null && <p className="alt-cost">ひとり {formatYen(alt.total)}</p>}
                    {alt.id && (
                      <button type="button" onClick={() => onAdopt(alt.id)}>この行き先にする</button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <form
            className="revise"
            onSubmit={(event) => {
              event.preventDefault();
              if (!note.trim()) return;
              onRevise(note);
              setNote("");
            }}
          >
            <h3>条件を変える</h3>
            <div className="revise-row">
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="もっと安く、平日、京都、階段は避けて"
                aria-label="変えたい条件"
              />
              <button type="submit">変更</button>
            </div>
            <div className="examples">
              {["もっと安く", "平日にする", "2泊にする", "日帰りにする"].map((chip) => (
                <button key={chip} type="button" onClick={() => onRevise(chip)}>{chip}</button>
              ))}
            </div>
          </form>

          <div className="sheet-actions">
            {result.ok && (
              <button type="button" aria-pressed={beenIds.includes(result.destId)} onClick={() => onBeen(result.destId)}>
                {beenIds.includes(result.destId) ? "行った記録から外す" : "行った場所に入れる"}
              </button>
            )}
            <button type="button" onClick={onSave} disabled={saved} aria-pressed={saved}>
              {saved ? "保存済み" : "この計画を保存"}
            </button>
            <button type="button" onClick={copyPlan}>{copied ? "コピーしました" : "文章をコピー"}</button>
            <button type="button" onClick={() => window.print()}>印刷する</button>
            {mode === "gacha" && (
              <button type="button" className="ghost" onClick={onRedraw}>
                もう一度選ぶ
              </button>
            )}
          </div>
          <p className="footnote">
            金額と所要時間は、ひとり分の目安です。宿の空室と列車の時刻は、出発前に確認してください。
          </p>
        </>
      ) : (
        <p className="footnote">出発地は都道府県名で書けます。作品はラブライブ、あの花、けいおん、らき☆すた、スラムダンク、時をかける少女に対応しています。</p>
      )}
    </>
  );
}

function Leg({ doc, cost }) {
  return (
    <section className="leg">
      <h3>交通</h3>
      <p className="kicker">{doc.routeLabel}</p>
      <p>{doc.leg.how}。片道およそ{doc.leg.minutes}分。往復 {formatYen(doc.leg.fare)}。</p>
      <p>{doc.leg.back}</p>
      {cost.usedSaver && cost.upgradeHow && (
        <p className="warn">速い列車は {cost.upgradeHow}。およそ {formatYen(cost.upgradeExtra)} 増えます。</p>
      )}
    </section>
  );
}

function Verdict({ verdict }) {
  return (
    <section className="verdict">
      <h3>選んだ理由</h3>
      <ul className="facts">
        {verdict.marks.map((mark) => (
          <li key={mark.label}>
            <span>{mark.label}</span>
            <strong>{mark.value}</strong>
          </li>
        ))}
      </ul>
      {verdict.lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </section>
  );
}

function Judgment({ result, onAdjust }) {
  const refused = result.refused ?? [];
  const cuts = result.cuts ?? [];
  if (!result.call && cuts.length === 0 && refused.length === 0) return null;
  return (
    <section className="judgment">
      <h3>まとめ</h3>
      {result.call && <p className="call">{result.call}</p>}
      {cuts.length > 0 && (
        <ul>
          {cuts.map((cut) => (
            <li key={`${cut.t}-${cut.title}`}>
              <strong>外した予定</strong>
              <p>{cut.title}。{cut.reason}</p>
              {result.brief.omitTitles?.includes(cut.title) && (
                <button type="button" onClick={() => onAdjust({ omitTitle: cut.title })}>戻す</button>
              )}
            </li>
          ))}
        </ul>
      )}
      {refused.length > 0 && (
        <ul>
          {refused.map((item) => (
            <li key={item.title}>
              <strong>行かない場所</strong>
              <p>{item.title}。{item.reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Cautions({ items, lead = false }) {
  return (
    <section className={lead ? "cautions lead" : "cautions"}>
      <h3>注意点</h3>
      <ul>
        {items.map((item) => (
          <li key={item.tag}>
            <strong>{item.tag}</strong>
            <p>{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Works({ works }) {
  return (
    <section className="works">
      <h3>巡礼場所</h3>
      {works.map((work) => (
        <div key={work.title}>
          <p className="kicker">{work.title}</p>
          <ul>
            {work.places.map((place) => (
              <li key={place}>{place}</li>
            ))}
          </ul>
          <p>{work.note}</p>
        </div>
      ))}
    </section>
  );
}

function Solo({ solo }) {
  return (
    <section className="solo">
      <h3>一人旅の場合</h3>
      <div className="solo-grid">
        <section>
          <h4>宿</h4>
          <p>{solo.stay}</p>
        </section>
        <section>
          <h4>食事</h4>
          <p>{solo.food}</p>
        </section>
        <section>
          <h4>静かな時間</h4>
          <p>{solo.quiet}</p>
        </section>
      </div>
    </section>
  );
}

function Choices({ result, onAdjust }) {
  const party = result.brief.party || 1;
  const { cost } = result;
  return (
    <div className="choices">
      <div className="choice-row">
        <span>人数</span>
        {[1, 2, 3, 4].map((count) => (
          <button
            key={count}
            type="button"
            aria-pressed={party === count}
            onClick={() => onAdjust({ party: count })}
          >
            {count}人
          </button>
        ))}
      </div>
      <div className="choice-row">
        <span>経路</span>
        <button type="button" aria-pressed={!cost.usedSaver} onClick={() => onAdjust({ express: true })}>
          速い列車
        </button>
        <button
          type="button"
          aria-pressed={cost.usedSaver}
          disabled={!cost.canSave}
          onClick={() => onAdjust({ express: false })}
        >
          遅い経路
        </button>
      </div>
      <div className="choice-row">
        <span>出発</span>
        {[
          [null, "そのまま"],
          ["06:00", "6時"],
          ["08:00", "8時"],
          ["10:00", "10時"],
        ].map(([value, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={(result.brief.departAt || null) === value}
            onClick={() => onAdjust({ departAt: value })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="choice-row">
        <span>帰宅</span>
        {[
          [null, "そのまま"],
          ["15:00", "15時"],
          ["18:00", "18時"],
          ["21:00", "21時"],
        ].map(([value, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={(result.brief.homeBy || null) === value}
            onClick={() => onAdjust({ homeBy: value })}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="choice-row">
        <span>条件</span>
        <button
          type="button"
          aria-pressed={Boolean(result.brief.avoidStairs)}
          onClick={() => onAdjust({ avoidStairs: !result.brief.avoidStairs })}
        >
          坂を避ける
        </button>
        <button
          type="button"
          aria-pressed={Boolean(result.brief.avoidCrowd)}
          onClick={() => onAdjust({ avoidCrowd: !result.brief.avoidCrowd })}
        >
          混雑を避ける
        </button>
        <button
          type="button"
          aria-pressed={Boolean(result.brief.oneSight)}
          onClick={() => onAdjust({ oneSight: !result.brief.oneSight })}
        >
          観光は1か所
        </button>
      </div>
      {party > 1 && <p className="stay-label">{party}人の合計はおよそ {formatYen(cost.groupTotal)} です。行程の内容は同じです。</p>}
    </div>
  );
}

function Cost({ result }) {
  const { cost, brief, stayLabel } = result;
  const over = cost.total > brief.budget;
  const width = Math.min(100, Math.round((cost.total / brief.budget) * 100));
  const rows = [
    ["往復交通", cost.transport],
    ...(brief.nights > 0 ? [["宿", cost.lodging]] : []),
    ["食事", cost.food],
    ["現地交通", cost.local],
    ["入場料", cost.tickets],
  ];
  return (
    <section className="cost">
      <h3>費用</h3>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${width}%` }} data-over={over ? "true" : "false"} />
      </div>
      <p className="meter-label">
        予算 {formatYen(brief.budget)}
        {over ? `　／　${formatYen(cost.total - brief.budget)}超過` : `　／　残り ${formatYen(brief.budget - cost.total)}`}
      </p>
      <dl>
        {rows.map(([label, amount]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{formatYen(amount)}</dd>
          </div>
        ))}
        <div className="sum">
          <dt>ひとり</dt>
          <dd>{formatYen(cost.total)}</dd>
        </div>
        {(brief.party || 1) > 1 && (
          <div className="sum">
            <dt>{brief.party}人</dt>
            <dd>{formatYen(cost.groupTotal)}</dd>
          </div>
        )}
      </dl>
      {brief.nights > 0 && <p className="stay-label">宿の目安：{stayLabel}</p>}
      {cost.usedSaver && (
        <p className="warn">速い経路にすると {formatYen(cost.upgradeExtra)} 増えます。{cost.upgradeHow}。</p>
      )}
    </section>
  );
}
