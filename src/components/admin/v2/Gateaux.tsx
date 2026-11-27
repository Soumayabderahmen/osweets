import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  reorderGateaux,
  saveGateau,
  saveGateauConfig,
  saveGateauPage,
  type GateauConfig,
  type GateauPageRow,
  type GateauRow,
} from "@/api/gateaux";
import { uploadProductImage } from "@/api/images";
import { resolveProductImage } from "@/lib/product-assets";
import { Aide, Ic, Inter, euro, slugifier, useV2 } from "./ui";

/*
 * La partie « Gâteaux » de l'admin, dessinée comme le prototype validé :
 * Produits (rangés par page du site), Pages du menu, Sur mesure.
 */

export const COLONNES_G = ["Nos gâteaux", "Formats individuels", "Célébrations & sur mesure"];
const TAG_CLASSE: Record<string, string> = {
  "Sur mesure": "or",
  "Sur devis": "fonce",
  Saison: "ambre",
};
const DELAIS = ["24 h", "48 h", "72 h", "1 semaine"];
const imageDe = (r: { image_url: string | null; image_key: string | null }) =>
  resolveProductImage(r.image_url, r.image_key);

function lireFichier(f: File): Promise<string> {
  return new Promise((ok, ko) => {
    const l = new FileReader();
    l.onload = () => ok(String(l.result).split(",")[1] ?? "");
    l.onerror = () => ko(new Error("Lecture de la photo impossible."));
    l.readAsDataURL(f);
  });
}
async function envoyerPhoto(f: File): Promise<string> {
  const base64 = await lireFichier(f);
  const { url } = await uploadProductImage({
    data: { fileName: f.name, contentType: f.type, base64 },
  });
  return url;
}

/** Un prix qui se change d'un clic : on tape, Entrée, c'est fait. */
function PrixModifiable({
  valeur,
  onChange,
  avant = "",
}: {
  valeur: number;
  onChange: (v: number) => void;
  avant?: string;
}) {
  const [edition, setEdition] = useState(false);
  const valider = (texte: string) => {
    setEdition(false);
    const v = parseFloat(texte.replace(",", "."));
    if (v >= 0 && v !== valeur) onChange(v);
  };
  return (
    <div className="prix col-prix">
      {edition ? (
        <>
          <input
            autoFocus
            inputMode="decimal"
            defaultValue={String(valeur).replace(".", ",")}
            onKeyDown={(e) => {
              if (e.key === "Enter") valider(e.currentTarget.value);
              if (e.key === "Escape") setEdition(false);
            }}
            onBlur={(e) => valider(e.currentTarget.value)}
          />
          <small>€</small>
        </>
      ) : (
        <button type="button" title="Changer le prix" onClick={() => setEdition(true)}>
          {avant}
          {euro(valeur)}
        </button>
      )}
    </div>
  );
}

/* ================================================================ en-tête */

const SOUS_GAT: Record<string, string> = {
  gateaux: "Cliquez sur un prix pour le changer.",
  gpages: "Le menu « Gâteaux » du site, colonne par colonne.",
  gmesure: "Le gâteau d'anniversaire à composer, et les gâteaux sur devis.",
};

export function SectionGat({ ecran, action }: { ecran: string; action?: ReactNode }) {
  const { gat, aller } = useV2();
  const ONGLETS: [string, string, string, string | number][] = [
    ["gateaux", "gateau", "Produits", gat?.gateaux.length ?? 0],
    ["gpages", "menuSite", "Pages du menu", gat?.pages.length ?? 0],
    ["gmesure", "etoile", "Sur mesure", `${gat?.config?.themes.length ?? 0} thèmes`],
  ];
  return (
    <section className="sect">
      <div className="sect-haut">
        <span className="sect-ic">
          <Ic n="gateau" />
        </span>
        <div className="sect-titre">
          <h1>Gâteaux</h1>
          <p>{SOUS_GAT[ecran]}</p>
        </div>
        <div className="sect-actions">
          <a
            className="btn second"
            href="/gateaux"
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Ic n="lien" /> Voir sur le site
          </a>
          {action}
        </div>
      </div>
      <nav className="sect-onglets">
        {ONGLETS.map(([k, icone, n, c]) => (
          <button
            type="button"
            key={k}
            className={`sect-onglet${ecran === k ? " on" : ""}`}
            onClick={() => aller(k)}
          >
            <Ic n={icone} />
            {n}
            <small>{c}</small>
          </button>
        ))}
      </nav>
    </section>
  );
}

function SansBase() {
  return (
    <div className="conseil">
      <Ic n="info" />
      <span>
        <b>Les gâteaux ne sont pas encore dans la base.</b> Lancez la mise à jour de la base
        (migration 034) pour les gérer ici.
      </span>
    </div>
  );
}

/* ================================================================ Produits */

const TRIS: Record<string, string> = {
  menu: "Ordre du site",
  nom: "Nom (A → Z)",
  prixHaut: "Prix croissant",
  prixBas: "Prix décroissant",
};
const lireVue = (): "liste" | "grille" => {
  try {
    return localStorage.getItem("os-vue") === "grille" ? "grille" : "liste";
  } catch {
    return "liste";
  }
};

export function EcranGateaux({
  colonne = "",
  setColonne,
}: {
  colonne?: string;
  setColonne: (c: string) => void;
}) {
  const { gat, rechargerGat, message } = useV2();
  const [filtre, setFiltre] = useState("tout");
  const [recherche, setRecherche] = useState("");
  const [tri, setTri] = useState("menu");
  const [page, setPage] = useState("");
  const [vue, setVueEtat] = useState(lireVue);
  const [fenetre, setFenetre] = useState<{ row: GateauRow | null; page?: string } | null>(null);
  const [fenetrePage, setFenetrePage] = useState<GateauPageRow | null>(null);
  const setVue = (v: "liste" | "grille") => {
    setVueEtat(v);
    try {
      localStorage.setItem("os-vue", v);
    } catch {
      /* le choix vaut pour cette visite */
    }
  };

  if (!gat?.ok) return <SansBase />;
  const pages = [...gat.pages].sort((a, b) => a.sort_order - b.sort_order);
  const nomPage = (k: string) => pages.find((p) => p.key === k);
  const FILTRES: [string, string, (r: GateauRow) => boolean][] = [
    ["tout", "Tout", () => true],
    ["enligne", "En ligne", (r) => r.visible],
    ["masques", "Cachés", (r) => !r.visible],
    ["sansphoto", "Sans photo", (r) => !imageDe(r)],
  ];
  const f = (FILTRES.find((x) => x[0] === filtre) ?? FILTRES[0])[2];
  const filtres = gat.gateaux.filter(f);
  let liste = filtres.filter(
    (r) => !recherche || r.name.toLowerCase().includes(recherche.toLowerCase()),
  );
  if (colonne) liste = liste.filter((r) => nomPage(r.page_key)?.column_label === colonne);
  if (page) liste = liste.filter((r) => r.page_key === page);

  const groupes: [GateauPageRow | null, GateauRow[]][] = [];
  if (tri !== "menu") {
    const cmp: Record<string, (a: GateauRow, b: GateauRow) => number> = {
      nom: (a, b) => a.name.localeCompare(b.name, "fr"),
      prixHaut: (a, b) => Number(a.price) - Number(b.price),
      prixBas: (a, b) => Number(b.price) - Number(a.price),
    };
    if (liste.length) groupes.push([null, [...liste].sort(cmp[tri])]);
  } else
    for (const p of pages) {
      const items = liste
        .filter((r) => r.page_key === p.key)
        .sort((a, b) => a.sort_order - b.sort_order);
      if (items.length) groupes.push([p, items]);
    }

  const changer = async (
    r: GateauRow,
    values: Parameters<typeof saveGateau>[0]["data"]["values"],
    texte: string,
    annuler?: typeof values,
  ) => {
    try {
      await saveGateau({ data: { id: r.id, values } });
      await rechargerGat();
      message(
        texte,
        annuler
          ? async () => {
              await saveGateau({ data: { id: r.id, values: annuler } });
              await rechargerGat();
            }
          : undefined,
      );
    } catch (e) {
      message(e instanceof Error ? e.message : "Modification impossible.");
    }
  };
  const basculer = (r: GateauRow) =>
    changer(
      r,
      { visible: !r.visible },
      `« ${r.name} » est maintenant ${r.visible ? "caché" : "visible"} sur le site`,
      { visible: r.visible },
    );
  const prix = (r: GateauRow) => (
    <PrixModifiable
      valeur={Number(r.price)}
      onChange={(v) =>
        changer(r, { price: v }, `Nouveau prix de « ${r.name} » : ${euro(v)}`, {
          price: Number(r.price),
        })
      }
    />
  );
  const etiquettes = (r: GateauRow) => (
    <div className="etiquettes">
      {r.format && <span className="etiq">{r.format}</span>}
      {r.lead_time && <span className="etiq">Commande {r.lead_time} avant</span>}
      {!imageDe(r) && <span className="etiq avert">Sans photo</span>}
    </div>
  );
  const vignette = (r: GateauRow) =>
    imageDe(r) ? (
      <img src={imageDe(r)} alt="" />
    ) : (
      <span className="sansphoto">Ajouter une photo</span>
    );
  const pagesAvecGateaux = pages.filter(
    (p) => (!colonne || p.column_label === colonne) && filtres.some((r) => r.page_key === p.key),
  );

  return (
    <>
      <SectionGat
        ecran="gateaux"
        action={
          <button
            type="button"
            className="btn principal"
            onClick={() => setFenetre({ row: null, page: page || undefined })}
          >
            <Ic n="plus" /> Ajouter un gâteau
          </button>
        }
      />
      <Aide
        cle="gateaux"
        lignes={[
          "Les gâteaux sont rangés par page du site : Cheesecakes, Tartes, Cupcakes…",
          "Cliquez sur une pastille pour ne voir qu'une page ; sur un prix pour le changer.",
          "Pour un nouveau gâteau : « + Ajouter un gâteau », puis choisissez sa page.",
        ]}
      />
      <div className="outils-liste">
        <div className="outils-ligne">
          <div className="filtres">
            {FILTRES.map(([k, l, fn]) => (
              <button
                type="button"
                key={k}
                className={`filtre${filtre === k ? " on" : ""}`}
                onClick={() => setFiltre(k)}
              >
                {l}
                <small>{gat.gateaux.filter(fn).length}</small>
              </button>
            ))}
          </div>
          <label className="recherche">
            <Ic n="loupe" />
            <input
              placeholder="Chercher un gâteau…"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
          </label>
          <label className="choix-tri">
            Trier
            <select value={tri} onChange={(e) => setTri(e.target.value)}>
              {Object.entries(TRIS).map(([k, n]) => (
                <option key={k} value={k}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <div className="vues">
            <button
              type="button"
              className={vue === "liste" ? "on" : ""}
              onClick={() => setVue("liste")}
              aria-label="Afficher en lignes"
              title="En lignes"
            >
              <Ic n="liste" />
            </button>
            <button
              type="button"
              className={vue === "grille" ? "on" : ""}
              onClick={() => setVue("grille")}
              aria-label="Afficher en cartes"
              title="En cartes"
            >
              <Ic n="grille" />
            </button>
          </div>
        </div>
        <div className="puces">
          <button
            type="button"
            className={`puce${!page && !colonne ? " on" : ""}`}
            onClick={() => {
              setPage("");
              setColonne("");
            }}
          >
            Toutes les pages<small>{filtres.length}</small>
          </button>
          {pagesAvecGateaux.map((p) => (
            <button
              type="button"
              key={p.key}
              className={`puce${page === p.key ? " on" : ""}`}
              onClick={() => setPage(page === p.key ? "" : p.key)}
            >
              <span className="pt" />
              {p.title}
              <small>{filtres.filter((r) => r.page_key === p.key).length}</small>
            </button>
          ))}
        </div>
      </div>
      {colonne && <div className="sous-titre">{colonne}</div>}
      {groupes.length ? (
        groupes.map(([p, items]) => (
          <div className="carte groupe" key={p?.key ?? "tous"}>
            <h3>
              {p ? p.title : "Tous les gâteaux"}{" "}
              <em>
                {items.length} produit{items.length > 1 ? "s" : ""}
                {p ? ` · ${p.column_label}` : ""}
              </em>
              {p && (
                <button
                  type="button"
                  className="lien-mini titre-lien"
                  onClick={() => setFenetrePage(p)}
                >
                  Modifier la page
                </button>
              )}
            </h3>
            {vue === "grille" ? (
              <div className="grille-produits">
                {items.map((r) => (
                  <div className={`carte-produit${r.visible ? "" : " masque"}`} key={r.id}>
                    <div className="cp-photo">
                      {vignette(r)}
                      {!r.visible && <span className="etat">Caché</span>}
                    </div>
                    <div className="cp-corps">
                      <div className="cp-nom">
                        <b>{r.name}</b>
                        {etiquettes(r)}
                      </div>
                      {prix(r)}
                      <div className="cp-actions">
                        <Inter on={r.visible} onClick={() => void basculer(r)} />
                        <button
                          type="button"
                          className="btn second petit"
                          onClick={() => setFenetre({ row: r })}
                        >
                          <Ic n="crayon" /> Modifier
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="thead">
                  <span>Produit</span>
                  <span>Prix</span>
                  <span>Sur le site</span>
                  <span />
                </div>
                <div className="liste">
                  {items.map((r) => (
                    <div className={`ligne${r.visible ? "" : " masque"}`} key={r.id}>
                      <div className="produit">
                        <div className="vign">{vignette(r)}</div>
                        <div className="nomprod">
                          <b>{r.name}</b>
                          {etiquettes(r)}
                        </div>
                      </div>
                      {prix(r)}
                      <div className="col-visible">
                        <Inter on={r.visible} onClick={() => void basculer(r)} />
                      </div>
                      <div className="col-action">
                        <button
                          type="button"
                          className="btn second petit"
                          onClick={() => setFenetre({ row: r })}
                        >
                          <Ic n="crayon" /> Modifier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))
      ) : (
        <div className="carte bloc" style={{ textAlign: "center" }}>
          Aucun gâteau ne correspond.
        </div>
      )}
      {fenetre && (
        <FenetreGateau
          row={fenetre.row}
          pageParDefaut={fenetre.page}
          onClose={() => setFenetre(null)}
        />
      )}
      {fenetrePage && <FenetrePageGateau page={fenetrePage} onClose={() => setFenetrePage(null)} />}
    </>
  );
}

/* ================================================================ fenêtres */

function ZonePhoto({
  image,
  onFichier,
  texte,
}: {
  image: string;
  onFichier: (f: File) => void;
  texte: string;
}) {
  const champ = useRef<HTMLInputElement>(null);
  return (
    <div className="photo-zone">
      <div className="vign">
        {image ? <img src={image} alt="" /> : <span className="sansphoto">Ö</span>}
      </div>
      <div style={{ flex: 1 }}>
        <b>Photo</b>
        <small>{texte}</small>
      </div>
      <button type="button" className="btn second petit" onClick={() => champ.current?.click()}>
        <Ic n="photo" /> {image ? "Changer" : "Choisir"}
      </button>
      <input
        ref={champ}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFichier(f);
        }}
      />
    </div>
  );
}

function Modale({
  titre,
  sous,
  onClose,
  pied,
  children,
}: {
  titre: string;
  sous: string;
  onClose: () => void;
  pied: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="voile show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modale etroite">
        <div className="m-tete">
          <div className="haut">
            <div>
              <h2 className="titre">{titre}</h2>
              <p>{sous}</p>
            </div>
            <button type="button" className="fermer" onClick={onClose} aria-label="Fermer">
              <Ic n="x" />
            </button>
          </div>
        </div>
        <div className="m-form">{children}</div>
        <div className="m-pied">{pied}</div>
      </div>
    </div>
  );
}

function FenetreGateau({
  row,
  pageParDefaut,
  onClose,
}: {
  row: GateauRow | null;
  pageParDefaut?: string;
  onClose: () => void;
}) {
  const { gat, rechargerGat, message } = useV2();
  const pages = useMemo(
    () =>
      [...(gat?.pages ?? [])]
        .filter((p) => p.tag === "Boutique")
        .sort((a, b) => a.sort_order - b.sort_order),
    [gat?.pages],
  );
  const [b, setB] = useState({
    name: row?.name ?? "",
    price: row ? String(Number(row.price)).replace(".", ",") : "",
    format: row?.format ?? "",
    lead_time: row?.lead_time ?? "48 h",
    page_key: row?.page_key ?? pageParDefaut ?? pages[0]?.key ?? "",
    visible: row?.visible ?? true,
  });
  const [photo, setPhoto] = useState<{ apercu: string; fichier: File } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof b>(k: K, v: (typeof b)[K]) => setB((x) => ({ ...x, [k]: v }));
  const image = photo?.apercu || (row ? imageDe(row) : "");

  const enregistrer = async () => {
    const prix = parseFloat(b.price.replace(",", "."));
    if (!b.name.trim()) return message("Il manque le nom du gâteau");
    if (!(prix >= 0)) return message("Il manque le prix");
    setBusy(true);
    try {
      const image_url = photo ? await envoyerPhoto(photo.fichier) : undefined;
      await saveGateau({
        data: {
          id: row?.id,
          values: {
            name: b.name,
            price: prix,
            format: b.format,
            lead_time: b.lead_time,
            page_key: b.page_key,
            visible: b.visible,
            ...(image_url ? { image_url } : {}),
          },
        },
      });
      await rechargerGat();
      message(
        row
          ? `« ${b.name} » est enregistré`
          : `« ${b.name} » est ajouté à ${pages.find((p) => p.key === b.page_key)?.title ?? "sa page"}`,
      );
      onClose();
    } catch (e) {
      message(e instanceof Error ? e.message : "Gâteau non enregistré.");
    }
    setBusy(false);
  };

  return (
    <Modale
      titre={row ? row.name : "Nouveau gâteau"}
      sous={
        row
          ? "Modifiez ce qui doit changer, puis enregistrez."
          : "Un nom, un prix, une page : le reste peut attendre."
      }
      onClose={onClose}
      pied={
        <>
          {row && row.visible ? (
            <button
              type="button"
              className="btn danger"
              onClick={async () => {
                await saveGateau({ data: { id: row.id, values: { visible: false } } });
                await rechargerGat();
                message(`« ${row.name} » est retiré du site`, async () => {
                  await saveGateau({ data: { id: row.id, values: { visible: true } } });
                  await rechargerGat();
                });
                onClose();
              }}
            >
              <Ic n="poubelle" /> Retirer du site
            </button>
          ) : (
            <button type="button" className="btn discret" onClick={onClose}>
              Annuler
            </button>
          )}
          <div className="droite">
            <button type="button" className="btn principal" onClick={enregistrer} disabled={busy}>
              <Ic n="check" /> {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </>
      }
    >
      <ZonePhoto
        image={image}
        texte="Montrée sur la page du site."
        onFichier={(f) => setPhoto({ apercu: URL.createObjectURL(f), fichier: f })}
      />
      <div className="champ">
        <label htmlFor="g-nom">Nom du gâteau</label>
        <input
          id="g-nom"
          value={b.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Ex. : Cheesecake Mangue"
        />
      </div>
      <div className="grille2">
        <div className="champ">
          <label htmlFor="g-prix">Prix</label>
          <div className="euro">
            <input
              id="g-prix"
              inputMode="decimal"
              value={b.price}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
        </div>
        <div className="champ">
          <label htmlFor="g-format">Format</label>
          <input
            id="g-format"
            value={b.format}
            onChange={(e) => set("format", e.target.value)}
            placeholder="Ex. : 6 parts, Entier, À la pièce"
          />
        </div>
      </div>
      <div className="grille2">
        <div className="champ">
          <label htmlFor="g-page">Sur quelle page ?</label>
          <select id="g-page" value={b.page_key} onChange={(e) => set("page_key", e.target.value)}>
            {COLONNES_G.map((col) => (
              <optgroup key={col} label={col}>
                {pages
                  .filter((p) => p.column_label === col)
                  .map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="champ">
          <label htmlFor="g-delai">À commander combien de temps avant ?</label>
          <select
            id="g-delai"
            value={b.lead_time}
            onChange={(e) => set("lead_time", e.target.value)}
          >
            {[...new Set([...DELAIS, b.lead_time])].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="ligne-reglage">
        <div>
          <b>Sur le site</b>
          <small>Un gâteau caché reste ici, prêt à revenir.</small>
        </div>
        <Inter on={b.visible} onClick={() => set("visible", !b.visible)} />
      </div>
      {!row && (
        <div className="conseil">
          <Ic n="info" />
          <span>
            Les ingrédients et allergènes détaillés des gâteaux existants restent ceux de leur page
            ; pour un nouveau gâteau, la page montre son nom, son prix, son format et sa photo.
          </span>
        </div>
      )}
    </Modale>
  );
}

function FenetrePageGateau({ page, onClose }: { page: GateauPageRow; onClose: () => void }) {
  const { rechargerGat, message } = useV2();
  const [titre, setTitre] = useState(page.title);
  const [texte, setTexte] = useState(page.description);
  const [photo, setPhoto] = useState<{ apercu: string; fichier: File } | null>(null);
  const [busy, setBusy] = useState(false);
  const enregistrer = async () => {
    setBusy(true);
    try {
      const image_url = photo ? await envoyerPhoto(photo.fichier) : undefined;
      await saveGateauPage({
        data: {
          key: page.key,
          values: { title: titre, description: texte, ...(image_url ? { image_url } : {}) },
        },
      });
      await rechargerGat();
      message(`Page « ${titre} » enregistrée`);
      onClose();
    } catch (e) {
      message(e instanceof Error ? e.message : "Page non enregistrée.");
    }
    setBusy(false);
  };
  return (
    <Modale
      titre={page.title}
      sous="Le nom dans le menu, le texte et la photo de cette page."
      onClose={onClose}
      pied={
        <>
          <a
            className="btn discret"
            href={page.href}
            target="_blank"
            rel="noreferrer"
            style={{ textDecoration: "none" }}
          >
            <Ic n="lien" /> Voir la page
          </a>
          <div className="droite">
            <button type="button" className="btn principal" onClick={enregistrer} disabled={busy}>
              <Ic n="check" /> {busy ? "Enregistrement…" : "Enregistrer la page"}
            </button>
          </div>
        </>
      }
    >
      <ZonePhoto
        image={photo?.apercu || imageDe(page)}
        texte="Montrée dans les listes de pages."
        onFichier={(f) => setPhoto({ apercu: URL.createObjectURL(f), fichier: f })}
      />
      <div className="champ">
        <label htmlFor="gp-titre">Nom dans le menu</label>
        <input id="gp-titre" value={titre} onChange={(e) => setTitre(e.target.value)} />
      </div>
      <div className="champ">
        <label htmlFor="gp-texte">Texte court</label>
        <textarea id="gp-texte" value={texte} onChange={(e) => setTexte(e.target.value)} />
      </div>
    </Modale>
  );
}

/* ================================================================ Pages du menu */

export function EcranPagesGateaux() {
  const { gat, rechargerGat, message } = useV2();
  const [fenetre, setFenetre] = useState<GateauPageRow | null>(null);
  if (!gat?.ok) return <SansBase />;
  const pages = [...gat.pages].sort((a, b) => a.sort_order - b.sort_order);
  const colonnes = [...new Set([...COLONNES_G, ...pages.map((p) => p.column_label)])];
  const bouger = async (col: string, p: GateauPageRow, sens: -1 | 1) => {
    const liste = pages.filter((x) => x.column_label === col);
    const i = liste.indexOf(p);
    const j = i + sens;
    if (j < 0 || j >= liste.length) return;
    [liste[i], liste[j]] = [liste[j], liste[i]];
    try {
      await reorderGateaux({ data: { table: "pages", ids: liste.map((x) => x.key) } });
      await rechargerGat();
      message(`« ${p.title} » ${sens < 0 ? "monte" : "descend"} dans le menu`);
    } catch (e) {
      message(e instanceof Error ? e.message : "Ordre non enregistré.");
    }
  };
  const basculer = async (p: GateauPageRow) => {
    await saveGateauPage({ data: { key: p.key, values: { visible: !p.visible } } });
    await rechargerGat();
    message(
      `« ${p.title} » ${p.visible ? "est retirée du" : "apparaît dans le"} menu`,
      async () => {
        await saveGateauPage({ data: { key: p.key, values: { visible: p.visible } } });
        await rechargerGat();
      },
    );
  };
  return (
    <>
      <SectionGat ecran="gpages" />
      <Aide
        cle="gpages"
        lignes={[
          "Voici le menu « Gâteaux » du site, colonne par colonne, dans le même ordre.",
          "Les flèches changent l'ordre ; l'interrupteur retire une page du menu sans la supprimer.",
          "Le crayon change le nom, le texte et la photo de la page.",
        ]}
      />
      <div className="apercu-menu">
        <Ic n="oeil" /> <b>Vos clientes voient le menu Gâteaux en trois colonnes.</b>
      </div>
      <div className="colonnes-menu">
        {colonnes.map((col) => {
          const liste = pages.filter((p) => p.column_label === col);
          return (
            <div className="carte colonne-menu" key={col}>
              <h3>
                {col} <em>{liste.filter((p) => p.visible).length} dans le menu</em>
              </h3>
              {liste.map((p, i) => {
                const n = gat.gateaux.filter((g) => g.page_key === p.key).length;
                return (
                  <div className={`page-ligne${p.visible ? "" : " cachee"}`} key={p.key}>
                    <div className="ordre">
                      <button
                        type="button"
                        disabled={i === 0}
                        title="Monter"
                        onClick={() => void bouger(col, p, -1)}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        disabled={i === liste.length - 1}
                        title="Descendre"
                        onClick={() => void bouger(col, p, 1)}
                      >
                        ▼
                      </button>
                    </div>
                    <div className="vign">
                      {imageDe(p) ? <img src={imageDe(p)} alt="" /> : null}
                    </div>
                    <div className="pl-txt">
                      <b>{p.title}</b>
                      <small>
                        {p.tag !== "Boutique" && (
                          <span className={`tag-g ${TAG_CLASSE[p.tag] ?? ""}`}>{p.tag}</span>
                        )}
                        {n
                          ? `${n} produit${n > 1 ? "s" : ""}`
                          : p.tag === "Sur mesure"
                            ? "Configurateur"
                            : "Demande de devis"}
                      </small>
                    </div>
                    <Inter on={p.visible} onClick={() => void basculer(p)} />
                    <button
                      type="button"
                      className="bouton-rond"
                      title="Modifier la page"
                      onClick={() => setFenetre(p)}
                    >
                      <Ic n="crayon" />
                    </button>
                  </div>
                );
              })}
              {col === "Célébrations & sur mesure" && (
                <div className="page-ligne fixe">
                  <span className="lien-or">Configurer mon gâteau →</span>
                  <small>Lien mis en avant, toujours en bas</small>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {fenetre && <FenetrePageGateau page={fenetre} onClose={() => setFenetre(null)} />}
    </>
  );
}

/* ================================================================ Sur mesure */

const CATS: [string, string][] = [
  ["tout", "Tous"],
  ["motif", "Motifs"],
  ["age", "Âge"],
  ["occasion", "Occasions"],
];

export function EcranMesure() {
  const { gat, rechargerGat, message } = useV2();
  const [cat, setCat] = useState("tout");
  const [parfum, setParfum] = useState("");
  const [nouveauTheme, setNouveauTheme] = useState<{
    label: string;
    emoji: string;
    category: string;
  } | null>(null);
  const [fenetre, setFenetre] = useState<GateauPageRow | null>(null);
  if (!gat?.ok || !gat.config) return <SansBase />;
  const c = gat.config;
  const enregistrer = async (suivant: GateauConfig, texte: string, annulable = true) => {
    try {
      await saveGateauConfig({ data: { config: suivant } });
      await rechargerGat();
      message(
        texte,
        annulable
          ? async () => {
              await saveGateauConfig({ data: { config: c } });
              await rechargerGat();
            }
          : undefined,
      );
    } catch (e) {
      message(e instanceof Error ? e.message : "Réglage non enregistré.");
    }
  };
  const themes = c.themes.filter((t) => cat === "tout" || t.category === cat);
  const devis = [...gat.pages]
    .filter((p) => p.tag === "Sur devis" || p.tag === "Saison")
    .sort((a, b) => a.sort_order - b.sort_order);
  const basculerPage = async (p: GateauPageRow) => {
    await saveGateauPage({ data: { key: p.key, values: { visible: !p.visible } } });
    await rechargerGat();
    message(`« ${p.title} » ${p.visible ? "est retirée du" : "apparaît dans le"} menu`);
  };

  return (
    <>
      <SectionGat
        ecran="gmesure"
        action={
          <button
            type="button"
            className="btn principal"
            onClick={() => setNouveauTheme({ label: "", emoji: "🎂", category: "motif" })}
          >
            <Ic n="plus" /> Ajouter un thème
          </button>
        }
      />
      <Aide
        cle="gmesure"
        lignes={[
          "Ici se règle le configurateur « Gâteau d'anniversaire » du site : tailles, parfums, thèmes.",
          "Cliquez sur un prix pour le changer. Un thème caché disparaît du choix des clientes.",
          "Wedding cakes et gâteaux de fin d'année se font sur devis : la cliente envoie sa demande.",
        ]}
      />
      <div className="sous-titre">Gâteau d'anniversaire à composer</div>
      <div className="mesure">
        <div className="carte bloc">
          <h2 className="titre">Tailles et prix</h2>
          <p className="sous">Le prix de départ, selon le nombre de parts.</p>
          <div className="tailles">
            {c.sizes.map((s, i) => (
              <div className={`taille${s.visible ? "" : " cachee"}`} key={s.id}>
                <div>
                  <b>{s.label}</b>
                  <small>{s.parts} parts</small>
                </div>
                <PrixModifiable
                  valeur={Number(s.price)}
                  onChange={(v) =>
                    void enregistrer(
                      { ...c, sizes: c.sizes.map((x, j) => (j === i ? { ...x, price: v } : x)) },
                      `${s.label} : ${euro(v)}`,
                    )
                  }
                />
                <Inter
                  on={s.visible}
                  oui="Proposée"
                  non="Cachée"
                  onClick={() =>
                    void enregistrer(
                      {
                        ...c,
                        sizes: c.sizes.map((x, j) => (j === i ? { ...x, visible: !x.visible } : x)),
                      },
                      `${s.label} : ${s.visible ? "cachée" : "proposée"}`,
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>
        <div className="carte bloc">
          <h2 className="titre">Parfums</h2>
          <p className="sous">Ce que la cliente peut choisir pour l'intérieur.</p>
          <div className="parfums-g">
            {c.flavors.map((f) => (
              <span className="chip-g" key={f.id}>
                {f.label}
                <button
                  type="button"
                  title="Retirer"
                  onClick={() =>
                    void enregistrer(
                      { ...c, flavors: c.flavors.filter((x) => x.id !== f.id) },
                      `Parfum « ${f.label} » retiré`,
                    )
                  }
                >
                  <Ic n="x" />
                </button>
              </span>
            ))}
          </div>
          <form
            className="ajout-ligne"
            onSubmit={(e) => {
              e.preventDefault();
              const label = parfum.trim();
              if (!label) return message("Écrivez le nom du parfum");
              const id = slugifier(label) || `parfum-${c.flavors.length + 1}`;
              if (c.flavors.some((x) => x.id === id)) return message("Ce parfum existe déjà");
              setParfum("");
              void enregistrer(
                { ...c, flavors: [...c.flavors, { id, label }] },
                `Parfum « ${label} » ajouté`,
              );
            }}
          >
            <input
              value={parfum}
              onChange={(e) => setParfum(e.target.value)}
              placeholder="Ex. : Mangue & Passion"
            />
            <button type="submit" className="btn second petit">
              <Ic n="plus" /> Ajouter
            </button>
          </form>
          <h2 className="titre" style={{ marginTop: 22 }}>
            Options
          </h2>
          <div className="ligne-reglage">
            <div>
              <b>Supplément « Sur mesure »</b>
              <small>Quand la cliente choisit le thème « Sur mesure ».</small>
            </div>
            <PrixModifiable
              valeur={Number(c.customSupplement)}
              avant="+ "
              onChange={(v) =>
                void enregistrer(
                  { ...c, customSupplement: v },
                  `Supplément « Sur mesure » : ${euro(v)}`,
                )
              }
            />
          </div>
          <div className="ligne-reglage">
            <div>
              <b>Délai minimum</b>
              <small>Affiché à la cliente sur le configurateur.</small>
            </div>
            <select
              className="petit-select"
              value={c.leadTime}
              onChange={(e) =>
                void enregistrer(
                  { ...c, leadTime: e.target.value },
                  `Délai minimum : ${e.target.value}`,
                )
              }
            >
              {[...new Set([...DELAIS, c.leadTime])].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="ligne-reglage">
            <div>
              <b>Message sur le gâteau</b>
              <small>« Joyeux anniversaire Lina »…</small>
            </div>
            <Inter
              on={c.message}
              oui="Proposé"
              non="Non"
              onClick={() =>
                void enregistrer(
                  { ...c, message: !c.message },
                  c.message ? "Message retiré du configurateur" : "Message proposé",
                )
              }
            />
          </div>
        </div>
      </div>

      <div className="carte bloc themes-bloc">
        <div className="themes-tete">
          <div>
            <h2 className="titre">Thèmes</h2>
            <p className="sous">
              {c.themes.filter((t) => t.visible).length} thèmes proposés aux clientes.
            </p>
          </div>
          <div className="filtres">
            {CATS.map(([k, n]) => (
              <button
                type="button"
                key={k}
                className={`filtre${cat === k ? " on" : ""}`}
                onClick={() => setCat(k)}
              >
                {n}
                <small>
                  {k === "tout" ? c.themes.length : c.themes.filter((t) => t.category === k).length}
                </small>
              </button>
            ))}
          </div>
        </div>
        <div className="themes">
          {themes.map((t) => (
            <button
              type="button"
              key={t.id}
              className={`theme${t.visible ? "" : " cache"}`}
              title={t.visible ? "Cacher ce thème" : "Proposer ce thème"}
              onClick={() =>
                void enregistrer(
                  {
                    ...c,
                    themes: c.themes.map((x) =>
                      x.id === t.id ? { ...x, visible: !x.visible } : x,
                    ),
                  },
                  `Thème « ${t.label} » ${t.visible ? "caché" : "proposé"}`,
                )
              }
            >
              <span className="em">{t.emoji}</span>
              <b>{t.label}</b>
              <small>{t.visible ? "Proposé" : "Caché"}</small>
            </button>
          ))}
          <button
            type="button"
            className="theme ajout"
            onClick={() =>
              setNouveauTheme({ label: "", emoji: "🎂", category: cat === "tout" ? "motif" : cat })
            }
          >
            <Ic n="plus" />
            <b>Nouveau thème</b>
          </button>
        </div>
      </div>

      <div className="sous-titre">Sur devis</div>
      <div className="carte bloc">
        {devis.map((p) => (
          <div className="ligne-reglage" key={p.key}>
            <div className="pl-devis">
              <div className="vign">{imageDe(p) ? <img src={imageDe(p)} alt="" /> : null}</div>
              <div>
                <b>
                  {p.title} <span className={`tag-g ${TAG_CLASSE[p.tag] ?? ""}`}>{p.tag}</span>
                </b>
                <small>{p.description}</small>
              </div>
            </div>
            <div className="actions-devis">
              <Inter on={p.visible} onClick={() => void basculerPage(p)} />
              <button type="button" className="btn second petit" onClick={() => setFenetre(p)}>
                <Ic n="crayon" /> Modifier
              </button>
            </div>
          </div>
        ))}
      </div>

      {nouveauTheme && (
        <Modale
          titre="Nouveau thème"
          sous="Il apparaîtra dans le choix des clientes, sur le configurateur."
          onClose={() => setNouveauTheme(null)}
          pied={
            <>
              <button type="button" className="btn discret" onClick={() => setNouveauTheme(null)}>
                Annuler
              </button>
              <div className="droite">
                <button
                  type="button"
                  className="btn principal"
                  onClick={() => {
                    const label = nouveauTheme.label.trim();
                    if (!label) return message("Écrivez le nom du thème");
                    const id = slugifier(label);
                    if (c.themes.some((t) => t.id === id)) return message("Ce thème existe déjà");
                    void enregistrer(
                      {
                        ...c,
                        themes: [
                          ...c.themes,
                          {
                            id,
                            label,
                            emoji: nouveauTheme.emoji || "🎂",
                            category: nouveauTheme.category as "age" | "motif" | "occasion",
                            visible: true,
                          },
                        ],
                      },
                      `Thème « ${label} » ajouté`,
                    );
                    setNouveauTheme(null);
                  }}
                >
                  <Ic n="check" /> Ajouter le thème
                </button>
              </div>
            </>
          }
        >
          <div className="grille2">
            <div className="champ">
              <label htmlFor="th-nom">Nom du thème</label>
              <input
                id="th-nom"
                autoFocus
                value={nouveauTheme.label}
                onChange={(e) => setNouveauTheme({ ...nouveauTheme, label: e.target.value })}
                placeholder="Ex. : Dinosaures"
              />
            </div>
            <div className="champ">
              <label htmlFor="th-emoji">Petit dessin (emoji)</label>
              <input
                id="th-emoji"
                value={nouveauTheme.emoji}
                onChange={(e) => setNouveauTheme({ ...nouveauTheme, emoji: e.target.value })}
                maxLength={4}
              />
            </div>
          </div>
          <div className="champ">
            <label htmlFor="th-cat">Rangé dans</label>
            <select
              id="th-cat"
              value={nouveauTheme.category}
              onChange={(e) => setNouveauTheme({ ...nouveauTheme, category: e.target.value })}
            >
              <option value="motif">Motifs</option>
              <option value="age">Âge</option>
              <option value="occasion">Occasions</option>
            </select>
          </div>
        </Modale>
      )}
      {fenetre && <FenetrePageGateau page={fenetre} onClose={() => setFenetre(null)} />}
    </>
  );
}
