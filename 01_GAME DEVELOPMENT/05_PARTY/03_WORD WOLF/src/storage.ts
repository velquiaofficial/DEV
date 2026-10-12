import type { GameConfig, RoundResult, Stats, WordPair } from "./types";
import { DEFAULT_CONFIG, STARTER_NAMES } from "./logic";

const SETTINGS_KEY = "word-wolf.settings";
const CUSTOM_KEY = "word-wolf.custom";
const STATS_KEY = "word-wolf.stats";
const MUTED_KEY = "word-wolf.muted";

export const EMPTY_STATS: Stats = {
  rounds: 0,
  citizenWins: 0,
  wolfWins: 0,
  blankWins: 0,
  players: {},
};

function readJson(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export type Seat = { name: string; cpu: boolean };

export function loadSettings(): { config: GameConfig; names: string[]; seats: Seat[] } {
  const fallbackSeats = STARTER_NAMES.map((name) => ({ name, cpu: false }));
  const fallback = { config: DEFAULT_CONFIG, names: [...STARTER_NAMES], seats: fallbackSeats };
  const parsed = readJson(SETTINGS_KEY) as { config?: Partial<GameConfig>; names?: unknown; seats?: unknown } | null;
  if (!parsed || typeof parsed !== "object") return fallback;
  const config = { ...DEFAULT_CONFIG, ...(parsed.config ?? {}) };
  if (!Array.isArray(config.categories)) config.categories = [];
  config.categories = config.categories.filter((item) => typeof item === "string");
  if (!["easy", "normal", "hard", "mix"].includes(config.difficulty)) config.difficulty = "mix";
  config.wolfCount = Math.max(1, Math.min(8, Number(config.wolfCount) || 1));
  config.timerSec = [0, 60, 120, 180, 300].includes(Number(config.timerSec)) ? Number(config.timerSec) : 180;
  config.includeBlank = Boolean(config.includeBlank);
  config.includeCustom = Boolean(config.includeCustom);
  config.showCategory = Boolean(config.showCategory);
  config.wolfGuessEnabled = config.wolfGuessEnabled !== false;
  config.blankStealEnabled = config.blankStealEnabled !== false;
  config.huntAllWolves = Boolean(config.huntAllWolves);
  config.secretVote = config.secretVote !== false;
  const names = Array.isArray(parsed.names)
    ? parsed.names.filter((name): name is string => typeof name === "string").slice(0, 10)
    : [];
  const seats = Array.isArray(parsed.seats)
    ? parsed.seats
        .filter((seat): seat is { name: string; cpu?: boolean } => {
          return Boolean(seat) && typeof seat === "object" && typeof (seat as { name?: unknown }).name === "string";
        })
        .slice(0, 10)
        .map((seat) => ({ name: seat.name, cpu: Boolean(seat.cpu) }))
    : names.map((name) => ({ name, cpu: false }));
  const ready = seats.length >= 3 ? seats : fallback.seats;
  return { config, names: ready.map((seat) => seat.name), seats: ready };
}

export function saveSettings(settings: { config: GameConfig; names: string[]; seats: Seat[] }) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function isPair(value: unknown): value is WordPair {
  if (!value || typeof value !== "object") return false;
  const pair = value as WordPair;
  return (
    typeof pair.id === "string" &&
    typeof pair.citizen === "string" &&
    typeof pair.wolf === "string" &&
    typeof pair.category === "string" &&
    (pair.difficulty === "easy" || pair.difficulty === "normal" || pair.difficulty === "hard")
  );
}

export function loadCustom(): WordPair[] {
  const parsed = readJson(CUSTOM_KEY);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(isPair).map((pair) => ({
    ...pair,
    citizenRead: pair.citizenRead || pair.citizen,
    wolfRead: pair.wolfRead || pair.wolf,
    custom: true,
  }));
}

export function saveCustom(pairs: WordPair[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(pairs));
}

export function loadStats(): Stats {
  const parsed = readJson(STATS_KEY) as Partial<Stats> | null;
  if (!parsed || typeof parsed !== "object") return { ...EMPTY_STATS, players: {} };
  const players: Stats["players"] = {};
  if (parsed.players && typeof parsed.players === "object") {
    for (const [name, row] of Object.entries(parsed.players)) {
      if (!row || typeof row !== "object") continue;
      players[name] = {
        points: Number(row.points) || 0,
        rounds: Number(row.rounds) || 0,
        wins: Number(row.wins) || 0,
      };
    }
  }
  return {
    rounds: Number(parsed.rounds) || 0,
    citizenWins: Number(parsed.citizenWins) || 0,
    wolfWins: Number(parsed.wolfWins) || 0,
    blankWins: Number(parsed.blankWins) || 0,
    players,
  };
}

export function saveStats(stats: Stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export function recordStats(players: { id: string; name: string; role: "citizen" | "wolf" | "blank" }[], result: RoundResult) {
  const stats = loadStats();
  stats.rounds += 1;
  if (result.kind === "citizens") stats.citizenWins += 1;
  else if (result.kind === "blank") stats.blankWins += 1;
  else stats.wolfWins += 1;
  for (const player of players) {
    const name = player.name.trim();
    const row = stats.players[name] ?? { points: 0, rounds: 0, wins: 0 };
    row.rounds += 1;
    row.points += result.points[player.id] ?? 0;
    const won =
      (result.kind === "citizens" && player.role === "citizen") ||
      (result.kind === "blank" && player.role === "blank") ||
      ((result.kind === "wolves-hide" || result.kind === "wolves-reversal") && player.role === "wolf");
    if (won) row.wins += 1;
    stats.players[name] = row;
  }
  saveStats(stats);
}

export function loadMuted(): boolean {
  return localStorage.getItem(MUTED_KEY) === "1";
}

export function saveMuted(muted: boolean) {
  localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
}
