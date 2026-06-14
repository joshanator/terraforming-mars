import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {ProfileManager} from '../roguelike/ProfileManager';
import {CardName} from '../../common/cards/CardName';
import {UpgradeNodeId} from '../../common/roguelike/UpgradeNode';
import {AscensionNodeId} from '../../common/roguelike/AscensionTree';
import {getAvailableAscensionPoints} from '../../common/roguelike/Profile';
import {getLevel} from '../../common/roguelike/Leveling';
import {getRoguelikeSettings} from '../roguelike/RoguelikeGameSetup';

/** Helper to parse JSON body from request */
async function parseBody<T>(req: Request): Promise<T | undefined> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (data) => {
      body += data.toString();
    });
    req.once('end', () => {
      try {
        resolve(JSON.parse(body) as T);
      } catch {
        resolve(undefined);
      }
    });
  });
}

/**
 * GET /api/roguelike/profiles - List all profiles
 */
export class ApiRoguelikeProfiles extends Handler {
  public static readonly INSTANCE = new ApiRoguelikeProfiles();

  private constructor() {
    super();
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const profiles = ProfileManager.getInstance().getAllProfiles();
    const summaries = profiles.map((p) => ({
      id: p.id,
      name: p.name,
      totalXP: p.totalXP,
      level: getLevel(p.totalXP),
      ascensionPoints: getAvailableAscensionPoints(p),
      ascensionCount: p.ascensionCount ?? 0,
      ascensionNodes: p.ascensionTree?.unlockedNodes.length ?? 0,
      totalRuns: p.stats.totalRuns,
      totalWins: p.stats.totalWins,
    }));
    responses.writeJson(res, ctx, summaries);
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const body = await parseBody<{name: string}>(req);
    if (!body?.name) {
      responses.badRequest(req, res, 'missing name');
      return;
    }

    const profile = ProfileManager.getInstance().createProfile(body.name);
    responses.writeJson(res, ctx, profile);
  }
}

/**
 * GET/PUT/DELETE /api/roguelike/profile?id=xxx - Single profile operations
 */
export class ApiRoguelikeProfile extends Handler {
  public static readonly INSTANCE = new ApiRoguelikeProfile();

  private constructor() {
    super();
  }

  public override async get(req: Request, res: Response, ctx: Context): Promise<void> {
    const profileId = ctx.url.searchParams.get('id');
    if (!profileId) {
      responses.badRequest(req, res, 'missing id parameter');
      return;
    }

    // Selecting a profile in the base screen hits this endpoint. Hard-reload
    // from disk here so manual edits to the profile JSON take effect without a
    // server restart. (Other endpoints keep using the in-memory cache.)
    const profile = ProfileManager.getInstance().reloadProfile(profileId);
    if (!profile) {
      responses.notFound(req, res);
      return;
    }

    responses.writeJson(res, ctx, profile);
  }

  public override async put(req: Request, res: Response, ctx: Context): Promise<void> {
    const profileId = ctx.url.searchParams.get('id');
    if (!profileId) {
      responses.badRequest(req, res, 'missing id parameter');
      return;
    }

    const body = await parseBody<{name?: string}>(req);
    if (!body) {
      responses.badRequest(req, res, 'invalid body');
      return;
    }

    if (body.name) {
      const profile = ProfileManager.getInstance().updateProfileName(profileId, body.name);
      if (!profile) {
        responses.notFound(req, res);
        return;
      }
      responses.writeJson(res, ctx, profile);
    } else {
      responses.badRequest(req, res, 'nothing to update');
    }
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const profileId = ctx.url.searchParams.get('id');
    const action = ctx.url.searchParams.get('action');

    if (!profileId) {
      responses.badRequest(req, res, 'missing id parameter');
      return;
    }

    if (action === 'delete') {
      const success = ProfileManager.getInstance().deleteProfile(profileId);
      if (!success) {
        responses.notFound(req, res);
        return;
      }
      responses.writeJson(res, ctx, {success: true});
    } else {
      responses.badRequest(req, res, 'unknown action');
    }
  }
}

/**
 * POST /api/roguelike/upgrade - Unlock an upgrade node
 */
export class ApiRoguelikeUpgrade extends Handler {
  public static readonly INSTANCE = new ApiRoguelikeUpgrade();

  private constructor() {
    super();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const body = await parseBody<{profileId: string; nodeId: UpgradeNodeId}>(req);
    if (!body?.profileId || !body?.nodeId) {
      responses.badRequest(req, res, 'missing profileId or nodeId');
      return;
    }

    const result = ProfileManager.getInstance().unlockUpgrade(body.profileId, body.nodeId);
    if (!result.success) {
      responses.badRequest(req, res, result.error ?? 'Unknown error');
      return;
    }

    const profile = ProfileManager.getInstance().getProfile(body.profileId);
    responses.writeJson(res, ctx, profile);
  }
}

/**
 * POST /api/roguelike/ban - Ban or unban a card
 */
export class ApiRoguelikeBan extends Handler {
  public static readonly INSTANCE = new ApiRoguelikeBan();

  private constructor() {
    super();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const body = await parseBody<{profileId: string; cardName: CardName; action: 'ban' | 'unban'}>(req);
    if (!body?.profileId || !body?.cardName || !body?.action) {
      responses.badRequest(req, res, 'missing profileId, cardName, or action');
      return;
    }

    let result: {success: boolean; error?: string};
    if (body.action === 'ban') {
      result = ProfileManager.getInstance().banCard(body.profileId, body.cardName);
    } else if (body.action === 'unban') {
      result = ProfileManager.getInstance().unbanCard(body.profileId, body.cardName);
    } else {
      responses.badRequest(req, res, 'action must be "ban" or "unban"');
      return;
    }

    if (!result.success) {
      responses.badRequest(req, res, result.error ?? 'Unknown error');
      return;
    }

    const profile = ProfileManager.getInstance().getProfile(body.profileId);
    responses.writeJson(res, ctx, profile);
  }
}

/**
 * POST /api/roguelike/ascension - Unlock an ascension tree node
 */
export class ApiRoguelikeAscension extends Handler {
  public static readonly INSTANCE = new ApiRoguelikeAscension();

  private constructor() {
    super();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const body = await parseBody<{profileId: string; nodeId: AscensionNodeId}>(req);
    if (!body?.profileId || !body?.nodeId) {
      responses.badRequest(req, res, 'missing profileId or nodeId');
      return;
    }

    const result = ProfileManager.getInstance().unlockAscensionNode(body.profileId, body.nodeId);
    if (!result.success) {
      responses.badRequest(req, res, result.error ?? 'Unknown error');
      return;
    }

    const profile = ProfileManager.getInstance().getProfile(body.profileId);
    responses.writeJson(res, ctx, profile);
  }
}

/**
 * POST /api/roguelike/card-upgrade - Purchase a per-card upgrade
 */
export class ApiRoguelikeCardUpgrade extends Handler {
  public static readonly INSTANCE = new ApiRoguelikeCardUpgrade();

  private constructor() {
    super();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const body = await parseBody<{profileId: string; cardName: CardName; upgradeId: string}>(req);
    if (!body?.profileId || !body?.cardName || !body?.upgradeId) {
      responses.badRequest(req, res, 'missing profileId, cardName, or upgradeId');
      return;
    }

    const result = ProfileManager.getInstance().purchaseCardUpgrade(body.profileId, body.cardName, body.upgradeId);
    if (!result.success) {
      responses.badRequest(req, res, result.error ?? 'Unknown error');
      return;
    }

    const profile = ProfileManager.getInstance().getProfile(body.profileId);
    responses.writeJson(res, ctx, profile);
  }
}

/**
 * POST /api/roguelike/ascend - Ascend (prestige): convert this cycle's XP into
 * permanent ascension points and reset the rest of the profile.
 */
export class ApiRoguelikeAscend extends Handler {
  public static readonly INSTANCE = new ApiRoguelikeAscend();

  private constructor() {
    super();
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const body = await parseBody<{profileId: string}>(req);
    if (!body?.profileId) {
      responses.badRequest(req, res, 'missing profileId');
      return;
    }

    const result = ProfileManager.getInstance().ascend(body.profileId);
    if (!result.success) {
      responses.badRequest(req, res, result.error ?? 'Unknown error');
      return;
    }

    responses.writeJson(res, ctx, {profile: result.profile, pointsEarned: result.pointsEarned});
  }
}

/**
 * GET /api/roguelike/settings?id=xxx - Computed starting bonuses for a profile
 */
export class ApiRoguelikeSettings extends Handler {
  public static readonly INSTANCE = new ApiRoguelikeSettings();

  private constructor() {
    super();
  }

  public override async get(req: Request, res: Response, ctx: Context): Promise<void> {
    const profileId = ctx.url.searchParams.get('id');
    if (!profileId) {
      responses.badRequest(req, res, 'missing id parameter');
      return;
    }

    const settings = getRoguelikeSettings(profileId);
    if (!settings) {
      responses.notFound(req, res);
      return;
    }

    responses.writeJson(res, ctx, settings);
  }
}
