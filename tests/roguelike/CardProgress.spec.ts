import {expect} from 'chai';
import {
  applyCardProgressMultiplier,
  calculateCardLevel,
  recordCardPlays,
} from '../../src/common/roguelike/CardProgress';
import {
  computeAscensionEffects,
  getAscensionCardProgressMultiplier,
} from '../../src/common/roguelike/AscensionTree';

describe('CardProgress ascension multiplier', () => {
  it('leaves play counts unchanged at 1x', () => {
    expect(applyCardProgressMultiplier(3, 1)).eq(3);
  });

  it('rounds boosted play counts up at higher multipliers', () => {
    expect(applyCardProgressMultiplier(3, 1.25)).eq(4);
    expect(applyCardProgressMultiplier(4, 1.5)).eq(6);
  });

  it('never awards fewer plays than were actually played', () => {
    expect(applyCardProgressMultiplier(1, 1.15)).eq(1);
  });

  it('sums card progress bonuses from ascension nodes', () => {
    const effects = computeAscensionEffects(['asc_progress_1', 'asc_mentor']);
    expect(effects.cardProgressMultiplierBonus).eq(0.4);
    expect(getAscensionCardProgressMultiplier(['asc_progress_1', 'asc_mentor'])).eq(1.4);
  });

  it('levels cards faster when boosted plays are recorded', () => {
    const boosted = recordCardPlays(
      {timesPlayed: 0, level: 0, upgrades: {}, costReduction: 0, bonusMultiplier: 1, canBan: false, deckPositionBonus: 0, mastered: false},
      applyCardProgressMultiplier(4, 1.5),
    );
    const normal = recordCardPlays(
      {timesPlayed: 0, level: 0, upgrades: {}, costReduction: 0, bonusMultiplier: 1, canBan: false, deckPositionBonus: 0, mastered: false},
      4,
    );
    expect(calculateCardLevel(boosted.timesPlayed)).gt(calculateCardLevel(normal.timesPlayed));
  });
});
