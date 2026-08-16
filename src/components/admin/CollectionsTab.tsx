import { useState } from "react";
import { ArrowUpRight, EyeOff, Pencil } from "lucide-react";
import type { CollectionRow } from "@/api/collections";
import type { ProductRow } from "@/lib/catalog";
import { resolveProductImage } from "@/lib/product-assets";
import { CollectionEditor } from "./CollectionEditor";

/**
 * Les six collections de l'univers Pâtisserie Tunisienne.
 * Chacune a sa page sur la boutique ; on pilote ici son contenu,
 * ses textes, son visuel, son ordre et sa visibilité.
 */
export function CollectionsTab({
  collections,
  rows,
  onOpenCollection,
  onReload,
}: {
  collections: CollectionRow[];
  rows: ProductRow[];
  onOpenCollection: (productKey: string) => void;
  onReload: () => void;
}) {
  const [editing, setEditing] = useState<CollectionRow | null>(null);
  const live = rows.filter((p) => !p.archived);

  if (!collections.length) {
    return (
      <div className="card-soft p-8 text-center text-sm text-charbon/60">
        Aucune collection en base. Applique la migration{" "}
        <code className="text-xs">003_collections.sql</code> avec{" "}
        <code className="text-xs">npm run db:migrate</code>.
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {collections.map((c) => {
          const items = live.filter((p) => (p.collections ?? []).includes(c.product_key));
          const published = items.filter((p) => p.published);
          const out = items.filter((p) => !p.in_stock);
          const drafts = items.filter((p) => p.draft || Number(p.price) <= 0);
          const cover = resolveProductImage(c.image_url, c.image_key);
          const photos = items.slice(0, 4);

          return (
            <div key={c.id} className="card-soft flex flex-col overflow-hidden">
              <div className="relative h-28 bg-sable">
                {cover ? (
                  <img src={cover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center font-display text-3xl text-charbon/20">
                    Ö
                  </div>
                )}
                {!c.published && (
                  <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-charbon/85 px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-ivory">
                    <EyeOff className="h-3 w-3" /> Masquée
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg leading-tight">{c.label}</h3>
                    <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-charbon/40">
                      /patisserie/{c.slug}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-price text-2xl font-bold text-charbon">{items.length}</div>
                    <div className="text-[10px] uppercase tracking-[0.14em] text-charbon/40">
                      produits
                    </div>
                  </div>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-charbon/55">
                  {c.subtitle || c.description}
                </p>

                <div className="mt-4 flex gap-2">
                  {photos.map((p) => {
                    const img = resolveProductImage(p.image_url, p.image_key);
                    return (
                      <div
                        key={p.id}
                        className="h-10 w-10 overflow-hidden rounded-lg bg-sable"
                        title={p.name}
                      >
                        {img ? (
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="grid h-full w-full place-items-center font-display text-charbon/30">
                            Ö
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="rounded-lg bg-sable px-3 py-2 text-[11px] text-charbon/55">
                      Vide — affichée comme « bientôt disponible ».
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-charbon/55">
                  <span>{published.length} en boutique</span>
                  {out.length > 0 && <span className="text-charbon">{out.length} épuisé(s)</span>}
                  {drafts.length > 0 && (
                    <span className="text-gold">{drafts.length} brouillon(s)</span>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-2 pt-1">
                  <button
                    onClick={() => setEditing(c)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-tl from-charbon to-[#4a3f3a] px-3.5 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory shadow-soft transition hover:opacity-90"
                  >
                    <Pencil className="h-3 w-3" /> Modifier
                  </button>
                  <button
                    onClick={() => onOpenCollection(c.product_key)}
                    className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold hover:underline"
                  >
                    Ses produits <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <CollectionEditor
          row={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            onReload();
          }}
        />
      )}
    </>
  );
}
