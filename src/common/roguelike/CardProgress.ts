import {CardName} from '../cards/CardName';

/**
 * Per-card progression tracking for the roguelike system.
 *
 * A card levels up by being PLAYED a certain number of times (see
 * CARD_LEVEL_PLAY_THRESHOLDS). Each level grants 1 upgrade point, which the
 * player spends freely on that card's upgrades (see CardUpgrade.ts).
 */
export interface CardProgress {
  /** Number of times this card has been played across all runs (drives level) */
  timesPlayed: number;
  /** Current level, derived from timesPlayed. Each level grants 1 upgrade point. */
  level: number;
  /** Purchased upgrades: upgrade id -> ranks bought */
  upgrades: Record<string, number>;
  /** Cached: total M€ cost reduction from purchased upgrades */
  costReduction: number;
  /** Cached: bonus multiplier for card effects (reserved; 1.0 = none) */
  bonusMultiplier: number;
  /**
   * Cached: whether this card is permanently banned via its own "Ban Card"
   * upgrade. A self-banned card never appears in runs and does NOT consume a
   * wildcard ban slot from the upgrade tree.
   */
  canBan: boolean;
  /** Cached: bonus to deck position (higher = more likely in opening hand) */
  deckPositionBonus: number;
  /** Cached: guaranteed to appear in starting project cards */
  mastered: boolean;
}

/**
 * Cumulative plays required to reach each level.
 * Index = level, value = total plays needed. Level 0 is the starting level.
 */
export const CARD_LEVEL_PLAY_THRESHOLDS: ReadonlyArray<number> = [
  0,   // Level 0
  2,   // Level 1
  5,   // Level 2
  9,   // Level 3
  14,  // Level 4
  20,  // Level 5
  27,  // Level 6
  35,  // Level 7
  44,  // Level 8
  54,  // Level 9
  65,  // Level 10
];

/** Maximum attainable card level */
export const MAX_CARD_LEVEL = CARD_LEVEL_PLAY_THRESHOLDS.length - 1;

/** Creates a new CardProgress with default values */
export function createCardProgress(): CardProgress {
  return {
    timesPlayed: 0,
    level: 0,
    upgrades: {},
    costReduction: 0,
    bonusMultiplier: 1.0,
    canBan: false,
    deckPositionBonus: 0,
    mastered: false,
  };
}

/** Calculate level from number of times played */
export function calculateCardLevel(timesPlayed: number): number {
  let level = 0;
  for (let i = CARD_LEVEL_PLAY_THRESHOLDS.length - 1; i >= 0; i--) {
    if (timesPlayed >= CARD_LEVEL_PLAY_THRESHOLDS[i]) {
      level = i;
      break;
    }
  }
  return level;
}

/** Plays needed to reach the next level, or undefined if at max level */
export function playsToNextLevel(timesPlayed: number): number | undefined {
  const level = calculateCardLevel(timesPlayed);
  if (level >= MAX_CARD_LEVEL) {
    return undefined;
  }
  return CARD_LEVEL_PLAY_THRESHOLDS[level + 1] - timesPlayed;
}

/**
 * Scale play counts by an ascension card-progress multiplier.
 * Always awards at least the raw plays recorded this run.
 */
export function applyCardProgressMultiplier(plays: number, multiplier: number): number {
  if (plays <= 0 || multiplier <= 1) {
    return plays;
  }
  return Math.max(plays, Math.round(plays * multiplier));
}

/**
 * Record that a card was played `plays` times, updating timesPlayed and level.
 * Does NOT change purchased upgrades.
 */
export function recordCardPlays(progress: CardProgress, plays: number): CardProgress {
  const timesPlayed = progress.timesPlayed + plays;
  return {
    ...progress,
    timesPlayed,
    level: calculateCardLevel(timesPlayed),
    upgrades: progress.upgrades ?? {},
  };
}

/** Serialized format for CardProgress map */
export interface SerializedCardProgress {
  cardName: CardName;
  progress: CardProgress;
}
