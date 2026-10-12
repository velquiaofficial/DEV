import { useEffect, useRef } from "react";
import type { PlayState } from "../types";
import {
  acknowledgeCard,
  addDiscussTime,
  alivePlayers,
  blankGuessByCpu,
  castCpuVote,
  castVote,
  confirmHandoff,
  continueFromExile,
  cpuRemarks,
  currentVoter,
  flipCard,
  hideCard,
  openBallot,
  openBlankGuess,
  openWolfGuess,
  playerById,
  startVote,
  submitBlankGuess,
  submitCpuBlankGuess,
  submitCpuWolfGuess,
  submitWolfGuess,
  togglePause,
  voteTargets,
  wolfGuessByCpu,
} from "../logic";
import { TopBar } from "./Bits";
import { DiscussScreen } from "./DiscussScreen";
import { ExileScreen } from "./ExileScreen";
import { GuessScreen } from "./GuessScreen";
import { ResultScreen } from "./ResultScreen";
import { RevealScreen } from "./RevealScreen";
import { VoteCover, VoteScreen } from "./VoteScreen";

type Update = PlayState | ((current: PlayState) => PlayState);

export function PlayScreen({
  play,
  session,
  notice,
  muted,
  onToggleMute,
  onPlay,
  onNext,
  onSetup,
  onHome,
}: {
  play: PlayState;
  session: Record<string, number>;
  notice: string;
  muted: boolean;
  onToggleMute: () => void;
  onPlay: (update: Update) => void;
  onNext: () => void;
  onSetup: () => void;
  onHome: () => void;
}) {
  const player = play.players[play.revealIndex];
  const voter = currentVoter(play);
  const cpuVote = (play.phase === "vote" || play.phase === "voteCover") && Boolean(voter?.cpu);
  const cpuWolf = (play.phase === "wolfGuess" || play.phase === "wolfGuessCover") && wolfGuessByCpu(play);
  const cpuBlank = (play.phase === "blankGuess" || play.phase === "blankGuessCover") && blankGuessByCpu(play);
  const onPlayRef = useRef(onPlay);
  useEffect(() => {
    onPlayRef.current = onPlay;
  });
  useEffect(() => {
    if (!cpuVote && !cpuWolf && !cpuBlank) return;
    const timer = window.setTimeout(() => {
      if (cpuVote) onPlayRef.current(castCpuVote);
      else if (cpuWolf) onPlayRef.current(submitCpuWolfGuess);
      else onPlayRef.current(submitCpuBlankGuess);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [cpuVote, cpuWolf, cpuBlank, play.phase, play.voteCursor, play.executedIds]);

  if (play.phase === "reveal" && player) {
    const humans = play.players.filter((item) => !item.cpu);
    const humanIndex = humans.findIndex((item) => item.id === player.id);
    return (
      <RevealScreen
        name={player.name}
        color={player.color}
        index={humanIndex < 0 ? 0 : humanIndex}
        total={Math.max(1, humans.length)}
        flipped={play.flipped}
        handoff={play.awaitingHandoff}
        word={play.flipped ? player.word : null}
        reading={play.flipped ? player.reading : null}
        blankCanWin={play.config.blankStealEnabled}
        note={play.players.some((item) => item.cpu) ? "CPUは札を見ません" : undefined}
        muted={muted}
        onToggleMute={onToggleMute}
        onFlip={() => onPlay(flipCard)}
        onHide={() => onPlay(hideCard)}
        onAck={() => onPlay(acknowledgeCard)}
        onHandoff={() => onPlay(confirmHandoff)}
        onAbort={onHome}
      />
    );
  }

  if (play.phase === "discuss") {
    return (
      <DiscussScreen
        roundNumber={play.roundNumber}
        players={play.players}
        category={play.config.showCategory ? play.pair.category : null}
        wolfCount={play.config.wolfCount}
        includeBlank={play.config.includeBlank}
        timerSec={play.config.timerSec}
        endsAt={play.discussEndsAt}
        pausedMs={play.discussPausedMs}
        startedAt={play.discussStartedAt}
        remarks={cpuRemarks(play.players, play.pair.category)}
        muted={muted}
        onToggleMute={onToggleMute}
        onPause={() => onPlay(togglePause)}
        onAdd={() => onPlay(addDiscussTime)}
        onVote={() => onPlay(startVote)}
        onAbort={onHome}
      />
    );
  }

  const alive = alivePlayers(play);

  if ((play.phase === "voteCover" || play.phase === "vote") && voter) {
    if (voter.cpu) {
      return (
        <MachineTurn
          name={voter.name}
          title="投票しています"
          muted={muted}
          onToggleMute={onToggleMute}
          onAbort={onHome}
        />
      );
    }
    if (play.phase === "voteCover") {
      return (
        <VoteCover
          voter={voter}
          cursor={play.voteCursor}
          total={alive.length}
          revote={play.revotePool != null}
          muted={muted}
          onToggleMute={onToggleMute}
          onOpen={() => onPlay(openBallot)}
          onAbort={onHome}
        />
      );
    }
    return (
      <VoteScreen
        key={`${play.roundNumber}-${play.executedIds.length}-${play.voteCursor}-${play.revoteUsed}`}
        voter={voter}
        cursor={play.voteCursor}
        total={alive.length}
        targets={voteTargets(play, voter.id)}
        executed={play.players.filter((item) => play.executedIds.includes(item.id))}
        revote={play.revotePool != null}
        secret={play.config.secretVote}
        muted={muted}
        onToggleMute={onToggleMute}
        onCast={(targetId) => onPlay((state) => castVote(state, targetId))}
        onAbort={onHome}
      />
    );
  }

  if (play.phase === "exile") {
    const exile = playerById(play, play.exilePlayerId);
    if (exile) {
      return (
        <ExileScreen
          name={exile.name}
          role={exile.role}
          muted={muted}
          onToggleMute={onToggleMute}
          onContinue={() => onPlay(continueFromExile)}
        />
      );
    }
  }

  if (play.phase === "wolfGuessCover" || play.phase === "wolfGuess") {
    if (cpuWolf) {
      const names = play.players
        .filter((item) => item.role === "wolf" && play.executedIds.includes(item.id))
        .map((item) => item.name)
        .join("、");
      return (
        <MachineTurn
          name={names || "CPU"}
          title="市民の言葉を推理しています"
          muted={muted}
          onToggleMute={onToggleMute}
          onAbort={onHome}
        />
      );
    }
    const names = play.players
      .filter((item) => item.role === "wolf" && play.executedIds.includes(item.id))
      .map((item) => `${item.name}さん`)
      .join("、");
    return (
      <GuessScreen
        key={play.phase}
        cover={play.phase === "wolfGuessCover"}
        kicker="逆転推理"
        title="端末を渡してください"
        body={`${names || "追放されたウルフ"}が、市民の言葉を推理できます。当たれば逆転です。`}
        hold="ほかの人は、入力が見えない位置へ。"
        muted={muted}
        onToggleMute={onToggleMute}
        onOpen={() => onPlay(openWolfGuess)}
        onSubmit={(text) => onPlay((state) => submitWolfGuess(state, text))}
      />
    );
  }

  if (play.phase === "blankGuessCover" || play.phase === "blankGuess") {
    const blank = play.players.find((item) => item.role === "blank");
    if (cpuBlank) {
      return (
        <MachineTurn
          name={blank?.name ?? "CPU"}
          title="市民の言葉を推理しています"
          muted={muted}
          onToggleMute={onToggleMute}
          onAbort={onHome}
        />
      );
    }
    return (
      <GuessScreen
        key={play.phase}
        cover={play.phase === "blankGuessCover"}
        kicker="空白の推理"
        title="端末を渡してください"
        body={`${blank?.name ?? "空白"}さん。ウルフの逆転は外れました。市民の言葉を言い当ててください。`}
        hold="当たれば、このラウンドは空白の勝ちです。"
        muted={muted}
        onToggleMute={onToggleMute}
        onOpen={() => onPlay(openBlankGuess)}
        onSubmit={(text) => onPlay((state) => submitBlankGuess(state, text))}
      />
    );
  }

  if (play.phase === "result" && play.result) {
    return (
      <ResultScreen
        roundNumber={play.roundNumber}
        result={play.result}
        pair={play.pair}
        players={play.players}
        session={session}
        notice={notice}
        onNext={onNext}
        onSetup={onSetup}
        onHome={onHome}
      />
    );
  }

  return (
    <section className="screen">
      <p>この画面には進めませんでした。</p>
      <button type="button" className="btn btn-primary" onClick={onHome}>
        ホームへ
      </button>
    </section>
  );
}

function MachineTurn({
  name,
  title,
  muted,
  onToggleMute,
  onAbort,
}: {
  name: string;
  title: string;
  muted: boolean;
  onToggleMute: () => void;
  onAbort: () => void;
}) {
  return (
    <section className="screen">
      <TopBar title="CPU" muted={muted} onToggleMute={onToggleMute} onBack={onAbort} backLabel="中断" />
      <div className="pass">
        <p className="kicker">CPU</p>
        <h1>{name}</h1>
        <p>{title}</p>
      </div>
    </section>
  );
}
