import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Route parente de l'univers « Cadeaux ».
 *
 * Elle ne rend QUE l'Outlet — même règle que `patisserie.tsx`. Auparavant ce
 * fichier affichait directement la grille des occasions : comme il est le
 * parent de `cadeaux.$slug.tsx`, /cadeaux/ramadan et /cadeaux/aid rendaient
 * cette grille au lieu de la page demandée, et paraissaient vides de produits.
 * La page d'entrée vit maintenant dans `cadeaux.index.tsx`.
 */
export const Route = createFileRoute("/cadeaux")({
  component: () => <Outlet />,
});
