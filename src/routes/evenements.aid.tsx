import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import coffret from "@/assets/cat-coffrets.jpg";
import baklawa from "@/assets/p-baklawa.jpg";
import mignardises from "@/assets/p-mignardises.jpg";
import kaakWarka from "@/assets/p-kaak-warka.jpg";
import samsa from "@/assets/p-samsa.jpg";
import {
  EventHero,
  SectionTitle,
  SuggestedProducts,
  CrossLinkBanner,
  PracticalInfo,
  SocialProof,
  FinalCTA,
} from "@/components/event/EventBlocks";
import { eventHead } from "@/lib/seo";

export const Route = createFileRoute("/evenements/aid")({
  head: () =>
    eventHead({
      title: "Coffrets Aïd & Gâteaux de Fête | Ö' Sweets",
      description:
        "Coffrets cadeaux Aïd, plateaux festifs et assortiments de pâtisseries traditionnelles. Packaging doré, carte de vœux personnalisée. Précommande.",
      path: "/evenements/aid",
      serviceType: "Coffrets cadeaux et pâtisseries de l'Aïd",
      crumbs: [
        { name: "Accueil", path: "/" },
        { name: "Événements", path: "/evenements" },
        { name: "Aïd", path: "/evenements/aid" },
      ],
      ogImage: coffret,
    }),
  component: Page,
});

const categories = [
  { id: "coffrets", label: "Coffrets cadeaux" },
  { id: "gateaux", label: "Gâteaux de fête" },
];
const budgets = [
  { id: "b1", label: "< 40€" },
  { id: "b2", label: "40 – 80€" },
  { id: "b3", label: "80 – 150€" },
  { id: "b4", label: "150€ +" },
];

function Page() {
  const [cat, setCat] = useState(categories[0]);
  const [budget, setBudget] = useState(budgets[1]);
  const [dedicace, setDedicace] = useState("");
  const [prenoms, setPrenoms] = useState("");

  const waLink = useMemo(() => {
    const txt = `Bonjour Ö' Sweets,\n\nDemande Aïd :\n• Catégorie : ${cat.label}\n• Budget : ${budget.label}\n• Message de vœux : ${dedicace || "—"}\n• Destinataires : ${prenoms || "—"}`;
    return `https://wa.me/33699466030?text=${encodeURIComponent(txt)}`;
  }, [cat, budget, dedicace, prenoms]);

  return (
    <div className="bg-ivory">
      <EventHero
        eyebrow="Aïd"
        title="Célébrez l'Aïd avec douceur et générosité"
        subtitle="Coffrets festifs, gâteaux à partager, assortiments traditionnels — pour honorer la fête en famille et entre amis."
        bannerKey="evenements-aid"
      />

      <section className="container-os section-y">
        <SectionTitle
          eyebrow="01 · Type"
          title="Coffrets ou gâteaux de fête ?"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c)}
              className={`p-6 text-center transition border-2 ${cat.id === c.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
            >
              <div className="font-display text-xl">{c.label}</div>
            </button>
          ))}
        </div>
        <div className="mt-8">
          <SectionTitle eyebrow="02 · Budget" title="Votre enveloppe" />
          <div className="flex flex-wrap gap-3 justify-center">
            {budgets.map((b) => (
              <button
                key={b.id}
                onClick={() => setBudget(b)}
                className={`px-6 py-3 text-sm tracking-wider transition border-2 ${budget.id === b.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-os pb-20">
        <SectionTitle
          eyebrow="03 · Sélection"
          title="Nos incontournables Aïd"
          desc="Une sélection dorée pour honorer la fête."
        />
        <SuggestedProducts
          slugs={[
            "coffret-aid",
            "coffret-prestige",
            "baklawa-pistache",
            "mignardises-assortiment",
          ]}
        />
        <p className="text-center mt-6 text-sm text-charbon/60">
          + Assortiments sur mesure et gâteaux de fête sur demande.
        </p>
      </section>

      <section className="bg-sable">
        <div className="container-os section-y grid lg:grid-cols-2 gap-12">
          <div>
            <SectionTitle
              eyebrow="04 · Sur mesure"
              title="Packaging festif & carte de vœux"
            />
            <p className="text-charbon/70 font-light leading-relaxed">
              Chaque coffret est présenté dans un écrin festif, accompagné d'une
              carte de vœux calligraphiée à votre message.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-charbon/75">
              <li>✦ Emballage doré ou terracotta au choix</li>
              <li>✦ Ruban satin et sceau Ö' Sweets</li>
              <li>✦ Carte de vœux personnalisée incluse</li>
            </ul>
          </div>
          <div className="bg-white border border-border p-8 space-y-4">
            <input
              value={prenoms}
              onChange={(e) => setPrenoms(e.target.value)}
              placeholder="Prénom(s) des destinataires"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <textarea
              value={dedicace}
              onChange={(e) => setDedicace(e.target.value)}
              rows={3}
              placeholder="Votre message de vœux (Aïd Moubarak…)"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <div className="text-xs text-charbon/60">
              Sélection :{" "}
              <span className="text-gold">
                {cat.label} · {budget.label}
              </span>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="btn btn-gold w-full justify-center"
            >
              Commander pour l'Aïd
            </a>
          </div>
        </div>
      </section>

      <section className="container-os section-y">
        <CrossLinkBanner
          to="/evenements/ramadan"
          eyebrow="Avant la fête"
          title="Retrouvez nos coffrets Ramadan"
          cta="Voir le Ramadan"
          image={baklawa}
        />
      </section>

      <section className="container-os pb-20">
        <SectionTitle eyebrow="05 · Bon à savoir" title="Infos pratiques" />
        <PracticalInfo
          items={[
            {
              label: "Délai de commande",
              value: "5 jours · précommande fortement conseillée",
            },
            { label: "Précommande", value: "Ouverte 2 semaines avant l'Aïd" },
            {
              label: "Zone de livraison",
              value: "Île-de-France · retrait boutique",
            },
          ]}
        />
      </section>

      <section className="bg-beige">
        <div className="container-os section-y">
          <SectionTitle
            eyebrow="06 · Ils nous ont fait confiance"
            title="Aïds célébrés ensemble"
          />
          <SocialProof
            images={[coffret, baklawa, samsa, mignardises]}
            testimonials={[
              {
                name: "Leila H.",
                event: "Aïd El-Fitr",
                text: "Le coffret doré a subjugué toute la famille.",
              },
              {
                name: "Mehdi C.",
                event: "Cadeaux Aïd",
                text: "J'ai offert 12 coffrets, tous impeccables et généreux.",
              },
              {
                name: "Rania B.",
                event: "Aïd El-Kebir",
                text: "Un service et une élégance dignes de la fête.",
              },
            ]}
          />
        </div>
      </section>

      <FinalCTA
        title="Commander pour l'Aïd"
        desc="Précommandez tôt pour recevoir votre coffret le jour J."
        primary={{ label: "Passer commande", href: waLink }}
        secondary={{ label: "Voir tous les événements", to: "/evenements" }}
      />
    </div>
  );
}
