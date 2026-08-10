import { createFileRoute } from "@tanstack/react-router";
import { Legal } from "./cgv";

export const Route = createFileRoute("/remboursement")({
  head: () => ({ meta: [{ title: "Remboursement — Ö' Sweets" }] }),
  component: () => <Legal title="Politique de Remboursement" body="Nos pâtisseries étant des denrées périssables, le droit de rétractation ne s'applique pas (art. L.221-28). En cas de problème (produit endommagé, erreur de commande), contactez-nous sous 48h à contact@osweets.fr avec photos — remboursement ou geste commercial garanti." />,
});
