import {expect} from 'chai';
import * as constants from '../../src/common/constants';
import {calculateUpgradeBonuses} from '../../src/common/roguelike/UpgradeTreeState';
import {computeRoguelikePreludeCounts, getRoguelikeCorporationCount} from '../../src/server/roguelike/RoguelikeGameSetup';
import {ROGUELIKE_MAX_UPGRADE_PRELUDE_CHOICES} from '../../src/common/roguelike/constants';
import {DEFAULT_GAME_OPTIONS} from '../../src/server/game/GameOptions';
import {ProfileManager} from '../../src/server/roguelike/ProfileManager';
import {createProfile} from '../../src/common/roguelike/Profile';

describe('RoguelikeGameSetup', () => {
  it('calculates corporation choices from upgrade tree', () => {
    const bonuses = calculateUpgradeBonuses({
      unlockedNodes: ['corp_choices_1', 'corp_choices_2'],
      bannedCards: [],
    });
    expect(bonuses.corporationChoices).eq(2);
  });

  it('deals extra corporations in roguelike mode', () => {
    const profile = createProfile('test');
    profile.upgradeTree.unlockedNodes = ['corp_choices_1'];
    (ProfileManager.getInstance() as unknown as {profiles: Map<string, unknown>}).profiles.set(profile.id, profile);

    const count = getRoguelikeCorporationCount({
      ...DEFAULT_GAME_OPTIONS,
      roguelikeProfileId: profile.id,
    });

    expect(count).eq(constants.CORPORATION_CARDS_DEALT_PER_PLAYER + 1);
  });

  it('uses zero base prelude options and caps upgrade choices at six', () => {
    expect(computeRoguelikePreludeCounts(2, 0, 0)).to.deep.equal({
      extraChoices: 0,
      preludesDealt: 2,
      preludesKept: 2,
    });

    expect(computeRoguelikePreludeCounts(1, 2, 0)).to.deep.equal({
      extraChoices: 2,
      preludesDealt: 3,
      preludesKept: 1,
    });

    expect(computeRoguelikePreludeCounts(2, 999, 2)).to.deep.equal({
      extraChoices: ROGUELIKE_MAX_UPGRADE_PRELUDE_CHOICES + 2,
      preludesDealt: 2 + ROGUELIKE_MAX_UPGRADE_PRELUDE_CHOICES + 2,
      preludesKept: 2,
    });
  });
});
