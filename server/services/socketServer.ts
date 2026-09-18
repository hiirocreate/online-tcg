import type { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";

/**
 * Socket.ioサーバーの初期化。
 *
 * Phase 1時点では疎通確認のための最小構成のみ。JWT認証・gameIdごとのroom参加・
 * game_started等のイベント配信（仕様書43, 44, 45番）はPhase 4で実装する。
 */
export function createSocketServer(httpServer: HttpServer, clientOrigin: string): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: clientOrigin,
    },
  });

  io.on("connection", (socket) => {
    // eslint-disable-next-line no-console
    console.log(`[socket] connected: ${socket.id}`);

    socket.on("disconnect", () => {
      // eslint-disable-next-line no-console
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });

  return io;
}
