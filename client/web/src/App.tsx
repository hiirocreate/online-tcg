import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCards, type CardsResponse } from "./api";

/**
 * Phase 1時点では「サーバーからCard Masterを取得して表示するだけ」の疎通確認画面。
 * ゲーム画面本体はPhase 4以降で実装する。
 */
export function App() {
  const [data, setData] = useState<CardsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCards()
      .then(setData)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>オンライン対戦カードゲーム（Phase 1 疎通確認）</h1>
      <p>
        <Link to="/admin">管理画面へ</Link>
      </p>
      {error && <p style={{ color: "red" }}>エラー: {error}</p>}
      {!data && !error && <p>Card Masterを読み込み中...</p>}
      {data && (
        <>
          <h2>カード一覧（{data.cards.length}件）</h2>
          <ul>
            {data.cards.map((card) => (
              <li key={card.cardId}>
                [{card.cardType}] {card.cardId} - {card.name}
              </li>
            ))}
          </ul>
          <h2>Player Master一覧（{data.players.length}件）</h2>
          <ul>
            {data.players.map((player) => (
              <li key={player.playerId}>
                {player.playerId} - {player.name}（HP: {player.health}）
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
