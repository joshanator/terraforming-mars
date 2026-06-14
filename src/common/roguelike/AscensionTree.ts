/**
 * Ascension upgrade tree for the roguelike system.
 *
 * Unlike the main upgrade tree (which is paid for with leveling-derived
 * upgrade points), the ascension tree is paid for with ascension points and is
 * gated behind the "Ascension Protocol" main-tree upgrade. It contains a mix
 * of permanent buffs and difficulty increasers; difficulty nodes apply a
 * penalty to the run but grant a permanent XP multiplier bonus, accelerating
 * future progression. All nodes are permanent once unlocked, and many require
 * earlier nodes to be unlocked first.
 */

/** Unique identifier for an ascension node. */
export type AscensionNodeId = string;

/** Whether a node is a beneficial buff or a difficulty increaser. */
export enum AscensionNodeType {
  /** Beneficial, permanent bonus. */
  BUFF = 'buff',
  /** Difficulty increaser that grants an XP multiplier bonus. */
  DIFFICULTY = 'difficulty',
}

/**
 * Run effects contributed by an ascension node. Positive numbers are good for
 * the player (bonuses); penalties are expressed as negative bonuses (or, for
 * card cost, a positive increase). Effects from all unlocked nodes are summed.
 */
export interface AscensionEffects {
  /** Change to starting TR (negative = penalty). */
  trBonus: number;
  /** Change to starting M€ (negative = penalty). */
  mcBonus: number;
  /** Change to starting project cards dealt (negative = penalty). */
  cardDrawBonus: number;
  /** Change to the number of generations in the run (negative = shorter). */
  generationBonus: number;
  /** Increase to the cost of every project card (positive = harder). */
  cardCostIncrease: number;
  /** Bonus added to the run's XP multiplier (1.0 base + sum of these). */
  xpMultiplierBonus: number;
  /** Extra prelude cards to choose from beyond prelude slots. */
  preludeChoicesBonus: number;
  /** Bonus added to the card progress multiplier (1.0 base + sum of these). */
  cardProgressMultiplierBonus: number;
}

/** Definition of an ascension tree node. */
export interface AscensionNode {
  id: AscensionNodeId;
  name: string;
  description: string;
  type: AscensionNodeType;
  /** Ascension-point cost to unlock. */
  cost: number;
  /** Node IDs that must be unlocked first. */
  prerequisites: AscensionNodeId[];
  /** Run effects this node contributes. */
  effects: Partial<AscensionEffects>;
  /** Position in the visual tree (for UI). */
  position: {x: number; y: number};
  /** When set, leveled nodes with the same chainId share one UI tile */
  chainId?: string;
  /** 1-based level within a chain */
  chainLevel?: number;
  /** Name shown on a shared tile */
  displayName?: string;
}

/** All ascension tree nodes. */
export const ASCENSION_TREE: ReadonlyArray<AscensionNode> = [
  // Root difficulty nodes (no prerequisites)
  {
    id: 'asc_tr_1',
    name: 'Thin Atmosphere I',
    displayName: 'Thin Atmosphere',
    description: '-1 Starting TR · +0.2 XP multiplier',
    type: AscensionNodeType.DIFFICULTY,
    cost: 1,
    prerequisites: [],
    effects: {trBonus: -1, xpMultiplierBonus: 0.2},
    position: {x: 0, y: 0},
    chainId: 'asc_tr',
    chainLevel: 1,
  },
  {
    id: 'asc_mc_1',
    name: 'Budget Cuts I',
    description: '-5 Starting M€ · +0.2 XP multiplier',
    type: AscensionNodeType.DIFFICULTY,
    cost: 1,
    prerequisites: [],
    effects: {mcBonus: -5, xpMultiplierBonus: 0.2},
    position: {x: 1, y: 0},
  },

  // Buff nodes gated behind difficulty (you must take on hardship first)
  {
    id: 'asc_buff_mc',
    name: 'Veteran Stipend',
    description: '+8 Starting M€ (permanent buff)',
    type: AscensionNodeType.BUFF,
    cost: 2,
    prerequisites: ['asc_mc_1'],
    effects: {mcBonus: 8},
    position: {x: 1, y: 1},
  },
  {
    id: 'asc_buff_card',
    name: 'Field Research',
    description: '+1 Starting Project Card (permanent buff)',
    type: AscensionNodeType.BUFF,
    cost: 2,
    prerequisites: ['asc_tr_1'],
    effects: {cardDrawBonus: 1},
    position: {x: 0, y: 1},
  },
  {
    id: 'asc_buff_prelude_1',
    name: 'Prelude Archives I',
    displayName: 'Prelude Archives',
    description: '+1 Prelude option to choose from',
    type: AscensionNodeType.BUFF,
    cost: 2,
    prerequisites: ['asc_tr_1'],
    effects: {preludeChoicesBonus: 1},
    position: {x: 2, y: 1},
    chainId: 'asc_prelude_choices',
    chainLevel: 1,
  },
  {
    id: 'asc_buff_prelude_2',
    name: 'Prelude Archives II',
    description: '+1 Prelude option to choose from',
    type: AscensionNodeType.BUFF,
    cost: 3,
    prerequisites: ['asc_buff_prelude_1'],
    effects: {preludeChoicesBonus: 1},
    position: {x: 2, y: 1},
    chainId: 'asc_prelude_choices',
    chainLevel: 2,
  },

  // Card progression buffs
  {
    id: 'asc_progress_1',
    name: 'Rapid Prototyping I',
    displayName: 'Rapid Prototyping',
    description: '+25% card progress rate',
    type: AscensionNodeType.BUFF,
    cost: 2,
    prerequisites: ['asc_buff_card'],
    effects: {cardProgressMultiplierBonus: 0.25},
    position: {x: 3, y: 1},
    chainId: 'asc_progress',
    chainLevel: 1,
  },
  {
    id: 'asc_progress_2',
    name: 'Rapid Prototyping II',
    description: '+25% card progress rate',
    type: AscensionNodeType.BUFF,
    cost: 3,
    prerequisites: ['asc_progress_1'],
    effects: {cardProgressMultiplierBonus: 0.25},
    position: {x: 3, y: 1},
    chainId: 'asc_progress',
    chainLevel: 2,
  },
  {
    id: 'asc_mentor',
    name: 'Mentorship Program',
    description: '+15% card progress rate',
    type: AscensionNodeType.BUFF,
    cost: 2,
    prerequisites: ['asc_buff_mc'],
    effects: {cardProgressMultiplierBonus: 0.15},
    position: {x: 2, y: 2},
  },

  // Deeper difficulty nodes
  {
    id: 'asc_gen_1',
    name: 'Compressed Timeline',
    description: '-1 Generation · +0.3 XP multiplier',
    type: AscensionNodeType.DIFFICULTY,
    cost: 2,
    prerequisites: ['asc_tr_1', 'asc_mc_1'],
    effects: {generationBonus: -1, xpMultiplierBonus: 0.3},
    position: {x: 0.5, y: 2},
  },
  {
    id: 'asc_cost_1',
    name: 'Inflation',
    description: '+1 Card Cost · +0.3 XP multiplier',
    type: AscensionNodeType.DIFFICULTY,
    cost: 2,
    prerequisites: ['asc_gen_1'],
    effects: {cardCostIncrease: 1, xpMultiplierBonus: 0.3},
    position: {x: 0.5, y: 3},
  },
  {
    id: 'asc_draw_penalty',
    name: 'Data Drought',
    description: '-1 Starting Project Card · +0.35 XP multiplier',
    type: AscensionNodeType.DIFFICULTY,
    cost: 2,
    prerequisites: ['asc_gen_1'],
    effects: {cardDrawBonus: -1, xpMultiplierBonus: 0.35},
    position: {x: 2, y: 3},
  },

  // Capstone buff gated deep in the tree
  {
    id: 'asc_buff_gen',
    name: 'Extended Charter',
    description: '+1 Generation (permanent buff)',
    type: AscensionNodeType.BUFF,
    cost: 4,
    prerequisites: ['asc_cost_1'],
    effects: {generationBonus: 1},
    position: {x: 0.5, y: 4},
  },
  {
    id: 'asc_archivist',
    name: 'Archivist Network',
    description: '+25% card progress rate',
    type: AscensionNodeType.BUFF,
    cost: 4,
    prerequisites: ['asc_buff_gen'],
    effects: {cardProgressMultiplierBonus: 0.25},
    position: {x: 1, y: 5},
  },
  {
    id: 'asc_tr_2',
    name: 'Thin Atmosphere II',
    description: '-1 Starting TR · +0.4 XP multiplier',
    type: AscensionNodeType.DIFFICULTY,
    cost: 3,
    prerequisites: ['asc_cost_1'],
    effects: {trBonus: -1, xpMultiplierBonus: 0.4},
    position: {x: 0, y: 0},
    chainId: 'asc_tr',
    chainLevel: 2,
  },
];

/** Get an ascension node by ID. */
export function getAscensionNode(id: AscensionNodeId): AscensionNode | undefined {
  return ASCENSION_TREE.find((node) => node.id === id);
}

/** Check if a node can be unlocked given the currently unlocked set. */
export function canUnlockAscensionNode(nodeId: AscensionNodeId, unlockedNodes: Set<AscensionNodeId>): boolean {
  const node = getAscensionNode(nodeId);
  if (!node) return false;
  if (unlockedNodes.has(nodeId)) return false;
  return node.prerequisites.every((prereq) => unlockedNodes.has(prereq));
}

/** Empty ascension effects. */
export function emptyAscensionEffects(): AscensionEffects {
  return {
    trBonus: 0,
    mcBonus: 0,
    cardDrawBonus: 0,
    generationBonus: 0,
    cardCostIncrease: 0,
    xpMultiplierBonus: 0,
    preludeChoicesBonus: 0,
    cardProgressMultiplierBonus: 0,
  };
}

/** Sum the effects of all unlocked ascension nodes. */
export function computeAscensionEffects(unlockedNodes: ReadonlyArray<AscensionNodeId>): AscensionEffects {
  const unlockedSet = new Set(unlockedNodes);
  const totals = emptyAscensionEffects();
  for (const node of ASCENSION_TREE) {
    if (!unlockedSet.has(node.id)) {
      continue;
    }
    totals.trBonus += node.effects.trBonus ?? 0;
    totals.mcBonus += node.effects.mcBonus ?? 0;
    totals.cardDrawBonus += node.effects.cardDrawBonus ?? 0;
    totals.generationBonus += node.effects.generationBonus ?? 0;
    totals.cardCostIncrease += node.effects.cardCostIncrease ?? 0;
    totals.xpMultiplierBonus += node.effects.xpMultiplierBonus ?? 0;
    totals.preludeChoicesBonus += node.effects.preludeChoicesBonus ?? 0;
    totals.cardProgressMultiplierBonus += node.effects.cardProgressMultiplierBonus ?? 0;
  }
  return totals;
}

/** The run card-progress multiplier for a given set of unlocked ascension nodes. */
export function getAscensionCardProgressMultiplier(unlockedNodes: ReadonlyArray<AscensionNodeId>): number {
  return 1.0 + computeAscensionEffects(unlockedNodes).cardProgressMultiplierBonus;
}

/** The run XP multiplier for a given set of unlocked ascension nodes. */
export function getAscensionXPMultiplier(unlockedNodes: ReadonlyArray<AscensionNodeId>): number {
  return 1.0 + computeAscensionEffects(unlockedNodes).xpMultiplierBonus;
}

/** State of a player's ascension tree. */
export interface AscensionTreeState {
  unlockedNodes: AscensionNodeId[];
}

/** Create an empty ascension tree state. */
export function createAscensionTreeState(): AscensionTreeState {
  return {unlockedNodes: []};
}
