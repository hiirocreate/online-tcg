import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import type { PlayerMasterInput } from "@tcg/shared";
import {
  fetchAdminPlayers,
  createPlayerMaster,
  updatePlayerMaster,
  uploadCardImage,
  AdminApiError,
} from "../../api/adminApi";

const EMPTY_FORM: PlayerMasterInput = {
  playerId: "",
  name: "",
  illustration: "",
  attack: 0,
  health: 20,
  effectText: "",
};

export function PlayerMasterFormPage() {
  const { playerId } = useParams<{ playerId: string }>();
  const isEditing = Boolean(playerId);
  const navigate = useNavigate();

  const [form, setForm] = useState<PlayerMasterInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);

  useEffect(() => {
    if (!isEditing) return;
    fetchAdminPlayers()
      .then((players) => {
        const existing = players.find((p) => p.playerId === playerId);
        if (existing) setForm(existing);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [playerId, isEditing]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      if (isEditing && playerId) {
        await updatePlayerMaster(playerId, form);
      } else {
        await createPlayerMaster(form);
      }
      navigate("/admin/players");
    } catch (err) {
      setErrors(err instanceof AdminApiError ? (err.errors ?? [err.message]) : ["保存に失敗しました"]);
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <p>読み込み中...</p>;

  return (
    <div style={{ maxWidth: 480 }}>
      <p>
        <Link to="/admin/players">← Playerアバター一覧に戻る</Link>
      </p>
      <h2>{isEditing ? `編集: ${playerId}` : "新規Playerアバター作成"}</h2>
      <form onSubmit={handleSubmit}>
        <FormRow label="playerId">
          <input
            value={form.playerId}
            onChange={(e) => setForm({ ...form, playerId: e.target.value })}
            disabled={isEditing}
            required
          />
        </FormRow>
        <FormRow label="名前">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </FormRow>
        <FormRow label="イラスト">
          <input
            value={form.illustration}
            onChange={(e) => setForm({ ...form, illustration: e.target.value })}
          />
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                const url = await uploadCardImage(file);
                setForm((prev) => ({ ...prev, illustration: url }));
              } catch (err) {
                setErrors([err instanceof AdminApiError ? err.message : "アップロード失敗"]);
              }
            }}
          />
        </FormRow>
        <FormRow label="攻撃力">
          <input
            type="number"
            value={form.attack}
            onChange={(e) => setForm({ ...form, attack: Number(e.target.value) })}
          />
        </FormRow>
        <FormRow label="体力">
          <input
            type="number"
            value={form.health}
            onChange={(e) => setForm({ ...form, health: Number(e.target.value) })}
          />
        </FormRow>
        <FormRow label="効果テキスト">
          <textarea
            value={form.effectText}
            onChange={(e) => setForm({ ...form, effectText: e.target.value })}
          />
        </FormRow>

        {errors.length > 0 && (
          <ul style={{ color: "red" }}>
            {errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        <button type="submit" disabled={saving}>
          {saving ? "保存中..." : "保存"}
        </button>
      </form>
    </div>
  );
}

function FormRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}
