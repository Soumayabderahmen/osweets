import { createContext, useContext, useState, type ReactNode } from "react";
import type { ProductRow } from "@/lib/catalog";
import type { Contexte } from "../core";

/*
 * Briques de l'administration, dessinées comme le prototype validé
 * (prototype-admin/index.html) : mêmes icônes, mêmes classes, mêmes textes.
 */

const TRACES: Record<string, string> = {
  maison: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>',
  sac: '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.1 6h17.8"/><path d="M3.4 5.5a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.7a2 2 0 0 0-.4-1.2l-2-2.7A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
  menuSite:
    '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M8 13h8M8 16h5"/>',
  recu: '<path d="M6 2h12v20l-3-2-3 2-3-2-3 2z"/><path d="M9 7h6M9 11h6M9 15h4"/>',
  reglage:
    '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  euro: '<path d="M17 6.5A7 7 0 1 0 17 17.5"/><path d="M4 10h9M4 14h9"/>',
  oeil: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  crayon: '<path d="M17 3a2.8 2.8 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  loupe: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  photo:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
  lien: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  poubelle: '<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>',
  liste: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  famille:
    '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15 14.5c.6-.3 1.3-.5 2-.5 2.5 0 4.5 2 4.5 4.5"/>',
  gateau:
    '<path d="M4 21h16"/><path d="M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7"/><path d="M5 16c1.5 0 1.5 1 3.5 1s2-1 3.5-1 1.5 1 3.5 1 2-1 3.5-1"/><path d="M12 12V8"/>',
  coffret:
    '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18"/><path d="M12 8S10.5 3 8 3a2 2 0 0 0 0 5h4zM12 8s1.5-5 4-5a2 2 0 0 1 0 5h-4z"/>',
  plat: '<path d="M3 15h18"/><path d="M4 15a8 8 0 0 1 16 0"/><path d="M12 7V5M9 19h6"/>',
  coeur:
    '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  etoile: '<path d="m12 3 2.6 5.5 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.5l1.1-6L3.4 9.3l6-.8z"/>',
  livre:
    '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
  tel: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
  horloge: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  lune: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
};

export function Ic({ n }: { n: keyof typeof TRACES | string }) {
  return (
    <svg
      className="i"
      viewBox="0 0 24 24"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: TRACES[n] ?? "" }}
    />
  );
}

/** Interrupteur « Visible / Caché » du prototype. */
export function Inter({
  on,
  onClick,
  oui = "Visible",
  non = "Caché",
}: {
  on: boolean;
  onClick: () => void;
  oui?: string;
  non?: string;
}) {
  return (
    <button type="button" className={`inter${on ? " on" : ""}`} onClick={onClick}>
      <span className="rail" />
      <span>{on ? oui : non}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ messages */

export interface Toast {
  id: number;
  texte: string;
  annuler?: () => void;
}

/** Ce que les écrans de la nouvelle administration reçoivent en plus. */
export interface V2 {
  ctx: Contexte;
  message: (texte: string, annuler?: () => void) => void;
  /** Ouvre la fenêtre de modification d'un produit (ou d'un produit neuf). */
  modifier: (row: ProductRow | null, preset?: Preset) => void;
}

export interface Preset {
  univers?: "patisserie" | "sale";
  collection?: string;
  famille?: string;
}

export const V2Context = createContext<V2 | null>(null);
export const useV2 = () => {
  const v = useContext(V2Context);
  if (!v) throw new Error("V2Context manquant");
  return v;
};

export function Toasts({ liste, retirer }: { liste: Toast[]; retirer: (id: number) => void }) {
  return (
    <div id="toasts" aria-live="polite">
      {liste.map((t) => (
        <div className="toast" key={t.id}>
          <Ic n="check" />
          <span>{t.texte}</span>
          {t.annuler && (
            <button
              type="button"
              onClick={() => {
                t.annuler?.();
                retirer(t.id);
              }}
            >
              Annuler
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ aide */

const CLE_AIDES = "osweets-admin-aides-masquees";
const lireMasquees = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(CLE_AIDES) ?? "[]");
  } catch {
    return [];
  }
};

/** L'encadré « Comment faire ? » en haut d'un écran ; masquable, et ça se retient. */
export function Aide({ cle, lignes }: { cle: string; lignes: ReactNode[] }) {
  const [masquee, setMasquee] = useState(() => lireMasquees().includes(cle));
  if (masquee) return null;
  return (
    <div className="aide-ecran">
      <span className="rond">
        <Ic n="info" />
      </span>
      <div>
        <b>Comment faire ?</b>
        <ol>
          {lignes.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ol>
      </div>
      <button
        type="button"
        className="masquer"
        onClick={() => {
          setMasquee(true);
          try {
            localStorage.setItem(CLE_AIDES, JSON.stringify([...lireMasquees(), cle]));
          } catch {
            /* stockage indisponible : l'aide reviendra au prochain chargement */
          }
        }}
      >
        Masquer
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ prix */

export const euro = (n: number) => `${(Math.round(n * 100) / 100).toFixed(2).replace(".", ",")} €`;

/** Le prix tel que la liste l'affiche : « 15,00 € / kg », « 45,00 € · 40 pièces », « dès 8,00 € ». */
export function prixListe(r: ProductRow): { texte: ReactNode; modifiable: boolean } {
  const prix = Number(r.price) || 0;
  if (r.sell_mode === "kg")
    return {
      texte: (
        <>
          {euro(prix)} <small>/ kg</small>
        </>
      ),
      modifiable: true,
    };
  if (r.sell_mode === "pot" || r.sell_mode === "format" || r.sell_mode === "piece") {
    const prixOptions = (r.sell_options ?? [])
      .filter((o) => !o.hidden && Number(o.price) > 0)
      .map((o) => Number(o.price));
    const min = prixOptions.length ? Math.min(...prixOptions) : prix;
    return {
      texte: (
        <>
          <small>dès</small> {euro(min)}
        </>
      ),
      modifiable: false,
    };
  }
  return {
    texte: (
      <>
        {euro(prix)}
        {r.pieces ? <small> · {r.pieces} pièces</small> : null}
      </>
    ),
    modifiable: true,
  };
}

/** Un nom d'adresse : « Ghrayba droo » → « ghrayba-droo ». */
export const slugifier = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
