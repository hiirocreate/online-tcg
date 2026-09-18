import { describe, it, expect } from "vitest";
import {
  validateCardMasterInput,
  validatePlayerMasterInput,
  validatePackMasterInput,
} from "./cardMasterValidation";
import type { CardMasterInput, PlayerMasterInput, PackMasterInput } from "../types/admin";

describe("validateCardMasterInput", () => {
  it("正しいSubordinateを許可する", () => {
    const input: CardMasterInput = {
      cardId: "S999",
      cardType: "subordinate",
      name: "テストカード",
      illustration: "cards/S999.webp",
      effectText: "",
      attack: 3,
      health: 3,
      energyCost: 2,
    };
    expect(validateCardMasterInput(input)).toEqual({ valid: true, errors: [] });
  });

  it("Subordinateにattack/health/energyCostが無いと拒否する", () => {
    const input: CardMasterInput = {
      cardId: "S999",
      cardType: "subordinate",
      name: "テストカード",
      illustration: "cards/S999.webp",
      effectText: "",
    };
    const result = validateCardMasterInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("Spellにattack/healthが設定されていると拒否する", () => {
    const input: CardMasterInput = {
      cardId: "SP999",
      cardType: "spell",
      name: "テスト呪文",
      illustration: "cards/SP999.webp",
      effectText: "",
      attack: 1,
      energyCost: 1,
    };
    const result = validateCardMasterInput(input);
    expect(result.valid).toBe(false);
  });

  it("負のenergyCostを拒否する", () => {
    const input: CardMasterInput = {
      cardId: "SP999",
      cardType: "spell",
      name: "テスト呪文",
      illustration: "cards/SP999.webp",
      effectText: "",
      energyCost: -1,
    };
    expect(validateCardMasterInput(input).valid).toBe(false);
  });

  it("不正な文字を含むcardIdを拒否する", () => {
    const input: CardMasterInput = {
      cardId: "S 999",
      cardType: "spell",
      name: "テスト",
      illustration: "x",
      effectText: "",
      energyCost: 1,
    };
    expect(validateCardMasterInput(input).valid).toBe(false);
  });

  it("不正なcardTypeを拒否する", () => {
    const input = {
      cardId: "X001",
      cardType: "unknown",
      name: "テスト",
      illustration: "x",
      effectText: "",
    } as unknown as CardMasterInput;
    expect(validateCardMasterInput(input).valid).toBe(false);
  });
});

describe("validatePlayerMasterInput", () => {
  it("正しい入力を許可する", () => {
    const input: PlayerMasterInput = {
      playerId: "PL999",
      name: "テストプレイヤー",
      illustration: "players/PL999.webp",
      attack: 0,
      health: 20,
      effectText: "",
    };
    expect(validatePlayerMasterInput(input)).toEqual({ valid: true, errors: [] });
  });

  it("health=0を拒否する", () => {
    const input: PlayerMasterInput = {
      playerId: "PL999",
      name: "テストプレイヤー",
      illustration: "players/PL999.webp",
      attack: 0,
      health: 0,
      effectText: "",
    };
    expect(validatePlayerMasterInput(input).valid).toBe(false);
  });
});

describe("validatePackMasterInput", () => {
  it("正しい入力を許可する", () => {
    const input: PackMasterInput = {
      packId: "P999",
      name: "テストパック",
      slots: [{ rarity: "N", count: 3 }],
    };
    expect(validatePackMasterInput(input)).toEqual({ valid: true, errors: [] });
  });

  it("空のslotsを拒否する", () => {
    const input: PackMasterInput = { packId: "P999", name: "テストパック", slots: [] };
    expect(validatePackMasterInput(input).valid).toBe(false);
  });

  it("count=0のslotを拒否する", () => {
    const input: PackMasterInput = {
      packId: "P999",
      name: "テストパック",
      slots: [{ rarity: "N", count: 0 }],
    };
    expect(validatePackMasterInput(input).valid).toBe(false);
  });
});
