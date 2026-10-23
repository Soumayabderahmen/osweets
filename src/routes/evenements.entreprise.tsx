import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import wedding from "@/assets/wedding-buffet.jpg";
import mignardises from "@/assets/p-mignardises.jpg";
import coffret from "@/assets/cat-coffrets.jpg";
import platter from "@/assets/hero-platter.jpg";
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

export const Route = createFileRoute("/evenements/entreprise")({
  head: () =>
    eventHead({
      title: "Cadeaux & Coffrets Corporate | Ö' Sweets Entreprise",
      description:
        "Coffrets corporate personnalisés, plateaux de mignardises, cadeaux clients. Facturation entreprise, livraison sur site, devis sous 48h.",
      path: "/evenements/entreprise",
      serviceType: "Pâtisserie et coffrets pour événements d'entreprise",
      crumbs: [
        { name: "Accueil", path: "/" },
        { name: "Événements", path: "/evenements" },
        { name: "Entreprise", path: "/evenements/entreprise" },
      ],
      ogImage: coffret,
    }),
  component: Page,
});

const typesEvt = [
  { id: "seminaire", label: "Séminaire" },
  { id: "inauguration", label: "Inauguration" },
  { id: "fin-annee", label: "Fêtes de fin d'année" },
  { id: "cadeaux-clients", label: "Cadeaux clients" },
];
const quantites = ["10–25", "25–50", "50–100", "100–250", "250+"];

function Page() {
  const [type, setType] = useState(typesEvt[0]);
  const [qty, setQty] = useState(quantites[1]);
  const [societe, setSociete] = useState("");
  const [contact, setContact] = useState("");
  const [details, setDetails] = useState("");

  const waLink = useMemo(() => {
    const txt = `Bonjour Ö' Sweets,\n\nDemande Événement d'entreprise :\n• Type : ${type.label}\n• Quantité : ${qty}\n• Société : ${societe || "—"}\n• Contact : ${contact || "—"}\n• Détails : ${details || "—"}`;
    return `https://wa.me/33699466030?text=${encodeURIComponent(txt)}`;
  }, [type, qty, societe, contact, details]);

  return (
    <div className="bg-ivory">
      <EventHero
        eyebrow="Entreprise"
        title="Une touche gourmande pour vos événements professionnels"
        subtitle="Coffrets corporate, plateaux buffet, cadeaux clients — au service de votre image de marque."
        bannerKey="evenements-entreprise"
      />

      <section className="container-os section-y">
        <SectionTitle eyebrow="01 · Contexte" title="Quel type d'événement ?" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {typesEvt.map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t)}
              className={`p-5 text-center transition border-2 ${type.id === t.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
            >
              <div className="font-display text-base">{t.label}</div>
            </button>
          ))}
        </div>
        <div className="mt-8">
          <SectionTitle eyebrow="02 · Volume" title="Nombre de personnes" />
          <div className="flex flex-wrap gap-3 justify-center">
            {quantites.map((q) => (
              <button
                key={q}
                onClick={() => setQty(q)}
                className={`px-6 py-3 text-sm tracking-wider transition border-2 ${qty === q ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
              >
                {q} pers.
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-os pb-20">
        <SectionTitle
          eyebrow="03 · Sélection"
          title="Nos incontournables corporate"
          desc="Curated pour vos réceptions et cadeaux d'affaires."
        />
        <SuggestedProducts
          slugs={[
            "coffret-prestige",
            "mignardises-assortiment",
            "coffret-decouverte",
            "coffret-aid",
          ]}
        />
        <p className="text-center mt-6 text-sm text-charbon/60">
          + Personnalisation logo, ruban et carte de vœux sur devis.
        </p>
      </section>

      <section className="bg-sable">
        <div className="container-os section-y">
          <SectionTitle
            eyebrow="04 · Service B2B"
            title="Un accompagnement dédié"
          />
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                t: "Devis sur mesure",
                d: "Tarif dégressif selon la quantité, réponse sous 24 h.",
              },
              {
                t: "Facturation entreprise",
                d: "Numéro TVA, bon de commande, virement bancaire acceptés.",
              },
              {
                t: "Livraison sur site",
                d: "Créneau précis, dressage possible sur demande en Île-de-France.",
              },
              {
                t: "Packaging personnalisé",
                d: "Logo, couleurs de la marque, carte imprimée à vos codes.",
              },
            ].map((b) => (
              <div key={b.t} className="bg-white border border-border p-6">
                <div className="text-[10px] uppercase tracking-[0.28em] text-gold">
                  Service
                </div>
                <div className="font-display text-lg mt-2">{b.t}</div>
                <p className="text-sm text-charbon/70 mt-2 leading-relaxed">
                  {b.d}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-os section-y">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <SectionTitle
              eyebrow="05 · Votre projet"
              title="Décrivez votre besoin"
            />
            <p className="text-charbon/70 font-light leading-relaxed">
              Un chargé de projet vous répond sous 24 h avec un devis détaillé,
              adapté à votre volume et à vos codes de marque.
            </p>
          </div>
          <div className="bg-white border border-border p-8 space-y-4">
            <input
              value={societe}
              onChange={(e) => setSociete(e.target.value)}
              placeholder="Société"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Nom & email professionnel"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Date, lieu, besoins spécifiques…"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <div className="text-xs text-charbon/60">
              Sélection :{" "}
              <span className="text-gold">
                {type.label} · {qty} pers.
              </span>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="btn btn-gold w-full justify-center"
            >
              Demander mon devis
            </a>
          </div>
        </div>
      </section>

      <section className="container-os pb-20">
        <CrossLinkBanner
          to="/evenements/mariage"
          eyebrow="Événement privé ?"
          title="Découvrez notre univers Mariage & Cérémonies"
          cta="Voir les mariages"
          image={platter}
        />
      </section>

      <section className="container-os section-y">
        <SectionTitle eyebrow="06 · Bon à savoir" title="Infos pratiques" />
        <PracticalInfo
          items={[
            {
              label: "Délai de commande",
              value: "10 jours pour les grosses quantités",
            },
            {
              label: "Zone de livraison",
              value: "Île-de-France · France sur devis",
            },
            { label: "Facturation", value: "TVA, bon de commande, virement" },
          ]}
        />
      </section>

      <section className="bg-beige">
        <div className="container-os section-y">
          <SectionTitle
            eyebrow="07 · Ils nous ont fait confiance"
            title="Réalisations corporate"
          />
          <SocialProof
            images={[coffret, mignardises, wedding, platter]}
            testimonials={[
              {
                name: "Cabinet Legrand & Associés",
                event: "Cadeaux clients",
                text: "Nos clients ont été impressionnés par l'élégance des coffrets.",
              },
              {
                name: "Groupe Altair",
                event: "Séminaire 120 pers.",
                text: "Un buffet raffiné, service et logistique impeccables.",
              },
              {
                name: "Studio Nova",
                event: "Inauguration",
                text: "Le packaging à nos couleurs a fait toute la différence.",
              },
            ]}
          />
        </div>
      </section>

      <FinalCTA
        title="Demander un devis entreprise"
        desc="Un chargé de projet dédié pour donner à votre événement une signature gourmande."
        primary={{ label: "Contacter le service B2B", href: waLink }}
        secondary={{ label: "Voir tous les événements", to: "/evenements" }}
      />
    </div>
  );
}
