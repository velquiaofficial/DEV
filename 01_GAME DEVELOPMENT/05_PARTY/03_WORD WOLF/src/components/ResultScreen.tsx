import type { ExecutionRecord, Player, RoundResult, WordPair } from "../types";
import { difficultyLabel, roleLabel, winnerSide } from "../logic";

function votedName(players: Player[], id: string | undefined) {
  if (!id) return "？";
  return players.find((player) => player.id === id)?.name ?? "？";
}

export function ResultScreen({
  roundNumber,
  result,
  pair,
  players,
  session,
  notice,
  onNext,
  onSetup,
  onHome,
}: {
  roundNumber: number;
  result: RoundResult;
  pair: WordPair;
  players: Player[];
  session: Record<string, number>;
  notice: string;
  onNext: () => void;
  onSetup: () => void;
  onHome: () => void;
}) {
  const side = winnerSide(result.kind);
  const ranked = [...players].sort((a, b) => (session[b.id] ?? 0) - (session[a.id] ?? 0));

  return (
    <section className="screen">
      <div className={`result-hero ${side}`}>
        <p className="kicker">第{roundNumber}ラウンド</p>
        <h1>{result.title}</h1>
        <p>{result.reason}</p>
      </div>

      <div className="pair-grid">
        <article className="mini-word citizen">
          <span>市民の言葉</span>
          <strong>{pair.citizen}</strong>
          <em>{pair.citizenRead}</em>
        </article>
        <article className="mini-word wolf">
          <span>ウルフの言葉</span>
          <strong>{pair.wolf}</strong>
          <em>{pair.wolfRead}</em>
        </article>
      </div>
      <p className="fine center">
        {pair.category} · {difficultyLabel(pair.difficulty)}
      </p>

      {result.wolfAsked ? (
        <p className="banner">
          ウルフの推理: {result.wolfGuess ? `「${result.wolfGuess}」` : "パス"} · {result.wolfGuessCorrect ? "正解" : "不正解"}
        </p>
      ) : null}
      {result.blankAsked ? (
        <p className="banner">
          空白の推理: {result.blankGuess ? `「${result.blankGuess}」` : "パス"} · {result.blankGuessCorrect ? "正解" : "不正解"}
        </p>
      ) : null}

      <div className="section">
        <h2>配役</h2>
        {players.map((player) => {
          const executed = result.executionLog.some((record) => record.playerId === player.id);
          return (
            <div className={executed ? "person out" : "person"} key={player.id}>
              <i className="swatch" style={{ background: player.color }} />
              <div>
                <strong>{player.name}</strong>
                {player.cpu ? <span className="cpu-tag">CPU</span> : null}
                <span className={`badge ${player.role}`}>{roleLabel(player.role)}</span>
                {executed ? <span className="badge ghost">追放</span> : null}
                <em>{player.word ?? "お題なし"}</em>
              </div>
              <b>+{result.points[player.id] ?? 0}</b>
            </div>
          );
        })}
      </div>

      <div className="section">
        <h2>投票</h2>
        {result.executionLog.map((record, index) => (
          <Execution key={`${record.playerId ?? "tie"}-${index}`} record={record} players={players} />
        ))}
      </div>

      <div className="section">
        <h2>この卓の合計</h2>
        {ranked.map((player) => (
          <div className="person" key={player.id}>
            <i className="swatch" style={{ background: player.color }} />
            <div>
              <strong>{player.name}</strong>
            </div>
            <b>{session[player.id] ?? 0}</b>
          </div>
        ))}
      </div>

      <div className="dock">
        {notice ? <p className="warn center">{notice}</p> : null}
        <button type="button" className="btn btn-primary" onClick={onNext}>
          もう一回
        </button>
        <button type="button" className="btn btn-ghost" onClick={onSetup}>
          設定を変える
        </button>
        <button type="button" className="btn btn-text" onClick={onHome}>
          ホームへ
        </button>
      </div>
    </section>
  );
}

function Execution({ record, players }: { record: ExecutionRecord; players: Player[] }) {
  const person = players.find((player) => player.id === record.playerId);
  return (
    <div className="log">
      <h3>{person ? `${person.name}さんを追放` : "同票で、追放なし"}</h3>
      {person ? <p className="fine">{roleLabel(person.role)}</p> : null}
      <ul>
        {players
          .filter((player) => record.votes[player.id])
          .map((player) => (
            <li key={player.id}>
              {player.name} → {votedName(players, record.votes[player.id])}
            </li>
          ))}
      </ul>
    </div>
  );
}
