import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import mignardises from "@/assets/p-mignardises.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
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

export const Route = createFileRoute("/evenements/baby-shower")({
  head: () =>
    eventHead({
      title: "Gâteaux Baby Shower Sur Mesure | Ö' Sweets",
      description:
        "Number cakes pastel, coffrets et cadeaux invités pour célébrer l'arrivée de bébé. Personnalisation prénom, couleurs et thème. Devis rapide.",
      path: "/evenements/baby-shower",
      serviceType: "Pâtisserie de baby shower personnalisée",
      crumbs: [
        { name: "Accueil", path: "/" },
        { name: "Événements", path: "/evenements" },
        { name: "Baby Shower", path: "/evenements/baby-shower" },
      ],
      ogImage: cakePistache,
    }),
  component: Page,
});

type Theme = { id: string; label: string; color: string; desc: string };

const themes: Theme[] = [
  {
    id: "fille",
    label: "Fille",
    color: "#F5B7C7",
    desc: "Rose poudré, blush, or rose.",
  },
  {
    id: "garcon",
    label: "Garçon",
    color: "#9EC5E8",
    desc: "Bleu ciel, bleu nuit, argent.",
  },
  {
    id: "neutre-jaune",
    label: "Neutre — Jaune",
    color: "#F0D68C",
    desc: "Jaune miel, crème, blanc.",
  },
  {
    id: "neutre-sauge",
    label: "Neutre — Sauge",
    color: "#B7C4A6",
    desc: "Vert sauge, ivoire, or mat.",
  },
  {
    id: "neutre-terracotta",
    label: "Neutre — Terracotta",
    color: "#C97B5E",
    desc: "Terracotta, sable, doré.",
  },
  {
    id: "custom",
    label: "Personnalisé",
    color: "#D8C79A",
    desc: "Vos couleurs, vos codes.",
  },
];

function Page() {
  const [theme, setTheme] = useState<Theme>(themes[0]);
  const [babyName, setBabyName] = useState("");
  const [date, setDate] = useState("");
  const [colors, setColors] = useState("");

  const waLink = useMemo(() => {
    const txt = `Bonjour Ö' Sweets,\n\nDemande Baby Shower :\n• Thème : ${theme.label}\n• Prénom bébé : ${babyName || "—"}\n• Date : ${date || "—"}\n• Couleurs sur mesure : ${colors || "—"}`;
    return `https://wa.me/33699466030?text=${encodeURIComponent(txt)}`;
  }, [theme, babyName, date, colors]);

  return (
    <div className="bg-ivory">
      <EventHero
        eyebrow="Baby Shower"
        title="Célébrez l'arrivée de bébé"
        subtitle="Avec douceur et raffinement — coffrets pastel, gâteaux thématiques et cadeaux invités sur mesure."
        bannerKey="evenements-baby-shower"
      />

      {/* Filtre thème / couleur */}
      <section className="container-os section-y">
        <SectionTitle
          eyebrow="01 · Ambiance"
          title="Choisissez votre thème"
          desc="Nos douceurs s'accordent à la palette de votre événement."
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t)}
              className={`p-5 text-left transition border-2 ${theme.id === t.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
            >
              <span
                className="block h-8 w-8 rounded-full border border-white shadow"
                style={{ background: t.color }}
              />
              <div className="font-display text-sm mt-3">{t.label}</div>
              <div className="text-[11px] text-charbon/60 mt-1 leading-relaxed">
                {t.desc}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Suggestions produits */}
      <section className="container-os pb-20">
        <SectionTitle
          eyebrow="02 · Sélection"
          title="Nos incontournables Baby Shower"
          desc="Une sélection curée pour composer votre table de fête."
        />
        <SuggestedProducts
          slugs={[
            "mignardises-assortiment",
            "cake-vanille-amandes",
            "cake-pistache-fleur-oranger",
            "coffret-decouverte",
          ]}
        />
        <p className="text-center mt-6 text-sm text-charbon/60">
          + Number cakes personnalisés, cake pops décorés et boîtes cadeaux
          invité(e)s sur demande.
        </p>
      </section>

      {/* Cross-link Gender Reveal */}
      <section className="container-os pb-20">
        <CrossLinkBanner
          to="/evenements/gender-reveal"
          eyebrow="Le sexe reste un mystère ?"
          title="Découvrez notre gâteau Gender Reveal"
          cta="Voir la révélation"
          image={cakePistache}
        />
      </section>

      {/* Personnalisation */}
      <section className="bg-sable">
        <div className="container-os section-y grid lg:grid-cols-2 gap-12">
          <div>
            <SectionTitle
              eyebrow="03 · Sur mesure"
              title="Personnalisez votre commande"
            />
            <p className="text-charbon/70 leading-relaxed font-light">
              Prénom du bébé, date de l'événement, palette exclusive — nous
              adaptons chaque détail pour créer une table à votre image.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-charbon/75">
              <li>✦ Toppers, sablés & macarons au prénom</li>
              <li>✦ Coffrets cadeaux imprimés avec la date</li>
              <li>✦ Palettes de couleurs sur mesure</li>
            </ul>
          </div>
          <div className="bg-white border border-border p-8 space-y-4">
            <input
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              placeholder="Prénom du bébé (ou surprise)"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-border px-4 py-3"
            />
            <input
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              placeholder="Couleurs sur mesure (ex. blush & doré)"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <div className="text-xs text-charbon/60">
              Thème sélectionné :{" "}
              <span className="text-gold">{theme.label}</span>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="btn btn-gold w-full justify-center"
            >
              Envoyer ma demande
            </a>
          </div>
        </div>
      </section>

      {/* Infos pratiques */}
      <section className="container-os section-y">
        <SectionTitle eyebrow="04 · Bon à savoir" title="Infos pratiques" />
        <PracticalInfo
          items={[
            {
              label: "Délai de commande",
              value: "5 jours minimum avant la date",
            },
            {
              label: "Zone de livraison",
              value: "Île-de-France · service traiteur possible",
            },
            {
              label: "Quantités",
              value: "À partir de 15 invités · sans maximum",
            },
          ]}
        />
      </section>

      {/* Preuve sociale */}
      <section className="bg-beige">
        <div className="container-os section-y">
          <SectionTitle
            eyebrow="05 · Elles nous ont fait confiance"
            title="Nos plus belles réalisations"
          />
          <SocialProof
            images={[mignardises, cakeVanille, cakePistache, mignardises]}
            testimonials={[
              {
                name: "Sarah B.",
                event: "Baby Shower Neutre",
                text: "Une table digne d'un magazine, tout le monde a adoré.",
              },
              {
                name: "Ines M.",
                event: "Baby Shower Fille",
                text: "Les macarons au prénom de Lila : un souvenir précieux.",
              },
              {
                name: "Karim & Yasmine",
                event: "Baby Shower Garçon",
                text: "Merci pour cette douceur infinie, service impeccable.",
              },
            ]}
          />
        </div>
      </section>

      <FinalCTA
        title="Voir tous les produits Baby Shower"
        desc="Composez votre table ou laissez-nous imaginer un ensemble sur mesure."
        primary={{ label: "Demander un devis", href: waLink }}
        secondary={{ label: "Voir tous les événements", to: "/evenements" }}
      />
    </div>
  );
}
