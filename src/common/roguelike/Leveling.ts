/**
 * Account-level leveling for the roguelike system.
 *
 * XP earned from runs is no longer spent directly on upgrades. Instead XP is
 * accumulated to gain levels (with a progressively increasing XP cost per
 * level), and each level grants upgrade points that are spent on the upgrade
 * tree. Level and upgrade points are always derived from `totalXP`, so nothing
 * extra needs to be persisted on the profile.
 */

/** Tunable constants for the leveling curve. */
export const LEVELING = {
  /** XP required to advance from level 0 to level 1. */
  BASE_LEVEL_COST: 100,
  /** Additional XP required for each subsequent level (linear progression). */
  LEVEL_COST_INCREMENT: 50,
  /** Upgrade points granted per level gained. */
  UPGRADE_POINTS_PER_LEVEL: 1,
} as const;

/** XP needed to advance from `level` to `level + 1`. */
export function xpToAdvanceFromLevel(level: number): number {
  return LEVELING.BASE_LEVEL_COST + Math.max(0, level) * LEVELING.LEVEL_COST_INCREMENT;
}

/** Total cumulative XP required to reach `level` from scratch. */
export function cumulativeXPForLevel(level: number): number {
  if (level <= 0) {
    return 0;
  }
  // Sum of an arithmetic series: BASE*level + INCREMENT * (0 + 1 + ... + level-1)
  return LEVELING.BASE_LEVEL_COST * level + LEVELING.LEVEL_COST_INCREMENT * (level * (level - 1)) / 2;
}

/** Current level for a given amount of accumulated XP. */
export function getLevel(totalXP: number): number {
  if (totalXP <= 0) {
    return 0;
  }
  let level = 0;
  while (totalXP >= cumulativeXPForLevel(level + 1)) {
    level++;
  }
  return level;
}

/** Progress toward the next level, for display. */
export interface LevelProgress {
  /** Current level. */
  level: number;
  /** Total XP accumulated. */
  totalXP: number;
  /** XP earned since reaching the current level. */
  xpIntoCurrentLevel: number;
  /** XP required to advance from the current level to the next. */
  xpForNextLevel: number;
  /** XP still needed to reach the next level. */
  xpToNextLevel: number;
}

/** Compute level progress details from accumulated XP. */
export function getLevelProgress(totalXP: number): LevelProgress {
  const level = getLevel(totalXP);
  const currentBase = cumulativeXPForLevel(level);
  const xpForNextLevel = xpToAdvanceFromLevel(level);
  const xpIntoCurrentLevel = totalXP - currentBase;
  return {
    level,
    totalXP,
    xpIntoCurrentLevel,
    xpForNextLevel,
    xpToNextLevel: xpForNextLevel - xpIntoCurrentLevel,
  };
}

/** Total upgrade points earned across all levels for the given XP. */
export function getTotalUpgradePoints(totalXP: number): number {
  return getLevel(totalXP) * LEVELING.UPGRADE_POINTS_PER_LEVEL;
}
