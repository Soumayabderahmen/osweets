import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check } from "lucide-react";
import kaakWarka from "@/assets/p-kaak-warka.jpg";
import baklawa from "@/assets/p-baklawa.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import mignardises from "@/assets/p-mignardises.jpg";
import { eventPacks } from "@/data/packs";
import {
  EventHero,
  SectionTitle,
  SuggestedProducts,
  PracticalInfo,
  SocialProof,
  FinalCTA,
} from "@/components/event/EventBlocks";
import { QuoteForm, type QuotePrefill } from "@/components/event/QuoteForm";
import {
  QuantityCalculator,
  type Tier,
} from "@/components/event/QuantityCalculator";
import { eventHead } from "@/lib/seo";

const FIANCAILLES_TIERS: Tier[] = [
  {
    maxGuests: 20,
    label: "Plateau intime + gâteau 1 étage",
    parts: "~20 parts",
    priceRange: "à partir de 220 €",
  },
  {
    maxGuests: 40,
    label: "Plateau familial + gâteau 2 étages",
    parts: "~40 parts",
    priceRange: "à partir de 420 €",
  },
  {
    maxGuests: 60,
    label: "Plateau prestige + gâteau 3 étages",
    parts: "~60 parts",
    priceRange: "à partir de 640 €",
  },
  {
    maxGuests: 100,
    label: "Plateau royal + gâteau 4 étages",
    parts: "~100 parts",
    priceRange: "à partir de 980 €",
  },
  {
    maxGuests: null,
    label: "Formule sur mesure",
    parts: "100 parts et +",
    priceRange: "sur devis",
    quote: true,
  },
];

const FAQ = [
  {
    q: "Combien de temps à l'avance faut-il commander ?",
    a: "Nous demandons 3 semaines minimum, et conseillons 6 semaines pour les plus grandes cérémonies afin de garantir votre décor et votre gâteau.",
  },
  {
    q: "Peut-on ajouter les initiales du couple ?",
    a: "Oui : gâteau cœur avec monogramme, coffrets d'invités personnalisés et cartes de vœux calligraphiées.",
  },
  {
    q: "Proposez-vous un service de mise en scène ?",
    a: "En option : arche florale, présentoirs dorés et scénographie complète pour vos plateaux et gâteau.",
  },
];

export const Route = createFileRoute("/evenements/fiancailles")({
  head: () =>
    eventHead({
      title: "Pâtisserie de Fiançailles Tunisienne | Ö' Sweets",
      description:
        "Plateaux, gâteau signature et coffrets d'invités pour vos fiançailles. Packs clé en main ou sur mesure, devis sous 48h.",
      path: "/evenements/fiancailles",
      serviceType: "Pâtisserie et plateaux de fiançailles sur mesure",
      crumbs: [
        { name: "Accueil", path: "/" },
        { name: "Événements", path: "/evenements" },
        { name: "Fiançailles", path: "/evenements/fiancailles" },
      ],
      faqs: FAQ,
      ogImage: kaakWarka,
    }),
  component: Page,
});

function Page() {
  const packs = eventPacks["fiancailles"] ?? [];
  const [prefill, setPrefill] = useState<QuotePrefill | undefined>();

  return (
    <div className="bg-ivory">
      <EventHero
        eyebrow="Fiançailles"
        title="Célébrez la promesse"
        subtitle="Plateaux tunisiens somptueux, gâteau signature et coffrets d'invités sur mesure."
        bannerKey="evenements-fiancailles"
      />

      <section className="container-os section-y">
        <SectionTitle
          eyebrow="Sélection"
          title="L'essentiel des fiançailles tunisiennes"
        />
        <SuggestedProducts
          slugs={[
            "kaak-warka",
            "baklawa-pistache",
            "samsa-amandes",
            "coffret-prestige",
          ]}
        />
        <div className="mt-10 text-center">
          <Link to="/gateaux/wedding-cakes" className="btn btn-gold">
            Configurer mon Wedding Cake
          </Link>
        </div>
      </section>

      {packs.length > 0 && (
        <section className="bg-sable">
          <div className="container-os section-y">
            <SectionTitle
              eyebrow="Formules tout compris"
              title="Nos Packs Fiançailles"
              desc="Plateaux + gâteau + coffrets — pensés pour chaque taille de célébration."
            />
            <div className="grid md:grid-cols-3 gap-6">
              {packs.map((p) => (
                <div
                  key={p.id}
                  className={`relative bg-white p-8 flex flex-col border-2 ${p.highlight ? "border-gold shadow-[0_10px_40px_rgba(168,145,82,0.18)]" : "border-border"}`}
                >
                  {p.highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-[10px] tracking-[0.22em] uppercase px-3 py-1">
                      Le plus choisi
                    </span>
                  )}
                  <h3 className="font-display text-2xl">{p.name}</h3>
                  <div className="text-xs uppercase tracking-wider text-charbon/60 mt-1">
                    {p.guests} invités
                  </div>
                  <div className="font-price text-4xl text-gold mt-4">
                    {p.price}€
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    {p.includes.map((line) => (
                      <li
                        key={line}
                        className="flex gap-2 text-sm text-charbon/80"
                      >
                        <Check className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      setPrefill({
                        guests: p.guests,
                        suggestedSize: p.name,
                        productType: "Pack fiançailles",
                      });
                      document
                        .getElementById("fiancailles-devis")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`btn mt-8 w-full justify-center ${p.highlight ? "btn-gold" : "btn-outline-gold"}`}
                  >
                    Demander ce pack
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Calculator */}
      <section className="container-os section-y grid lg:grid-cols-2 gap-12 items-start">
        <div>
          <SectionTitle
            eyebrow="Calculateur"
            title="La bonne formule pour vos invités"
          />
          <p className="text-charbon/70 font-light leading-relaxed">
            Précisez votre nombre d'invités : nous vous suggérons la taille du
            gâteau et le volume de mignardises à prévoir.
          </p>
        </div>
        <QuantityCalculator
          tiers={FIANCAILLES_TIERS}
          initialGuests={40}
          onUseForQuote={(guests, size) => {
            setPrefill({
              guests,
              suggestedSize: size,
              productType: "Pack fiançailles",
            });
            document
              .getElementById("fiancailles-devis")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </section>

      {/* Devis form */}
      <section id="fiancailles-devis" className="bg-beige">
        <div className="container-os section-y">
          <SectionTitle
            eyebrow="Devis sur mesure"
            title="Demandez votre devis"
            desc="Réponse sous 48h — nous construisons votre célébration avec vous."
          />
          <div className="max-w-2xl mx-auto">
            <QuoteForm
              source="Fiançailles"
              prefill={prefill}
              productOptions={[
                "Plateaux tunisiens",
                "Gâteau de fiançailles",
                "Coffrets invités",
                "Pack complet",
              ]}
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-os section-y">
        <SectionTitle
          eyebrow="Questions fréquentes"
          title="Vos questions, nos réponses"
        />
        <div className="max-w-3xl mx-auto space-y-3">
          {FAQ.map((f) => (
            <details
              key={f.q}
              className="group bg-white border border-border p-5"
            >
              <summary className="cursor-pointer font-display text-lg flex justify-between items-center">
                <span>{f.q}</span>
                <span className="text-gold group-open:rotate-45 transition">
                  +
                </span>
              </summary>
              <p className="mt-3 text-charbon/70 font-light leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-beige">
        <div className="container-os section-y">
          <SectionTitle eyebrow="Infos pratiques" title="Bon à savoir" />
          <PracticalInfo
            items={[
              {
                label: "Délai",
                value: "3 semaines min. · 6 semaines conseillées",
              },
              { label: "Acompte", value: "30% à la confirmation" },
              {
                label: "Zone",
                value: "Île-de-France · service traiteur possible",
              },
            ]}
          />
        </div>
      </section>

      <section className="container-os section-y">
        <SectionTitle
          eyebrow="Ils nous ont fait confiance"
          title="Réalisations récentes"
        />
        <SocialProof
          images={[kaakWarka, baklawa, cakeVanille, mignardises]}
          testimonials={[
            {
              name: "Nour & Amine",
              event: "Fiançailles 60 invités",
              text: "Plateaux somptueux, gâteau signé de nos initiales : la famille était bluffée.",
            },
            {
              name: "Salma R.",
              event: "Demande en mariage",
              text: "Un écrin doré parfait pour LA demande. Merci Ö' Sweets.",
            },
            {
              name: "Hedi & Yasmine",
              event: "Fiançailles 100 invités",
              text: "Pack Prestige impeccable, ponctualité et goût au rendez-vous.",
            },
          ]}
        />
      </section>

      <FinalCTA
        title="Prêts à célébrer votre promesse ?"
        desc="Réponse sous 48h · devis personnalisé et sans engagement."
        primary={{ label: "Demander un devis", href: "#fiancailles-devis" }}
        secondary={{ label: "Voir tous les événements", to: "/evenements" }}
      />
    </div>
  );
}
