import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { listProductsForAdmin } from "@/api/catalog";
import { listCollections, type CollectionRow } from "@/api/collections";
import { listPageBanners, type PageBannerRow } from "@/api/banners";
import { listSeasons, type SeasonRow } from "@/api/seasons";
import { EcranBandeaux } from "./EcranBandeaux";
import { listFamilies, type FamilyRow } from "@/api/families";
import { listWaitlist, type WaitlistRow } from "@/api/waitlist";
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
import { EcranReglages } from "./EcranReglages";
import { PanelAlertes, Panneau } from "./panels";
import "./admin.css";

/** Les écrans du back-office, et ce que porte leur en-tête. */
const ECRANS = {
  bord: { titre: "Tableau de bord", fil: "Pilotage", recherche: false, bouton: null },
  collections: {
    titre: "Collections",
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
  familles: {
    titre: "Familles & parfums",
    fil: "Pâtisserie Tunisienne",
    recherche: false,
    bouton: "+ Nouvelle famille",
  },
  campagnes: { titre: "Ramadan & Aïd", fil: "Saisons", recherche: false, bouton: null },
  commandes: { titre: "Commandes", fil: "Ventes", recherche: false, bouton: null },
  attente: { titre: "Liste d'attente", fil: "Clientes", recherche: false, bouton: null },
  bandeaux: { titre: "Bandeaux", fil: "Apparence", recherche: false, bouton: null },
  reglages: { titre: "Réglages", fil: "Paramètres", recherche: false, bouton: null },
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
  const [reglages, setReglages] = useState<ShopSettings>(DEFAULT_SETTINGS);
  const [bandeaux, setBandeaux] = useState<PageBannerRow[]>([]);
  const [saisons, setSaisons] = useState<SeasonRow[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(async () => {
    try {
      const [p, c, f, a, s, b, sa] = await Promise.all([
        listProductsForAdmin(),
        listCollections(),
        listFamilies(),
        listWaitlist(),
        getSettings(),
        listPageBanners(),
        listSeasons(),
      ]);
      setProduits(p);
      setCollections(c);
      setFamilles(f);
      setAttente(a);
      setReglages(s);
      setBandeaux(b);
      setSaisons(sa);
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
    reglages,
    bandeaux,
    recherche,
    recharger,
    ouvrir: setPanneau,
    aller,
  };

  const meta = ECRANS[ecran];
  const nbAlertes = useMemo(() => alertes(produits).length, [produits]);
  const vivants = enBoutique(produits);

  /** Le bouton d'action du haut dépend de l'écran ouvert. */
  const nouveau = () => {
    if (ecran === "collections") return setPanneau({ type: "collection", row: null });
    if (ecran === "familles") return setPanneau({ type: "famille", row: null });
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
              <NavItem actif={ecran === "bord"} onClick={() => aller("bord")} ico="▦">
                Tableau de bord
              </NavItem>
            </div>

            <div className="navgroup">
              <h4>Univers</h4>
              <button
                type="button"
                className={`navitem${UNIVERS.includes(ecran) ? " on" : ""}${ptOuvert ? " open" : ""}`}
                onClick={() => setPtOuvert((v) => !v)}
                aria-expanded={ptOuvert}
              >
                <span className="ico">◍</span>
                <span className="grow">Pâtisserie Tunisienne</span>
                <span className="chev">⌄</span>
              </button>
              <div className={`subnav${ptOuvert ? " open" : ""}`}>
                <SubItem
                  actif={ecran === "collections"}
                  onClick={() => aller("collections")}
                  n={collections.length}
                >
                  Collections
                </SubItem>
                <SubItem
                  actif={ecran === "produits"}
                  onClick={() => aller("produits")}
                  n={vivants.length}
                >
                  Produits
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
            </div>

            <div className="navgroup">
              <h4>Ventes</h4>
              <NavItem actif={ecran === "commandes"} onClick={() => aller("commandes")} ico="▢">
                Commandes
              </NavItem>
            </div>

            <div className="navgroup">
              <h4>Clientes</h4>
              <NavItem
                actif={ecran === "attente"}
                onClick={() => aller("attente")}
                ico="◔"
                badge={attente.length}
              >
                Liste d'attente
              </NavItem>
            </div>

            <div className="navgroup">
              <h4>Apparence</h4>
              <NavItem actif={ecran === "bandeaux"} onClick={() => aller("bandeaux")} ico="▣">
                Bandeaux
              </NavItem>
            </div>

            <div className="navgroup">
              <h4>Paramètres</h4>
              <NavItem actif={ecran === "reglages"} onClick={() => aller("reglages")} ico="⚙">
                Réglages
              </NavItem>
            </div>
          </div>

          <div className="sidefoot">
            <div className="helpcard">
              <div className="t">Boutique en ligne</div>
              <p>Vérifiez le rendu côté cliente après vos modifications.</p>
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
            ) : ecran === "collections" ? (
              <EcranCollections ctx={ctx} />
            ) : ecran === "familles" ? (
              <EcranFamilles ctx={ctx} />
            ) : ecran === "campagnes" ? (
              <EcranCampagnes ctx={ctx} />
            ) : ecran === "commandes" ? (
              <EcranCommandes />
            ) : ecran === "attente" ? (
              <EcranAttente ctx={ctx} />
            ) : ecran === "bandeaux" ? (
              <EcranBandeaux ctx={ctx} />
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

function NavItem({
  actif,
  onClick,
  ico,
  badge,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  ico: string;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <button type="button" className={`navitem${actif ? " on" : ""}`} onClick={onClick}>
      <span className="ico">{ico}</span>
      <span className="grow">{children}</span>
      {badge ? <span className="badge">{badge}</span> : null}
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
