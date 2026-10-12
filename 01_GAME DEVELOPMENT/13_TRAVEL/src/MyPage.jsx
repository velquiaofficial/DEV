import { originChoices } from "./regions.js";
import { countdownLine, daysUntil } from "./tripkit.js";
import { sceneOf } from "./scenes.js";

export default function MyPage({ user, destinations, saved, been, want, onOrigin, onOpen, onForget, onPick, onBeen, onLogout }) {
  const byId = Object.fromEntries(destinations.map((dest) => [dest.id, dest]));
  const nextTrip = saved
    .map((entry) => ({ entry, days: daysUntil(entry.result?.dates?.start) }))
    .filter((item) => item.days != null && item.days >= 0)
    .sort((a, b) => a.days - b.days)[0];
  const nextName = nextTrip?.entry.result?.name;
  return (
    <div className="my-page">
      <header className="who">
        <span className="avatar" aria-hidden="true">{user.name.slice(0, 1)}</span>
        <div>
          <h2>{user.name}</h2>
          <p>{user.origin}から出かける</p>
        </div>
        <button type="button" className="text-btn" onClick={onLogout}>ログアウト</button>
      </header>

      <ul className="who-stats">
        <li><strong>{saved.length}</strong><span>保存</span></li>
        <li><strong>{want.length}</strong><span>行きたい</span></li>
        <li><strong>{been.length}</strong><span>行った</span></li>
      </ul>

      {nextTrip && (
        <button
          type="button"
          className="next-trip"
          style={{ backgroundImage: `linear-gradient(90deg, rgba(16,32,28,0.55), rgba(16,32,28,0.2)), url("${sceneOf({ id: nextTrip.entry.result?.destId })}")` }}
          onClick={() => onOpen(nextTrip.entry)}
        >
          <span>次の旅</span>
          <strong>{nextName}</strong>
          <em>{countdownLine(nextTrip.days)} · {nextTrip.entry.result?.dates?.range}</em>
        </button>
      )}

      <section className="filters">
        <label htmlFor="home-origin">よく出る場所</label>
        <select id="home-origin" className="origin-select" value={user.origin} onChange={(event) => onOrigin(event.target.value)}>
          {originChoices().map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <p className="hint">さがす画面の出発地に使います。</p>
      </section>

      <section className="filters">
        <h3>保存した行程</h3>
        {saved.length === 0 ? (
          <p className="hint">まだありません。行程を作って保存すると、ここに残ります。</p>
        ) : (
          <ul className="my-list">
            {saved.map((entry) => (
              <li key={entry.id}>
                <button type="button" onClick={() => onOpen(entry)}>
                  <strong>{entry.result?.name || "行程"}</strong>
                  <span>{entry.result?.dates?.range}</span>
                </button>
                <button type="button" className="chip" onClick={() => onForget(entry.id)}>削除</button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="filters">
        <h3>行きたい</h3>
        {want.length === 0 ? (
          <p className="hint">カードの「行きたい」を押すと、ここに残ります。</p>
        ) : (
          <div className="examples">
            {want.map((id) => (
              <button key={id} type="button" className="chip" onClick={() => onPick(id)}>
                {byId[id]?.name || id}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="filters">
        <h3>行った場所</h3>
        {been.length === 0 ? (
          <p className="hint">行った場所を押すと、次の行程でその傾向を使います。</p>
        ) : (
          <div className="examples">
            {been.map((id) => (
              <button key={id} type="button" className="chip" aria-pressed="true" onClick={() => onBeen(id)}>
                {byId[id]?.name || id}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
