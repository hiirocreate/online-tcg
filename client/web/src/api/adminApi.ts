import type { CardMasterInput, PlayerMasterInput, PackMasterInput, CardMaster, PlayerMasterCard, PackMaster } from "@tcg/shared";
import { supabase } from "../supabaseClient";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

export class AdminApiError extends Error {
  status: number;
  errors?: string[];
  constructor(status: number, message: string, errors?: string[]) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new AdminApiError(401, "ログインが必要です");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!res.ok) {
    let body: { error?: string; errors?: string[] } = {};
    try {
      body = await res.json();
    } catch {
      // JSONで無いエラーレスポンスは無視
    }
    throw new AdminApiError(
      res.status,
      body.error ?? `リクエストに失敗しました (status ${res.status})`,
      body.errors
    );
  }

  return res;
}

export interface CurrentAdminUser {
  id: string;
  email: string;
  isAdmin: boolean;
}

/** ログイン中のユーザーが管理者かどうかを確認する */
export async function fetchCurrentUser(): Promise<CurrentAdminUser> {
  const res = await authorizedFetch("/api/admin/me");
  return res.json();
}

// --- カード ---

export async function fetchAdminCards(): Promise<CardMaster[]> {
  const res = await authorizedFetch("/api/admin/cards");
  const body = await res.json();
  return body.cards;
}

export async function createCard(input: CardMasterInput): Promise<void> {
  await authorizedFetch("/api/admin/cards", { method: "POST", body: JSON.stringify(input) });
}

export async function updateCard(cardId: string, input: CardMasterInput): Promise<void> {
  await authorizedFetch(`/api/admin/cards/${encodeURIComponent(cardId)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deleteCard(cardId: string): Promise<void> {
  await authorizedFetch(`/api/admin/cards/${encodeURIComponent(cardId)}`, { method: "DELETE" });
}

// --- Playerマスター ---

export async function fetchAdminPlayers(): Promise<PlayerMasterCard[]> {
  const res = await authorizedFetch("/api/admin/players");
  const body = await res.json();
  return body.players;
}

export async function createPlayerMaster(input: PlayerMasterInput): Promise<void> {
  await authorizedFetch("/api/admin/players", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePlayerMaster(playerId: string, input: PlayerMasterInput): Promise<void> {
  await authorizedFetch(`/api/admin/players/${encodeURIComponent(playerId)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deletePlayerMaster(playerId: string): Promise<void> {
  await authorizedFetch(`/api/admin/players/${encodeURIComponent(playerId)}`, { method: "DELETE" });
}

// --- Packマスター ---

export async function fetchAdminPacks(): Promise<PackMaster[]> {
  const res = await authorizedFetch("/api/admin/packs");
  const body = await res.json();
  return body.packs;
}

export async function createPackMaster(input: PackMasterInput): Promise<void> {
  await authorizedFetch("/api/admin/packs", { method: "POST", body: JSON.stringify(input) });
}

export async function updatePackMaster(packId: string, input: PackMasterInput): Promise<void> {
  await authorizedFetch(`/api/admin/packs/${encodeURIComponent(packId)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export async function deletePackMaster(packId: string): Promise<void> {
  await authorizedFetch(`/api/admin/packs/${encodeURIComponent(packId)}`, { method: "DELETE" });
}

// --- 画像アップロード(Supabase Storage) ---

const CARD_IMAGE_BUCKET = "card-images";

/**
 * カード画像をSupabase Storageにアップロードし、公開URLを返す。
 * 事前にSupabaseダッシュボードで`card-images`バケット(公開)の作成と、
 * 管理者のみアップロード可能にするRLSポリシーの設定が必要（README参照）。
 */
export async function uploadCardImage(file: File): Promise<string> {
  const path = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from(CARD_IMAGE_BUCKET).upload(path, file);
  if (error) {
    throw new AdminApiError(500, `画像アップロードに失敗しました: ${error.message}`);
  }
  const { data } = supabase.storage.from(CARD_IMAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
