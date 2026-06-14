/**
 * Ascension-point progression for the roguelike system.
 *
 * Ascension points are earned through accumulated XP on a progressive curve
 * that is intentionally steeper than the account-leveling curve: each
 * successive ascension point requires more XP than the one before it, so
 * later ascensions take more progress to reach. Points are always derived
 * from `totalXP`; nothing extra is persisted.
 *
 * There is no maximum number of ascension points.
 */

/** Tunable constants for the ascension-point curve. */
export const ASCENSION_POINTS = {
  /** XP required to earn the first ascension point. */
  BASE_COST: 1000,
  /** Additional XP required for each subsequent ascension point (linear progression). */
  COST_INCREMENT: 500,
} as const;

/** XP needed to earn the next ascension point when you currently have `points`. */
export function xpToEarnAscensionPoint(points: number): number {
  return ASCENSION_POINTS.BASE_COST + Math.max(0, points) * ASCENSION_POINTS.COST_INCREMENT;
}

/** Total cumulative XP required to have earned `points` ascension points. */
export function cumulativeXPForAscensionPoints(points: number): number {
  if (points <= 0) {
    return 0;
  }
  // Arithmetic series: BASE*points + INCREMENT * (0 + 1 + ... + points-1)
  return ASCENSION_POINTS.BASE_COST * points + ASCENSION_POINTS.COST_INCREMENT * (points * (points - 1)) / 2;
}

/** Total ascension points earned for a given amount of accumulated XP. */
export function getEarnedAscensionPoints(totalXP: number): number {
  if (totalXP <= 0) {
    return 0;
  }
  let points = 0;
  while (totalXP >= cumulativeXPForAscensionPoints(points + 1)) {
    points++;
  }
  return points;
}

/** Progress toward the next ascension point, for display. */
export interface AscensionPointProgress {
  /** Total ascension points earned so far. */
  earned: number;
  /** Total XP accumulated. */
  totalXP: number;
  /** XP earned since the last ascension point. */
  xpIntoCurrent: number;
  /** XP required to earn the next ascension point. */
  xpForNext: number;
  /** XP still needed to earn the next ascension point. */
  xpToNext: number;
}

/** Compute ascension-point progress details from accumulated XP. */
export function getAscensionPointProgress(totalXP: number): AscensionPointProgress {
  const earned = getEarnedAscensionPoints(totalXP);
  const currentBase = cumulativeXPForAscensionPoints(earned);
  const xpForNext = xpToEarnAscensionPoint(earned);
  const xpIntoCurrent = totalXP - currentBase;
  return {
    earned,
    totalXP,
    xpIntoCurrent,
    xpForNext,
    xpToNext: xpForNext - xpIntoCurrent,
  };
}
