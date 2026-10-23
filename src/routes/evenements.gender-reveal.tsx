import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Shield } from "lucide-react";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import mignardises from "@/assets/p-mignardises.jpg";
import {
  EventHero,
  SectionTitle,
  CrossLinkBanner,
  PracticalInfo,
  SocialProof,
  FinalCTA,
} from "@/components/event/EventBlocks";
import { eventHead } from "@/lib/seo";

export const Route = createFileRoute("/evenements/gender-reveal")({
  head: () =>
    eventHead({
      title: "Gâteau Gender Reveal Bleu ou Rose | Ö' Sweets",
      description:
        "Gâteau surprise à la découpe : intérieur rose ou bleu révélé au moment magique. Layer, drip et naked cakes sur mesure. Confidentialité garantie.",
      path: "/evenements/gender-reveal",
      serviceType: "Gâteau gender reveal personnalisé",
      crumbs: [
        { name: "Accueil", path: "/" },
        { name: "Événements", path: "/evenements" },
        { name: "Gender Reveal", path: "/evenements/gender-reveal" },
      ],
      ogImage: cakePistache,
    }),
  component: Page,
});

type Format = { id: string; label: string; desc: string };

const formats: Format[] = [
  {
    id: "layer",
    label: "Layer Cake",
    desc: "Étages superposés, glaçage lisse, intérieur coloré révélé à la découpe.",
  },
  {
    id: "drip",
    label: "Drip Cake",
    desc: "Coulures gourmandes, décor floral ou doré, effet spectaculaire.",
  },
  {
    id: "naked",
    label: "Naked Cake",
    desc: "Style rustique-chic, crème apparente, fruits frais et fleurs.",
  },
];

type Icing = { id: string; label: string; color: string };
const icings: Icing[] = [
  { id: "blanc", label: "Blanc pur", color: "#F7F3EC" },
  { id: "dore", label: "Doré", color: "#C9A959" },
  { id: "pastel-rose", label: "Pastel rose", color: "#F5D7DE" },
  { id: "pastel-bleu", label: "Pastel bleu", color: "#CBDDEE" },
  { id: "sauge", label: "Sauge", color: "#B7C4A6" },
];

function Page() {
  const [format, setFormat] = useState<Format>(formats[0]);
  const [icing, setIcing] = useState<Icing>(icings[0]);
  const [topper, setTopper] = useState(true);
  const [inscription, setInscription] = useState("");
  const [guests, setGuests] = useState(20);
  const [date, setDate] = useState("");

  const waLink = useMemo(() => {
    const txt = `Bonjour Ö' Sweets,\n\nCommande Gender Reveal :\n• Format : ${format.label}\n• Glaçage extérieur : ${icing.label}\n• Topper "Boy or Girl ?" : ${topper ? "Oui" : "Non"}\n• Inscription : ${inscription || "—"}\n• Invités : ${guests}\n• Date : ${date || "—"}\n\n(La couleur intérieure reste confidentielle — nous vous contactons en privé.)`;
    return `https://wa.me/33699466030?text=${encodeURIComponent(txt)}`;
  }, [format, icing, topper, inscription, guests, date]);

  return (
    <div className="bg-ivory">
      <EventHero
        eyebrow="Gender Reveal"
        title="Bleu ou Rose ?"
        subtitle="Le moment de vérité, révélé à la découpe du gâteau. Extérieur neutre et raffiné, cœur coloré tenu secret jusqu'à l'instant magique."
        bannerKey="evenements-gender-reveal"
      />

      {/* Concept produit */}
      <section className="container-os section-y">
        <SectionTitle
          eyebrow="Le concept"
          title="Un gâteau, deux surprises"
          desc="Extérieur neutre, cœur coloré : la révélation se fait à la découpe, devant vos proches."
        />
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              n: "01",
              t: "Extérieur neutre",
              d: "Blanc pur, doré ou pastel — aucun indice visible.",
            },
            {
              n: "02",
              t: "Cœur coloré",
              d: "Génoise rose ou bleue, protégée par un glaçage opaque.",
            },
            {
              n: "03",
              t: "Révélation",
              d: "La découpe dévoile la couleur devant vos invités.",
            },
          ].map((s) => (
            <div key={s.n} className="bg-white border border-border p-8">
              <div className="text-gold text-xs tracking-[0.3em] uppercase">
                {s.n}
              </div>
              <h3 className="font-display text-2xl mt-3">{s.t}</h3>
              <p className="text-sm text-charbon/70 mt-3 leading-relaxed">
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Formats */}
      <section className="container-os pb-20">
        <SectionTitle eyebrow="01 · Format" title="Choisissez votre style" />
        <div className="grid md:grid-cols-3 gap-3">
          {formats.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f)}
              className={`p-6 text-left transition border-2 ${format.id === f.id ? "border-gold bg-beige" : "border-border bg-white hover:border-gold/50"}`}
            >
              <div className="font-display text-xl">{f.label}</div>
              <div className="text-sm text-charbon/60 mt-2 leading-relaxed">
                {f.desc}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Personnalisation */}
      <section className="container-os pb-20">
        <SectionTitle
          eyebrow="02 · Personnalisation"
          title="Composez le décor"
        />
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6 bg-white border border-border p-8">
            <div>
              <div className="text-xs uppercase tracking-wider text-charbon/60 mb-3">
                Glaçage extérieur
              </div>
              <div className="grid grid-cols-5 gap-2">
                {icings.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setIcing(c)}
                    className={`p-2 border-2 transition ${icing.id === c.id ? "border-gold" : "border-border hover:border-gold/50"}`}
                  >
                    <span
                      className="block h-10 w-full rounded-sm"
                      style={{ background: c.color }}
                    />
                    <div className="text-[10px] mt-1 text-charbon/70">
                      {c.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={topper}
                onChange={(e) => setTopper(e.target.checked)}
                className="h-4 w-4 accent-[var(--gold)]"
              />
              <span>Topper « Boy or Girl ? » inclus</span>
            </label>

            <input
              value={inscription}
              onChange={(e) => setInscription(e.target.value)}
              placeholder="Inscription sur le gâteau (facultatif)"
              className="w-full bg-white border border-border px-4 py-3"
            />

            <div>
              <label className="text-xs uppercase tracking-wider text-charbon/60">
                Nombre d'invités : <span className="text-gold">{guests}</span>
              </label>
              <input
                type="range"
                min={8}
                max={100}
                step={2}
                value={guests}
                onChange={(e) => setGuests(+e.target.value)}
                className="w-full accent-[var(--gold)]"
              />
              <div className="text-[11px] text-charbon/60 mt-1">
                Suggéré : 16cm (8-12) · 20cm (15-25) · 24cm (25-40) · 2 étages
                (40+)
              </div>
            </div>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-border px-4 py-3"
            />

            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="btn btn-gold w-full justify-center"
            >
              Commander mon gâteau surprise
            </a>
            <Link
              to="/gateaux/gender-reveal"
              className="block text-center text-xs uppercase tracking-wider text-charbon/60 hover:text-gold"
            >
              Configurer via l'outil détaillé →
            </Link>
          </div>

          {/* Bloc réassurance confidentialité */}
          <div className="bg-charbon text-ivory p-10 flex flex-col justify-center">
            <Shield className="h-10 w-10 text-gold" />
            <h3 className="font-display text-3xl mt-5 text-white">
              La couleur reste un secret
            </h3>
            <p className="mt-4 text-ivory/80 font-light leading-relaxed">
              Nous vous contactons en privé pour recevoir la couleur choisie. En
              atelier, seule notre chef pâtissière a accès à l'information — le
              gâteau est scellé, étiqueté de manière neutre, et livré à un tiers
              de confiance de votre choix.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-ivory/75">
              <li>✦ Enveloppe scellée pour transmettre la couleur</li>
              <li>✦ Aucune photo intérieure partagée</li>
              <li>✦ Livraison à un tiers si vous le souhaitez</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Accessoires assortis */}
      <section className="bg-sable">
        <div className="container-os section-y grid md:grid-cols-[1fr_1.2fr] gap-10 items-center">
          <img
            src={mignardises}
            alt="Mini douceurs rose et bleu"
            className="w-full aspect-[4/3] object-cover"
          />
          <div>
            <SectionTitle
              eyebrow="Accessoires"
              title="Coffret mini-douceurs rose & bleu"
            />
            <p className="text-charbon/70 leading-relaxed font-light">
              Prolongez la surprise avec un assortiment de mignardises rose et
              bleu à offrir à vos invités : macarons, sablés, cake pops.
            </p>
            <Link
              to="/produits/$slug"
              params={{ slug: "mignardises-assortiment" }}
              className="btn btn-outline-gold mt-6"
            >
              Voir le coffret
            </Link>
          </div>
        </div>
      </section>

      {/* Cross-link Baby Shower */}
      <section className="container-os section-y">
        <CrossLinkBanner
          to="/evenements/baby-shower"
          eyebrow="Après la révélation"
          title="Célébrez avec un vrai Baby Shower"
          cta="Voir Baby Shower"
          image={cakeVanille}
        />
      </section>

      {/* Infos pratiques */}
      <section className="container-os pb-20">
        <SectionTitle eyebrow="Infos pratiques" title="Bon à savoir" />
        <PracticalInfo
          items={[
            {
              label: "Délai de commande",
              value: "5 jours minimum avant la date",
            },
            {
              label: "Zone de livraison",
              value: "Île-de-France · livraison à un tiers possible",
            },
            {
              label: "Quantités",
              value: "De 8 à 100 parts · options plusieurs étages",
            },
          ]}
        />
      </section>

      {/* Preuve sociale */}
      <section className="bg-beige">
        <div className="container-os section-y">
          <SectionTitle
            eyebrow="Ils ont dit oui à la surprise"
            title="Réalisations récentes"
          />
          <SocialProof
            images={[cakePistache, cakeVanille, mignardises, cakePistache]}
            testimonials={[
              {
                name: "Amine & Nour",
                event: "Gender Reveal",
                text: "Un choc quand on a coupé le gâteau — c'est une fille ! Merci Ö' Sweets.",
              },
              {
                name: "Laila K.",
                event: "Gender Reveal",
                text: "La discrétion de l'équipe a été parfaite, jusqu'au dernier moment.",
              },
              {
                name: "Sofiane R.",
                event: "Gender Reveal",
                text: "Décor doré magnifique, les invités ont adoré la mise en scène.",
              },
            ]}
          />
        </div>
      </section>

      <FinalCTA
        title="Commander mon gâteau surprise"
        desc="Discrétion garantie · délai 5 jours · Île-de-France"
        primary={{ label: "Commander sur WhatsApp", href: waLink }}
        secondary={{
          label: "Configurer en détail",
          to: "/gateaux/gender-reveal",
        }}
      />
    </div>
  );
}
