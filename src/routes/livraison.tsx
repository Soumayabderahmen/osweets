import { createFileRoute } from "@tanstack/react-router";
import { Legal } from "./cgv";

export const Route = createFileRoute("/livraison")({
  head: () => ({ meta: [{ title: "Livraison — Ö' Sweets" }] }),
  component: () => <Legal title="Politique de Livraison" body="Toute commande passée avant 18h est expédiée le lendemain. Livraison en 24-48h en France métropolitaine via Chronopost. Frais offerts à partir de 80€ d'achat. Retrait gratuit en boutique à Évry-Courcouronnes 2h après la confirmation. Livraison Paris & IDF par coursier disponible." />,
});
