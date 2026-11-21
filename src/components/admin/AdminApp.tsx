import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { listProductsForAdmin } from "@/api/catalog";
import { listCollections, type CollectionRow } from "@/api/collections";
import { listPageBanners, type PageBannerRow } from "@/api/banners";
import { listSeasons, type SeasonRow } from "@/api/seasons";
import { EcranBandeaux } from "./EcranBandeaux";
import { listFamilies, type FamilyRow } from "@/api/families";
import { listWaitlist, type WaitlistRow } from "@/api/waitlist";
import { listOrders, type OrderRow } from "@/api/orders";
import { getSettings, DEFAULT_SETTINGS, type ShopSettings } from "@/api/settings";
import type { ProductRow } from "@/lib/catalog";
import {
  alertes,
  enBoutique,
  type Contexte,
  type EcranKey,
  type FiltreProduits,
  type PanneauDemande,
} from "./core";
import {
  EcranAttente,
  EcranBord,
  EcranCollections,
  EcranCommandes,
  EcranFamilles,
} from "./screens";
import { EcranCampagnes } from "./EcranCampagnes";
import { EcranProduits } from "./EcranProduits";
import { filterPatisserieRows } from "@/lib/patisserie-scope";
import { EcranReglages } from "./EcranReglages";
import { EcranBientot } from "./EcranBientot";
import { PanelAlertes, Panneau } from "./panels";
import "./admin.css";

/** Les écrans du back-office, et ce que porte leur en-tête. */
const ECRANS = {
  bord: { titre: "Tableau de bord", fil: "Accueil", recherche: false, bouton: null },
  collections: {
    titre: "Rubriques du menu",
    fil: "Pâtisserie Tunisienne",
    recherche: false,
    bouton: "+ Nouvelle collection",
  },
  produits: {
    titre: "Produits",
    fil: "Pâtisserie Tunisienne",
    recherche: true,
    bouton: "+ Nouveau produit",
  },
  sale: {
    titre: "Plateaux salés",
    fil: "Ma boutique",
    recherche: true,
    bouton: "+ Nouveau plateau",
  },
  familles: {
    titre: "Familles & parfums",
    fil: "Pâtisserie Tunisienne",
    recherche: false,
    bouton: "+ Nouvelle famille",
  },
  campagnes: {
    titre: "Ramadan & Aïd",
    fil: "Pâtisserie Tunisienne",
    recherche: false,
    bouton: null,
  },
  gateaux: { titre: "Gâteaux", fil: "Ma boutique", recherche: false, bouton: null },
  coffrets: { titre: "Coffrets", fil: "Ma boutique", recherche: false, bouton: null },
  cadeaux: { titre: "Cadeaux", fil: "Ma boutique", recherche: false, bouton: null },
  evenements: { titre: "Événements", fil: "Ma boutique", recherche: false, bouton: null },
  maison: { titre: "La Maison", fil: "Mes pages", recherche: false, bouton: null },
  contact: { titre: "Contact", fil: "Mes pages", recherche: false, bouton: null },
  commandes: { titre: "Commandes", fil: "Gestion", recherche: false, bouton: null },
  attente: { titre: "Liste d'attente", fil: "Gestion", recherche: false, bouton: null },
  bandeaux: { titre: "Photos du site", fil: "Mes pages", recherche: false, bouton: null },
  reglages: { titre: "Réglages", fil: "Gestion", recherche: false, bouton: null },
} as const;

const UNIVERS: EcranKey[] = ["collections", "produits", "familles", "campagnes"];

export function AdminApp({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const [ecran, setEcran] = useState<EcranKey>("bord");
  const [filtreProduits, setFiltreProduits] = useState<FiltreProduits>("tous");
  const [ptOuvert, setPtOuvert] = useState(true);
  // Sous 900 px, la barre latérale devient un tiroir ouvert par le bouton ☰.
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [recherche, setRecherche] = useState("");
  const [panneau, setPanneau] = useState<PanneauDemande | null>(null);

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
        // Sans la migration 022, seul l'écran Commandes reste vide.
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

  const aller = useCallback((e: EcranKey, filtre: FiltreProduits = "tous") => {
    setEcran(e);
    setFiltreProduits(filtre);
    setRecherche("");
    setMenuOuvert(false);
    if (UNIVERS.includes(e)) setPtOuvert(true);
  }, []);

  useEffect(() => {
    if (!menuOuvert) return;
    const fermer = (ev: KeyboardEvent) => ev.key === "Escape" && setMenuOuvert(false);
    window.addEventListener("keydown", fermer);
    return () => window.removeEventListener("keydown", fermer);
  }, [menuOuvert]);

  const ctx: Contexte = {
    produits,
    collections,
    familles,
    saisons,
    attente,
    commandes,
    reglages,
    bandeaux,
    recherche,
    recharger,
    ouvrir: setPanneau,
    aller,
  };

  const meta = ECRANS[ecran];
  const nbAlertes = useMemo(() => alertes(produits).length, [produits]);
  // Le compteur « Produits » ne compte que la Pâtisserie ; les plateaux salés ont le leur.
  const vivants = filterPatisserieRows(enBoutique(produits));
  const plateaux = enBoutique(produits).filter((r) => r.category === "sale");

  /** Le bouton d'action du haut dépend de l'écran ouvert. */
  const nouveau = () => {
    if (ecran === "collections") return setPanneau({ type: "collection", row: null });
    if (ecran === "familles") return setPanneau({ type: "famille", row: null });
    if (ecran === "sale") return setPanneau({ type: "produit", row: null, categorie: "sale" });
    setPanneau({ type: "produit", row: null });
  };

  return (
    <div className="osadmin">
      {reglages.holidayMode && (
        <div className="vacbar">
          <span aria-hidden="true">🌴</span>
          <span>
            <b>Mode vacances actif</b> — aucune commande ne peut être passée
            {reglages.holidayUntil ? (
              <>
                , jusqu'au <b>{reglages.holidayUntil}</b>
              </>
            ) : null}
            . Vos stocks sont intacts et vous reviennent à la réouverture.
          </span>
          <button type="button" onClick={() => aller("reglages")}>
            Rouvrir la boutique
          </button>
        </div>
      )}

      <div className="app">
        {menuOuvert && (
          <div className="side-scrim" aria-hidden="true" onClick={() => setMenuOuvert(false)} />
        )}
        <aside id="admin-nav" className={`side${menuOuvert ? " open" : ""}`}>
          <button
            type="button"
            className="side-close"
            onClick={() => setMenuOuvert(false)}
            aria-label="Fermer le menu"
          >
            ✕
          </button>
          <div className="brand">
            <div className="n display">Ö' Sweets</div>
            <div className="s">Administration</div>
          </div>
          <div className="sep" />

          <div className="navscroll">
            <div className="navgroup" style={{ marginBottom: 12 }}>
              <NavItem actif={ecran === "bord"} onClick={() => aller("bord")} ico="accueil">
                Accueil
              </NavItem>
            </div>

            {/* Même ordre que le menu de la boutique : chaque partie au même endroit. */}
            <div className="navgroup">
              <h4>Ma boutique</h4>
              <button
                type="button"
                className={`navitem${UNIVERS.includes(ecran) ? " on" : ""}${ptOuvert ? " open" : ""}`}
                onClick={() => setPtOuvert((v) => !v)}
                aria-expanded={ptOuvert}
              >
                <span className="ico">{ICONES.patisserie}</span>
                <span className="grow">Pâtisserie Tunisienne</span>
                <span className="chev">⌄</span>
              </button>
              <div className={`subnav${ptOuvert ? " open" : ""}`}>
                <SubItem
                  actif={ecran === "produits"}
                  onClick={() => aller("produits")}
                  n={vivants.length}
                >
                  Produits
                </SubItem>
                <SubItem
                  actif={ecran === "collections"}
                  onClick={() => aller("collections")}
                  n={collections.length}
                >
                  Rubriques du menu
                </SubItem>
                <SubItem
                  actif={ecran === "familles"}
                  onClick={() => aller("familles")}
                  n={familles.length}
                >
                  Familles &amp; parfums
                </SubItem>
                <SubItem actif={ecran === "campagnes"} onClick={() => aller("campagnes")}>
                  Ramadan &amp; Aïd
                </SubItem>
              </div>
              <NavItem
                actif={ecran === "gateaux"}
                onClick={() => aller("gateaux")}
                ico="gateaux"
                bientot
              >
                Gâteaux
              </NavItem>
              <NavItem
                actif={ecran === "coffrets"}
                onClick={() => aller("coffrets")}
                ico="coffrets"
                bientot
              >
                Coffrets
              </NavItem>
              <NavItem actif={ecran === "sale"} onClick={() => aller("sale")} ico="sale">
                Salé ({plateaux.length})
              </NavItem>
              <NavItem
                actif={ecran === "cadeaux"}
                onClick={() => aller("cadeaux")}
                ico="cadeaux"
                bientot
              >
                Cadeaux
              </NavItem>
              <NavItem
                actif={ecran === "evenements"}
                onClick={() => aller("evenements")}
                ico="evenements"
                bientot
              >
                Événements
              </NavItem>
            </div>

            <div className="navgroup">
              <h4>Mes pages</h4>
              <NavItem
                actif={ecran === "maison"}
                onClick={() => aller("maison")}
                ico="maison"
                bientot
              >
                La Maison
              </NavItem>
              <NavItem
                actif={ecran === "contact"}
                onClick={() => aller("contact")}
                ico="contact"
                bientot
              >
                Contact
              </NavItem>
              <NavItem actif={ecran === "bandeaux"} onClick={() => aller("bandeaux")} ico="photos">
                Photos du site
              </NavItem>
            </div>

            <div className="navgroup">
              <h4>Gestion</h4>
              <NavItem
                actif={ecran === "commandes"}
                onClick={() => aller("commandes")}
                ico="commandes"
                badge={commandes.filter((o) => o.status === "nouvelle").length}
              >
                Commandes
              </NavItem>
              <NavItem
                actif={ecran === "attente"}
                onClick={() => aller("attente")}
                ico="attente"
                badge={attente.length}
              >
                Liste d'attente
              </NavItem>
              <NavItem
                actif={ecran === "reglages"}
                onClick={() => aller("reglages")}
                ico="reglages"
              >
                Réglages
              </NavItem>
            </div>
          </div>

          <div className="sidefoot">
            <div className="helpcard">
              <div className="t">Besoin d'aide ?</div>
              <p>Vérifiez le rendu côté cliente après vos modifications.</p>
              <a href="/" target="_blank" rel="noreferrer">
                Voir ma boutique ↗
              </a>
            </div>
          </div>
        </aside>

        <main className="main">
          <header className="top">
            <button
              type="button"
              className="burger"
              onClick={() => setMenuOuvert(true)}
              aria-label="Ouvrir le menu"
              aria-controls="admin-nav"
              aria-expanded={menuOuvert}
            >
              ☰
            </button>
            <div className="grow">
              <div className="crumb">
                Administration <span style={{ opacity: 0.5 }}>/</span> <span>{meta.fil}</span>
              </div>
              <h1>{meta.titre}</h1>
            </div>

            {meta.recherche && (
              <div className="search">
                <span className="mag">⌕</span>
                <input
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  placeholder="Rechercher un produit…"
                />
              </div>
            )}

            <button
              type="button"
              className="bell"
              title="Alertes de stock"
              onClick={() => setPanneau({ type: "alertes" })}
            >
              🔔
              {nbAlertes > 0 && <span className="n">{nbAlertes}</span>}
            </button>

            {meta.bouton && (
              <button type="button" className="btn-dark" onClick={nouveau}>
                {meta.bouton}
              </button>
            )}

            <button type="button" className="avatar" onClick={onSignOut} title="Se déconnecter">
              <div>
                <div className="who">{email}</div>
                <div className="role">Se déconnecter</div>
              </div>
            </button>
          </header>

          <section className="content">
            {erreur && (
              <div className="note" style={{ borderLeftColor: "#c0392b" }}>
                <b>La base ne répond pas.</b>
                <div style={{ marginTop: 4, fontSize: 12, opacity: 0.7 }}>{erreur}</div>
              </div>
            )}

            {chargement ? (
              <div className="empty">Chargement…</div>
            ) : ecran === "bord" ? (
              <EcranBord ctx={ctx} />
            ) : ecran === "produits" ? (
              <EcranProduits key={filtreProduits} ctx={ctx} filtreInitial={filtreProduits} />
            ) : ecran === "sale" ? (
              <EcranProduits key={`sale-${filtreProduits}`} ctx={ctx} univers="sale" />
            ) : ecran === "collections" ? (
              <EcranCollections ctx={ctx} />
            ) : ecran === "familles" ? (
              <EcranFamilles ctx={ctx} />
            ) : ecran === "campagnes" ? (
              <EcranCampagnes ctx={ctx} />
            ) : ecran === "commandes" ? (
              <EcranCommandes ctx={ctx} />
            ) : ecran === "attente" ? (
              <EcranAttente ctx={ctx} />
            ) : ecran === "bandeaux" ? (
              <EcranBandeaux ctx={ctx} />
            ) : ecran === "gateaux" ||
              ecran === "coffrets" ||
              ecran === "cadeaux" ||
              ecran === "evenements" ||
              ecran === "maison" ||
              ecran === "contact" ? (
              <EcranBientot partie={ecran} />
            ) : (
              <EcranReglages ctx={ctx} />
            )}
          </section>
        </main>
      </div>

      {panneau?.type === "alertes" ? (
        <PanelAlertes ctx={ctx} onClose={() => setPanneau(null)} />
      ) : panneau ? (
        <Panneau demande={panneau} ctx={ctx} onClose={() => setPanneau(null)} />
      ) : null}
    </div>
  );
}

/** Les icônes du menu, dessinées (trait, 24 × 24). */
const trace = (d: ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {d}
  </svg>
);
const ICONES: Record<string, ReactNode> = {
  accueil: trace(
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M10 21v-6h4v6" />
    </>,
  ),
  patisserie: trace(
    <>
      <path d="M16 10a4 4 0 0 1-8 0" />
      <path d="M3.1 6h17.8" />
      <path d="M3.4 5.5a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.7a2 2 0 0 0-.4-1.2l-2-2.7A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
    </>,
  ),
  gateaux: trace(
    <>
      <path d="M4 21h16" />
      <path d="M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7" />
      <path d="M5 16c1.5 0 1.5 1 3.5 1s2-1 3.5-1 1.5 1 3.5 1 2-1 3.5-1" />
      <path d="M12 12V8" />
    </>,
  ),
  coffrets: trace(
    <>
      <rect x="3" y="8" width="18" height="13" rx="2" />
      <path d="M12 8v13M3 12h18" />
      <path d="M12 8S10.5 3 8 3a2 2 0 0 0 0 5h4zM12 8s1.5-5 4-5a2 2 0 0 1 0 5h-4z" />
    </>,
  ),
  sale: trace(
    <>
      <path d="M3 15h18" />
      <path d="M4 15a8 8 0 0 1 16 0" />
      <path d="M12 7V5M9 19h6" />
    </>,
  ),
  cadeaux: trace(
    <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />,
  ),
  evenements: trace(
    <path d="m12 3 2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.5l1.1-6L3.4 9.3l6-.8z" />,
  ),
  maison: trace(
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </>,
  ),
  contact: trace(
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
  ),
  photos: trace(
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </>,
  ),
  commandes: trace(
    <>
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </>,
  ),
  attente: trace(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>,
  ),
  reglages: trace(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
    </>,
  ),
};

function NavItem({
  actif,
  onClick,
  ico,
  badge,
  bientot,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  ico: string;
  badge?: number;
  /** Partie du site pas encore pilotée par l'admin. */
  bientot?: boolean;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`navitem${actif ? " on" : ""}`} onClick={onClick}>
      <span className="ico">{ICONES[ico] ?? ico}</span>
      <span className="grow">{children}</span>
      {badge ? <span className="badge">{badge}</span> : null}
      {bientot ? <span className="bientot">Bientôt</span> : null}
    </button>
  );
}

function SubItem({
  actif,
  onClick,
  n,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  n?: number;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`subitem${actif ? " on" : ""}`} onClick={onClick}>
      <i />
      <span className="grow">{children}</span>
      {n !== undefined && <span className="sb">{n}</span>}
    </button>
  );
}
