import { useCallback, useEffect, useRef, useState } from "react";
import { listProductsForAdmin } from "@/api/catalog";
import { listCollections, type CollectionRow } from "@/api/collections";
import { listPageBanners, type PageBannerRow } from "@/api/banners";
import { listSeasons, type SeasonRow } from "@/api/seasons";
import { listFamilies, type FamilyRow } from "@/api/families";
import { listWaitlist, type WaitlistRow } from "@/api/waitlist";
import { listOrders, type OrderRow } from "@/api/orders";
import { getSettings, DEFAULT_SETTINGS, type ShopSettings } from "@/api/settings";
import type { ProductRow } from "@/lib/catalog";
import type { Contexte, EcranKey, PanneauDemande } from "../core";
import { EcranAttente } from "../screens";
import { EcranCampagnes } from "../EcranCampagnes";
import { EcranBandeaux } from "../EcranBandeaux";
import { PanelAlertes, Panneau } from "../panels";
import { FenetreProduit } from "./FenetreProduit";
import { BarreHaut, Menu, Palette, useMenu, type Alerte } from "./Navigation";
import { filterPatisserieRows } from "@/lib/patisserie-scope";
import { adminImage, enBoutique } from "../core";
import {
  EcranAccueil,
  EcranCommandesV2,
  EcranFamillesV2,
  EcranListe,
  EcranPartie,
  EcranReglagesV2,
  EcranRubriques,
  SectionPat,
  type Partie,
} from "./Ecrans";
import { EcranProfil } from "./Profil";
import { COLONNES_G, EcranGateaux, EcranMesure, EcranPagesGateaux } from "./Gateaux";
import { listGateaux, type GateauxData } from "@/api/gateaux";
import type { AdminIdentity } from "@/api/auth";
import { Ic, Toasts, V2Context, type Preset, type Toast } from "./ui";
import "../admin.css";
import "../admin2.css";

/*
 * L'administration, telle que le prototype validé (prototype-admin/index.html) :
 * même menu, mêmes écrans, mêmes fenêtres — sur les vraies données.
 */

type Ecran =
  | "accueil"
  | "produits"
  | "familles"
  | "collections"
  | "campagnes"
  | "sale"
  | "commandes"
  | "reglages"
  | "bandeaux"
  | "attente"
  | "profil"
  | "gpages"
  | "gmesure"
  | Partie;

/** Le menu de gauche suit le menu du site : chaque partie au même endroit. */
const SECTIONS: { titre: string; items: [Ecran, string, string, [Ecran, string][]?][] }[] = [
  { titre: "", items: [["accueil", "maison", "Accueil"]] },
  {
    titre: "Ma boutique",
    items: [
      [
        "produits",
        "sac",
        "Pâtisserie Tunisienne",
        [
          ["produits", "Produits"],
          ["familles", "Familles"],
          ["collections", "Rubriques du menu"],
        ],
      ],
      [
        "gateaux",
        "gateau",
        "Gâteaux",
        [
          ["gateaux", "Produits"],
          ["gpages", "Pages du menu"],
          ["gmesure", "Sur mesure"],
        ],
      ],
      ["coffrets", "coffret", "Coffrets"],
      ["sale", "plat", "Salé"],
      ["cadeaux", "coeur", "Cadeaux"],
      ["evenements", "etoile", "Événements"],
    ],
  },
  {
    titre: "Mes pages",
    items: [
      ["maison", "livre", "La Maison"],
      ["contact", "tel", "Contact"],
      ["bandeaux", "photo", "Photos du site"],
    ],
  },
  {
    titre: "Gestion",
    items: [
      ["commandes", "recu", "Commandes"],
      ["attente", "horloge", "Liste d'attente"],
      ["reglages", "reglage", "Réglages"],
    ],
  },
];
const PATISSERIE: Ecran[] = ["produits", "familles", "collections", "campagnes"];
const GATEAUX: Ecran[] = ["gateaux", "gpages", "gmesure"];
const NOMS: Record<Ecran, string> = {
  accueil: "Accueil",
  produits: "Produits",
  familles: "Familles",
  collections: "Rubriques du menu",
  campagnes: "Ramadan & Aïd",
  gateaux: "Produits",
  gpages: "Pages du menu",
  gmesure: "Sur mesure",
  coffrets: "Coffrets",
  sale: "Salé",
  cadeaux: "Cadeaux",
  evenements: "Événements",
  maison: "La Maison",
  contact: "Contact",
  bandeaux: "Photos du site",
  commandes: "Commandes",
  attente: "Liste d'attente",
  reglages: "Réglages",
  profil: "Mon profil",
};
/** Les écrans de l'ancienne administration, gardés tels quels dans le nouveau cadre. */
const ANCIENS: Ecran[] = ["campagnes", "bandeaux", "attente"];

export function AdminV2({
  admin,
  onAdminChange,
  onSignOut,
}: {
  admin: AdminIdentity;
  onAdminChange: (a: AdminIdentity) => void;
  onSignOut: () => void;
}) {
  const { email, displayName: nom } = admin;
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [rubrique, setRubrique] = useState("");
  const [colonneG, setColonneG] = useState("");
  const [gat, setGat] = useState<GateauxData | null>(null);
  const rechargerGat = useCallback(async () => {
    try {
      setGat(await listGateaux());
    } catch {
      setGat({ ok: false, pages: [], gateaux: [], config: null });
    }
  }, []);
  const [filtre, setFiltre] = useState<string | undefined>();
  const [panneau, setPanneau] = useState<PanneauDemande | null>(null);
  const [fenetre, setFenetre] = useState<{
    row: ProductRow | null;
    preset?: Preset;
    n: number;
  } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const suivant = useRef(1);
  const menu = useMenu();
  const [palette, setPalette] = useState(false);

  const [produits, setProduits] = useState<ProductRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [familles, setFamilles] = useState<FamilyRow[]>([]);
  const [attente, setAttente] = useState<WaitlistRow[]>([]);
  const [commandes, setCommandes] = useState<OrderRow[]>([]);
  const [reglages, setReglages] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [bandeaux, setBandeaux] = useState<PageBannerRow[]>([]);
  const [saisons, setSaisons] = useState<SeasonRow[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(async () => {
    try {
      const [p, c, f, a, s, b, sa, o] = await Promise.all([
        listProductsForAdmin(),
        listCollections(),
        listFamilies(),
        listWaitlist(),
        getSettings(),
        listPageBanners(),
        listSeasons(),
        listOrders().catch(() => []),
      ]);
      setProduits(p);
      setCollections(c);
      setFamilles(f);
      setAttente(a);
      setReglages(s);
      setBandeaux(b);
      setSaisons(sa);
      setCommandes(o);
      setErreur(null);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Base de données injoignable.");
    }
    setChargement(false);
  }, []);

  useEffect(() => {
    void recharger();
    void rechargerGat();
  }, [recharger, rechargerGat]);

  const { setTiroir } = menu;
  const aller = useCallback(
    (e: string, f?: string) => {
      setEcran((e === "bord" ? "accueil" : e) as Ecran);
      setFiltre(f);
      setRubrique("");
      setColonneG("");
      setTiroir(false);
      window.scrollTo({ top: 0 });
    },
    [setTiroir],
  );

  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
        return;
      }
      if (e.key === "Escape") menu.setTiroir(false);
      const cible = document.activeElement?.tagName ?? "";
      if (e.key === "[" && !/INPUT|TEXTAREA|SELECT/.test(cible) && !menu.telephone) menu.basculer();
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [menu]);

  const retirer = useCallback((id: number) => setToasts((l) => l.filter((t) => t.id !== id)), []);
  const message = useCallback(
    (texte: string, annuler?: () => void) => {
      const id = suivant.current++;
      setToasts((l) => [...l, { id, texte, annuler }]);
      setTimeout(() => retirer(id), annuler ? 6000 : 3600);
    },
    [retirer],
  );

  const ctx: Contexte = {
    produits,
    collections,
    familles,
    saisons,
    attente,
    commandes,
    reglages,
    bandeaux,
    recherche: "",
    recharger,
    ouvrir: setPanneau,
    aller: (e: EcranKey) => aller(e),
  };
  const v2 = {
    ctx,
    message,
    aller,
    gat,
    rechargerGat,
    modifier: (row: ProductRow | null, preset?: Preset) =>
      setFenetre((f) => ({ row, preset, n: (f?.n ?? 0) + 1 })),
  };

  const nouvelles = commandes.filter((c) => c.status === "nouvelle").length;
  const comptes: Record<string, number> = {
    gateaux: gat?.gateaux.length ?? 0,
    gpages: gat?.pages.length ?? 0,
    produits: filterPatisserieRows(produits).filter((r) => !r.archived).length,
    familles: familles.length,
    collections: collections.length,
  };
  const sansPhoto = enBoutique(produits).filter(
    (r) => r.published && !r.draft && !adminImage(r),
  ).length;
  const alertes: Alerte[] = [
    ...commandes
      .filter((c) => c.status === "nouvelle")
      .map((c) => ({
        cle: c.id,
        texte: `Nouvelle commande ${c.number}`,
        detail: `${c.first_name} ${c.last_name}`.trim(),
        aller: () => aller("commandes"),
      })),
    ...(sansPhoto
      ? [
          {
            cle: "sansphoto",
            texte: `${sansPhoto} produit${sansPhoto > 1 ? "s" : ""} sans photo`,
            detail: "Une photo aide beaucoup à vendre.",
            couleur: "ambre" as const,
            aller: () => aller("produits", "sansphoto"),
          },
        ]
      : []),
    ...(attente.length
      ? [
          {
            cle: "attente",
            texte: `${attente.length} cliente${attente.length > 1 ? "s" : ""} en liste d'attente`,
            detail: "À prévenir quand le produit revient.",
            couleur: "ambre" as const,
            aller: () => aller("attente"),
          },
        ]
      : []),
  ];
  const allerRubrique = (cle: string) => {
    aller("produits");
    setRubrique(cle);
  };
  const cleSaisons = new Set(saisons.map((s) => s.season_key));
  const patVivants = filterPatisserieRows(produits).filter((r) => !r.archived);
  const rubriquesMenu = [...collections]
    .filter((c) => c.published && !c.hidden)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({
      cle: c.product_key,
      nom: c.label,
      n: patVivants.filter((r) => (r.collections ?? []).includes(c.product_key)).length,
      fete: cleSaisons.has(c.product_key),
    }));
  const colonnesGateaux = COLONNES_G.map((col) => ({
    cle: col,
    nom: col,
    n: (gat?.gateaux ?? []).filter(
      (g) => gat?.pages.find((p) => p.key === g.page_key)?.column_label === col,
    ).length,
  })).filter((c) => c.n > 0);
  const allerColonne = (col: string) => {
    aller("gateaux");
    setColonneG(col);
  };
  const nomEcran = NOMS[ecran];
  const dansGat = GATEAUX.includes(ecran);
  const dansPat = PATISSERIE.includes(ecran);

  const contenu = chargement ? (
    <div className="carte bloc" style={{ textAlign: "center" }}>
      Chargement…
    </div>
  ) : ecran === "accueil" ? (
    <EcranAccueil aller={aller} />
  ) : ecran === "produits" ? (
    <EcranListe
      key={`p-${filtre}`}
      univers="patisserie"
      filtreInitial={filtre}
      rubrique={rubrique}
      setRubrique={setRubrique}
    />
  ) : ecran === "sale" ? (
    <EcranListe key={`s-${filtre}`} univers="sale" filtreInitial={filtre} />
  ) : ecran === "familles" ? (
    <EcranFamillesV2 />
  ) : ecran === "collections" ? (
    <EcranRubriques />
  ) : ecran === "commandes" ? (
    <EcranCommandesV2 />
  ) : ecran === "gateaux" ? (
    <EcranGateaux colonne={colonneG} setColonne={setColonneG} />
  ) : ecran === "gpages" ? (
    <EcranPagesGateaux />
  ) : ecran === "gmesure" ? (
    <EcranMesure />
  ) : ecran === "profil" ? (
    <EcranProfil admin={admin} onChange={onAdminChange} />
  ) : ecran === "reglages" ? (
    <EcranReglagesV2 key={JSON.stringify(reglages)} aller={aller} />
  ) : ANCIENS.includes(ecran) ? (
    <>
      {ecran === "campagnes" ? (
        <SectionPat ecran="campagnes" />
      ) : (
        <div className="entete">
          <div>
            <h1 className="titre">{nomEcran}</h1>
          </div>
        </div>
      )}
      <div className="osadmin ancien">
        {ecran === "campagnes" ? (
          <EcranCampagnes ctx={ctx} />
        ) : ecran === "bandeaux" ? (
          <EcranBandeaux ctx={ctx} />
        ) : (
          <EcranAttente ctx={ctx} />
        )}
      </div>
    </>
  ) : (
    <EcranPartie partie={ecran as Partie} />
  );

  return (
    <V2Context.Provider value={v2}>
      <div className="os2">
        <div className={`app${menu.replie ? " replie" : ""}${menu.tiroir ? " tiroir" : ""}`}>
          <nav className="menu" id="menu">
            <Menu
              sections={SECTIONS}
              ecran={ecran}
              sousActifs={PATISSERIE}
              aller={aller}
              comptes={comptes}
              pastilles={{ commandes: nouvelles, attente: attente.length }}
              replie={menu.replie}
              telephone={menu.telephone}
              basculer={menu.basculer}
              palette={() => setPalette(true)}
              email={email}
              nom={nom}
              rubriques={rubriquesMenu}
              rubrique={rubrique}
              allerRubrique={allerRubrique}
              colonnes={colonnesGateaux}
              colonne={colonneG}
              allerColonne={allerColonne}
              onSignOut={onSignOut}
            />
          </nav>
          <div className="voile-menu" onClick={() => menu.setTiroir(false)} />

          <main className="contenu" id="ecran">
            <BarreHaut
              fil={
                dansPat
                  ? [
                      ["produits", "Pâtisserie Tunisienne"],
                      [ecran, nomEcran],
                    ]
                  : [[ecran, nomEcran]]
              }
              titre={nomEcran}
              alertes={alertes}
              email={email}
              nom={nom}
              ouvrirTiroir={() => menu.setTiroir(true)}
              palette={() => setPalette(true)}
              aller={aller}
              onSignOut={onSignOut}
            />
            {reglages.holidayMode && (
              <div className="conseil" style={{ marginBottom: 18 }}>
                <Ic n="info" />
                <span>
                  <b>Mode vacances actif</b> — personne ne peut commander
                  {reglages.holidayUntil ? ` jusqu'au ${reglages.holidayUntil}` : ""}. Pour rouvrir
                  :{" "}
                  <button
                    type="button"
                    className="btn second petit"
                    onClick={() => aller("reglages")}
                  >
                    Réglages
                  </button>
                </span>
              </div>
            )}
            {erreur && (
              <div className="conseil" style={{ marginBottom: 18 }}>
                <Ic n="info" />
                <span>
                  <b>La base ne répond pas.</b> {erreur}
                </span>
              </div>
            )}
            {contenu}
          </main>
        </div>

        {fenetre && (
          <FenetreProduit
            key={fenetre.n}
            row={fenetre.row}
            preset={fenetre.preset}
            onClose={() => setFenetre(null)}
          />
        )}
        <Toasts liste={toasts} retirer={retirer} />
        {palette && (
          <Palette
            sections={SECTIONS}
            produits={produits}
            aller={aller}
            modifier={(row) => v2.modifier(row)}
            onClose={() => setPalette(false)}
          />
        )}
      </div>

      {panneau && (
        <div className="osadmin ancien-panneau">
          {panneau.type === "alertes" ? (
            <PanelAlertes ctx={ctx} onClose={() => setPanneau(null)} />
          ) : (
            <Panneau demande={panneau} ctx={ctx} onClose={() => setPanneau(null)} />
          )}
        </div>
      )}
    </V2Context.Provider>
  );
}
