import {
  AscensionEffects,
  AscensionNode,
  AscensionNodeId,
  AscensionNodeType,
  ASCENSION_TREE,
  emptyAscensionEffects,
} from './AscensionTree';
import {stripUpgradeLevelSuffix} from './UpgradeTreeDisplay';

/** A single tile in the ascension tree UI. Leveled nodes share one tile. */
export interface AscensionDisplayTile {
  id: string;
  name: string;
  type: AscensionNodeType;
  position: {x: number; y: number};
  levels: ReadonlyArray<AscensionNode>;
}

/** Build UI tiles from raw ascension nodes, merging leveled chains. */
export function getAscensionDisplayTiles(): ReadonlyArray<AscensionDisplayTile> {
  const chains = new Map<string, AscensionNode[]>();
  const standalone: AscensionNode[] = [];

  for (const node of ASCENSION_TREE) {
    if (node.chainId !== undefined) {
      const levels = chains.get(node.chainId) ?? [];
      levels.push(node);
      chains.set(node.chainId, levels);
    } else {
      standalone.push(node);
    }
  }

  const tiles: AscensionDisplayTile[] = [];

  for (const [chainId, nodes] of chains) {
    const levels = [...nodes].sort((a, b) => (a.chainLevel ?? 0) - (b.chainLevel ?? 0));
    const first = levels[0];
    tiles.push({
      id: chainId,
      name: first.displayName ?? stripUpgradeLevelSuffix(first.name),
      type: first.type,
      position: first.position,
      levels,
    });
  }

  for (const node of standalone) {
    tiles.push({
      id: node.id,
      name: node.displayName ?? node.name,
      type: node.type,
      position: node.position,
      levels: [node],
    });
  }

  return tiles.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y);
}

/** How many levels of this tile are currently unlocked. */
export function getAscensionTileUnlockedLevel(
  tile: AscensionDisplayTile,
  unlockedNodes: Set<AscensionNodeId>,
): number {
  return tile.levels.filter((node) => unlockedNodes.has(node.id)).length;
}

/** The next tier node to unlock, if any. */
export function getAscensionTileNextLevel(
  tile: AscensionDisplayTile,
  unlockedNodes: Set<AscensionNodeId>,
): AscensionNode | undefined {
  return tile.levels.find((node) => !unlockedNodes.has(node.id));
}

/** Sum run effects from unlocked tiers in this tile. */
export function getAscensionTileCurrentEffects(
  tile: AscensionDisplayTile,
  unlockedNodes: Set<AscensionNodeId>,
): AscensionEffects {
  const totals = emptyAscensionEffects();
  for (const node of tile.levels) {
    if (!unlockedNodes.has(node.id)) {
      continue;
    }
    totals.trBonus += node.effects.trBonus ?? 0;
    totals.mcBonus += node.effects.mcBonus ?? 0;
    totals.cardDrawBonus += node.effects.cardDrawBonus ?? 0;
    totals.generationBonus += node.effects.generationBonus ?? 0;
    totals.cardCostIncrease += node.effects.cardCostIncrease ?? 0;
    totals.xpMultiplierBonus += node.effects.xpMultiplierBonus ?? 0;
    totals.preludeChoicesBonus += node.effects.preludeChoicesBonus ?? 0;
  }
  return totals;
}

function formatSigned(value: number, suffix: string): string {
  return `${value > 0 ? '+' : ''}${value} ${suffix}`;
}

/** Human-readable summary of ascension run effects. */
export function formatAscensionEffectsSummary(effects: AscensionEffects): string {
  const parts: string[] = [];
  if (effects.trBonus !== 0) {
    parts.push(formatSigned(effects.trBonus, 'Starting TR'));
  }
  if (effects.mcBonus !== 0) {
    parts.push(formatSigned(effects.mcBonus, 'Starting M€'));
  }
  if (effects.cardDrawBonus !== 0) {
    parts.push(formatSigned(effects.cardDrawBonus, 'starting project card' + (Math.abs(effects.cardDrawBonus) === 1 ? '' : 's')));
  }
  if (effects.generationBonus !== 0) {
    parts.push(formatSigned(effects.generationBonus, 'generation' + (Math.abs(effects.generationBonus) === 1 ? '' : 's')));
  }
  if (effects.cardCostIncrease !== 0) {
    parts.push(`+${effects.cardCostIncrease} card cost`);
  }
  if (effects.xpMultiplierBonus !== 0) {
    const rounded = Math.round(effects.xpMultiplierBonus * 10) / 10;
    parts.push(`+${rounded} XP multiplier`);
  }
  if ((effects.preludeChoicesBonus ?? 0) !== 0) {
    parts.push(`+${effects.preludeChoicesBonus} Prelude option${effects.preludeChoicesBonus === 1 ? '' : 's'}`);
  }
  return parts.join(' · ');
}

/** Current bonus text for a tile, or undefined at level 0. */
export function getAscensionTileCurrentBonusText(
  tile: AscensionDisplayTile,
  unlockedNodes: Set<AscensionNodeId>,
): string | undefined {
  if (getAscensionTileUnlockedLevel(tile, unlockedNodes) === 0) {
    return undefined;
  }
  return formatAscensionEffectsSummary(getAscensionTileCurrentEffects(tile, unlockedNodes));
}

/** Whether the next tier of this tile can be purchased now. */
export function canUnlockAscensionTileNextLevel(
  tile: AscensionDisplayTile,
  unlockedNodes: Set<AscensionNodeId>,
  availablePoints: number,
): boolean {
  const next = getAscensionTileNextLevel(tile, unlockedNodes);
  if (!next) {
    return false;
  }
  if (next.cost > availablePoints) {
    return false;
  }
  return next.prerequisites.every((prereq) => unlockedNodes.has(prereq));
}

/** Whether every tier in this tile is unlocked. */
export function isAscensionTileMaxed(
  tile: AscensionDisplayTile,
  unlockedNodes: Set<AscensionNodeId>,
): boolean {
  return getAscensionTileUnlockedLevel(tile, unlockedNodes) >= tile.levels.length;
}

/** A dependency edge between two ascension tiles (prerequisite → dependent). */
export interface AscensionTileEdge {
  fromTileId: string;
  toTileId: string;
  /** Node IDs on the from tile that must be unlocked for this edge. */
  prerequisiteNodeIds: AscensionNodeId[];
}

/** Map a node ID to the tile that contains it. */
export function getNodeAscensionTileId(
  nodeId: AscensionNodeId,
  tiles: ReadonlyArray<AscensionDisplayTile> = getAscensionDisplayTiles(),
): string {
  for (const tile of tiles) {
    if (tile.levels.some((node) => node.id === nodeId)) {
      return tile.id;
    }
  }
  return nodeId;
}

/** Cross-tile prerequisite edges for the ascension tree UI. */
export function getAscensionTileEdges(
  tiles: ReadonlyArray<AscensionDisplayTile> = getAscensionDisplayTiles(),
): ReadonlyArray<AscensionTileEdge> {
  const edgeMap = new Map<string, AscensionTileEdge>();

  for (const tile of tiles) {
    for (const node of tile.levels) {
      for (const prereq of node.prerequisites) {
        const fromTileId = getNodeAscensionTileId(prereq, tiles);
        const toTileId = tile.id;
        if (fromTileId === toTileId) {
          continue;
        }
        const key = `${fromTileId}->${toTileId}`;
        const existing = edgeMap.get(key);
        if (existing) {
          if (!existing.prerequisiteNodeIds.includes(prereq)) {
            existing.prerequisiteNodeIds.push(prereq);
          }
        } else {
          edgeMap.set(key, {fromTileId, toTileId, prerequisiteNodeIds: [prereq]});
        }
      }
    }
  }

  return [...edgeMap.values()];
}

/** Whether every prerequisite node for this edge is unlocked. */
export function isAscensionTileEdgeActive(
  edge: AscensionTileEdge,
  unlockedNodes: Set<AscensionNodeId>,
): boolean {
  return edge.prerequisiteNodeIds.every((nodeId) => unlockedNodes.has(nodeId));
}

export interface AscensionTreeLayoutOptions {
  tileWidth?: number;
  tileHeight?: number;
  columnGap?: number;
  rowGap?: number;
}

/** Pixel layout for positioning ascension tiles on a grid from their tree coordinates. */
export interface AscensionTreeLayout {
  tileWidth: number;
  tileHeight: number;
  columnGap: number;
  rowGap: number;
  width: number;
  height: number;
  positions: ReadonlyMap<string, {left: number; top: number}>;
}

/** Build absolute positions for each ascension tile from its `position` field. */
export function getAscensionTreeLayout(
  tiles: ReadonlyArray<AscensionDisplayTile> = getAscensionDisplayTiles(),
  options: AscensionTreeLayoutOptions = {},
): AscensionTreeLayout {
  const tileWidth = options.tileWidth ?? 240;
  const tileHeight = options.tileHeight ?? 170;
  const columnGap = options.columnGap ?? 28;
  const rowGap = options.rowGap ?? 56;
  const cellWidth = tileWidth + columnGap;
  const cellHeight = tileHeight + rowGap;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const tile of tiles) {
    minX = Math.min(minX, tile.position.x);
    maxX = Math.max(maxX, tile.position.x);
    minY = Math.min(minY, tile.position.y);
    maxY = Math.max(maxY, tile.position.y);
  }

  const positions = new Map<string, {left: number; top: number}>();
  for (const tile of tiles) {
    positions.set(tile.id, {
      left: (tile.position.x - minX) * cellWidth,
      top: (tile.position.y - minY) * cellHeight,
    });
  }

  return {
    tileWidth,
    tileHeight,
    columnGap,
    rowGap,
    width: (maxX - minX) * cellWidth + tileWidth,
    height: (maxY - minY) * cellHeight + tileHeight,
    positions,
  };
}

/** SVG line between the bottom of the from tile and the top of the to tile. */
export function getAscensionTileEdgeLine(
  edge: AscensionTileEdge,
  layout: AscensionTreeLayout,
): {x1: number; y1: number; x2: number; y2: number} | undefined {
  const from = layout.positions.get(edge.fromTileId);
  const to = layout.positions.get(edge.toTileId);
  if (!from || !to) {
    return undefined;
  }
  return {
    x1: from.left + layout.tileWidth / 2,
    y1: from.top + layout.tileHeight,
    x2: to.left + layout.tileWidth / 2,
    y2: to.top,
  };
}

/** SVG path for a prerequisite edge; curves upward edges to reduce overlap. */
export function getAscensionTileEdgePath(
  edge: AscensionTileEdge,
  layout: AscensionTreeLayout,
): string | undefined {
  const line = getAscensionTileEdgeLine(edge, layout);
  if (!line) {
    return undefined;
  }
  const {x1, y1, x2, y2} = line;
  if (y2 < y1) {
    const bend = y1 + (y2 - y1) * 0.45;
    return `M ${x1} ${y1} C ${x1} ${bend}, ${x2} ${bend}, ${x2} ${y2}`;
  }
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

/** Whether an edge runs against the primary top-to-bottom tree flow. */
export function isAscensionBackwardEdge(
  edge: AscensionTileEdge,
  tiles: ReadonlyArray<AscensionDisplayTile> = getAscensionDisplayTiles(),
): boolean {
  const tileY = new Map(tiles.map((tile) => [tile.id, tile.position.y]));
  const fromY = tileY.get(edge.fromTileId) ?? 0;
  const toY = tileY.get(edge.toTileId) ?? 0;
  return toY <= fromY;
}

/** UI state for a single ascension tile node. */
export interface AscensionTileNodeState {
  level: number;
  maxLevel: number;
  currentBonus?: string;
  nextDescription?: string;
  nextCost?: number;
  nextNodeId?: AscensionNodeId;
  canUnlock: boolean;
  isMaxed: boolean;
}

/** Compute display state for an ascension tile. */
export function getAscensionTileNodeState(
  tile: AscensionDisplayTile,
  unlockedNodes: Set<AscensionNodeId>,
  availablePoints: number,
): AscensionTileNodeState {
  const level = getAscensionTileUnlockedLevel(tile, unlockedNodes);
  const next = getAscensionTileNextLevel(tile, unlockedNodes);
  return {
    level,
    maxLevel: tile.levels.length,
    currentBonus: getAscensionTileCurrentBonusText(tile, unlockedNodes),
    nextDescription: next?.description ?? (level === 0 ? tile.levels[0].description : undefined),
    nextCost: next?.cost,
    nextNodeId: next?.id,
    canUnlock: canUnlockAscensionTileNextLevel(tile, unlockedNodes, availablePoints),
    isMaxed: isAscensionTileMaxed(tile, unlockedNodes),
  };
}

/** Vue Flow node payload for the ascension tree. */
export interface AscensionFlowNode {
  id: string;
  type: 'ascension';
  position: {x: number; y: number};
  data: {
    tile: AscensionDisplayTile;
    state: AscensionTileNodeState;
  };
}

/** Vue Flow edge payload for ascension prerequisites. */
export interface AscensionFlowEdge {
  id: string;
  source: string;
  target: string;
  type: 'smoothstep';
  data: {
    edge: AscensionTileEdge;
    backward: boolean;
    active: boolean;
  };
}
