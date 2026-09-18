/**
 * ゲームルール上の固定値。仕様書に明記された数値のみを定数化する
 * （仕様にない値を独自に追加しないこと -- 仕様書51番）。
 */

// --- デッキ構築（仕様書10, 11番） ---
export const S_DECK_SIZE = 30;
export const E_DECK_SIZE = 10;
export const MAX_COPIES_PER_DECK = 2;

// --- 対戦デッキ（仕様書17, 18番） ---
export const BATTLE_DECK_SIZE = S_DECK_SIZE + E_DECK_SIZE; // 40

// --- 初期手札・マリガン（仕様書19番） ---
export const INITIAL_HAND_SIZE = 6;
export const MAX_MULLIGAN_COUNT = 3;

// --- 手札上限（仕様書20番） ---
export const HAND_LIMIT = 10;

// --- Energy（仕様書22, 23番） ---
export const MAX_ENERGY_CAP = 10;
export const FIRST_PLAYER_TURN1_ENERGY = 1;
export const SECOND_PLAYER_TURN1_ENERGY = 2;

// --- フィールド（仕様書24番） ---
export const FIELD_SLOT_COUNT = 5;

/**
 * Fieldカードの配置数に応じたSubordinateの最大出撃数（仕様書24番の対応表）。
 * fieldCount(0〜5) -> 出撃可能なSubordinate最大数
 */
export const MAX_SUBORDINATES_BY_FIELD_COUNT: Record<number, number> = {
  0: 5,
  1: 4,
  2: 3,
  3: 2,
  4: 1,
  5: 0,
};

// --- Player（仕様書8番） ---
export const PLAYER_INITIAL_HEALTH = 20;

// --- ターン制限（仕様書35番） ---
export const TURN_TIME_LIMIT_SECONDS = 180;
