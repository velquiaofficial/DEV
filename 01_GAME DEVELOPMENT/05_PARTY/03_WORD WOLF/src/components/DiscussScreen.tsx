import { useEffect, useRef, useState } from "react";
import { buzz, playWarn } from "../audio";
import { TopBar } from "./Bits";

const PROMPTS = [
  "それは、家の中にある？",
  "食べられる？ 飲める？",
  "一人で持ち運べる？",
  "子どもでも知っている？",
  "高い？ 安い？",
  "音はする？",
  "季節と関係がある？",
  "人はそれを使って、何をする？",
  "昨日、それに近いものを見た？",
  "大きさは、手のひらと比べると？",
  "それは一つ？ それとも集まり？",
  "朝と夜、どっちに近い？",
];

function clock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function DiscussScreen({
  roundNumber,
  players,
  category,
  wolfCount,
  includeBlank,
  timerSec,
  endsAt,
  pausedMs,
  startedAt,
  remarks,
  muted,
  onToggleMute,
  onPause,
  onAdd,
  onVote,
  onAbort,
}: {
  roundNumber: number;
  players: { id: string; name: string; color: string; cpu?: boolean }[];
  remarks: { id: string; name: string; color: string; text: string; atMs: number }[];
  category: string | null;
  wolfCount: number;
  includeBlank: boolean;
  timerSec: number;
  endsAt: number | null;
  pausedMs: number | null;
  startedAt: number | null;
  muted: boolean;
  onToggleMute: () => void;
  onPause: () => void;
  onAdd: () => void;
  onVote: () => void;
  onAbort: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [spokenMs, setSpokenMs] = useState(0);
  const [promptAt, setPromptAt] = useState(0);
  const warned = useRef(false);
  const ended = useRef(false);
  const pausedRef = useRef(false);
  const countdown = timerSec > 0;
  const paused = pausedMs != null;
  useEffect(() => {
    pausedRef.current = paused;
  });
  const elapsed = paused ? pausedMs : startedAt == null ? 0 : now - startedAt;
  const remaining = !countdown ? 0 : paused ? pausedMs : endsAt == null ? timerSec * 1000 : endsAt - now;
  const shown = countdown ? remaining : elapsed;
  const budget = Math.max(timerSec * 1000, remaining, 1);
  const ratio = countdown ? Math.max(0, Math.min(1, remaining / budget)) : 1;
  const timeUp = countdown && remaining <= 0 && !paused;
  const danger = countdown && remaining <= 15_000 && remaining > 0;
  const radius = 96;
  const circ = 2 * Math.PI * radius;

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
      if (!pausedRef.current) setSpokenMs((ms) => ms + 250);
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!countdown || paused) return;
    if (remaining > 10_000) warned.current = false;
    if (remaining > 0) ended.current = false;
    if (remaining <= 10_000 && remaining > 0 && !warned.current) {
      warned.current = true;
      playWarn();
    }
    if (remaining <= 0 && !ended.current) {
      ended.current = true;
      playWarn();
      buzz(160);
    }
  }, [countdown, paused, remaining]);

  return (
    <section className={timeUp ? "screen timeup" : "screen"}>
      <TopBar title={`第${roundNumber}ラウンド`} muted={muted} onToggleMute={onToggleMute} onBack={onAbort} backLabel="中断" />
      <p className="kicker center">議論</p>
      <div className="timer-wrap">
        <svg viewBox="0 0 220 220" className="timer-svg" aria-hidden="true">
          <circle className="ring-bg" cx="110" cy="110" r={radius} />
          <circle
            className={danger || timeUp ? "ring danger" : "ring"}
            cx="110"
            cy="110"
            r={radius}
            transform="rotate(-90 110 110)"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - ratio)}
          />
        </svg>
        <div className="timer-read">
          <strong className="timer-num">{countdown ? clock(shown) : clock(elapsed)}</strong>
          <span className="timer-label">{paused ? "停止中" : timeUp ? "時間です" : countdown ? "残り" : "経過"}</span>
        </div>
      </div>
      <p className="fine center">
        ウルフは{wolfCount}人。{includeBlank ? "空白が1人います。" : "空白はいません。"}
        {category ? ` 分類は${category}。` : ""} 言葉そのものは言わない。
      </p>
      <div className="name-row">
        {players.map((player) => (
          <span key={player.id}>
            <i className="swatch tiny" style={{ background: player.color }} />
            {player.name}
            {player.cpu ? <em className="cpu-tag">CPU</em> : null}
          </span>
        ))}
      </div>
      {remarks.some((remark) => spokenMs >= remark.atMs) ? (
        <div className="remarks" aria-live="polite">
          {remarks
            .filter((remark) => spokenMs >= remark.atMs)
            .map((remark) => (
              <div className="remark" key={`${remark.id}-${remark.atMs}`}>
                <i className="swatch tiny" style={{ background: remark.color }} />
                <p>
                  <strong>{remark.name}</strong>
                  <span> {remark.text}</span>
                </p>
              </div>
            ))}
        </div>
      ) : null}
      <div className="prompt">
        <p className="kicker">問い</p>
        <p>{PROMPTS[promptAt % PROMPTS.length]}</p>
        <button type="button" className="btn btn-text" onClick={() => setPromptAt((value) => value + 1)}>
          別の問い
        </button>
      </div>
      <div className="split">
        <button type="button" className="btn btn-ghost" onClick={onPause}>
          {paused ? "再開" : "一時停止"}
        </button>
        {countdown ? (
          <button type="button" className="btn btn-ghost" onClick={onAdd}>
            30秒足す
          </button>
        ) : null}
      </div>
      <div className="dock">
        <button type="button" className="btn btn-seal" onClick={onVote}>
          投票へ
        </button>
      </div>
    </section>
  );
}
