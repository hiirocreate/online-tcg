import { describe, it, expect, vi, beforeEach } from "vitest";
import type { FastifyReply, FastifyRequest } from "fastify";

// joseのjwtVerify/createRemoteJWKSetをモックし、実際のネットワーク通信(Supabaseの
// JWKSエンドポイント)を使わずにrequireAuthのロジックだけを検証する。
const jwtVerifyMock = vi.fn();
vi.mock("jose", () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
}));

process.env.SUPABASE_URL = "https://example.supabase.co";

const { requireAuth, requireAdmin } = await import("./auth.js");

function createMockReply(): FastifyReply {
  const reply = {
    sent: false,
    code: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
  return reply as unknown as FastifyReply;
}

function createMockRequest(authorization?: string): FastifyRequest {
  return {
    headers: authorization ? { authorization } : {},
    log: { warn: vi.fn() },
  } as unknown as FastifyRequest;
}

describe("requireAuth", () => {
  beforeEach(() => {
    jwtVerifyMock.mockReset();
  });

  it("Authorizationヘッダーが無ければ401", async () => {
    const request = createMockRequest();
    const reply = createMockReply();

    await requireAuth(request, reply);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(request.authUser).toBeUndefined();
  });

  it("JWT検証に失敗したら401", async () => {
    jwtVerifyMock.mockRejectedValueOnce(new Error("invalid signature"));
    const request = createMockRequest("Bearer invalid-token");
    const reply = createMockReply();

    await requireAuth(request, reply);

    expect(reply.code).toHaveBeenCalledWith(401);
    expect(request.authUser).toBeUndefined();
  });

  it("sub/emailが無いトークンは401", async () => {
    jwtVerifyMock.mockResolvedValueOnce({ payload: {} });
    const request = createMockRequest("Bearer token-without-claims");
    const reply = createMockReply();

    await requireAuth(request, reply);

    expect(reply.code).toHaveBeenCalledWith(401);
  });

  it("正しいトークンならrequest.authUserがセットされる", async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: { sub: "user-1", email: "user1@example.com" },
    });
    const request = createMockRequest("Bearer valid-token");
    const reply = createMockReply();

    await requireAuth(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
    expect(request.authUser).toEqual({
      id: "user-1",
      email: "user1@example.com",
      isAdmin: false,
    });
  });
});

describe("requireAdmin", () => {
  it("authUserが無ければ403", async () => {
    const request = createMockRequest();
    const reply = createMockReply();

    await requireAdmin(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
  });

  it("isAdminがfalseなら403", async () => {
    const request = createMockRequest();
    request.authUser = { id: "user-1", email: "user1@example.com", isAdmin: false };
    const reply = createMockReply();

    await requireAdmin(request, reply);

    expect(reply.code).toHaveBeenCalledWith(403);
  });

  it("isAdminがtrueなら何もしない", async () => {
    const request = createMockRequest();
    request.authUser = { id: "admin-1", email: "admin@example.com", isAdmin: true };
    const reply = createMockReply();

    await requireAdmin(request, reply);

    expect(reply.code).not.toHaveBeenCalled();
  });
});
