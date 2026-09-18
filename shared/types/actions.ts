import type { InstanceId } from "./gameState";
import type { AccountPlayerId } from "./collection";

/**
 * POST /api/games/{gameId}/actions のリクエストボディ（仕様書42番）。
 * クライアントは「操作要求」のみ送信し、結果の確定はサーバーが行う（仕様書39番）。
 */
export type GameActionRequest =
  | { action: "play_card"; cardInstanceId: InstanceId; targetFieldSlot?: number }
  | {
      action: "attack";
      attackerInstanceId: InstanceId;
      targetInstanceId?: InstanceId;
      targetPlayerId?: AccountPlayerId;
    }
  | { action: "mulligan"; cardInstanceIds: InstanceId[] }
  | { action: "end_turn" };

/** 仕様書43番のWebSocketイベント種別 */
export type GameEventType =
  | "game_started"
  | "game_state_updated"
  | "turn_started"
  | "card_drawn"
  | "card_played"
  | "effect_activated"
  | "effect_resolved"
  | "attack_declared"
  | "damage_resolved"
  | "card_destroyed"
  | "turn_ended"
  | "game_ended";

export interface GameEvent<TPayload = unknown> {
  type: GameEventType;
  gameId: string;
  payload: TPayload;
  timestamp: string;
}
