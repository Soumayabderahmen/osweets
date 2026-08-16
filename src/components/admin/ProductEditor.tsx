import { useMemo, useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { allergenLabels, FAMILY_LABELS } from "@/data/products";
import type { ProductVariant } from "@/data/products";
import { saveProduct } from "@/api/catalog";
import type { ProductRow } from "@/lib/catalog";
import { PRODUCT_ASSET_KEYS, resolveProductImage } from "@/lib/product-assets";

/** Catégories de l'univers Pâtisserie Tunisienne — le reste du site n'est pas concerné. */
export const PATISSERIE_CATEGORIES = [
  { value: "traditionnelle", label: "Traditionnelle" },
  { value: "orientale", label: "Orientale" },
  { value: "petits-fours", label: "Petits fours" },
];

export const COLLECTION_OPTIONS = [
  { value: "amandes", label: "Amandes" },
  { value: "pistache", label: "Pistache, Machmoum & Pignon" },
  { value: "perles", label: "Perles" },
  { value: "tradition", label: "Tradition" },
  { value: "ramadan", label: "Ramadan" },
  { value: "aid", label: "Aïd" },
  { value: "fin-annee", label: "Fin d'année" },
];

const BADGES = [
  { value: "", label: "Aucun" },
  { value: "bestseller", label: "Meilleure vente" },
  { value: "nouveau", label: "Nouveau" },
  { value: "commande", label: "Sur commande" },
];

interface Form {
  slug: string;
  name: string;
  category: string;
  family: string;
  flavor_label: string;
  price: string;
  unit: string;
  weight: string;
  pieces: string;
  short_desc: string;
  description: string;
  conservation: string;
  disclaimer: string;
  delivery_mode: string;
  image_key: string;
  image_url: string;
  composition: string;
  ingredients: string;
  allergens: string[];
  flavors: string;
  varieties: string;
  collections: string[];
  availability: string;
  occasions: string;
  badge: string;
  variants: string;
  in_stock: boolean;
  published: boolean;
  draft: boolean;
  seasonal_only: boolean;
  local_only: boolean;
  no_cart: boolean;
  hide_price: boolean;
  requires_cold: boolean;
  sort_order: string;
}

const emptyForm: Form = {
  slug: "",
  name: "",
  category: "traditionnelle",
  family: "",
  flavor_label: "",
  price: "",
  unit: "",
  weight: "",
  pieces: "",
  short_desc: "",
  description: "",
  conservation: "",
  disclaimer: "",
  delivery_mode: "",
  image_key: "",
  image_url: "",
  composition: "",
  ingredients: "",
  allergens: [],
  flavors: "",
  varieties: "",
  collections: [],
  availability: "",
  occasions: "",
  badge: "",
  variants: "",
  in_stock: true,
  published: true,
  draft: false,
  seasonal_only: false,
  local_only: false,
  no_cart: false,
  hide_price: false,
  requires_cold: false,
  sort_order: "",
};

const joinLines = (v: string[] | null) => (v ?? []).join("\n");
const splitLines = (v: string) =>
  v
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

function toForm(r: ProductRow): Form {
  return {
    slug: r.slug,
    name: r.name,
    category: r.category,
    family: r.family ?? "",
    flavor_label: r.flavor_label ?? "",
    price: String(r.price ?? 0),
    unit: r.unit ?? "",
    weight: r.weight ?? "",
    pieces: r.pieces === null ? "" : String(r.pieces),
    short_desc: r.short_desc ?? "",
    description: r.description ?? "",
    conservation: r.conservation ?? "",
    disclaimer: r.disclaimer ?? "",
    delivery_mode: r.delivery_mode ?? "",
    image_key: r.image_key ?? "",
    image_url: r.image_url ?? "",
    composition: joinLines(r.composition),
    ingredients: joinLines(r.ingredients),
    allergens: r.allergens ?? [],
    flavors: joinLines(r.flavors),
    varieties: joinLines(r.varieties),
    collections: r.collections ?? [],
    availability: joinLines(r.availability),
    occasions: joinLines(r.occasions),
    badge: r.badge ?? "",
    variants:
      Array.isArray(r.variants) && r.variants.length ? JSON.stringify(r.variants, null, 2) : "",
    in_stock: r.in_stock,
    published: r.published,
    draft: r.draft,
    seasonal_only: r.seasonal_only,
    local_only: r.local_only,
    no_cart: r.no_cart,
    hide_price: r.hide_price,
    requires_cold: r.requires_cold,
    sort_order: String(r.sort_order ?? 0),
  };
}

/** « Samsa aux Amandes » → « samsa-aux-amandes ». */
export function slugify(v: string) {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[11px] uppercase tracking-[0.18em] text-charbon/60">{children}</span>
);

const inputClass =
  "mt-1 w-full rounded-lg border-0 bg-sable px-3 py-2.5 text-sm text-charbon outline-none transition focus:ring-1 focus:ring-gold";

export function ProductEditor({
  row,
  takenSlugs,
  onClose,
  onSaved,
}: {
  row: ProductRow | null;
  takenSlugs: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [f, setF] = useState<Form>(row ? toForm(row) : emptyForm);
  const [saving, setSaving] = useState(false);
  const set = (patch: Partial<Form>) => setF((prev) => ({ ...prev, ...patch }));
  const isNew = !row;

  const preview = useMemo(
    () => resolveProductImage(f.image_url || null, f.image_key || null),
    [f.image_url, f.image_key],
  );

  const toggle = (key: "allergens" | "collections", value: string) =>
    set({
      [key]: f[key].includes(value) ? f[key].filter((x) => x !== value) : [...f[key], value],
    } as Partial<Form>);

  const save = async () => {
    const slug = f.slug.trim() || slugify(f.name);
    if (!f.name.trim()) return toast.error("Le nom est obligatoire.");
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug))
      return toast.error("L'identifiant doit être en minuscules, sans accent ni espace.");
    if (isNew && takenSlugs.includes(slug))
      return toast.error(`L'identifiant « ${slug} » est déjà utilisé.`);

    let variants: ProductVariant[] | null = null;
    if (f.variants.trim()) {
      try {
        variants = JSON.parse(f.variants) as ProductVariant[];
      } catch {
        return toast.error("Parfums : le JSON est invalide.");
      }
    }

    const price = f.price === "" ? 0 : Number(f.price);
    if (Number.isNaN(price) || price < 0) return toast.error("Le prix est invalide.");

    const payload = {
      slug,
      name: f.name.trim(),
      category: f.category,
      family: f.family || null,
      flavor_label: f.flavor_label || null,
      price,
      unit: f.unit || null,
      weight: f.weight || null,
      pieces: f.pieces === "" ? null : Number(f.pieces),
      short_desc: f.short_desc,
      description: f.description,
      conservation: f.conservation,
      disclaimer: f.disclaimer || null,
      delivery_mode: f.delivery_mode || null,
      image_key: f.image_key || null,
      image_url: f.image_url || null,
      composition: splitLines(f.composition),
      ingredients: splitLines(f.ingredients),
      allergens: f.allergens,
      flavors: splitLines(f.flavors),
      varieties: splitLines(f.varieties),
      collections: f.collections,
      availability: splitLines(f.availability),
      occasions: splitLines(f.occasions),
      badge: f.badge || null,
      variants,
      in_stock: f.in_stock,
      published: f.published,
      // Un prix renseigné fait automatiquement sortir la fiche du brouillon.
      draft: price > 0 ? false : f.draft,
      seasonal_only: f.seasonal_only,
      local_only: f.local_only,
      no_cart: f.no_cart,
      hide_price: f.hide_price,
      requires_cold: f.requires_cold,
      sort_order: f.sort_order === "" ? 0 : Number(f.sort_order),
    };

    setSaving(true);
    try {
      await saveProduct({ data: { id: row?.id, values: payload } });
    } catch (e) {
      setSaving(false);
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
      return;
    }
    setSaving(false);
    toast.success(isNew ? `« ${payload.name} » créé.` : `« ${payload.name} » enregistré.`);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-charbon/40 backdrop-blur-sm"
      />
      <div className="relative z-10 m-0 flex h-full w-full max-w-2xl flex-col bg-ivory shadow-2xl sm:my-3 sm:mr-3 sm:h-[calc(100%-1.5rem)] sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-beige/60 px-6 py-4">
          <div>
            <div className="eyebrow">{isNew ? "Nouveau produit" : "Modifier"}</div>
            <h2 className="mt-1 font-display text-xl">{f.name || "Sans nom"}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-charbon/60 hover:text-charbon">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 space-y-8 overflow-y-auto px-6 py-6">
          {/* ---------- Identité ---------- */}
          <section className="space-y-3">
            <h3 className="font-display text-base">Identité</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <Label>Nom *</Label>
                <input
                  value={f.name}
                  onChange={(e) => set({ name: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Identifiant d'URL</Label>
                <input
                  value={f.slug}
                  onChange={(e) => set({ slug: e.target.value })}
                  placeholder={slugify(f.name) || "samsa-aux-amandes"}
                  disabled={!isNew}
                  className={`${inputClass} ${!isNew ? "opacity-60" : ""}`}
                />
                {!isNew && (
                  <span className="mt-1 block text-[11px] text-charbon/50">
                    Non modifiable : d'anciens liens pointent dessus.
                  </span>
                )}
              </label>
              <label>
                <Label>Catégorie</Label>
                <select
                  value={f.category}
                  onChange={(e) => set({ category: e.target.value })}
                  className={inputClass}
                >
                  {PATISSERIE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <Label>Ordre d'affichage</Label>
                <input
                  type="number"
                  value={f.sort_order}
                  onChange={(e) => set({ sort_order: e.target.value })}
                  placeholder="10, 20, 30…"
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Famille de parfums</Label>
                <select
                  value={f.family}
                  onChange={(e) => set({ family: e.target.value })}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {Object.entries(FAMILY_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <Label>Nom du parfum</Label>
                <input
                  value={f.flavor_label}
                  onChange={(e) => set({ flavor_label: e.target.value })}
                  placeholder="Pistache"
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          {/* ---------- Prix & format ---------- */}
          <section className="space-y-3">
            <h3 className="font-display text-base">Prix & format</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <Label>Prix (€)</Label>
                <input
                  type="number"
                  step="0.01"
                  value={f.price}
                  onChange={(e) => set({ price: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Unité de vente</Label>
                <input
                  value={f.unit}
                  onChange={(e) => set({ unit: e.target.value })}
                  placeholder="le pot · la pièce · les 500 g"
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Poids</Label>
                <input
                  value={f.weight}
                  onChange={(e) => set({ weight: e.target.value })}
                  placeholder="500 g"
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Nombre de pièces</Label>
                <input
                  type="number"
                  value={f.pieces}
                  onChange={(e) => set({ pieces: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Pastille</Label>
                <select
                  value={f.badge}
                  onChange={(e) => set({ badge: e.target.value })}
                  className={inputClass}
                >
                  {BADGES.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {/* ---------- Photo ---------- */}
          <section className="space-y-3">
            <h3 className="font-display text-base">Photo</h3>
            <div className="flex gap-4">
              <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-sable">
                {preview ? (
                  <img src={preview} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center font-display text-2xl text-charbon/30">
                    Ö
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <label className="block">
                  <Label>Photo livrée avec le site</Label>
                  <select
                    value={f.image_key}
                    onChange={(e) => set({ image_key: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {PRODUCT_ASSET_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <Label>…ou adresse d'une photo (prioritaire)</Label>
                  <input
                    value={f.image_url}
                    onChange={(e) => set({ image_url: e.target.value })}
                    placeholder="https://…"
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* ---------- Textes ---------- */}
          <section className="space-y-3">
            <h3 className="font-display text-base">Textes</h3>
            <label className="block">
              <Label>Description courte (vignette)</Label>
              <textarea
                rows={2}
                value={f.short_desc}
                onChange={(e) => set({ short_desc: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <Label>Description longue (fiche)</Label>
              <textarea
                rows={4}
                value={f.description}
                onChange={(e) => set({ description: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <Label>Conservation</Label>
              <input
                value={f.conservation}
                onChange={(e) => set({ conservation: e.target.value })}
                placeholder="10 jours en boîte hermétique."
                className={inputClass}
              />
            </label>
            <label className="block">
              <Label>Note d'information (encadré doré)</Label>
              <input
                value={f.disclaimer}
                onChange={(e) => set({ disclaimer: e.target.value })}
                className={inputClass}
              />
            </label>
          </section>

          {/* ---------- Listes ---------- */}
          <section className="space-y-3">
            <h3 className="font-display text-base">Listes — une ligne par élément</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label>
                <Label>Composition</Label>
                <textarea
                  rows={4}
                  value={f.composition}
                  onChange={(e) => set({ composition: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Ingrédients</Label>
                <textarea
                  rows={4}
                  value={f.ingredients}
                  onChange={(e) => set({ ingredients: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Parfums (texte indicatif)</Label>
                <textarea
                  rows={3}
                  value={f.flavors}
                  onChange={(e) => set({ flavors: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Variétés incluses</Label>
                <textarea
                  rows={3}
                  value={f.varieties}
                  onChange={(e) => set({ varieties: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Jours de disponibilité</Label>
                <textarea
                  rows={2}
                  value={f.availability}
                  onChange={(e) => set({ availability: e.target.value })}
                  placeholder={"mardi\njeudi\nsamedi"}
                  className={inputClass}
                />
              </label>
              <label>
                <Label>Occasions</Label>
                <textarea
                  rows={2}
                  value={f.occasions}
                  onChange={(e) => set({ occasions: e.target.value })}
                  placeholder={"aid\nramadan\nmariage"}
                  className={inputClass}
                />
              </label>
            </div>
          </section>

          {/* ---------- Allergènes ---------- */}
          <section className="space-y-3">
            <h3 className="font-display text-base">Allergènes</h3>
            <div className="flex flex-wrap gap-4">
              {Object.entries(allergenLabels).map(([k, label]) => (
                <label key={k} className="flex items-center gap-2 text-sm text-charbon/80">
                  <input
                    type="checkbox"
                    checked={f.allergens.includes(k)}
                    onChange={() => toggle("allergens", k)}
                    className="accent-[var(--gold)]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          {/* ---------- Collections ---------- */}
          <section className="space-y-3">
            <h3 className="font-display text-base">Collections</h3>
            <div className="flex flex-wrap gap-4">
              {COLLECTION_OPTIONS.map((c) => (
                <label key={c.value} className="flex items-center gap-2 text-sm text-charbon/80">
                  <input
                    type="checkbox"
                    checked={f.collections.includes(c.value)}
                    onChange={() => toggle("collections", c.value)}
                    className="accent-[var(--gold)]"
                  />
                  {c.label}
                </label>
              ))}
            </div>
            <p className="text-[11px] text-charbon/50">
              Un produit sans collection n'apparaît que sur la page complète du catalogue.
            </p>
          </section>

          {/* ---------- Vente ---------- */}
          <section className="space-y-3">
            <h3 className="font-display text-base">Vente & disponibilité</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["published", "Publié en boutique"],
                  ["in_stock", "En stock"],
                  ["draft", "Fiche en brouillon"],
                  ["seasonal_only", "Édition saisonnière (Ramadan / Aïd)"],
                  ["requires_cold", "Nécessite du froid"],
                  ["local_only", "Retrait ou livraison locale uniquement"],
                  ["hide_price", "Masquer le prix (sur devis)"],
                  ["no_cart", "Pas d'ajout au panier"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-charbon/80">
                  <input
                    type="checkbox"
                    checked={f[key]}
                    onChange={(e) => set({ [key]: e.target.checked } as Partial<Form>)}
                    className="accent-[var(--gold)]"
                  />
                  {label}
                </label>
              ))}
            </div>
            <label className="block">
              <Label>Mode de livraison</Label>
              <input
                value={f.delivery_mode}
                onChange={(e) => set({ delivery_mode: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block">
              <Label>Parfums vendables (JSON : id, label, price, image)</Label>
              <textarea
                rows={4}
                value={f.variants}
                onChange={(e) => set({ variants: e.target.value })}
                placeholder='[{"id":"pistache","label":"Pistache","price":24}]'
                className={`${inputClass} font-mono text-xs`}
              />
            </label>
          </section>
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
            {saving ? "Enregistrement…" : isNew ? "Créer le produit" : "Enregistrer"}
          </button>
        </footer>
      </div>
    </div>
  );
}
