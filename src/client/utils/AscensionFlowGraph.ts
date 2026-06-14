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

const NODE_WIDTH = 220;
const NODE_HEIGHT = 128;

/** Build a laid-out ascension tree graph for Vue Flow. */
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
