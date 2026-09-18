import type { FastifyInstance } from "fastify";
import { requireAuth } from "../services/auth.js";

/**
 * ログイン中のユーザー情報(管理者かどうかを含む)を返す。
 * Web側の管理画面が「管理者向けUIを表示してよいか」を判定するために使う。
 * requireAdminは付けない（管理者でなくても、自分がそうでないことを知る必要があるため）。
 */
export async function adminMeRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/api/admin/me", { preHandler: [requireAuth] }, async (request) => {
    return request.authUser;
  });
}
