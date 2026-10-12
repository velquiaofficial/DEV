import { TopBar } from "./Bits";

export function HomeScreen({
  pairCount,
  customCount,
  notice,
  muted,
  onToggleMute,
  onSetup,
  onQuick,
  onRules,
  onCustom,
  onStats,
}: {
  pairCount: number;
  customCount: number;
  notice: string;
  muted: boolean;
  onToggleMute: () => void;
  onSetup: () => void;
  onQuick: () => void;
  onRules: () => void;
  onCustom: () => void;
  onStats: () => void;
}) {
  return (
    <section className="screen">
      <TopBar muted={muted} onToggleMute={onToggleMute} />
      <div className="hero">
        <div className="seal" aria-hidden="true">
          狼
        </div>
        <p className="kicker">ことばの人狼</p>
        <h1 className="hero-title">ワードウルフ</h1>
        <p className="lede">ほとんど同じ言葉。ひとりだけ、ちがう。</p>
      </div>
      {notice ? <p className="warn center">{notice}</p> : null}
      <div className="menu">
        <button type="button" className="btn btn-primary" onClick={onSetup}>
          ゲームを始める
        </button>
        <button type="button" className="btn btn-seal" onClick={onQuick}>
          4人ですぐ遊ぶ
        </button>
        <button type="button" className="btn btn-ghost" onClick={onRules}>
          ルール
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCustom}>
          オリジナルお題
        </button>
        <button type="button" className="btn btn-ghost" onClick={onStats}>
          これまでの成績
        </button>
      </div>
      <p className="fine center">
        収録 {pairCount}組{customCount > 0 ? ` ＋ オリジナル ${customCount}組` : ""}。端末を1台、順番に渡して遊びます。
      </p>
    </section>
  );
}
