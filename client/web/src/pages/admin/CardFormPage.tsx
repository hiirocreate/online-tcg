import { useEffect, useState, type FormEvent, type ChangeEvent, type ReactNode } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import type { CardMasterInput, CardType } from "@tcg/shared";
import { fetchAdminCards, createCard, updateCard, uploadCardImage, AdminApiError } from "../../api/adminApi";

const EMPTY_FORM: CardMasterInput = {
  cardId: "",
  cardType: "subordinate",
  name: "",
  illustration: "",
  effectText: "",
  attack: 0,
  health: 1,
  energyCost: 0,
};

export function CardFormPage() {
  const { cardId } = useParams<{ cardId: string }>();
  const isEditing = Boolean(cardId);
  const navigate = useNavigate();

  const [form, setForm] = useState<CardMasterInput>(EMPTY_FORM);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(!isEditing);

  useEffect(() => {
    if (!isEditing) return;
    fetchAdminCards()
      .then((cards) => {
        const existing = cards.find((c) => c.cardId === cardId);
        if (existing) {
          setForm({
            cardId: existing.cardId,
            cardType: existing.cardType,
            name: existing.name,
            illustration: existing.illustration,
            effectText: existing.effectText,
            attack: existing.cardType === "subordinate" ? existing.attack : undefined,
            health: existing.cardType === "subordinate" ? existing.health : undefined,
            energyCost: "energyCost" in existing ? existing.energyCost : undefined,
          });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [cardId, isEditing]);

  function handleCardTypeChange(cardType: CardType) {
    setForm((prev) => ({
      ...prev,
      cardType,
      attack: cardType === "subordinate" ? (prev.attack ?? 0) : undefined,
      health: cardType === "subordinate" ? (prev.health ?? 1) : undefined,
    }));
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadCardImage(file);
      setForm((prev) => ({ ...prev, illustration: url }));
    } catch (err) {
      setErrors([err instanceof AdminApiError ? err.message : "画像アップロードに失敗しました"]);
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrors([]);
    setSaving(true);
    try {
      if (isEditing && cardId) {
        await updateCard(cardId, form);
      } else {
        await createCard(form);
      }
      navigate("/admin/cards");
    } catch (err) {
      if (err instanceof AdminApiError) {
        setErrors(err.errors ?? [err.message]);
      } else {
        setErrors(["保存に失敗しました"]);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!loaded) return <p>読み込み中...</p>;

  return (
    <div style={{ maxWidth: 480 }}>
      <p>
        <Link to="/admin/cards">← カード一覧に戻る</Link>
      </p>
      <h2>{isEditing ? `カード編集: ${cardId}` : "新規カード作成"}</h2>
      <form onSubmit={handleSubmit}>
        <FormRow label="cardId">
          <input
            value={form.cardId}
            onChange={(e) => setForm({ ...form, cardId: e.target.value })}
            disabled={isEditing}
            required
          />
        </FormRow>

        <FormRow label="種別">
          <select
            value={form.cardType}
            onChange={(e) => handleCardTypeChange(e.target.value as CardType)}
          >
            <option value="subordinate">Subordinate</option>
            <option value="spell">Spell</option>
            <option value="field">Field</option>
          </select>
        </FormRow>

        <FormRow label="名前">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </FormRow>

        <FormRow label="イラスト">
          <input
            value={form.illustration}
            onChange={(e) => setForm({ ...form, illustration: e.target.value })}
            placeholder="画像URL、または下からアップロード"
          />
          <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          {uploading && <p>アップロード中...</p>}
        </FormRow>

        <FormRow label="効果テキスト">
          <textarea
            value={form.effectText}
            onChange={(e) => setForm({ ...form, effectText: e.target.value })}
          />
        </FormRow>

        {form.cardType === "subordinate" && (
          <>
            <FormRow label="攻撃力">
              <input
                type="number"
                value={form.attack ?? 0}
                onChange={(e) => setForm({ ...form, attack: Number(e.target.value) })}
              />
            </FormRow>
            <FormRow label="体力">
              <input
                type="number"
                value={form.health ?? 1}
                onChange={(e) => setForm({ ...form, health: Number(e.target.value) })}
              />
            </FormRow>
          </>
        )}

        <FormRow label="Energyコスト">
          <input
            type="number"
            value={form.energyCost ?? 0}
            onChange={(e) => setForm({ ...form, energyCost: Number(e.target.value) })}
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
