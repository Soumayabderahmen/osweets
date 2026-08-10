import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { PATISSERIE_CAT_REDIRECTS } from "@/lib/patisserie";

/**
 * Route parente de l'univers « Pâtisserie Tunisienne ».
 * Elle ne rend QUE l'Outlet : la page catalogue vit dans `patisserie.index.tsx`,
 * chaque collection dans son propre fichier. Sans cet Outlet, les routes
 * /patisserie/* ne pouvaient pas s'afficher.
 */
const searchSchema = z.object({
  cat: fallback(z.string(), "").optional(),
});

export const Route = createFileRoute("/patisserie")({
  validateSearch: zodValidator(searchSchema),
  beforeLoad: ({ search, location }) => {
    if (!search.cat) return;
    const target = PATISSERIE_CAT_REDIRECTS[search.cat] ?? "/patisserie";
    if (target !== location.pathname || location.search) {
      throw redirect({ to: target, statusCode: 301 });
    }
  },
  component: () => <Outlet />,
});
