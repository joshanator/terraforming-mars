/**
 * Upgrade tree node definitions for the roguelike system.
 * Players spend XP to unlock nodes that provide permanent bonuses.
 */

/** Unique identifier for upgrade nodes */
export type UpgradeNodeId = string;

/** Categories of upgrades in the tree */
export enum UpgradeCategory {
  STARTING_RESOURCES = 'starting_resources',
  TERRAFORMING = 'terraforming',
  CORPORATIONS = 'corporations',
  PRELUDES = 'preludes',
  CARD_MANAGEMENT = 'card_management',
  EXPANSIONS = 'expansions',
  ASCENSION = 'ascension',
}

/** Types of bonuses an upgrade can provide */
export enum UpgradeBonusType {
  STARTING_TR = 'starting_tr',
  STARTING_MC = 'starting_mc',
  STARTING_STEEL = 'starting_steel',
  STARTING_TITANIUM = 'starting_titanium',
  STARTING_PLANTS = 'starting_plants',
  CORPORATION_CHOICES = 'corporation_choices',
  PRELUDE_SLOTS = 'prelude_slots',
  PRELUDE_CHOICES = 'prelude_choices',
  CARD_DRAW = 'card_draw',
  CARD_BAN_SLOTS = 'card_ban_slots',
  GENERATION = 'generation',
  UNLOCK_ASCENSION = 'unlock_ascension',
  UNLOCK_EXPANSION = 'unlock_expansion',
}

/** Definition of an upgrade node in the tree */
export interface UpgradeNode {
  id: UpgradeNodeId;
  name: string;
  description: string;
  category: UpgradeCategory;
  /** Upgrade-point cost to unlock this node (points are earned by leveling up) */
  cost: number;
  /** Node IDs that must be unlocked before this one */
  prerequisites: UpgradeNodeId[];
  /** The bonus this node provides */
  bonusType: UpgradeBonusType;
  /** Numeric value of the bonus */
  bonusValue: number;
  /** Position in the visual tree (for UI) */
  position: {x: number; y: number};
  /** When set, leveled nodes with the same chainId share one UI tile */
  chainId?: string;
  /** 1-based level within a chain */
  chainLevel?: number;
  /** Name shown on a shared tile (defaults to the first level's name without a suffix) */
  displayName?: string;
}

/** All upgrade nodes in the tree */
export const UPGRADE_TREE: ReadonlyArray<UpgradeNode> = [
  // Starting Resources Branch
  {
    id: 'tr_1',
    name: 'Terraforming Initiative I',
    displayName: 'Terraforming Initiative',
    description: '+1 Starting TR',
    category: UpgradeCategory.STARTING_RESOURCES,
    cost: 1,
    prerequisites: [],
    bonusType: UpgradeBonusType.STARTING_TR,
    bonusValue: 1,
    position: {x: 0, y: 0},
    chainId: 'tr',
    chainLevel: 1,
  },
  {
    id: 'tr_2',
    name: 'Terraforming Initiative II',
    description: '+1 Starting TR',
    category: UpgradeCategory.STARTING_RESOURCES,
    cost: 2,
    prerequisites: ['tr_1'],
    bonusType: UpgradeBonusType.STARTING_TR,
    bonusValue: 1,
    position: {x: 0, y: 0},
    chainId: 'tr',
    chainLevel: 2,
  },
  {
    id: 'tr_3',
    name: 'Terraforming Initiative III',
    description: '+1 Starting TR',
    category: UpgradeCategory.STARTING_RESOURCES,
    cost: 3,
    prerequisites: ['tr_2'],
    bonusType: UpgradeBonusType.STARTING_TR,
    bonusValue: 1,
    position: {x: 0, y: 0},
    chainId: 'tr',
    chainLevel: 3,
  },
  {
    id: 'mc_1',
    name: 'Seed Funding I',
    displayName: 'Seed Funding',
    description: '+5 Starting M€',
    category: UpgradeCategory.STARTING_RESOURCES,
    cost: 1,
    prerequisites: [],
    bonusType: UpgradeBonusType.STARTING_MC,
    bonusValue: 5,
    position: {x: 1, y: 0},
    chainId: 'mc',
    chainLevel: 1,
  },
  {
    id: 'mc_2',
    name: 'Seed Funding II',
    description: '+5 Starting M€',
    category: UpgradeCategory.STARTING_RESOURCES,
    cost: 2,
    prerequisites: ['mc_1'],
    bonusType: UpgradeBonusType.STARTING_MC,
    bonusValue: 5,
    position: {x: 1, y: 0},
    chainId: 'mc',
    chainLevel: 2,
  },
  {
    id: 'mc_3',
    name: 'Seed Funding III',
    description: '+5 Starting M€',
    category: UpgradeCategory.STARTING_RESOURCES,
    cost: 2,
    prerequisites: ['mc_2'],
    bonusType: UpgradeBonusType.STARTING_MC,
    bonusValue: 5,
    position: {x: 1, y: 0},
    chainId: 'mc',
    chainLevel: 3,
  },
  {
    id: 'mc_4',
    name: 'Seed Funding IV',
    description: '+5 Starting M€',
    category: UpgradeCategory.STARTING_RESOURCES,
    cost: 3,
    prerequisites: ['mc_3'],
    bonusType: UpgradeBonusType.STARTING_MC,
    bonusValue: 5,
    position: {x: 1, y: 0},
    chainId: 'mc',
    chainLevel: 4,
  },
  {
    id: 'steel_1',
    name: 'Steel Stockpile',
    description: '+2 Starting Steel',
    category: UpgradeCategory.STARTING_RESOURCES,
    cost: 1,
    prerequisites: ['mc_1'],
    bonusType: UpgradeBonusType.STARTING_STEEL,
    bonusValue: 2,
    position: {x: 2, y: 1},
  },
  {
    id: 'titanium_1',
    name: 'Titanium Reserve',
    description: '+2 Starting Titanium',
    category: UpgradeCategory.STARTING_RESOURCES,
    cost: 2,
    prerequisites: ['mc_1'],
    bonusType: UpgradeBonusType.STARTING_TITANIUM,
    bonusValue: 2,
    position: {x: 2, y: 2},
  },

  // Corporation Branch
  {
    id: 'corp_choices_1',
    name: 'Corporate Selection I',
    displayName: 'Corporate Selection',
    description: '+1 starting corporation option',
    category: UpgradeCategory.CORPORATIONS,
    cost: 1,
    prerequisites: [],
    bonusType: UpgradeBonusType.CORPORATION_CHOICES,
    bonusValue: 1,
    position: {x: 2, y: 3},
    chainId: 'corp_choices',
    chainLevel: 1,
  },
  {
    id: 'corp_choices_2',
    name: 'Corporate Selection II',
    description: '+1 starting corporation option',
    category: UpgradeCategory.CORPORATIONS,
    cost: 2,
    prerequisites: ['corp_choices_1'],
    bonusType: UpgradeBonusType.CORPORATION_CHOICES,
    bonusValue: 1,
    position: {x: 2, y: 3},
    chainId: 'corp_choices',
    chainLevel: 2,
  },

  // Prelude Branch
  {
    id: 'prelude_1',
    name: 'Prelude Access',
    displayName: 'Prelude Access',
    description: '+1 Prelude card',
    category: UpgradeCategory.PRELUDES,
    cost: 2,
    prerequisites: [],
    bonusType: UpgradeBonusType.PRELUDE_SLOTS,
    bonusValue: 1,
    position: {x: 3, y: 0},
    chainId: 'prelude_slots',
    chainLevel: 1,
  },
  {
    id: 'prelude_2',
    name: 'Dual Preludes',
    description: '+1 Prelude card',
    category: UpgradeCategory.PRELUDES,
    cost: 3,
    prerequisites: ['prelude_1'],
    bonusType: UpgradeBonusType.PRELUDE_SLOTS,
    bonusValue: 1,
    position: {x: 3, y: 0},
    chainId: 'prelude_slots',
    chainLevel: 2,
  },
  {
    id: 'prelude_3',
    name: 'Triple Preludes',
    description: '+1 Prelude card',
    category: UpgradeCategory.PRELUDES,
    cost: 4,
    prerequisites: ['prelude_2'],
    bonusType: UpgradeBonusType.PRELUDE_SLOTS,
    bonusValue: 1,
    position: {x: 3, y: 0},
    chainId: 'prelude_slots',
    chainLevel: 3,
  },
  {
    id: 'prelude_choices',
    name: 'Prelude Selection I',
    displayName: 'Prelude Selection',
    description: '+2 Prelude options to choose from',
    category: UpgradeCategory.PRELUDES,
    cost: 2,
    prerequisites: ['prelude_1'],
    bonusType: UpgradeBonusType.PRELUDE_CHOICES,
    bonusValue: 2,
    position: {x: 4, y: 1},
    chainId: 'prelude_choices',
    chainLevel: 1,
  },
  {
    id: 'prelude_choices_2',
    name: 'Prelude Selection II',
    description: '+2 Prelude options to choose from',
    category: UpgradeCategory.PRELUDES,
    cost: 2,
    prerequisites: ['prelude_choices'],
    bonusType: UpgradeBonusType.PRELUDE_CHOICES,
    bonusValue: 2,
    position: {x: 4, y: 1},
    chainId: 'prelude_choices',
    chainLevel: 2,
  },
  {
    id: 'prelude_choices_3',
    name: 'Prelude Selection III',
    description: '+2 Prelude options to choose from',
    category: UpgradeCategory.PRELUDES,
    cost: 3,
    prerequisites: ['prelude_choices_2'],
    bonusType: UpgradeBonusType.PRELUDE_CHOICES,
    bonusValue: 2,
    position: {x: 4, y: 1},
    chainId: 'prelude_choices',
    chainLevel: 3,
  },

  // Card Management Branch
  {
    id: 'card_draw_1',
    name: 'Research Grant I',
    displayName: 'Research Grant',
    description: '+1 starting project card',
    category: UpgradeCategory.CARD_MANAGEMENT,
    cost: 1,
    prerequisites: [],
    bonusType: UpgradeBonusType.CARD_DRAW,
    bonusValue: 1,
    position: {x: 5, y: 0},
    chainId: 'card_draw',
    chainLevel: 1,
  },
  {
    id: 'card_draw_2',
    name: 'Research Grant II',
    description: '+1 starting project card',
    category: UpgradeCategory.CARD_MANAGEMENT,
    cost: 2,
    prerequisites: ['card_draw_1'],
    bonusType: UpgradeBonusType.CARD_DRAW,
    bonusValue: 1,
    position: {x: 5, y: 0},
    chainId: 'card_draw',
    chainLevel: 2,
  },
  {
    id: 'ban_slots_1',
    name: 'Card Filtering I',
    displayName: 'Card Filtering',
    description: '+1 wildcard ban slot',
    category: UpgradeCategory.CARD_MANAGEMENT,
    cost: 2,
    prerequisites: [],
    bonusType: UpgradeBonusType.CARD_BAN_SLOTS,
    bonusValue: 1,
    position: {x: 6, y: 0},
    chainId: 'ban_slots',
    chainLevel: 1,
  },
  {
    id: 'ban_slots_2',
    name: 'Card Filtering II',
    description: '+1 wildcard ban slot',
    category: UpgradeCategory.CARD_MANAGEMENT,
    cost: 2,
    prerequisites: ['ban_slots_1'],
    bonusType: UpgradeBonusType.CARD_BAN_SLOTS,
    bonusValue: 1,
    position: {x: 6, y: 0},
    chainId: 'ban_slots',
    chainLevel: 2,
  },
  {
    id: 'ban_slots_3',
    name: 'Card Filtering III',
    description: '+1 wildcard ban slot',
    category: UpgradeCategory.CARD_MANAGEMENT,
    cost: 3,
    prerequisites: ['ban_slots_2'],
    bonusType: UpgradeBonusType.CARD_BAN_SLOTS,
    bonusValue: 1,
    position: {x: 6, y: 0},
    chainId: 'ban_slots',
    chainLevel: 3,
  },

  // Terraforming Branch (run length)
  {
    id: 'generation_1',
    name: 'Extended Mandate I',
    displayName: 'Extended Mandate',
    description: '+1 generation',
    category: UpgradeCategory.TERRAFORMING,
    cost: 2,
    prerequisites: [],
    bonusType: UpgradeBonusType.GENERATION,
    bonusValue: 1,
    position: {x: 7, y: 0},
    chainId: 'generation',
    chainLevel: 1,
  },
  {
    id: 'generation_2',
    name: 'Extended Mandate II',
    description: '+1 generation',
    category: UpgradeCategory.TERRAFORMING,
    cost: 3,
    prerequisites: ['generation_1'],
    bonusType: UpgradeBonusType.GENERATION,
    bonusValue: 1,
    position: {x: 7, y: 0},
    chainId: 'generation',
    chainLevel: 2,
  },
  {
    id: 'generation_3',
    name: 'Extended Mandate III',
    description: '+1 generation',
    category: UpgradeCategory.TERRAFORMING,
    cost: 4,
    prerequisites: ['generation_2'],
    bonusType: UpgradeBonusType.GENERATION,
    bonusValue: 1,
    position: {x: 7, y: 0},
    chainId: 'generation',
    chainLevel: 3,
  },

  // Ascension Branch (unlocks the separate ascension tree)
  {
    id: 'ascension_unlock',
    name: 'Ascension Protocol',
    description: 'Unlocks the Ascension tree, where ascension points buy permanent buffs and difficulty modifiers',
    category: UpgradeCategory.ASCENSION,
    cost: 3,
    prerequisites: [],
    bonusType: UpgradeBonusType.UNLOCK_ASCENSION,
    bonusValue: 1,
    position: {x: 8, y: 0},
  },
];

/** Get a node by ID */
export function getUpgradeNode(id: UpgradeNodeId): UpgradeNode | undefined {
  return UPGRADE_TREE.find((node) => node.id === id);
}

/** Check if a node can be unlocked given current unlocked nodes */
export function canUnlockNode(nodeId: UpgradeNodeId, unlockedNodes: Set<UpgradeNodeId>): boolean {
  const node = getUpgradeNode(nodeId);
  if (!node) return false;
  if (unlockedNodes.has(nodeId)) return false;
  return node.prerequisites.every((prereq) => unlockedNodes.has(prereq));
}

/** Calculate total bonus of a type from unlocked nodes */
export function calculateTotalBonus(bonusType: UpgradeBonusType, unlockedNodes: Set<UpgradeNodeId>): number {
  return UPGRADE_TREE
    .filter((node) => unlockedNodes.has(node.id) && node.bonusType === bonusType)
    .reduce((sum, node) => sum + node.bonusValue, 0);
}
