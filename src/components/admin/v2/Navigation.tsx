import { useEffect, useMemo, useRef, useState } from "react";
import type { ProductRow } from "@/lib/catalog";
import { Ic } from "./ui";
import { initiales } from "./Profil";

/*
 * Le menu de gauche (repliable), la barre du haut et « Aller à… » (Ctrl K),
 * dessinés comme le prototype validé (prototype-admin/index.html).
 */

export type Entree = [string, string, string, [string, string][]?];
export interface Section {
  titre: string;
  items: Entree[];
}

const CLE_REPLIE = "os-menu-replie";
const lireReplie = () => {
  try {
    return localStorage.getItem(CLE_REPLIE) === "1";
  } catch {
    return false;
  }
};

/** Vrai sous 900 px : le menu devient un tiroir. */
export function useTelephone() {
  const [tel, setTel] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const suivre = () => setTel(mq.matches);
    mq.addEventListener("change", suivre);
    return () => mq.removeEventListener("change", suivre);
  }, []);
  return tel;
}

/** L'état du menu : replié (retenu d'une visite à l'autre) et tiroir ouvert sur téléphone. */
export function useMenu() {
  const telephone = useTelephone();
  const [replie, setReplie] = useState(lireReplie);
  const [tiroir, setTiroir] = useState(false);
  const basculer = () => {
    if (telephone) return setTiroir(false);
    setReplie((r) => {
      try {
        localStorage.setItem(CLE_REPLIE, r ? "0" : "1");
      } catch {
        /* stockage indisponible : le choix vaut pour cette visite */
      }
      return !r;
    });
  };
  useEffect(() => {
    if (!telephone) setTiroir(false);
  }, [telephone]);
  return {
    telephone,
    replie: replie && !telephone,
    tiroir: tiroir && telephone,
    setTiroir,
    basculer,
  };
}

export function Menu({
  sections,
  ecran,
  sousActifs,
  aller,
  comptes,
  pastilles,
  replie,
  telephone,
  basculer,
  palette,
  email,
  nom,
  rubriques = [],
  rubrique = "",
  allerRubrique,
  onSignOut,
}: {
  sections: Section[];
  ecran: string;
  /** Les écrans qui allument l'entrée à sous-pages (Pâtisserie Tunisienne). */
  sousActifs: string[];
  aller: (e: string) => void;
  comptes: Record<string, number>;
  pastilles: Record<string, number>;
  replie: boolean;
  telephone: boolean;
  basculer: () => void;
  palette: () => void;
  email: string;
  nom?: string | null;
  /** Les rubriques du menu du site, montrées sous « Produits ». */
  rubriques?: { cle: string; nom: string; n: number; fete: boolean }[];
  rubrique?: string;
  allerRubrique?: (cle: string) => void;
  onSignOut: () => void;
}) {
  const [fermees, setFermees] = useState<Set<number>>(new Set());
  const [patOuvert, setPatOuvert] = useState(true);
  const dansSous = sousActifs.includes(ecran);
  useEffect(() => {
    if (dansSous) setPatOuvert(true);
  }, [dansSous]);

  const sousLiens = (sous: [string, string][]) =>
    sous.map(([sk, sn]) => (
      <div key={sk} style={{ display: "contents" }}>
        <button
          type="button"
          className={`sous-lien${ecran === sk && !(sk === "produits" && rubrique) ? " on" : ""}${sk === "produits" && ecran === "produits" && rubrique ? " parent" : ""}`}
          onClick={() => aller(sk)}
        >
          {sn}
          <small>{comptes[sk] ?? ""}</small>
        </button>
        {sk === "produits" && rubriques.length > 0 && allerRubrique && (
          <div className="sous-sous">
            {rubriques.map((r) => (
              <button
                type="button"
                key={r.cle}
                className={`sous-lien${r.fete ? " fete" : ""}${ecran === "produits" && rubrique === r.cle ? " on" : ""}`}
                onClick={() => allerRubrique(r.cle)}
              >
                <span className="nm">
                  <span className="pt" />
                  {r.nom}
                </span>
                <small>{r.n}</small>
              </button>
            ))}
          </div>
        )}
      </div>
    ));

  return (
    <div className="menu-panneau">
      <div className="menu-tete">
        <span className="logo">Ö</span>
        <div className="nom">
          <b>Ö' Sweets</b>
          <small>Mon espace</small>
        </div>
        <button
          type="button"
          className="bouton-rond bouton-replier"
          onClick={basculer}
          title={
            telephone ? "Fermer le menu" : replie ? "Déplier le menu  [" : "Replier le menu  ["
          }
          aria-label={telephone ? "Fermer le menu" : replie ? "Déplier le menu" : "Replier le menu"}
        >
          <Ic n="chevG" />
        </button>
      </div>
      <button type="button" className="chercher-menu" onClick={palette} title="Aller à… (Ctrl K)">
        <Ic n="loupe" />
        <span>Aller à…</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div className="menu-defile">
        {sections.map((sec, i) => (
          <div key={sec.titre || "haut"} style={{ display: "contents" }}>
            {sec.titre && (
              <button
                type="button"
                className={`sec${fermees.has(i) ? " ferme" : ""}`}
                onClick={() =>
                  setFermees((f) => {
                    const n = new Set(f);
                    if (n.has(i)) n.delete(i);
                    else n.add(i);
                    return n;
                  })
                }
              >
                <span>{sec.titre}</span>
                <span className="fl">
                  <Ic n="chevB" />
                </span>
              </button>
            )}
            <div className="groupe-liens">
              {sec.items.map(([k, icone, nom, sous]) => {
                const actif = sous ? dansSous : ecran === k;
                const pastille = pastilles[k] ?? 0;
                return (
                  <div
                    key={k}
                    onMouseEnter={(e) => {
                      if (!replie) return;
                      const r = e.currentTarget.getBoundingClientRect();
                      const f = e.currentTarget.querySelector<HTMLElement>(".flottant");
                      if (!f) return;
                      f.style.left = `${r.right}px`;
                      f.style.top = `${Math.max(8, Math.min(r.top, window.innerHeight - f.offsetHeight - 8))}px`;
                    }}
                    className={`entree${sous && patOuvert ? " ouverte" : ""}${pastille ? " alerte" : ""}`}
                  >
                    <button
                      type="button"
                      className={`lien${actif ? " on" : ""}`}
                      onClick={() => {
                        if (!sous) return aller(k);
                        if (replie) return aller(k);
                        setPatOuvert((o) => !o);
                      }}
                    >
                      <span className="ibox">
                        <Ic n={icone} />
                      </span>
                      <span className="txt">{nom}</span>
                      {pastille > 0 && <span className="pastille">{pastille}</span>}
                      {sous && (
                        <span className="fl">
                          <Ic n="chevB" />
                        </span>
                      )}
                    </button>
                    {sous && <div className="sous-liens">{sousLiens(sous)}</div>}
                    <div className="flottant">
                      <div>
                        <b>
                          {nom}
                          {pastille > 0 && <span className="pastille">{pastille}</span>}
                        </b>
                        {sous && sousLiens(sous)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="menu-pied">
        <a className="voir-site" href="/" target="_blank" rel="noreferrer" title="Voir ma boutique">
          <Ic n="lien" />
          <span>Voir ma boutique</span>
        </a>
        <div className="compte">
          <button
            type="button"
            className="avatar"
            title="Mon profil"
            onClick={() => aller("profil")}
          >
            {initiales(nom, email)}
          </button>
          <button
            type="button"
            className={`qui${ecran === "profil" ? " on" : ""}`}
            title="Mon profil"
            onClick={() => aller("profil")}
          >
            <b>{nom || "Ö' Sweets"}</b>
            <small>{email}</small>
          </button>
          <button type="button" className="bouton-rond" onClick={onSignOut} title="Se déconnecter">
            <Ic n="sortie" />
          </button>
        </div>
      </div>
    </div>
  );
}

export interface Alerte {
  cle: string;
  texte: string;
  detail: string;
  couleur?: "ambre";
  aller: () => void;
}

export function BarreHaut({
  fil,
  titre,
  alertes,
  email,
  nom,
  ouvrirTiroir,
  palette,
  aller,
  onSignOut,
}: {
  fil: [string, string][];
  titre: string;
  alertes: Alerte[];
  email: string;
  nom?: string | null;
  ouvrirTiroir: () => void;
  palette: () => void;
  aller: (e: string) => void;
  onSignOut: () => void;
}) {
  const [ouvert, setOuvert] = useState<"cloche" | "compte" | null>(null);
  const zone = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const fermer = (e: MouseEvent) => {
      if (!zone.current?.contains(e.target as Node)) setOuvert(null);
    };
    const echap = (e: KeyboardEvent) => e.key === "Escape" && setOuvert(null);
    document.addEventListener("mousedown", fermer);
    window.addEventListener("keydown", echap);
    return () => {
      document.removeEventListener("mousedown", fermer);
      window.removeEventListener("keydown", echap);
    };
  }, [ouvert]);
  const choisir = (fn: () => void) => {
    setOuvert(null);
    fn();
  };
  return (
    <header className="topbar">
      <button
        type="button"
        className="bouton-rond burger"
        onClick={ouvrirTiroir}
        aria-label="Ouvrir le menu"
      >
        <Ic n="burger" />
      </button>
      <div className="fil">
        <nav>
          <button type="button" onClick={() => aller("accueil")} title="Accueil">
            <Ic n="maison" />
          </button>
          {fil.map(([k, n], i) => (
            <span key={`${i}-${k}`} style={{ display: "contents" }}>
              <span className="sep">/</span>
              {i < fil.length - 1 ? (
                <button type="button" onClick={() => aller(k)}>
                  {n}
                </button>
              ) : (
                <span>{n}</span>
              )}
            </span>
          ))}
        </nav>
        <h1>{titre}</h1>
      </div>
      <div className="outils" ref={zone}>
        <button type="button" className="chercher" onClick={palette} title="Aller à… (Ctrl K)">
          <Ic n="loupe" />
          <span>Chercher une page, un produit…</span>
          <kbd>Ctrl K</kbd>
        </button>
        <a
          className="bouton-rond outil site"
          href="/"
          target="_blank"
          rel="noreferrer"
          title="Voir ma boutique"
        >
          <Ic n="lien" />
        </a>
        <div className={`outil${ouvert === "cloche" ? " ouvert" : ""}`}>
          <button
            type="button"
            className="bouton-rond"
            onClick={() => setOuvert((o) => (o === "cloche" ? null : "cloche"))}
            title="À regarder"
          >
            <Ic n="cloche" />
          </button>
          {alertes.length > 0 && <span className="pastille">{alertes.length}</span>}
          <div className="deroulant">
            <h4>À regarder</h4>
            {alertes.length ? (
              alertes.map((a) => (
                <button type="button" key={a.cle} className="item" onClick={() => choisir(a.aller)}>
                  <span className={`point${a.couleur ? ` ${a.couleur}` : ""}`} />
                  <span>
                    {a.texte}
                    <small>{a.detail}</small>
                  </span>
                </button>
              ))
            ) : (
              <p style={{ padding: "8px 10px", margin: 0, color: "var(--gris)" }}>
                Rien à signaler.
              </p>
            )}
          </div>
        </div>
        <div className={`outil${ouvert === "compte" ? " ouvert" : ""}`}>
          <button
            type="button"
            className="avatar"
            onClick={() => setOuvert((o) => (o === "compte" ? null : "compte"))}
            title="Mon compte"
          >
            {initiales(nom, email)}
          </button>
          <div className="deroulant">
            <div className="compte" style={{ padding: "8px 10px 10px" }}>
              <span className="avatar">{initiales(nom, email)}</span>
              <div className="qui">
                <b>{nom || "Ö' Sweets"}</b>
                <small>{email}</small>
              </div>
            </div>
            <hr />
            <button type="button" className="item" onClick={() => choisir(() => aller("profil"))}>
              <Ic n="personne" /> Mon profil
            </button>
            <button type="button" className="item" onClick={() => choisir(() => aller("reglages"))}>
              <Ic n="reglage" /> Réglages
            </button>
            <a
              className="item"
              href="/"
              target="_blank"
              rel="noreferrer"
              onClick={() => setOuvert(null)}
            >
              <Ic n="lien" /> Voir ma boutique
            </a>
            <hr />
            <button type="button" className="item" onClick={() => choisir(onSignOut)}>
              <Ic n="sortie" /> Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

interface Resultat {
  cle: string;
  nom: string;
  sous: string;
  icone: string;
  choisir: () => void;
}

/** « Aller à… » : toutes les pages et tous les produits, au clavier. */
export function Palette({
  sections,
  produits,
  aller,
  modifier,
  onClose,
}: {
  sections: Section[];
  produits: ProductRow[];
  aller: (e: string) => void;
  modifier: (row: ProductRow) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const liste = useRef<HTMLDivElement>(null);

  const pages = useMemo<Resultat[]>(
    () =>
      sections.flatMap((s) =>
        s.items.flatMap(([k, icone, nom, sous]) =>
          sous
            ? sous.map(([sk, sn]) => ({
                cle: `p-${sk}`,
                nom: sn,
                sous: nom,
                icone,
                choisir: () => aller(sk),
              }))
            : [{ cle: `p-${k}`, nom, sous: "Page", icone, choisir: () => aller(k) }],
        ),
      ),
    [sections, aller],
  );
  const res = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return pages;
    const prods: Resultat[] = produits
      .filter((p) => !p.archived)
      .map((p) => ({
        cle: `r-${p.id}`,
        nom: p.name,
        sous: p.category === "sale" ? "Plateau salé" : "Produit",
        icone: "crayon",
        choisir: () => modifier(p),
      }));
    return [...pages, ...prods]
      .filter((r) => r.nom.toLowerCase().includes(t) || r.sous.toLowerCase().includes(t))
      .slice(0, 12);
  }, [q, pages, produits, modifier]);
  const actif = Math.max(0, Math.min(sel, res.length - 1));

  useEffect(() => {
    liste.current?.querySelector(".res.actif")?.scrollIntoView({ block: "nearest" });
  }, [actif]);

  const valider = (r?: Resultat) => {
    onClose();
    r?.choisir();
  };

  return (
    <div
      className="palette-voile show"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="palette" role="dialog" aria-label="Aller à">
        <label>
          <Ic n="loupe" />
          <input
            autoFocus
            autoComplete="off"
            placeholder="Aller à une page ou un produit…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSel((actif + 1) % Math.max(res.length, 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSel((actif - 1 + res.length) % Math.max(res.length, 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                valider(res[actif]);
              } else if (e.key === "Escape") onClose();
            }}
          />
          <kbd>Échap</kbd>
        </label>
        <div className="resultats" ref={liste}>
          {res.length ? (
            res.map((r, i) => (
              <button
                type="button"
                key={r.cle}
                className={`res${i === actif ? " actif" : ""}`}
                onMouseEnter={() => setSel(i)}
                onClick={() => valider(r)}
              >
                <span className="ibox">
                  <Ic n={r.icone} />
                </span>
                {r.nom}
                <small>{r.sous}</small>
              </button>
            ))
          ) : (
            <p className="vide">Rien trouvé pour « {q} ».</p>
          )}
        </div>
      </div>
    </div>
  );
}
