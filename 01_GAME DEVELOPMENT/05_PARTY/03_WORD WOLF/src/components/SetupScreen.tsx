import type { GameConfig, RosterPlayer, WordPair } from "../types";
import { collectPairs, freshHumanName, maxWolfCount, PALETTE, setupError, uid, withCounts } from "../logic";
import { categoryList } from "../words";
import { Section, Stepper, Switch, TopBar } from "./Bits";

const TIMERS = [
  { sec: 60, label: "1分" },
  { sec: 120, label: "2分" },
  { sec: 180, label: "3分" },
  { sec: 300, label: "5分" },
  { sec: 0, label: "なし" },
];

export function SetupScreen({
  roster,
  config,
  custom,
  muted,
  onToggleMute,
  onChangeRoster,
  onChangeConfig,
  onStart,
  onBack,
}: {
  roster: RosterPlayer[];
  config: GameConfig;
  custom: WordPair[];
  muted: boolean;
  onToggleMute: () => void;
  onChangeRoster: (roster: RosterPlayer[]) => void;
  onChangeConfig: (config: GameConfig) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const categories = categoryList(custom);
  const deck = collectPairs(custom, config);
  const problem = setupError(roster, config, deck.length);
  const blanks = config.includeBlank ? 1 : 0;
  const citizens = roster.length - config.wolfCount - blanks;
  const wolfMax = Math.max(1, maxWolfCount(roster.length, config.includeBlank));
  const cpuCount = roster.filter((player) => player.cpu).length;
  const humanCount = roster.length - cpuCount;

  function patch(partial: Partial<GameConfig>) {
    const next = { ...config, ...partial };
    const max = maxWolfCount(roster.length, next.includeBlank);
    if (max >= 1) next.wolfCount = Math.min(Math.max(1, next.wolfCount), max);
    onChangeConfig(next);
  }

  function updateRoster(next: RosterPlayer[]) {
    onChangeRoster(next);
    const max = maxWolfCount(next.length, config.includeBlank);
    if (max >= 1 && config.wolfCount > max) onChangeConfig({ ...config, wolfCount: max });
  }

  return (
    <section className="screen">
      <TopBar title="卓を組む" muted={muted} onToggleMute={onToggleMute} onBack={onBack} />

      <Section kicker="01" title="参加者">
        <div className="split-line">
          <span>人数</span>
          <Stepper
            label="人数"
            min={3}
            max={10}
            value={roster.length}
            onChange={(total) => updateRoster(withCounts(roster, total, cpuCount))}
          />
        </div>
        <div className="split-line">
          <span>CPU</span>
          <Stepper
            label="CPU"
            min={0}
            max={Math.max(0, roster.length - 1)}
            value={cpuCount}
            onChange={(count) => updateRoster(withCounts(roster, roster.length, count))}
          />
        </div>
        <div className="stack">
          {roster.map((player, index) => (
            <div className="player-row" key={player.id}>
              <button
                type="button"
                className="swatch"
                style={{ background: player.color }}
                aria-label={`${player.name || `${index + 1}人目`}の色を変える`}
                onClick={() => {
                  const at = PALETTE.indexOf(player.color);
                  const color = PALETTE[(at + 1 + PALETTE.length) % PALETTE.length] ?? PALETTE[0];
                  updateRoster(roster.map((item) => (item.id === player.id ? { ...item, color } : item)));
                }}
              />
              {player.cpu ? (
                <div className="cpu-name">
                  <span>{player.name}</span>
                  <span className="cpu-tag">CPU</span>
                </div>
              ) : (
                <input
                  className="name-input"
                  value={player.name}
                  maxLength={12}
                  aria-label={`${index + 1}人目の名前`}
                  placeholder={`${index + 1}人目`}
                  onChange={(event) =>
                    updateRoster(roster.map((item) => (item.id === player.id ? { ...item, name: event.target.value } : item)))
                  }
                />
              )}
              <button
                type="button"
                className="icon-btn"
                disabled={roster.length <= 3 || (!player.cpu && humanCount <= 1)}
                onClick={() => updateRoster(roster.filter((item) => item.id !== player.id))}
              >
                外す
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={roster.length >= 10}
          onClick={() => {
            const player = {
              id: uid(),
              name: freshHumanName(roster.map((item) => item.name)),
              color: PALETTE[roster.length % PALETTE.length] ?? PALETTE[0],
              cpu: false,
            };
            const at = roster.findIndex((item) => item.cpu);
            const next = at < 0 ? [...roster, player] : [...roster.slice(0, at), player, ...roster.slice(at)];
            updateRoster(next);
          }}
        >
          人を足す
        </button>
        <p className="fine">
          人間は{humanCount}人、CPUは{cpuCount}人。CPUは札を見ず、議論と投票をします。色の丸を押すと色が変わります。
        </p>
      </Section>

      <Section kicker="02" title="役">
        <div className="role-math">
          <div>
            <strong className={citizens < 2 ? "warn" : ""}>{Math.max(0, citizens)}</strong>
            <span>市民</span>
          </div>
          <div>
            <strong>{config.wolfCount}</strong>
            <span>ウルフ</span>
          </div>
          <div>
            <strong>{blanks}</strong>
            <span>空白</span>
          </div>
        </div>
        <div className="split-line">
          <span>ウルフの人数</span>
          <Stepper label="ウルフ" min={1} max={wolfMax} value={Math.min(config.wolfCount, wolfMax)} onChange={(wolfCount) => patch({ wolfCount })} />
        </div>
        <div className="stack">
          <Switch
            checked={config.includeBlank}
            label="空白を入れる"
            description="1人だけお題がありません。生き残って市民の言葉を当てると空白の勝ちです。"
            onChange={(includeBlank) => patch({ includeBlank })}
          />
          <Switch
            checked={config.huntAllWolves}
            label="ウルフは全員追放"
            description="ウルフが複数のとき、市民を誤って出すまで投票を続けます。"
            onChange={(huntAllWolves) => patch({ huntAllWolves })}
          />
        </div>
      </Section>

      <Section kicker="03" title="お題">
        <div className="chips">
          <button type="button" className={config.categories.length === 0 ? "chip on" : "chip"} onClick={() => patch({ categories: [] })}>
            すべて
          </button>
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={config.categories.includes(category) ? "chip on" : "chip"}
              onClick={() => {
                const has = config.categories.includes(category);
                const next = has ? config.categories.filter((item) => item !== category) : [...config.categories, category];
                patch({ categories: next });
              }}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="seg">
          {(
            [
              ["mix", "ミックス"],
              ["easy", "やさしい"],
              ["normal", "ふつう"],
              ["hard", "まぎらわしい"],
            ] as const
          ).map(([id, label]) => (
            <button type="button" key={id} className={config.difficulty === id ? "on" : ""} onClick={() => patch({ difficulty: id })}>
              {label}
            </button>
          ))}
        </div>
        <Switch
          checked={config.includeCustom}
          label="オリジナルお題も混ぜる"
          description="自分で追加した言葉を、選んだ条件に合うとき混ぜます。"
          onChange={(includeCustom) => patch({ includeCustom })}
        />
        <p className="fine">この条件で {deck.length}組。同じ言葉は、デッキを一周するまで出ません。</p>
      </Section>

      <Section kicker="04" title="議論と投票">
        <div className="seg">
          {TIMERS.map((timer) => (
            <button type="button" key={timer.sec} className={config.timerSec === timer.sec ? "on" : ""} onClick={() => patch({ timerSec: timer.sec })}>
              {timer.label}
            </button>
          ))}
        </div>
        <div className="stack">
          <Switch
            checked={config.showCategory}
            label="カテゴリを見せる"
            description="議論中、分類だけを卓に出します。言葉自体は出ません。"
            onChange={(showCategory) => patch({ showCategory })}
          />
          <Switch
            checked={config.secretVote}
            label="無記名投票"
            description="1人ずつ端末を渡して投票します。開票は結果のあとです。"
            onChange={(secretVote) => patch({ secretVote })}
          />
          <Switch
            checked={config.wolfGuessEnabled}
            label="ウルフの逆転推理"
            description="追放されたウルフが市民の言葉を当てると、ウルフの勝ちです。"
            onChange={(wolfGuessEnabled) => patch({ wolfGuessEnabled })}
          />
          <Switch
            checked={config.blankStealEnabled}
            label="空白の推理"
            description="ウルフの逆転が外れたあと、空白が言葉を当てると空白の勝ちです。"
            onChange={(blankStealEnabled) => patch({ blankStealEnabled })}
          />
        </div>
      </Section>

      <div className="dock">
        {problem ? <p className="warn center">{problem}</p> : <p className="fine center">準備ができています</p>}
        <button type="button" className="btn btn-primary" disabled={Boolean(problem)} onClick={onStart}>
          札を配る
        </button>
      </div>
    </section>
  );
}
