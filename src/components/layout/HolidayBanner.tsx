import { useQuery } from "@tanstack/react-query";
import { DEFAULT_SETTINGS, getSettings, type ShopSettings } from "@/api/settings";

/**
 * Réglages de la boutique, côté client.
 * Ils changent deux ou trois fois par an : une minute de cache suffit
 * largement, et la boutique n'attend jamais après la base pour s'afficher.
 */
export function useShopSettings(): ShopSettings {
  const { data } = useQuery({
    queryKey: ["shop-settings"],
    queryFn: () => getSettings(),
    staleTime: 60_000,
    retry: false,
  });
  return data ?? DEFAULT_SETTINGS;
}

/** L'atelier est fermé : plus aucune commande n'est possible. */
export function useHolidayMode(): { closed: boolean; message: string } {
  const s = useShopSettings();
  if (!s.holidayMode) return { closed: false, message: "" };
  const dates =
    s.holidayFrom && s.holidayUntil
      ? ` du ${s.holidayFrom} au ${s.holidayUntil}`
      : s.holidayUntil
        ? ` jusqu'au ${s.holidayUntil}`
        : s.holidayFrom
          ? ` à partir du ${s.holidayFrom}`
          : "";
  const retour = s.holidayUntil ? `le ${s.holidayUntil}` : "très vite";
  return {
    closed: true,
    message: `Atelier fermé${dates}. Vous pouvez parcourir la boutique ; les commandes rouvrent ${retour}.`,
  };
}

/**
 * Bandeau de fermeture.
 *
 * On garde la boutique consultable plutôt que de tout marquer « épuisé » :
 * la cliente voit les produits, comprend pourquoi elle ne peut pas commander,
 * et sait quand revenir. Une boutique vide, elle, ne dit rien et ne revient pas.
 */
export function HolidayBanner() {
  const { closed, message } = useHolidayMode();
  if (!closed) return null;
  return (
    <div
      role="status"
      className="bg-charbon px-4 py-2.5 text-center text-[12px] leading-relaxed text-ivory sm:text-[13px]"
    >
      <span aria-hidden="true" className="mr-2">
        🌴
      </span>
      {message}
    </div>
  );
}
