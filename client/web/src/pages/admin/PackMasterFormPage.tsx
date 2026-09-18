import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import type { PackMasterInput, PackSlotInput } from "@tcg/shared";
import { fetchAdminPacks, createPackMaster, updatePackMaster, AdminApiError } from "../../api/adminApi";

const EMPTY_FORM: PackMasterInput = {
  packId: "",
  name: "",
  slots: [{ rarity: "N", count: 1 }],
};

export function PackMasterFormPage() {
  const { packId } = useParams<{ packId: string }>();
  const isEditing = Boolean(packId);
  const navigate = useNavigate();

  const [form, setForm] = useState<PackMasterInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);

  useEffect(() => {
    if (!isEditing) return;
    fetchAdminPacks()
      .then((packs) => {
        const existing = packs.find((p) => p.packId === packId);
        if (existing) setForm(existing);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [packId, isEditing]);

  function updateSlot(index: number, slot: PackSlotInput) {
    setForm((prev) => ({
      ...prev,
      slots: prev.slots.map((s, i) => (i === index ? slot : s)),
    }));
  }

  function addSlot() {
    setForm((prev) => ({ ...prev, slots: [...prev.slots, { rarity: "N", count: 1 }] }));
  }

  function removeSlot(index: number) {
    setForm((prev) => ({ ...prev, slots: prev.slots.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      if (isEditing && packId) {
        await updatePackMaster(packId, form);
      } else {
        await createPackMaster(form);
      }
      navigate("/admin/packs");
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
        <Link to="/admin/packs">← パック一覧に戻る</Link>
      </p>
      <h2>{isEditing ? `編集: ${packId}` : "新規パック作成"}</h2>
      <form onSubmit={handleSubmit}>
        <FormRow label="packId">
          <input
            value={form.packId}
            onChange={(e) => setForm({ ...form, packId: e.target.value })}
            disabled={isEditing}
            required
          />
        </FormRow>
        <FormRow label="名前">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </FormRow>

        <FormRow label="スロット構成（レアリティ・排出率の詳細は別途決定予定）">
          {form.slots.map((slot, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 4 }}>
              <input
                placeholder="rarity"
                value={slot.rarity}
                onChange={(e) => updateSlot(i, { ...slot, rarity: e.target.value })}
              />
              <input
                type="number"
                placeholder="count"
                value={slot.count}
                onChange={(e) => updateSlot(i, { ...slot, count: Number(e.target.value) })}
              />
              <button type="button" onClick={() => removeSlot(i)}>
                削除
              </button>
            </div>
          ))}
          <button type="button" onClick={addSlot}>
            スロットを追加
          </button>
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
