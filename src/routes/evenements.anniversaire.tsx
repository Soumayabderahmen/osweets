import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import mignardises from "@/assets/p-mignardises.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
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

export const Route = createFileRoute("/evenements/anniversaire")({
  head: () =>
    eventHead({
      title: "Gâteau d'Anniversaire sur Mesure | Ö' Sweets Évry-Courcouronnes",
      description:
        "Number cakes, gâteaux à thème, cupcakes et candy bars. Créations sur mesure façon pâtisserie tunisienne. Commandez pour votre anniversaire.",
      path: "/evenements/anniversaire",
      serviceType: "Gâteau d'anniversaire personnalisé",
      crumbs: [
        { name: "Accueil", path: "/" },
        { name: "Événements", path: "/evenements" },
        { name: "Fête d'anniversaire", path: "/evenements/anniversaire" },
      ],
      ogImage: cakeVanille,
    }),
  component: Page,
});

const ages = [
  { id: "enfant", label: "Enfant", desc: "3–11 ans, thèmes ludiques." },
  { id: "ado", label: "Ado", desc: "12–17 ans, moderne & fun." },
  { id: "adulte", label: "Adulte", desc: "Élégant, floral, minimaliste." },
];
const themesVisuels = [
  { id: "personnages", label: "Personnages", color: "#F5B7C7" },
  { id: "elegant", label: "Élégant floral", color: "#D8C79A" },
  { id: "fun", label: "Fun & coloré", color: "#9EC5E8" },
  { id: "minimal", label: "Minimaliste", color: "#E9E1D0" },
];

function Page() {
  const [age, setAge] = useState(ages[0]);
  const [theme, setTheme] = useState(themesVisuels[0]);
  const [prenom, setPrenom] = useState("");
  const [ageNum, setAgeNum] = useState("");
  const [message, setMessage] = useState("");
  const [couleurs, setCouleurs] = useState("");

  const waLink = useMemo(() => {
    const txt = `Bonjour Ö' Sweets,\n\nDemande Anniversaire :\n• Tranche d'âge : ${age.label}\n• Thème : ${theme.label}\n• Prénom : ${prenom || "—"}\n• Âge : ${ageNum || "—"}\n• Couleurs : ${couleurs || "—"}\n• Message sur le gâteau : ${message || "—"}`;
    return `https://wa.me/33699466030?text=${encodeURIComponent(txt)}`;
  }, [age, theme, prenom, ageNum, couleurs, message]);

  return (
    <div className="bg-ivory">
      <EventHero
        eyebrow="Fête d'anniversaire"
        title="Un anniversaire à croquer, à votre image"
        subtitle="Number cakes, gâteaux à thème, cupcakes et candy bars — pensés pour marquer chaque bougie."
        bannerKey="evenements-anniversaire"
      />

      <section className="container-os section-y">
        <SectionTitle
          eyebrow="01 · Pour qui"
          title="Choisissez la tranche d'âge"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ages.map((a) => (
            <button
              key={a.id}
              onClick={() => setAge(a)}
              className={`p-6 text-left transition border-2 ${age.id === a.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
            >
              <div className="font-display text-xl">{a.label}</div>
              <div className="text-sm text-charbon/60 mt-2">{a.desc}</div>
            </button>
          ))}
        </div>

        <div className="mt-10">
          <SectionTitle
            eyebrow="02 · Ambiance"
            title="Choisissez votre thème visuel"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {themesVisuels.map((t) => (
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
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-os pb-20">
        <SectionTitle
          eyebrow="03 · Sélection"
          title="Nos incontournables anniversaire"
          desc="Une sélection curée pour composer votre table."
        />
        <SuggestedProducts
          slugs={[
            "gateau-licorne",
            "gateau-floral-adulte",
            "mignardises-assortiment",
            "coffret-decouverte",
          ]}
        />
        <p className="text-center mt-6 text-sm text-charbon/60">
          + Number cakes personnalisés, cupcakes assortis et candy bars sur
          demande.
        </p>
      </section>

      <section className="container-os pb-20">
        <CrossLinkBanner
          to="/gateaux/anniversaire"
          eyebrow="Envie d'un gâteau signature ?"
          title="Découvrez nos gâteaux d'anniversaire à thème"
          cta="Voir les gâteaux"
          image={cakeChocolat}
        />
      </section>

      <section className="bg-sable">
        <div className="container-os section-y grid lg:grid-cols-2 gap-12">
          <div>
            <SectionTitle
              eyebrow="04 · Sur mesure"
              title="Personnalisez votre gâteau"
            />
            <p className="text-charbon/70 leading-relaxed font-light">
              Prénom, âge, couleurs, thème, message — chaque détail est pensé
              pour l'invité d'honneur.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-charbon/75">
              <li>✦ Toppers & sablés personnalisés</li>
              <li>✦ Number cakes 1 à 99</li>
              <li>✦ Candy bar aux couleurs de la fête</li>
            </ul>
          </div>
          <div className="bg-white border border-border p-8 space-y-4">
            <input
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              placeholder="Prénom"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <input
              value={ageNum}
              onChange={(e) => setAgeNum(e.target.value)}
              placeholder="Âge à célébrer"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <input
              value={couleurs}
              onChange={(e) => setCouleurs(e.target.value)}
              placeholder="Couleurs souhaitées"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message sur le gâteau"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <div className="text-xs text-charbon/60">
              Sélection :{" "}
              <span className="text-gold">
                {age.label} · {theme.label}
              </span>
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

      <section className="container-os section-y">
        <SectionTitle eyebrow="05 · Bon à savoir" title="Infos pratiques" />
        <PracticalInfo
          items={[
            {
              label: "Délai de commande",
              value: "5 jours minimum avant la date",
            },
            {
              label: "Tailles disponibles",
              value: "De 6 à 60 parts selon les invités",
            },
            {
              label: "Zone de livraison",
              value: "Île-de-France · retrait boutique possible",
            },
          ]}
        />
      </section>

      <section className="bg-beige">
        <div className="container-os section-y">
          <SectionTitle
            eyebrow="06 · Ils nous ont fait confiance"
            title="Nos plus belles bougies"
          />
          <SocialProof
            images={[cakeVanille, cakeChocolat, cakePistache, mignardises]}
            testimonials={[
              {
                name: "Nadia R.",
                event: "Anniversaire 6 ans",
                text: "Un number cake magique, ma fille en parle encore.",
              },
              {
                name: "Youssef K.",
                event: "Anniversaire 30 ans",
                text: "Élégant et délicieux, tous mes invités ont adoré.",
              },
              {
                name: "Lila S.",
                event: "Anniversaire 40 ans",
                text: "Une table digne d'un magazine, merci !",
              },
            ]}
          />
        </div>
      </section>

      <FinalCTA
        title="Créer mon gâteau d'anniversaire"
        desc="Confiez-nous votre thème, on imagine le reste."
        primary={{ label: "Demander un devis", href: waLink }}
        secondary={{ label: "Voir tous les événements", to: "/evenements" }}
      />
    </div>
  );
}
