import { createFileRoute } from "@tanstack/react-router";
import { Legal } from "./cgv";

export const Route = createFileRoute("/cookies")({
  head: () => ({ meta: [{ title: "Cookies — Ö' Sweets" }] }),
  component: () => <Legal title="Politique de Cookies" body="Nous utilisons des cookies techniques pour le bon fonctionnement du site (panier, favoris) et des cookies analytiques anonymisés pour mesurer l'audience. Vous pouvez configurer votre navigateur pour les refuser." />,
});
