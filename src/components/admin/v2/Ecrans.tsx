import { useMemo, useState } from "react";
import { saveProduct, setProductFlags } from "@/api/catalog";
import {
  addProductsToCollection,
  removeProductsFromCollection,
  saveCollection,
  type CollectionRow,
} from "@/api/collections";
import { saveFamily } from "@/api/families";
import { saveSettings, type ShopSettings } from "@/api/settings";
import { setOrderStatus, type OrderRow } from "@/api/orders";
import type { ProductRow } from "@/lib/catalog";
import { filterPatisserieRows } from "@/lib/patisserie-scope";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/order-rules";
import { FULFILLMENT_LABELS } from "@/lib/fulfillment";
import { products as statiques, giftCategories } from "@/data/products";
import { adminImage, dispo, enBoutique } from "../core";
import { Aide, Ic, Inter, euro, prixListe, slugifier, useV2 } from "./ui";

/* ================================================================ outils */

const enLigne = (r: ProductRow) => r.published && !r.draft && !r.archived;
const nouvelles = (o: OrderRow[]) => o.filter((c) => c.status === "nouvelle").length;
const ilYa7Jours = () => Date.now() - 7 * 24 * 3600 * 1000;

function Entete({
  titre,
  sous,
  bouton,
}: {
  titre: string;
  sous: string;
  bouton?: React.ReactNode;
}) {
  return (
    <div className="entete">
      <div>
        <h1 className="titre">{titre}</h1>
        <p>{sous}</p>
      </div>
      {bouton}
    </div>
  );
}

/* ================================================================ Accueil */

export function EcranAccueil({ aller }: { aller: (e: string, filtre?: string) => void }) {
  const { ctx, modifier } = useV2();
  const vivants = enBoutique(ctx.produits);
  const sansPhoto = vivants.filter((r) => enLigne(r) && !adminImage(r)).length;
  const epuises = vivants.filter((r) => !dispo(r)).length;
  const n = nouvelles(ctx.commandes);
  const semaine = ctx.commandes.filter(
    (c) => new Date(c.created_at).getTime() > ilYa7Jours() && c.status !== "annulee",
  );
  return (
    <>
      <div className="entete">
        <div>
          <h1 className="titre">Bonjour</h1>
          <p>Que voulez-vous faire aujourd'hui ?</p>
        </div>
      </div>
      <div className="actions">
        <button type="button" className="action" onClick={() => modifier(null)}>
          <div className="rond">
            <Ic n="plus" />
          </div>
          <b>Ajouter un produit</b>
          <span>Une pâtisserie ou un plateau</span>
        </button>
        <button type="button" className="action" onClick={() => aller("produits")}>
          <div className="rond">
            <Ic n="euro" />
          </div>
          <b>Changer un prix</b>
          <span>Cliquez sur le prix, tapez, c'est fait</span>
        </button>
        <button type="button" className="action" onClick={() => aller("commandes")}>
          <div className="rond">
            <Ic n="recu" />
          </div>
          <b>Voir les commandes</b>
          <span>
            {n} nouvelle{n > 1 ? "s" : ""} à préparer
          </span>
        </button>
        <button type="button" className="action" onClick={() => aller("collections")}>
          <div className="rond">
            <Ic n="menuSite" />
          </div>
          <b>Organiser le menu</b>
          <span>Ce que voient vos clientes</span>
        </button>
      </div>
      <div className="deux">
        <div className="carte bloc">
          <h2 className="titre">À faire</h2>
          <p className="sous">Les points qui demandent votre attention.</p>
          <div className="afaire">
            <div className="tache">
              <span className="num rouge">{n}</span>
              <div>
                <b>Commandes à confirmer</b>
                <small>Les clientes attendent votre réponse.</small>
              </div>
              <button type="button" className="btn second petit" onClick={() => aller("commandes")}>
                Voir
              </button>
            </div>
            <div className="tache">
              <span className="num ambre">{sansPhoto}</span>
              <div>
                <b>Produits sans photo</b>
                <small>Une photo aide beaucoup à vendre.</small>
              </div>
              <button
                type="button"
                className="btn second petit"
                onClick={() => aller("produits", "sansphoto")}
              >
                Ajouter
              </button>
            </div>
            <div className="tache">
              <span className={`num ${epuises ? "rouge" : "vert"}`}>{epuises}</span>
              <div>
                <b>{epuises > 1 ? "Produits épuisés" : "Produit épuisé"}</b>
                <small>
                  {epuises ? "À réapprovisionner ou à cacher." : "Tout est disponible."}
                </small>
              </div>
            </div>
          </div>
        </div>
        <div className="carte bloc">
          <h2 className="titre">Votre boutique</h2>
          <p className="sous">En un coup d'œil.</p>
          <div className="chiffres">
            <div className="chiffre">
              <b>{vivants.filter(enLigne).length}</b>
              <span>produits en ligne</span>
            </div>
            <div className="chiffre">
              <b>{ctx.collections.filter((c) => c.published && !c.hidden).length}</b>
              <span>rubriques dans le menu</span>
            </div>
            <div className="chiffre">
              <b>{semaine.length}</b>
              <span>commandes cette semaine</span>
            </div>
            <div className="chiffre">
              <b>{euro(semaine.reduce((s, c) => s + Number(c.total), 0)).replace(",00", "")}</b>
              <span>de ventes cette semaine</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ================================================================ Produits (Pâtisserie, Salé) */

export function EcranListe({
  univers,
  filtreInitial,
}: {
  univers: "patisserie" | "sale";
  filtreInitial?: string;
}) {
  const { ctx, modifier, message } = useV2();
  const [filtre, setFiltre] = useState(filtreInitial ?? "tout");
  const [recherche, setRecherche] = useState("");
  const [prixEnCours, setPrixEnCours] = useState<string | null>(null);

  const duUnivers = useMemo(
    () =>
      (univers === "sale"
        ? ctx.produits.filter((r) => r.category === "sale")
        : filterPatisserieRows(ctx.produits)
      ).filter((r) => !r.archived),
    [ctx.produits, univers],
  );
  const FILTRES: [string, string, (r: ProductRow) => boolean][] = [
    ["tout", "Tout", () => true],
    ["masques", "Cachés", (r) => !enLigne(r)],
    ["sansphoto", "Sans photo", (r) => !adminImage(r)],
  ];
  const f = (FILTRES.find((x) => x[0] === filtre) ?? FILTRES[0])[2];
  const liste = duUnivers
    .filter(f)
    .filter((r) => !recherche || r.name.toLowerCase().includes(recherche.toLowerCase()));
  const rubriques = [...ctx.collections].sort((a, b) => a.sort_order - b.sort_order);
  const visibles = rubriques.filter((c) => c.published && !c.hidden);
  const premiere = (r: ProductRow) =>
    visibles.find((c) => (r.collections ?? []).includes(c.product_key));

  const groupes: [string, ProductRow[]][] = [];
  if (univers === "patisserie") {
    for (const c of visibles) {
      const items = liste.filter((r) => premiere(r)?.id === c.id);
      if (items.length) groupes.push([c.label, items]);
    }
    const hors = liste.filter((r) => !premiere(r));
    if (hors.length) groupes.push(["Pas dans le menu", hors]);
  } else if (liste.length) groupes.push(["Plateaux salés", liste]);

  const nomFamille = (k: string) => ctx.familles.find((x) => x.key === k)?.label ?? k;
  const nomRubrique = (k: string) => rubriques.find((c) => c.product_key === k)?.label ?? k;

  const basculer = async (r: ProductRow) => {
    const visible = !enLigne(r);
    await setProductFlags({ data: { id: r.id, published: visible } });
    await ctx.recharger();
    message(
      `« ${r.name} » est maintenant ${visible ? "visible" : "caché"} sur le site`,
      async () => {
        await setProductFlags({ data: { id: r.id, published: !visible } });
        await ctx.recharger();
      },
    );
  };
  const changerPrix = async (r: ProductRow, texte: string) => {
    setPrixEnCours(null);
    const v = parseFloat(texte.replace(",", "."));
    const avant = Number(r.price);
    if (!(v > 0) || v === avant) return;
    try {
      await saveProduct({ data: { id: r.id, values: { price: v } } });
      await ctx.recharger();
      message(`Nouveau prix de « ${r.name} » : ${euro(v)}`, async () => {
        await saveProduct({ data: { id: r.id, values: { price: avant } } });
        await ctx.recharger();
      });
    } catch (e) {
      message(e instanceof Error ? e.message : "Prix non enregistré.");
    }
  };

  const titre = univers === "sale" ? "Salé" : "Pâtisserie Tunisienne";
  return (
    <>
      <Entete
        titre={titre}
        sous={`Les produits de la partie « ${titre} » du site. Cliquez sur un prix pour le changer.`}
        bouton={
          <button
            type="button"
            className="btn principal"
            onClick={() => modifier(null, { univers })}
          >
            <Ic n="plus" /> Ajouter {univers === "sale" ? "un plateau" : "une pâtisserie"}
          </button>
        }
      />
      <Aide
        cle="produits"
        lignes={[
          "Pour changer un prix : cliquez dessus, tapez le nouveau, appuyez sur Entrée.",
          "Pour cacher un produit du site : cliquez sur l'interrupteur « Visible ».",
          "Pour tout le reste (photo, texte, rubriques) : « Modifier ».",
        ]}
      />
      <div className="barre">
        <div className="filtres">
          {FILTRES.map(([k, l, fn]) => (
            <button
              type="button"
              key={k}
              className={`filtre${filtre === k ? " on" : ""}`}
              onClick={() => setFiltre(k)}
            >
              {l}
              <small>{duUnivers.filter(fn).length}</small>
            </button>
          ))}
        </div>
        <label className="recherche">
          <Ic n="loupe" />
          <input
            placeholder="Chercher un produit…"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
          />
        </label>
      </div>
      {groupes.length ? (
        groupes.map(([titreGroupe, items]) => (
          <div className="carte groupe" key={titreGroupe}>
            <h3>
              {titreGroupe}{" "}
              <em>
                {items.length} produit{items.length > 1 ? "s" : ""}
              </em>
            </h3>
            <div className="thead">
              <span>Produit</span>
              <span>Prix</span>
              <span>Sur le site</span>
              <span />
            </div>
            <div className="liste">
              {items.map((r) => {
                const prix = prixListe(r);
                const img = adminImage(r);
                return (
                  <div className={`ligne${enLigne(r) ? "" : " masque"}`} key={r.id}>
                    <div className="produit">
                      <div className="vign">
                        {img ? (
                          <img src={img} alt="" />
                        ) : (
                          <span className="sansphoto">Ajouter une photo</span>
                        )}
                      </div>
                      <div className="nomprod">
                        <b>{r.name}</b>
                        <div className="etiquettes">
                          {r.family && (
                            <span className="etiq fam">
                              {nomFamille(r.family)}
                              {r.flavor_label ? ` · ${r.flavor_label}` : ""}
                            </span>
                          )}
                          {univers === "patisserie" ? (
                            (r.collections ?? []).map((c) => (
                              <span className="etiq" key={c}>
                                {nomRubrique(c)}
                              </span>
                            ))
                          ) : r.pieces ? (
                            <span className="etiq">{r.pieces} pièces</span>
                          ) : null}
                          {!img && <span className="etiq avert">Sans photo</span>}
                        </div>
                      </div>
                    </div>
                    <div className="prix col-prix">
                      {prixEnCours === r.id ? (
                        <>
                          <input
                            autoFocus
                            inputMode="decimal"
                            defaultValue={String(Number(r.price)).replace(".", ",")}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void changerPrix(r, e.currentTarget.value);
                              if (e.key === "Escape") setPrixEnCours(null);
                            }}
                            onBlur={(e) => void changerPrix(r, e.currentTarget.value)}
                          />
                          <small>€{r.sell_mode === "kg" ? " / kg" : ""}</small>
                        </>
                      ) : (
                        <button
                          type="button"
                          title={
                            prix.modifiable ? "Changer le prix" : "Prix par format : « Modifier »"
                          }
                          onClick={() => (prix.modifiable ? setPrixEnCours(r.id) : modifier(r))}
                        >
                          {prix.texte}
                        </button>
                      )}
                    </div>
                    <div className="col-visible">
                      <Inter on={enLigne(r)} onClick={() => void basculer(r)} />
                    </div>
                    <div className="col-action">
                      <button
                        type="button"
                        className="btn second petit"
                        onClick={() => modifier(r)}
                      >
                        <Ic n="crayon" /> Modifier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="carte bloc" style={{ textAlign: "center" }}>
          Aucun produit ne correspond.
        </div>
      )}
    </>
  );
}

/* ================================================================ Familles */

export function EcranFamillesV2() {
  const { ctx, modifier, message } = useV2();
  const [nouvelle, setNouvelle] = useState(false);
  const [nom, setNom] = useState("");
  const creer = async () => {
    const label = nom.trim();
    if (!label) return message("Écrivez le nom de la famille");
    await saveFamily({ data: { key: slugifier(label), label } });
    await ctx.recharger();
    setNouvelle(false);
    setNom("");
    message(`Famille « ${label} » créée — ajoutez-lui ses parfums`);
  };
  return (
    <>
      <Entete
        titre="Familles"
        sous="Le même produit en plusieurs parfums, regroupé."
        bouton={
          <button type="button" className="btn principal" onClick={() => setNouvelle(true)}>
            <Ic n="plus" /> Nouvelle famille
          </button>
        }
      />
      <Aide
        cle="familles"
        lignes={[
          "Une famille regroupe le même produit en plusieurs parfums : Ghrayba pois chiche, Ghrayba droo…",
          "Sur le site, la fiche de chaque parfum montre les autres en dessous, sous « Autres parfums ».",
          "Pour un nouveau parfum : « + Ajouter un parfum » sur la bonne famille.",
        ]}
      />
      <div className="familles">
        {ctx.familles.map((fa) => {
          const parfums = ctx.produits.filter((p) => p.family === fa.key && !p.archived);
          return (
            <div className="carte famille" key={fa.id}>
              <div className="f-tete">
                <div>
                  <h3>{fa.label}</h3>
                  <span>
                    {parfums.length} parfum{parfums.length > 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn principal petit"
                  onClick={() => modifier(null, { famille: fa.key })}
                >
                  <Ic n="plus" /> Ajouter un parfum
                </button>
              </div>
              <div className="parfums">
                {parfums.length ? (
                  parfums.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className={`parfum${enLigne(p) ? "" : " masque"}`}
                      onClick={() => modifier(p)}
                      title={`Modifier ${p.name}`}
                    >
                      <span className="vign">
                        {adminImage(p) ? (
                          <img src={adminImage(p)} alt="" />
                        ) : (
                          <span className="sansphoto">Ö</span>
                        )}
                      </span>
                      <span className="pt">
                        <b>
                          {p.flavor_label || p.name}
                          {p.product_type === "assortiment" && (
                            <em className="assort">assortiment</em>
                          )}
                        </b>
                        <small>
                          {(() => {
                            const px = prixListe(p);
                            return typeof px.texte === "string" ? px.texte : null;
                          })()}
                          {p.sell_mode === "kg" ? `${euro(Number(p.price))} / kg` : ""}
                          {enLigne(p) ? "" : " · caché"}
                        </small>
                      </span>
                      <Ic n="crayon" />
                    </button>
                  ))
                ) : (
                  <p className="vide-fam">Aucun parfum pour l'instant.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {nouvelle && (
        <div
          className="voile show"
          onClick={(e) => e.target === e.currentTarget && setNouvelle(false)}
        >
          <div className="modale etroite">
            <div className="m-tete">
              <div className="haut">
                <div>
                  <h2 className="titre">Nouvelle famille</h2>
                  <p>Un nom suffit. Vous ajouterez ensuite ses parfums.</p>
                </div>
                <button
                  type="button"
                  className="fermer"
                  onClick={() => setNouvelle(false)}
                  aria-label="Fermer"
                >
                  <Ic n="x" />
                </button>
              </div>
            </div>
            <div className="m-form">
              <div className="champ">
                <label>Nom de la famille</label>
                <input
                  autoFocus
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex. : Dattes farcies"
                />
                <span className="aide">
                  Exemple : la famille « Ghrayba » regroupe Ghrayba pois chiche et Ghrayba droo.
                </span>
              </div>
            </div>
            <div className="m-pied">
              <button type="button" className="btn discret" onClick={() => setNouvelle(false)}>
                Annuler
              </button>
              <div className="droite">
                <button type="button" className="btn principal" onClick={creer}>
                  <Ic n="check" /> Créer la famille
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ================================================================ Rubriques du menu */

export function EcranRubriques() {
  const { ctx, modifier, message } = useV2();
  const [ouverte, setOuverte] = useState<CollectionRow | null>(null);
  const saisons = new Set(ctx.saisons.map((s) => s.season_key));
  const rubriques = [...ctx.collections].sort((a, b) => a.sort_order - b.sort_order);
  const visible = (c: CollectionRow) => c.published && !c.hidden;
  const menu = rubriques.filter((c) => visible(c) && !saisons.has(c.product_key));
  const fetes = rubriques.filter((c) => saisons.has(c.product_key));
  const cachees = rubriques.filter((c) => !visible(c) && !saisons.has(c.product_key));
  const basculer = async (c: CollectionRow) => {
    const cacher = visible(c);
    await saveCollection({ data: { id: c.id, values: { hidden: cacher, published: true } } });
    await ctx.recharger();
    message(`« ${c.label} » ${cacher ? "est retirée du" : "apparaît dans le"} menu`, async () => {
      await saveCollection({ data: { id: c.id, values: { hidden: !cacher } } });
      await ctx.recharger();
    });
  };
  const carte = (c: CollectionRow) => {
    const n = ctx.produits.filter(
      (p) => (p.collections ?? []).includes(c.product_key) && enLigne(p),
    ).length;
    const image = c.image_url || (c.image_key ? `/api/public/media/${c.image_key}` : "");
    return (
      <div className={`carte coll${visible(c) ? "" : " cachee"}`} key={c.id}>
        <button
          type="button"
          className="ph"
          title="Modifier le nom, le texte ou la photo de la rubrique"
          onClick={() => ctx.ouvrir({ type: "collection", row: c })}
          style={{ border: 0, padding: 0, cursor: "pointer", display: "block", width: "100%" }}
        >
          {image ? <img src={image} alt="" /> : null}
          <span className="badge">
            {n} produit{n > 1 ? "s" : ""}
          </span>
        </button>
        <div className="corps">
          <h4>{c.label}</h4>
          <p>{c.subtitle || c.description}</p>
          <div className="pied">
            <Inter
              on={visible(c)}
              onClick={() => void basculer(c)}
              oui="Dans le menu"
              non="Cachée"
            />
            <button type="button" className="btn second petit" onClick={() => setOuverte(c)}>
              <Ic n="liste" /> Ses produits
            </button>
          </div>
          <button
            type="button"
            className="btn principal petit ajouter-ici"
            onClick={() => modifier(null, { collection: c.product_key })}
          >
            <Ic n="plus" /> Ajouter un produit ici
          </button>
        </div>
      </div>
    );
  };
  return (
    <>
      <Entete
        titre="Rubriques du menu"
        sous="Les rubriques que vos clientes voient dans le menu « Pâtisserie Tunisienne »."
        bouton={
          <button
            type="button"
            className="btn principal"
            onClick={() => ctx.ouvrir({ type: "collection", row: null })}
          >
            <Ic n="plus" /> Nouvelle rubrique
          </button>
        }
      />
      <Aide
        cle="collections"
        lignes={[
          "Chaque carte est une rubrique du menu « Pâtisserie Tunisienne ».",
          "Pour mettre un produit dans une rubrique (ex. Ramadan) : « Ses produits », puis cochez-le.",
          "Pour créer un produit directement dans une rubrique : « + Ajouter un produit ici ».",
          "Pour changer le nom, le texte ou la photo : cliquez sur la photo.",
        ]}
      />
      <div className="apercu-menu">
        <Ic n="oeil" /> <b>Vos clientes voient :</b>
        {rubriques.filter(visible).map((c) => (
          <span className="pill" key={c.id}>
            {c.label}
          </span>
        ))}
      </div>
      <div className="sous-titre">Rubriques du menu</div>
      <div className="collections">{menu.map(carte)}</div>
      {fetes.length > 0 && (
        <>
          <div className="sous-titre">Fêtes (Ramadan, Aïd)</div>
          <div className="collections">{fetes.map(carte)}</div>
        </>
      )}
      {cachees.length > 0 && (
        <>
          <div className="sous-titre">Rubriques cachées</div>
          <div className="collections">{cachees.map(carte)}</div>
        </>
      )}
      {ouverte && <FenetreSesProduits rubrique={ouverte} onClose={() => setOuverte(null)} />}
    </>
  );
}

function FenetreSesProduits({
  rubrique,
  onClose,
}: {
  rubrique: CollectionRow;
  onClose: () => void;
}) {
  const { ctx, message } = useV2();
  const [busy, setBusy] = useState<string | null>(null);
  const liste = filterPatisserieRows(ctx.produits).filter((p) => !p.archived);
  const cocher = async (p: ProductRow) => {
    const dedans = (p.collections ?? []).includes(rubrique.product_key);
    setBusy(p.id);
    try {
      const data = { collectionId: rubrique.id, productIds: [p.id] };
      if (dedans) await removeProductsFromCollection({ data });
      else await addProductsToCollection({ data });
      await ctx.recharger();
    } catch (e) {
      message(e instanceof Error ? e.message : "Modification impossible.");
    }
    setBusy(null);
  };
  return (
    <div className="voile show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modale etroite">
        <div className="m-tete">
          <div className="haut">
            <div>
              <h2 className="titre">{rubrique.label}</h2>
              <p>Cochez les produits à montrer dans cette rubrique.</p>
            </div>
            <button type="button" className="fermer" onClick={onClose} aria-label="Fermer">
              <Ic n="x" />
            </button>
          </div>
        </div>
        <div className="m-form" style={{ maxHeight: "60vh" }}>
          <div className="cases" style={{ gridTemplateColumns: "1fr" }}>
            {liste.map((p) => {
              const on = (p.collections ?? []).includes(rubrique.product_key);
              return (
                <button
                  type="button"
                  key={p.id}
                  className={`case${on ? " on" : ""}`}
                  onClick={() => void cocher(p)}
                  disabled={busy === p.id}
                >
                  <span className="coche">
                    <Ic n="check" />
                  </span>
                  <span className="vign" style={{ width: 40, height: 40, borderRadius: 8 }}>
                    {adminImage(p) ? (
                      <img src={adminImage(p)} alt="" />
                    ) : (
                      <span className="sansphoto">Ö</span>
                    )}
                  </span>
                  <span>
                    {p.name}
                    <small>{enLigne(p) ? "En ligne" : "Caché"}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="m-pied">
          <span style={{ color: "var(--texte)", fontSize: 13.5 }}>
            Les changements s'appliquent tout de suite.
          </span>
          <div className="droite">
            <button
              type="button"
              className="btn principal"
              onClick={() => {
                onClose();
                message(`Rubrique « ${rubrique.label} » mise à jour`);
              }}
            >
              <Ic n="check" /> Terminé
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================ Commandes */

const ETAPES: OrderStatus[] = ["nouvelle", "confirmee", "preparee", "terminee"];
const CLASSE: Record<OrderStatus, string> = {
  nouvelle: "s-nouvelle",
  confirmee: "s-prepa",
  preparee: "s-prete",
  terminee: "s-livree",
  annulee: "s-annulee",
};
const dateCourte = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

export function EcranCommandesV2() {
  const { ctx } = useV2();
  const [ouverte, setOuverte] = useState<string | null>(null);
  const commande = ctx.commandes.find((c) => c.id === ouverte) ?? null;
  return (
    <>
      <Entete
        titre="Commandes"
        sous="Cliquez sur une commande pour la voir et changer son étape."
      />
      <Aide
        cle="commandes"
        lignes={[
          "Les nouvelles commandes sont en rouge, en haut.",
          "Cliquez sur une commande pour voir ce qui a été commandé.",
          "Le gros bouton doré fait passer la commande à l'étape suivante.",
        ]}
      />
      {ctx.commandes.length ? (
        <div className="carte liste">
          {ctx.commandes.map((c) => (
            <div className="cmd" key={c.id} onClick={() => setOuverte(c.id)}>
              <div>
                <b>{c.number}</b>
                <small>{dateCourte(c.created_at)}</small>
              </div>
              <div>
                <b>
                  {c.first_name} {c.last_name}
                </b>
                <small>
                  {c.items.length} article{c.items.length > 1 ? "s" : ""} ·{" "}
                  {FULFILLMENT_LABELS[c.mode]}
                </small>
              </div>
              <div className="c-date">
                <small>Pour le</small>
                <b>{c.fulfillment_date ? dateCourte(c.fulfillment_date) : "—"}</b>
              </div>
              <div className="c-total">
                <b>{euro(Number(c.total))}</b>
              </div>
              <div>
                <span className={`statut ${CLASSE[c.status]}`}>
                  {ORDER_STATUS_LABELS[c.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="carte bloc" style={{ textAlign: "center" }}>
          Aucune commande pour le moment.
        </div>
      )}
      {commande && <FenetreCommande c={commande} onClose={() => setOuverte(null)} />}
    </>
  );
}

function FenetreCommande({ c, onClose }: { c: OrderRow; onClose: () => void }) {
  const { ctx, message } = useV2();
  const i = ETAPES.indexOf(c.status);
  const changer = async (s: OrderStatus) => {
    if (
      s === "annulee" &&
      !window.confirm(`Annuler la commande ${c.number} ? Son stock sera rendu.`)
    )
      return;
    try {
      await setOrderStatus({ data: { id: c.id, status: s } });
      await ctx.recharger();
      message(`Commande ${c.number} : ${ORDER_STATUS_LABELS[s]}`);
    } catch (e) {
      message(e instanceof Error ? e.message : "Changement impossible.");
    }
  };
  return (
    <div className="voile show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modale etroite">
        <div className="m-tete">
          <div className="haut">
            <div>
              <h2 className="titre">Commande {c.number}</h2>
              <p>
                {c.first_name} {c.last_name} · pour le{" "}
                {c.fulfillment_date ? dateCourte(c.fulfillment_date) : "—"} ·{" "}
                {FULFILLMENT_LABELS[c.mode]}
              </p>
            </div>
            <button type="button" className="fermer" onClick={onClose} aria-label="Fermer">
              <Ic n="x" />
            </button>
          </div>
        </div>
        <div className="m-form">
          {c.status === "annulee" ? (
            <div className="conseil">
              <Ic n="info" />
              <span>Cette commande est annulée.</span>
            </div>
          ) : (
            <>
              <div className="champ">
                <label>Où en est-elle ?</label>
              </div>
              <div className="etapes">
                {ETAPES.map((s, n) => (
                  <button
                    type="button"
                    key={s}
                    className={`etape${n === i ? " on" : n < i ? " passee" : ""}`}
                    onClick={() => void changer(s)}
                  >
                    {ORDER_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="champ">
            <label>Ce qu'elle a commandé</label>
          </div>
          <div className="cmd-lignes">
            {c.items.map((l) => (
              <div key={l.id}>
                <span>
                  {l.quantity} × {l.name}
                  {l.variant_label ? ` · ${l.variant_label}` : ""}
                  {l.gift_wrap ? " · emballage cadeau" : ""}
                </span>
                <b>{euro(Number(l.line_total))}</b>
              </div>
            ))}
            {Number(c.delivery_fee) > 0 && (
              <div>
                <span>Livraison</span>
                <b>{euro(Number(c.delivery_fee))}</b>
              </div>
            )}
            <div style={{ background: "var(--or-pale)" }}>
              <b>Total</b>
              <b>{euro(Number(c.total))}</b>
            </div>
          </div>
          <div className="grille2">
            <div className="champ">
              <label>Téléphone</label>
              <input value={c.phone} readOnly />
            </div>
            <div className="champ">
              <label>E-mail</label>
              <input value={c.email} readOnly />
            </div>
          </div>
          {c.instructions && (
            <div className="champ">
              <label>Message de la cliente</label>
              <textarea value={c.instructions} readOnly />
            </div>
          )}
        </div>
        <div className="m-pied">
          {c.status !== "annulee" && c.status !== "terminee" ? (
            <button type="button" className="btn danger" onClick={() => void changer("annulee")}>
              Annuler la commande
            </button>
          ) : (
            <button type="button" className="btn discret" onClick={onClose}>
              Fermer
            </button>
          )}
          <div className="droite">
            {i >= 0 && i < 3 && (
              <button
                type="button"
                className="btn principal"
                onClick={() => void changer(ETAPES[i + 1])}
              >
                <Ic n="check" /> Passer à « {ORDER_STATUS_LABELS[ETAPES[i + 1]]} »
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================ Parties pas encore dans la base */

export type Partie = "gateaux" | "coffrets" | "cadeaux" | "evenements" | "maison" | "contact";
const PARTIES: Record<Partie, { titre: string; lien: string; sous: string; categorie?: string }> = {
  gateaux: {
    titre: "Gâteaux",
    lien: "/gateaux",
    sous: "Les produits de la partie « Gâteaux » du site.",
    categorie: "cake",
  },
  coffrets: {
    titre: "Coffrets",
    lien: "/composer",
    sous: "Les coffrets prêts à offrir du site.",
    categorie: "coffret",
  },
  cadeaux: {
    titre: "Cadeaux",
    lien: "/cadeaux",
    sous: "Les pages « idées cadeaux » du menu Cadeaux du site.",
  },
  evenements: {
    titre: "Événements",
    lien: "/evenements",
    sous: "Les packs et les pages d'événements du site.",
    categorie: "pack-fiancailles",
  },
  maison: {
    titre: "La Maison",
    lien: "/la-maison",
    sous: "Les textes et photos de la page « La Maison » du site.",
  },
  contact: {
    titre: "Contact",
    lien: "/contact",
    sous: "Ce que voient vos clientes sur la page Contact et en bas du site.",
  },
};

export function EcranPartie({ partie }: { partie: Partie }) {
  const p = PARTIES[partie];
  const produits = p.categorie ? statiques.filter((x) => x.category === p.categorie) : [];
  return (
    <>
      <Entete
        titre={p.titre}
        sous={p.sous}
        bouton={
          <a
            className="btn second"
            href={p.lien}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Ic n="lien" /> Voir sur le site
          </a>
        }
      />
      <div className="conseil">
        <Ic n="info" />
        <span>
          <b>Bientôt modifiable ici.</b> « {p.titre} » est encore écrite dans le site : pour changer
          un prix, un texte ou une photo, il faut le demander. Elle sera gérée ici comme la
          Pâtisserie Tunisienne et le Salé.
        </span>
      </div>
      {produits.length > 0 && (
        <div className="carte groupe">
          <h3>
            Ce qui est en ligne aujourd'hui <em>{produits.length} produits</em>
          </h3>
          <div className="thead">
            <span>Produit</span>
            <span>Prix</span>
            <span />
            <span />
          </div>
          <div className="liste">
            {produits.map((x) => (
              <div className="ligne" key={x.slug}>
                <div className="produit">
                  <div className="vign">
                    {x.image ? <img src={x.image} alt="" /> : <span className="sansphoto">Ö</span>}
                  </div>
                  <div className="nomprod">
                    <b>{x.name}</b>
                    <div className="etiquettes">
                      <span className="etiq">{x.shortDesc}</span>
                    </div>
                  </div>
                </div>
                <div className="prix">
                  <button type="button" disabled>
                    {euro(Number(x.price))}
                  </button>
                </div>
                <span />
                <span />
              </div>
            ))}
          </div>
        </div>
      )}
      {partie === "cadeaux" && (
        <div className="collections">
          {giftCategories.map((g) => (
            <div className="carte coll" key={g.slug}>
              <div className="ph">{g.image ? <img src={g.image} alt="" /> : null}</div>
              <div className="corps">
                <h4>{g.label}</h4>
                <p>{g.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ================================================================ Réglages */

const nombre = (v: number) => String(v).replace(".", ",");

export function EcranReglagesV2({ aller }: { aller: (e: string) => void }) {
  const { ctx, message } = useV2();
  const [r, setR] = useState<ShopSettings>(ctx.reglages);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ShopSettings>(k: K, v: ShopSettings[K]) =>
    setR((x) => ({ ...x, [k]: v }));
  const num = (k: keyof ShopSettings) => (
    <div className="euro">
      <input
        inputMode="decimal"
        defaultValue={nombre(r[k] as number)}
        onChange={(e) => set(k, (parseFloat(e.target.value.replace(",", ".")) || 0) as never)}
      />
    </div>
  );
  const enregistrer = async () => {
    setBusy(true);
    try {
      await saveSettings({
        data: {
          values: {
            shipping_price: String(r.shippingPrice),
            shipping_free_from: String(r.shippingFreeFrom),
            gift_wrap_price: String(r.giftWrapPrice),
            delivery_start: String(r.deliveryStart),
            delivery_per_km: String(r.deliveryPerKm),
            delivery_radius_km: String(r.deliveryRadiusKm),
            delivery_free_from: String(r.deliveryFreeFrom),
            workshop_address: r.workshopAddress,
            shipping_delay: r.shippingDelay,
            pickup_delay: r.pickupDelay,
            holiday_mode: r.holidayMode ? "on" : "off",
            holiday_from: r.holidayFrom,
            holiday_until: r.holidayUntil,
          },
        },
      });
      await ctx.recharger();
      message("Réglages enregistrés");
    } catch (e) {
      message(e instanceof Error ? e.message : "Réglages non enregistrés.");
    }
    setBusy(false);
  };
  return (
    <>
      <Entete titre="Réglages" sous="Les informations générales de la boutique." />
      <Aide
        cle="reglages"
        lignes={["Changez ce qui doit l'être, puis « Enregistrer les réglages » en bas."]}
      />
      <div className="reglages">
        <div className="carte bloc">
          <h2 className="titre">Ma boutique</h2>
          <p className="sous">Affiché sur le site, au moment de commander.</p>
          <div className="champ">
            <label>Adresse de l'atelier</label>
            <input
              value={r.workshopAddress}
              onChange={(e) => set("workshopAddress", e.target.value)}
            />
          </div>
          <div className="champ">
            <label>Délai pour un colis</label>
            <input value={r.shippingDelay} onChange={(e) => set("shippingDelay", e.target.value)} />
          </div>
          <div className="champ">
            <label>Retrait à l'atelier</label>
            <input value={r.pickupDelay} onChange={(e) => set("pickupDelay", e.target.value)} />
          </div>
        </div>
        <div className="carte bloc">
          <h2 className="titre">Livraison et emballage</h2>
          <p className="sous">Les prix ajoutés au panier.</p>
          <div className="grille2">
            <div className="champ">
              <label>Colis</label>
              {num("shippingPrice")}
            </div>
            <div className="champ">
              <label>Colis offert dès</label>
              {num("shippingFreeFrom")}
            </div>
            <div className="champ">
              <label>Livraison locale : départ</label>
              {num("deliveryStart")}
            </div>
            <div className="champ">
              <label>Puis par km</label>
              {num("deliveryPerKm")}
            </div>
            <div className="champ">
              <label>Livraison offerte dès</label>
              {num("deliveryFreeFrom")}
            </div>
            <div className="champ">
              <label>Emballage cadeau</label>
              {num("giftWrapPrice")}
            </div>
          </div>
          <div className="champ">
            <label>Distance maximale de livraison (km)</label>
            <input
              inputMode="numeric"
              defaultValue={String(r.deliveryRadiusKm)}
              onChange={(e) => set("deliveryRadiusKm", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        <div className="carte bloc">
          <h2 className="titre">Fermeture</h2>
          <p className="sous">Pour les vacances ou une pause.</p>
          <div className="ligne-reglage">
            <div>
              <b>Mode vacances</b>
              <small>La boutique reste visible, mais personne ne peut commander.</small>
            </div>
            <Inter
              on={r.holidayMode}
              onClick={() => set("holidayMode", !r.holidayMode)}
              oui="Activé"
              non="Désactivé"
            />
          </div>
          {r.holidayMode && (
            <div className="grille2">
              <div className="champ">
                <label>Du</label>
                <input
                  type="date"
                  value={r.holidayFrom}
                  onChange={(e) => set("holidayFrom", e.target.value)}
                />
              </div>
              <div className="champ">
                <label>Au</label>
                <input
                  type="date"
                  value={r.holidayUntil}
                  onChange={(e) => set("holidayUntil", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <div className="carte bloc">
          <h2 className="titre">Photos du site</h2>
          <p className="sous">Les grandes photos en haut des pages.</p>
          <div className="ligne-reglage">
            <div>
              <b>Photos des pages</b>
              <small>Pâtisserie, Salé, Cadeaux, La Maison…</small>
            </div>
            <button type="button" className="btn second petit" onClick={() => aller("bandeaux")}>
              Changer
            </button>
          </div>
          <div className="ligne-reglage">
            <div>
              <b>Liste d'attente</b>
              <small>Les clientes à prévenir quand un produit revient.</small>
            </div>
            <button type="button" className="btn second petit" onClick={() => aller("attente")}>
              Voir ({ctx.attente.length})
            </button>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
        <button type="button" className="btn principal" onClick={enregistrer} disabled={busy}>
          <Ic n="check" /> {busy ? "Enregistrement…" : "Enregistrer les réglages"}
        </button>
      </div>
    </>
  );
}
