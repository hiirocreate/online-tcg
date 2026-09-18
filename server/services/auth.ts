import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";
import type { FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../database/prismaClient.js";

/**
 * Supabase AuthのJWT検証と管理者権限チェック。
 *
 * SupabaseはJWT Signing Keys（JWKS）による検証を推奨しており、
 * `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` から公開鍵を取得して検証する
 * （jwtライブラリはSupabase公式ドキュメントが推奨する`jose`を使用）。
 *
 * 管理者かどうかは、SupabaseのJWTのカスタムクレームには頼らず（Custom Access Token
 * Hookの追加設定が必要になるため）、このアプリ自身のusersテーブルのis_adminカラムで
 * 判定する。usersテーブルの行は初回アクセス時に自動作成する（仕様書のユーザー識別の
 * 最小実装。Player/Collection等の本格的な実装はPhase2で行う）。
 */

export interface AuthenticatedUser {
  /** Supabase AuthのユーザーID(JWTのsub)。usersテーブルのidと一致させる */
  id: string;
  email: string;
  isAdmin: boolean;
}

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthenticatedUser;
  }
}

let jwks: JWTVerifyGetKey | null = null;

function getJwks(): JWTVerifyGetKey {
  if (jwks) return jwks;

  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error(
      "SUPABASE_URLが設定されていません。.envを確認してください（管理者認証にはSupabaseのJWKSエンドポイントが必要です）"
    );
  }
  jwks = createRemoteJWKSet(new URL(`${supabaseUrl}/auth/v1/.well-known/jwks.json`));
  return jwks;
}

function extractBearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length);
}

async function verifySupabaseJwt(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, getJwks());
  return payload;
}

/**
 * ログインが必要なAPIに付けるFastify preHandlerフック。
 * 検証したユーザー情報を request.authUser にセットする。
 */
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const token = extractBearerToken(request);
  if (!token) {
    reply.code(401).send({ error: "認証トークンがありません" });
    return;
  }

  let payload: JWTPayload;
  try {
    payload = await verifySupabaseJwt(token);
  } catch (err) {
    request.log.warn({ err }, "JWT検証に失敗しました");
    reply.code(401).send({ error: "認証トークンが無効です" });
    return;
  }

  const sub = payload.sub;
  const email = typeof payload.email === "string" ? payload.email : undefined;
  if (!sub || !email) {
    reply.code(401).send({ error: "トークンにユーザー情報(sub/email)が含まれていません" });
    return;
  }

  // 初回アクセス時にusersテーブルへレコードを作成する。isAdminはデフォルトfalseのまま
  // （最初の管理者にする場合は、Supabase側でSQLを直接実行してis_adminをtrueにする）
  const userRow = await prisma.user.upsert({
    where: { id: sub },
    create: { id: sub, email, isAdmin: false, displayName: null },
    update: { email },
  });

  request.authUser = { id: userRow.id, email: userRow.email, isAdmin: userRow.isAdmin };
}

/**
 * 管理者専用APIに付けるFastify preHandlerフック。
 * 必ず requireAuth と一緒に `preHandler: [requireAuth, requireAdmin]` の順で登録すること。
 * requireAuthが401で応答を送信済みの場合、Fastifyの仕様によりこのフックは呼ばれない。
 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  if (!request.authUser?.isAdmin) {
    reply.code(403).send({ error: "管理者権限が必要です" });
  }
}
