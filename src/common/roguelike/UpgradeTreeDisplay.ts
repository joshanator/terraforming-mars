import {
  UpgradeBonusType,
  UpgradeCategory,
  UpgradeNode,
  UpgradeNodeId,
  UPGRADE_TREE,
} from './UpgradeNode';

/** A single tile in the upgrade tree UI. Leveled upgrades share one tile. */
export interface UpgradeDisplayTile {
  id: string;
  name: string;
  category: UpgradeCategory;
  position: {x: number; y: number};
  levels: ReadonlyArray<UpgradeNode>;
}

/** Strip trailing level suffixes such as " I", " II", " IV". */
export function stripUpgradeLevelSuffix(name: string): string {
  return name.replace(/\s+(I{1,3}|IV)$/u, '');
}

/** Build UI tiles from raw upgrade nodes, merging leveled chains. */
export function getUpgradeDisplayTiles(): ReadonlyArray<UpgradeDisplayTile> {
  const chains = new Map<string, UpgradeNode[]>();
  const standalone: UpgradeNode[] = [];

  for (const node of UPGRADE_TREE) {
    if (node.chainId !== undefined) {
      const levels = chains.get(node.chainId) ?? [];
      levels.push(node);
      chains.set(node.chainId, levels);
    } else {
      standalone.push(node);
    }
  }

  const tiles: UpgradeDisplayTile[] = [];

  for (const [chainId, nodes] of chains) {
    const levels = [...nodes].sort((a, b) => (a.chainLevel ?? 0) - (b.chainLevel ?? 0));
    const first = levels[0];
    tiles.push({
      id: chainId,
      name: first.displayName ?? stripUpgradeLevelSuffix(first.name),
      category: first.category,
      position: first.position,
      levels,
    });
  }

  for (const node of standalone) {
    tiles.push({
      id: node.id,
      name: node.displayName ?? node.name,
      category: node.category,
      position: node.position,
      levels: [node],
    });
  }

  return tiles.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
}

/** How many levels of this tile are currently unlocked. */
export function getTileUnlockedLevel(tile: UpgradeDisplayTile, unlockedNodes: Set<UpgradeNodeId>): number {
  return tile.levels.filter((node) => unlockedNodes.has(node.id)).length;
}

/** The next tier node to unlock, if any. */
export function getTileNextLevel(
  tile: UpgradeDisplayTile,
  unlockedNodes: Set<UpgradeNodeId>,
): UpgradeNode | undefined {
  return tile.levels.find((node) => !unlockedNodes.has(node.id));
}

/** Sum bonus values from unlocked tiers in this tile. */
export function getTileCurrentBonusValue(tile: UpgradeDisplayTile, unlockedNodes: Set<UpgradeNodeId>): number {
  return tile.levels
    .filter((node) => unlockedNodes.has(node.id))
    .reduce((sum, node) => sum + node.bonusValue, 0);
}

/** Human-readable summary of the tile's current total bonus. */
export function formatUpgradeBonusTotal(bonusType: UpgradeBonusType, total: number): string {
  switch (bonusType) {
  case UpgradeBonusType.STARTING_TR:
    return `+${total} Starting TR`;
  case UpgradeBonusType.STARTING_MC:
    return `+${total} Starting M€`;
  case UpgradeBonusType.STARTING_STEEL:
    return `+${total} Starting Steel`;
  case UpgradeBonusType.STARTING_TITANIUM:
    return `+${total} Starting Titanium`;
  case UpgradeBonusType.STARTING_PLANTS:
    return `+${total} Starting Plants`;
  case UpgradeBonusType.CORPORATION_CHOICES:
    return `+${total} starting corporation option${total === 1 ? '' : 's'}`;
  case UpgradeBonusType.PRELUDE_SLOTS:
    return `${total} Prelude card${total === 1 ? '' : 's'}`;
  case UpgradeBonusType.PRELUDE_CHOICES:
    return `+${total} Prelude option${total === 1 ? '' : 's'}`;
  case UpgradeBonusType.CARD_DRAW:
    return `+${total} starting project card${total === 1 ? '' : 's'}`;
  case UpgradeBonusType.CARD_BAN_SLOTS:
    return `${total} wildcard ban slot${total === 1 ? '' : 's'}`;
  case UpgradeBonusType.GENERATION:
    return `+${total} generation${total === 1 ? '' : 's'}`;
  case UpgradeBonusType.UNLOCK_ASCENSION:
    return total > 0 ? 'Ascension tree unlocked' : '';
  case UpgradeBonusType.UNLOCK_EXPANSION:
    return total > 0 ? 'Expansion unlocked' : '';
  default:
    return '';
  }
}

/** Current bonus text for a tile, or undefined at level 0. */
export function getTileCurrentBonusText(tile: UpgradeDisplayTile, unlockedNodes: Set<UpgradeNodeId>): string | undefined {
  const level = getTileUnlockedLevel(tile, unlockedNodes);
  if (level === 0) {
    return undefined;
  }
  const bonusType = tile.levels[0].bonusType;
  if (bonusType === UpgradeBonusType.UNLOCK_ASCENSION || bonusType === UpgradeBonusType.UNLOCK_EXPANSION) {
    return tile.levels[0].description;
  }
  const total = getTileCurrentBonusValue(tile, unlockedNodes);
  return formatUpgradeBonusTotal(bonusType, total);
}

/** Whether the next tier of this tile can be purchased now. */
export function canUnlockTileNextLevel(
  tile: UpgradeDisplayTile,
  unlockedNodes: Set<UpgradeNodeId>,
  availablePoints: number,
): boolean {
  const next = getTileNextLevel(tile, unlockedNodes);
  if (!next) {
    return false;
  }
  if (next.cost > availablePoints) {
    return false;
  }
  return next.prerequisites.every((prereq) => unlockedNodes.has(prereq));
}

/** Whether every tier in this tile is unlocked. */
export function isTileMaxed(tile: UpgradeDisplayTile, unlockedNodes: Set<UpgradeNodeId>): boolean {
  return getTileUnlockedLevel(tile, unlockedNodes) >= tile.levels.length;
}
