import type {
  CardMaster,
  SubordinateCardMaster,
  SpellCardMaster,
  FieldCardMaster,
  PlayerMasterCard,
  PackMaster as PackMasterType,
  PackSlotInput,
} from "@tcg/shared";
import { prisma as defaultPrisma } from "../database/prismaClient.js";

/**
 * Card Master（仕様書4番）はSupabase(PostgreSQL)のcard_masters/player_masters/pack_masters
 * テーブルで管理する（元はJSONファイル管理だったが、管理画面から即時反映できるように
 * DBへ移行した。詳細は server/database/schema.prisma 冒頭コメント参照）。
 *
 * このリポジトリはDBの内容を起動時・管理画面での保存直後にメモリへキャッシュし、
 * 対戦中の参照はメモリから高速に行う。
 */

interface PrismaCardMasterRow {
  cardId: string;
  cardType: string;
  name: string;
  illustration: string;
  effectText: string;
  attack: number | null;
  health: number | null;
  energyCost: number | null;
}

interface PrismaPlayerMasterRow {
  playerId: string;
  name: string;
  illustration: string;
  attack: number;
  health: number;
  effectText: string;
}

interface PrismaPackMasterRow {
  packId: string;
  name: string;
  slots: unknown;
}

/**
 * このリポジトリが必要とするPrismaクライアントの最小限の形。
 * テスト時にDBへ接続しないフェイクのクライアントを注入できるようにするため、
 * PrismaClient全体ではなくこの狭いインターフェースに依存する。
 */
export interface CardMasterPrismaClient {
  cardMaster: { findMany(): Promise<PrismaCardMasterRow[]> };
  playerMaster: { findMany(): Promise<PrismaPlayerMasterRow[]> };
  packMaster: { findMany(): Promise<PrismaPackMasterRow[]> };
}

export function mapRowToCardMaster(row: PrismaCardMasterRow): CardMaster {
  if (row.cardType === "subordinate") {
    if (row.attack == null || row.health == null || row.energyCost == null) {
      throw new Error(`Subordinate ${row.cardId} にattack/health/energyCostが不足しています`);
    }
    const card: SubordinateCardMaster = {
      cardId: row.cardId,
      cardType: "subordinate",
      name: row.name,
      illustration: row.illustration,
      effectText: row.effectText,
      attack: row.attack,
      health: row.health,
      energyCost: row.energyCost,
    };
    return card;
  }

  if (row.cardType === "spell") {
    if (row.energyCost == null) {
      throw new Error(`Spell ${row.cardId} にenergyCostが不足しています`);
    }
    const card: SpellCardMaster = {
      cardId: row.cardId,
      cardType: "spell",
      name: row.name,
      illustration: row.illustration,
      effectText: row.effectText,
      energyCost: row.energyCost,
    };
    return card;
  }

  if (row.cardType === "field") {
    if (row.energyCost == null) {
      throw new Error(`Field ${row.cardId} にenergyCostが不足しています`);
    }
    const card: FieldCardMaster = {
      cardId: row.cardId,
      cardType: "field",
      name: row.name,
      illustration: row.illustration,
      effectText: row.effectText,
      energyCost: row.energyCost,
    };
    return card;
  }

  throw new Error(`未知のcardTypeです: ${row.cardType}（cardId=${row.cardId}）`);
}

export function mapRowToPlayerMaster(row: PrismaPlayerMasterRow): PlayerMasterCard {
  return {
    playerId: row.playerId,
    name: row.name,
    illustration: row.illustration,
    attack: row.attack,
    health: row.health,
    effectText: row.effectText,
  };
}

export function mapRowToPackMaster(row: PrismaPackMasterRow): PackMasterType {
  return {
    packId: row.packId,
    name: row.name,
    slots: row.slots as PackSlotInput[],
  };
}

export class CardMasterRepository {
  private cardsById = new Map<string, CardMaster>();
  private playerMastersById = new Map<string, PlayerMasterCard>();
  private packsById = new Map<string, PackMasterType>();

  constructor(private readonly client: CardMasterPrismaClient = defaultPrisma) {}

  /** DBから全件取得し、メモリキャッシュを構築する（起動時に1回呼び出す） */
  async load(): Promise<void> {
    const [cardRows, playerRows, packRows] = await Promise.all([
      this.client.cardMaster.findMany(),
      this.client.playerMaster.findMany(),
      this.client.packMaster.findMany(),
    ]);

    const cardsById = new Map<string, CardMaster>();
    for (const row of cardRows) {
      if (cardsById.has(row.cardId)) {
        throw new Error(`Card Masterに重複したcardIdがあります: ${row.cardId}`);
      }
      cardsById.set(row.cardId, mapRowToCardMaster(row));
    }
    this.cardsById = cardsById;

    const playerMastersById = new Map<string, PlayerMasterCard>();
    for (const row of playerRows) {
      playerMastersById.set(row.playerId, mapRowToPlayerMaster(row));
    }
    this.playerMastersById = playerMastersById;

    const packsById = new Map<string, PackMasterType>();
    for (const row of packRows) {
      packsById.set(row.packId, mapRowToPackMaster(row));
    }
    this.packsById = packsById;
  }

  /**
   * 管理画面でのカード保存・削除の直後に呼び出す。
   * これにより、サーバーを再起動しなくても対戦中のクライアントに新カードが反映される。
   */
  async reload(): Promise<void> {
    return this.load();
  }

  getAllCards(): CardMaster[] {
    return [...this.cardsById.values()];
  }

  getCardById(cardId: string): CardMaster | undefined {
    return this.cardsById.get(cardId);
  }

  getAllPlayerMasters(): PlayerMasterCard[] {
    return [...this.playerMastersById.values()];
  }

  getPlayerMasterById(playerId: string): PlayerMasterCard | undefined {
    return this.playerMastersById.get(playerId);
  }

  getAllPacks(): PackMasterType[] {
    return [...this.packsById.values()];
  }

  getPackById(packId: string): PackMasterType | undefined {
    return this.packsById.get(packId);
  }
}

export const cardMasterRepository = new CardMasterRepository();
