import { describe, it, expect, vi, beforeAll } from "vitest";
import type { FastifyInstance } from "fastify";
import type { CardMasterInput } from "@tcg/shared";

/**
 * 管理者用カードAPIのHTTPレベルの結合テスト。
 * jose(JWT検証)をモックし、実際のSupabaseやPostgreSQLには接続せず、
 * database/generated/client.ts のインメモリ・フェイク実装を使って検証する。
 */
const jwtVerifyMock = vi.fn();
vi.mock("jose", () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
}));

process.env.SUPABASE_URL = "https://example.supabase.co";

const { createApp } = await import("../app.js");
const { prisma } = await import("../database/prismaClient.js");
const { cardMasterRepository } = await import("../game/cardMaster.js");

const ADMIN_ID = "admin-user-1";
const NON_ADMIN_ID = "normal-user-1";

function mockAuthAs(userId: string, email: string): void {
  jwtVerifyMock.mockResolvedValueOnce({ payload: { sub: userId, email } });
}

let app: FastifyInstance;

beforeAll(async () => {
  await cardMasterRepository.load();
  app = await createApp("http://localhost:5173", { logger: false });

  // 管理者ユーザーを事前に用意しておく
  // （実運用ではSupabase側でSQLを直接実行し、最初の管理者のis_adminをtrueにする）
  await prisma.user.create({
    data: { id: ADMIN_ID, email: "admin@example.com", isAdmin: true, displayName: null },
  });
});

describe("管理者用カードAPI", () => {
  it("認証トークンが無いと401", async () => {
    const res = await app.inject({ method: "GET", url: "/api/admin/cards" });
    expect(res.statusCode).toBe(401);
  });

  it("管理者でないユーザーは403", async () => {
    mockAuthAs(NON_ADMIN_ID, "user@example.com");
    const res = await app.inject({
      method: "GET",
      url: "/api/admin/cards",
      headers: { authorization: "Bearer token" },
    });
    expect(res.statusCode).toBe(403);
  });

  it("管理者はカードを作成でき、公開APIにも反映される", async () => {
    const input: CardMasterInput = {
      cardId: "TEST001",
      cardType: "subordinate",
      name: "テスト用カード",
      illustration: "cards/TEST001.webp",
      effectText: "",
      attack: 4,
      health: 3,
      energyCost: 2,
    };

    mockAuthAs(ADMIN_ID, "admin@example.com");
    const createRes = await app.inject({
      method: "POST",
      url: "/api/admin/cards",
      headers: { authorization: "Bearer token" },
      payload: input,
    });
    expect(createRes.statusCode).toBe(201);

    const publicRes = await app.inject({ method: "GET", url: "/api/cards" });
    const body = publicRes.json() as { cards: CardMasterInput[] };
    expect(body.cards.some((c) => c.cardId === "TEST001")).toBe(true);
  });

  it("同じcardIdを再度作成すると409", async () => {
    const input: CardMasterInput = {
      cardId: "TEST001",
      cardType: "subordinate",
      name: "重複テスト",
      illustration: "x",
      effectText: "",
      attack: 1,
      health: 1,
      energyCost: 1,
    };
    mockAuthAs(ADMIN_ID, "admin@example.com");
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/cards",
      headers: { authorization: "Bearer token" },
      payload: input,
    });
    expect(res.statusCode).toBe(409);
  });

  it("不正な入力(Subordinateなのにattackが無い)は400", async () => {
    mockAuthAs(ADMIN_ID, "admin@example.com");
    const res = await app.inject({
      method: "POST",
      url: "/api/admin/cards",
      headers: { authorization: "Bearer token" },
      payload: {
        cardId: "TEST002",
        cardType: "subordinate",
        name: "不正カード",
        illustration: "x",
        effectText: "",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("存在しないcardIdの更新は404", async () => {
    mockAuthAs(ADMIN_ID, "admin@example.com");
    const res = await app.inject({
      method: "PUT",
      url: "/api/admin/cards/NOT_EXIST",
      headers: { authorization: "Bearer token" },
      payload: {
        cardType: "spell",
        name: "x",
        illustration: "x",
        effectText: "",
        energyCost: 1,
      },
    });
    expect(res.statusCode).toBe(404);
  });

  it("作成したカードを更新・削除できる", async () => {
    mockAuthAs(ADMIN_ID, "admin@example.com");
    const updateRes = await app.inject({
      method: "PUT",
      url: "/api/admin/cards/TEST001",
      headers: { authorization: "Bearer token" },
      payload: {
        cardType: "subordinate",
        name: "更新後の名前",
        illustration: "cards/TEST001.webp",
        effectText: "更新済み",
        attack: 9,
        health: 9,
        energyCost: 5,
      },
    });
    expect(updateRes.statusCode).toBe(200);
    expect(cardMasterRepository.getCardById("TEST001")?.name).toBe("更新後の名前");

    mockAuthAs(ADMIN_ID, "admin@example.com");
    const deleteRes = await app.inject({
      method: "DELETE",
      url: "/api/admin/cards/TEST001",
      headers: { authorization: "Bearer token" },
    });
    expect(deleteRes.statusCode).toBe(204);
    expect(cardMasterRepository.getCardById("TEST001")).toBeUndefined();
  });
});
