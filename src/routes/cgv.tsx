import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cgv")({
  head: () => ({ meta: [{ title: "CGV — Ö' Sweets" }] }),
  component: () => <Legal title="Conditions Générales de Vente" body="Les présentes conditions régissent les ventes entre Ö' Sweets Pâtisserie et ses clients. Toute commande implique l'acceptation des présentes CGV. Tarifs en euros TTC. Livraison en France métropolitaine sous 24-48h. Droit de rétractation conformément à l'article L.221-28 du Code de la consommation (produits périssables : pas de rétractation possible)." />,
});

export function Legal({ title, body }: { title: string; body: string }) {
  return (
    <div className="container-os section-y max-w-3xl">
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-6 text-charbon/75 leading-relaxed whitespace-pre-line">{body}</p>
    </div>
  );
}
