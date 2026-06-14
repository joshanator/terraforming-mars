import dagre from '@dagrejs/dagre';
import {AscensionNodeId} from '@/common/roguelike/AscensionTree';
import {
  AscensionDisplayTile,
  AscensionFlowEdge,
  AscensionFlowNode,
  getAscensionDisplayTiles,
  getAscensionTileEdges,
  getAscensionTileNodeState,
  isAscensionBackwardEdge,
  isAscensionTileEdgeActive,
} from '@/common/roguelike/AscensionTreeDisplay';

export type {AscensionFlowEdge, AscensionFlowNode};

export const ASCENSION_NODE_WIDTH = 220;
export const ASCENSION_NODE_HEIGHT = 128;

const NODE_WIDTH = ASCENSION_NODE_WIDTH;
const NODE_HEIGHT = ASCENSION_NODE_HEIGHT;

export interface AscensionGraphBounds {
  width: number;
  height: number;
}

/** Canvas size for the laid-out ascension tree. */
export function getAscensionGraphBounds(nodes: ReadonlyArray<AscensionFlowNode>, padding = 48): AscensionGraphBounds {
  let width = padding * 2;
  let height = padding * 2;
  for (const node of nodes) {
    width = Math.max(width, node.position.x + NODE_WIDTH + padding);
    height = Math.max(height, node.position.y + NODE_HEIGHT + padding);
  }
  return {width, height};
}

/** SVG path connecting two node positions. */
export function getAscensionEdgePath(
  from: {x: number; y: number},
  to: {x: number; y: number},
  backward = false,
): string {
  const x1 = from.x + NODE_WIDTH / 2;
  const y1 = from.y + NODE_HEIGHT;
  const x2 = to.x + NODE_WIDTH / 2;
  const y2 = to.y;
  if (backward || y2 < y1) {
    const bend = y1 + (y2 - y1) * 0.45;
    return `M ${x1} ${y1} C ${x1} ${bend}, ${x2} ${bend}, ${x2} ${y2}`;
  }
  const midY = y1 + (y2 - y1) / 2;
  return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`;
}

/** Build a laid-out ascension tree graph for the UI. */
export function buildAscensionFlowGraph(
  tiles: ReadonlyArray<AscensionDisplayTile> = getAscensionDisplayTiles(),
  unlockedNodes: Set<AscensionNodeId> = new Set(),
  availablePoints = 0,
): {nodes: AscensionFlowNode[]; edges: AscensionFlowEdge[]} {
  const tileEdges = getAscensionTileEdges(tiles);
  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: 'TB',
    nodesep: 56,
    ranksep: 88,
    marginx: 32,
    marginy: 32,
  });

  for (const tile of tiles) {
    graph.setNode(tile.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    });
  }

  for (const edge of tileEdges) {
    if (!isAscensionBackwardEdge(edge, tiles)) {
      graph.setEdge(edge.fromTileId, edge.toTileId);
    }
  }

  dagre.layout(graph);

  const nodes: AscensionFlowNode[] = tiles.map((tile) => {
    const position = graph.node(tile.id);
    return {
      id: tile.id,
      type: 'ascension',
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
      data: {
        tile,
        state: getAscensionTileNodeState(tile, unlockedNodes, availablePoints),
      },
    };
  });

  const edges: AscensionFlowEdge[] = tileEdges.map((edge) => ({
    id: `${edge.fromTileId}->${edge.toTileId}`,
    source: edge.fromTileId,
    target: edge.toTileId,
    type: 'smoothstep',
    data: {
      edge,
      backward: isAscensionBackwardEdge(edge, tiles),
      active: isAscensionTileEdgeActive(edge, unlockedNodes),
    },
  }));

  return {nodes, edges};
}
