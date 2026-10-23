import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { PATISSERIE_CAT_REDIRECTS } from "@/lib/patisserie";
import { listCollections } from "@/api/collections";

/**
 * Route parente de l'univers « Pâtisserie Tunisienne ».
 * Elle ne rend QUE l'Outlet : la page d'entrée vit dans `patisserie.index.tsx`,
 * chaque collection dans son propre fichier. Sans cet Outlet, les routes
 * /patisserie/* ne pouvaient pas s'afficher.
 */
const searchSchema = z
  .object({
    cat: fallback(z.string(), "").optional(),
    /** `tout` bascule /patisserie de l'index des collections vers le catalogue complet. */
    vue: z.enum(["tout"]).optional().catch(undefined),
  })
  .passthrough();

export const Route = createFileRoute("/patisserie")({
  validateSearch: zodValidator(searchSchema),
  beforeLoad: async ({ search, location }) => {
    if (!search.cat) return;
    const collections = await listCollections();
    const current = collections.find(
      (c) => c.published && !c.hidden && (c.slug === search.cat || c.product_key === search.cat),
    );
    const alias = PATISSERIE_CAT_REDIRECTS[search.cat];
    const target = current
      ? `/patisserie/${current.slug}`
      : alias &&
          (alias === "/patisserie" ||
            collections.some((c) => c.published && !c.hidden && `/patisserie/${c.slug}` === alias))
        ? alias
        : "/patisserie";
    if (target !== location.pathname || location.search) {
      throw redirect({ to: target, statusCode: 301 });
    }
  },
  component: () => <Outlet />,
});
