import { useEffect, useRef, useState } from "react";
import type { GameConfig, PlayState, RosterPlayer, WordPair } from "./types";
import { playBlank, playCitizens, playWolves, setAudioMuted, unlockAudio } from "./audio";
import { CustomScreen } from "./components/CustomScreen";
import { HomeScreen } from "./components/HomeScreen";
import { PlayScreen } from "./components/PlayScreen";
import { RulesScreen } from "./components/RulesScreen";
import { SetupScreen } from "./components/SetupScreen";
import { StatsScreen } from "./components/StatsScreen";
import { createRound, DEFAULT_CONFIG, makeRoster, rosterFromSeats, STARTER_NAMES } from "./logic";
import { EMPTY_STATS, loadCustom, loadMuted, loadSettings, loadStats, recordStats, saveCustom, saveMuted, saveSettings, saveStats } from "./storage";
import { PAIRS } from "./words";

type Route = "home" | "rules" | "custom" | "stats" | "setup" | "play";
type Update = PlayState | ((current: PlayState) => PlayState);

export default function App() {
  const [route, setRoute] = useState<Route>("home");
  const [config, setConfig] = useState<GameConfig>(() => loadSettings().config);
  const [roster, setRoster] = useState<RosterPlayer[]>(() => rosterFromSeats(loadSettings().seats));
  const [session, setSession] = useState<Record<string, number>>({});
  const [muted, setMuted] = useState(loadMuted);
  const [notice, setNotice] = useState("");
  const [custom, setCustom] = useState(loadCustom);
  const [stats, setStats] = useState(loadStats);
  const [play, setPlay] = useState<PlayState | null>(null);
  const playRef = useRef<PlayState | null>(null);
  const usedRef = useRef<string[]>([]);

  useEffect(() => {
    setAudioMuted(muted);
  }, [muted]);

  useEffect(() => {
    saveSettings({
      config,
      names: roster.map((player) => player.name),
      seats: roster.map((player) => ({ name: player.name, cpu: player.cpu })),
    });
  }, [config, roster]);

  useEffect(() => {
    const onDown = () => unlockAudio();
    window.addEventListener("pointerdown", onDown);
    return () => window.removeEventListener("pointerdown", onDown);
  }, []);

  function toggleMute() {
    setMuted((current) => {
      const next = !current;
      saveMuted(next);
      setAudioMuted(next);
      return next;
    });
  }

  function commit(update: Update) {
    const prev = playRef.current;
    const next = typeof update === "function" ? (prev ? update(prev) : null) : update;
    if (!next) return;
    if (prev && !prev.result && next.result) {
      const outcome = next.result;
      setSession((scores) => {
        const copy = { ...scores };
        for (const player of next.players) {
          copy[player.id] = (copy[player.id] ?? 0) + (outcome.points[player.id] ?? 0);
        }
        return copy;
      });
      recordStats(next.players, outcome);
      setStats(loadStats());
      if (outcome.kind === "citizens") playCitizens();
      else if (outcome.kind === "blank") playBlank();
      else playWolves();
    }
    playRef.current = next;
    setPlay(next);
  }

  function begin(nextRoster: RosterPlayer[], nextConfig: GameConfig, roundNumber: number, keepSession: boolean) {
    const created = createRound({
      roster: nextRoster,
      config: nextConfig,
      custom: loadCustom(),
      usedPairIds: usedRef.current,
      roundNumber,
    });
    if ("error" in created) {
      setNotice(created.error);
      return;
    }
    if (!keepSession) setSession({});
    usedRef.current = created.usedPairIds;
    setNotice("");
    setRoute("play");
    commit(created.state);
  }

  function goHome() {
    playRef.current = null;
    setPlay(null);
    setSession({});
    usedRef.current = [];
    setNotice("");
    setRoute("home");
  }

  function savePair(pair: WordPair) {
    const next = [pair, ...loadCustom()];
    saveCustom(next);
    setCustom(next);
  }

  function deletePair(id: string) {
    const next = loadCustom().filter((pair) => pair.id !== id);
    saveCustom(next);
    setCustom(next);
  }

  return (
    <>
      <div className="moon" aria-hidden="true" />
      <main className="app">
        {route === "home" ? (
          <HomeScreen
            pairCount={PAIRS.length}
            customCount={custom.length}
            muted={muted}
            notice={notice}
            onToggleMute={toggleMute}
            onSetup={() => {
              setNotice("");
              setRoute("setup");
            }}
            onQuick={() => {
              const next = makeRoster(STARTER_NAMES);
              setRoster(next);
              setConfig(DEFAULT_CONFIG);
              usedRef.current = [];
              begin(next, DEFAULT_CONFIG, 1, false);
            }}
            onRules={() => setRoute("rules")}
            onCustom={() => setRoute("custom")}
            onStats={() => setRoute("stats")}
          />
        ) : null}

        {route === "rules" ? <RulesScreen muted={muted} onToggleMute={toggleMute} onBack={() => setRoute("home")} /> : null}

        {route === "custom" ? (
          <CustomScreen
            pairs={custom}
            muted={muted}
            onToggleMute={toggleMute}
            onSave={savePair}
            onDelete={deletePair}
            onBack={() => setRoute("home")}
          />
        ) : null}

        {route === "stats" ? (
          <StatsScreen
            stats={stats}
            muted={muted}
            onToggleMute={toggleMute}
            onReset={() => {
              saveStats({ ...EMPTY_STATS, players: {} });
              setStats(loadStats());
            }}
            onBack={() => setRoute("home")}
          />
        ) : null}

        {route === "setup" ? (
          <SetupScreen
            roster={roster}
            config={config}
            custom={custom}
            muted={muted}
            onToggleMute={toggleMute}
            onChangeRoster={setRoster}
            onChangeConfig={setConfig}
            onStart={() => begin(roster, config, 1, false)}
            onBack={() => setRoute("home")}
          />
        ) : null}

        {route === "play" && play ? (
          <PlayScreen
            play={play}
            session={session}
            notice={notice}
            muted={muted}
            onToggleMute={toggleMute}
            onPlay={commit}
            onNext={() => {
              const rosterNow = play.players.map((player) => ({
                id: player.id,
                name: player.name,
                color: player.color,
                cpu: player.cpu,
              }));
              begin(rosterNow, play.config, play.roundNumber + 1, true);
            }}
            onSetup={() => setRoute("setup")}
            onHome={goHome}
          />
        ) : null}
      </main>
    </>
  );
}
