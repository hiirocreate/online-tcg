import type { FastifyInstance } from "fastify";
import { cardMasterRepository } from "../game/cardMaster.js";

/**
 * GET /api/cards（仕様書40番）：Card Master一覧を返す。
 * プレイヤーの所有枚数はここには含めない（仕様書4, 51番）。
 */
export async function cardsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get("/api/cards", async () => {
    return {
      cards: cardMasterRepository.getAllCards(),
      players: cardMasterRepository.getAllPlayerMasters(),
    };
  });
}
