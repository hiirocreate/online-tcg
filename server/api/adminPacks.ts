import type { FastifyInstance } from "fastify";
import type { PackMasterInput } from "@tcg/shared";
import { validatePackMasterInput } from "@tcg/shared/validation";
import { prisma } from "../database/prismaClient.js";
import { Prisma } from "../database/generated/client.js";
import { cardMasterRepository } from "../game/cardMaster.js";
import { requireAuth, requireAdmin } from "../services/auth.js";

/** 管理画面用のPack(ガチャ)マスター CRUD API（仕様書14番） */
export async function adminPacksRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    "/api/admin/packs",
    { preHandler: [requireAuth, requireAdmin] },
    async () => {
      return { packs: cardMasterRepository.getAllPacks() };
    }
  );

  fastify.post<{ Body: PackMasterInput }>(
    "/api/admin/packs",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const input = request.body;
      const result = validatePackMasterInput(input);
      if (!result.valid) {
        return reply.code(400).send({ errors: result.errors });
      }

      try {
        await prisma.packMaster.create({
          data: {
            packId: input.packId,
            name: input.name,
            slots: input.slots,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return reply.code(409).send({ error: `packId "${input.packId}" は既に存在します` });
        }
        throw err;
      }

      await cardMasterRepository.reload();
      return reply.code(201).send({ pack: cardMasterRepository.getPackById(input.packId) });
    }
  );

  fastify.put<{ Params: { packId: string }; Body: PackMasterInput }>(
    "/api/admin/packs/:packId",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const { packId } = request.params;
      const input: PackMasterInput = { ...request.body, packId };
      const result = validatePackMasterInput(input);
      if (!result.valid) {
        return reply.code(400).send({ errors: result.errors });
      }

      try {
        await prisma.packMaster.update({
          where: { packId },
          data: {
            name: input.name,
            slots: input.slots,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
          return reply.code(404).send({ error: `packId "${packId}" は見つかりません` });
        }
        throw err;
      }

      await cardMasterRepository.reload();
      return reply.send({ pack: cardMasterRepository.getPackById(packId) });
    }
  );

  fastify.delete<{ Params: { packId: string } }>(
    "/api/admin/packs/:packId",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const { packId } = request.params;
      try {
        await prisma.packMaster.delete({ where: { packId } });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
          return reply.code(404).send({ error: `packId "${packId}" は見つかりません` });
        }
        throw err;
      }

      await cardMasterRepository.reload();
      return reply.code(204).send();
    }
  );
}
