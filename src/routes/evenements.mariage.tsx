import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import wedding from "@/assets/wedding-buffet.jpg";
import baklawa from "@/assets/p-baklawa.jpg";
import kaakWarka from "@/assets/p-kaak-warka.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
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
  WEDDING_TIERS,
} from "@/components/event/QuantityCalculator";
import { eventHead } from "@/lib/seo";

const FAQ = [
  {
    q: "Quel est le délai de réservation pour un mariage ?",
    a: "Nous conseillons de réserver 3 à 6 mois à l'avance, avec un minimum de 6 semaines pour garantir votre date.",
  },
  {
    q: "Livrez-vous en dehors de l'Île-de-France ?",
    a: "Oui, sur toute la France selon la date et le volume. Pour l'Île-de-France, nous assurons la pose sur place le jour J.",
  },
  {
    q: "Peut-on personnaliser le wedding cake aux couleurs du mariage ?",
    a: "Absolument : couleurs, monogramme, décor floral comestible, initiales des mariés — tout est fait main dans notre atelier.",
  },
  {
    q: "Une dégustation est-elle possible ?",
    a: "Oui, sur rendez-vous en boutique. La dégustation est offerte pour toute commande confirmée.",
  },
];

export const Route = createFileRoute("/evenements/mariage")({
  head: () =>
    eventHead({
      title: "Pâtisserie de Mariage Tunisienne | Ö' Sweets Évry-Courcouronnes",
      description:
        "Wedding cakes façon pâtisserie tunisienne. Livraison France entière, devis personnalisé sous 48h. Demandez le vôtre.",
      path: "/evenements/mariage",
      serviceType: "Pâtisserie de mariage sur mesure",
      crumbs: [
        { name: "Accueil", path: "/" },
        { name: "Événements", path: "/evenements" },
        { name: "Mariage", path: "/evenements/mariage" },
      ],
      faqs: FAQ,
      ogImage: wedding,
    }),
  component: Page,
});

function Page() {
  const [prefill, setPrefill] = useState<QuotePrefill | undefined>();

  return (
    <div className="bg-ivory">
      <EventHero
        eyebrow="Mariage"
        title="Sublimez votre union"
        subtitle="Avec la douceur de la Tunisie — wedding cakes, buffets orientaux et mignardises signature."
        bannerKey="evenements-mariage"
      />

      <section className="container-os section-y">
        <SectionTitle
          eyebrow="Sélection"
          title="Nos incontournables mariage"
          desc="Une base curée à personnaliser selon votre thème et votre nombre d'invités."
        />
        <SuggestedProducts
          slugs={[
            "baklawa-pistache",
            "kaak-warka",
            "mignardises-assortiment",
            "coffret-prestige",
          ]}
        />
        <div className="mt-10 text-center">
          <Link to="/gateaux/wedding-cakes" className="btn btn-gold">
            Configurer mon Wedding Cake
          </Link>
        </div>
      </section>

      {/* Calculator */}
      <section className="bg-sable">
        <div className="container-os section-y grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <SectionTitle
              eyebrow="Calculateur"
              title="Combien de gâteau pour vos invités ?"
            />
            <p className="text-charbon/70 leading-relaxed font-light">
              Indiquez votre nombre d'invités : nous suggérons la taille de
              wedding cake, le nombre de parts et une fourchette de prix.
            </p>
            <ul className="mt-6 space-y-1 text-sm text-charbon/70">
              {WEDDING_TIERS.map((t) => (
                <li
                  key={t.label}
                  className="flex justify-between border-b border-border/60 py-1.5"
                >
                  <span>
                    {t.maxGuests ? `Jusqu'à ${t.maxGuests}` : "100+"} invités
                  </span>
                  <span className="text-charbon/50">{t.parts}</span>
                </li>
              ))}
            </ul>
          </div>
          <QuantityCalculator
            initialGuests={80}
            onUseForQuote={(guests, size) => {
              setPrefill({
                guests,
                suggestedSize: size,
                productType: "Wedding Cake",
              });
              const el = document.getElementById("mariage-devis");
              el?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
          />
        </div>
      </section>

      {/* Book */}
      <section className="container-os section-y">
        <SectionTitle
          eyebrow="Book de réalisations"
          title="Ils se sont dit oui avec Ö' Sweets"
        />
        <SocialProof
          images={[
            wedding,
            cakeVanille,
            baklawa,
            kaakWarka,
            wedding,
            cakeVanille,
            baklawa,
            kaakWarka,
          ]}
          testimonials={[
            {
              name: "Yasmine & Karim",
              event: "Mariage 180 invités",
              text: "Un wedding cake sublime, un buffet dévoré. Nos invités en parlent encore.",
            },
            {
              name: "Sarra & Anis",
              event: "Mariage 220 invités",
              text: "L'équipe a compris nos codes dès la dégustation. Résultat au-delà de nos espérances.",
            },
            {
              name: "Lina & Mehdi",
              event: "Mariage intime 60 invités",
              text: "Élégance, saveurs, service — un mariage inoubliable, merci Ö' Sweets.",
            },
          ]}
        />
      </section>

      {/* Devis form */}
      <section id="mariage-devis" className="bg-beige">
        <div className="container-os section-y">
          <SectionTitle
            eyebrow="Devis sur mesure"
            title="Commencez par un devis"
            desc="Nos mariages se construisent avec vous, sur mesure. Réponse sous 48h."
          />
          <div className="max-w-2xl mx-auto">
            <QuoteForm
              source="Mariage"
              prefill={prefill}
              productOptions={[
                "Wedding Cake",
                "Coffrets invités",
                "Plusieurs produits",
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

      <section className="container-os pb-20">
        <SectionTitle eyebrow="Infos pratiques" title="Bon à savoir" />
        <PracticalInfo
          items={[
            {
              label: "Réservation à l'avance",
              value: "3 à 6 mois idéal · minimum 6 semaines",
            },
            {
              label: "Acompte",
              value: "30% à la réservation, solde 7 jours avant",
            },
            {
              label: "Service & livraison",
              value: "France entière · pose sur place en IDF",
            },
          ]}
        />
      </section>

      <FinalCTA
        title="Prêt(e)s à composer votre mariage ?"
        desc="Réponse sous 48h · dégustation offerte pour toute commande confirmée."
        primary={{ label: "Demander un devis", href: "#mariage-devis" }}
        secondary={{ label: "Réserver une dégustation", to: "/contact" }}
      />
    </div>
  );
}
