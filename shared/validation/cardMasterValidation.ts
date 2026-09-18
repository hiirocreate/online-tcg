import type {
  CardMasterInput,
  PlayerMasterInput,
  PackMasterInput,
  ValidationResult,
} from "../types/admin";

const ID_PATTERN = /^[A-Za-z0-9_-]+$/;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * 管理画面から送られたCard Master入力（Subordinate/Spell/Field）を検証する。
 * クライアントの入力をそのまま信用しないという仕様書全体の方針に基づき、
 * 管理者用APIでもサーバー側で必ずこの検証を通す。
 */
export function validateCardMasterInput(input: CardMasterInput): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.cardId) || !ID_PATTERN.test(input.cardId)) {
    errors.push("cardIdは英数字・ハイフン・アンダースコアのみの空でない文字列にしてください");
  }
  if (!["subordinate", "spell", "field"].includes(input.cardType)) {
    errors.push("cardTypeはsubordinate/spell/fieldのいずれかにしてください");
  }
  if (!isNonEmptyString(input.name)) {
    errors.push("nameは空にできません");
  }
  if (!isNonEmptyString(input.illustration)) {
    errors.push("illustrationは空にできません");
  }
  if (typeof input.effectText !== "string") {
    errors.push("effectTextは文字列にしてください（空文字は可）");
  }

  if (input.cardType === "subordinate") {
    if (!isNonNegativeInteger(input.attack)) {
      errors.push("Subordinateのattackは0以上の整数で必須です");
    }
    if (!isNonNegativeInteger(input.health) || (input.health ?? 0) < 1) {
      errors.push("Subordinateのhealthは1以上の整数で必須です");
    }
    if (!isNonNegativeInteger(input.energyCost)) {
      errors.push("SubordinateのenergyCostは0以上の整数で必須です");
    }
  } else {
    if (input.attack !== undefined) {
      errors.push("Subordinate以外にattackは設定できません");
    }
    if (input.health !== undefined) {
      errors.push("Subordinate以外にhealthは設定できません");
    }
    if (!isNonNegativeInteger(input.energyCost)) {
      errors.push("energyCostは0以上の整数で必須です");
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Player（アバター/リーダー）マスター入力の検証（仕様書8番） */
export function validatePlayerMasterInput(input: PlayerMasterInput): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.playerId) || !ID_PATTERN.test(input.playerId)) {
    errors.push("playerIdは英数字・ハイフン・アンダースコアのみの空でない文字列にしてください");
  }
  if (!isNonEmptyString(input.name)) {
    errors.push("nameは空にできません");
  }
  if (!isNonEmptyString(input.illustration)) {
    errors.push("illustrationは空にできません");
  }
  if (!isNonNegativeInteger(input.attack)) {
    errors.push("attackは0以上の整数で必須です");
  }
  if (!isNonNegativeInteger(input.health) || (input.health ?? 0) < 1) {
    errors.push("healthは1以上の整数で必須です");
  }
  if (typeof input.effectText !== "string") {
    errors.push("effectTextは文字列にしてください（空文字は可）");
  }

  return { valid: errors.length === 0, errors };
}

/** Pack（ガチャ）マスター入力の検証（仕様書14番） */
export function validatePackMasterInput(input: PackMasterInput): ValidationResult {
  const errors: string[] = [];

  if (!isNonEmptyString(input.packId) || !ID_PATTERN.test(input.packId)) {
    errors.push("packIdは英数字・ハイフン・アンダースコアのみの空でない文字列にしてください");
  }
  if (!isNonEmptyString(input.name)) {
    errors.push("nameは空にできません");
  }
  if (!Array.isArray(input.slots) || input.slots.length === 0) {
    errors.push("slotsは1件以上指定してください");
  } else {
    input.slots.forEach((slot, index) => {
      if (!isNonEmptyString(slot.rarity)) {
        errors.push(`slots[${index}].rarityは空にできません`);
      }
      if (!isNonNegativeInteger(slot.count) || slot.count < 1) {
        errors.push(`slots[${index}].countは1以上の整数にしてください`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}
