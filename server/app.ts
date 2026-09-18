import Fastify, { type FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { healthRoutes } from "./api/health.js";
import { cardsRoutes } from "./api/cards.js";
import { adminCardsRoutes } from "./api/adminCards.js";
import { adminPlayersRoutes } from "./api/adminPlayers.js";
import { adminPacksRoutes } from "./api/adminPacks.js";
import { adminMeRoutes } from "./api/adminMe.js";

/**
 * Fastifyアプリの組み立てのみを行い、listen()は呼ばない。
 * index.ts（実際の起動）とテスト（fastify.inject()によるHTTPレベルの検証）の
 * 両方から使えるようにするためのファクトリ関数。
 */
export async function createApp(
  clientOrigin: string,
  options: { logger?: boolean } = {}
): Promise<FastifyInstance> {
  const fastify = Fastify({ logger: options.logger ?? true });

  await fastify.register(cors, { origin: clientOrigin });
  await fastify.register(healthRoutes);
  await fastify.register(cardsRoutes);
  await fastify.register(adminCardsRoutes);
  await fastify.register(adminPlayersRoutes);
  await fastify.register(adminPacksRoutes);
  await fastify.register(adminMeRoutes);

  return fastify;
}
