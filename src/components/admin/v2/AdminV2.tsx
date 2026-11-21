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
import {
  EcranAccueil,
  EcranCommandesV2,
  EcranFamillesV2,
  EcranListe,
  EcranPartie,
  EcranReglagesV2,
  EcranRubriques,
  type Partie,
} from "./Ecrans";
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
          ["campagnes", "Ramadan & Aïd"],
        ],
      ],
      ["gateaux", "gateau", "Gâteaux"],
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
const NOMS: Record<Ecran, string> = {
  accueil: "Accueil",
  produits: "Produits",
  familles: "Familles",
  collections: "Rubriques du menu",
  campagnes: "Ramadan & Aïd",
  gateaux: "Gâteaux",
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
};
/** Les écrans de l'ancienne administration, gardés tels quels dans le nouveau cadre. */
const ANCIENS: Ecran[] = ["campagnes", "bandeaux", "attente"];

export function AdminV2({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [ecran, setEcran] = useState<Ecran>("accueil");
  const [filtre, setFiltre] = useState<string | undefined>();
  const [panneau, setPanneau] = useState<PanneauDemande | null>(null);
  const [fenetre, setFenetre] = useState<{
    row: ProductRow | null;
    preset?: Preset;
    n: number;
  } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const suivant = useRef(1);

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
  }, [recharger]);

  const aller = useCallback((e: string, f?: string) => {
    setEcran((e === "bord" ? "accueil" : e) as Ecran);
    setFiltre(f);
    window.scrollTo({ top: 0 });
  }, []);

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
    modifier: (row: ProductRow | null, preset?: Preset) =>
      setFenetre((f) => ({ row, preset, n: (f?.n ?? 0) + 1 })),
  };

  const nouvelles = commandes.filter((c) => c.status === "nouvelle").length;
  const nomEcran = NOMS[ecran];
  const dansPat = PATISSERIE.includes(ecran);

  const contenu = chargement ? (
    <div className="carte bloc" style={{ textAlign: "center" }}>
      Chargement…
    </div>
  ) : ecran === "accueil" ? (
    <EcranAccueil aller={aller} />
  ) : ecran === "produits" ? (
    <EcranListe key={`p-${filtre}`} univers="patisserie" filtreInitial={filtre} />
  ) : ecran === "sale" ? (
    <EcranListe key={`s-${filtre}`} univers="sale" filtreInitial={filtre} />
  ) : ecran === "familles" ? (
    <EcranFamillesV2 />
  ) : ecran === "collections" ? (
    <EcranRubriques />
  ) : ecran === "commandes" ? (
    <EcranCommandesV2 />
  ) : ecran === "reglages" ? (
    <EcranReglagesV2 key={JSON.stringify(reglages)} aller={aller} />
  ) : ANCIENS.includes(ecran) ? (
    <>
      <div className="entete">
        <div>
          <h1 className="titre">{nomEcran}</h1>
        </div>
      </div>
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
        <div className="app">
          <nav className="menu" id="menu">
            <div className="marque">
              <span className="logo">Ö</span>
              <div>
                <b>Ö' Sweets</b>
                <span>Mon espace</span>
              </div>
            </div>
            <div className="separateur" />
            {SECTIONS.map((sec) => (
              <div key={sec.titre || "haut"} style={{ display: "contents" }}>
                {sec.titre && <div className="sec">{sec.titre}</div>}
                {sec.items.map(([k, icone, nom, sous]) => {
                  const actif = sous ? dansPat : ecran === k;
                  return (
                    <div key={k} style={{ display: "contents" }}>
                      <button
                        type="button"
                        className={`lien${actif ? " on" : ""}`}
                        onClick={() => aller(k)}
                      >
                        <span className="ibox">
                          <Ic n={icone} />
                        </span>
                        <span>{nom}</span>
                        {k === "commandes" && nouvelles > 0 && (
                          <span className="pastille">{nouvelles}</span>
                        )}
                        {k === "attente" && attente.length > 0 && (
                          <span className="pastille">{attente.length}</span>
                        )}
                        {sous && <span className="chev">⌄</span>}
                      </button>
                      {sous && actif && (
                        <div className="sous-liens">
                          {sous.map(([sk, sn]) => (
                            <button
                              type="button"
                              key={sk}
                              className={`sous-lien${ecran === sk ? " on" : ""}`}
                              onClick={() => aller(sk)}
                            >
                              {sn}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="bas">
              <div className="aide-carte">
                <span className="ibox">
                  <Ic n="info" />
                </span>
                <b>Besoin d'aide ?</b>
                <span>Chaque page explique ses gestes en haut.</span>
                <a className="voir-site" href="/" target="_blank" rel="noreferrer">
                  <Ic n="lien" /> Voir ma boutique
                </a>
              </div>
              <button
                type="button"
                className="compte"
                onClick={onSignOut}
                style={{ border: 0, background: "none", width: "100%" }}
              >
                {email} · Se déconnecter
              </button>
            </div>
          </nav>

          <main className="contenu" id="ecran">
            <div className="topbar">
              <div>
                <small>
                  Ö' Sweets / {dansPat && <>Pâtisserie Tunisienne / </>}
                  <b>{nomEcran}</b>
                </small>
                <strong>{nomEcran}</strong>
              </div>
              <div className="droite">
                <span>
                  <Ic n="maison" /> Atelier d'Évry
                </span>
                <span>
                  <Ic n="recu" /> {nouvelles} nouvelle{nouvelles > 1 ? "s" : ""}
                </span>
              </div>
            </div>
            {dansPat && (
              <div className="filtres onglets-pat">
                {(
                  [
                    ["produits", "Produits"],
                    ["familles", "Familles"],
                    ["collections", "Rubriques du menu"],
                    ["campagnes", "Ramadan & Aïd"],
                  ] as [Ecran, string][]
                ).map(([k, n]) => (
                  <button
                    type="button"
                    key={k}
                    className={`filtre${ecran === k ? " on" : ""}`}
                    onClick={() => aller(k)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            )}
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
