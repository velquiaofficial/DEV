import { PAIRS } from "../src/words.ts";
import {
  acknowledgeCard,
  alivePlayers,
  castVote,
  confirmHandoff,
  continueFromExile,
  createRound,
  DEFAULT_CONFIG,
  flipCard,
  castCpuVote,
  makeRoster,
  matchesWord,
  nextHumanIndex,
  withCounts,
  normalizeAnswer,
  openBlankGuess,
  openWolfGuess,
  pickPair,
  setupError,
  startVote,
  submitBlankGuess,
  submitCpuWolfGuess,
  submitWolfGuess,
} from "../src/logic.ts";
import type { PlayState, Player, Role } from "../src/types.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function person(id: string, role: Role): Player {
  const word = role === "wolf" ? "刺身" : role === "citizen" ? "寿司" : null;
  const reading = role === "wolf" ? "さしみ" : role === "citizen" ? "すし" : null;
  return { id, name: id, color: "#d7b16a", cpu: false, role, word, reading };
}

function table(players: Player[], config: Partial<PlayState["config"]> = {}): PlayState {
  return {
    phase: "vote",
    roundNumber: 1,
    config: { ...DEFAULT_CONFIG, secretVote: false, ...config },
    pair: {
      id: "test",
      category: "食べ物",
      difficulty: "normal",
      citizen: "寿司",
      citizenRead: "すし",
      wolf: "刺身",
      wolfRead: "さしみ",
    },
    players,
    revealIndex: 0,
    flipped: false,
    awaitingHandoff: false,
    executedIds: [],
    votes: {},
    voteCursor: 0,
    revotePool: null,
    revoteUsed: false,
    exilePlayerId: null,
    wolfGuess: "",
    blankGuess: "",
    result: null,
    executionLog: [],
    discussEndsAt: null,
    discussPausedMs: null,
    discussStartedAt: null,
  };
}

function voteOut(state: PlayState, targetId: string): PlayState {
  let next = state;
  const voters = alivePlayers(next);
  for (const voter of voters) {
    const fallback = voters.find((player) => player.id !== voter.id);
    assert(fallback, "投票先がありません");
    const choice = voter.id === targetId ? fallback.id : targetId;
    next = castVote(next, choice);
  }
  return next;
}

const ids = PAIRS.map((pair) => pair.id);
assert(new Set(ids).size === ids.length, "お題IDが重複しています");
assert(PAIRS.length >= 150, `お題が少なすぎます: ${PAIRS.length}`);
for (const pair of PAIRS) {
  const same =
    normalizeAnswer(pair.citizen) === normalizeAnswer(pair.wolf) ||
    normalizeAnswer(pair.citizenRead) === normalizeAnswer(pair.wolfRead) ||
    normalizeAnswer(pair.citizen) === normalizeAnswer(pair.wolfRead) ||
    normalizeAnswer(pair.citizenRead) === normalizeAnswer(pair.wolf);
  assert(!same, `同じ言葉のペアです: ${pair.id} ${pair.citizen}/${pair.wolf}`);
}

assert(matchesWord("ラーメンです", "ラーメン", "らーめん"), "ラーメンです");
assert(matchesWord("ラメン", "ラーメン", "らーめん"), "ラメン");
assert(matchesWord("らーめん", "ラーメン", "らーめん"), "らーめん");
assert(matchesWord("すし", "寿司", "すし"), "すし");
assert(matchesWord("めだか", "めだか", "めだか"), "めだか");
assert(!matchesWord("め", "めだか", "めだか"), "め は めだか ではない");
assert(!matchesWord("パン", "パンダ", "ぱんだ"), "パン は パンダ ではない");
assert(matchesWord("ぱんだ", "パンダ", "ぱんだ"), "ぱんだ");
assert(matchesWord("さかなです", "魚", "さかな"), "さかなです");
assert(!matchesWord("さか", "魚", "さかな"), "さか");
assert(matchesWord("かも", "鴨", "かも"), "かも");
assert(!matchesWord("うどん", "ラーメン", "らーめん"), "うどん");

const ramen = {
  id: "a",
  category: "食べ物",
  difficulty: "normal" as const,
  citizen: "ラーメン",
  citizenRead: "らーめん",
  wolf: "うどん",
  wolfRead: "うどん",
};
const udon = {
  id: "b",
  category: "食べ物",
  difficulty: "hard" as const,
  citizen: "うどん",
  citizenRead: "うどん",
  wolf: "そば",
  wolfRead: "そば",
};
const sushi = {
  id: "c",
  category: "食べ物",
  difficulty: "normal" as const,
  citizen: "寿司",
  citizenRead: "すし",
  wolf: "刺身",
  wolfRead: "さしみ",
};
const picked = pickPair([ramen, udon, sushi], [ramen, udon, sushi], ["a"]);
assert(picked?.pair.id === "c", "使った言葉と重なるお題を避けられていません");

const roster = makeRoster(["あおい", "れん", "ひな", "そうた", "けん"]);
for (let i = 0; i < 30; i += 1) {
  const created = createRound({
    roster,
    config: { ...DEFAULT_CONFIG, wolfCount: 2, includeBlank: true },
    custom: [],
    usedPairIds: [],
    roundNumber: 1,
  });
  assert(!("error" in created), "配役に失敗しました");
  if ("error" in created) continue;
  const wolves = created.state.players.filter((player) => player.role === "wolf");
  const citizens = created.state.players.filter((player) => player.role === "citizen");
  const blanks = created.state.players.filter((player) => player.role === "blank");
  assert(wolves.length === 2 && citizens.length === 2 && blanks.length === 1, "役の人数");
  assert(new Set(citizens.map((player) => player.word)).size === 1, "市民の言葉が割れています");
  assert(citizens[0]?.word === created.state.pair.citizen, "市民の言葉");
  assert(wolves[0]?.word === created.state.pair.wolf, "ウルフの言葉");
  assert(citizens[0]?.word !== wolves[0]?.word, "市民とウルフが同じ言葉");
  assert(blanks[0]?.word === null, "空白に言葉があります");
}

assert(setupError(makeRoster(["a", "b", "c"]), { ...DEFAULT_CONFIG, includeBlank: true }, 10), "3人空白は不可");

let reveal = createRound({
  roster: makeRoster(["あおい", "れん", "ひな", "そうた"]),
  config: DEFAULT_CONFIG,
  custom: [],
  usedPairIds: [],
  roundNumber: 1,
});
assert(!("error" in reveal), "配札");
if (!("error" in reveal)) {
  let state = reveal.state;
  for (let i = 0; i < state.players.length; i += 1) {
    state = flipCard(state);
    const last = state.revealIndex === state.players.length - 1;
    state = acknowledgeCard(state);
    if (!last) {
      assert(state.awaitingHandoff, "手渡し画面がありません");
      state = confirmHandoff(state);
    }
  }
  assert(state.phase === "discuss", "議論に進めていません");
  state = startVote(state);
  assert(state.phase === "voteCover", "無記名の表紙がありません");
}

const citizensWin = voteOut(
  table([person("a", "citizen"), person("b", "citizen"), person("c", "citizen"), person("d", "wolf")]),
  "d",
);
assert(citizensWin.phase === "wolfGuessCover", "ウルフ追放後に推理へ");
const missed = submitWolfGuess(openWolfGuess(citizensWin), "うどん");
assert(missed.result?.kind === "citizens", "推理失敗は市民の勝ち");
assert(missed.result?.points.a === 2 && missed.result?.points.d === 0, "市民の得点");

const reversed = submitWolfGuess(openWolfGuess(citizensWin), "すし");
assert(reversed.result?.kind === "wolves-reversal", "逆転");
assert(reversed.result?.points.d === 4, "逆転の得点");

const hidden = voteOut(
  table([person("a", "citizen"), person("b", "citizen"), person("c", "citizen"), person("d", "wolf")]),
  "a",
);
assert(hidden.result?.kind === "wolves-hide", "市民追放はウルフの勝ち");
assert(hidden.result?.points.d === 3, "潜伏の得点");

const self = table([person("a", "citizen"), person("b", "citizen"), person("c", "citizen"), person("d", "wolf")]);
assert(castVote(self, "a") === self, "自分への投票は無効");

let tie = table([person("a", "citizen"), person("b", "citizen"), person("c", "citizen"), person("d", "wolf")]);
tie = castVote(tie, "b");
tie = castVote(tie, "a");
tie = castVote(tie, "b");
tie = castVote(tie, "a");
assert(tie.revoteUsed && tie.phase === "vote", "同票で再投票");
tie = castVote(tie, "b");
tie = castVote(tie, "a");
tie = castVote(tie, "b");
tie = castVote(tie, "a");
assert(tie.result?.kind === "wolves-hide", "再同票はウルフの勝ち");

let blank = voteOut(
  table(
    [person("a", "citizen"), person("b", "citizen"), person("c", "wolf"), person("d", "blank")],
    { includeBlank: true },
  ),
  "c",
);
assert(blank.phase === "wolfGuessCover", "空白戦の推理");
blank = submitWolfGuess(openWolfGuess(blank), "ちがう");
assert(blank.phase === "blankGuessCover", "空白の番");
blank = submitBlankGuess(openBlankGuess(blank), "寿司");
assert(blank.result?.kind === "blank", "空白の勝ち");
assert(blank.result?.points.d === 5 && blank.result?.points.a === 1 && blank.result?.points.c === 0, "空白の得点");

let hunt = voteOut(
  table(
    [person("a", "wolf"), person("b", "wolf"), person("c", "citizen"), person("d", "citizen")],
    { huntAllWolves: true },
  ),
  "a",
);
assert(hunt.phase === "exile", "まだウルフが残る");
hunt = voteOut(continueFromExile(hunt), "b");
assert(hunt.phase === "wolfGuessCover", "全員追放で推理");
hunt = submitWolfGuess(openWolfGuess(hunt), "ちがう");
assert(hunt.result?.kind === "citizens" && hunt.result.points.c === 2, "全員見つければ市民");

let collapsed = voteOut(
  table(
    [person("a", "wolf"), person("b", "wolf"), person("c", "citizen"), person("d", "citizen")],
    { huntAllWolves: true },
  ),
  "a",
);
collapsed = voteOut(continueFromExile(collapsed), "c");
assert(collapsed.result?.kind === "wolves-hide", "途中で市民を出すとウルフ");
assert(collapsed.result?.reason.includes("崩れた"), "理由");

const sized = withCounts(makeRoster(["あおい", "れん", "ひな"]), 5, 2);
assert(sized.length === 5 && sized.filter((player) => player.cpu).length === 2, "人数とCPU");
assert(sized.filter((player) => !player.cpu).length === 3, "人間が残る");
assert(nextHumanIndex(sized, 0) === 0, "最初の人間");
assert(nextHumanIndex([{ cpu: true }, { cpu: true }, { cpu: false }], 0) === 2, "CPUを飛ばす");

let cpuRound = table([
  person("a", "citizen"),
  { ...person("b", "citizen"), cpu: true },
  { ...person("c", "wolf"), cpu: true },
]);
cpuRound = castVote(cpuRound, "b");
const cpuVoted = castCpuVote(cpuRound);
assert(cpuVoted.votes.b && cpuVoted.votes.b !== "b", "CPUは自分に投票しない");

let skipCpu = table([person("h", "citizen"), { ...person("k", "citizen"), cpu: true }]);
skipCpu = { ...skipCpu, phase: "reveal", revealIndex: 0, flipped: true };
const discussed = acknowledgeCard(skipCpu);
assert(discussed.phase === "discuss", "CPUの札を飛ばして議論へ");

let guessing = table([
  person("a", "citizen"),
  { ...person("b", "wolf"), cpu: true },
  person("c", "citizen"),
]);
guessing = { ...guessing, phase: "wolfGuessCover", executedIds: ["b"] };
const guessed = submitCpuWolfGuess(guessing);
assert(guessed.phase === "result" && guessed.result?.wolfAsked, "CPUウルフが推理する");

console.log(`ok ${PAIRS.length} pairs`);
