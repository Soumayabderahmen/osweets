import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { ProductRow } from "@/lib/catalog";
import type { FamilyRow } from "@/api/families";

/**
 * Choix du parfum.
 *
 * Un parfum écrit à la main se retrouve écrit de trois façons différentes
 * (« Pistache », « pistache », « Pistache d'Iran ») et le bloc « Autres
 * parfums » de la boutique se casse en silence. Ici, on choisit d'abord dans
 * ce qui existe déjà ; on n'écrit un nom que lorsqu'il est vraiment nouveau.
 *
 * Les parfums de la famille sélectionnée arrivent en tête : ce sont ceux
 * qu'on cherche neuf fois sur dix.
 */
export function ChoixParfum({
  valeur,
  famille,
  produits,
  familles,
  onChange,
}: {
  valeur: string;
  famille: string;
  produits: ProductRow[];
  familles: FamilyRow[];
  onChange: (v: string) => void;
}) {
  /** Parfums créés depuis cette fiche, tant qu'elle n'est pas enregistrée. */
  const [ajoutes, setAjoutes] = useState<string[]>([]);
  const [saisie, setSaisie] = useState<string | null>(null);

  const { dedans, ailleurs } = useMemo(() => {
    const d: string[] = [];
    const a: string[] = [];
    for (const p of produits) {
      const l = (p.flavor_label ?? "").trim();
      if (!l) continue;
      const cible = famille && p.family === famille ? d : a;
      if (!cible.some((x) => x.toLowerCase() === l.toLowerCase())) cible.push(l);
    }
    for (const l of ajoutes) {
      if (![...d, ...a].some((x) => x.toLowerCase() === l.toLowerCase())) d.push(l);
    }
    const tri = (x: string[]) => x.sort((m, n) => m.localeCompare(n, "fr"));
    return { dedans: tri(d), ailleurs: tri(a) };
  }, [produits, famille, ajoutes]);

  const famLabel = famille ? (familles.find((f) => f.key === famille)?.label ?? famille) : "";

  const valider = () => {
    const l = (saisie ?? "").trim();
    if (!l) return;
    if (!ajoutes.some((x) => x.toLowerCase() === l.toLowerCase())) setAjoutes((p) => [...p, l]);
    onChange(l);
    setSaisie(null);
    toast.success(`Parfum « ${l} » ajouté.`);
  };

  return (
    <>
      <label className="f">
        <span>Parfum</span>
        <select
          value={valeur}
          onChange={(e) => {
            if (e.target.value === "__new") {
              setSaisie("");
              return;
            }
            setSaisie(null);
            onChange(e.target.value);
          }}
        >
          <option value="">— aucun —</option>
          {dedans.length > 0 && (
            <optgroup label={famLabel ? `Parfums de ${famLabel}` : "Déjà utilisés"}>
              {dedans.map((l) => (
                <option key={`d-${l}`} value={l}>
                  {l}
                </option>
              ))}
            </optgroup>
          )}
          {ailleurs.length > 0 && (
            <optgroup label="Autres parfums de la boutique">
              {ailleurs.map((l) => (
                <option key={`a-${l}`} value={l}>
                  {l}
                </option>
              ))}
            </optgroup>
          )}
          <option value="__new">+ Nouveau parfum…</option>
        </select>
      </label>

      {saisie !== null && (
        <div style={{ gridColumn: "1 / -1" }}>
          <div className="newline">
            <input
              value={saisie}
              autoFocus
              autoComplete="off"
              placeholder="Nom du nouveau parfum — ex. Praliné noisette"
              onChange={(e) => setSaisie(e.target.value)}
              /*
               * Un parfum saisi mais non confirmé était perdu en silence :
               * on tapait le nom, on cliquait « Enregistrer », et la fiche
               * repartait avec l'ancien parfum sans le moindre message. En
               * validant aussi à la sortie du champ, le nom saisi est pris
               * en compte quoi qu'il arrive — le bouton « Ajouter » reste
               * là pour ceux qui préfèrent confirmer explicitement.
               */
              onBlur={valider}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  valider();
                }
                if (e.key === "Escape") setSaisie(null);
              }}
            />
            <button type="button" onClick={valider}>
              Ajouter
            </button>
          </div>
          <div className="hint" style={{ marginTop: 6 }}>
            Il rejoint la liste et pourra être réutilisé sur d'autres fiches.
          </div>
        </div>
      )}
    </>
  );
}
