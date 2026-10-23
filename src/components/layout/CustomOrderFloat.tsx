import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

/**
 * Pages où le bouton n'a rien à faire : l'achat est en cours (fiche, panier,
 * commande) ou la cliente est déjà sur une demande sur mesure. Ailleurs, il
 * reste une pastille ronde, comme WhatsApp : en pilule large, il recouvrait
 * boutons, cartes et champs de formulaire.
 */
const MASQUE_SUR = [
  "/produits/",
  "/panier",
  "/checkout",
  "/creation-sur-mesure",
  "/sur-mesure",
  "/devis",
];

export function CustomOrderFloat() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (MASQUE_SUR.some((p) => path.startsWith(p))) return null;

  return (
    <Link
      to="/creation-sur-mesure"
      search={{ type: undefined }}
      aria-label="Demander une création sur mesure"
      className="group fixed bottom-6 left-6 z-50 flex items-center gap-2"
    >
      <span className="grid h-14 w-14 place-items-center rounded-full bg-gold text-white shadow-lg transition-colors group-hover:bg-charbon">
        <Sparkles className="h-6 w-6" />
      </span>
      <span className="hidden whitespace-nowrap rounded bg-white px-3 py-2 text-xs text-charbon shadow-lg group-hover:inline-block">
        Création sur mesure
      </span>
    </Link>
  );
}
