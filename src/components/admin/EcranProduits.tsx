import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { addStock, duplicateProduct, setProductFlags } from "@/api/catalog";
import type { ProductRow } from "@/lib/catalog";
import type { CollectionRow } from "@/api/collections";
import { kgOptionPrice } from "@/lib/variant-label";
import { kgMainGrams } from "@/lib/product-rules";
import { formatGrams } from "@/lib/weight";
import { filterPatisserieRows } from "@/lib/patisserie-scope";
import { adminImage, agir, bas, BADGES, dispo, enBoutique, euro, type Contexte } from "./core";

type Filtre = "tous" | "epuises" | "archives";

/** Étiquette d'état — un produit est en boutique, ou archivé. Rien entre les deux. */
function etatTag(r: ProductRow) {
  if (r.draft) return <span className="tag hide">Brouillon</span>;
  if (!r.published && !r.archived) return <span className="tag hide">Dépublié</span>;
  return r.archived ? (
    <span className="tag arch">Archivé</span>
  ) : (
    <span className="tag pub">Publié</span>
  );
}

/**
 * Les produits, rangés par collection — comme en boutique.
 *
 * Un produit qui appartient à deux collections apparaît sous chacune : c'est
 * la vérité du catalogue, autant la montrer plutôt que de choisir pour vous.
 */
export function EcranProduits({ ctx }: { ctx: Contexte }) {
  const [filtre, setFiltre] = useState<Filtre>("tous");
  const { collections, familles, recherche, recharger, ouvrir } = ctx;
  const produits = useMemo(() => filterPatisserieRows(ctx.produits), [ctx.produits]);
  const inFlight = useRef(new Set<string>());
  const [busyStock, setBusyStock] = useState<string[]>([]);
  const changeStock = async (row: ProductRow, delta: number) => {
    if (inFlight.current.has(row.id)) return;
    inFlight.current.add(row.id);
    setBusyStock([...inFlight.current]);
    try {
      const saved = await addStock({ data: { id: row.id, delta } });
      toast.success(`« ${saved.name} » : ${saved.stock_qty} en réserve.`);
      await recharger();
    } catch {
      toast.error("Modification du stock impossible. Réessayez.");
    } finally {
      inFlight.current.delete(row.id);
      setBusyStock([...inFlight.current]);
    }
  };

  const compteurs = {
    tous: enBoutique(produits).length,
    epuises: enBoutique(produits).filter((r) => !dispo(r)).length,
    archives: produits.filter((r) => r.archived).length,
  };

  const lignes = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    return produits
      .filter((r) => {
        if (filtre === "archives") return r.archived;
        if (filtre === "epuises") return !r.archived && !dispo(r);
        return !r.archived;
      })
      .filter((r) =>
        q
          ? `${r.name} ${r.slug} ${r.family ?? ""} ${r.flavor_label ?? ""}`
              .toLowerCase()
              .includes(q)
          : true,
      );
  }, [produits, filtre, recherche]);

  const groupes = useMemo(() => {
    const g = collections
      .map((c) => ({
        cle: c.product_key,
        label: c.label,
        col: c as CollectionRow | null,
        items: lignes.filter((r) => (r.collections ?? []).includes(c.product_key)),
      }))
      .filter((x) => x.items.length > 0);
    const orphelins = lignes.filter(
      (r) => !collections.some((c) => (r.collections ?? []).includes(c.product_key)),
    );
    if (orphelins.length)
      g.push({ cle: "__sans", label: "Sans collection", col: null, items: orphelins });
    return g;
  }, [lignes, collections]);

  const familleLabel = (key: string | null) =>
    key ? (familles.find((f) => f.key === key)?.label ?? key) : null;

  return (
    <>
      <div className="chips">
        {(
          [
            ["tous", "En boutique", compteurs.tous],
            ["epuises", "Épuisés", compteurs.epuises],
            ["archives", "Archivés", compteurs.archives],
          ] as [Filtre, string, number][]
        ).map(([k, l, n]) => (
          <button
            key={k}
            type="button"
            className={`chip${filtre === k ? " on" : ""}`}
            onClick={() => setFiltre(k)}
          >
            {l}
            <span className="c">{n}</span>
          </button>
        ))}
      </div>

      {groupes.length === 0 && <div className="empty">Aucun produit ne correspond.</div>}

      {groupes.map((g) => (
        <div key={g.cle}>
          <div className="grouphead">
            <h3>{g.label}</h3>
            <span className="n">
              {g.items.length} produit{g.items.length > 1 ? "s" : ""}
            </span>
            {g.col ? (
              <button
                type="button"
                className="lien"
                onClick={() => ouvrir({ type: "collection-products", row: g.col! })}
              >
                Voir la collection
              </button>
            ) : (
              <span className="n" style={{ marginLeft: "auto" }}>
                n'apparaissent que sur la page complète
              </span>
            )}
          </div>

          <div className="list">
            {g.items.map((r) => {
              const meta = [
                r.family
                  ? [familleLabel(r.family), r.product_type, r.flavor_label]
                      .filter(Boolean)
                      .join(" · ")
                  : null,
                (r.collections ?? []).length
                  ? (r.collections ?? []).join(", ")
                  : "aucune collection",
              ]
                .filter(Boolean)
                .join(" — ");
              const qty = r.stock_qty ?? 0;
              const zero = !r.stock_unlimited && qty === 0;
              const faible = bas(r);
              const image = adminImage(r);
              const optionPrice =
                r.sell_mode !== "kg" && Array.isArray(r.sell_options) ? r.sell_options[0] : null;
              // Même grammage de référence que la boutique (1 kg, sinon
              // 500 g, sinon 100 g, sinon le plus élevé vendu) : la liste
              // admin et la carte produit annoncent le même prix.
              const kgFirstGram =
                r.sell_mode === "kg" && Array.isArray(r.sell_options) && r.sell_options.length
                  ? kgMainGrams(
                      r.sell_options
                        .map((o) => o.grams ?? 0)
                        .filter((g): g is number => typeof g === "number" && g > 0),
                    )
                  : null;
              const kgPrice =
                kgFirstGram && Number.isFinite(kgFirstGram) && Number(r.price) > 0
                  ? kgOptionPrice(Number(r.price), kgFirstGram)
                  : null;

              return (
                <div className="row" key={`${g.cle}-${r.id}`}>
                  {image ? <img src={image} alt="" /> : <div className="ph">Ö</div>}

                  <div className="id">
                    <div className="n">
                      {r.name}
                      {r.badge && <span className="bchip">{BADGES[r.badge] ?? r.badge}</span>}
                      {etatTag(r)}
                    </div>
                    <div className="m">{meta}</div>
                  </div>

                  <div className="price">
                    {optionPrice
                      ? euro(optionPrice.price ?? 0)
                      : kgPrice != null
                        ? euro(kgPrice)
                        : r.price
                          ? euro(Number(r.price))
                          : "—"}
                    <small>
                      {optionPrice
                        ? optionPrice.label
                        : kgPrice != null
                          ? formatGrams(kgFirstGram!)
                          : r.sell_mode
                            ? "configuration requise"
                            : r.price
                              ? (r.unit ?? "")
                              : "prix à définir"}
                    </small>
                  </div>

                  {r.archived ? (
                    <>
                      <div className="switches">
                        <button
                          type="button"
                          className="btn-dark"
                          onClick={() =>
                            void agir(
                              () => setProductFlags({ data: { id: r.id, archived: false } }),
                              `« ${r.name} » est de retour en boutique.`,
                              recharger,
                            )
                          }
                        >
                          ↩ Remettre en boutique
                        </button>
                        <button
                          type="button"
                          className="btn-ghost danger"
                          onClick={() => ouvrir({ type: "supprimer", row: r })}
                        >
                          Supprimer définitivement
                        </button>
                      </div>
                      <div className="act">
                        <button
                          type="button"
                          className="icobtn"
                          title="Voir la fiche"
                          onClick={() => ouvrir({ type: "produit", row: r })}
                        >
                          ✎
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="switches">
                        {r.stock_unlimited ? (
                          <span className="pill">Sur commande</span>
                        ) : (
                          <>
                            <div className={`stepper ${zero ? "zero" : faible ? "low" : ""}`}>
                              <button
                                type="button"
                                title="Retirer 1"
                                disabled={qty <= 0 || busyStock.includes(r.id)}
                                onClick={() => void changeStock(r, -1)}
                              >
                                −
                              </button>
                              <b>{qty}</b>
                              <button
                                type="button"
                                title="Ajouter 1"
                                disabled={busyStock.includes(r.id)}
                                onClick={() => void changeStock(r, 1)}
                              >
                                +
                              </button>
                            </div>
                            <span className={`stocklbl ${zero ? "zero" : faible ? "low" : ""}`}>
                              {zero ? "Épuisé" : faible ? "bientôt fini" : "en réserve"}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="act">
                        <button
                          type="button"
                          className="icobtn"
                          title="Modifier"
                          onClick={() => ouvrir({ type: "produit", row: r })}
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="icobtn"
                          title="Dupliquer"
                          onClick={() =>
                            void agir(
                              () => duplicateProduct({ data: { id: r.id } }),
                              "Une copie a été créée, archivée, prête à être remplie.",
                              recharger,
                            )
                          }
                        >
                          ⧉
                        </button>
                        <button
                          type="button"
                          className="icobtn"
                          title="Archiver"
                          onClick={() => {
                            if (
                              !window.confirm(
                                `Archiver « ${r.name} » ? Les paniers existants qui le contiennent seront immédiatement bloqués.`,
                              )
                            )
                              return;
                            void agir(
                              () => setProductFlags({ data: { id: r.id, archived: true } }),
                              `« ${r.name} » archivé — vous pouvez le remettre en boutique à tout moment.`,
                              recharger,
                            );
                          }}
                        >
                          🗀
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="count">
        {lignes.length} produit{lignes.length > 1 ? "s" : ""} affiché
        {lignes.length > 1 ? "s" : ""}
      </div>
    </>
  );
}
