import {GameOptionsModel} from './GameOptionsModel';
import {ColonyModel} from './ColonyModel';
import {Color} from '../Color';
import {TurmoilModel} from './TurmoilModel';
import {ClaimedMilestoneModel} from './ClaimedMilestoneModel';
import {FundedAwardModel} from './FundedAwardModel';
import {Phase} from '../Phase';
import {AresData} from '../ares/AresData';
import {SpaceModel} from './SpaceModel';
import {MoonModel} from './MoonModel';
import {PathfindersModel} from './PathfindersModel';
import {SpectatorId} from '../Types';
import {ColonyName} from '../colonies/ColonyName';
import {GlobalParameter} from '../GlobalParameter';
import {Tag} from '../cards/Tag';
import {RunXPSummary} from '../roguelike/XPReward';

// Active roguelike run bonuses, shown in-game. Computed server-side so it
// stays in sync with the values actually applied to the game.
export type RoguelikeBonusesModel = {
  baseTR: number;
  startingTR: number;
  baseStartingCards: number;
  startingCards: number;
  netTRBonus: number;
  netMCBonus: number;
  startingSteelBonus: number;
  startingTitaniumBonus: number;
  netCardDrawBonus: number;
  preludeSlots: number;
  corporationChoices: number;
  cardCostIncrease: number;
  generationPenalty: number;
  totalGenerations: number;
  xpMultiplier: number;
  masteredCount: number;
};

// Per-card roguelike progression info, keyed by card name. Used to render
// level/usage badges on cards during a run.
export type RoguelikeCardInfoModel = {
  level: number;
  timesPlayed: number;
  mastered: boolean;
};

// Common data about a game not assocaited with a player (eg the temperature.)
export type GameModel = {
  aresData: AresData | undefined;
  awards: ReadonlyArray<FundedAwardModel>;
  colonies: ReadonlyArray<ColonyModel>;
  discardedColonies: ReadonlyArray<ColonyName>;
  deckSize: number;
  discardPileSize: number;
  expectedPurgeTimeMs: number;
  experimentalReset?: boolean;
  gameAge: number;
  gameOptions: GameOptionsModel;
  generation: number;
  globalsPerGeneration: ReadonlyArray<Partial<Record<GlobalParameter, number>>>,
  isSoloModeWin: boolean;
  lastSoloGeneration: number,
  milestones: ReadonlyArray<ClaimedMilestoneModel>;
  moon: MoonModel | undefined;
  name: string;
  oceans: number;
  oxygenLevel: number;
  passedPlayers: ReadonlyArray<Color>;
  pathfinders: PathfindersModel | undefined;
  phase: Phase;
  spaces: ReadonlyArray<SpaceModel>;
  spectatorId?: SpectatorId;
  step: number;
  tags: ReadonlyArray<Tag>;
  temperature: number;
  isTerraformed: boolean;
  turmoil: TurmoilModel | undefined;
  undoCount: number;
  venusScaleLevel: number;
  roguelikeXPSummary?: RunXPSummary;
  roguelikeBonuses?: RoguelikeBonusesModel;
  roguelikeCardInfo?: Record<string, RoguelikeCardInfoModel>;
}
