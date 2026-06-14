import {CardName} from '../cards/CardName';
import {CardProgress, SerializedCardProgress} from './CardProgress';
import {UpgradeTreeState, calculateUpgradeBonuses} from './UpgradeTreeState';
import {getLevel, getTotalUpgradePoints} from './Leveling';
import {AscensionTreeState, ASCENSION_TREE} from './AscensionTree';
import {getEarnedAscensionPoints} from './AscensionPoints';

/**
 * Player's persistent roguelike progression profile.
 * Saved as JSON and persists across game sessions.
 */

/** Current profile schema version for migrations */
export const PROFILE_VERSION = 3;

/** Lifetime statistics for the profile */
export interface ProfileStats {
  totalRuns: number;
  totalWins: number;
  totalLosses: number;
  totalVP: number;
  totalCardsPlayed: number;
  totalTilesPlaced: number;
  highestVP: number;
  fastestWin: number | null; // generation count, null if never won
  currentWinStreak: number;
  longestWinStreak: number;
}

/** Creates default profile stats */
export function createProfileStats(): ProfileStats {
  return {
    totalRuns: 0,
    totalWins: 0,
    totalLosses: 0,
    totalVP: 0,
    totalCardsPlayed: 0,
    totalTilesPlaced: 0,
    highestVP: 0,
    fastestWin: null,
    currentWinStreak: 0,
    longestWinStreak: 0,
  };
}

/** Complete roguelike profile */
export interface RoguelikeProfile {
  /** Schema version for migrations */
  version: number;
  /** Profile unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Total XP accumulated */
  totalXP: number;
  /**
   * Number of times the player has ascended (prestiged). Also serves as the
   * profile's current ascension level.
   */
  ascensionCount: number;
  /**
   * Legacy: previously the selected linear ascension level. Retained for
   * backwards compatibility with older saves; no longer drives gameplay.
   * Ascension is now an upgrade tree (see `ascensionTree`).
   */
  ascensionLevel: number;
  /**
   * Total ascension points earned across all ascensions. Points are granted by
   * the explicit Ascend action (which resets the rest of the profile), not
   * derived from `totalXP`. Available points = this minus points already spent
   * on the ascension tree.
   */
  ascensionPoints: number;
  /** Upgrade tree state */
  upgradeTree: UpgradeTreeState;
  /** Ascension tree state (nodes bought with ascension points) */
  ascensionTree: AscensionTreeState;
  /** Per-card progress (serialized as array) */
  cardProgress: SerializedCardProgress[];
  /** Lifetime statistics across the entire profile (kept through ascensions) */
  stats: ProfileStats;
  /** Statistics for the current ascension cycle (reset on each ascend) */
  ascensionStats: ProfileStats;
  /** Timestamp of profile creation */
  createdAt: number;
  /** Timestamp of last update */
  updatedAt: number;
}

/** Generate a unique profile ID */
export function generateProfileId(): string {
  return 'profile_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/** Creates a new empty profile */
export function createProfile(name: string): RoguelikeProfile {
  const now = Date.now();
  return {
    version: PROFILE_VERSION,
    id: generateProfileId(),
    name,
    totalXP: 0,
    ascensionCount: 0,
    ascensionLevel: 0,
    ascensionPoints: 0,
    upgradeTree: {
      unlockedNodes: [],
      bannedCards: [],
    },
    ascensionTree: {
      unlockedNodes: [],
    },
    cardProgress: [],
    stats: createProfileStats(),
    ascensionStats: createProfileStats(),
    createdAt: now,
    updatedAt: now,
  };
}

/** Helper to get card progress from profile */
export function getCardProgress(profile: RoguelikeProfile, cardName: CardName): CardProgress | undefined {
  const entry = profile.cardProgress.find((cp) => cp.cardName === cardName);
  return entry?.progress;
}

/** Helper to set card progress in profile */
export function setCardProgress(profile: RoguelikeProfile, cardName: CardName, progress: CardProgress): void {
  const existingIndex = profile.cardProgress.findIndex((cp) => cp.cardName === cardName);
  if (existingIndex >= 0) {
    profile.cardProgress[existingIndex].progress = progress;
  } else {
    profile.cardProgress.push({cardName, progress});
  }
  profile.updatedAt = Date.now();
}

/** Current account level derived from accumulated XP. */
export function getProfileLevel(profile: RoguelikeProfile): number {
  return getLevel(profile.totalXP);
}

/** Upgrade points already spent unlocking tree nodes. */
export function getSpentUpgradePoints(profile: RoguelikeProfile): number {
  const {UPGRADE_TREE} = require('./UpgradeNode');
  return UPGRADE_TREE
    .filter((node: {id: string; cost: number}) => profile.upgradeTree.unlockedNodes.includes(node.id))
    .reduce((sum: number, node: {cost: number}) => sum + node.cost, 0);
}

/** Upgrade points available to spend (earned from leveling minus already spent). */
export function getAvailableUpgradePoints(profile: RoguelikeProfile): number {
  return getTotalUpgradePoints(profile.totalXP) - getSpentUpgradePoints(profile);
}

/**
 * Whether the player currently has the Ascension Protocol upgrade unlocked.
 * This gates the *Ascend* action (which resets the upgrade tree, removing this
 * unlock), so it must be re-bought before ascending again.
 */
export function isAscensionUnlocked(profile: RoguelikeProfile): boolean {
  return calculateUpgradeBonuses(profile.upgradeTree).ascensionUnlocked;
}

/**
 * Whether the ascension tree should be visible and spendable. Once a player has
 * unlocked ascension at least once (or already earned/banked ascension points),
 * they keep access to the ascension tree even after ascending resets the
 * Ascension Protocol upgrade.
 */
export function isAscensionTreeAvailable(profile: RoguelikeProfile): boolean {
  return isAscensionUnlocked(profile) ||
    (profile.ascensionCount ?? 0) > 0 ||
    (profile.ascensionPoints ?? 0) > 0;
}

/** Ascension points already spent unlocking ascension tree nodes. */
export function getSpentAscensionPoints(profile: RoguelikeProfile): number {
  const unlocked = profile.ascensionTree?.unlockedNodes ?? [];
  return ASCENSION_TREE
    .filter((node) => unlocked.includes(node.id))
    .reduce((sum, node) => sum + node.cost, 0);
}

/** Ascension points available to spend (lifetime earned minus already spent). */
export function getAvailableAscensionPoints(profile: RoguelikeProfile): number {
  return (profile.ascensionPoints ?? 0) - getSpentAscensionPoints(profile);
}

/**
 * Ascension points the player would earn by ascending right now, based on the
 * XP accumulated this cycle. This is what gets converted into permanent
 * ascension points (and added to `ascensionPoints`) when ascending.
 */
export function getPendingAscensionPoints(profile: RoguelikeProfile): number {
  return getEarnedAscensionPoints(profile.totalXP);
}

/**
 * Whether the player may ascend: they must have unlocked Ascension Protocol and
 * have accumulated enough XP this cycle to earn at least one ascension point.
 */
export function canAscend(profile: RoguelikeProfile): boolean {
  return isAscensionUnlocked(profile) && getPendingAscensionPoints(profile) >= 1;
}

/** Validate profile structure */
export function isValidProfile(obj: unknown): obj is RoguelikeProfile {
  if (typeof obj !== 'object' || obj === null) return false;
  const profile = obj as Record<string, unknown>;

  return (
    typeof profile.version === 'number' &&
    typeof profile.id === 'string' &&
    typeof profile.name === 'string' &&
    typeof profile.totalXP === 'number' &&
    typeof profile.ascensionLevel === 'number' &&
    typeof profile.ascensionPoints === 'number' &&
    typeof profile.upgradeTree === 'object' &&
    Array.isArray(profile.cardProgress) &&
    typeof profile.stats === 'object'
  );
}
