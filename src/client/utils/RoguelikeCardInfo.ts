import {RoguelikeCardInfoModel} from '@/common/models/GameModel';

/**
 * Client-side store for per-card roguelike progression info.
 *
 * The deeply-nested, widely-reused Card component does not have access to the
 * game model, so the game view publishes the per-card info here and Card reads
 * from it to render level/usage badges.
 */
let cardInfo: Record<string, RoguelikeCardInfoModel> | undefined = undefined;

export function setRoguelikeCardInfo(info: Record<string, RoguelikeCardInfoModel> | undefined): void {
  cardInfo = info;
}

export function getRoguelikeCardInfo(cardName: string): RoguelikeCardInfoModel | undefined {
  return cardInfo?.[cardName];
}

export function hasRoguelikeCardInfo(): boolean {
  return cardInfo !== undefined;
}
