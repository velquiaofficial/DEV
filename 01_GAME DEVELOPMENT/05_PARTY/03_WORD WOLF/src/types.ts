export type Difficulty = "easy" | "normal" | "hard";

export type Role = "citizen" | "wolf" | "blank";

export type WinKind = "citizens" | "wolves-hide" | "wolves-reversal" | "blank";

export type WordPair = {
  id: string;
  category: string;
  difficulty: Difficulty;
  citizen: string;
  citizenRead: string;
  wolf: string;
  wolfRead: string;
  custom?: boolean;
};

export type RosterPlayer = {
  id: string;
  name: string;
  color: string;
  cpu: boolean;
};

export type Player = {
  id: string;
  name: string;
  color: string;
  cpu: boolean;
  role: Role;
  word: string | null;
  reading: string | null;
};

export type GameConfig = {
  wolfCount: number;
  includeBlank: boolean;
  categories: string[];
  difficulty: Difficulty | "mix";
  includeCustom: boolean;
  timerSec: number;
  showCategory: boolean;
  wolfGuessEnabled: boolean;
  blankStealEnabled: boolean;
  huntAllWolves: boolean;
  secretVote: boolean;
};

export type ExecutionRecord = {
  playerId: string | null;
  votes: Record<string, string>;
  counts: Record<string, number>;
};

export type RoundResult = {
  kind: WinKind;
  title: string;
  reason: string;
  executionLog: ExecutionRecord[];
  wolfGuess: string;
  wolfGuessCorrect: boolean;
  wolfAsked: boolean;
  blankGuess: string;
  blankGuessCorrect: boolean;
  blankAsked: boolean;
  points: Record<string, number>;
};

export type PlayPhase =
  | "reveal"
  | "discuss"
  | "voteCover"
  | "vote"
  | "exile"
  | "wolfGuessCover"
  | "wolfGuess"
  | "blankGuessCover"
  | "blankGuess"
  | "result";

export type PlayState = {
  phase: PlayPhase;
  roundNumber: number;
  config: GameConfig;
  pair: WordPair;
  players: Player[];
  revealIndex: number;
  flipped: boolean;
  awaitingHandoff: boolean;
  executedIds: string[];
  votes: Record<string, string>;
  voteCursor: number;
  revotePool: string[] | null;
  revoteUsed: boolean;
  exilePlayerId: string | null;
  wolfGuess: string;
  blankGuess: string;
  result: RoundResult | null;
  executionLog: ExecutionRecord[];
  discussEndsAt: number | null;
  discussPausedMs: number | null;
  discussStartedAt: number | null;
};

export type Stats = {
  rounds: number;
  citizenWins: number;
  wolfWins: number;
  blankWins: number;
  players: Record<string, { points: number; rounds: number; wins: number }>;
};
