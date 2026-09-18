import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { prisma } from "./prismaClient.js";
import type {
  SubordinateCardMaster,
  SpellCardMaster,
  FieldCardMaster,
  PlayerMasterCard,
  PackMaster as PackMasterType,
} from "@tcg/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "..", "data");

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(DATA_DIR, relativePath), "utf-8")) as T;
}

/**
 * data/cards/*.json, data/packs/packs.json の内容をDBへ投入する初回移行スクリプト。
 * 仕様書47番の通りJSONで管理していたCard Masterを、管理画面から編集できるように
 * DBへ移行するためのもの（ユーザー確認済み。詳細はschema.prismaの冒頭コメント参照）。
 *
 * 実行方法: npm run db:seed --workspace server
 *
 * 既に存在するcardId/playerId/packIdは上書き(upsert)するため、何度実行しても安全。
 */
async function main(): Promise<void> {
  const subordinates = loadJson<SubordinateCardMaster[]>("cards/subordinates.json");
  const spells = loadJson<SpellCardMaster[]>("cards/spells.json");
  const fields = loadJson<FieldCardMaster[]>("cards/fields.json");
  const playerMasters = loadJson<PlayerMasterCard[]>("cards/players.json");
  const packs = loadJson<PackMasterType[]>("packs/packs.json");

  for (const card of subordinates) {
    await prisma.cardMaster.upsert({
      where: { cardId: card.cardId },
      create: {
        cardId: card.cardId,
        cardType: card.cardType,
        name: card.name,
        illustration: card.illustration,
        effectText: card.effectText,
        attack: card.attack,
        health: card.health,
        energyCost: card.energyCost,
      },
      update: {
        cardType: card.cardType,
        name: card.name,
        illustration: card.illustration,
        effectText: card.effectText,
        attack: card.attack,
        health: card.health,
        energyCost: card.energyCost,
      },
    });
  }

  for (const card of [...spells, ...fields]) {
    await prisma.cardMaster.upsert({
      where: { cardId: card.cardId },
      create: {
        cardId: card.cardId,
        cardType: card.cardType,
        name: card.name,
        illustration: card.illustration,
        effectText: card.effectText,
        attack: null,
        health: null,
        energyCost: card.energyCost,
      },
      update: {
        cardType: card.cardType,
        name: card.name,
        illustration: card.illustration,
        effectText: card.effectText,
        attack: null,
        health: null,
        energyCost: card.energyCost,
      },
    });
  }

  for (const player of playerMasters) {
    await prisma.playerMaster.upsert({
      where: { playerId: player.playerId },
      create: {
        playerId: player.playerId,
        name: player.name,
        illustration: player.illustration,
        attack: player.attack,
        health: player.health,
        effectText: player.effectText,
      },
      update: {
        name: player.name,
        illustration: player.illustration,
        attack: player.attack,
        health: player.health,
        effectText: player.effectText,
      },
    });
  }

  for (const pack of packs) {
    await prisma.packMaster.upsert({
      where: { packId: pack.packId },
      create: { packId: pack.packId, name: pack.name, slots: pack.slots },
      update: { name: pack.name, slots: pack.slots },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `Seed完了: cards=${subordinates.length + spells.length + fields.length}, players=${playerMasters.length}, packs=${packs.length}`
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
