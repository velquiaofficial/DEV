import { useEffect, useRef, useState } from "react";
import { playFlip } from "../audio";
import { TopBar } from "./Bits";

export function RevealScreen({
  name,
  color,
  index,
  total,
  flipped,
  handoff,
  word,
  reading,
  blankCanWin,
  note,
  muted,
  onToggleMute,
  onFlip,
  onHide,
  onAck,
  onHandoff,
  onAbort,
}: {
  name: string;
  color: string;
  index: number;
  total: number;
  flipped: boolean;
  handoff: boolean;
  word: string | null;
  reading: string | null;
  blankCanWin: boolean;
  note?: string;
  muted: boolean;
  onToggleMute: () => void;
  onFlip: () => void;
  onHide: () => void;
  onAck: () => void;
  onHandoff: () => void;
  onAbort: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [armed, setArmed] = useState(false);
  const [flipMark, setFlipMark] = useState(flipped);
  const [handMark, setHandMark] = useState(handoff);
  const hideRef = useRef(onHide);

  if (flipped !== flipMark) {
    setFlipMark(flipped);
    setReady(false);
  }
  if (handoff !== handMark) {
    setHandMark(handoff);
    setArmed(false);
  }

  useEffect(() => {
    hideRef.current = onHide;
  });

  useEffect(() => {
    if (!flipped) return;
    const timer = window.setTimeout(() => setReady(true), 1800);
    return () => window.clearTimeout(timer);
  }, [flipped]);

  useEffect(() => {
    if (!flipped) return;
    const timer = window.setTimeout(() => hideRef.current(), 30000);
    const onVis = () => {
      if (document.hidden) hideRef.current();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [flipped]);

  useEffect(() => {
    if (!handoff) return;
    const timer = window.setTimeout(() => setArmed(true), 700);
    return () => window.clearTimeout(timer);
  }, [handoff]);

  return (
    <section className="screen">
      <TopBar title={`${index + 1} / ${total}`} muted={muted} onToggleMute={onToggleMute} onBack={onAbort} backLabel="中断" />
      <div className="progress" aria-hidden="true">
        {Array.from({ length: total }, (_, dot) => (
          <i key={dot} className={dot === index ? "on" : dot < index ? "done" : ""} />
        ))}
      </div>
      {note ? <p className="fine center">{note}</p> : null}

      {handoff ? (
        <div className="pass">
          <p className="kicker">端末を渡す</p>
          <h1>
            <i className="swatch inline" style={{ background: color }} />
            {name}さん
          </h1>
          <p>札は伏せてあります。受け取った人だけ押してください。</p>
          <div className="dock">
            <button type="button" className="btn btn-primary" disabled={!armed} onClick={onHandoff}>
              {armed ? `${name}です。札を見る` : "渡しています"}
            </button>
          </div>
        </div>
      ) : !flipped ? (
        <div className="pass">
          <p className="kicker">自分の札</p>
          <h1>
            <i className="swatch inline" style={{ background: color }} />
            {name}さん
          </h1>
          <p>まわりの人は、画面から目をそらしてください。</p>
          <div className="dock">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                playFlip();
                onFlip();
              }}
            >
              札をめくる
            </button>
          </div>
        </div>
      ) : (
        <div className="pass">
          <article className="paper" translate="no">
            {word ? (
              <>
                <p className="word">{word}</p>
                {reading && reading !== word ? <p className="reading">{reading}</p> : null}
                <p className="caption">この言葉のつもりで話す</p>
              </>
            ) : (
              <>
                <div className="seal seal-small" aria-hidden="true">
                  空
                </div>
                <p className="word">空白</p>
                <p className="caption">
                  お題はありません。会話にまぎれて、市民の言葉を探ってください。
                  {blankCanWin ? "生き残って言葉を当てれば、あなたの勝ちです。" : ""}
                </p>
              </>
            )}
          </article>
          <p className="fine center">しばらくすると、自動で伏せます。</p>
          <div className="dock">
            <button type="button" className="btn btn-primary" disabled={!ready} onClick={onAck}>
              {ready ? "覚えた" : "言葉を見てください"}
            </button>
            <button type="button" className="btn btn-text" onClick={onHide}>
              いったん伏せる
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
