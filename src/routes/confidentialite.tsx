import { createFileRoute } from "@tanstack/react-router";
import { Legal } from "./cgv";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({ meta: [{ title: "Confidentialité — Ö' Sweets" }] }),
  component: () => <Legal title="Politique de Confidentialité" body="Nous collectons uniquement les données nécessaires au traitement de vos commandes (nom, adresse, email, téléphone). Vos données ne sont jamais cédées à des tiers. Vous disposez d'un droit d'accès, de rectification et de suppression conformément au RGPD. Contact : contact@osweets.fr." />,
});
