import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client.js";

/**
 * PrismaClientのシングルトン（Prisma ORM v7のドライバアダプタ形式）。
 * tsx watch等でのホットリロード時に複数のPrismaClient/コネクションプールが
 * 生成され続けるのを防ぐため、globalに保持する定石パターンを使う。
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
