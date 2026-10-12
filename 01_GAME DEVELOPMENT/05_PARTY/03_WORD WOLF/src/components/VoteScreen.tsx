import { useState } from "react";
import type { Player } from "../types";
import { playTap } from "../audio";
import { roleLabel } from "../logic";
import { TopBar } from "./Bits";

export function VoteScreen({
  voter,
  cursor,
  total,
  targets,
  executed,
  revote,
  secret,
  muted,
  onToggleMute,
  onCast,
  onAbort,
}: {
  voter: Player;
  cursor: number;
  total: number;
  targets: Player[];
  executed: Player[];
  revote: boolean;
  secret: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onCast: (targetId: string) => void;
  onAbort: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <section className="screen">
      <TopBar title={`投票 ${cursor + 1} / ${total}`} muted={muted} onToggleMute={onToggleMute} onBack={onAbort} backLabel="中断" />
      {revote ? <p className="banner">同票でした。この中から、もう一度だけ選びます。</p> : null}
      <p className="kicker">いまの投票</p>
      <h1>
        <i className="swatch inline" style={{ background: voter.color }} />
        {voter.name}さん
      </h1>
      <p>{secret ? "自分以外の、ウルフだと思う人を選んでください。" : "指さしでも、画面で選んでもかまいません。"}</p>
      {executed.length > 0 ? (
        <p className="fine">
          すでに追放: {executed.map((player) => `${player.name}（${roleLabel(player.role)}）`).join("、")}
        </p>
      ) : null}
      <div className="stack">
        {targets.map((player) => (
          <button
            type="button"
            key={player.id}
            className={selected === player.id ? "choice on" : "choice"}
            onClick={() => {
              playTap();
              setSelected(player.id);
            }}
          >
            <i className="swatch" style={{ background: player.color }} />
            <span className="who">{player.name}</span>
          </button>
        ))}
      </div>
      <div className="dock">
        <button type="button" className="btn btn-seal" disabled={!selected} onClick={() => selected && onCast(selected)}>
          この人に投票
        </button>
      </div>
    </section>
  );
}

export function VoteCover({
  voter,
  cursor,
  total,
  revote,
  muted,
  onToggleMute,
  onOpen,
  onAbort,
}: {
  voter: Player;
  cursor: number;
  total: number;
  revote: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onOpen: () => void;
  onAbort: () => void;
}) {
  return (
    <section className="screen">
      <TopBar title={`投票 ${cursor + 1} / ${total}`} muted={muted} onToggleMute={onToggleMute} onBack={onAbort} backLabel="中断" />
      <div className="pass">
        <p className="kicker">無記名</p>
        <h1>
          <i className="swatch inline" style={{ background: voter.color }} />
          {voter.name}さん
        </h1>
        <p>ほかの人は画面を見ないでください。投票したあと、すぐに次の人へ渡します。</p>
        {revote ? <p className="banner">同票でした。もう一度だけ投票します。</p> : null}
        <div className="dock">
          <button type="button" className="btn btn-primary" onClick={onOpen}>
            投票する
          </button>
        </div>
      </div>
    </section>
  );
}
