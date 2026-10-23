import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import baklawa from "@/assets/p-baklawa.jpg";
import samsa from "@/assets/p-samsa.jpg";
import kaakWarka from "@/assets/p-kaak-warka.jpg";
import mignardises from "@/assets/p-mignardises.jpg";
import coffret from "@/assets/cat-coffrets.jpg";
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

export const Route = createFileRoute("/evenements/ramadan")({
  head: () =>
    eventHead({
      title: "Pâtisseries Ramadan & Coffrets Iftar | Ö' Sweets",
      description:
        "Baklawa, samsa, cornes de gazelle, zrir : coffrets Ramadan et formules Iftar façonnés à la commande. Livraison France entière.",
      path: "/evenements/ramadan",
      serviceType: "Pâtisseries orientales pour Ramadan et Iftar",
      crumbs: [
        { name: "Accueil", path: "/" },
        { name: "Événements", path: "/evenements" },
        { name: "Ramadan", path: "/evenements/ramadan" },
      ],
      ogImage: baklawa,
    }),
  component: Page,
});

const moments = [
  {
    id: "iftar",
    label: "Iftar",
    desc: "Plateaux à partager à la rupture du jeûne.",
  },
  { id: "shour", label: "Shour", desc: "Douceurs légères avant l'aube." },
  {
    id: "cadeaux",
    label: "Cadeaux Aïd",
    desc: "Coffrets à offrir à vos proches.",
  },
];
const formats = [
  { id: "coffret", label: "Coffrets" },
  { id: "unite", label: "Pièces à l'unité" },
];

function Page() {
  const [moment, setMoment] = useState(moments[0]);
  const [format, setFormat] = useState(formats[0]);
  const [recurrent, setRecurrent] = useState(false);
  const [details, setDetails] = useState("");

  const waLink = useMemo(() => {
    const txt = `Bonjour Ö' Sweets,\n\nDemande Ramadan :\n• Moment : ${moment.label}\n• Format : ${format.label}\n• Commande récurrente : ${recurrent ? "Oui" : "Non"}\n• Détails : ${details || "—"}`;
    return `https://wa.me/33699466030?text=${encodeURIComponent(txt)}`;
  }, [moment, format, recurrent, details]);

  return (
    <div className="bg-ivory">
      <EventHero
        eyebrow="Ramadan"
        title="Les saveurs du Ramadan, entre tradition et raffinement"
        subtitle="Baklava, samsa, cornes de gazelle, zrir — préparés à la commande dans nos ateliers pour préserver la fraîcheur."
        bannerKey="evenements-ramadan"
      />

      <section className="container-os section-y">
        <SectionTitle
          eyebrow="01 · Moment"
          title="Pour quel moment du mois ?"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {moments.map((m) => (
            <button
              key={m.id}
              onClick={() => setMoment(m)}
              className={`p-6 text-left transition border-2 ${moment.id === m.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
            >
              <div className="font-display text-xl">{m.label}</div>
              <div className="text-sm text-charbon/60 mt-2">{m.desc}</div>
            </button>
          ))}
        </div>
        <div className="mt-8">
          <SectionTitle
            eyebrow="02 · Format"
            title="Coffrets ou pièces à l'unité ?"
          />
          <div className="flex flex-wrap gap-3 justify-center">
            {formats.map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f)}
                className={`px-8 py-3 text-sm tracking-wider transition border-2 ${format.id === f.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="container-os pb-20">
        <SectionTitle
          eyebrow="03 · Sélection"
          title="Nos incontournables Ramadan"
          desc="Les grandes signatures orientales, façonnées à la main."
        />
        <SuggestedProducts
          slugs={[
            "baklawa-pistache",
            "samsa-amandes",
            "kaak-warka",
            "mignardises-assortiment",
          ]}
        />
        <p className="text-center mt-6 text-sm text-charbon/60">
          + Formules Iftar à partager et zrir sur commande.
        </p>
      </section>

      <section className="bg-sable">
        <div className="container-os section-y grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <SectionTitle
              eyebrow="04 · Fraîcheur"
              title="Fabriqué à la commande"
            />
            <p className="text-charbon/70 font-light leading-relaxed">
              Pendant le mois sacré, chaque pièce est préparée sur commande pour
              préserver le fondant, le croustillant et les arômes. Nous
              recommandons vivement la précommande — la demande est forte, les
              délais peuvent être plus courts.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-charbon/75">
              <li>✦ Livraison en soirée avant l'Iftar (Île-de-France)</li>
              <li>✦ Commande récurrente hebdomadaire possible</li>
              <li>✦ Fraîcheur garantie du jour</li>
            </ul>
          </div>
          <div className="bg-white border border-border p-8 space-y-4">
            <label className="flex items-center gap-3 text-sm text-charbon/80">
              <input
                type="checkbox"
                checked={recurrent}
                onChange={(e) => setRecurrent(e.target.checked)}
                className="h-4 w-4 accent-gold"
              />
              Je souhaite mettre en place une commande hebdomadaire pendant tout
              le mois
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Quantités souhaitées, dates, préférences…"
              className="w-full bg-white border border-border px-4 py-3"
            />
            <div className="text-xs text-charbon/60">
              Sélection :{" "}
              <span className="text-gold">
                {moment.label} · {format.label}
              </span>
            </div>
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="btn btn-gold w-full justify-center"
            >
              Précommander maintenant
            </a>
          </div>
        </div>
      </section>

      <section className="container-os section-y">
        <CrossLinkBanner
          to="/evenements/aid"
          eyebrow="La fête approche"
          title="Découvrez nos coffrets pour l'Aïd"
          cta="Voir les coffrets Aïd"
          image={coffret}
        />
      </section>

      <section className="container-os pb-20">
        <SectionTitle eyebrow="05 · Bon à savoir" title="Infos pratiques" />
        <PracticalInfo
          items={[
            {
              label: "Délai de commande",
              value: "3 jours minimum · précommande recommandée",
            },
            {
              label: "Livraison Iftar",
              value: "Île-de-France · créneaux en soirée",
            },
            { label: "Récurrence", value: "Formule hebdomadaire disponible" },
          ]}
        />
      </section>

      <section className="bg-beige">
        <div className="container-os section-y">
          <SectionTitle
            eyebrow="06 · Ils nous ont fait confiance"
            title="Ramadan précédents"
          />
          <SocialProof
            images={[baklawa, samsa, kaakWarka, mignardises]}
            testimonials={[
              {
                name: "Famille Ben Ali",
                event: "Ramadan",
                text: "Chaque semaine, un plateau différent — un vrai bonheur.",
              },
              {
                name: "Amel D.",
                event: "Iftar en famille",
                text: "Frais, fondant, exactement comme à la maison.",
              },
              {
                name: "Sami L.",
                event: "Ramadan récurrent",
                text: "Service impeccable, livraison toujours à l'heure.",
              },
            ]}
          />
        </div>
      </section>

      <FinalCTA
        title="Découvrir nos coffrets Ramadan"
        desc="Précommandez dès maintenant pour garantir vos livraisons du mois."
        primary={{ label: "Précommander sur WhatsApp", href: waLink }}
        secondary={{ label: "Voir tous les événements", to: "/evenements" }}
      />
    </div>
  );
}
