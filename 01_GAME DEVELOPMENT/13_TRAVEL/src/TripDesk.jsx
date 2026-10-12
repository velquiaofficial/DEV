import { useEffect, useState } from "react";
import { formatYen } from "./planner.js";
import {
  countdownLine,
  daysUntil,
  deskKey,
  downloadIcs,
  placeLat,
  readDesk,
  seasonBand,
  walkMinutes,
  writeDesk,
} from "./tripkit.js";

export default function TripDesk({ result, userId }) {
  const key = deskKey(result);
  const [desk, setDesk] = useState(() => readDesk(key, userId));
  const [extraName, setExtraName] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const band = seasonBand(placeLat(result.region), result.dates.month);
  const leftDays = daysUntil(result.dates.start);
  const walk = walkMinutes(result.days);
  const { cost, brief } = result;
  const spare = Number(desk.spare) || 0;
  const afterSpare = brief.budget - cost.total - spare;
  const cash = cost.food + cost.local;
  const ahead = cost.transport + cost.lodging + cost.tickets;

  useEffect(() => {
    setDesk(readDesk(key, userId));
  }, [key, userId]);

  function save(next) {
    setDesk(next);
    writeDesk(key, next, userId);
  }

  function toggle(group, name) {
    save({ ...desk, [group]: { ...desk[group], [name]: !desk[group][name] } });
  }

  async function copyLink() {
    const url = `${location.origin}${location.pathname}${location.search}#plan=${encodeURIComponent(brief.text)}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const area = document.createElement("textarea");
      area.value = url;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setLinkNote("リンクをコピーしました");
    window.setTimeout(() => setLinkNote(""), 1600);
  }

  const packing = [
    ...result.packing.map((item) => item.name),
    ...desk.extra,
  ];

  return (
    <div className="trip-desk">
      <section className="climate">
        <h3>出発まで</h3>
        <p className="why">{countdownLine(leftDays)}</p>
        <ul className="stat-row">
          <li><span>昼</span><strong>{band.high}℃</strong></li>
          <li><span>朝</span><strong>{band.low}℃</strong></li>
          <li><span>日没</span><strong>{band.sunset}</strong></li>
          <li><span>歩き</span><strong>{walk}分</strong></li>
        </ul>
        <p>{result.dates.month}月の{result.region}は、{band.rain}。</p>
        <p className="hint">気温と日没は、その県の緯度からの目安です。予報ではありません。</p>
      </section>

      <section className="split money">
        <section>
          <h3>費用の分け方</h3>
          <div className="share" aria-hidden="true">
            {[
              ["交通", cost.transport],
              ["宿", cost.lodging],
              ["食事", cost.food],
              ["現地", cost.local + cost.tickets],
            ].map(([name, yen]) => (
              <span key={name} style={{ width: `${(yen / Math.max(cost.total, 1)) * 100}%` }} />
            ))}
          </div>
          <ul className="menu">
            <li><span>交通</span><strong>{formatYen(cost.transport)}</strong></li>
            <li><span>宿</span><strong>{formatYen(cost.lodging)}</strong></li>
            <li><span>食事</span><strong>{formatYen(cost.food)}</strong></li>
            <li><span>現地</span><strong>{formatYen(cost.local + cost.tickets)}</strong></li>
          </ul>
          <p>先に払うもの（交通・宿・入場）は {formatYen(ahead)}。現地で現金になりやすいのは {formatYen(cash)} です。</p>
          {(brief.party || 1) > 1 && <p>{brief.party}人だと合計 {formatYen(cost.groupTotal)} です。</p>}
        </section>
        <section>
          <h3>土産に残す</h3>
          <label htmlFor="spare">金額</label>
          <input
            id="spare"
            type="range"
            min="0"
            max={Math.max(brief.budget, cost.total)}
            step="500"
            value={Math.min(spare, Math.max(brief.budget, cost.total))}
            onChange={(event) => save({ ...desk, spare: Number(event.target.value) })}
          />
          <p>
            {formatYen(spare)} を残すと、予算との差は
            {afterSpare >= 0 ? ` 残り ${formatYen(afterSpare)}` : ` ${formatYen(-afterSpare)} の超過`}
            です。
          </p>
        </section>
      </section>

      {result.alternatives.length > 0 && (
        <section className="compare">
          <h3>候補との違い</h3>
          <table>
            <thead>
              <tr>
                <th>行き先</th>
                <th>ひとり</th>
                <th>片道</th>
                <th>今との差</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th>{result.name}</th>
                <td>{formatYen(cost.total)}</td>
                <td>{cost.minutes}分</td>
                <td>今の行程</td>
              </tr>
              {result.alternatives.map((alt) => (
                <tr key={alt.id || alt.name}>
                  <th>{alt.name}</th>
                  <td>{alt.total == null ? "—" : formatYen(alt.total)}</td>
                  <td>{alt.minutes == null ? "—" : `${alt.minutes}分`}</td>
                  <td>{alt.total == null ? alt.note || "—" : diffLine(alt.total - cost.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {result.planDoc?.checks?.length > 0 && (
        <section className="checks">
          <h3>出発前の確認</h3>
          <ul className="ticks">
            {result.planDoc.checks.map((item) => (
              <li key={item.name}>
                <label>
                  <input type="checkbox" checked={Boolean(desk.checks[item.name])} onChange={() => toggle("checks", item.name)} />
                  <strong>{item.name}</strong>
                </label>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="packing">
        <h3>持ち物</h3>
        <ul className="ticks">
          {packing.map((name) => {
            const detail = result.packing.find((item) => item.name === name)?.detail || "自分で足した持ち物です。";
            return (
              <li key={name}>
                <label>
                  <input type="checkbox" checked={Boolean(desk.packed[name])} onChange={() => toggle("packed", name)} />
                  <strong>{name}</strong>
                </label>
                <p>{detail}</p>
              </li>
            );
          })}
        </ul>
        <form
          className="revise-row"
          onSubmit={(event) => {
            event.preventDefault();
            const name = extraName.trim();
            if (!name || packing.includes(name)) return;
            save({ ...desk, extra: [...desk.extra, name] });
            setExtraName("");
          }}
        >
          <input value={extraName} onChange={(event) => setExtraName(event.target.value)} placeholder="常備薬、充電器" aria-label="持ち物を追加" />
          <button type="submit">追加</button>
        </form>
      </section>

      <section className="revise">
        <h3>この行程のメモ</h3>
        <textarea
          value={desk.memo}
          onChange={(event) => save({ ...desk, memo: event.target.value })}
          placeholder="乗る列車、宿の名前、待ち合わせ"
          aria-label="この行程のメモ"
        />
      </section>

      <div className="sheet-actions">
        <button type="button" onClick={() => downloadIcs(result)}>カレンダーに入れる</button>
        <button type="button" onClick={copyLink}>{linkNote || "この条件のリンクをコピー"}</button>
      </div>
    </div>
  );
}

function diffLine(diff) {
  if (diff === 0) return "同じ";
  return diff > 0 ? `${formatYen(diff)} 高い` : `${formatYen(-diff)} 安い`;
}
