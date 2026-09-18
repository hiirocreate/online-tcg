import "dotenv/config";
import { createApp } from "./app.js";
import { cardMasterRepository } from "./game/cardMaster.js";
import { createSocketServer } from "./services/socketServer.js";

const PORT = Number(process.env.PORT ?? 3000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

async function main(): Promise<void> {
  // Card MasterをDB(Supabase)から起動時に読み込む（仕様書49番 Phase1、DB移行後版）
  await cardMasterRepository.load();

  const fastify = await createApp(CLIENT_ORIGIN);

  await fastify.listen({ port: PORT, host: "0.0.0.0" });

  createSocketServer(fastify.server, CLIENT_ORIGIN);

  fastify.log.info(`Card Master: ${cardMasterRepository.getAllCards().length}枚のカードを読み込みました`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
