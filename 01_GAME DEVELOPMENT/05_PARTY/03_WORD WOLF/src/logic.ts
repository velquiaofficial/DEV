import type {
  ExecutionRecord,
  GameConfig,
  PlayState,
  Player,
  Role,
  RosterPlayer,
  RoundResult,
  WinKind,
  WordPair,
} from "./types";
import { PAIRS } from "./words";

export const PALETTE = [
  "#d7b16a",
  "#7ea2d6",
  "#d4655d",
  "#6eafa4",
  "#c98bc4",
  "#e09a62",
  "#8fba6a",
  "#e2c56a",
  "#8d93d8",
  "#d9899e",
];

export const STARTER_NAMES = ["あおい", "れん", "ひな", "そうた"];
export const HUMAN_NAMES = ["あおい", "れん", "ひな", "そうた", "けん", "まい", "ゆう", "さくら", "りく", "はるか"];
export const CPU_NAMES = ["カイ", "リン", "ソウ", "ユイ", "ノア", "ミオ", "ツバサ"];

export const DEFAULT_CONFIG: GameConfig = {
  wolfCount: 1,
  includeBlank: false,
  categories: [],
  difficulty: "mix",
  includeCustom: true,
  timerSec: 180,
  showCategory: false,
  wolfGuessEnabled: true,
  blankStealEnabled: true,
  huntAllWolves: false,
  secretVote: true,
};

const POLITE_SUFFIXES = ["かもしれません", "でしょう", "ですよ", "だった", "だよ", "だね", "ですね", "です", "かも"];

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function makeRoster(names: string[]): RosterPlayer[] {
  return rosterFromSeats(names.map((name) => ({ name, cpu: false })));
}

export function rosterFromSeats(seats: { name: string; cpu?: boolean }[]): RosterPlayer[] {
  return seats.map((seat, index) => ({
    id: uid(),
    name: seat.name,
    color: PALETTE[index % PALETTE.length] ?? PALETTE[0],
    cpu: Boolean(seat.cpu),
  }));
}

export function freshHumanName(used: string[]): string {
  return HUMAN_NAMES.find((name) => !used.includes(name)) ?? `なまえ${used.length + 1}`;
}

function takeCpuName(index: number, used: Set<string>): string {
  const base = CPU_NAMES[index] ?? `CPU${index + 1}`;
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}${suffix}`)) suffix += 1;
  return `${base}${suffix}`;
}

export function withCounts(roster: RosterPlayer[], total: number, cpuCount: number): RosterPlayer[] {
  const size = Math.max(3, Math.min(10, total));
  const cpus = Math.max(0, Math.min(cpuCount, size - 1));
  const humans = size - cpus;
  let next = roster.map((player) => ({ ...player }));
  while (next.length < size) {
    next.push({
      id: uid(),
      name: freshHumanName(next.map((player) => player.name)),
      color: PALETTE[next.length % PALETTE.length] ?? PALETTE[0],
      cpu: false,
    });
  }
  next = next.slice(0, size);
  const used = new Set<string>();
  return next.map((player, index) => {
    const cpu = index >= humans;
    if (!cpu) {
      const name = player.cpu || !player.name.trim() ? freshHumanName([...used]) : player.name;
      used.add(name);
      return { ...player, cpu: false, name };
    }
    const name = takeCpuName(index - humans, used);
    used.add(name);
    return { ...player, cpu: true, name };
  });
}

export function nextHumanIndex(players: { cpu?: boolean }[], start: number): number {
  for (let index = start; index < players.length; index += 1) {
    if (!players[index]?.cpu) return index;
  }
  return -1;
}

export function normalizeAnswer(input: string): string {
  let text = input.trim().normalize("NFKC").toLowerCase();
  text = text.replace(/[\s　・･.。、,，!！?？~〜～\-‐−－―]/g, "");
  text = text.replace(/[\u30a1-\u30f6]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));
  text = text.replace(/ー/g, "");
  for (const suffix of POLITE_SUFFIXES) {
    if (text.endsWith(suffix) && text.length - suffix.length >= 2) {
      text = text.slice(0, -suffix.length);
      break;
    }
  }
  return text;
}

export function matchesWord(guess: string, surface: string, reading: string): boolean {
  const normalized = normalizeAnswer(guess);
  if (!normalized) return false;
  return [surface, reading].some((target) => normalizeAnswer(target) === normalized);
}

export function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = next[i];
    next[i] = next[j]!;
    next[j] = temp!;
  }
  return next;
}

export function collectPairs(custom: WordPair[], config: GameConfig): WordPair[] {
  const source = [...PAIRS, ...(config.includeCustom ? custom : [])];
  return source.filter((pair) => {
    const categoryOk = config.categories.length === 0 || config.categories.includes(pair.category);
    const difficultyOk = config.difficulty === "mix" || pair.difficulty === config.difficulty;
    return categoryOk && difficultyOk;
  });
}

export function maxWolfCount(playerCount: number, includeBlank: boolean): number {
  return playerCount - (includeBlank ? 1 : 0) - 2;
}

export function setupError(roster: RosterPlayer[], config: GameConfig, deckCount: number): string | null {
  const names = roster.map((player) => player.name.trim());
  if (names.length < 3) return "3人以上で遊べます";
  if (names.length > 10) return "一度に遊べるのは10人までです";
  if (roster.filter((player) => !player.cpu).length < 1) return "人間が1人は必要です";
  if (names.some((name) => name.length === 0)) return "空欄の名前があります";
  if (new Set(names).size !== names.length) return "同じ名前の人がいます";
  if (config.wolfCount < 1) return "ウルフは1人以上必要です";
  if (maxWolfCount(names.length, config.includeBlank) < config.wolfCount) {
    return config.includeBlank
      ? "空白を入れるときは、市民が2人残る人数にしてください"
      : "市民が2人残るように、ウルフの人数を減らしてください";
  }
  if (deckCount <= 0) return "この条件のお題がありません";
  return null;
}

export function roleLabel(role: Role): string {
  if (role === "wolf") return "ウルフ";
  if (role === "blank") return "空白";
  return "市民";
}

export function difficultyLabel(difficulty: WordPair["difficulty"]): string {
  if (difficulty === "easy") return "やさしい";
  if (difficulty === "hard") return "まぎらわしい";
  return "ふつう";
}

export function winnerSide(kind: WinKind): "citizens" | "wolves" | "blank" {
  if (kind === "citizens") return "citizens";
  if (kind === "blank") return "blank";
  return "wolves";
}

export function pickPair(
  deck: WordPair[],
  catalog: WordPair[],
  usedIds: string[],
): { pair: WordPair; usedPairIds: string[] } | null {
  if (deck.length === 0) return null;
  const usedWords = new Set<string>();
  for (const id of usedIds) {
    const previous = catalog.find((pair) => pair.id === id);
    if (!previous) continue;
    usedWords.add(normalizeAnswer(previous.citizen));
    usedWords.add(normalizeAnswer(previous.wolf));
  }
  const fresh = deck.filter((pair) => {
    if (usedIds.includes(pair.id)) return false;
    return !usedWords.has(normalizeAnswer(pair.citizen)) && !usedWords.has(normalizeAnswer(pair.wolf));
  });
  const unused = deck.filter((pair) => !usedIds.includes(pair.id));
  const pool = fresh.length > 0 ? fresh : unused.length > 0 ? unused : deck;
  const pair = pool[Math.floor(Math.random() * pool.length)];
  if (!pair) return null;
  const reset = fresh.length === 0 && unused.length === 0;
  return { pair, usedPairIds: reset ? [pair.id] : [...usedIds, pair.id] };
}

export function isSamePair(
  left: { citizen: string; wolf: string },
  right: { citizen: string; wolf: string },
): boolean {
  return (
    normalizeAnswer(left.citizen) === normalizeAnswer(right.citizen) &&
    normalizeAnswer(left.wolf) === normalizeAnswer(right.wolf)
  );
}

function emptyPlay(partial: Pick<PlayState, "config" | "pair" | "players" | "roundNumber">): PlayState {
  return {
    phase: "reveal",
    roundNumber: partial.roundNumber,
    config: partial.config,
    pair: partial.pair,
    players: partial.players,
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

export function createRound(args: {
  roster: RosterPlayer[];
  config: GameConfig;
  custom: WordPair[];
  usedPairIds: string[];
  roundNumber: number;
}): { state: PlayState; usedPairIds: string[] } | { error: string } {
  const deck = collectPairs(args.custom, args.config);
  const invalid = setupError(args.roster, args.config, deck.length);
  if (invalid) return { error: invalid };
  const catalog = [...PAIRS, ...args.custom];
  const picked = pickPair(deck, catalog, args.usedPairIds);
  if (!picked) return { error: "お題を用意できませんでした" };
  const blankCount = args.config.includeBlank ? 1 : 0;
  const citizenCount = args.roster.length - args.config.wolfCount - blankCount;
  const roles = shuffle<Role>([
    ...Array.from({ length: args.config.wolfCount }, (): Role => "wolf"),
    ...Array.from({ length: blankCount }, (): Role => "blank"),
    ...Array.from({ length: citizenCount }, (): Role => "citizen"),
  ]);
  const players: Player[] = args.roster.map((person, index) => {
    const role = roles[index] ?? "citizen";
    if (role === "wolf") {
      return {
        id: person.id,
        name: person.name.trim(),
        color: person.color,
        cpu: person.cpu,
        role,
        word: picked.pair.wolf,
        reading: picked.pair.wolfRead,
      };
    }
    if (role === "citizen") {
      return {
        id: person.id,
        name: person.name.trim(),
        color: person.color,
        cpu: person.cpu,
        role,
        word: picked.pair.citizen,
        reading: picked.pair.citizenRead,
      };
    }
    return {
      id: person.id,
      name: person.name.trim(),
      color: person.color,
      cpu: person.cpu,
      role,
      word: null,
      reading: null,
    };
  });
  const state = emptyPlay({
    config: args.config,
    pair: picked.pair,
    players,
    roundNumber: args.roundNumber,
  });
  const firstHuman = nextHumanIndex(players, 0);
  return {
    state: { ...state, revealIndex: firstHuman < 0 ? 0 : firstHuman },
    usedPairIds: picked.usedPairIds,
  };
}

export function alivePlayers(state: PlayState): Player[] {
  return state.players.filter((player) => !state.executedIds.includes(player.id));
}

export function currentVoter(state: PlayState): Player | null {
  return alivePlayers(state)[state.voteCursor] ?? null;
}

export function voteTargets(state: PlayState, voterId: string): Player[] {
  const pool = new Set(state.revotePool ?? alivePlayers(state).map((player) => player.id));
  return state.players.filter(
    (player) => pool.has(player.id) && player.id !== voterId && !state.executedIds.includes(player.id),
  );
}

export type CpuRemark = { id: string; name: string; color: string; text: string; atMs: number };

const CPU_LINES: Record<string, string[]> = {
  食べ物: ["口に入るものだと思う", "食事のときに出てきそう", "温かいときも冷たいときもある", "店で見た記憶がある", "味の好みが分かれそう", "一人でもいけそう"],
  飲み物: ["喉を通るものだと思う", "食卓にありそう", "冷やすと印象が変わる", "コップに入る", "朝と夜で違う気がする", "甘い方向かもしれない"],
  動物: ["生き物だと思う", "動くものだ", "鳴き声があるかもしれない", "外で見かける", "大きさはばらつきそう", "人になつく種類もある"],
  場所: ["人が行くところだと思う", "建物か、その外か", "移動して着く場所", "一人でも行ける", "地図に載っていそう", "目的があって行く"],
  職業: ["人がやる仕事だと思う", "どこかで働いている", "道具を使うかもしれない", "お客さんがいそう", "毎日やる人と、たまにやる人がいる", "名前を聞いたことがある"],
  学校: ["教室の近くにありそう", "勉強と関係がある", "学生が触る", "机か、その外か", "テストに出てきそう", "先生も知っている"],
  暮らし: ["家の中にありそう", "毎日ではないかもしれない", "手で扱える", "生活の中で出てくる", "あると便利", "部屋のどこかに置きそう"],
  スポーツ: ["体を動かす話だと思う", "勝負がつきそう", "道具があるかもしれない", "見る人もいる", "一人か、複数か", "汗をかきそう"],
  エンタメ: ["見て楽しむものだと思う", "音か、絵か、物語か", "家でも外でも", "好き嫌いが分かれそう", "時間を使う", "名前は有名そう"],
  自然: ["外にあるものだと思う", "人が作ったものではない気がする", "天気と関係がありそう", "触れるかどうか", "季節で印象が変わる", "景色の一部"],
  乗り物: ["移動に使うものだと思う", "人が乗る", "速いときと遅いときがある", "道か、空か、水か", "音がしそう", "目的地がある"],
  イベント: ["人が集まる話だと思う", "日付と関係がありそう", "祝いごとかもしれない", "年に何度か", "準備がある", "思い出になりそう"],
  ことば: ["形があるものではない気がする", "気持ちに近い", "人のあいだにある", "目には見えない", "会話で出てくる", "大事にされそう"],
  その他: ["身近なものだと思う", "名前は知っている", "人によって印象が違う", "毎日ではない", "どこかで見た", "説明すると長くなる"],
};

function mix(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function cpuRemarks(players: Player[], category: string): CpuRemark[] {
  const lines = CPU_LINES[category] ?? CPU_LINES.その他 ?? [];
  const remarks: CpuRemark[] = [];
  players
    .filter((player) => player.cpu)
    .forEach((player, index) => {
      const firstAt = mix(`${player.id}:a`) % lines.length;
      let secondAt = mix(`${player.id}:b`) % lines.length;
      if (secondAt === firstAt) secondAt = (secondAt + 1) % lines.length;
      const first = lines[firstAt];
      const second = lines[secondAt];
      if (first) remarks.push({ id: player.id, name: player.name, color: player.color, text: first, atMs: 4000 + index * 1800 });
      if (second) remarks.push({ id: player.id, name: player.name, color: player.color, text: second, atMs: 14000 + index * 1800 });
    });
  return remarks;
}

export function wolfGuessByCpu(state: PlayState): boolean {
  const wolves = state.players.filter((player) => player.role === "wolf" && state.executedIds.includes(player.id));
  return wolves.length > 0 && wolves.every((player) => player.cpu);
}

export function blankGuessByCpu(state: PlayState): boolean {
  const blank = state.players.find((player) => player.role === "blank");
  return Boolean(blank?.cpu && !state.executedIds.includes(blank.id));
}

function hitChance(difficulty: string, kind: "wolf" | "blank", showCategory: boolean): number {
  const wolf = difficulty === "easy" ? 0.72 : difficulty === "hard" ? 0.28 : 0.48;
  const blank = difficulty === "easy" ? 0.22 : difficulty === "hard" ? 0.08 : 0.14;
  const chance = kind === "wolf" ? wolf : blank;
  return kind === "blank" && !showCategory ? chance * 0.5 : chance;
}

function cpuGuessText(state: PlayState, kind: "wolf" | "blank"): string {
  const chance = hitChance(state.pair.difficulty, kind, state.config.showCategory);
  if (Math.random() < chance) return state.pair.citizen;
  const banned = new Set([normalizeAnswer(state.pair.citizen), normalizeAnswer(state.pair.wolf)]);
  const same = PAIRS.filter((pair) => pair.category === state.pair.category);
  const source = same.length > 0 ? same : PAIRS;
  const words = [...new Set(source.flatMap((pair) => [pair.citizen, pair.wolf]).filter((word) => !banned.has(normalizeAnswer(word))))];
  return words[Math.floor(Math.random() * words.length)] ?? "";
}

function chooseCpuTarget(state: PlayState, targets: Player[]): Player | null {
  if (targets.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const id of Object.values(state.votes)) counts[id] = (counts[id] ?? 0) + 1;
  const least = Math.min(...targets.map((player) => counts[player.id] ?? 0));
  const calm = targets.filter((player) => (counts[player.id] ?? 0) === least);
  const pool = Math.random() < 0.7 ? calm : targets;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export function castCpuVote(state: PlayState): PlayState {
  if (state.phase !== "vote" && state.phase !== "voteCover") return state;
  const opened = state.phase === "voteCover" ? { ...state, phase: "vote" as const } : state;
  const voter = currentVoter(opened);
  if (!voter?.cpu) return state;
  const target = chooseCpuTarget(opened, voteTargets(opened, voter.id));
  if (!target) return state;
  return castVote(opened, target.id);
}

export function submitCpuWolfGuess(state: PlayState): PlayState {
  if (state.phase !== "wolfGuess" && state.phase !== "wolfGuessCover") return state;
  if (!wolfGuessByCpu(state)) return state;
  const opened = { ...state, phase: "wolfGuess" as const };
  return submitWolfGuess(opened, cpuGuessText(opened, "wolf"));
}

export function submitCpuBlankGuess(state: PlayState): PlayState {
  if (state.phase !== "blankGuess" && state.phase !== "blankGuessCover") return state;
  if (!blankGuessByCpu(state)) return state;
  const opened = { ...state, phase: "blankGuess" as const };
  return submitBlankGuess(opened, cpuGuessText(opened, "blank"));
}

export function flipCard(state: PlayState): PlayState {
  if (state.phase !== "reveal") return state;
  return { ...state, flipped: true };
}

export function hideCard(state: PlayState): PlayState {
  if (state.phase !== "reveal") return state;
  return { ...state, flipped: false };
}

function beginDiscuss(state: PlayState): PlayState {
  const now = Date.now();
  const seconds = state.config.timerSec;
  return {
    ...state,
    phase: "discuss",
    flipped: false,
    awaitingHandoff: false,
    discussStartedAt: now,
    discussEndsAt: seconds > 0 ? now + seconds * 1000 : null,
    discussPausedMs: null,
  };
}

export function acknowledgeCard(state: PlayState): PlayState {
  if (state.phase !== "reveal" || !state.flipped || state.awaitingHandoff) return state;
  const next = nextHumanIndex(state.players, state.revealIndex + 1);
  if (next < 0) return beginDiscuss(state);
  return {
    ...state,
    revealIndex: next,
    flipped: false,
    awaitingHandoff: true,
  };
}

export function confirmHandoff(state: PlayState): PlayState {
  if (state.phase !== "reveal" || !state.awaitingHandoff) return state;
  return { ...state, awaitingHandoff: false, flipped: false };
}

export function togglePause(state: PlayState): PlayState {
  if (state.phase !== "discuss") return state;
  const now = Date.now();
  if (state.config.timerSec <= 0) {
    if (state.discussPausedMs != null) {
      return { ...state, discussStartedAt: now - state.discussPausedMs, discussPausedMs: null };
    }
    const elapsed = now - (state.discussStartedAt ?? now);
    return { ...state, discussPausedMs: elapsed, discussStartedAt: null };
  }
  if (state.discussPausedMs != null) {
    return { ...state, discussEndsAt: now + state.discussPausedMs, discussPausedMs: null };
  }
  const remaining = Math.max(0, (state.discussEndsAt ?? now) - now);
  return { ...state, discussPausedMs: remaining, discussEndsAt: null };
}

export function addDiscussTime(state: PlayState, ms = 30_000): PlayState {
  if (state.phase !== "discuss" || state.config.timerSec <= 0) return state;
  if (state.discussPausedMs != null) return { ...state, discussPausedMs: state.discussPausedMs + ms };
  if (state.discussEndsAt != null) {
    const base = Math.max(Date.now(), state.discussEndsAt);
    return { ...state, discussEndsAt: base + ms };
  }
  return state;
}

export function startVote(state: PlayState): PlayState {
  if (state.phase !== "discuss") return state;
  return {
    ...state,
    phase: state.config.secretVote ? "voteCover" : "vote",
    votes: {},
    voteCursor: 0,
    revotePool: null,
    revoteUsed: false,
  };
}

export function openBallot(state: PlayState): PlayState {
  if (state.phase !== "voteCover") return state;
  return { ...state, phase: "vote" };
}

export function openWolfGuess(state: PlayState): PlayState {
  if (state.phase !== "wolfGuessCover") return state;
  return { ...state, phase: "wolfGuess" };
}

export function openBlankGuess(state: PlayState): PlayState {
  if (state.phase !== "blankGuessCover") return state;
  return { ...state, phase: "blankGuess" };
}

export function continueFromExile(state: PlayState): PlayState {
  if (state.phase !== "exile") return state;
  return {
    ...state,
    phase: state.config.secretVote ? "voteCover" : "vote",
    votes: {},
    voteCursor: 0,
    revotePool: null,
    revoteUsed: false,
    exilePlayerId: null,
  };
}

function computePoints(players: Player[], kind: WinKind): Record<string, number> {
  const points: Record<string, number> = {};
  for (const player of players) {
    let score = 0;
    if (kind === "citizens" && player.role === "citizen") score = 2;
    if (kind === "wolves-hide" && player.role === "wolf") score = 3;
    if (kind === "wolves-reversal" && player.role === "wolf") score = 4;
    if (kind === "blank" && player.role === "blank") score = 5;
    if (kind === "blank" && player.role === "citizen") score = 1;
    points[player.id] = score;
  }
  return points;
}

function buildResult(
  state: PlayState,
  fields: {
    kind: WinKind;
    title: string;
    reason: string;
    wolfGuess?: string;
    wolfGuessCorrect?: boolean;
    wolfAsked?: boolean;
    blankGuess?: string;
    blankGuessCorrect?: boolean;
    blankAsked?: boolean;
    executionLog?: ExecutionRecord[];
  },
): PlayState {
  const executionLog = fields.executionLog ?? state.executionLog;
  const wolfGuess = fields.wolfGuess ?? state.wolfGuess;
  const blankGuess = fields.blankGuess ?? state.blankGuess;
  const result: RoundResult = {
    kind: fields.kind,
    title: fields.title,
    reason: fields.reason,
    executionLog,
    wolfGuess,
    wolfGuessCorrect: fields.wolfGuessCorrect ?? false,
    wolfAsked: fields.wolfAsked ?? false,
    blankGuess,
    blankGuessCorrect: fields.blankGuessCorrect ?? false,
    blankAsked: fields.blankAsked ?? false,
    points: computePoints(state.players, fields.kind),
  };
  return {
    ...state,
    phase: "result",
    result,
    executionLog,
    wolfGuess,
    blankGuess,
    exilePlayerId: null,
  };
}

function tally(votes: Record<string, string>, pool: string[]) {
  const counts: Record<string, number> = {};
  for (const id of pool) counts[id] = 0;
  for (const target of Object.values(votes)) {
    if (target in counts) counts[target] = (counts[target] ?? 0) + 1;
  }
  const max = pool.reduce((best, id) => Math.max(best, counts[id] ?? 0), 0);
  const leaders = pool.filter((id) => counts[id] === max);
  return {
    tie: leaders.length !== 1,
    leaders,
    executedId: leaders.length === 1 ? (leaders[0] ?? null) : null,
    counts,
  };
}

function wolvesRemain(state: PlayState, executedIds: string[]): boolean {
  return state.players.some((player) => player.role === "wolf" && !executedIds.includes(player.id));
}

function blankRemains(state: PlayState, executedIds: string[]): boolean {
  return state.players.some((player) => player.role === "blank" && !executedIds.includes(player.id));
}

function caughtWolfCount(state: PlayState, executedIds: string[]): number {
  return state.players.filter((player) => player.role === "wolf" && executedIds.includes(player.id)).length;
}

function resolveExecution(state: PlayState, executed: Player): PlayState {
  const executedIds = state.executedIds;
  if (executed.role === "citizen") {
    const foundEarlier = caughtWolfCount(
      state,
      executedIds.filter((id) => id !== executed.id),
    );
    return buildResult(state, {
      kind: "wolves-hide",
      title: "ウルフの勝ち",
      reason:
        foundEarlier > 0
          ? `${executed.name}さんは市民だった。ウルフを見つけていたのに、ここで崩れた。`
          : `${executed.name}さんは市民だった。ウルフは最後まで紛れていた。`,
    });
  }

  if (executed.role === "blank") {
    if (state.config.huntAllWolves && wolvesRemain(state, executedIds)) {
      return { ...state, phase: "exile", exilePlayerId: executed.id, votes: {} };
    }
    return buildResult(state, {
      kind: "wolves-hide",
      title: "ウルフの勝ち",
      reason: `${executed.name}さんは空白だった。ウルフは見逃された。`,
    });
  }

  if (state.config.huntAllWolves && wolvesRemain(state, executedIds)) {
    return { ...state, phase: "exile", exilePlayerId: executed.id, votes: {} };
  }
  if (state.config.wolfGuessEnabled) {
    return { ...state, phase: "wolfGuessCover" };
  }
  if (state.config.blankStealEnabled && state.config.includeBlank && blankRemains(state, executedIds)) {
    return { ...state, phase: "blankGuessCover" };
  }
  return buildResult(state, {
    kind: "citizens",
    title: "市民の勝ち",
    reason: `${executed.name}さんはウルフだった。言葉は守り切った。`,
  });
}

export function castVote(state: PlayState, targetId: string): PlayState {
  if (state.phase !== "vote") return state;
  const alive = alivePlayers(state);
  const voter = alive[state.voteCursor];
  if (!voter || voter.id === targetId) return state;
  const allowed = voteTargets(state, voter.id).some((player) => player.id === targetId);
  if (!allowed) return state;

  const votes = { ...state.votes, [voter.id]: targetId };
  const nextCursor = state.voteCursor + 1;
  if (nextCursor < alive.length) {
    return {
      ...state,
      votes,
      voteCursor: nextCursor,
      phase: state.config.secretVote ? "voteCover" : "vote",
    };
  }

  const pool = state.revotePool ?? alive.map((player) => player.id);
  const outcome = tally(votes, pool);
  if (outcome.tie) {
    const log: ExecutionRecord[] = [
      ...state.executionLog,
      { playerId: null, votes, counts: outcome.counts },
    ];
    if (state.revoteUsed || outcome.leaders.length < 2) {
      return buildResult(
        { ...state, votes, executionLog: log },
        {
          kind: "wolves-hide",
          title: "ウルフの勝ち",
          reason: "同票が解けず、だれも追放できなかった。",
          executionLog: log,
        },
      );
    }
    return {
      ...state,
      votes: {},
      voteCursor: 0,
      revotePool: outcome.leaders,
      revoteUsed: true,
      phase: state.config.secretVote ? "voteCover" : "vote",
      executionLog: log,
    };
  }

  const executedId = outcome.executedId;
  if (!executedId) return state;
  const executed = state.players.find((player) => player.id === executedId);
  if (!executed) return state;
  const executedIds = [...state.executedIds, executedId];
  const log: ExecutionRecord[] = [...state.executionLog, { playerId: executedId, votes, counts: outcome.counts }];
  return resolveExecution(
    {
      ...state,
      votes,
      executedIds,
      executionLog: log,
      revotePool: null,
      revoteUsed: false,
      voteCursor: 0,
    },
    executed,
  );
}

export function submitWolfGuess(state: PlayState, text: string): PlayState {
  if (state.phase !== "wolfGuess") return state;
  const correct = matchesWord(text, state.pair.citizen, state.pair.citizenRead);
  if (correct) {
    return buildResult(state, {
      kind: "wolves-reversal",
      title: "逆転。ウルフの勝ち",
      reason: `追放されながら、市民の言葉「${state.pair.citizen}」を言い当てた。`,
      wolfGuess: text.trim(),
      wolfGuessCorrect: true,
      wolfAsked: true,
    });
  }
  if (state.config.blankStealEnabled && state.config.includeBlank && blankRemains(state, state.executedIds)) {
    return { ...state, phase: "blankGuessCover", wolfGuess: text.trim() };
  }
  const spoken = text.trim();
  return buildResult(state, {
    kind: "citizens",
    title: "市民の勝ち",
    reason: spoken
      ? `ウルフは追放された。推理「${spoken}」は当たらなかった。`
      : "ウルフは追放された。市民の言葉は出なかった。",
    wolfGuess: spoken,
    wolfGuessCorrect: false,
    wolfAsked: true,
  });
}

export function submitBlankGuess(state: PlayState, text: string): PlayState {
  if (state.phase !== "blankGuess") return state;
  const correct = matchesWord(text, state.pair.citizen, state.pair.citizenRead);
  const spoken = text.trim();
  if (correct) {
    return buildResult(state, {
      kind: "blank",
      title: "空白の勝ち",
      reason: `ウルフは捕まった。空白が市民の言葉「${state.pair.citizen}」を見抜いた。`,
      wolfGuess: state.wolfGuess,
      wolfGuessCorrect: false,
      wolfAsked: state.config.wolfGuessEnabled,
      blankGuess: spoken,
      blankGuessCorrect: true,
      blankAsked: true,
    });
  }
  return buildResult(state, {
    kind: "citizens",
    title: "市民の勝ち",
    reason: spoken
      ? `空白の推理「${spoken}」は外れた。市民が狼をあぶり出した。`
      : "空白は言葉を当てられなかった。市民の勝ち。",
    wolfGuess: state.wolfGuess,
    wolfGuessCorrect: false,
    wolfAsked: state.config.wolfGuessEnabled,
    blankGuess: spoken,
    blankGuessCorrect: false,
    blankAsked: true,
  });
}

export function playerById(state: PlayState, id: string | null): Player | null {
  if (!id) return null;
  return state.players.find((player) => player.id === id) ?? null;
}
