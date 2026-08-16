import { useMemo } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import { FAMILY_LABELS } from "@/data/products";
import type { ProductRow } from "@/lib/catalog";
import { resolveProductImage } from "@/lib/product-assets";
import { formatPrice } from "@/lib/shop-store";

/**
 * Familles de parfums — Samsa, Kounefa, Assida.
 *
 * C'est ce regroupement qui alimente la rangée « Autres parfums » sur la
 * fiche produit et dans l'aperçu rapide. Un parfum sans libellé y apparaît
 * sous son nom complet : la vue le signale.
 */
export function FamillesTab({
  rows,
  onEdit,
}: {
  rows: ProductRow[];
  onEdit: (productKey: string) => void;
}) {
  const live = useMemo(() => rows.filter((p) => !p.archived), [rows]);

  const families = useMemo(
    () =>
      Object.entries(FAMILY_LABELS).map(([key, label]) => ({
        key,
        label,
        members: live.filter((p) => p.family === key).sort((a, b) => a.sort_order - b.sort_order),
      })),
    [live],
  );

  const orphans = useMemo(() => live.filter((p) => p.family && !p.flavor_label), [live]);

  return (
    <div className="space-y-5">
      <div className="card-soft p-5 text-sm leading-relaxed text-charbon/70">
        Une famille regroupe les parfums d'une même recette. Sur la fiche d'une Kounefa, les autres
        parfums de la famille s'affichent en pastilles rondes — c'est ce qui fait passer la cliente
        d'un parfum à l'autre. Le <strong>nom du parfum</strong> est ce qui s'écrit sous la
        pastille.
      </div>

      {orphans.length > 0 && (
        <div className="card-soft flex gap-3 border-l-4 border-gold p-4 text-sm text-charbon/80">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
          <div>
            <strong>{orphans.length} produit(s)</strong> appartiennent à une famille sans avoir de
            nom de parfum : {orphans.map((p) => p.name).join(", ")}. Leur nom complet s'affiche
            alors sous la pastille, ce qui alourdit la rangée.
          </div>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {families.map((f) => (
          <div key={f.key} className="card-soft flex flex-col p-5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-lg">{f.label}</h3>
              <span className="font-price text-2xl font-bold text-charbon">{f.members.length}</span>
            </div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-charbon/40">
              parfums
            </div>

            <div className="mt-4 flex-1 space-y-2">
              {f.members.map((p) => {
                const img = resolveProductImage(p.image_url, p.image_key);
                const draft = p.draft || Number(p.price) <= 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => onEdit(p.slug)}
                    className="group flex w-full items-center gap-3 rounded-xl bg-sable/60 p-2 text-left transition hover:bg-sable"
                  >
                    <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-sable">
                      {img ? (
                        <img src={img} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full w-full place-items-center font-display text-charbon/30">
                          Ö
                        </span>
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-charbon">
                        {p.flavor_label || <span className="italic text-charbon/50">{p.name}</span>}
                      </span>
                      <span className="block text-[11px] text-charbon/45">
                        {draft ? "prix à définir" : formatPrice(Number(p.price))}
                        {!p.in_stock && " · épuisé"}
                        {!p.published && " · dépublié"}
                      </span>
                    </span>
                    <Pencil className="h-3.5 w-3.5 shrink-0 text-charbon/25 transition group-hover:text-gold" />
                  </button>
                );
              })}
              {f.members.length === 0 && (
                <p className="rounded-xl bg-sable px-3 py-3 text-xs text-charbon/55">
                  Aucun produit dans cette famille.
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
