import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { listSeasons } from "@/api/seasons";
import { toWindows, type SeasonWindow } from "@/lib/season";

/**
 * Les fenêtres saisonnières, côté boutique.
 *
 * Une seule requête pour tout le site, remplie par le chargeur racine
 * avant le rendu serveur : les pages saisonnières partent donc du bon
 * état dès le premier octet.
 */
export function useSeasons(): SeasonWindow[] {
  const { data } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => listSeasons(),
    staleTime: 60_000,
    retry: false,
  });
  return useMemo(() => toWindows(data ?? []), [data]);
}

/** Les clés de saison enregistrées — « ramadan », « aid »… */
export function useSeasonKeys(): Set<string> {
  const { data } = useQuery({
    queryKey: ["seasons"],
    queryFn: () => listSeasons(),
    staleTime: 60_000,
    retry: false,
  });
  return useMemo(() => new Set((data ?? []).map((r) => r.season_key)), [data]);
}
