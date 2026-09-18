import type { CardId } from "./cardMaster";

/**
 * アカウントの「プレイヤープロフィールID」（DBの players.id に対応）。
 *
 * cardMaster.ts の PlayerMasterCard.playerId（アバターのマスターID）とは
 * 別概念なので注意（仕様書8番と9番で同名 "playerId" が異なる意味で使われている点への対応）。
 */
export type AccountPlayerId = string;

/** Player Collection（仕様書9番）：プレイヤーが実際に所有しているカードの枚数 */
export interface PlayerCollection {
  playerId: AccountPlayerId;
  /** cardId -> 所有枚数 */
  collection: Record<CardId, number>;
}

export type DeckType = "S" | "E";

/** デッキデータ（仕様書12番）：Collectionとは別に管理する */
export interface Deck {
  deckId: string;
  playerId: AccountPlayerId;
  deckType: DeckType;
  deckName: string;
  /** cardId -> 採用枚数 */
  cards: Record<CardId, number>;
}

/** POST /api/decks 用のリクエスト形式（仕様書41番） */
export interface DeckSaveRequest {
  deckType: DeckType;
  deckName: string;
  cards: Array<{ cardId: CardId; quantity: number }>;
}

/** デッキ検証結果（仕様書13番のサーバー検証） */
export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
}
