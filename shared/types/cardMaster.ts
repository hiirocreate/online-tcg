/**
 * Card Master（カードそのものの定義）関連の型。
 *
 * 重要：Card Master はカードの「定義」のみを持ち、プレイヤーごとの所有枚数は含まない
 * （仕様書4番）。所有枚数は PlayerCollection（collection.ts）側で管理する。
 */

/** カードマスターに一意に付与されるID（例: "S001", "SP001", "F001"） */
export type CardId = string;

export type CardType = "subordinate" | "spell" | "field";

interface CardMasterBase {
  cardId: CardId;
  cardType: CardType;
  name: string;
  illustration: string;
  effectText: string;
}

/** Subordinate（仕様書5番）：フィールドに出撃して戦闘するカード */
export interface SubordinateCardMaster extends CardMasterBase {
  cardType: "subordinate";
  attack: number;
  health: number;
  energyCost: number;
}

/** Spell（仕様書6番）：Energyを支払い、発動後は墓地へ送られるカード */
export interface SpellCardMaster extends CardMasterBase {
  cardType: "spell";
  energyCost: number;
}

/** Field（仕様書7番）：Energyを支払って配置し、フィールドに残り続けるカード */
export interface FieldCardMaster extends CardMasterBase {
  cardType: "field";
  energyCost: number;
}

/** 通常カード（Subordinate / Spell / Field）の判別共用体 */
export type CardMaster = SubordinateCardMaster | SpellCardMaster | FieldCardMaster;

/**
 * Player（仕様書8番）：通常カードとは別のゲーム要素。
 *
 * 注意：この "playerId" は Card Master 同様の「アバター/リーダーのマスターデータ」を
 * 指す識別子であり、PlayerCollection / Deck / Match 側で使われる「アカウントの
 * プレイヤープロフィールID」（collection.ts の AccountPlayerId）とは別概念。
 * 名称が同じため混同しやすい点に注意（実装確認時にユーザーと合意済み）。
 */
export interface PlayerMasterCard {
  /** アバター/リーダーのマスターID（例: "PL001"）。アカウントIDではない */
  playerId: string;
  name: string;
  illustration: string;
  attack: number;
  health: number;
  effectText: string;
}

/** Player Masterの初期体力（仕様書8番: 初期体力は20） */
export const PLAYER_MASTER_INITIAL_HEALTH = 20;
