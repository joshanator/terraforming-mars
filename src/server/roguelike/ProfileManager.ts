import {existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync} from 'fs';
import * as path from 'path';
import {
  RoguelikeProfile,
  ProfileStats,
  createProfile,
  createProfileStats,
  isValidProfile,
  getCardProgress,
  setCardProgress,
  getAvailableUpgradePoints,
  isAscensionUnlocked,
  getAvailableAscensionPoints,
  getPendingAscensionPoints,
  canAscend,
  isAscensionTreeAvailable,
  PROFILE_VERSION,
} from '../../common/roguelike/Profile';
import {getEarnedAscensionPoints} from '../../common/roguelike/AscensionPoints';
import {createUpgradeTreeState} from '../../common/roguelike/UpgradeTreeState';
import {RunStats} from '../../common/roguelike/XPReward';
import {
  createCardProgress,
  recordCardPlays,
} from '../../common/roguelike/CardProgress';
import {
  purchaseCardUpgrade as purchaseCardUpgradeOnProgress,
  recomputeCardBonuses,
} from '../../common/roguelike/CardUpgrade';
import {
  UpgradeNodeId,
  getUpgradeNode,
  canUnlockNode,
} from '../../common/roguelike/UpgradeNode';
import {
  calculateUpgradeBonuses,
  ComputedUpgradeBonuses,
} from '../../common/roguelike/UpgradeTreeState';
import {
  AscensionNodeId,
  getAscensionNode,
  canUnlockAscensionNode,
  createAscensionTreeState,
} from '../../common/roguelike/AscensionTree';
import {RunXPSummary} from '../../common/roguelike/XPReward';
import {CardName} from '../../common/cards/CardName';

const defaultProfilesFolder = path.resolve(process.cwd(), './db/roguelike-profiles');

/**
 * Manages roguelike player profiles with JSON file persistence.
 * Each profile is stored as a separate JSON file.
 */
export class ProfileManager {
  private static instance: ProfileManager | undefined;
  private readonly profilesFolder: string;
  private profiles: Map<string, RoguelikeProfile> = new Map();

  constructor(profilesFolder: string = defaultProfilesFolder) {
    this.profilesFolder = profilesFolder;
  }

  public static getInstance(): ProfileManager {
    if (!ProfileManager.instance) {
      ProfileManager.instance = new ProfileManager();
    }
    return ProfileManager.instance;
  }

  /** Initialize the profile manager and load existing profiles */
  public async initialize(): Promise<void> {
    console.log(`Initializing roguelike profiles at ${this.profilesFolder}`);

    if (!existsSync(this.profilesFolder)) {
      mkdirSync(this.profilesFolder, {recursive: true});
    }

    await this.loadAllProfiles();
  }

  /** Load all profiles from disk */
  private async loadAllProfiles(): Promise<void> {
    const entries = readdirSync(this.profilesFolder, {withFileTypes: true});

    for (const dirent of entries) {
      if (dirent.isFile() && dirent.name.endsWith('.json')) {
        this.loadProfileFromFile(dirent.name);
      }
    }

    console.log(`Loaded ${this.profiles.size} roguelike profiles`);
  }

  /**
   * Read a single profile file from disk, validate/migrate it, and cache it in
   * memory. Returns the loaded profile, or undefined if the file is missing or
   * invalid. Used both on startup and for on-demand hard reloads.
   */
  private loadProfileFromFile(fileName: string): RoguelikeProfile | undefined {
    try {
      const filePath = path.resolve(this.profilesFolder, fileName);
      const text = readFileSync(filePath, 'utf-8');
      const profile = JSON.parse(text);

      if (isValidProfile(profile)) {
        const migratedProfile = this.migrateProfile(profile);
        this.profiles.set(migratedProfile.id, migratedProfile);
        return migratedProfile;
      }

      console.error(`Invalid profile format: ${fileName}`);
    } catch (e) {
      console.error(`Error loading profile ${fileName}:`, e);
    }
    return undefined;
  }

  /**
   * Force a re-read of a single profile from disk, replacing the in-memory copy.
   * This lets manual edits to the JSON file take effect without restarting the
   * server. If the file no longer exists, the cached copy is dropped.
   */
  public reloadProfile(profileId: string): RoguelikeProfile | undefined {
    const filePath = this.getFilename(profileId);
    if (!existsSync(filePath)) {
      this.profiles.delete(profileId);
      return undefined;
    }
    return this.loadProfileFromFile(`${profileId}.json`);
  }

  /** Migrate profile to current version if needed */
  private migrateProfile(profile: RoguelikeProfile): RoguelikeProfile {
    if (profile.version === PROFILE_VERSION &&
        profile.ascensionTree !== undefined &&
        profile.ascensionStats !== undefined) {
      return profile;
    }

    // v1 -> v2: ascension became an upgrade tree. Add an empty ascension tree
    // for profiles that predate it.
    const ascensionTree = profile.ascensionTree ?? createAscensionTreeState();

    // v2 -> v3: ascension points became an explicit, persisted currency earned
    // by ascending (rather than being derived from totalXP). Grandfather
    // existing players by crediting them the points their current XP had
    // earned, so previously-spent ascension nodes stay paid for. Also seed the
    // current-ascension stats from their lifetime stats (they're still on their
    // first ascension cycle).
    const migratedAscensionPoints = Math.max(
      profile.ascensionPoints ?? 0,
      getEarnedAscensionPoints(profile.totalXP),
    );

    return {
      ...profile,
      ascensionTree,
      ascensionCount: profile.ascensionCount ?? 0,
      ascensionPoints: migratedAscensionPoints,
      ascensionStats: profile.ascensionStats ?? {...profile.stats},
      version: PROFILE_VERSION,
    };
  }

  /** Get filename for a profile */
  private getFilename(profileId: string): string {
    return path.resolve(this.profilesFolder, `${profileId}.json`);
  }

  /** Save a profile to disk */
  private saveProfile(profile: RoguelikeProfile): void {
    profile.updatedAt = Date.now();
    const text = JSON.stringify(profile, null, 2);
    writeFileSync(this.getFilename(profile.id), text);
    this.profiles.set(profile.id, profile);
  }

  /** Create a new profile */
  public createProfile(name: string): RoguelikeProfile {
    const profile = createProfile(name);
    this.saveProfile(profile);
    return profile;
  }

  /** Get a profile by ID */
  public getProfile(profileId: string): RoguelikeProfile | undefined {
    return this.profiles.get(profileId);
  }

  /** Get all profiles */
  public getAllProfiles(): RoguelikeProfile[] {
    return Array.from(this.profiles.values());
  }

  /** Delete a profile */
  public deleteProfile(profileId: string): boolean {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return false;
    }

    try {
      unlinkSync(this.getFilename(profileId));
      this.profiles.delete(profileId);
      return true;
    } catch (e) {
      console.error(`Error deleting profile ${profileId}:`, e);
      return false;
    }
  }

  /** Update profile name */
  public updateProfileName(profileId: string, name: string): RoguelikeProfile | undefined {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return undefined;
    }

    profile.name = name;
    this.saveProfile(profile);
    return profile;
  }

  /** Apply XP rewards from a completed run */
  public applyRunRewards(profileId: string, rewards: RunXPSummary): RoguelikeProfile | undefined {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return undefined;
    }

    // Add profile XP. Levels, upgrade points and ascension points are all
    // derived from totalXP, so no separate currencies need to be incremented.
    profile.totalXP += rewards.profileXP.total;

    // Update per-card progress from play counts this run.
    const playCounts = new Map<string, number>();
    for (const cardName of rewards.runStats.cardsPlayedList) {
      playCounts.set(cardName, (playCounts.get(cardName) ?? 0) + 1);
    }
    for (const cardName of rewards.cardsProgressed) {
      let progress = getCardProgress(profile, cardName);
      if (!progress) {
        progress = createCardProgress();
      }
      const plays = playCounts.get(cardName) ?? 1;
      progress = recordCardPlays(progress, plays);
      // Keep cached bonuses consistent (e.g. after migrating older saves).
      recomputeCardBonuses(progress);
      setCardProgress(profile, cardName, progress);
    }

    // Update both lifetime stats and current-ascension-cycle stats.
    if (!profile.ascensionStats) {
      profile.ascensionStats = createProfileStats();
    }
    ProfileManager.recordRunInStats(profile.stats, rewards.runStats);
    ProfileManager.recordRunInStats(profile.ascensionStats, rewards.runStats);

    this.saveProfile(profile);
    return profile;
  }

  /** Fold a single run's results into a ProfileStats bucket. */
  private static recordRunInStats(stats: ProfileStats, runStats: RunStats): void {
    stats.totalRuns++;
    stats.totalVP += runStats.finalVP;
    stats.totalCardsPlayed += runStats.cardsPlayed;
    stats.totalTilesPlaced += runStats.tilesPlaced;
    stats.highestVP = Math.max(stats.highestVP, runStats.finalVP);

    if (runStats.won) {
      stats.totalWins++;
      stats.currentWinStreak++;
      stats.longestWinStreak = Math.max(stats.longestWinStreak, stats.currentWinStreak);
    } else {
      stats.totalLosses++;
      stats.currentWinStreak = 0;
    }
  }

  /** Unlock an upgrade node */
  public unlockUpgrade(profileId: string, nodeId: UpgradeNodeId): {success: boolean; error?: string} {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return {success: false, error: 'Profile not found'};
    }

    const node = getUpgradeNode(nodeId);
    if (!node) {
      return {success: false, error: 'Invalid upgrade node'};
    }

    const unlockedSet = new Set(profile.upgradeTree.unlockedNodes);
    if (!canUnlockNode(nodeId, unlockedSet)) {
      return {success: false, error: 'Prerequisites not met or already unlocked'};
    }

    const availablePoints = getAvailableUpgradePoints(profile);
    if (availablePoints < node.cost) {
      return {success: false, error: `Not enough upgrade points (need ${node.cost}, have ${availablePoints})`};
    }

    profile.upgradeTree.unlockedNodes.push(nodeId);
    this.saveProfile(profile);

    return {success: true};
  }

  /** Purchase one rank of a per-card upgrade using that card's upgrade points. */
  public purchaseCardUpgrade(profileId: string, cardName: CardName, upgradeId: string): {success: boolean; error?: string} {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return {success: false, error: 'Profile not found'};
    }

    let progress = getCardProgress(profile, cardName);
    if (!progress) {
      progress = createCardProgress();
    }

    const result = purchaseCardUpgradeOnProgress(progress, upgradeId);
    if (!result.ok) {
      return {success: false, error: result.reason ?? 'Cannot purchase upgrade'};
    }

    setCardProgress(profile, cardName, progress);

    // If this card was occupying a wildcard ban slot and just became
    // permanently self-banned via its own upgrade, free the slot.
    if (progress.canBan) {
      const index = profile.upgradeTree.bannedCards.indexOf(cardName);
      if (index !== -1) {
        profile.upgradeTree.bannedCards.splice(index, 1);
      }
    }

    this.saveProfile(profile);
    return {success: true};
  }

  /**
   * Ban a card using one of the player's wildcard ban slots (from the upgrade
   * tree). Wildcard slots can ban ANY card. Cards banned permanently via their
   * own "Ban Card" upgrade are tracked separately and do not use a slot, so
   * they are rejected here as redundant.
   */
  public banCard(profileId: string, cardName: CardName): {success: boolean; error?: string} {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return {success: false, error: 'Profile not found'};
    }

    if (this.isSelfBanned(profile, cardName)) {
      return {success: false, error: 'Card is already permanently banned via its own upgrade'};
    }

    if (profile.upgradeTree.bannedCards.includes(cardName)) {
      return {success: false, error: 'Card already banned'};
    }

    const bonuses = calculateUpgradeBonuses(profile.upgradeTree);
    if (profile.upgradeTree.bannedCards.length >= bonuses.maxBanSlots) {
      return {success: false, error: 'No wildcard ban slots available'};
    }

    profile.upgradeTree.bannedCards.push(cardName);
    this.saveProfile(profile);

    return {success: true};
  }

  /**
   * Unban a card from a wildcard ban slot. Cards banned permanently via their
   * own "Ban Card" upgrade cannot be unbanned here (that is a permanent effect
   * of the purchased upgrade).
   */
  public unbanCard(profileId: string, cardName: CardName): {success: boolean; error?: string} {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return {success: false, error: 'Profile not found'};
    }

    const index = profile.upgradeTree.bannedCards.indexOf(cardName);
    if (index === -1) {
      if (this.isSelfBanned(profile, cardName)) {
        return {success: false, error: 'Card is permanently banned via its own upgrade and cannot be unbanned'};
      }
      return {success: false, error: 'Card not banned'};
    }

    profile.upgradeTree.bannedCards.splice(index, 1);
    this.saveProfile(profile);

    return {success: true};
  }

  /** Whether a card is permanently banned via its own "Ban Card" upgrade. */
  private isSelfBanned(profile: RoguelikeProfile, cardName: CardName): boolean {
    return getCardProgress(profile, cardName)?.canBan === true;
  }

  /** Cards permanently banned via their own "Ban Card" upgrade. */
  public getSelfBannedCards(profileId: string): CardName[] {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return [];
    }
    return profile.cardProgress
      .filter((cp) => cp.progress.canBan)
      .map((cp) => cp.cardName);
  }

  /**
   * All cards that should be removed from a run's deck: wildcard-banned cards
   * plus cards permanently banned via their own upgrade.
   */
  public getEffectiveBannedCards(profileId: string): CardName[] {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return [];
    }
    const banned = new Set<CardName>(profile.upgradeTree.bannedCards);
    for (const name of this.getSelfBannedCards(profileId)) {
      banned.add(name);
    }
    return Array.from(banned);
  }

  /** Unlock an ascension tree node using ascension points. */
  public unlockAscensionNode(profileId: string, nodeId: AscensionNodeId): {success: boolean; error?: string} {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return {success: false, error: 'Profile not found'};
    }

    if (!isAscensionTreeAvailable(profile)) {
      return {success: false, error: 'Ascension is locked. Buy the Ascension Protocol upgrade first.'};
    }

    const node = getAscensionNode(nodeId);
    if (!node) {
      return {success: false, error: 'Invalid ascension node'};
    }

    if (!profile.ascensionTree) {
      profile.ascensionTree = createAscensionTreeState();
    }

    const unlockedSet = new Set(profile.ascensionTree.unlockedNodes);
    if (!canUnlockAscensionNode(nodeId, unlockedSet)) {
      return {success: false, error: 'Prerequisites not met or already unlocked'};
    }

    const available = getAvailableAscensionPoints(profile);
    if (available < node.cost) {
      return {success: false, error: `Not enough ascension points (need ${node.cost}, have ${available})`};
    }

    profile.ascensionTree.unlockedNodes.push(nodeId);
    this.saveProfile(profile);

    return {success: true};
  }

  /**
   * Ascend (prestige). Converts the XP earned this cycle into permanent
   * ascension points and resets the rest of the profile: total XP, the main
   * upgrade tree (including the Ascension Protocol unlock), banned cards, per-
   * card progress, and the current-ascension stats. The ascension tree and
   * lifetime stats are preserved.
   */
  public ascend(profileId: string): {success: boolean; error?: string; pointsEarned?: number; profile?: RoguelikeProfile} {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return {success: false, error: 'Profile not found'};
    }

    if (!isAscensionUnlocked(profile)) {
      return {success: false, error: 'Ascension is locked. Buy the Ascension Protocol upgrade first.'};
    }

    const pointsEarned = getPendingAscensionPoints(profile);
    if (!canAscend(profile) || pointsEarned < 1) {
      return {success: false, error: 'Not enough XP earned this ascension to gain an ascension point.'};
    }

    // Grant permanent ascension points and advance the ascension level.
    profile.ascensionPoints = (profile.ascensionPoints ?? 0) + pointsEarned;
    profile.ascensionCount = (profile.ascensionCount ?? 0) + 1;

    // Reset everything that is not the ascension tree or lifetime stats.
    profile.totalXP = 0;
    profile.upgradeTree = createUpgradeTreeState();
    profile.cardProgress = [];
    profile.ascensionStats = createProfileStats();

    this.saveProfile(profile);
    return {success: true, pointsEarned, profile};
  }

  /** Get computed bonuses for a profile */
  public getComputedBonuses(profileId: string): ComputedUpgradeBonuses | undefined {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return undefined;
    }

    return calculateUpgradeBonuses(profile.upgradeTree);
  }

  /** Get mastered cards for a profile (for deck manipulation) */
  public getMasteredCards(profileId: string): CardName[] {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return [];
    }

    return profile.cardProgress
      .filter((cp) => cp.progress.mastered)
      .map((cp) => cp.cardName);
  }

  /** Get cards with deck position bonuses */
  public getCardsWithDeckBonus(profileId: string): Map<CardName, number> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return new Map();
    }

    const result = new Map<CardName, number>();
    for (const cp of profile.cardProgress) {
      if (cp.progress.deckPositionBonus > 0) {
        result.set(cp.cardName, cp.progress.deckPositionBonus);
      }
    }
    return result;
  }

  /** Get card cost reduction for a specific card */
  public getCardCostReduction(profileId: string, cardName: CardName): number {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      return 0;
    }

    const progress = getCardProgress(profile, cardName);
    return progress?.costReduction ?? 0;
  }
}
