import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { listFamilies, type FamilyRow } from "@/api/families";

/**
 * Les familles de pâtisseries, côté boutique.
 *
 * « Autres parfums — Samsa » lisait un tableau de trois entrées écrit dans
 * `products.ts`. Une famille créée au back-office s'affichait alors sous
 * un titre vide, et une quatrième famille était même refusée par le type.
 * La table `families` est désormais la seule liste.
 */
function familiesQuery() {
  return {
    queryKey: ["families"] as const,
    queryFn: () => listFamilies(),
    staleTime: 60_000,
    retry: false,
  };
}

export function useFamilies(): FamilyRow[] {
  const { data } = useQuery(familiesQuery());
  return data ?? [];
}

/**
 * Le nom d'une famille, tel que le back-office l'a écrit.
 *
 * Sans ligne correspondante, on rend la clé lisible plutôt que rien :
 * une famille mal nommée reste préférable à un titre amputé.
 */
export function useFamilyLabel(): (key: string | undefined) => string {
  const familles = useFamilies();
  // Stable tant que la liste ne change pas : les `useMemo` qui s'en servent
  // ne se recalculent pas à chaque rendu.
  return useCallback(
    (key: string | undefined) => {
      if (!key) return "";
      const row = familles.find((f) => f.key === key);
      if (row?.label) return row.label;
      return key.charAt(0).toUpperCase() + key.slice(1);
    },
    [familles],
  );
}
