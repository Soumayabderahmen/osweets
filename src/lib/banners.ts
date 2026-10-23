import { useQuery } from "@tanstack/react-query";
import { listPageBanners, type PageBannerRow } from "@/api/banners";
import { resolveProductImage } from "@/lib/product-assets";

/** Bandeau d'une page, tel que l'affiche la boutique. */
export interface PageBanner {
  key: string;
  label: string;
  image?: string;
  title: string;
  subtitle: string;
}

export function rowToBanner(r: PageBannerRow): PageBanner {
  return {
    key: r.key,
    label: r.label,
    // `image_url` (la base) l'emporte ; `image_key` ne sert que le temps de
    // la migration, pour les pages dont le visuel n'a pas encore été versé.
    image: resolveProductImage(r.image_url, r.image_key) || undefined,
    title: r.title,
    subtitle: r.subtitle,
  };
}

/**
 * Tous les bandeaux de page.
 * Une seule requête pour tout le site : le chargeur racine la remplit
 * avant le rendu serveur, donc la bonne image part dès la première page.
 */
export function usePageBanners(): PageBanner[] {
  const { data } = useQuery({
    queryKey: ["page-banners"],
    queryFn: () => listPageBanners(),
    staleTime: 60_000,
    retry: false,
  });
  return (data ?? []).map(rowToBanner);
}

/**
 * Le bandeau d'une page précise.
 *
 * `secours` est le visuel livré avec le site. Il disparaîtra une fois la
 * migration des images vérifiée : à ce moment-là, la base sera seule
 * source, et une page sans bandeau enregistré affichera son dégradé.
 */
export function usePageBanner(key: string, secours?: string): PageBanner {
  const all = usePageBanners();
  const found = all.find((b) => b.key === key);
  return {
    key,
    label: found?.label ?? "",
    image: found?.image ?? secours,
    title: found?.title ?? "",
    subtitle: found?.subtitle ?? "",
  };
}

/** Raccourci quand seule l'image compte. */
export function usePageBannerImage(key: string, secours?: string): string | undefined {
  return usePageBanner(key, secours).image;
}
