import type { CardId } from "./cardMaster";

/** 仕様書14番のPack定義。Card Masterとは別に管理する */
export interface PackSlot {
  rarity: string;
  count: number;
}

export interface PackMaster {
  packId: string;
  name: string;
  slots: PackSlot[];
}

/** POST /api/packs/{packId}/open のレスポンス（仕様書15番: 排出はサーバーが決定） */
export interface PackOpenResult {
  packId: string;
  resultCardIds: CardId[];
  openedAt: string;
}
