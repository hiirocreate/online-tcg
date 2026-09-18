import type { CardMaster, PlayerMasterCard } from "@tcg/shared";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export interface CardsResponse {
  cards: CardMaster[];
  players: PlayerMasterCard[];
}

/** Phase1疎通確認用：GET /api/cards を呼び出す */
export async function fetchCards(): Promise<CardsResponse> {
  const res = await fetch(`${API_BASE_URL}/api/cards`);
  if (!res.ok) {
    throw new Error(`Card Masterの取得に失敗しました: ${res.status}`);
  }
  return res.json();
}
