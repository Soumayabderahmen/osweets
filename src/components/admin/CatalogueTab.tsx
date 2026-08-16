import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Archive, Copy, Pencil, Plus, RotateCcw } from "lucide-react";
import { duplicateProduct, setProductFlags } from "@/api/catalog";
import type { ProductRow } from "@/lib/catalog";
import { resolveProductImage } from "@/lib/product-assets";
import { formatPrice } from "@/lib/shop-store";
import { COLLECTION_OPTIONS, PATISSERIE_CATEGORIES, ProductEditor } from "./ProductEditor";

type StateFilter = "tous" | "publies" | "depublies" | "epuises" | "brouillons" | "archives";

const STATES: { key: StateFilter; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "publies", label: "Publiés" },
  { key: "depublies", label: "Dépubliés" },
  { key: "epuises", label: "Épuisés" },
  { key: "brouillons", label: "Brouillons" },
  { key: "archives", label: "Archivés" },
];

const PATISSERIE = new Set(PATISSERIE_CATEGORIES.map((c) => c.value));

/** Pastille d'état affichée à côté du nom. */
function StateBadges({ p }: { p: ProductRow }) {
  const chips: { label: string; className: string }[] = [];
  if (p.archived) chips.push({ label: "Archivé", className: "bg-charbon/10 text-charbon/70" });
  if (!p.published) chips.push({ label: "Dépublié", className: "bg-charbon/10 text-charbon/70" });
  if (!p.in_stock) chips.push({ label: "Épuisé", className: "bg-charbon/85 text-ivory" });
  if (p.draft) chips.push({ label: "Brouillon", className: "border border-gold/50 text-gold" });
  if (p.seasonal_only) chips.push({ label: "Saisonnier", className: "bg-gold/15 text-gold" });
  return (
    <>
      {chips.map((c) => (
        <span
          key={c.label}
          className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] ${c.className}`}
        >
          {c.label}
        </span>
      ))}
    </>
  );
}

export function CatalogueTab({
  rows,
  onReload,
  initialCollection,
  query,
}: {
  rows: ProductRow[];
  onReload: () => void;
  /** Collection pré-sélectionnée quand on arrive depuis la vue Collections. */
  initialCollection?: string;
  /** Recherche saisie dans la barre supérieure. */
  query: string;
}) {
  const q = query;
  const [state, setState] = useState<StateFilter>("tous");
  const [collection, setCollection] = useState(initialCollection ?? "");

  useEffect(() => {
    setCollection(initialCollection ?? "");
  }, [initialCollection]);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  /** Périmètre strict : uniquement l'univers Pâtisserie Tunisienne. */
  const scope = useMemo(() => rows.filter((r) => PATISSERIE.has(r.category)), [rows]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return scope.filter((p) => {
      if (needle && !`${p.name} ${p.slug}`.toLowerCase().includes(needle)) return false;
      if (collection && !(p.collections ?? []).includes(collection)) return false;
      switch (state) {
        case "publies":
          return p.published && !p.archived;
        case "depublies":
          return !p.published && !p.archived;
        case "epuises":
          return !p.in_stock && !p.archived;
        case "brouillons":
          return p.draft && !p.archived;
        case "archives":
          return p.archived;
        default:
          return !p.archived;
      }
    });
  }, [scope, q, state, collection]);

  /** Bascule un booléen directement depuis la liste. */
  const quickToggle = async (p: ProductRow, field: "published" | "in_stock") => {
    const patch = field === "published" ? { published: !p.published } : { in_stock: !p.in_stock };
    setBusy(p.id);
    try {
      await setProductFlags({ data: { id: p.id, ...patch } });
    } catch (e) {
      setBusy(null);
      return toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
    setBusy(null);
    toast.success(
      field === "published"
        ? p.published
          ? `« ${p.name} » retiré de la boutique.`
          : `« ${p.name} » publié.`
        : p.in_stock
          ? `« ${p.name} » marqué épuisé.`
          : `« ${p.name} » de nouveau en stock.`,
    );
    onReload();
  };

  /** Archive ou réactive — un produit n'est jamais supprimé. */
  const setArchived = async (p: ProductRow, archived: boolean) => {
    setBusy(p.id);
    try {
      await setProductFlags({ data: { id: p.id, archived } });
    } catch (e) {
      setBusy(null);
      return toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
    setBusy(null);
    setConfirmArchive(null);
    toast.success(archived ? `« ${p.name} » archivé.` : `« ${p.name} » restauré.`);
    onReload();
  };

  /** Duplique une fiche — pratique pour décliner un nouveau parfum. */
  const duplicate = async (p: ProductRow) => {
    setBusy(p.id);
    try {
      const copy = await duplicateProduct({ data: { id: p.id } });
      toast.success(`Copie créée : « ${copy.name} ».`);
    } catch (e) {
      return toast.error(e instanceof Error ? e.message : "Duplication impossible.");
    } finally {
      setBusy(null);
    }
    onReload();
  };

  return (
    <div>
      {/* ---- Barre d'outils ---- */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="rounded-lg border-0 bg-white px-3 py-2.5 text-sm text-charbon shadow-soft outline-none focus:ring-1 focus:ring-gold"
        >
          <option value="">Toutes les collections</option>
          {COLLECTION_OPTIONS.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setCreating(true)}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-gradient-to-tl from-charbon to-[#4a3f3a] px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory shadow-soft transition hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Nouveau produit
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {STATES.map((s) => (
          <button
            key={s.key}
            onClick={() => setState(s.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs transition ${
              state === s.key
                ? "icon-gradient-gold text-white shadow-soft"
                : "bg-white text-charbon/60 shadow-soft hover:text-gold"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* ---- Liste ---- */}
      <div className="card-soft mt-5 divide-y divide-beige/60 overflow-hidden">
        {visible.map((p) => {
          const img = resolveProductImage(p.image_url, p.image_key);
          return (
            <div key={p.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sable">
                {img ? (
                  <img src={img} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center font-display text-charbon/30">
                    Ö
                  </div>
                )}
              </div>

              <div className="min-w-[180px] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base">{p.name}</span>
                  <StateBadges p={p} />
                </div>
                <div className="mt-0.5 text-[11px] text-charbon/50">
                  {p.slug}
                  {(p.collections ?? []).length > 0 && ` · ${p.collections.join(", ")}`}
                </div>
              </div>

              <div className="w-24 text-right font-price text-sm text-charbon">
                {Number(p.price) > 0 ? formatPrice(Number(p.price)) : "—"}
              </div>

              <div className="flex items-center gap-4 text-xs text-charbon/70">
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={p.published}
                    disabled={busy === p.id || p.archived}
                    onChange={() => quickToggle(p, "published")}
                    className="accent-[var(--gold)]"
                  />
                  Publié
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={p.in_stock}
                    disabled={busy === p.id || p.archived}
                    onChange={() => quickToggle(p, "in_stock")}
                    className="accent-[var(--gold)]"
                  />
                  En stock
                </label>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditing(p)}
                  title="Modifier"
                  className="grid h-9 w-9 place-items-center text-charbon/60 hover:text-gold"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => duplicate(p)}
                  disabled={busy === p.id}
                  title="Dupliquer"
                  className="grid h-9 w-9 place-items-center text-charbon/60 hover:text-gold"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {p.archived ? (
                  <button
                    onClick={() => setArchived(p, false)}
                    disabled={busy === p.id}
                    title="Restaurer"
                    className="grid h-9 w-9 place-items-center text-charbon/60 hover:text-gold"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                ) : confirmArchive === p.id ? (
                  <button
                    onClick={() => setArchived(p, true)}
                    disabled={busy === p.id}
                    className="rounded-full bg-charbon px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-ivory"
                  >
                    Confirmer
                  </button>
                ) : (
                  <button
                    onClick={() => setConfirmArchive(p.id)}
                    title="Archiver"
                    className="grid h-9 w-9 place-items-center text-charbon/60 hover:text-charbon"
                  >
                    <Archive className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {visible.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-charbon/60">
            Aucun produit ne correspond à cette recherche.
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-charbon/50">
        Un produit ne se supprime jamais : il se dépublie (invisible en boutique) ou s'archive
        (retiré du backoffice, mais conservé en base). La suppression n'est autorisée par la base
        pour personne.
      </p>

      {(editing || creating) && (
        <ProductEditor
          row={editing}
          takenSlugs={rows.map((r) => r.slug)}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            onReload();
          }}
        />
      )}
    </div>
  );
}
