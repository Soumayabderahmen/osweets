import { createFileRoute } from "@tanstack/react-router";
import { QuoteForm, type QuotePrefill } from "@/components/event/QuoteForm";
import { SITE } from "@/lib/seo";

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v : undefined);

export const Route = createFileRoute("/devis")({
  head: () => ({
    meta: [
      { title: "Demande de devis — Ö' Sweets" },
      {
        name: "description",
        content:
          "Formulaire unique de devis Ö' Sweets Pâtisserie — mariage, fiançailles, anniversaire, baby shower, gender reveal, entreprise, gâteau sur mesure, coffrets et cadeaux.",
      },
      { property: "og:title", content: "Demande de devis — Ö' Sweets" },
      { property: "og:description", content: "Décrivez votre projet, nous répondons sous 48h." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/devis` },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/devis` }],
  }),
  component: Page,
  validateSearch: (s: Record<string, unknown>): DevisSearch => ({
    type: str(s.type),
    date: str(s.date),
    guests: typeof s.guests === "string" || typeof s.guests === "number" ? Number(s.guests) || undefined : undefined,
    flavors: str(s.flavors),
    allergies: str(s.allergies),
    details: str(s.details),
    produit: str(s.produit),
  }),
});

type DevisSearch = {
  type?: string;
  date?: string;
  guests?: number;
  flavors?: string;
  allergies?: string;
  details?: string;
  produit?: string;
};


function Page() {
  const { type, date, guests, flavors, allergies, details, produit } = Route.useSearch();

  const prefill: QuotePrefill = {
    guests,
    eventDate: date,
    flavors,
    allergies,
    message: details,
    productType: produit,
  };

  return (
    <div className="container-os section-y">
      <div className="max-w-3xl mx-auto">
        <QuoteForm defaultProjectType={type} prefill={prefill} />
      </div>
    </div>
  );
}
