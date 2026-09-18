import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { CardMaster } from "@tcg/shared";
import { fetchAdminCards, deleteCard, AdminApiError } from "../../api/adminApi";

export function CardListPage() {
  const [cards, setCards] = useState<CardMaster[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    fetchAdminCards()
      .then(setCards)
      .catch((err: AdminApiError) => setError(err.message));
  }

  useEffect(reload, []);

  async function handleDelete(cardId: string) {
    if (!window.confirm(`${cardId} を削除しますか？`)) return;
    try {
      await deleteCard(cardId);
      reload();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "削除に失敗しました");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>カード一覧</h2>
        <Link to="/admin/cards/new">
          <button>新規カード作成</button>
        </Link>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!cards && !error && <p>読み込み中...</p>}
      {cards && (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={cellStyle}>cardId</th>
              <th style={cellStyle}>種別</th>
              <th style={cellStyle}>名前</th>
              <th style={cellStyle}>ATK</th>
              <th style={cellStyle}>HP</th>
              <th style={cellStyle}>コスト</th>
              <th style={cellStyle}></th>
            </tr>
          </thead>
          <tbody>
            {cards.map((card) => (
              <tr key={card.cardId}>
                <td style={cellStyle}>{card.cardId}</td>
                <td style={cellStyle}>{card.cardType}</td>
                <td style={cellStyle}>{card.name}</td>
                <td style={cellStyle}>{card.cardType === "subordinate" ? card.attack : "-"}</td>
                <td style={cellStyle}>{card.cardType === "subordinate" ? card.health : "-"}</td>
                <td style={cellStyle}>{"energyCost" in card ? card.energyCost : "-"}</td>
                <td style={cellStyle}>
                  <Link to={`/admin/cards/${card.cardId}`}>編集</Link>{" "}
                  <button onClick={() => handleDelete(card.cardId)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const cellStyle: CSSProperties = {
  border: "1px solid #ddd",
  padding: "6px 10px",
  textAlign: "left",
};
