import type { FastifyInstance } from "fastify";
import type { CardMasterInput } from "@tcg/shared";
import { validateCardMasterInput } from "@tcg/shared/validation";
import { prisma } from "../database/prismaClient.js";
import { Prisma } from "../database/generated/client.js";
import { cardMasterRepository } from "../game/cardMaster.js";
import { requireAuth, requireAdmin } from "../services/auth.js";

/**
 * 管理画面用のCard Master(Subordinate/Spell/Field) CRUD API。
 * 仕様書51番の方針(クライアントの入力をそのまま信用しない)に従い、
 * 保存前に必ずshared/validationでチェックする。
 * 保存・削除の直後は cardMasterRepository.reload() を呼び、対戦中のクライアントにも
 * 再起動なしで反映されるようにする。
 */
export async function adminCardsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    "/api/admin/cards",
    { preHandler: [requireAuth, requireAdmin] },
    async () => {
      return { cards: cardMasterRepository.getAllCards() };
    }
  );

  fastify.post<{ Body: CardMasterInput }>(
    "/api/admin/cards",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const input = request.body;
      const result = validateCardMasterInput(input);
      if (!result.valid) {
        return reply.code(400).send({ errors: result.errors });
      }

      try {
        await prisma.cardMaster.create({
          data: {
            cardId: input.cardId,
            cardType: input.cardType,
            name: input.name,
            illustration: input.illustration,
            effectText: input.effectText,
            attack: input.attack ?? null,
            health: input.health ?? null,
            energyCost: input.energyCost ?? null,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
          return reply.code(409).send({ error: `cardId "${input.cardId}" は既に存在します` });
        }
        throw err;
      }

      await cardMasterRepository.reload();
      return reply.code(201).send({ card: cardMasterRepository.getCardById(input.cardId) });
    }
  );

  fastify.put<{ Params: { cardId: string }; Body: CardMasterInput }>(
    "/api/admin/cards/:cardId",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const { cardId } = request.params;
      const input: CardMasterInput = { ...request.body, cardId };
      const result = validateCardMasterInput(input);
      if (!result.valid) {
        return reply.code(400).send({ errors: result.errors });
      }

      try {
        await prisma.cardMaster.update({
          where: { cardId },
          data: {
            cardType: input.cardType,
            name: input.name,
            illustration: input.illustration,
            effectText: input.effectText,
            attack: input.attack ?? null,
            health: input.health ?? null,
            energyCost: input.energyCost ?? null,
          },
        });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
          return reply.code(404).send({ error: `cardId "${cardId}" は見つかりません` });
        }
        throw err;
      }

      await cardMasterRepository.reload();
      return reply.send({ card: cardMasterRepository.getCardById(cardId) });
    }
  );

  fastify.delete<{ Params: { cardId: string } }>(
    "/api/admin/cards/:cardId",
    { preHandler: [requireAuth, requireAdmin] },
    async (request, reply) => {
      const { cardId } = request.params;
      try {
        await prisma.cardMaster.delete({ where: { cardId } });
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
          return reply.code(404).send({ error: `cardId "${cardId}" は見つかりません` });
        }
        throw err;
      }

      await cardMasterRepository.reload();
      return reply.code(204).send();
    }
  );
}
