import type { CardId } from "./cardMaster";
import type { AccountPlayerId } from "./collection";

/** 対戦中のカード個体に一意に付与されるID（仕様書36番）。cardIdと混同しないこと */
export type InstanceId = string;

export type GameId = string;

/** 仕様書37番のZone */
export type Zone = "deck" | "hand" | "field" | "graveyard";

/** 仕様書21番のターン4セクション */
export type TurnPhase = "charge" | "draw" | "play" | "end";

/**
 * 対戦中Card Instance（仕様書36番）。
 * 同じcardIdのカードが複数存在し得るため、対戦中は個別instanceIdで管理する。
 */
export interface GameCardInstance {
  instanceId: InstanceId;
  cardId: CardId;
  ownerPlayerId: AccountPlayerId;
  controllerPlayerId: AccountPlayerId;
  zone: Zone;
  /** zoneが"field"の場合のみ有効。仕様書24番のフィールドスロット(0〜4) */
  fieldSlot?: number;
  /** Subordinateのみ使用。Spell/Fieldはundefined */
  currentAttack?: number;
  currentHealth?: number;
  /** そのターン中に攻撃可能か（出撃ターンはfalse。仕様書5, 25番） */
  canAttack: boolean;
  /** そのターン中に攻撃済みか（仕様書25番: 1ターン1回） */
  hasAttackedThisTurn: boolean;
}

/** 非公開情報を含む、サーバー内部のみで保持する完全なゲーム状態（仕様書38番） */
export interface GameState {
  gameId: GameId;
  turnPlayerId: AccountPlayerId;
  turnNumber: number;
  phase: TurnPhase;
  /** ターン制限180秒のうち残り秒数（仕様書35番） */
  turnTimeRemainingSeconds: number;
  players: Record<AccountPlayerId, PlayerBattleState>;
  cards: Record<InstanceId, GameCardInstance>;
  winnerPlayerId?: AccountPlayerId;
  isFinished: boolean;
}

export interface PlayerBattleState {
  playerId: AccountPlayerId;
  /** Player Master（アバター）のID。cardMaster.ts の PlayerMasterCard.playerId を参照 */
  playerMasterId: string;
  currentHealth: number;
  maxEnergy: number;
  currentEnergy: number;
  /** デッキ・手札・墓地に存在するinstanceIdの並び（デッキは非公開のため相手には送らない） */
  deckInstanceIds: InstanceId[];
  handInstanceIds: InstanceId[];
  graveyardInstanceIds: InstanceId[];
  /** Deathカードのinstance（デッキの最下部。仕様書18番） */
  deathCardInstanceId: InstanceId;
  hasUsedMulligan: boolean;
}

/**
 * クライアントへ送信する、非公開情報をマスクしたゲーム状態（仕様書44番）。
 * 相手の手札内容・山札順・Deathカード位置は送らず、枚数のみ表示する。
 */
export interface ClientVisibleGameState {
  gameId: GameId;
  turnPlayerId: AccountPlayerId;
  turnNumber: number;
  phase: TurnPhase;
  turnTimeRemainingSeconds: number;
  self: {
    playerId: AccountPlayerId;
    currentHealth: number;
    maxEnergy: number;
    currentEnergy: number;
    hand: GameCardInstance[];
    deckCount: number;
    graveyard: GameCardInstance[];
  };
  opponent: {
    playerId: AccountPlayerId;
    currentHealth: number;
    maxEnergy: number;
    currentEnergy: number;
    handCount: number;
    deckCount: number;
    graveyard: GameCardInstance[];
  };
  field: GameCardInstance[];
  isFinished: boolean;
  winnerPlayerId?: AccountPlayerId;
}
