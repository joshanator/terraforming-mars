import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Game} from '../Game';
import {GameOptions, DEFAULT_GAME_OPTIONS} from '../game/GameOptions';
import {Player} from '../Player';
import {safeCast, isGameId, isSpectatorId, isPlayerId} from '../../common/Types';
import {generateRandomId} from '../utils/server-ids';
import {Request} from '../Request';
import {Response} from '../Response';
import {ProfileManager} from '../roguelike/ProfileManager';

export class ApiRoguelikeStart extends Handler {
  public static readonly INSTANCE = new ApiRoguelikeStart();

  public override post(req: Request, res: Response, ctx: Context): Promise<void> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (data) => {
        body += data.toString();
      });
      req.once('end', () => {
        try {
          const {profileId} = JSON.parse(body);
          
          const profile = ProfileManager.getInstance().getProfile(profileId);
          if (!profile) {
            responses.badRequest(req, res, 'Profile not found');
            resolve();
            return;
          }

          const gameId = safeCast(generateRandomId('g'), isGameId);
          const spectatorId = safeCast(generateRandomId('s'), isSpectatorId);
          const playerId = safeCast(generateRandomId('p'), isPlayerId);
          
          const player = new Player(
            profile.name,
            'blue',
            false,
            0,
            playerId,
          );

          const gameOptions: GameOptions = {
            ...DEFAULT_GAME_OPTIONS,
            roguelikeProfileId: profileId,
            // Solo mode settings
            soloTR: true,
            draftVariant: false,
            initialDraftVariant: false,
            // Enable common expansions - can be customized later
            corporateEra: true,
            preludeExtension: false, // Controlled by upgrade tree
            venusNextExtension: false,
            coloniesExtension: false,
            turmoilExtension: false,
            // Disable multiplayer features
            undoOption: false,
            showTimers: false,
          };

          const seed = Math.random();
          const game = Game.newInstance(gameId, [player], player, spectatorId, gameOptions, seed);
          ctx.gameLoader.add(game);
          
          responses.writeJson(res, ctx, {
            id: game.id,
            playerId: player.id,
            url: `/player?id=${player.id}`,
          });
        } catch (error) {
          responses.internalServerError(req, res, error);
        }
        resolve();
      });
    });
  }
}
