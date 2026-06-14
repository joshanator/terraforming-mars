import {expect} from 'chai';
import {
  calculateCardsPlayedXP,
  calculateTilesPlacedXP,
  calculateVPXP,
  calculateWinStreakMultiplier,
  calculateXPReward,
  XP_CONSTANTS,
} from '../../src/common/roguelike/XPReward';

describe('XPReward VP curve', () => {
  it('awards no VP XP at zero earned VP', () => {
    expect(calculateVPXP(0)).eq(0);
  });

  it('anchors a good run around 90 earned VP', () => {
    expect(calculateVPXP(90)).eq(90);
  });

  it('rewards exceptional scores disproportionately more than good ones', () => {
    const good = calculateVPXP(90);
    const exceptional = calculateVPXP(150);
    expect(exceptional).eq(193);
    expect(exceptional / good).to.be.greaterThan(150 / 90);
  });
});

describe('XPReward cards curve', () => {
  it('anchors a good run around 20 cards played', () => {
    expect(calculateCardsPlayedXP(20)).eq(20);
  });

  it('rewards exceptional card counts disproportionately more', () => {
    const good = calculateCardsPlayedXP(20);
    const exceptional = calculateCardsPlayedXP(35);
    expect(exceptional).eq(46);
    expect(exceptional / good).to.be.greaterThan(35 / 20);
  });
});

describe('XPReward tiles curve', () => {
  it('anchors a good run around 12 tiles placed', () => {
    expect(calculateTilesPlacedXP(12)).eq(24);
  });

  it('rewards exceptional tile counts disproportionately more', () => {
    const good = calculateTilesPlacedXP(12);
    const exceptional = calculateTilesPlacedXP(20);
    expect(exceptional).eq(51);
    expect(exceptional / good).to.be.greaterThan(20 / 12);
  });
});

describe('XPReward win multipliers', () => {
  it('uses no streak multiplier for a first win or a loss', () => {
    expect(calculateWinStreakMultiplier(true, 1)).eq(1);
    expect(calculateWinStreakMultiplier(false, 0)).eq(1);
  });

  it('scales streak multiplier for successive wins', () => {
    expect(calculateWinStreakMultiplier(true, 2)).eq(1.15);
    expect(calculateWinStreakMultiplier(true, 3)).eq(1.3);
    expect(calculateWinStreakMultiplier(true, 5)).eq(1.6);
  });

  it('applies win and streak multipliers to base XP', () => {
    const reward = calculateXPReward({
      finalVP: 10,
      startingVP: 5,
      cardsPlayed: 0,
      tilesPlaced: 0,
      temperatureMaxed: false,
      oxygenMaxed: false,
      oceansMaxed: false,
      venusMaxed: false,
      won: true,
      winStreak: 3,
      cardsPlayedList: [],
    }, 1);

    const baseXP = calculateVPXP(5);
    expect(reward.baseXP).eq(baseXP);
    expect(reward.winMultiplier).eq(XP_CONSTANTS.WIN_XP_MULTIPLIER);
    expect(reward.winStreakMultiplier).eq(1.3);
    expect(reward.subtotal).eq(Math.floor(baseXP * XP_CONSTANTS.WIN_XP_MULTIPLIER * 1.3));
    expect(reward.total).eq(reward.subtotal);
  });

  it('does not apply win multipliers on a loss', () => {
    const reward = calculateXPReward({
      finalVP: 95,
      startingVP: 5,
      cardsPlayed: 20,
      tilesPlaced: 12,
      temperatureMaxed: true,
      oxygenMaxed: false,
      oceansMaxed: false,
      venusMaxed: false,
      won: false,
      winStreak: 0,
      cardsPlayedList: [],
    }, 1);

    expect(reward.winMultiplier).eq(1);
    expect(reward.winStreakMultiplier).eq(1);
    expect(reward.subtotal).eq(reward.baseXP);
  });
});
