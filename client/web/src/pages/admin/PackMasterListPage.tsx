import { useEffect, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { PackMaster } from "@tcg/shared";
import { fetchAdminPacks, deletePackMaster, AdminApiError } from "../../api/adminApi";

export function PackMasterListPage() {
  const [packs, setPacks] = useState<PackMaster[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    fetchAdminPacks()
      .then(setPacks)
      .catch((err: AdminApiError) => setError(err.message));
  }

  useEffect(reload, []);

  async function handleDelete(packId: string) {
    if (!window.confirm(`${packId} を削除しますか？`)) return;
    try {
      await deletePackMaster(packId);
      reload();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : "削除に失敗しました");
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>パック一覧</h2>
        <Link to="/admin/packs/new">
          <button>新規作成</button>
        </Link>
      </div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!packs && !error && <p>読み込み中...</p>}
      {packs && (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={cellStyle}>packId</th>
              <th style={cellStyle}>名前</th>
              <th style={cellStyle}>スロット構成</th>
              <th style={cellStyle}></th>
            </tr>
          </thead>
          <tbody>
            {packs.map((pack) => (
              <tr key={pack.packId}>
                <td style={cellStyle}>{pack.packId}</td>
                <td style={cellStyle}>{pack.name}</td>
                <td style={cellStyle}>
                  {pack.slots.map((s) => `${s.rarity}×${s.count}`).join(", ")}
                </td>
                <td style={cellStyle}>
                  <Link to={`/admin/packs/${pack.packId}`}>編集</Link>{" "}
                  <button onClick={() => handleDelete(pack.packId)}>削除</button>
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
