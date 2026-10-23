import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { addStock, deleteProductForever, saveProduct, setProductFlags } from "@/api/catalog";
import {
  addProductsToCollection,
  createCollection,
  deleteCollection,
  removeProductsFromCollection,
  saveCollection,
  type CollectionRow,
} from "@/api/collections";
import { saveFamily, type FamilyRow } from "@/api/families";
import {
  addProductImage,
  deleteProductImage,
  listProductImages,
  reorderProductImages,
  setPrimaryImage,
  uploadProductImage,
  type ProductImageRow,
} from "@/api/images";
import { rowToProduct, type ProductRow } from "@/lib/catalog";
import {
  collectionCounts,
  collectionState,
  nextCollectionOrder,
} from "@/lib/collection-presentation";
import { toWindows, type SeasonWindow } from "@/lib/season";
import { kgMainGrams, productBlockReason } from "@/lib/product-rules";
import { KG_GRAM_CHOICES, auditPackaging, kgOptionPrice } from "@/lib/variant-label";
import { formatGrams } from "@/lib/weight";
import { compositionGramsTotal, scaleGramComposition } from "@/lib/composition";
import type { Allergen, ProductVariant, SellMode } from "@/data/products";
import { isStrictlyPositivePrice, parseFrenchNumber, parseFrenchPrice } from "@/lib/admin-values";
import {
  adminImage,
  agir,
  BADGES,
  euro,
  slugify,
  type Contexte,
  type PanneauDemande,
} from "./core";
import { ChoixParfum } from "./ChoixParfum";

const ALLERGEN_OPTIONS: { value: Allergen; label: string }[] = [
  { value: "gluten", label: "Gluten" },
  { value: "lait", label: "Lait" },
  { value: "oeuf", label: "Œuf" },
  { value: "fruits-coque", label: "Fruits à coque" },
  { value: "sesame", label: "Sésame" },
  { value: "soja", label: "Soja" },
];

/* ============================ COQUILLE DU PANNEAU ============================ */

function Coquille({
  kind,
  nom,
  onClose,
  onSave,
  children,
  saveLabel = "Enregistrer",
  busy,
}: {
  kind: string;
  nom: string;
  onClose: () => void;
  onSave?: () => void;
  children: ReactNode;
  saveLabel?: string;
  busy?: boolean;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <>
      <div className="scrim on" onClick={onClose} />
      <aside className="panel on">
        <div className="phead">
          <div>
            <div className="k">{kind}</div>
            <h2>{nom}</h2>
          </div>
          <button type="button" className="icobtn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>
        <div className="pbody">{children}</div>
        <div className="pfoot">
          <button type="button" className="btn-ghost" onClick={onClose}>
            {onSave ? "Annuler" : "Fermer"}
          </button>
          {onSave && (
            <button type="button" className="btn-dark" onClick={onSave} disabled={busy}>
              {busy ? "Enregistrement…" : saveLabel}
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

/** Aiguillage : une demande de panneau, un composant. */
export function Panneau({
  demande,
  ctx,
  onClose,
}: {
  demande: PanneauDemande;
  ctx: Contexte;
  onClose: () => void;
}) {
  if (demande.type === "produit")
    return (
      <PanelProduit
        row={demande.row}
        ctx={ctx}
        onClose={onClose}
        famille={demande.famille}
        collection={demande.collection}
      />
    );
  if (demande.type === "collection")
    return <PanelCollection row={demande.row} ctx={ctx} onClose={onClose} />;
  if (demande.type === "collection-products")
    return <PanelCollectionProducts col={demande.row} ctx={ctx} onClose={onClose} mode="members" />;
  if (demande.type === "collection-add-products")
    return <PanelCollectionProducts col={demande.row} ctx={ctx} onClose={onClose} mode="add" />;
  if (demande.type === "famille")
    return <PanelFamille row={demande.row} ctx={ctx} onClose={onClose} />;
  if (demande.type === "ajout-parfum")
    return <PanelAjoutParfum famille={demande.row} ctx={ctx} onClose={onClose} />;
  if (demande.type === "supprimer")
    return <PanelSupprimer row={demande.row} ctx={ctx} onClose={onClose} />;
  return null;
}

/* ================================= PRODUIT ================================= */

function optionId(_label: string, _existing: ProductVariant[]): string {
  return `format-${crypto.randomUUID()}`;
}

export function PanelProduit({
  row,
  ctx,
  onClose,
  famille,
  collection,
}: {
  row: ProductRow | null;
  ctx: Contexte;
  onClose: () => void;
  /** Famille pré-choisie — on arrive depuis « + Parfum » sur une famille. */
  famille?: string;
  /** Collection pré-cochée — on arrive depuis une collection. */
  collection?: string;
}) {
  const { collections, familles, recharger, reglages } = ctx;
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState(() => ({
    name: row?.name ?? "",
    slug: row?.slug ?? "",
    category: row?.category ?? "traditionnelle",
    sort_order: row?.sort_order ?? 0,
    disclaimer: row?.disclaimer ?? "",
    price: Number(row?.price ?? 0),
    unit: row?.unit ?? "",
    weight: row?.weight ?? "",
    badge: row?.badge ?? "",
    short_desc: row?.short_desc ?? "",
    description: row?.description ?? "",
    conservation: row?.conservation ?? "",
    delivery_mode: row?.delivery_mode ?? "",
    availability: (row?.availability ?? []).join("\n"),
    composition: (row?.composition ?? []).join("\n"),
    ingredients: (row?.ingredients ?? []).join("\n"),
    allergens: row?.allergens ?? [],
    pieces: row?.pieces ?? null,
    serves: row?.serves ?? null,
    price_per_piece: row?.price_per_piece === null ? "" : String(row?.price_per_piece ?? ""),
    min_quantity: row?.min_quantity ?? "",
    family: row?.family ?? famille ?? "",
    product_type: row?.product_type ?? "",
    flavor_label: row?.flavor_label ?? "",
    assortment_composition: row?.assortment_composition ?? [],
    collections: row?.collections ?? (collection ? [collection] : []),
    recommended: row?.recommended ?? [],
    sell_mode: (row?.sell_mode ?? "") as SellMode,
    sell_options: (row?.sell_options ?? []) as ProductVariant[],
    stock_qty: row?.stock_qty ?? 0,
    stock_alert: row?.stock_alert ?? 3,
    stock_unlimited: row?.stock_unlimited ?? true,
    ship_pickup: row?.ship_pickup ?? true,
    ship_local: row?.ship_local ?? true,
    ship_national: row?.ship_national ?? true,
    prep_lead: row?.prep_lead ?? "",
    seasonal_only: row?.seasonal_only ?? false,
    local_only: row?.local_only ?? false,
    no_cart: row?.no_cart ?? false,
    hide_price: row?.hide_price ?? false,
    requires_cold: row?.requires_cold ?? false,
    customizable: row?.customizable ?? null,
    seo_title: row?.seo_title ?? "",
    seo_description: row?.seo_description ?? "",
    draft: row?.draft ?? false,
    archived: row?.archived ?? false,
  }));
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((p) => ({ ...p, [k]: v }));

  const enregistrer = async () => {
    const name = d.name.trim();
    if (!name) return toast.error("Le nom du produit est obligatoire.");
    const slug = slugify(d.slug.trim() || name);
    if (!slug) return toast.error("Adresse de la fiche invalide.");
    /*
     * Publié + configuration commerciale incomplète (prix/kg manquant,
     * aucun format/pot valide) est un état LÉGITIME et ENREGISTRABLE : la
     * fiche reste visible avec le statut « Tarif à venir », seul l'ajout
     * au panier est bloqué (voir `productBlockReason`, raison "no_price").
     * On ne force donc plus `draft` pour pouvoir sauvegarder — `draft`
     * reste un vrai choix éditorial, jamais une condition technique.
     *
     * Les vérifications ci-dessous ne portent que sur la VALIDITÉ des
     * données déjà saisies (un grammage à 0, un prix de format négatif…),
     * jamais sur le fait que le produit soit déjà vendable dans son
     * ensemble.
     */
    if (d.sell_mode === "kg") {
      const invalidGram = d.sell_options.find((o) => !o.grams || o.grams <= 0);
      if (invalidGram) return toast.error("Un grammage coché est invalide.");
    } else {
      // Une fois un format/pot ajouté à la liste, il doit être complet —
      // seule une liste VIDE représente l'état "configuration en attente".
      const invalidOption = d.sell_options.find(
        (o) => !o.label.trim() || !isStrictlyPositivePrice(o.price),
      );
      if (invalidOption) {
        return toast.error(
          d.sell_mode === "pot"
            ? "Chaque pot doit avoir un nom et un prix supérieur à 0 € — ou retirez-le en attendant."
            : "Chaque format doit avoir un nom et un prix supérieur à 0 € — ou retirez-le en attendant.",
        );
      }
      if (d.sell_mode === "pot" && d.sell_options.some((o) => !o.weightG || o.weightG <= 0)) {
        return toast.error(
          "Chaque pot doit avoir un poids/une contenance — ou retirez-le en attendant.",
        );
      }
      if (
        d.sell_mode === "format" &&
        d.sell_options.some(
          (o) => o.servesMin != null && o.servesMax != null && o.servesMin > o.servesMax,
        )
      ) {
        return toast.error("Le nombre de personnes minimum dépasse le maximum sur un format.");
      }
    }
    const ids = d.sell_options.map((o) => o.id.trim()).filter(Boolean);
    if (new Set(ids).size !== ids.length || ids.length !== d.sell_options.length) {
      return toast.error("Chaque format doit avoir un identifiant unique.");
    }
    const seasonKeys = new Set(ctx.saisons.map((s) => s.season_key));
    if (d.seasonal_only && !d.collections.some((key) => seasonKeys.has(key))) {
      return toast.error("Associez ce produit saisonnier à une collection liée à une saison.");
    }
    setBusy(true);
    try {
      await saveProduct({
        data: {
          id: row?.id,
          values: {
            name,
            slug,
            category: d.category,
            sort_order: d.sort_order,
            disclaimer: d.disclaimer || null,
            price: d.price,
            unit: d.unit || null,
            weight: d.weight || null,
            badge: d.badge || null,
            short_desc: d.short_desc,
            description: d.description,
            conservation: d.conservation,
            delivery_mode: d.delivery_mode || null,
            availability: d.availability
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean),
            composition: d.composition
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean),
            ingredients: d.ingredients
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean),
            allergens: d.allergens,
            pieces: d.pieces,
            serves: d.serves,
            price_per_piece: parseFrenchPrice(d.price_per_piece) ?? null,
            min_quantity: d.min_quantity || null,
            family: d.family || null,
            product_type: d.product_type || null,
            flavor_label: d.flavor_label || null,
            assortment_composition: d.assortment_composition,
            collections: d.collections,
            recommended: d.recommended,
            sell_mode: d.sell_mode,
            sell_options: d.sell_options,
            // `variants` (legacy) n'est plus réécrit : sell_options fait
            // seule autorité désormais. L'ancienne colonne garde sa
            // dernière valeur connue, lue en repli si sell_options est vide.
            stock_qty: d.stock_qty,
            stock_alert: d.stock_alert,
            stock_unlimited: d.stock_unlimited,
            ship_pickup: d.ship_pickup,
            ship_local: d.ship_local,
            ship_national: d.ship_national,
            prep_lead: d.prep_lead || null,
            seasonal_only: d.seasonal_only,
            local_only: d.local_only,
            no_cart: d.no_cart,
            hide_price: d.hide_price,
            requires_cold: d.requires_cold,
            customizable: d.customizable,
            seo_title: d.seo_title || null,
            seo_description: d.seo_description || null,
            published: !d.archived && !d.draft,
            archived: d.archived,
            draft: d.draft,
          },
        },
      });
      await recharger();
      toast.success(row ? "Fiche enregistrée." : `« ${name} » a été créé.`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
    setBusy(false);
  };

  /* -------- options de vente : format / pot (liste générique) -------- */
  const majOption = (i: number, patch: Partial<ProductVariant>) =>
    set(
      "sell_options",
      d.sell_options.map((o, k) => (k === i ? { ...o, ...patch } : o)),
    );
  const ajouter = (label = "", price = 0) =>
    set("sell_options", [...d.sell_options, { id: optionId(label, d.sell_options), label, price }]);
  const retirer = (i: number) =>
    set(
      "sell_options",
      d.sell_options.filter((_, k) => k !== i),
    );

  /* -------- options de vente : kg (grammages cochés) -------- */
  const basculerGramme = (grams: number) => {
    const at = d.sell_options.findIndex((o) => o.grams === grams);
    if (at >= 0) return retirer(at);
    set("sell_options", [
      ...d.sell_options,
      { id: `g-${grams}`, label: formatGrams(grams), grams, piecesEstimate: null },
    ]);
  };
  const majGramme = (grams: number, patch: Partial<ProductVariant>) =>
    set(
      "sell_options",
      d.sell_options.map((o) => (o.grams === grams ? { ...o, ...patch } : o)),
    );
  /**
   * Composition d'un palier kg par parfum (ex. Dattes Farcies Variées) —
   * réservée aux fiches ASSORTIMENT de la famille, jamais à un parfum
   * simple. Le signal structurel est le même que celui déjà utilisé côté
   * boutique (fiche produit, "Assortiment — plusieurs parfums…") : une
   * fiche appartenant à une famille mais SANS son propre `flavor_label`
   * est l'assortiment de cette famille ; une fiche qui a un `flavor_label`
   * est un parfum simple et ne doit jamais afficher cet éditeur, même si
   * d'autres parfums existent dans la même famille. Un test sur le nom du
   * produit serait fragile (renommage, traduction) : celui-ci ne l'est pas.
   */
  const isAssortmentProduct = d.product_type === "assortiment";
  const typeChoices =
    d.family === "kounefa"
      ? [
          ["kechda", "Kechda"],
          ["fromage", "Fromage"],
          ["chocolat", "Chocolat"],
          ["cheese-cake", "Cheese-cake"],
        ]
      : d.family === "dattes-farcies"
        ? [
            ["parfum-simple", "Parfum simple"],
            ["assortiment", "Assortiment"],
          ]
        : [];
  const flavorDisabled = d.product_type === "cheese-cake" || isAssortmentProduct;
  const parfumsFamille = isAssortmentProduct
    ? Array.from(
        new Set(
          ctx.produits
            .filter((p) => p.family === d.family && p.flavor_label && p.slug !== d.slug)
            .map((p) => p.flavor_label as string),
        ),
      )
    : [];
  const majCompositionGrams = (flavor: string, grams: number | null) => {
    const rest = d.assortment_composition.filter((item) => item.flavor !== flavor);
    set(
      "assortment_composition",
      grams == null || grams <= 0 ? rest : [...rest, { flavor, grams }],
    );
  };

  /* -------- options de vente : format (petit / grand, deux blocs fixes) -------- */
  const majFormat = (formatSize: "small" | "large", patch: Partial<ProductVariant>) => {
    const id = formatSize === "small" ? "petit" : "grand";
    const label = formatSize === "small" ? "Petit format" : "Grand format";
    const existe = d.sell_options.some((o) => o.formatSize === formatSize);
    if (!existe) {
      set("sell_options", [...d.sell_options, { id, label, formatSize, price: 0, ...patch }]);
    } else {
      set(
        "sell_options",
        d.sell_options.map((o) => (o.formatSize === formatSize ? { ...o, ...patch } : o)),
      );
    }
  };
  const retirerFormat = (formatSize: "small" | "large") =>
    set(
      "sell_options",
      d.sell_options.filter((o) => o.formatSize !== formatSize),
    );

  const zero = !d.stock_unlimited && d.stock_qty === 0;

  return (
    <Coquille
      kind={row ? "Modifier le produit" : "Nouveau produit"}
      nom={d.name || "Sans nom"}
      onClose={onClose}
      onSave={() => void enregistrer()}
      busy={busy}
    >
      {row && <Galerie productId={row.id} badge={d.badge} />}

      <label className="f">
        <span>Pastille sur la photo</span>
        <select value={d.badge} onChange={(e) => set("badge", e.target.value)}>
          <option value="">Aucune</option>
          {Object.entries(BADGES).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <div className="hint">
          Elle s'affiche en haut à gauche de la photo, en boutique — sur la vignette comme sur la
          fiche.
        </div>
      </label>

      <label className="f">
        <span>Nom du produit</span>
        <input
          value={d.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Samsa aux amandes"
        />
      </label>

      <div className="two">
        <div className="f">
          <span>État de la fiche</span>
          <div className="segs">
            <button
              type="button"
              className={!d.archived && !d.draft ? "on gold" : ""}
              onClick={() => {
                set("archived", false);
                set("draft", false);
              }}
            >
              Publié
            </button>
            <button
              type="button"
              className={d.archived ? "on dark" : ""}
              onClick={() => set("archived", true)}
            >
              Archivé
            </button>
          </div>
        </div>
        <div className="f">
          <span>Disponibilité</span>
          <div className="segs">
            <button type="button" className={!zero ? "on gold" : ""} disabled>
              En stock
            </button>
            <button type="button" className={zero ? "on dark" : ""} disabled>
              Épuisé
            </button>
          </div>
        </div>
      </div>
      <div className="hint" style={{ marginTop: -8, marginBottom: 14 }}>
        {d.archived
          ? "Retirée de la boutique mais conservée. Restaurable à tout moment ; la suppression définitive ne se fait que depuis la liste Archivés, en retapant le nom."
          : "Visible en boutique par tout le monde."}
        {zero && !d.archived
          ? " Épuisé : la fiche reste visible, avec la pastille « Épuisé » et le bouton d'achat désactivé."
          : ""}
      </div>

      <div className="sellbox" style={{ marginBottom: 18 }}>
        <div className="st">Vente en ligne</div>
        <div className="cols">
          <label>
            <input type="checkbox" checked={d.draft} onChange={() => set("draft", !d.draft)} />{" "}
            Brouillon
          </label>
          <label>
            <input
              type="checkbox"
              checked={d.no_cart}
              onChange={() => set("no_cart", !d.no_cart)}
            />{" "}
            Sur devis uniquement
          </label>
          <label>
            <input
              type="checkbox"
              checked={d.hide_price}
              onChange={() => set("hide_price", !d.hide_price)}
            />{" "}
            Masquer le prix
          </label>
        </div>
        <div className="hint">
          Brouillon, devis ou prix masqué retirent l'ajout au panier : la boutique affiche un
          parcours de contact.
        </div>
      </div>

      {/* ------------------------------- stock ------------------------------- */}
      <div className="sellbox" style={{ marginBottom: 18 }}>
        <div className="st">Stock &amp; réserve</div>
        <div className="segs">
          <button
            type="button"
            className={!d.stock_unlimited ? "on gold" : ""}
            onClick={() => set("stock_unlimited", false)}
          >
            Je compte le stock
          </button>
          <button
            type="button"
            className={d.stock_unlimited ? "on dark" : ""}
            onClick={() => set("stock_unlimited", true)}
          >
            Sur commande — pas de compteur
          </button>
        </div>

        {d.stock_unlimited ? (
          <div className="hint" style={{ marginTop: 12 }}>
            Ce produit se fait à la demande : aucun compteur, il ne passe jamais en « Épuisé » tout
            seul. Pensez au <b>délai de préparation</b> plus bas, c'est lui qui protège votre
            atelier.
          </div>
        ) : (
          <>
            <div className="two" style={{ marginTop: 12 }}>
              <label className="f">
                <span>Quantité en réserve</span>
                <input
                  type="number"
                  value={d.stock_qty}
                  onChange={(e) =>
                    set(
                      "stock_qty",
                      Math.max(0, Math.trunc(parseFrenchNumber(e.target.value) ?? 0)),
                    )
                  }
                />
              </label>
              <label className="f">
                <span>Prévenez-moi à partir de</span>
                <input
                  type="number"
                  value={d.stock_alert}
                  onChange={(e) =>
                    set(
                      "stock_alert",
                      Math.max(0, Math.trunc(parseFrenchNumber(e.target.value) ?? 0)),
                    )
                  }
                />
              </label>
            </div>
            <div className="hint">
              {zero ? (
                <>
                  <b style={{ color: "#c0392b" }}>À zéro.</b> En boutique, la fiche reste visible
                  mais porte la pastille « Épuisé » et le bouton d'achat est désactivé.
                </>
              ) : (
                <>
                  Le stock est administré manuellement et contrôlé dans le panier. À{" "}
                  <b>{d.stock_alert}</b> restant{d.stock_alert > 1 ? "s" : ""} vous êtes prévenue ;
                  à <b>0</b>, le produit passe en « Épuisé ».
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ------------------------------- prix -------------------------------- */}
      {d.sell_mode && d.sell_options.length === 0 && (
        <div className="livwarn" style={{ marginBottom: 12 }}>
          Configuration requise :{" "}
          {d.sell_mode === "kg"
            ? "aucun grammage n'est coché"
            : d.sell_mode === "format"
              ? "aucun format n'a de prix"
              : "aucun contenant n'a de prix"}{" "}
          — la fiche reste visible en boutique avec le statut « Tarif à venir », mais l'ajout au
          panier restera bloqué tant que ce n'est pas complété ci-dessous.
        </div>
      )}
      <p className="hint">
        Le stock est global au produit : une unité de 500 g et une unité de 1 kg comptent chacune
        pour une unité, tous formats confondus. Ajouter au panier ne réserve pas le stock.
      </p>
      <p className="hint">
        Les paniers existants conservent leur prix pendant 15 jours depuis l'ajout, même si vous
        changez le tarif. La garantie ne réserve pas le stock. Archiver ou dépublier bloque aussi
        les lignes déjà présentes dans les paniers.
      </p>
      {auditPackaging({
        variants: d.sell_options,
        weight: d.weight,
        pieces: d.pieces,
        unit: d.unit,
        sellMode: d.sell_mode,
        pricePerKg: d.price,
      }).warnings.map((message) => (
        <p className="hint" key={message}>
          {message}
        </p>
      ))}
      {d.recommended
        .filter((slug) => !ctx.produits.some((p) => p.slug === slug))
        .map((slug) => (
          <p className="note" key={slug}>
            Recommandation introuvable : {slug}.{" "}
            <button
              type="button"
              onClick={() =>
                set(
                  "recommended",
                  d.recommended.filter((s) => s !== slug),
                )
              }
            >
              Retirer la référence
            </button>
          </p>
        ))}
      <div className="two">
        <label className="f">
          <span>{d.sell_mode === "kg" ? "Prix au kilo (€)" : "Prix"}</span>
          {d.sell_mode === "format" || d.sell_mode === "pot" ? (
            <div className="pxnote">
              {d.sell_mode === "format"
                ? "Chaque format a son prix, ci-dessous."
                : "Le prix vient des pots ci-dessous : c'est celui du plus petit qui s'affiche en boutique."}
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <input
                type="text"
                inputMode="decimal"
                value={d.price}
                onChange={(e) => set("price", parseFrenchPrice(e.target.value) ?? 0)}
                placeholder={d.sell_mode === "kg" ? "32,00" : "30,00"}
                style={d.sell_mode === "kg" ? { paddingRight: 46 } : undefined}
              />
              {d.sell_mode === "kg" && (
                <span
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 12,
                    color: "rgba(41,34,31,.45)",
                    pointerEvents: "none",
                  }}
                >
                  €/kg
                </span>
              )}
            </div>
          )}
          {d.sell_mode === "kg" && (
            <div className="hint">
              C'est le prix d'1 kg. Le prix de chaque grammage coché ci-dessous se recalcule
              automatiquement (jamais stocké séparément), y compris si vous modifiez ce prix plus
              tard.
            </div>
          )}
        </label>
        <label className="f">
          <span>Vendu</span>
          <select
            value={d.sell_mode}
            onChange={(e) => {
              const m = e.target.value as SellMode;
              set("sell_mode", m);
              set("sell_options", []);
            }}
          >
            <option value="">— un seul prix —</option>
            <option value="kg">au kg</option>
            <option value="format">par format (petit / grand)</option>
            <option value="pot">par pot</option>
          </select>
        </label>
      </div>

      {!d.sell_mode && d.price > 0 && (
        <div className="pxprev">
          En boutique, la cliente lit&nbsp;:{" "}
          <b>
            {euro(d.price)}
            {d.unit ? ` / ${d.unit}` : ""}
          </b>
        </div>
      )}

      {!d.sell_mode && (
        <label className="f">
          <span>Mot écrit après le prix</span>
          <select value={d.unit} onChange={(e) => set("unit", e.target.value)}>
            <option value="">— rien —</option>
            <option value="la boîte">la boîte</option>
            <option value="le pot">le pot</option>
            <option value="le plateau">le plateau</option>
            <option value="la pièce">la pièce</option>
          </select>
        </label>
      )}

      {d.sell_mode === "kg" && (
        <div className="sellbox">
          <div className="st">Grammages disponibles à la vente</div>
          <div className="hint" style={{ marginBottom: 10 }}>
            Cochez uniquement les grammages que vous vendez réellement — le site n'en propose aucun
            autre.
          </div>
          {/* Chaque grammage montre déjà son prix : on choisit en voyant ce
              que la cliente paiera, sans avoir à descendre plus bas. */}
          <div className="gramgrid">
            {KG_GRAM_CHOICES.map((g) => {
              const on = d.sell_options.some((o) => o.grams === g);
              return (
                <button
                  key={g}
                  type="button"
                  className={on ? "on" : ""}
                  aria-pressed={on}
                  onClick={() => basculerGramme(g)}
                >
                  {on && <span className="tick">✓</span>}
                  <span className="g">{formatGrams(g)}</span>
                  <span className="p">
                    {isStrictlyPositivePrice(d.price) ? euro(kgOptionPrice(d.price, g)) : "—"}
                  </span>
                </button>
              );
            })}
          </div>
          {d.sell_options.length === 0 ? (
            <div className="optcard empty">
              <div className="hint" style={{ margin: 0 }}>
                Aucun grammage coché : la fiche reste visible en boutique avec la mention « Tarif à
                venir », et l'ajout au panier est bloqué.
              </div>
            </div>
          ) : (
            <>
              <div className="st" style={{ marginTop: 4 }}>
                Grammages vendus
              </div>
              {d.sell_options
                .slice()
                .sort((a, b) => (a.grams ?? 0) - (b.grams ?? 0))
                .map((o) => {
                  return (
                    <div className="optcard" key={o.id}>
                      <div className="oh">
                        <span className="t">{formatGrams(o.grams ?? 0)}</span>
                        <span
                          className={`px${isStrictlyPositivePrice(d.price) ? "" : " todo"}`}
                          style={{ marginLeft: "auto" }}
                        >
                          {isStrictlyPositivePrice(d.price)
                            ? euro(kgOptionPrice(d.price, o.grams ?? 0))
                            : "prix au kilo manquant"}
                        </span>
                        <button
                          type="button"
                          className="del"
                          onClick={() => basculerGramme(o.grams ?? 0)}
                          title="Retirer ce grammage"
                        >
                          ×
                        </button>
                      </div>
                      <label className="minif" style={{ maxWidth: 220 }}>
                        <span>Pièces estimées (facultatif)</span>
                        <input
                          type="number"
                          min="0"
                          value={o.piecesEstimate ?? ""}
                          onChange={(e) =>
                            majGramme(o.grams ?? 0, {
                              piecesEstimate: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="≈ 24"
                        />
                      </label>
                    </div>
                  );
                })}
              <div className="hint">
                Le nombre de pièces est purement informatif : la cliente achète un poids, pas un
                nombre de pièces.
              </div>
            </>
          )}
          {isAssortmentProduct && parfumsFamille.length > 0 && (
            <div className="compo compo-reference">
              <div className="ct">Composition de l'assortiment — référence 1 kg</div>
              <div className="compogrid">
                {parfumsFamille.map((flavor) => {
                  const current = d.assortment_composition.find((item) => item.flavor === flavor);
                  return (
                    <label key={flavor}>
                      <span>{flavor}</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={current?.grams ?? ""}
                        onChange={(e) =>
                          majCompositionGrams(
                            flavor,
                            e.target.value === "" ? null : Number(e.target.value),
                          )
                        }
                        placeholder="0"
                      />
                      <span className="unit">g</span>
                    </label>
                  );
                })}
              </div>
              {(() => {
                const total = compositionGramsTotal(d.assortment_composition);
                return (
                  <div className={total === 1000 ? "compo-total ok" : "compo-total warn"}>
                    Total : {total} / 1000 g {total === 1000 ? "✓" : "— à compléter"}
                  </div>
                );
              })()}
              {compositionGramsTotal(d.assortment_composition) === 1000 &&
                d.sell_options.length > 0 && (
                  <div className="compo-preview">
                    {d.sell_options
                      .slice()
                      .sort((a, b) => (a.grams ?? 0) - (b.grams ?? 0))
                      .map((option) => (
                        <div key={option.id}>
                          <b>{formatGrams(option.grams ?? 0)}</b>
                          <span>
                            {scaleGramComposition(d.assortment_composition, option.grams ?? 0)
                              .map((item) => `${item.flavor} ${item.grams} g`)
                              .join(" · ")}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {d.sell_mode === "pot" && (
        <div className="sellbox">
          <div className="st">Les pots que la cliente peut choisir</div>
          <LignesPot
            options={d.sell_options}
            onChange={majOption}
            onRemove={retirer}
            onAdd={ajouter}
          />
        </div>
      )}

      {d.sell_mode === "format" && (
        <div className="sellbox">
          <div className="st">Petit format / Grand format</div>
          <div className="hint" style={{ marginBottom: 10 }}>
            Deux formats au maximum. Un format non rempli reste « à configurer » et n'est pas
            proposé à la cliente.
          </div>
          <div className="fmtduo">
            <BlocFormat
              formatSize="small"
              titre="Petit format"
              option={d.sell_options.find((o) => o.formatSize === "small")}
              onChange={(patch) => majFormat("small", patch)}
              onRemove={() => retirerFormat("small")}
            />
            <BlocFormat
              formatSize="large"
              titre="Grand format"
              option={d.sell_options.find((o) => o.formatSize === "large")}
              onChange={(patch) => majFormat("large", patch)}
              onRemove={() => retirerFormat("large")}
            />
          </div>
        </div>
      )}

      <label className="f">
        <span>Description courte</span>
        <textarea
          rows={2}
          value={d.short_desc}
          onChange={(e) => set("short_desc", e.target.value)}
          placeholder="Une phrase — c'est ce que la cliente lit sous la photo."
        />
      </label>

      <div className="f">
        <span>Collections</span>
        <div className="cols">
          {collections.map((c) => (
            <label key={c.id}>
              <input
                type="checkbox"
                checked={d.collections.includes(c.product_key)}
                onChange={() =>
                  set(
                    "collections",
                    d.collections.includes(c.product_key)
                      ? d.collections.filter((k) => k !== c.product_key)
                      : [...d.collections, c.product_key],
                  )
                }
              />{" "}
              {c.label}
            </label>
          ))}
        </div>
        <div className="hint">
          Un produit peut être dans plusieurs collections. Sans collection, il n'apparaît que sur la
          page complète.
        </div>
      </div>

      <div className="family-structure" style={{ marginTop: 4 }}>
        <label className="f">
          <span>Famille</span>
          <select
            value={d.family}
            onChange={(e) =>
              setD((previous) => ({
                ...previous,
                family: e.target.value,
                product_type: "",
                flavor_label: "",
                assortment_composition: [],
              }))
            }
          >
            <option value="">— aucune —</option>
            {familles.map((f) => (
              <option key={f.id} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="f">
          <span>Type</span>
          {typeChoices.length ? (
            <select
              value={d.product_type}
              onChange={(e) =>
                setD((previous) => ({
                  ...previous,
                  product_type: e.target.value,
                  flavor_label:
                    e.target.value === "cheese-cake" || e.target.value === "assortiment"
                      ? ""
                      : previous.flavor_label,
                  assortment_composition:
                    e.target.value === "assortiment" ? previous.assortment_composition : [],
                }))
              }
            >
              <option value="">— à préciser —</option>
              {typeChoices.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={d.product_type}
              onChange={(e) => set("product_type", e.target.value)}
              placeholder="Type facultatif"
            />
          )}
        </label>
        {flavorDisabled ? (
          <div className="f structure-na">
            <span>Parfum</span>
            <div>Aucun parfum pour ce type</div>
          </div>
        ) : (
          <ChoixParfum
            valeur={d.flavor_label}
            famille={d.family}
            produits={ctx.produits}
            familles={familles}
            onChange={(v) => set("flavor_label", v)}
          />
        )}
      </div>
      <div className="hint" style={{ marginTop: -8 }}>
        La famille regroupe la gamme, le type décrit la recette, puis le parfum distingue une
        déclinaison. Cette structure alimente les suggestions de la fiche.
      </div>

      {/*
       * Type de fiche dans la famille — déduit, jamais saisi deux fois : une
       * fiche AVEC parfum est un parfum simple, une fiche SANS parfum dans
       * une famille qui en compte d'autres est l'assortiment de la famille.
       * C'est exactement ce qui décide d'afficher ou non l'éditeur de
       * composition, et c'est écrit ici pour que ce ne soit pas une surprise.
       */}
      {d.family && !d.product_type && (
        <div className="pxnote" style={{ marginTop: -4, marginBottom: 16 }}>
          <b style={{ color: "var(--gold-dark)" }}>Type à préciser</b>
          <br />
          Ce produit reste administrable, mais sa place dans les suggestions Famille → Type → Parfum
          ne peut pas être déterminée tant que le type n'est pas renseigné.
        </div>
      )}

      <details>
        <summary>
          Le produit en détail <small>pièces, conservation, composition</small>
        </summary>
        <div className="in">
          {!d.sell_mode && (
            <label className="f">
              <span>Nombre de pièces</span>
              <input
                type="number"
                value={d.pieces ?? ""}
                onChange={(e) =>
                  set("pieces", e.target.value === "" ? null : Number(e.target.value))
                }
                placeholder="24"
              />
            </label>
          )}
          <label className="f">
            <span>Catégorie</span>
            <select value={d.category} onChange={(e) => set("category", e.target.value)}>
              {[...new Set([d.category, "traditionnelle", "orientale", "petits-fours"])].map(
                (c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="f">
            <span>Ordre dans le catalogue</span>
            <input
              type="number"
              min="0"
              value={d.sort_order}
              onChange={(e) =>
                set("sort_order", Math.max(0, Math.trunc(Number(e.target.value) || 0)))
              }
            />
          </label>
          <label className="f">
            <span>Précisions sur le produit</span>
            <textarea value={d.disclaimer} onChange={(e) => set("disclaimer", e.target.value)} />
          </label>
          {!d.sell_mode && (
            <label className="f">
              <span>Poids affiché</span>
              <input
                value={d.weight}
                onChange={(e) => set("weight", e.target.value)}
                placeholder="500 g"
              />
            </label>
          )}
          <div className="two">
            {!d.sell_mode && (
              <label className="f">
                <span>Personnes</span>
                <input
                  type="number"
                  value={d.serves ?? ""}
                  onChange={(e) =>
                    set("serves", e.target.value === "" ? null : Number(e.target.value))
                  }
                  placeholder="8"
                />
              </label>
            )}
            <label className="f">
              <span>Prix par pièce</span>
              <input
                inputMode="decimal"
                value={d.price_per_piece}
                onChange={(e) => set("price_per_piece", e.target.value)}
                placeholder="1,50"
              />
            </label>
          </div>
          <label className="f">
            <span>Quantité minimale</span>
            <input
              value={d.min_quantity}
              onChange={(e) => set("min_quantity", e.target.value)}
              placeholder="12 pièces"
            />
          </label>
          <div className="cols">
            <label>
              <input
                type="checkbox"
                checked={d.customizable === true}
                onChange={() => set("customizable", d.customizable === true ? null : true)}
              />{" "}
              Assortiment personnalisable
            </label>
            <label>
              <input
                type="checkbox"
                checked={d.customizable === false}
                onChange={() => set("customizable", d.customizable === false ? null : false)}
              />{" "}
              Composition figée
            </label>
          </div>
          <label className="f">
            <span>Conservation</span>
            <input
              value={d.conservation}
              onChange={(e) => set("conservation", e.target.value)}
              placeholder="10 jours en boîte hermétique."
            />
          </label>
          <label className="f">
            <span>Composition</span>
            <textarea
              rows={3}
              value={d.composition}
              onChange={(e) => set("composition", e.target.value)}
              placeholder="Une ligne par élément"
            />
          </label>
          <label className="f">
            <span>Ingrédients</span>
            <textarea
              rows={3}
              value={d.ingredients}
              onChange={(e) => set("ingredients", e.target.value)}
              placeholder="Un ingrédient par ligne"
            />
          </label>
          <fieldset className="f">
            <legend>Allergènes confirmés</legend>
            <div className="cols">
              {ALLERGEN_OPTIONS.map((allergen) => (
                <label key={allergen.value}>
                  <input
                    type="checkbox"
                    checked={d.allergens.includes(allergen.value)}
                    onChange={() =>
                      set(
                        "allergens",
                        d.allergens.includes(allergen.value)
                          ? d.allergens.filter((item) => item !== allergen.value)
                          : [...d.allergens, allergen.value],
                      )
                    }
                  />{" "}
                  {allergen.label}
                </label>
              ))}
            </div>
            <div className="hint">
              À renseigner seulement après vérification de la recette. Une case non cochée ne
              signifie pas « sans allergène ».
            </div>
          </fieldset>
          <label className="f">
            <span>Description longue</span>
            <textarea
              rows={4}
              value={d.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>
        </div>
      </details>

      <details>
        <summary>
          Vous aimerez aussi <small>les fiches proposées sous celle-ci</small>
        </summary>
        <div className="in">
          <div className="hint" style={{ marginTop: 0 }}>
            Sans choix de votre part, la boutique propose quatre produits de la même catégorie.
            Cochez pour décider vous-même — quatre au maximum sont affichés, dans l'ordre où vous
            les cochez.
          </div>
          <div className="cols" style={{ marginTop: 10 }}>
            {ctx.produits
              .filter((x) => !x.archived && x.slug !== d.slug && x.slug !== row?.slug)
              .map((x) => (
                <label key={x.id}>
                  <input
                    type="checkbox"
                    checked={d.recommended.includes(x.slug)}
                    onChange={() =>
                      set(
                        "recommended",
                        d.recommended.includes(x.slug)
                          ? d.recommended.filter((k) => k !== x.slug)
                          : [...d.recommended, x.slug],
                      )
                    }
                  />{" "}
                  {x.name}
                </label>
              ))}
          </div>
          {d.recommended.length > 4 && (
            <div className="hint">
              {d.recommended.length} fiches cochées — seules les quatre premières seront montrées.
            </div>
          )}
        </div>
      </details>

      <details>
        <summary>
          Livraison, délai &amp; saison <small>combien de temps avant, expédition, Ramadan</small>
        </summary>
        <div className="in">
          <label className="f">
            <span>Délai de préparation</span>
            <input
              value={d.prep_lead}
              onChange={(e) => set("prep_lead", e.target.value)}
              placeholder="48 h à l'avance"
              list="delais-osweets"
            />
            <datalist id="delais-osweets">
              <option value="24 h à l'avance" />
              <option value="48 h à l'avance" />
              <option value="72 h à l'avance" />
              <option value="5 jours pour un événement" />
              <option value="1 semaine à l'avance" />
            </datalist>
            <div className="hint">
              Combien de temps avant il faut commander. C'est une règle de l'atelier : la cliente la
              lit sur la fiche.
            </div>
          </label>

          <label className="f">
            <span>Texte de livraison affiché</span>
            <input
              value={d.delivery_mode}
              onChange={(e) => set("delivery_mode", e.target.value)}
              placeholder="Retrait atelier ou livraison locale"
            />
          </label>
          <label className="f">
            <span>Disponibilités affichées</span>
            <textarea
              rows={3}
              value={d.availability}
              onChange={(e) => set("availability", e.target.value)}
              placeholder="Une ligne par disponibilité"
            />
          </label>
          <div className="cols">
            <label>
              <input
                type="checkbox"
                checked={d.local_only}
                onChange={() => set("local_only", !d.local_only)}
              />{" "}
              Produit local uniquement
            </label>
            <label>
              <input
                type="checkbox"
                checked={d.requires_cold}
                onChange={() => set("requires_cold", !d.requires_cold)}
              />{" "}
              Nécessite le froid
            </label>
          </div>

          <div className="f">
            <span>Comment la cliente peut recevoir ce produit</span>
            <div className="liv">
              <Reception
                on={d.ship_pickup}
                onToggle={() => set("ship_pickup", !d.ship_pickup)}
                titre="Retrait à l'atelier"
                em="Gratuit"
              >
                Elle vient chercher sur place. Aucun frais.
              </Reception>
              <Reception
                on={d.ship_local}
                onToggle={() => set("ship_local", !d.ship_local)}
                titre="Livraison locale"
                em="selon l'adresse"
              >
                <b>{reglages.deliveryStart.toFixed(2)} €</b> au départ, plus{" "}
                <b>{reglages.deliveryPerKm.toFixed(2)} €</b> par kilomètre. Jusqu'à{" "}
                <b>{reglages.deliveryRadiusKm} km</b>. Offerte dès{" "}
                <b>{reglages.deliveryFreeFrom} €</b>.
              </Reception>
              <Reception
                on={d.ship_national}
                onToggle={() => set("ship_national", !d.ship_national)}
                titre="Expédition en France"
                em="selon la destination"
              >
                <b>{reglages.shippingPrice.toFixed(2)} €</b> le colis, offert dès{" "}
                <b>{reglages.shippingFreeFrom} €</b>. À décocher pour un produit frais.
              </Reception>
            </div>
            {!d.ship_pickup && !d.ship_local && !d.ship_national && (
              <div className="livwarn">
                Aucun mode coché : la cliente ne pourra pas commander ce produit.
              </div>
            )}
            <div className="hint">
              Les montants viennent de <b>Réglages</b> et valent pour toute la boutique. Ici, vous
              choisissez seulement les modes possibles pour ce produit.
            </div>
          </div>

          <div className="f">
            <span>Saisonnier</span>
            <div className="cols">
              <label>
                <input
                  type="checkbox"
                  checked={d.seasonal_only}
                  onChange={() => set("seasonal_only", !d.seasonal_only)}
                />{" "}
                Uniquement pendant Ramadan / Aïd
              </label>
            </div>
          </div>
        </div>
      </details>

      <details>
        <summary>
          Ce que Google affiche <small>+ adresse de la page</small>
        </summary>
        <div className="in">
          <label className="f">
            <span>Adresse de la page</span>
            <input
              value={d.slug}
              onChange={(e) => set("slug", e.target.value)}
              placeholder="se remplit tout seul"
              disabled={!!row}
            />
            <div className="hint">
              {row
                ? "Figée : des liens et Google pointent dessus."
                : "Créée à partir du nom si vous la laissez vide."}
            </div>
          </label>
          <label className="f">
            <span>Titre pour Google</span>
            <input
              value={d.seo_title}
              onChange={(e) => set("seo_title", e.target.value)}
              placeholder={`${d.name || "Nom du produit"} — Ö' Sweets`}
            />
            <div className="hint">Laissez vide : le nom du produit sera repris.</div>
          </label>
          <label className="f">
            <span>Description pour Google</span>
            <textarea
              rows={2}
              value={d.seo_description}
              onChange={(e) => set("seo_description", e.target.value)}
              placeholder="Laissez vide, la description courte sera reprise."
            />
          </label>
        </div>
      </details>
    </Coquille>
  );
}

function Reception({
  on,
  onToggle,
  titre,
  em,
  children,
}: {
  on: boolean;
  onToggle: () => void;
  titre: string;
  em: string;
  children: ReactNode;
}) {
  return (
    <label className={`livrow${on ? " on" : ""}`}>
      <input type="checkbox" checked={on} onChange={onToggle} />
      <div>
        <div className="t">
          {titre} <em>{em}</em>
        </div>
        <div className="d">{children}</div>
      </div>
    </label>
  );
}

/** Mode `pot` : liste de contenants (nom + poids/contenance + prix), en nombre libre. */
function LignesPot({
  options,
  onChange,
  onRemove,
  onAdd,
}: {
  options: ProductVariant[];
  onChange: (i: number, patch: Partial<ProductVariant>) => void;
  onRemove: (i: number) => void;
  onAdd: () => void;
}) {
  return (
    <>
      {options.length === 0 && (
        <div className="optcard empty">
          <div className="hint" style={{ margin: 0 }}>
            Aucun contenant : la fiche reste visible avec la mention « Tarif à venir ».
          </div>
        </div>
      )}
      {options.map((o, i) => (
        <div className="optcard" key={o.id || i}>
          <div className="oh">
            <span className="t">{o.label.trim() || `Contenant ${i + 1}`}</span>
            <span
              className={`px${isStrictlyPositivePrice(o.price) && o.weightG ? "" : " todo"}`}
              style={{ marginLeft: "auto" }}
            >
              {isStrictlyPositivePrice(o.price)
                ? `${euro(o.price ?? 0)}${o.weightG ? ` · ${o.weightG} g` : " · poids manquant"}`
                : "prix à saisir"}
            </span>
            <button type="button" className="del" onClick={() => onRemove(i)} title="Retirer">
              ×
            </button>
          </div>
          <div className="potgrid">
            <label className="minif">
              <span>Nom du contenant</span>
              <input
                value={o.label}
                onChange={(e) => onChange(i, { label: e.target.value })}
                placeholder="Pot individuel"
              />
            </label>
            <label className="minif">
              <span>Poids / contenance (g)</span>
              <input
                type="number"
                min="0"
                value={o.weightG ?? ""}
                onChange={(e) =>
                  onChange(i, {
                    weightG: e.target.value === "" ? undefined : Number(e.target.value),
                  })
                }
                placeholder="180"
              />
            </label>
            <label className="minif">
              <span>Prix (€)</span>
              <input
                inputMode="decimal"
                value={String(o.price ?? "")}
                onChange={(e) => onChange(i, { price: parseFrenchPrice(e.target.value) ?? 0 })}
                placeholder="14,00"
              />
            </label>
          </div>
        </div>
      ))}
      <button type="button" className="addrow" onClick={onAdd}>
        + Ajouter un contenant
      </button>
      {options.length > 0 && (
        <div className="hint" style={{ marginTop: 10 }}>
          Le premier contenant est celui proposé par défaut ; la vignette affiche le prix du pot le
          moins cher.
        </div>
      )}
    </>
  );
}

/** Mode `format` : un bloc fixe (Petit ou Grand), pas encore rempli tant qu'aucun prix n'est saisi. */
function BlocFormat({
  formatSize,
  titre,
  option,
  onChange,
  onRemove,
}: {
  formatSize: "small" | "large";
  titre: string;
  option?: ProductVariant;
  onChange: (patch: Partial<ProductVariant>) => void;
  onRemove: () => void;
}) {
  if (!option) {
    return (
      <div className="optcard empty">
        <div className="oh">
          <span className="t" style={{ color: "rgba(41,34,31,.45)" }}>
            {titre}
          </span>
          <span className="px todo" style={{ marginLeft: "auto" }}>
            non proposé
          </span>
        </div>
        <button
          type="button"
          className="addrow"
          style={{ marginTop: 0 }}
          onClick={() => onChange({ formatSize, label: titre, price: 0 })}
        >
          + Configurer {titre.toLowerCase()}
        </button>
      </div>
    );
  }
  const personnes = option.servesMin
    ? `${option.servesMin}${
        option.servesMax && option.servesMax !== option.servesMin ? `–${option.servesMax}` : ""
      } personnes`
    : null;
  return (
    <div className="optcard">
      <div className="oh">
        <span className="t">{titre}</span>
        <span
          className={`px${isStrictlyPositivePrice(option.price) ? "" : " todo"}`}
          style={{ marginLeft: "auto" }}
        >
          {isStrictlyPositivePrice(option.price) ? euro(option.price ?? 0) : "prix à saisir"}
        </span>
        <button type="button" className="del" onClick={onRemove} title="Retirer ce format">
          ×
        </button>
      </div>
      <div className="grid2">
        <label className="minif">
          <span>Prix (€)</span>
          <input
            inputMode="decimal"
            value={String(option.price ?? "")}
            onChange={(e) => onChange({ price: parseFrenchPrice(e.target.value) ?? 0 })}
            placeholder="42,00"
          />
        </label>
        <label className="minif">
          <span>Pièces (facultatif)</span>
          <input
            type="number"
            min="0"
            value={option.pieces ?? ""}
            onChange={(e) =>
              onChange({ pieces: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            placeholder="12"
          />
        </label>
      </div>
      <div className="grid2">
        <label className="minif">
          <span>Personnes min.</span>
          <input
            type="number"
            min="0"
            value={option.servesMin ?? ""}
            onChange={(e) =>
              onChange({ servesMin: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            placeholder="4"
          />
        </label>
        <label className="minif">
          <span>Personnes max.</span>
          <input
            type="number"
            min="0"
            value={option.servesMax ?? ""}
            onChange={(e) =>
              onChange({ servesMax: e.target.value === "" ? undefined : Number(e.target.value) })
            }
            placeholder="6"
          />
        </label>
      </div>
      <div className="hint" style={{ marginTop: 10 }}>
        {isStrictlyPositivePrice(option.price)
          ? `En boutique : ${[titre, personnes, option.pieces ? `${option.pieces} pièces` : null]
              .filter(Boolean)
              .join(" · ")} — ${euro(option.price ?? 0)}`
          : "Prix manquant : ce format restera masqué tant qu'il n'a pas de prix."}
      </div>
    </div>
  );
}

/* ================================= GALERIE ================================= */

function Galerie({ productId, badge }: { productId: string; badge: string }) {
  const [images, setImages] = useState<ProductImageRow[]>([]);
  const charger = async () => {
    try {
      setImages(await listProductImages({ data: { productId } }));
    } catch {
      /* la base ne répond pas : la galerie reste vide */
    }
  };
  useEffect(() => {
    void charger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const deplacer = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= images.length) return;
    const next = [...images];
    [next[i], next[j]] = [next[j], next[i]];
    setImages(next);
    await reorderProductImages({ data: { ids: next.map((x) => x.id) } });
    await charger();
  };

  const televerser = async (file: File) => {
    const base64 = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(",")[1] ?? "");
      r.onerror = rej;
      r.readAsDataURL(file);
    });
    try {
      const { url } = await uploadProductImage({
        data: { fileName: file.name, contentType: file.type, base64 },
      });
      await addProductImage({ data: { productId, url } });
      await charger();
      toast.success("Photo ajoutée.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible.");
    }
  };

  return (
    <div className="f" style={{ marginBottom: 20 }}>
      <span>Photos du produit</span>
      <div className="gtiles">
        {images.map((im, i) => (
          <div className={`gt${i === 0 ? " main" : ""}`} key={im.id}>
            <img src={im.url} alt={im.alt} />
            {i === 0 && (
              <>
                {badge && <span className="pbadge">{BADGES[badge] ?? badge}</span>}
                <span className="gmain">Photo principale</span>
              </>
            )}
            <div className="gact">
              <button
                type="button"
                onClick={() => void deplacer(i, -1)}
                title="Vers la gauche"
                disabled={i === 0}
              >
                ←
              </button>
              {i > 0 && (
                <button
                  type="button"
                  title="Faire de cette photo la principale"
                  onClick={async () => {
                    await setPrimaryImage({ data: { id: im.id } });
                    await charger();
                    toast.success("C'est désormais la photo principale.");
                  }}
                >
                  ★
                </button>
              )}
              <button
                type="button"
                onClick={() => void deplacer(i, 1)}
                title="Vers la droite"
                disabled={i === images.length - 1}
              >
                →
              </button>
              <button
                type="button"
                className="rm"
                title="Retirer cette photo"
                onClick={async () => {
                  await deleteProductImage({ data: { id: im.id } });
                  await charger();
                  toast.success("Photo retirée.");
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <label className="gadd" style={{ display: "grid", placeItems: "center" }}>
          +<br />
          Ajouter
          <br />
          des photos
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              void (async () => {
                for (const f of files) await televerser(f);
              })();
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <div className="hint">
        La <b>photo principale</b> est celle qu'on voit partout : vignette de la boutique, résultats
        Google, partage WhatsApp. Les autres se rangent dessous sur la fiche, dans l'ordre affiché
        ici. Survolez une photo pour la déplacer, la promouvoir en principale ou la retirer.
      </div>
    </div>
  );
}

/* =============================== COLLECTION =============================== */

export function PanelCollection({
  row,
  ctx,
  onClose,
}: {
  row: CollectionRow | null;
  ctx: Contexte;
  onClose: () => void;
}) {
  const { produits, recharger } = ctx;
  const [busy, setBusy] = useState(false);
  const [deleteText, setDeleteText] = useState("");
  const [d, setD] = useState(() => ({
    label: row?.label ?? "",
    h1: row?.h1 ?? "",
    subtitle: row?.subtitle ?? "",
    title: row?.title ?? "",
    description: row?.description ?? "",
    sort_order: row?.sort_order ?? nextCollectionOrder(ctx.collections),
    published: row?.published ?? true,
    hidden: row?.hidden ?? false,
    empty_behavior: row?.empty_behavior === "hide" ? "hide" : "soon",
  }));
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((p) => ({ ...p, [k]: v }));

  const counts = row
    ? collectionCounts(produits.map(rowToProduct), row.product_key, toWindows(ctx.saisons))
    : { associated: 0, published: 0, visible: 0, commandable: 0, archived: 0 };
  const estVide = counts.visible === 0;

  const enregistrer = async () => {
    const label = d.label.trim();
    if (!label) return toast.error("Le nom de la collection est obligatoire.");
    setBusy(true);
    try {
      if (row) {
        await saveCollection({ data: { id: row.id, values: { ...d, label, h1: d.h1 || label } } });
      } else {
        // La création pose le nom et l'adresse ; les textes suivent aussitôt,
        // pour que la collection naisse complète en une seule manœuvre.
        await createCollection({
          data: {
            slug: slugify(label),
            product_key: slugify(label),
            label,
            values: { ...d, label, h1: d.h1 || label },
          },
        });
      }
      await recharger();
      toast.success(row ? "Collection enregistrée." : `« ${label} » a été créée.`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
    setBusy(false);
  };

  const supprimer = async () => {
    if (!row) return;
    setBusy(true);
    try {
      await deleteCollection({ data: { id: row.id } });
      await recharger();
      toast.success(`Collection « ${row.label} » supprimée. Ses produits ont été conservés.`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible.");
    }
    setBusy(false);
  };

  return (
    <Coquille
      kind={row ? "Collection" : "Nouvelle collection"}
      nom={d.label || "Sans nom"}
      onClose={onClose}
      onSave={() => void enregistrer()}
      busy={busy}
    >
      <div className="note" style={{ marginBottom: 18 }}>
        {row ? (
          <>
            Adresse de la page : <b>/patisserie/{row.slug}</b> — non modifiable, Google et vos liens
            pointent dessus.
          </>
        ) : (
          <>
            Une nouvelle collection obtient sa page tout de suite. Tant qu'elle n'a{" "}
            <b>aucun produit</b>, cette page affiche « Bientôt disponible » et recueille les
            inscriptions — vous avez des contacts avant même la première photo.
          </>
        )}
      </div>

      <div className="two">
        <label className="f">
          <span>Nom affiché</span>
          <input
            value={d.label}
            onChange={(e) => set("label", e.target.value)}
            placeholder="Amandes"
          />
        </label>
        <label className="f">
          <span>Position dans la liste</span>
          <input
            type="number"
            value={d.sort_order}
            onChange={(e) => set("sort_order", Number(e.target.value) || 0)}
          />
        </label>
      </div>

      <label className="f">
        <span>Titre de la page</span>
        <input value={d.h1} onChange={(e) => set("h1", e.target.value)} placeholder={d.label} />
      </label>

      <label className="f">
        <span>Accroche sous le titre</span>
        <textarea
          rows={2}
          value={d.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          placeholder="Une phrase qui donne envie."
        />
      </label>

      <div className="f">
        <span>Visible en boutique</span>
        <select
          value={collectionState(d)}
          onChange={(e) =>
            setD((prev) => ({
              ...prev,
              published: e.target.value !== "unpublished",
              hidden: e.target.value === "hidden",
            }))
          }
        >
          <option value="online">Publiée et visible</option>
          <option value="hidden">Masquée du public</option>
          <option value="unpublished">Dépubliée</option>
        </select>
        <div className="hint" style={{ marginBottom: 20 }}>
          Une collection masquée disparaît du menu, de l'index, des filtres, du footer et de sa page
          publique après actualisation. Le sitemap est mis à jour au prochain build et déploiement.
          Elle reste modifiable ici avec toutes ses associations.
        </div>
      </div>

      <div className="f">
        <span>Quand elle ne contient aucun produit</span>
        <div className="segs">
          <button
            type="button"
            className={d.empty_behavior === "soon" ? "on gold" : ""}
            onClick={() => set("empty_behavior", "soon")}
          >
            Page « Bientôt disponible »
          </button>
          <button
            type="button"
            className={d.empty_behavior === "hide" ? "on dark" : ""}
            onClick={() => set("empty_behavior", "hide")}
          >
            Masquer tant qu'elle est vide
          </button>
        </div>
        <div className="hint">
          {d.empty_behavior === "soon"
            ? "Sa page reste en ligne et affiche « Bientôt disponible » avec le formulaire d'inscription. Les inscriptions arrivent dans Liste d'attente, sous Clientes. C'est le réglage par défaut, et le plus utile : vous savez qui attend avant de produire."
            : "Sa page renvoie vers l'index, et la collection disparaît du menu jusqu'à ce qu'elle contienne au moins un produit."}
        </div>
        {row && estVide && (
          <div className="note" style={{ marginTop: 12, fontSize: 12 }}>
            <b>Aujourd'hui</b> : {counts.associated} produit(s) associé(s), {counts.published}{" "}
            publié(s), {counts.visible} visible(s) en boutique.{" "}
            {d.empty_behavior === "soon"
              ? "Sa page affiche donc « Bientôt disponible »."
              : "Elle est donc masquée de la boutique publique."}
          </div>
        )}
      </div>

      <details>
        <summary>
          Ce que Google affiche <small>titre et description</small>
        </summary>
        <div className="in">
          <label className="f">
            <span>Titre dans Google</span>
            <input value={d.title} onChange={(e) => set("title", e.target.value)} />
            <div className="hint">{d.title.length} caractères — idéalement moins de 60.</div>
          </label>
          <label className="f">
            <span>Description dans Google</span>
            <textarea
              rows={3}
              value={d.description}
              onChange={(e) => set("description", e.target.value)}
            />
            <div className="hint">
              {d.description.length} caractères — idéalement entre 120 et 160.
            </div>
          </label>
        </div>
      </details>

      {row && (
        <details>
          <summary>
            Supprimer définitivement <small>les produits sont conservés</small>
          </summary>
          <div className="in">
            <div className="note" style={{ borderLeftColor: "#c0392b", marginBottom: 14 }}>
              Supprimer définitivement la collection <b>{row.label}</b> ? Ses produits ne seront pas
              supprimés, mais ils ne seront plus associés à cette collection. Cette action est
              irréversible.
            </div>
            <label className="f">
              <span>Retapez le nom de la collection pour confirmer</span>
              <input
                value={deleteText}
                onChange={(e) => setDeleteText(e.target.value)}
                placeholder={row.label}
                autoComplete="off"
              />
            </label>
            <button
              type="button"
              className="btn-ghost danger"
              disabled={deleteText.trim().toLowerCase() !== row.label.trim().toLowerCase() || busy}
              onClick={() => void supprimer()}
            >
              Supprimer définitivement
            </button>
          </div>
        </details>
      )}
    </Coquille>
  );
}

/* =========================== PRODUITS D'UNE COLLECTION =========================== */

function adminPrix(p: ProductRow) {
  const opts = Array.isArray(p.sell_options) ? p.sell_options : [];
  if (p.sell_mode === "kg" && opts.length > 0) {
    // Grammage de référence identique à la boutique (1 kg > 500 g > 100 g >
    // le plus élevé vendu) — jamais le moins cher, sinon l'admin et la
    // cliente ne lisent pas le même prix pour la même fiche.
    const main = kgMainGrams(
      opts.map((o) => o.grams ?? 0).filter((g): g is number => typeof g === "number" && g > 0),
    );
    return isStrictlyPositivePrice(p.price) && main !== null
      ? `${formatGrams(main)} · ${euro(kgOptionPrice(Number(p.price), main))}`
      : "prix au kilo à définir";
  }
  if (opts.length > 0) {
    const first = opts[0];
    return `${first.label} · ${euro(first.price ?? 0)}`;
  }
  // Mode kg sans aucun grammage coché : le prix/kg éventuellement saisi ne
  // rend pas le produit vendable — l'afficher comme un prix ferme induirait
  // en erreur (voir « PUBLIÉ · TARIF À CONFIGURER » juste au-dessus).
  if (p.sell_mode === "kg") return "aucun grammage coché";
  return p.price ? euro(p.price) : "prix à définir";
}

function adminEtat(p: ProductRow) {
  if (p.archived) return "Archivé";
  if (!p.published) return "Dépublié";
  if (!p.stock_unlimited && (p.stock_qty ?? 0) <= 0) return "Épuisé";
  return "Publié";
}

/**
 * Statut détaillé d'une association collection → produit. Reprend
 * exactement la raison de blocage utilisée côté front (`productBlockReason`)
 * pour que "Tarif à configurer" ici corresponde à "Tarif à venir" là-bas —
 * jamais deux vérités différentes pour le même produit.
 */
function statutAssociation(p: ProductRow, windows: SeasonWindow[]): string {
  if (p.archived) return "ARCHIVÉ · NON PUBLIÉ";
  if (!p.published) return "NON PUBLIÉ";
  if (p.draft) return "BROUILLON";
  const reason = productBlockReason(rowToProduct(p), windows);
  if (reason === "no_price") return "PUBLIÉ · TARIF À CONFIGURER";
  if (reason === "season_closed") return "PUBLIÉ · HORS SAISON";
  if (reason === "out_of_stock") return "PUBLIÉ · ÉPUISÉ";
  if (reason === "quote") return "PUBLIÉ · SUR DEVIS";
  return "PUBLIÉ · VISIBLE";
}

export function PanelCollectionProducts({
  col,
  ctx,
  onClose,
  mode,
}: {
  col: CollectionRow;
  ctx: Contexte;
  onClose: () => void;
  mode: "members" | "add";
}) {
  const { produits, recharger, saisons } = ctx;
  const windows = useMemo(() => toWindows(saisons), [saisons]);
  const [recherche, setRecherche] = useState("");
  const [busy, setBusy] = useState(false);
  const base = useMemo(
    () =>
      produits.filter((p) => {
        const dedans = (p.collections ?? []).includes(col.product_key);
        /*
         * « Ses produits » pilote les ASSOCIATIONS, pas seulement ce que la
         * cliente voit : un produit archivé, dépublié ou en brouillon reste
         * associé à la collection et doit apparaître ici, avec son statut,
         * sinon le compteur "associés" de la carte (qui les compte tous) ne
         * correspond plus à ce que montre le panneau.
         */
        if (mode === "members") return dedans;
        return !dedans && !p.archived;
      }),
    [col.product_key, mode, produits],
  );
  const [choix, setChoix] = useState<string[]>(() =>
    mode === "members" ? base.map((p) => p.id) : [],
  );
  const [removed, setRemoved] = useState<string[]>([]);
  useEffect(() => {
    setChoix((prev) => {
      if (mode === "members") return base.filter((p) => !removed.includes(p.id)).map((p) => p.id);
      const valid = new Set(base.map((p) => p.id));
      return prev.filter((id) => valid.has(id));
    });
  }, [base, mode, removed]);
  const visibles = base.filter((p) =>
    p.name.toLowerCase().includes(recherche.trim().toLowerCase()),
  );
  const aRetirer =
    mode === "members" ? base.filter((p) => !choix.includes(p.id)).map((p) => p.id) : [];
  const aAjouter = mode === "add" ? choix : [];
  const hasChanges = mode === "members" ? aRetirer.length > 0 : aAjouter.length > 0;

  const enregistrer = async () => {
    if (!hasChanges) {
      toast.info("Aucun changement à enregistrer.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "members") {
        const result = await removeProductsFromCollection({
          data: { collectionId: col.id, productIds: aRetirer },
        });
        toast.success(`${result.count} produit(s) retiré(s) de « ${col.label} ».`);
      } else {
        const result = await addProductsToCollection({
          data: { collectionId: col.id, productIds: aAjouter },
        });
        toast.success(`${result.count} produit(s) ajouté(s) à « ${col.label} ».`);
      }
      await recharger();
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
    setBusy(false);
  };

  return (
    <Coquille
      kind={mode === "members" ? "Ses produits" : "Ajouter des produits"}
      nom={col.label}
      onClose={onClose}
      onSave={() => void enregistrer()}
      saveLabel={mode === "members" ? "Enregistrer les retraits" : "Ajouter les produits"}
      busy={busy}
    >
      <div className="note" style={{ marginBottom: 18 }}>
        {mode === "members" ? (
          <>
            Seuls les produits appartenant déjà à <b>{col.label}</b> sont affichés. Décochez ceux à
            retirer : leurs autres collections et leurs fiches restent intactes.
          </>
        ) : (
          <>
            Seuls les produits qui ne sont pas encore dans <b>{col.label}</b> sont affichés. Les
            produits peuvent déjà appartenir à d'autres collections.
          </>
        )}
      </div>

      {base.length > 8 && (
        <label className="f">
          <span>Rechercher un produit</span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Nom du produit"
          />
        </label>
      )}

      <div className="pick">
        {visibles.map((p) => {
          const image = adminImage(p);
          const checked = choix.includes(p.id);
          return (
            <label key={p.id}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  mode === "members"
                    ? setRemoved((ids) =>
                        ids.includes(p.id) ? ids.filter((id) => id !== p.id) : [...ids, p.id],
                      )
                    : setChoix((c) =>
                        c.includes(p.id) ? c.filter((x) => x !== p.id) : [...c, p.id],
                      )
                }
              />
              {image ? <img src={image} alt="" /> : <div className="ph">Ö</div>}
              <span className="grow">
                <b>{p.name}</b>
                {mode === "members" ? (
                  <small className="association-badges">
                    {statutAssociation(p, windows)
                      .split(" · ")
                      .map((status) => (
                        <span key={status}>{status}</span>
                      ))}
                  </small>
                ) : (
                  <small style={{ display: "block", color: "rgba(41,34,31,.5)" }}>
                    {adminEtat(p)}
                  </small>
                )}
              </span>
              <span style={{ fontSize: 11, color: "rgba(41,34,31,.45)" }}>{adminPrix(p)}</span>
            </label>
          );
        })}
        {visibles.length === 0 && (
          <div className="empty">
            {mode === "members"
              ? "Aucun produit n'appartient à cette collection."
              : "Aucun produit disponible à ajouter."}
          </div>
        )}
      </div>
      {mode === "members" && base.length > 0 && (
        <div className="hint" style={{ marginTop: -4, marginBottom: 14 }}>
          {base.length} produit(s) associé(s) à cette collection — y compris ceux qui ne sont pas
          (encore) visibles côté boutique.
        </div>
      )}

      <div className="hint">
        {mode === "members"
          ? `${base.length - aRetirer.length} produit(s) resteront dans cette collection.`
          : `${aAjouter.length} produit(s) sélectionné(s).`}
      </div>
    </Coquille>
  );
}

/* ================================= FAMILLE ================================= */

export function PanelFamille({
  row,
  ctx,
  onClose,
}: {
  row: FamilyRow | null;
  ctx: Contexte;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(row?.label ?? "");
  const [busy, setBusy] = useState(false);
  const membres = ctx.produits.filter((p) => !p.archived && p.family === row?.key);

  const enregistrer = async () => {
    const l = label.trim();
    if (!l) return toast.error("Le nom de la famille est obligatoire.");
    setBusy(true);
    try {
      await saveFamily({ data: { id: row?.id, key: row?.key ?? slugify(l), label: l } });
      await ctx.recharger();
      toast.success(row ? "Famille enregistrée." : `Famille « ${l} » créée.`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
    setBusy(false);
  };

  return (
    <Coquille
      kind={row ? "Famille" : "Nouvelle famille"}
      nom={label || "Sans nom"}
      onClose={onClose}
      onSave={() => void enregistrer()}
      busy={busy}
    >
      <div className="note" style={{ marginBottom: 18 }}>
        Une famille est un <b>vocabulaire</b>, pas un produit. « Kounefa Pistache » reste une fiche
        à part entière avec son prix, sa photo et son stock ; la famille sert à la relier aux autres
        parfums et à écrire « Pistache » pareil partout.
      </div>
      <label className="f">
        <span>Nom de la famille</span>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Kounefa" />
      </label>
      {row && (
        <>
          <div className="hint" style={{ marginTop: 0, marginBottom: 8 }}>
            {membres.length} produit{membres.length > 1 ? "s" : ""} dans cette famille. Pour en
            ajouter un, créez le produit et choisissez cette famille sur sa fiche.
          </div>
          <div className="pick">
            {membres.map((p) => (
              <label key={p.id} style={{ cursor: "default" }}>
                {p.image_url && <img src={p.image_url} alt="" />}
                <span className="grow">{p.flavor_label || p.name}</span>
                <span style={{ fontSize: 11, color: "rgba(41,34,31,.45)" }}>
                  {p.price ? euro(p.price) : "prix à définir"}
                </span>
              </label>
            ))}
          </div>
        </>
      )}
    </Coquille>
  );
}

/* ========================== AJOUTER UN PARFUM ========================== */

/**
 * Un parfum n'est pas une étiquette : c'est une fiche produit, avec son prix,
 * sa photo et son stock. « Ajouter un parfum » revient donc à rattacher un
 * produit qui existe déjà — ou à en créer un s'il manque vraiment.
 *
 * Les produits sans famille arrivent en tête : ce sont ceux qui attendent
 * d'être rangés, et c'est presque toujours l'un d'eux qu'on cherche.
 */
export function PanelAjoutParfum({
  famille,
  ctx,
  onClose,
}: {
  famille: FamilyRow;
  ctx: Contexte;
  onClose: () => void;
}) {
  const { produits, familles, recharger, ouvrir } = ctx;
  const vivants = useMemo(() => produits.filter((p) => !p.archived), [produits]);
  const libres = vivants.filter((p) => !p.family);
  const ailleurs = vivants.filter((p) => p.family && p.family !== famille.key);

  const [choisiId, setChoisiId] = useState("");
  const choisi = vivants.find((p) => p.id === choisiId) ?? null;

  /** Nom proposé : celui du produit débarrassé du nom de la famille. */
  const propose = useMemo(() => {
    if (!choisi) return "";
    if (choisi.flavor_label) return choisi.flavor_label;
    const sans = choisi.name.replace(new RegExp(`^\\s*${famille.label}\\s*`, "i"), "").trim();
    return sans || choisi.name;
  }, [choisi, famille.label]);

  const [parfum, setParfum] = useState("");
  useEffect(() => setParfum(propose), [propose]);

  const nomFamille = (key: string | null) =>
    key ? (familles.find((f) => f.key === key)?.label ?? key) : "";

  return (
    <Coquille kind="Ajouter un parfum" nom={famille.label} onClose={onClose}>
      <div className="note" style={{ marginBottom: 18 }}>
        Un parfum est une <b>fiche produit à part entière</b>, avec son prix, sa photo et son stock.
        Choisissez le produit à rattacher à <b>{famille.label}</b> — ou créez-le s'il n'existe pas
        encore.
      </div>

      <label className="f">
        <span>Produit à rattacher</span>
        <select
          value={choisiId}
          onChange={(e) => {
            if (e.target.value === "__new") {
              // La nouvelle fiche s'ouvre déjà rattachée à cette famille.
              ouvrir({ type: "produit", row: null, famille: famille.key });
              return;
            }
            setChoisiId(e.target.value);
          }}
        >
          <option value="">— choisir un produit —</option>
          {libres.length > 0 && (
            <optgroup label="Sans famille">
              {libres.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}
          {ailleurs.length > 0 && (
            <optgroup label="Déjà dans une autre famille">
              {ailleurs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </optgroup>
          )}
          <option value="__new">+ Créer un nouveau produit</option>
        </select>
        <div className="hint">
          Les produits sans famille arrivent en tête : ce sont ceux qui attendent d'être rangés.
        </div>
      </label>

      {choisi && (
        <>
          <div className="alrow" style={{ marginTop: 4 }}>
            {choisi.image_url && <img src={choisi.image_url} alt="" />}
            <div className="g">
              <div className="n">{choisi.name}</div>
              <div className="s">
                {choisi.price ? euro(choisi.price) : "prix à définir"}
                {(choisi.collections ?? []).length
                  ? ` · ${(choisi.collections ?? []).join(", ")}`
                  : ""}
              </div>
            </div>
          </div>

          {choisi.family && (
            <div className="note" style={{ borderLeftColor: "var(--gold)", margin: "12px 0" }}>
              Ce produit est aujourd'hui dans <b>{nomFamille(choisi.family)}</b>. Le rattacher ici
              l'y retirera : un produit n'appartient qu'à une seule famille.
            </div>
          )}

          <label className="f" style={{ marginTop: 12 }}>
            <span>Nom du parfum dans cette famille</span>
            <input
              value={parfum}
              onChange={(e) => setParfum(e.target.value)}
              placeholder="Pistache"
            />
            <div className="hint">
              C'est ce nom court qui s'affiche sous la vignette du bloc « Autres parfums », à la
              place du nom complet.
            </div>
          </label>

          <button
            type="button"
            className="btn-dark"
            style={{ marginTop: 6 }}
            onClick={() => {
              onClose();
              void agir(
                () =>
                  saveProduct({
                    data: {
                      id: choisi.id,
                      values: { family: famille.key, flavor_label: parfum.trim() || null },
                    },
                  }),
                `« ${choisi.name} » rejoint la famille ${famille.label}.`,
                recharger,
              );
            }}
          >
            Rattacher à {famille.label}
          </button>
        </>
      )}
    </Coquille>
  );
}

/* =============================== SUPPRESSION =============================== */

export function PanelSupprimer({
  row,
  ctx,
  onClose,
}: {
  row: ProductRow;
  ctx: Contexte;
  onClose: () => void;
}) {
  const [tape, setTape] = useState("");
  const ok = tape.trim().toLowerCase() === row.name.trim().toLowerCase();

  return (
    <Coquille kind="Supprimer définitivement" nom={row.name} onClose={onClose}>
      <div className="note" style={{ borderLeftColor: "#c0392b", marginBottom: 18 }}>
        Vous êtes sur le point de supprimer <b>« {row.name} »</b> pour de bon. La fiche, ses photos
        et son historique disparaissent. <b>Cette action est définitive</b> — il n'y a pas de
        corbeille.
      </div>
      <div className="hint" style={{ marginBottom: 10 }}>
        Si vous voulez juste le retirer de la boutique, fermez cette fenêtre : un produit archivé ne
        coûte rien et se remet en vente en un clic.
      </div>
      <label className="f">
        <span>Retapez le nom du produit pour confirmer</span>
        <input
          value={tape}
          onChange={(e) => setTape(e.target.value)}
          placeholder={row.name}
          autoComplete="off"
        />
      </label>
      <button
        type="button"
        className="btn-ghost danger"
        disabled={!ok}
        style={{ opacity: ok ? 1 : 0.4, cursor: ok ? "pointer" : "not-allowed" }}
        onClick={() => {
          onClose();
          void agir(
            () => deleteProductForever({ data: { id: row.id } }),
            `« ${row.name} » a été supprimé définitivement.`,
            ctx.recharger,
          );
        }}
      >
        Supprimer définitivement
      </button>
    </Coquille>
  );
}

/* ================================= ALERTES ================================= */

export function PanelAlertes({ ctx, onClose }: { ctx: Contexte; onClose: () => void }) {
  const liste = ctx.produits.filter(
    (r) => !r.archived && !r.stock_unlimited && (r.stock_qty ?? 0) <= (r.stock_alert ?? 0),
  );
  const zero = liste.filter((r) => (r.stock_qty ?? 0) === 0);
  const bientot = liste.filter((r) => (r.stock_qty ?? 0) > 0);

  const ligne = (r: ProductRow) => (
    <div className="alrow" key={r.id}>
      {r.image_url && <img src={r.image_url} alt="" />}
      <div className="g">
        <div className="n">{r.name}</div>
        <div className={`s ${(r.stock_qty ?? 0) === 0 ? "zero" : "low"}`}>
          {(r.stock_qty ?? 0) === 0
            ? "Épuisé — bouton d'achat désactivé en boutique"
            : `Plus que ${r.stock_qty} en réserve (seuil : ${r.stock_alert})`}
        </div>
      </div>
      <button
        type="button"
        className="btn-ghost"
        onClick={() =>
          void agir(
            () => addStock({ data: { id: r.id, delta: 10 } }),
            `« ${r.name} » : 10 ajoutés. Il est de nouveau en vente.`,
            ctx.recharger,
          )
        }
      >
        + 10
      </button>
    </div>
  );

  return (
    <Coquille
      kind="Alertes de stock"
      nom={
        liste.length
          ? `${liste.length} produit${liste.length > 1 ? "s" : ""} à surveiller`
          : "Tout va bien"
      }
      onClose={onClose}
    >
      {liste.length === 0 && (
        <div className="note">Aucun produit sous son seuil. Rien à faire.</div>
      )}
      {zero.length > 0 && (
        <div
          className="hint"
          style={{
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: ".08em",
            fontWeight: 700,
            color: "#c0392b",
          }}
        >
          Épuisés — plus vendables
        </div>
      )}
      {zero.map(ligne)}
      {bientot.length > 0 && (
        <div
          className="hint"
          style={{
            margin: "16px 0 8px",
            textTransform: "uppercase",
            letterSpacing: ".08em",
            fontWeight: 700,
            color: "#b8860b",
          }}
        >
          Bientôt finis
        </div>
      )}
      {bientot.map(ligne)}
      {liste.length > 0 && (
        <div className="hint" style={{ marginTop: 16 }}>
          Le seuil se règle produit par produit, dans « Stock &amp; réserve » sur la fiche.
          Réapprovisionner remet le produit en vente automatiquement.
        </div>
      )}
    </Coquille>
  );
}
