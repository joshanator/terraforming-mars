import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {CardName} from '../../common/cards/CardName';
import {
  RunStats,
  RunXPSummary,
  calculateRunXPSummary,
} from '../../common/roguelike/XPReward';
import {getAscensionXPMultiplier} from '../../common/roguelike/AscensionTree';
import {ProfileManager} from './ProfileManager';
import {getRoguelikeSettings} from './RoguelikeGameSetup';
import {RoguelikeProfile, createProfileStats} from '../../common/roguelike/Profile';
import * as constants from '../../common/constants';

/**
 * Calculates XP rewards at the end of a solo game.
 * Tracks cards played, tiles placed, and global parameter completion.
 */
export class XPCalculator {
  /**
   * Calculate and apply XP rewards for a completed solo game.
   * @param game The completed game
   * @param profileId The roguelike profile ID (if any)
   * @returns The XP summary, or undefined if not a roguelike game
   */
  public static processGameEnd(
    game: IGame,
    profileId: string | undefined,
    aborted: boolean = false,
  ): RunXPSummary | undefined {
    if (!game.isSoloMode()) {
      return undefined;
    }

    if (!profileId) {
      return undefined;
    }

    const profile = ProfileManager.getInstance().getProfile(profileId);
    if (!profile) {
      console.log(`Roguelike profile ${profileId} not found for XP calculation`);
      return undefined;
    }

    const player = game.players[0];
    const stats = XPCalculator.collectRunStats(game, player, profile);
    const ascensionMultiplier = getAscensionXPMultiplier(profile.ascensionTree?.unlockedNodes ?? []);
    const summary = calculateRunXPSummary(stats, ascensionMultiplier, aborted);

    // Apply rewards to profile
    ProfileManager.getInstance().applyRunRewards(profileId, summary);

    console.log(`Roguelike XP awarded: ${summary.profileXP.total} XP to profile ${profileId}`);

    return summary;
  }

  /**
   * Collect statistics from a completed game for XP calculation.
   */
  public static collectRunStats(game: IGame, player: IPlayer, profile: RoguelikeProfile): RunStats {
    const vpb = player.getVictoryPoints();

    // Collect cards played (from playedCards tableau)
    const cardsPlayedList: CardName[] = player.playedCards.asArray().map((card) => card.name);

    // Count tiles placed by the player
    const tilesPlaced = game.board.spaces.filter((space) =>
      space.tile !== undefined && space.player?.id === player.id,
    ).length;

    // Check global parameter completion
    const temperatureMaxed = game.getTemperature() >= constants.MAX_TEMPERATURE;
    const oxygenMaxed = game.getOxygenLevel() >= constants.MAX_OXYGEN_LEVEL;
    const oceansMaxed = game.board.getOceanSpaces().length >= constants.MAX_OCEAN_TILES;

    // Venus (if applicable)
    let venusMaxed = false;
    if (game.gameOptions.venusNextExtension) {
      venusMaxed = game.getVenusScaleLevel() >= constants.MAX_VENUS_SCALE;
    }

    // Check win condition
    const won = game.isSoloModeWin();
    const ascensionStats = profile.ascensionStats ?? createProfileStats();
    const winStreak = won ? ascensionStats.currentWinStreak + 1 : 0;

    return {
      finalVP: vpb.total,
      startingVP: XPCalculator.getStartingVP(player, game),
      cardsPlayed: cardsPlayedList.length,
      tilesPlaced,
      temperatureMaxed,
      oxygenMaxed,
      oceansMaxed,
      venusMaxed,
      won,
      winStreak,
      cardsPlayedList,
    };
  }

  /**
   * VP from starting TR, excluded from XP gain. Captured at game init for roguelike runs.
   */
  private static getStartingVP(player: IPlayer, game: IGame): number {
    const stored = (player as {roguelikeStartingVP?: number}).roguelikeStartingVP;
    if (typeof stored === 'number') {
      return stored;
    }

    if (!game.gameOptions.roguelikeProfileId) {
      return 0;
    }

    const settings = getRoguelikeSettings(game.gameOptions.roguelikeProfileId);
    if (!settings) {
      return 0;
    }

    return settings.baseTR + settings.netTRBonus + player.handicap;
  }

  /**
   * Get cards played during a game (for tracking).
   * Called during gameplay to track individual card plays.
   */
  public static getCardsPlayedThisGame(player: IPlayer): CardName[] {
    return player.playedCards.asArray().map((card) => card.name);
  }
}
