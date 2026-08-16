import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { saveCollection, type CollectionRow } from "@/api/collections";
import { PRODUCT_ASSET_KEYS, resolveProductImage } from "@/lib/product-assets";

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] uppercase tracking-[0.18em] text-charbon/60">{children}</span>
);

const inputClass =
  "mt-1 w-full rounded-lg border-0 bg-sable px-3 py-2.5 text-sm text-charbon outline-none transition focus:ring-1 focus:ring-gold";

/** Édition d'une collection : textes affichés, référencement, visuel, ordre. */
export function CollectionEditor({
  row,
  onClose,
  onSaved,
}: {
  row: CollectionRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState({
    label: row.label,
    h1: row.h1,
    title: row.title,
    description: row.description,
    subtitle: row.subtitle,
    image_key: row.image_key ?? "",
    image_url: row.image_url ?? "",
    sort_order: String(row.sort_order),
    published: row.published,
  });
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<typeof f>) => setF((prev) => ({ ...prev, ...patch }));

  const preview = useMemo(
    () => resolveProductImage(f.image_url || null, f.image_key || null),
    [f.image_url, f.image_key],
  );

  const save = async () => {
    if (!f.label.trim() || !f.h1.trim()) {
      toast.error("Le nom et le titre de page sont obligatoires.");
      return;
    }
    setSaving(true);
    try {
      await saveCollection({
        data: {
          id: row.id,
          values: {
            label: f.label.trim(),
            h1: f.h1.trim(),
            title: f.title,
            description: f.description,
            subtitle: f.subtitle,
            image_key: f.image_key || null,
            image_url: f.image_url || null,
            sort_order: f.sort_order === "" ? 0 : Number(f.sort_order),
            published: f.published,
          },
        },
      });
    } catch (e) {
      setSaving(false);
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
      return;
    }
    setSaving(false);
    toast.success(`« ${f.label} » enregistrée.`);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-charbon/40 backdrop-blur-sm"
      />
      <div className="relative z-10 flex h-full w-full max-w-xl flex-col bg-ivory shadow-2xl sm:my-3 sm:mr-3 sm:h-[calc(100%-1.5rem)] sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-beige/60 px-6 py-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-gold">Collection</div>
            <h2 className="mt-1 font-display text-xl">{f.label || row.slug}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-charbon/60 hover:text-charbon">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="rounded-xl bg-sable px-4 py-3 text-[11px] leading-relaxed text-charbon/60">
            Adresse de la page : <code className="text-charbon">/patisserie/{row.slug}</code> — non
            modifiable, des liens et le référencement pointent dessus. Étiquette portée par les
            produits : <code className="text-charbon">{row.product_key}</code>.
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <Label>Nom affiché *</Label>
              <input
                value={f.label}
                onChange={(e) => set({ label: e.target.value })}
                className={inputClass}
              />
            </label>
            <label>
              <Label>Ordre d'affichage</Label>
              <input
                type="number"
                value={f.sort_order}
                onChange={(e) => set({ sort_order: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          <label className="block">
            <Label>Titre de la page (H1) *</Label>
            <input
              value={f.h1}
              onChange={(e) => set({ h1: e.target.value })}
              className={inputClass}
            />
          </label>

          <label className="block">
            <Label>Accroche sous le titre</Label>
            <textarea
              rows={2}
              value={f.subtitle}
              onChange={(e) => set({ subtitle: e.target.value })}
              className={inputClass}
            />
          </label>

          <div className="space-y-3 rounded-xl bg-sable/60 p-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-gold">
              Référencement (Google, partages)
            </div>
            <label className="block">
              <Label>Titre de l'onglet</Label>
              <input
                value={f.title}
                onChange={(e) => set({ title: e.target.value })}
                className={inputClass}
              />
              <span className="mt-1 block text-[10px] text-charbon/45">
                {f.title.length} caractères — idéalement moins de 60.
              </span>
            </label>
            <label className="block">
              <Label>Description</Label>
              <textarea
                rows={3}
                value={f.description}
                onChange={(e) => set({ description: e.target.value })}
                className={inputClass}
              />
              <span className="mt-1 block text-[10px] text-charbon/45">
                {f.description.length} caractères — idéalement entre 120 et 160.
              </span>
            </label>
          </div>

          <div>
            <Label>Visuel de la collection</Label>
            <div className="mt-2 flex gap-4">
              <div className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-sable">
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center font-display text-2xl text-charbon/30">
                    Ö
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <select
                  value={f.image_key}
                  onChange={(e) => set({ image_key: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Photo livrée avec le site…</option>
                  {PRODUCT_ASSET_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
                <input
                  value={f.image_url}
                  onChange={(e) => set({ image_url: e.target.value })}
                  placeholder="…ou adresse d'une photo (prioritaire)"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-charbon/80">
            <input
              type="checkbox"
              checked={f.published}
              onChange={(e) => set({ published: e.target.checked })}
              className="accent-[var(--gold)]"
            />
            Collection visible en boutique
          </label>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-beige/60 px-6 py-4">
          <button onClick={onClose} className="btn btn-ghost">
            Annuler
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-gradient-to-tl from-charbon to-[#4a3f3a] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory shadow-soft transition hover:opacity-90"
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
        </footer>
      </div>
    </div>
  );
}
