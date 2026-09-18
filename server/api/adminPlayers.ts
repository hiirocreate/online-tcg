import type { FastifyInstance } from "fastify";
import type { PlayerMasterInput } from "@tcg/shared";
import { validatePlayerMasterInput } from "@tcg/shared/validation";
import { prisma } from "../database/prismaClient.js";
import { Prisma } from "../database/generated/client.js";
import { cardMasterRepository } from "../game/cardMaster.js";
import { requireAuth, requireAdmin } from "../services/auth.js";

/** 管理画面用のPlayer(アバター/リーダー)マスター CRUD API（仕様書8番） */
export async function adminPlayersRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    "/api/admin/players",
    { preHandler: [requireAuth, requireAdmin] },
    async () => {
      return { players: cardMasterRepository.getAllPlayerMasters() };
    }
  );

  fastify.post<{ Body: PlayerMasterInput }>(
    "/api/admin/players",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const input = request.body;
      const result = validatePlayerMasterInput(input);
      if (!result.valid) {
        return reply.code(400).send({ errors: result.errors });
      }

      try {
        await prisma.playerMaster.create({
          data: {
            playerId: input.playerId,
            name: input.name,
            illustration: input.illustration,
            attack: input.attack,
            health: input.health,
            effectText: input.effectText,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return reply.code(409).send({ error: `playerId "${input.playerId}" は既に存在します` });
        }
        throw err;
      }

      await cardMasterRepository.reload();
      return reply.code(201).send({ player: cardMasterRepository.getPlayerMasterById(input.playerId) });
    }
  );

  fastify.put<{ Params: { playerId: string }; Body: PlayerMasterInput }>(
    "/api/admin/players/:playerId",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const { playerId } = request.params;
      const input: PlayerMasterInput = { ...request.body, playerId };
      const result = validatePlayerMasterInput(input);
      if (!result.valid) {
        return reply.code(400).send({ errors: result.errors });
      }

      try {
        await prisma.playerMaster.update({
          where: { playerId },
          data: {
            name: input.name,
            illustration: input.illustration,
            attack: input.attack,
            health: input.health,
            effectText: input.effectText,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
          return reply.code(404).send({ error: `playerId "${playerId}" は見つかりません` });
        }
        throw err;
      }

      await cardMasterRepository.reload();
      return reply.send({ player: cardMasterRepository.getPlayerMasterById(playerId) });
    }
  );

  fastify.delete<{ Params: { playerId: string } }>(
    "/api/admin/players/:playerId",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const { playerId } = request.params;
      try {
        await prisma.playerMaster.delete({ where: { playerId } });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
          return reply.code(404).send({ error: `playerId "${playerId}" は見つかりません` });
        }
        throw err;
      }

      await cardMasterRepository.reload();
      return reply.code(204).send();
    }
  );
}
