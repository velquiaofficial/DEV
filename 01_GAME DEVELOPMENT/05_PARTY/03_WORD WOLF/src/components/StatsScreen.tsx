import { useState } from "react";
import type { Stats } from "../types";
import { TopBar } from "./Bits";

export function StatsScreen({
  stats,
  muted,
  onToggleMute,
  onReset,
  onBack,
}: {
  stats: Stats;
  muted: boolean;
  onToggleMute: () => void;
  onReset: () => void;
  onBack: () => void;
}) {
  const [armed, setArmed] = useState(false);
  const rows = Object.entries(stats.players).sort((a, b) => b[1].points - a[1].points || b[1].wins - a[1].wins);

  return (
    <section className="screen">
      <TopBar title="成績" muted={muted} onToggleMute={onToggleMute} onBack={onBack} />
      <p className="kicker">この端末</p>
      <h1>これまでの卓</h1>
      <div className="stat-grid">
        <div className="stat">
          <b>{stats.citizenWins}</b>
          <span>市民の勝ち</span>
        </div>
        <div className="stat">
          <b>{stats.wolfWins}</b>
          <span>ウルフの勝ち</span>
        </div>
        <div className="stat">
          <b>{stats.blankWins}</b>
          <span>空白の勝ち</span>
        </div>
      </div>
      <p className="fine center">{stats.rounds}ラウンドを記録しています。</p>
      {rows.length === 0 ? <p className="fine center">まだ対局がありません。1回終わると、ここに残ります。</p> : null}
      <div>
        {rows.map(([name, row]) => (
          <div className="person" key={name}>
            <i className="swatch" />
            <div>
              <strong>{name}</strong>
              <em>
                {row.wins}勝 / {row.rounds}回
              </em>
            </div>
            <b>{row.points}</b>
          </div>
        ))}
      </div>
      {stats.rounds > 0 ? (
        <button
          type="button"
          className="btn btn-text"
          onClick={() => {
            if (!armed) {
              setArmed(true);
              return;
            }
            onReset();
            setArmed(false);
          }}
        >
          {armed ? "本当に消す" : "記録を消す"}
        </button>
      ) : null}
    </section>
  );
}
