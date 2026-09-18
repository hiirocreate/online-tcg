import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { PlayerMasterCard } from "@tcg/shared";
import { fetchAdminPlayers, deletePlayerMaster, AdminApiError } from "../../api/adminApi";

export function PlayerMasterListPage() {
  const [players, setPlayers] = useState<PlayerMasterCard[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    fetchAdminPlayers()
      .then(setPlayers)
      .catch((err: AdminApiError) => setError(err.message));
  }

  useEffect(reload, []);

  async function handleDelete(playerId: string) {
    if (!window.confirm(`${playerId} を削除しますか？`)) return;
    try {
      await deletePlayerMaster(playerId);
      reload();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "削除に失敗しました");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Playerアバター一覧</h2>
        <Link to="/admin/players/new">
          <button>新規作成</button>
        </Link>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!players && !error && <p>読み込み中...</p>}
      {players && (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={cellStyle}>playerId</th>
              <th style={cellStyle}>名前</th>
              <th style={cellStyle}>ATK</th>
              <th style={cellStyle}>HP</th>
              <th style={cellStyle}></th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.playerId}>
                <td style={cellStyle}>{p.playerId}</td>
                <td style={cellStyle}>{p.name}</td>
                <td style={cellStyle}>{p.attack}</td>
                <td style={cellStyle}>{p.health}</td>
                <td style={cellStyle}>
                  <Link to={`/admin/players/${p.playerId}`}>編集</Link>{" "}
                  <button onClick={() => handleDelete(p.playerId)}>削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const cellStyle: CSSProperties = { border: "1px solid #ddd", padding: "6px 10px", textAlign: "left" };
