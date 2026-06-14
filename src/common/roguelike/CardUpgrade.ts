import {CardProgress, calculateCardLevel} from './CardProgress';

/**
 * Per-card upgrade catalog.
 *
 * THIS IS THE SINGLE SOURCE OF TRUTH for what upgrades a card can buy and how
 * they scale. Edit this array to change costs, ranks, or effects. Both the
 * client UI and the server purchase logic read from it.
 *
 * Each card earns 1 upgrade point per level (levels come from times played,
 * see CardProgress.ts). Points are spent freely across these upgrades; some
 * cost more than 1 point per rank, and some require a minimum level.
 */

/** What a card upgrade affects. */
export type CardUpgradeEffect =
  | 'costReduction'
  | 'deckPosition'
  | 'canBan'
  | 'mastered';

export interface CardUpgradeDef {
  /** Stable id, stored in save files */
  id: string;
  /** Display name */
  name: string;
  /** Display description (per rank) */
  description: string;
  /** Upgrade-point cost per rank */
  pointCost: number;
  /** Maximum ranks that can be purchased */
  maxRank: number;
  /** The effect this upgrade applies */
  effect: CardUpgradeEffect;
  /** Magnitude applied per rank */
  valuePerRank: number;
  /** Minimum card level required to buy the first rank */
  requiresLevel?: number;
}

export const CARD_UPGRADES: ReadonlyArray<CardUpgradeDef> = [
  {
    id: 'cost_reduction',
    name: 'Cost Reduction',
    description: '-1 M€ to this card\u2019s cost',
    pointCost: 1,
    maxRank: 5,
    effect: 'costReduction',
    valuePerRank: 1,
  },
  {
    id: 'deck_priority',
    name: 'Deck Priority',
    description: '+1 deck position (more likely in your opening hand)',
    pointCost: 1,
    maxRank: 5,
    effect: 'deckPosition',
    valuePerRank: 1,
  },
  {
    id: 'ban_eligibility',
    name: 'Ban Card',
    description: 'Permanently ban this card from your runs (does not use a wildcard ban slot)',
    pointCost: 2,
    maxRank: 1,
    effect: 'canBan',
    valuePerRank: 1,
    requiresLevel: 2,
  },
  {
    id: 'mastery',
    name: 'Mastery',
    description: 'Guarantee this card in your starting hand',
    pointCost: 3,
    maxRank: 1,
    effect: 'mastered',
    valuePerRank: 1,
    requiresLevel: 5,
  },
];

export function getCardUpgrade(id: string): CardUpgradeDef | undefined {
  return CARD_UPGRADES.find((u) => u.id === id);
}

/** Total upgrade points a card has earned (1 per level). */
export function getEarnedPoints(progress: CardProgress): number {
  return calculateCardLevel(progress.timesPlayed);
}

/** Total upgrade points already spent. */
export function getSpentPoints(progress: CardProgress): number {
  const upgrades = progress.upgrades ?? {};
  let spent = 0;
  for (const def of CARD_UPGRADES) {
    const ranks = upgrades[def.id] ?? 0;
    spent += ranks * def.pointCost;
  }
  return spent;
}

/** Upgrade points available to spend. */
export function getAvailablePoints(progress: CardProgress): number {
  return getEarnedPoints(progress) - getSpentPoints(progress);
}

/** Whether the next rank of an upgrade can be purchased. */
export function canPurchaseCardUpgrade(progress: CardProgress, upgradeId: string): {ok: boolean; reason?: string} {
  const def = getCardUpgrade(upgradeId);
  if (!def) {
    return {ok: false, reason: 'Unknown upgrade'};
  }
  const currentRanks = (progress.upgrades ?? {})[upgradeId] ?? 0;
  if (currentRanks >= def.maxRank) {
    return {ok: false, reason: 'Max rank reached'};
  }
  if (def.requiresLevel !== undefined && calculateCardLevel(progress.timesPlayed) < def.requiresLevel) {
    return {ok: false, reason: `Requires level ${def.requiresLevel}`};
  }
  if (getAvailablePoints(progress) < def.pointCost) {
    return {ok: false, reason: 'Not enough upgrade points'};
  }
  return {ok: true};
}

/** Recompute the cached effect fields from purchased upgrades. */
export function recomputeCardBonuses(progress: CardProgress): void {
  const upgrades = progress.upgrades ?? {};
  let costReduction = 0;
  let deckPositionBonus = 0;
  let canBan = false;
  let mastered = false;

  for (const def of CARD_UPGRADES) {
    const ranks = upgrades[def.id] ?? 0;
    if (ranks <= 0) continue;
    switch (def.effect) {
    case 'costReduction':
      costReduction += def.valuePerRank * ranks;
      break;
    case 'deckPosition':
      deckPositionBonus += def.valuePerRank * ranks;
      break;
    case 'canBan':
      canBan = true;
      break;
    case 'mastered':
      mastered = true;
      break;
    }
  }

  progress.costReduction = costReduction;
  progress.deckPositionBonus = deckPositionBonus;
  progress.canBan = canBan;
  progress.mastered = mastered;
}

/**
 * Purchase one rank of an upgrade, mutating the progress object.
 * Returns success and an optional error reason.
 */
export function purchaseCardUpgrade(progress: CardProgress, upgradeId: string): {ok: boolean; reason?: string} {
  const check = canPurchaseCardUpgrade(progress, upgradeId);
  if (!check.ok) {
    return check;
  }
  if (!progress.upgrades) {
    progress.upgrades = {};
  }
  progress.upgrades[upgradeId] = (progress.upgrades[upgradeId] ?? 0) + 1;
  recomputeCardBonuses(progress);
  return {ok: true};
}
