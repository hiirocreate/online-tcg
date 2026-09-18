import type { CardId, CardType } from "./cardMaster";

/**
 * 管理画面（POST/PUT /api/admin/cards 等）でやり取りする入力形式。
 * DBの保存形式(Prisma)とは別に、UI/APIの入出力用として定義する。
 */
export interface CardMasterInput {
  cardId: CardId;
  cardType: CardType;
  name: string;
  illustration: string;
  effectText: string;
  /** Subordinateのみ必須 */
  attack?: number;
  /** Subordinateのみ必須 */
  health?: number;
  /** Subordinate/Spell/Fieldで必須 */
  energyCost?: number;
}

export interface PlayerMasterInput {
  playerId: string;
  name: string;
  illustration: string;
  attack: number;
  health: number;
  effectText: string;
}

export interface PackSlotInput {
  rarity: string;
  count: number;
}

export interface PackMasterInput {
  packId: string;
  name: string;
  slots: PackSlotInput[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
