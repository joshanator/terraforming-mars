import {expect} from 'chai';
import {
  getUpgradeDisplayTiles,
  getTileUnlockedLevel,
  getTileNextLevel,
  getTileCurrentBonusText,
  canUnlockTileNextLevel,
  isTileMaxed,
  stripUpgradeLevelSuffix,
} from '../../src/common/roguelike/UpgradeTreeDisplay';

describe('UpgradeTreeDisplay', () => {
  it('merges leveled upgrades into one tile', () => {
    const tiles = getUpgradeDisplayTiles();
    const tr = tiles.find((tile) => tile.id === 'tr');
    expect(tr).is.not.undefined;
    expect(tr!.name).eq('Terraforming Initiative');
    expect(tr!.levels).to.have.length(3);
  });

  it('keeps standalone upgrades as single-level tiles', () => {
    const tiles = getUpgradeDisplayTiles();
    const steel = tiles.find((tile) => tile.id === 'steel_1');
    expect(steel).is.not.undefined;
    expect(steel!.levels).to.have.length(1);
  });

  it('tracks level, current bonus, and next tier', () => {
    const tr = getUpgradeDisplayTiles().find((tile) => tile.id === 'tr')!;
    const unlocked = new Set(['tr_1']);

    expect(getTileUnlockedLevel(tr, unlocked)).eq(1);
    expect(getTileCurrentBonusText(tr, unlocked)).eq('+1 Starting TR');
    expect(getTileNextLevel(tr, unlocked)?.id).eq('tr_2');
    expect(canUnlockTileNextLevel(tr, unlocked, 2)).eq(true);
    expect(isTileMaxed(tr, unlocked)).eq(false);
    expect(isTileMaxed(tr, new Set(['tr_1', 'tr_2', 'tr_3']))).eq(true);
  });

  it('strips roman numeral suffixes', () => {
    expect(stripUpgradeLevelSuffix('Seed Funding IV')).eq('Seed Funding');
    expect(stripUpgradeLevelSuffix('Research Grant II')).eq('Research Grant');
  });
});
