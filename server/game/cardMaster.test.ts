import { describe, it, expect, beforeEach } from "vitest";
import { CardMasterRepository, mapRowToCardMaster } from "./cardMaster.js";
import type { CardMasterPrismaClient } from "./cardMaster.js";

/**
 * Card MasterはDB(Supabase)管理に変わったため、このテストではDBに接続せず、
 * CardMasterPrismaClientの最小インターフェースを満たすフェイクを注入して検証する。
 * 実際のDB接続を使った疎通確認は、Supabaseセットアップ後に手元の環境で行う。
 */
function createFakeClient(overrides?: Partial<CardMasterPrismaClient>): CardMasterPrismaClient {
  return {
    cardMaster: {
      findMany: async () => [
        {
          cardId: "S001",
          cardType: "subordinate",
          name: "見習い戦士",
          illustration: "cards/S001.webp",
          effectText: "",
          attack: 2,
          health: 2,
          energyCost: 1,
        },
        {
          cardId: "SP001",
          cardType: "spell",
          name: "小さな炎",
          illustration: "cards/SP001.webp",
          effectText: "",
          attack: null,
          health: null,
          energyCost: 1,
        },
      ],
    },
    playerMaster: {
      findMany: async () => [
        {
          playerId: "PL001",
          name: "デフォルトプレイヤー",
          illustration: "players/PL001.webp",
          attack: 0,
          health: 20,
          effectText: "",
        },
      ],
    },
    packMaster: {
      findMany: async () => [
        {
          packId: "P001",
          name: "スタートパック",
          slots: [{ rarity: "N", count: 3 }],
        },
      ],
    },
    ...overrides,
  };
}

describe("mapRowToCardMaster", () => {
  it("subordinateの行を正しく変換する", () => {
    const card = mapRowToCardMaster({
      cardId: "S001",
      cardType: "subordinate",
      name: "テスト",
      illustration: "x",
      effectText: "",
      attack: 3,
      health: 2,
      energyCost: 1,
    });
    expect(card).toEqual({
      cardId: "S001",
      cardType: "subordinate",
      name: "テスト",
      illustration: "x",
      effectText: "",
      attack: 3,
      health: 2,
      energyCost: 1,
    });
  });

  it("subordinateでattackが欠けている場合はエラー", () => {
    expect(() =>
      mapRowToCardMaster({
        cardId: "S001",
        cardType: "subordinate",
        name: "テスト",
        illustration: "x",
        effectText: "",
        attack: null,
        health: 2,
        energyCost: 1,
      })
    ).toThrow();
  });

  it("未知のcardTypeはエラー", () => {
    expect(() =>
      mapRowToCardMaster({
        cardId: "X001",
        cardType: "unknown",
        name: "テスト",
        illustration: "x",
        effectText: "",
        attack: null,
        health: null,
        energyCost: null,
      })
    ).toThrow();
  });
});

describe("CardMasterRepository", () => {
  let repo: CardMasterRepository;

  beforeEach(async () => {
    repo = new CardMasterRepository(createFakeClient());
    await repo.load();
  });

  it("Card Master(Subordinate/Spell)を読み込める", () => {
    expect(repo.getAllCards().length).toBe(2);
  });

  it("cardIdでカードを取得できる", () => {
    const card = repo.getCardById("S001");
    expect(card).toBeDefined();
    expect(card?.cardType).toBe("subordinate");
  });

  it("存在しないcardIdはundefinedを返す", () => {
    expect(repo.getCardById("NOT_EXIST")).toBeUndefined();
  });

  it("Player Master(アバター)を読み込める", () => {
    const players = repo.getAllPlayerMasters();
    expect(players.length).toBe(1);
    expect(players[0].health).toBe(20);
  });

  it("Pack Masterを読み込める", () => {
    expect(repo.getAllPacks().length).toBe(1);
  });

  it("reload()で最新のDB内容に更新される（管理画面での保存直後の反映を想定）", async () => {
    const updatedClient = createFakeClient({
      cardMaster: {
        findMany: async () => [
          {
            cardId: "S999",
            cardType: "subordinate",
            name: "新カード",
            illustration: "x",
            effectText: "",
            attack: 5,
            health: 5,
            energyCost: 3,
          },
        ],
      },
    });
    const reloadableRepo = new CardMasterRepository(updatedClient);
    await reloadableRepo.load();
    expect(reloadableRepo.getCardById("S999")).toBeDefined();
    expect(reloadableRepo.getAllCards().length).toBe(1);
  });

  it("重複したcardIdがあるとエラーになる", async () => {
    const dupClient = createFakeClient({
      cardMaster: {
        findMany: async () => [
          {
            cardId: "S001",
            cardType: "subordinate",
            name: "A",
            illustration: "x",
            effectText: "",
            attack: 1,
            health: 1,
            energyCost: 1,
          },
          {
            cardId: "S001",
            cardType: "subordinate",
            name: "B",
            illustration: "x",
            effectText: "",
            attack: 1,
            health: 1,
            energyCost: 1,
          },
        ],
      },
    });
    const dupRepo = new CardMasterRepository(dupClient);
    await expect(dupRepo.load()).rejects.toThrow();
  });
});
