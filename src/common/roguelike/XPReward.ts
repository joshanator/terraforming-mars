import {CardName} from '../cards/CardName';

/**
 * XP reward calculation for post-game progression.
 */

/** Breakdown of XP earned from a single run */
export interface XPReward {
  /** XP from final victory points */
  vpXP: number;
  /** XP from cards played */
  cardsPlayedXP: number;
  /** XP from tiles placed */
  tilesPlacedXP: number;
  /** XP bonus for each completed global parameter */
  parameterBonusXP: number;
  /** Base XP before win / streak multipliers (VP + cards + tiles + parameters) */
  baseXP: number;
  /** Multiplier applied to base XP when the run is a win (1 if lost) */
  winMultiplier: number;
  /** Multiplier from consecutive wins (1 if no streak bonus) */
  winStreakMultiplier: number;
  /** Win streak after this run (0 if lost or aborted without a win) */
  winStreak: number;
  /** Multiplier from ascension level */
  ascensionMultiplier: number;
  /** Multiplier applied when aborting early (1 = no penalty) */
  abortPenaltyMultiplier: number;
  /** Total XP after win/streak multipliers, before ascension/abort */
  subtotal: number;
  /** Final total XP earned */
  total: number;
}

/** Complete XP summary for a run */
export interface RunXPSummary {
  /** Profile-level XP reward */
  profileXP: XPReward;
  /** Unique cards played this run (for per-card progress tracking) */
  cardsProgressed: CardName[];
  /** Raw run statistics, used to update lifetime profile stats */
  runStats: RunStats;
}

/** Constants for XP calculation */
export const XP_CONSTANTS = {
  /** Shared exponent for count → XP power curves (>1 rewards high totals more). */
  XP_CURVE_EXPONENT: 1.5,
  /** VP curve: ~90 earned VP is a good payout, ~150 is exceptional. */
  VP_XP_REFERENCE_COUNT: 90,
  VP_XP_REFERENCE_XP: 90,
  /** Cards curve: ~20 cards played is good, ~35 is exceptional. */
  CARDS_XP_REFERENCE_COUNT: 20,
  CARDS_XP_REFERENCE_XP: 20,
  /** Tiles curve: ~12 tiles placed is good, ~20 is exceptional. */
  TILES_XP_REFERENCE_COUNT: 12,
  TILES_XP_REFERENCE_XP: 24,
  /** XP per completed global parameter (temp, oxygen, ocean) */
  XP_PER_PARAMETER: 50,
  /** Multiplier applied to base XP when the run is a win */
  WIN_XP_MULTIPLIER: 2,
  /** Additional streak multiplier per consecutive win beyond the first */
  WIN_STREAK_XP_MULTIPLIER_PER_WIN: 0.25,
  /** XP multiplier when aborting a run early */
  ABORT_XP_MULTIPLIER: 0.5,
} as const;

/** Run statistics needed for XP calculation */
export interface RunStats {
  finalVP: number;
  /** VP from starting TR (excluded from XP calculation) */
  startingVP: number;
  cardsPlayed: number;
  tilesPlaced: number;
  temperatureMaxed: boolean;
  oxygenMaxed: boolean;
  oceansMaxed: boolean;
  venusMaxed: boolean;
  won: boolean;
  /** Consecutive wins after this run (0 if the run was not a win) */
  winStreak: number;
  cardsPlayedList: CardName[];
}

/** Streak multiplier on base XP (2+ consecutive wins in the current ascension cycle). */
export function calculateWinStreakMultiplier(won: boolean, winStreak: number): number {
  if (!won || winStreak < 2) {
    return 1;
  }
  return 1 + (winStreak - 1) * XP_CONSTANTS.WIN_STREAK_XP_MULTIPLIER_PER_WIN;
}

/**
 * XP from a count-based stat using a power curve calibrated at a reference point.
 */
export function calculateCurvedXP(
  count: number,
  referenceCount: number,
  referenceXP: number,
  exponent: number = XP_CONSTANTS.XP_CURVE_EXPONENT,
): number {
  if (count <= 0) {
    return 0;
  }
  const coefficient = referenceXP / Math.pow(referenceCount, exponent);
  return Math.floor(coefficient * Math.pow(count, exponent));
}

/** XP from earned victory points (final VP minus starting TR). */
export function calculateVPXP(earnedVP: number): number {
  return calculateCurvedXP(
    earnedVP,
    XP_CONSTANTS.VP_XP_REFERENCE_COUNT,
    XP_CONSTANTS.VP_XP_REFERENCE_XP,
  );
}

/** XP from cards played this run. */
export function calculateCardsPlayedXP(cardsPlayed: number): number {
  return calculateCurvedXP(
    cardsPlayed,
    XP_CONSTANTS.CARDS_XP_REFERENCE_COUNT,
    XP_CONSTANTS.CARDS_XP_REFERENCE_XP,
  );
}

/** XP from tiles placed this run. */
export function calculateTilesPlacedXP(tilesPlaced: number): number {
  return calculateCurvedXP(
    tilesPlaced,
    XP_CONSTANTS.TILES_XP_REFERENCE_COUNT,
    XP_CONSTANTS.TILES_XP_REFERENCE_XP,
  );
}

/**
 * Calculate XP reward for a completed run.
 * @param ascensionMultiplier The run's XP multiplier, derived from the player's
 * unlocked ascension tree (1.0 = no ascension bonus).
 */
export function calculateXPReward(
  stats: RunStats,
  ascensionMultiplier: number,
  aborted: boolean = false,
): XPReward {
  const earnedVP = Math.max(0, stats.finalVP - stats.startingVP);
  const vpXP = calculateVPXP(earnedVP);
  const cardsPlayedXP = calculateCardsPlayedXP(stats.cardsPlayed);
  const tilesPlacedXP = calculateTilesPlacedXP(stats.tilesPlaced);

  let completedParams = 0;
  if (stats.temperatureMaxed) completedParams++;
  if (stats.oxygenMaxed) completedParams++;
  if (stats.oceansMaxed) completedParams++;
  if (stats.venusMaxed) completedParams++;

  const parameterBonusXP = completedParams * XP_CONSTANTS.XP_PER_PARAMETER;
  const baseXP = vpXP + cardsPlayedXP + tilesPlacedXP + parameterBonusXP;
  const winMultiplier = stats.won ? XP_CONSTANTS.WIN_XP_MULTIPLIER : 1;
  const winStreakMultiplier = calculateWinStreakMultiplier(stats.won, stats.winStreak);

  const subtotal = Math.floor(baseXP * winMultiplier * winStreakMultiplier);
  const abortPenaltyMultiplier = aborted ? XP_CONSTANTS.ABORT_XP_MULTIPLIER : 1;
  const total = Math.floor(subtotal * ascensionMultiplier * abortPenaltyMultiplier);

  return {
    vpXP,
    cardsPlayedXP,
    tilesPlacedXP,
    parameterBonusXP,
    baseXP,
    winMultiplier,
    winStreakMultiplier,
    winStreak: stats.won ? stats.winStreak : 0,
    ascensionMultiplier,
    abortPenaltyMultiplier,
    subtotal,
    total,
  };
}

/** Unique cards played during a run */
export function getUniqueCardsPlayed(cardsPlayed: CardName[]): CardName[] {
  return Array.from(new Set(cardsPlayed));
}

/** Calculate complete XP summary for a run */
export function calculateRunXPSummary(
  stats: RunStats,
  ascensionMultiplier: number,
  aborted: boolean = false,
): RunXPSummary {
  return {
    profileXP: calculateXPReward(stats, ascensionMultiplier, aborted),
    cardsProgressed: getUniqueCardsPlayed(stats.cardsPlayedList),
    runStats: stats,
  };
}
