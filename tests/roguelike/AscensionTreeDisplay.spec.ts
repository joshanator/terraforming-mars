import {expect} from 'chai';
import {
  getAscensionDisplayTiles,
  getAscensionTileUnlockedLevel,
  getAscensionTileNextLevel,
  getAscensionTileCurrentBonusText,
  canUnlockAscensionTileNextLevel,
  isAscensionTileMaxed,
  formatAscensionEffectsSummary,
  getAscensionTileEdges,
  getAscensionTreeLayout,
  getAscensionTileEdgeLine,
  getAscensionTileEdgePath,
  isAscensionTileEdgeActive,
  isAscensionBackwardEdge,
  getAscensionTileNodeState,
} from '../../src/common/roguelike/AscensionTreeDisplay';

describe('AscensionTreeDisplay', () => {
  it('merges leveled ascension nodes into one tile', () => {
    const tiles = getAscensionDisplayTiles();
    const thinAtmosphere = tiles.find((tile) => tile.id === 'asc_tr');
    expect(thinAtmosphere).is.not.undefined;
    expect(thinAtmosphere!.name).eq('Thin Atmosphere');
    expect(thinAtmosphere!.levels).to.have.length(2);
  });

  it('keeps standalone ascension nodes as single-level tiles', () => {
    const tiles = getAscensionDisplayTiles();
    const budgetCuts = tiles.find((tile) => tile.id === 'asc_mc_1');
    expect(budgetCuts).is.not.undefined;
    expect(budgetCuts!.levels).to.have.length(1);
  });

  it('tracks level, current bonus, and next tier', () => {
    const tile = getAscensionDisplayTiles().find((entry) => entry.id === 'asc_tr')!;
    const unlocked = new Set(['asc_tr_1']);

    expect(getAscensionTileUnlockedLevel(tile, unlocked)).eq(1);
    expect(getAscensionTileCurrentBonusText(tile, unlocked)).eq('-1 Starting TR · +0.2 XP multiplier');
    expect(getAscensionTileNextLevel(tile, unlocked)?.id).eq('asc_tr_2');
    expect(canUnlockAscensionTileNextLevel(tile, unlocked, 3)).eq(false);
    expect(isAscensionTileMaxed(tile, unlocked)).eq(false);
  });

  it('formats combined ascension effects', () => {
    const summary = formatAscensionEffectsSummary({
      trBonus: -2,
      mcBonus: 0,
      cardDrawBonus: 0,
      generationBonus: 0,
      cardCostIncrease: 0,
      xpMultiplierBonus: 0.6,
    });
    expect(summary).eq('-2 Starting TR · +0.6 XP multiplier');
  });

  it('builds cross-tile prerequisite edges', () => {
    const edges = getAscensionTileEdges();
    expect(edges.some((edge) => edge.fromTileId === 'asc_mc_1' && edge.toTileId === 'asc_buff_mc')).eq(true);
    expect(edges.some((edge) => edge.fromTileId === 'asc_tr' && edge.toTileId === 'asc_buff_card')).eq(true);
    expect(edges.some((edge) => edge.fromTileId === 'asc_gen_1' && edge.toTileId === 'asc_cost_1')).eq(true);
    expect(edges.some((edge) => edge.fromTileId === 'asc_cost_1' && edge.toTileId === 'asc_tr')).eq(true);
    expect(edges.some((edge) => edge.fromTileId === 'asc_tr' && edge.toTileId === 'asc_gen_1')).eq(true);
  });

  it('lays out tiles on a grid from tree coordinates', () => {
    const tiles = getAscensionDisplayTiles();
    const layout = getAscensionTreeLayout(tiles);
    const thinAtmosphere = layout.positions.get('asc_tr');
    const inflation = layout.positions.get('asc_cost_1');
    expect(thinAtmosphere).is.not.undefined;
    expect(inflation).is.not.undefined;
    expect(inflation!.top).gt(thinAtmosphere!.top);
    expect(layout.width).gt(0);
    expect(layout.height).gt(0);
  });

  it('draws edge lines between tile centers', () => {
    const tiles = getAscensionDisplayTiles();
    const layout = getAscensionTreeLayout(tiles);
    const edge = getAscensionTileEdges(tiles).find((entry) =>
      entry.fromTileId === 'asc_gen_1' && entry.toTileId === 'asc_cost_1')!;
    const line = getAscensionTileEdgeLine(edge, layout);
    expect(line).is.not.undefined;
    expect(line!.y2).gt(line!.y1);
  });

  it('marks edges active when prerequisites are unlocked', () => {
    const edge = getAscensionTileEdges().find((entry) =>
      entry.fromTileId === 'asc_tr' && entry.toTileId === 'asc_buff_card')!;
    expect(isAscensionTileEdgeActive(edge, new Set())).eq(false);
    expect(isAscensionTileEdgeActive(edge, new Set(['asc_tr_1']))).eq(true);
  });

  it('detects backward prerequisite edges', () => {
    const edge = getAscensionTileEdges().find((entry) =>
      entry.fromTileId === 'asc_cost_1' && entry.toTileId === 'asc_tr')!;
    expect(isAscensionBackwardEdge(edge)).eq(true);
  });

  it('computes tile node state for the flow UI', () => {
    const tile = getAscensionDisplayTiles().find((entry) => entry.id === 'asc_tr')!;
    const state = getAscensionTileNodeState(tile, new Set(['asc_tr_1']), 3);
    expect(state.level).eq(1);
    expect(state.nextNodeId).eq('asc_tr_2');
    expect(state.canUnlock).eq(false);
  });

  it('formats card progress bonuses', () => {
    const summary = formatAscensionEffectsSummary({
      trBonus: 0,
      mcBonus: 0,
      cardDrawBonus: 0,
      generationBonus: 0,
      cardCostIncrease: 0,
      xpMultiplierBonus: 0,
      preludeChoicesBonus: 0,
      cardProgressMultiplierBonus: 0.5,
    });
    expect(summary).eq('+50% card progress');
  });
});
