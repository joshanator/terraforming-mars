import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {isPlayerId} from '../../common/Types';
import {XPCalculator} from '../roguelike/XPCalculator';
import {Phase} from '../../common/Phase';

export class ApiRoguelikeAbort extends Handler {
  public static readonly INSTANCE = new ApiRoguelikeAbort();

  public override post(req: Request, res: Response, ctx: Context): Promise<void> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (data) => {
        body += data.toString();
      });
      req.once('end', async () => {
        try {
          const {playerId} = JSON.parse(body);
          
          if (!playerId || !isPlayerId(playerId)) {
            responses.badRequest(req, res, 'Invalid player ID');
            resolve();
            return;
          }

          const game = await ctx.gameLoader.getGame(playerId);
          if (!game) {
            responses.notFound(req, res, 'Game not found');
            resolve();
            return;
          }

          if (!game.gameOptions.roguelikeProfileId) {
            responses.badRequest(req, res, 'Not a roguelike game');
            resolve();
            return;
          }

          // Calculate XP based on current state (not a win)
          const xpSummary = XPCalculator.processGameEnd(game, game.gameOptions.roguelikeProfileId, true);
          
          if (xpSummary) {
            game.roguelikeXPSummary = xpSummary;
          }

          // End the game
          game.phase = Phase.END;
          
          responses.writeJson(res, ctx, {
            success: true,
            xpSummary,
          });
        } catch (error) {
          responses.internalServerError(req, res, error);
        }
        resolve();
      });
    });
  }
}
