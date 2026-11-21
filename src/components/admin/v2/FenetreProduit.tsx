import { useMemo, useRef, useState } from "react";
import { saveProduct, setProductFlags } from "@/api/catalog";
import { addProductImage, setPrimaryImage, uploadProductImage } from "@/api/images";
import { saveFamily } from "@/api/families";
import type { ProductRow, ProductInput } from "@/lib/catalog";
import type { ProductVariant, SellMode } from "@/data/products";
import { isPatisserieCategory } from "@/lib/patisserie-scope";
import { adminImage } from "../core";
import { Ic, Inter, euro, slugifier, useV2, type Preset } from "./ui";

/*
 * La fenêtre « Modifier un produit » du prototype, en quatre étapes :
 * l'essentiel, la description, la famille, où l'afficher. À droite, la carte
 * telle que la cliente la verra. Les réglages fins (formats en pot, prix à la
 * main par grammage, stock) restent dans l'éditeur détaillé, un clic plus loin.
 */

const GRAMMES_BASE = [250, 500, 1000];
const ALLERGENES: [string, string][] = [
  ["gluten", "Gluten"],
  ["lait", "Lait"],
  ["oeuf", "Œuf"],
  ["fruits-coque", "Fruits à coque"],
  ["sesame", "Sésame"],
  ["soja", "Soja"],
];
const ETIQUETTES: [string, string][] = [
  ["", "Aucune"],
  ["nouveau", "Nouveauté"],
  ["bestseller", "Meilleure vente"],
  ["promo", "Promotion"],
  ["limitee", "Édition limitée"],
  ["commande", "Sur commande"],
];
const DELAIS = ["", "Commande 48 h avant", "Commande 72 h avant"];
const libGr = (g: number) => (g >= 1000 ? `${g / 1000} kg`.replace(".", ",") : `${g} g`);

type Univers = "patisserie" | "sale";
type Vente = "kg" | "" | "pot";

interface Brouillon {
  nom: string;
  univers: Univers;
  vente: Vente;
  prix: number;
  grammes: number[];
  pieces: number | null;
  visible: boolean;
  courte: string;
  description: string;
  compo: string;
  allergenes: string[];
  conservation: string;
  famille: string;
  parfum: string;
  cols: string[];
  badge: string;
  delai: string;
}

function depuis(
  row: ProductRow | null,
  preset: Preset | undefined,
  produits: ProductRow[],
): Brouillon {
  if (row) {
    const kg = (row.sell_options ?? []).filter((o) => typeof o.grams === "number");
    return {
      nom: row.name,
      univers: row.category === "sale" ? "sale" : "patisserie",
      vente: row.sell_mode === "kg" ? "kg" : row.sell_mode ? "pot" : "",
      prix: Number(row.price) || 0,
      grammes: kg.filter((o) => !o.hidden).map((o) => o.grams as number),
      pieces: row.pieces ?? null,
      visible: row.published && !row.draft,
      courte: row.short_desc ?? "",
      description: row.description ?? "",
      compo: (row.composition ?? []).join("\n"),
      allergenes: [...(row.allergens ?? [])],
      conservation: row.conservation ?? "",
      famille: row.family ?? "",
      parfum: row.flavor_label ?? "",
      cols: [...(row.collections ?? [])],
      badge: row.badge ?? "",
      delai: row.prep_lead ?? "",
    };
  }
  // Un nouveau parfum reprend la rubrique et la façon de vendre de sa famille.
  const modele = preset?.famille
    ? produits.find((p) => p.family === preset.famille && !p.archived)
    : null;
  const sale = preset?.univers === "sale";
  return {
    nom: "",
    univers: sale ? "sale" : "patisserie",
    vente: sale ? "" : modele?.sell_mode === "kg" || !modele ? "kg" : "pot",
    prix: 0,
    grammes: sale ? [] : [...GRAMMES_BASE],
    pieces: sale ? 40 : null,
    visible: true,
    courte: "",
    description: "",
    compo: "",
    allergenes: [],
    conservation: "",
    famille: preset?.famille ?? "",
    parfum: "",
    cols: preset?.collection ? [preset.collection] : modele ? [...(modele.collections ?? [])] : [],
    badge: "",
    delai: "",
  };
}

/** Les grammages au kilo : ceux cochés redeviennent visibles, les autres sont masqués, rien n'est perdu. */
function optionsKg(row: ProductRow | null, grammes: number[]): ProductVariant[] {
  const existantes = (row?.sell_options ?? []).filter((o) => typeof o.grams === "number");
  const toutes = Array.from(
    new Set([...existantes.map((o) => o.grams as number), ...grammes]),
  ).sort((a, b) => a - b);
  return toutes.map((g) => {
    const deja = existantes.find((o) => o.grams === g);
    const base: ProductVariant = deja ?? {
      id: `g-${g}`,
      grams: g,
      label: "",
      piecesEstimate: null,
    };
    return { ...base, hidden: !grammes.includes(g) };
  });
}

export function FenetreProduit({
  row,
  preset,
  onClose,
}: {
  row: ProductRow | null;
  preset?: Preset;
  onClose: () => void;
}) {
  const { ctx, message } = useV2();
  const [b, setB] = useState<Brouillon>(() => depuis(row, preset, ctx.produits));
  const [etape, setEtape] = useState(preset?.etape ?? 1);
  const [busy, setBusy] = useState(false);
  const [photo, setPhoto] = useState<{ apercu: string; fichier: File } | null>(null);
  const [nouvelleFam, setNouvelleFam] = useState("");
  const champPhoto = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Brouillon>(k: K, v: Brouillon[K]) => setB((x) => ({ ...x, [k]: v }));

  const saisons = useMemo(() => new Set(ctx.saisons.map((s) => s.season_key)), [ctx.saisons]);
  const rubriques = useMemo(
    () => [...ctx.collections].sort((x, y) => x.sort_order - y.sort_order),
    [ctx.collections],
  );
  const nomFamille = (k: string) => ctx.familles.find((f) => f.key === k)?.label ?? k;
  const autresParfums = b.famille
    ? ctx.produits.filter((p) => p.family === b.famille && p.id !== row?.id && !p.archived)
    : [];
  const imageActuelle = photo?.apercu ?? (row ? adminImage(row) : "");
  const grammesAffiches = Array.from(
    new Set([
      ...GRAMMES_BASE,
      ...(row?.sell_options ?? [])
        .filter((o) => typeof o.grams === "number")
        .map((o) => o.grams as number),
    ]),
  ).sort((x, y) => x - y);

  const titre = row
    ? b.nom || "Produit"
    : b.famille
      ? `Nouveau parfum de ${nomFamille(b.famille)}`
      : preset?.collection
        ? `Nouveau produit pour ${rubriques.find((c) => c.product_key === preset.collection)?.label ?? ""}`
        : "Nouveau produit";

  const enregistrer = async () => {
    const nom = b.nom.trim();
    if (!nom) {
      setEtape(1);
      return message("Il manque le nom du produit");
    }
    if (b.univers === "patisserie" && !b.cols.length) {
      setEtape(4);
      return message(
        "Choisissez au moins une rubrique, sinon le produit n'apparaîtra pas dans le menu",
      );
    }
    const category =
      b.univers === "sale"
        ? "sale"
        : row && isPatisserieCategory(row.category)
          ? row.category
          : "traditionnelle";
    const values: ProductInput = {
      name: nom,
      category,
      price: b.prix,
      published: b.visible,
      short_desc: b.courte,
      description: b.description,
      composition: b.compo
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean),
      allergens: b.allergenes as ProductRow["allergens"],
      conservation: b.conservation,
      family: b.famille || null,
      flavor_label: b.famille ? b.parfum.trim() || null : null,
      collections: b.univers === "sale" ? [] : b.cols,
      badge: (b.badge || null) as ProductRow["badge"],
      prep_lead: b.delai || null,
    };
    if (b.famille && !row?.product_type) values.product_type = "parfum-simple";
    if (b.vente === "kg") {
      values.sell_mode = "kg";
      values.sell_options = optionsKg(row, b.grammes);
    } else if (b.vente === "") {
      values.sell_mode = "" as SellMode;
      values.sell_options = [];
      values.pieces = b.pieces;
    }
    // « En pot ou taille » : les formats existants ne bougent pas ici.
    if (!row) {
      const pris = new Set(ctx.produits.map((p) => p.slug));
      let slug = slugifier(nom);
      for (let i = 2; pris.has(slug); i++) slug = `${slugifier(nom)}-${i}`;
      Object.assign(values, { slug, draft: false, archived: false });
      if (b.vente === "pot") {
        values.sell_mode = "pot";
        values.sell_options = [];
      }
    }
    setBusy(true);
    try {
      const saved = await saveProduct({ data: { id: row?.id, values } });
      if (photo) {
        const base64 = await new Promise<string>((ok, ko) => {
          const lecteur = new FileReader();
          lecteur.onload = () => ok(String(lecteur.result).split(",")[1] ?? "");
          lecteur.onerror = () => ko(new Error("Photo illisible."));
          lecteur.readAsDataURL(photo.fichier);
        });
        const { url } = await uploadProductImage({
          data: { fileName: photo.fichier.name, contentType: photo.fichier.type, base64 },
        });
        const image = await addProductImage({ data: { productId: saved.id, url } });
        if (!image.is_primary) await setPrimaryImage({ data: { id: image.id } });
      }
      await ctx.recharger();
      onClose();
      message(
        !row && b.famille
          ? `Parfum « ${b.parfum || nom} » ajouté à la famille ${nomFamille(b.famille)}`
          : `« ${nom} » est enregistré`,
      );
      if (!row && b.vente === "pot") {
        // Les formats (pot, bol, 6 parts…) se règlent dans l'éditeur détaillé.
        ctx.ouvrir({ type: "produit", row: saved });
      }
    } catch (e) {
      message(e instanceof Error ? e.message : "Enregistrement impossible.");
    }
    setBusy(false);
  };

  const retirer = async () => {
    if (!row) return;
    if (!window.confirm(`Retirer « ${row.name} » du site ? Il sera archivé, pas supprimé.`)) return;
    await setProductFlags({ data: { id: row.id, archived: true } });
    await ctx.recharger();
    onClose();
    message(`« ${row.name} » est retiré du site`, async () => {
      await setProductFlags({ data: { id: row.id, archived: false } });
      await ctx.recharger();
    });
  };

  const creerFamille = async () => {
    const label = nouvelleFam.trim();
    if (!label) return message("Écrivez d'abord le nom de la nouvelle famille");
    const key = slugifier(label);
    if (!ctx.familles.some((f) => f.key === key)) await saveFamily({ data: { key, label } });
    await ctx.recharger();
    set("famille", key);
    setNouvelleFam("");
    message(`Famille « ${label} » créée`);
  };

  /* ---------------------------------------------------------------- étapes */

  const essentiel = (
    <>
      <div className="photo-zone">
        <div className="vign">
          {imageActuelle ? (
            <img src={imageActuelle} alt="" />
          ) : (
            <span className="sansphoto">Ajouter une photo</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <b>Photo du produit</b>
          <small>Glissez une photo ici, ou cliquez pour en choisir une.</small>
        </div>
        <button
          type="button"
          className="btn second petit"
          onClick={() => champPhoto.current?.click()}
        >
          <Ic n="photo" /> Choisir
        </button>
        <input
          ref={champPhoto}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPhoto({ apercu: URL.createObjectURL(f), fichier: f });
          }}
        />
      </div>
      <div className="champ">
        <label>Nom du produit</label>
        <input
          value={b.nom}
          onChange={(e) => set("nom", e.target.value)}
          placeholder="Ex. : Kaak warka"
        />
      </div>
      <div className="champ">
        <label>C'est…</label>
      </div>
      <div className="choix-vente" style={{ gridTemplateColumns: "1fr 1fr", marginTop: -8 }}>
        <button
          type="button"
          className={`choix${b.univers === "patisserie" ? " on" : ""}`}
          onClick={() => set("univers", "patisserie")}
        >
          <b>Une pâtisserie</b>
          <small>Menu « Pâtisserie Tunisienne »</small>
        </button>
        <button
          type="button"
          className={`choix${b.univers === "sale" ? " on" : ""}`}
          onClick={() => setB((x) => ({ ...x, univers: "sale", vente: "", grammes: [], cols: [] }))}
        >
          <b>Un plateau salé</b>
          <small>Menu « Salé »</small>
        </button>
      </div>
      <div className="champ">
        <label>Comment le vendez-vous ?</label>
      </div>
      <div className="choix-vente" style={{ marginTop: -8 }}>
        <button
          type="button"
          className={`choix${b.vente === "kg" ? " on" : ""}`}
          onClick={() =>
            setB((x) => ({
              ...x,
              vente: "kg",
              grammes: x.grammes.length ? x.grammes : [...GRAMMES_BASE],
            }))
          }
        >
          <b>Au poids</b>
          <small>250 g, 500 g, 1 kg…</small>
        </button>
        <button
          type="button"
          className={`choix${b.vente === "" ? " on" : ""}`}
          onClick={() => set("vente", "")}
        >
          <b>À l'unité</b>
          <small>Un plateau, une boîte…</small>
        </button>
        <button
          type="button"
          className={`choix${b.vente === "pot" ? " on" : ""}`}
          onClick={() => set("vente", "pot")}
        >
          <b>En pot ou taille</b>
          <small>Pot, bol, 6 ou 12 parts</small>
        </button>
      </div>
      {b.vente !== "pot" && (
        <div className="grille2">
          <div className="champ">
            <label>{b.vente === "kg" ? "Prix pour 1 kg" : "Prix"}</label>
            <div className="euro">
              <input
                inputMode="decimal"
                value={b.prix ? String(b.prix).replace(".", ",") : ""}
                placeholder="0,00"
                onChange={(e) => set("prix", parseFloat(e.target.value.replace(",", ".")) || 0)}
              />
            </div>
          </div>
          {b.vente === "" && (
            <div className="champ">
              <label>
                Nombre de pièces{" "}
                <span style={{ color: "var(--gris)", fontWeight: 400 }}>(facultatif)</span>
              </label>
              <input
                inputMode="numeric"
                value={b.pieces ?? ""}
                placeholder="40"
                onChange={(e) => set("pieces", parseInt(e.target.value) || null)}
              />
            </div>
          )}
        </div>
      )}
      {b.vente === "kg" && (
        <>
          <div className="champ">
            <label>Quantités proposées</label>
            <span className="aide">Le prix se calcule tout seul à partir du prix au kilo.</span>
          </div>
          <div className="formats">
            {grammesAffiches.map((g) => {
              const on = b.grammes.includes(g);
              return (
                <button
                  type="button"
                  key={g}
                  className={`format${on ? " on" : ""}`}
                  onClick={() =>
                    set("grammes", on ? b.grammes.filter((x) => x !== g) : [...b.grammes, g])
                  }
                >
                  <span>
                    <b>{libGr(g)}</b>
                    <small>{euro((b.prix * g) / 1000)}</small>
                  </span>
                  <span className="coche">
                    <Ic n="check" />
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}
      {b.vente === "pot" && (
        <div className="conseil">
          <Ic n="info" />
          <span>
            Les pots, bols et tailles (6 ou 12 parts) ont chacun leur prix : ils se règlent dans
            l'éditeur détaillé, qui s'ouvre{" "}
            {row ? "avec le bouton « Réglages avancés » en bas" : "juste après l'enregistrement"}.
          </span>
        </div>
      )}
      <div className="ligne-reglage" style={{ marginTop: 14, borderTop: "1px solid var(--ligne)" }}>
        <div>
          <b>Visible sur le site</b>
          <small>Décochez pour le cacher sans le supprimer.</small>
        </div>
        <Inter on={b.visible} onClick={() => set("visible", !b.visible)} />
      </div>
    </>
  );

  const description = (
    <>
      <div className="conseil">
        <Ic n="info" />
        <span>Une phrase courte suffit. Les clientes lisent surtout la photo et le prix.</span>
      </div>
      <div className="champ">
        <label>Phrase courte</label>
        <input
          value={b.courte}
          onChange={(e) => set("courte", e.target.value)}
          placeholder="Ex. : Anneau de pâte fine, crème d'amandes à l'eau d'églantine."
        />
        <span className="aide">Affichée sous le nom, sur la fiche du produit.</span>
      </div>
      <div className="champ">
        <label>
          Description complète{" "}
          <span style={{ color: "var(--gris)", fontWeight: 400 }}>(facultatif)</span>
        </label>
        <textarea
          value={b.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Ce qui rend ce produit spécial, comment le servir…"
        />
      </div>
      <div className="champ">
        <label>
          Ce qu'il contient{" "}
          <span style={{ color: "var(--gris)", fontWeight: 400 }}>(un élément par ligne)</span>
        </label>
        <textarea
          value={b.compo}
          onChange={(e) => set("compo", e.target.value)}
          placeholder={"Amandes\nMiel\nEau de fleur d'oranger"}
        />
      </div>
      <div className="champ">
        <label>Allergènes</label>
      </div>
      <div className="cases" style={{ marginTop: -8 }}>
        {ALLERGENES.map(([v, l]) => {
          const on = b.allergenes.includes(v);
          return (
            <button
              type="button"
              key={v}
              className={`case${on ? " on" : ""}`}
              onClick={() =>
                set("allergenes", on ? b.allergenes.filter((x) => x !== v) : [...b.allergenes, v])
              }
            >
              <span className="coche">
                <Ic n="check" />
              </span>
              {l}
            </button>
          );
        })}
      </div>
      <div className="champ" style={{ marginTop: 16 }}>
        <label>Conservation</label>
        <input
          value={b.conservation}
          onChange={(e) => set("conservation", e.target.value)}
          placeholder="Ex. : 15 jours en boîte hermétique."
        />
      </div>
    </>
  );

  const famille = (
    <>
      <div className="conseil">
        <Ic n="info" />
        <span>
          Une <b>famille</b> regroupe le même produit en plusieurs parfums — ex. Dattes farcies :
          Abricot, Noix, Pistache… Sur le site, chaque fiche montre les autres parfums de sa
          famille.
        </span>
      </div>
      <div className="champ">
        <label>Ce produit fait-il partie d'une famille ?</label>
      </div>
      <div className="fam-choix">
        <button
          type="button"
          className={`choix${!b.famille ? " on" : ""}`}
          onClick={() => setB((x) => ({ ...x, famille: "", parfum: "" }))}
        >
          <b>Non, produit seul</b>
          <small>Ex. : Libanais, Kaak amber</small>
        </button>
        {ctx.familles.map((f) => {
          const n = ctx.produits.filter((p) => p.family === f.key && !p.archived).length;
          return (
            <button
              type="button"
              key={f.key}
              className={`choix${b.famille === f.key ? " on" : ""}`}
              onClick={() => set("famille", f.key)}
            >
              <b>{f.label}</b>
              <small>
                {n} parfum{n > 1 ? "s" : ""} déjà
              </small>
            </button>
          );
        })}
      </div>
      <div className="nouvelle-fam">
        <input
          value={nouvelleFam}
          onChange={(e) => setNouvelleFam(e.target.value)}
          placeholder="Une famille qui n'existe pas encore ? Écrivez son nom…"
        />
        <button type="button" className="btn second petit" onClick={creerFamille}>
          <Ic n="plus" /> Créer
        </button>
      </div>
      {b.famille && (
        <>
          <div className="champ" style={{ marginTop: 20 }}>
            <label>Son parfum dans la famille {nomFamille(b.famille)}</label>
            <input
              value={b.parfum}
              onChange={(e) => set("parfum", e.target.value)}
              placeholder="Ex. : Abricot, Droo, Pistache…"
            />
            <span className="aide">
              C'est ce mot qui s'affiche sous « Autres parfums » sur le site.
            </span>
          </div>
          <div className="deja">
            {autresParfums.length ? (
              <>
                <span>Déjà dans la famille :</span>
                {autresParfums.map((p) => (
                  <em key={p.id}>{p.flavor_label || p.name}</em>
                ))}
              </>
            ) : (
              <span>C'est le premier parfum de cette famille.</span>
            )}
          </div>
        </>
      )}
    </>
  );

  const affichage =
    b.univers === "sale" ? (
      <>
        <div className="conseil">
          <Ic n="info" />
          <span>
            Les plateaux salés vont automatiquement dans le menu <b>Salé</b> et sur la page Plateaux
            salés. Rien à choisir ici.
          </span>
        </div>
        <ChampEtiquette valeur={b.badge} onChange={(v) => set("badge", v)} />
      </>
    ) : (
      <>
        <div className="champ">
          <label>Dans quelles rubriques du menu ?</label>
          <span className="aide">
            Vous pouvez en cocher plusieurs : le produit apparaîtra dans chacune.
          </span>
        </div>
        <div className="cases">
          {rubriques.map((c) => {
            const on = b.cols.includes(c.product_key);
            return (
              <button
                type="button"
                key={c.id}
                className={`case${on ? " on" : ""}`}
                onClick={() =>
                  set(
                    "cols",
                    on ? b.cols.filter((x) => x !== c.product_key) : [...b.cols, c.product_key],
                  )
                }
              >
                <span className="coche">
                  <Ic n="check" />
                </span>
                <span>
                  {c.label}
                  <small>
                    {c.hidden
                      ? "Rubrique cachée"
                      : saisons.has(c.product_key)
                        ? "Fête"
                        : "Rubrique du menu"}
                  </small>
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 18 }}>
          <ChampEtiquette valeur={b.badge} onChange={(v) => set("badge", v)} />
        </div>
        <div className="champ">
          <label>
            Délai de préparation{" "}
            <span style={{ color: "var(--gris)", fontWeight: 400 }}>(facultatif)</span>
          </label>
          <select value={b.delai} onChange={(e) => set("delai", e.target.value)}>
            {Array.from(new Set([...DELAIS, b.delai])).map((d) => (
              <option key={d} value={d}>
                {d || "Délai normal de la boutique"}
              </option>
            ))}
          </select>
        </div>
      </>
    );

  /* ---------------------------------------------------------------- aperçu */
  const premiere = rubriques.find((c) => b.cols.includes(c.product_key));
  const prixApercu = b.prix
    ? b.vente === "kg"
      ? `${euro(b.prix)} /kg`
      : euro(b.prix)
    : "Prix à indiquer";
  const fmt =
    b.vente === "kg"
      ? [...b.grammes]
          .sort((x, y) => x - y)
          .map(libGr)
          .join(" · ")
      : b.pieces
        ? `${b.pieces} pièces`
        : "";
  const etiquette = ETIQUETTES.find(([v]) => v === b.badge)?.[1];

  return (
    <div className="voile show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modale">
        <div className="m-tete">
          <div className="haut">
            <div>
              <h2 className="titre">{titre}</h2>
              <p>
                {row
                  ? "Modifiez ce qui doit changer, puis enregistrez."
                  : "Remplissez l'essentiel : le reste peut attendre."}
              </p>
            </div>
            <button type="button" className="fermer" onClick={onClose} aria-label="Fermer">
              <Ic n="x" />
            </button>
          </div>
          <div className="onglets">
            {["L'essentiel", "Description", "Famille", "Où l'afficher"].map((l, i) => (
              <button
                type="button"
                key={l}
                className={`onglet${etape === i + 1 ? " on" : ""}`}
                onClick={() => setEtape(i + 1)}
              >
                <span className="n">{i + 1}</span>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="m-corps">
          <div className="m-form">
            {etape === 1
              ? essentiel
              : etape === 2
                ? description
                : etape === 3
                  ? famille
                  : affichage}
          </div>
          <aside className="m-apercu">
            <div className="eti">Aperçu sur le site</div>
            <div className="carte-boutique">
              <div className="ph">
                {imageActuelle ? (
                  <img src={imageActuelle} alt="" />
                ) : (
                  <span className="vide">Ö</span>
                )}
                {b.badge && etiquette ? <span className="bdg">{etiquette}</span> : null}
              </div>
              <div className="col">
                {b.univers === "sale" ? "Plateaux salés" : (premiere?.label ?? "—")}
              </div>
              <div className="nm">{b.nom || "Nom du produit"}</div>
              <div className="px">{b.vente === "pot" ? "Prix par format" : prixApercu}</div>
              <div className="fmt">{fmt}</div>
            </div>
            {b.famille && (
              <div className="autres">
                <div className="eti" style={{ margin: "14px 0 8px" }}>
                  Autres parfums — {nomFamille(b.famille)}
                </div>
                <div className="ronds">
                  {autresParfums.map((p) => (
                    <span key={p.id}>
                      <i>{adminImage(p) ? <img src={adminImage(p)} alt="" /> : "Ö"}</i>
                      {p.flavor_label || p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className={`etat-apercu ${b.visible ? "oui" : "non"}`}>
              {b.visible
                ? "Visible par les clientes après l'enregistrement."
                : "Caché : les clientes ne le verront pas."}
            </div>
          </aside>
        </div>
        <div className="m-pied">
          {row ? (
            <span style={{ display: "flex", gap: 8 }}>
              <button type="button" className="btn danger" onClick={retirer}>
                <Ic n="poubelle" /> Retirer du site
              </button>
              <button
                type="button"
                className="btn discret"
                onClick={() => {
                  onClose();
                  ctx.ouvrir({ type: "produit", row });
                }}
              >
                Réglages avancés
              </button>
            </span>
          ) : (
            <span />
          )}
          <div className="droite">
            <button type="button" className="btn discret" onClick={onClose}>
              Annuler
            </button>
            {etape < 4 && (
              <button type="button" className="btn second" onClick={() => setEtape(etape + 1)}>
                Suivant
              </button>
            )}
            <button type="button" className="btn principal" onClick={enregistrer} disabled={busy}>
              <Ic n="check" /> {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChampEtiquette({ valeur, onChange }: { valeur: string; onChange: (v: string) => void }) {
  return (
    <div className="champ">
      <label>Petite étiquette sur la photo</label>
      <select value={valeur} onChange={(e) => onChange(e.target.value)}>
        {ETIQUETTES.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
