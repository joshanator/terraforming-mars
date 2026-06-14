import {IPlayer} from '../IPlayer';
import {GameOptions} from '../game/GameOptions';
import {CardName} from '../../common/cards/CardName';
import {ProfileManager} from './ProfileManager';
import {calculateUpgradeBonuses, ComputedUpgradeBonuses} from '../../common/roguelike/UpgradeTreeState';
import {AscensionEffects, computeAscensionEffects} from '../../common/roguelike/AscensionTree';
import {ROGUELIKE_BASE_TR, ROGUELIKE_BASE_STARTING_CARDS, ROGUELIKE_MAX_UPGRADE_PRELUDE_CHOICES} from '../../common/roguelike/constants';
import * as constants from '../../common/constants';

/** Summary of the active ascension-tree effects for a run. */
export interface AscensionSummary {
  /** Combined effects from all unlocked ascension nodes. */
  effects: AscensionEffects;
  /** Run XP multiplier (1.0 base + ascension bonus). */
  xpMultiplier: number;
}

/**
 * Computed roguelike settings for a game.
 * Combines upgrade-tree bonuses and ascension-tree effects.
 */
export interface RoguelikeGameSettings {
  /** Profile ID being used */
  profileId: string;
  /** Base starting TR before upgrade/ascension bonuses */
  baseTR: number;
  /** Base starting project cards before upgrade/ascension bonuses */
  baseStartingCards: number;
  /** Bonuses from the upgrade tree */
  upgradeBonuses: ComputedUpgradeBonuses;
  /** Active ascension-tree effects */
  ascension: AscensionSummary;
  /** Net TR adjustment (upgrade bonus + ascension effect) */
  netTRBonus: number;
  /** Net MC adjustment */
  netMCBonus: number;
  /** Net starting cards adjustment */
  netCardDrawBonus: number;
  /** Number of prelude slots (played) */
  preludeSlots: number;
  /** Extra prelude options to choose from (beyond slots) */
  preludeChoices: number;
  /** Number of starting corporations to choose from */
  corporationChoices: number;
  /** Card cost increase from ascension */
  cardCostIncrease: number;
  /** Net generation adjustment from ascension (negative = shorter run) */
  generationPenalty: number;
  /** Total number of generations the run will last */
  totalGenerations: number;
}

/** Base number of generations for a solo roguelike run before upgrades and ascension penalties. */
export const ROGUELIKE_BASE_GENERATIONS = 8;

/** A run can never be shortened below this many generations by ascension penalties. */
export const ROGUELIKE_MIN_GENERATIONS = 4;

/**
 * Get roguelike settings for a game based on the profile.
 */
export function getRoguelikeSettings(profileId: string): RoguelikeGameSettings | undefined {
  const profile = ProfileManager.getInstance().getProfile(profileId);
  if (!profile) {
    return undefined;
  }

  const upgradeBonuses = calculateUpgradeBonuses(profile.upgradeTree);
  const effects = computeAscensionEffects(profile.ascensionTree?.unlockedNodes ?? []);
  const ascension: AscensionSummary = {
    effects,
    xpMultiplier: 1.0 + effects.xpMultiplierBonus,
  };

  return {
    profileId,
    baseTR: ROGUELIKE_BASE_TR,
    baseStartingCards: ROGUELIKE_BASE_STARTING_CARDS,
    upgradeBonuses,
    ascension,
    netTRBonus: upgradeBonuses.startingTRBonus + effects.trBonus,
    netMCBonus: upgradeBonuses.startingMCBonus + effects.mcBonus,
    netCardDrawBonus: upgradeBonuses.extraCardDraw + effects.cardDrawBonus,
    preludeSlots: upgradeBonuses.preludeSlots,
    preludeChoices: Math.min(ROGUELIKE_MAX_UPGRADE_PRELUDE_CHOICES, upgradeBonuses.preludeChoices) +
      effects.preludeChoicesBonus,
    corporationChoices: constants.CORPORATION_CARDS_DEALT_PER_PLAYER + upgradeBonuses.corporationChoices,
    cardCostIncrease: effects.cardCostIncrease,
    generationPenalty: effects.generationBonus,
    totalGenerations: Math.max(
      ROGUELIKE_MIN_GENERATIONS,
      ROGUELIKE_BASE_GENERATIONS + upgradeBonuses.generationBonus + effects.generationBonus,
    ),
  };
}

/**
 * Apply roguelike starting bonuses to a solo player.
 * Called after the base TR is set.
 */
export function applyRoguelikeStartingBonuses(
  player: IPlayer,
  gameOptions: GameOptions,
): void {
  if (!gameOptions.roguelikeProfileId) {
    return;
  }

  const settings = getRoguelikeSettings(gameOptions.roguelikeProfileId);
  if (!settings) {
    console.log(`Roguelike profile ${gameOptions.roguelikeProfileId} not found`);
    return;
  }

  // Apply TR bonus/penalty on top of the roguelike base
  player.setTerraformRating(Math.max(1, ROGUELIKE_BASE_TR + settings.netTRBonus));

  // Store starting resource bonuses on the player for when corporation is played
  // These are applied in Player.playCorporationCard()
  (player as any).roguelikeStartingMCBonus = settings.netMCBonus;
  (player as any).roguelikeStartingSteelBonus = settings.upgradeBonuses.startingSteelBonus;
  (player as any).roguelikeStartingTitaniumBonus = settings.upgradeBonuses.startingTitaniumBonus;
  (player as any).roguelikeCardCostIncrease = settings.cardCostIncrease;

  console.log(`Applied roguelike bonuses: TR ${settings.netTRBonus >= 0 ? '+' : ''}${settings.netTRBonus}, MC ${settings.netMCBonus >= 0 ? '+' : ''}${settings.netMCBonus}`);
}

/**
 * Get the number of project cards to deal for a roguelike game.
 */
export function getRoguelikeCardDealCount(gameOptions: GameOptions): number {
  const baseCount = ROGUELIKE_BASE_STARTING_CARDS;

  if (!gameOptions.roguelikeProfileId) {
    return 10;
  }

  const settings = getRoguelikeSettings(gameOptions.roguelikeProfileId);
  if (!settings) {
    return baseCount;
  }

  return Math.max(1, baseCount + settings.netCardDrawBonus);
}

/**
 * Get the number of starting corporations to deal for a game.
 * In roguelike mode, extra options come from the upgrade tree.
 */
export function getRoguelikeCorporationCount(gameOptions: GameOptions): number {
  const baseCount = constants.CORPORATION_CARDS_DEALT_PER_PLAYER;

  if (!gameOptions.roguelikeProfileId) {
    return gameOptions.startingCorporations ?? baseCount;
  }

  const settings = getRoguelikeSettings(gameOptions.roguelikeProfileId);
  if (!settings) {
    return gameOptions.startingCorporations ?? baseCount;
  }

  return settings.corporationChoices;
}

/** Compute prelude deal/keep counts for roguelike mode. */
export function computeRoguelikePreludeCounts(
  preludeSlots: number,
  upgradePreludeChoices: number,
  ascensionPreludeChoices: number,
): {preludesDealt: number; preludesKept: number; extraChoices: number} {
  const extraChoices = Math.min(ROGUELIKE_MAX_UPGRADE_PRELUDE_CHOICES, upgradePreludeChoices) +
    ascensionPreludeChoices;
  const preludesDealt = preludeSlots + extraChoices;
  const preludesKept = Math.min(preludeSlots, preludesDealt);
  return {preludesDealt, preludesKept, extraChoices};
}

/**
 * Get prelude configuration for roguelike mode.
 */
export function getRoguelikePreludeConfig(gameOptions: GameOptions): {
  shouldDealPreludes: boolean;
  preludesDealt: number;
  preludesKept: number;
} {
  if (!gameOptions.roguelikeProfileId) {
    return {
      shouldDealPreludes: gameOptions.preludeExtension,
      preludesDealt: gameOptions.startingPreludes ?? 4,
      preludesKept: 2,
    };
  }

  const settings = getRoguelikeSettings(gameOptions.roguelikeProfileId);
  if (!settings) {
    return {
      shouldDealPreludes: gameOptions.preludeExtension,
      preludesDealt: gameOptions.startingPreludes ?? 4,
      preludesKept: 2,
    };
  }

  // In roguelike mode, preludes are unlocked through the upgrade tree
  const shouldDealPreludes = settings.preludeSlots > 0;
  const {preludesDealt, preludesKept} = computeRoguelikePreludeCounts(
    settings.preludeSlots,
    settings.upgradeBonuses.preludeChoices,
    settings.ascension.effects.preludeChoicesBonus,
  );

  return {
    shouldDealPreludes,
    preludesDealt,
    preludesKept,
  };
}

/**
 * Get the last generation for a roguelike solo game.
 *
 * In roguelike mode the run length is fully determined by the roguelike base, the
 * player's upgrade tree, and their ascension penalty (not the vanilla solo length),
 * so the passed-in base generation is only used as a fallback when no roguelike
 * settings are available.
 */
export function getRoguelikeLastGeneration(baseLastGeneration: number, gameOptions: GameOptions): number {
  if (!gameOptions.roguelikeProfileId) {
    return baseLastGeneration;
  }

  const settings = getRoguelikeSettings(gameOptions.roguelikeProfileId);
  if (!settings) {
    return baseLastGeneration;
  }

  return settings.totalGenerations;
}

/**
 * Get mastered cards that should be guaranteed in starting hand.
 */
export function getMasteredCards(profileId: string): Set<string> {
  return new Set(ProfileManager.getInstance().getMasteredCards(profileId));
}

/**
 * Get all cards banned for this profile's runs: wildcard-banned cards plus
 * cards permanently banned via their own "Ban Card" upgrade.
 */
export function getBannedCards(profileId: string): ReadonlyArray<CardName> {
  return ProfileManager.getInstance().getEffectiveBannedCards(profileId);
}

/**
 * Get cards with deck position bonuses for weighted drawing.
 */
export function getCardsWithDeckBonus(profileId: string): Map<string, number> {
  return ProfileManager.getInstance().getCardsWithDeckBonus(profileId);
}
