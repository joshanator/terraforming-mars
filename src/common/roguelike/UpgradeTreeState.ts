import {CardName} from '../cards/CardName';
import {calculateTotalBonus, UpgradeBonusType, UpgradeNodeId} from './UpgradeNode';

/**
 * Current state of the player's upgrade tree.
 * Tracks which nodes are unlocked and provides computed bonuses.
 */
export interface UpgradeTreeState {
  /** Set of unlocked node IDs */
  unlockedNodes: UpgradeNodeId[];
  /** Cards the player has chosen to ban */
  bannedCards: CardName[];
}

/** Creates a new empty upgrade tree state */
export function createUpgradeTreeState(): UpgradeTreeState {
  return {
    unlockedNodes: [],
    bannedCards: [],
  };
}

/** Computed bonuses from the upgrade tree */
export interface ComputedUpgradeBonuses {
  startingTRBonus: number;
  startingMCBonus: number;
  startingSteelBonus: number;
  startingTitaniumBonus: number;
  corporationChoices: number;
  preludeSlots: number;
  preludeChoices: number;
  extraCardDraw: number;
  maxBanSlots: number;
  generationBonus: number;
  ascensionUnlocked: boolean;
}

/** Calculate all bonuses from current upgrade tree state */
export function calculateUpgradeBonuses(state: UpgradeTreeState): ComputedUpgradeBonuses {
  const unlockedSet = new Set(state.unlockedNodes);

  return {
    startingTRBonus: calculateTotalBonus(UpgradeBonusType.STARTING_TR, unlockedSet),
    startingMCBonus: calculateTotalBonus(UpgradeBonusType.STARTING_MC, unlockedSet),
    startingSteelBonus: calculateTotalBonus(UpgradeBonusType.STARTING_STEEL, unlockedSet),
    startingTitaniumBonus: calculateTotalBonus(UpgradeBonusType.STARTING_TITANIUM, unlockedSet),
    corporationChoices: calculateTotalBonus(UpgradeBonusType.CORPORATION_CHOICES, unlockedSet),
    preludeSlots: calculateTotalBonus(UpgradeBonusType.PRELUDE_SLOTS, unlockedSet),
    preludeChoices: calculateTotalBonus(UpgradeBonusType.PRELUDE_CHOICES, unlockedSet),
    extraCardDraw: calculateTotalBonus(UpgradeBonusType.CARD_DRAW, unlockedSet),
    maxBanSlots: calculateTotalBonus(UpgradeBonusType.CARD_BAN_SLOTS, unlockedSet),
    generationBonus: calculateTotalBonus(UpgradeBonusType.GENERATION, unlockedSet),
    ascensionUnlocked: calculateTotalBonus(UpgradeBonusType.UNLOCK_ASCENSION, unlockedSet) > 0,
  };
}

/** Calculate total upgrade points spent unlocking nodes */
export function calculateSpentUpgradePoints(state: UpgradeTreeState): number {
  const {UPGRADE_TREE} = require('./UpgradeNode');
  return UPGRADE_TREE
    .filter((node: {id: UpgradeNodeId; cost: number}) => state.unlockedNodes.includes(node.id))
    .reduce((sum: number, node: {cost: number}) => sum + node.cost, 0);
}
