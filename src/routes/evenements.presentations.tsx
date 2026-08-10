import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/lib/seo";
import imgPlateauSignature from "@/assets/plateau-or-assortiment-signature.jpg.asset.json";
import imgCoffretMignardises from "@/assets/coffret-or-mignardises-chocolat.jpg.asset.json";
import imgMignardisesMariage from "@/assets/mignardises-tulle-mariage.jpg.asset.json";
import imgCoffretOr from "@/assets/coffret-or-noix-chocolat-or.jpg.asset.json";
import imgCoffretCitron from "@/assets/coffret-or-citron-amande-tulle.jpg.asset.json";
import imgCoffretCroissants from "@/assets/coffret-or-croissants-pistache.jpg.asset.json";
import imgPastilles from "@/assets/pastilles-pistache-chocolat.jpg.asset.json";
import imgCookieDuo from "@/assets/cookie-pistache-chocolat-duo.jpg.asset.json";
import imgLogo from "@/assets/logo-produit-branding-officiel.jpg.asset.json";

const TITLE = "Nos présentations — Mariages, fiançailles, réceptions | Ö' Sweets";
const DESC =
  "Galerie de nos présentations événementielles : mariages, fiançailles, circoncisions, réceptions et tables de douceurs. Demandez une présentation sur mesure pour votre événement.";

export const Route = createFileRoute("/evenements/presentations")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE.url}/evenements/presentations` },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:image", content: imgMignardisesMariage.url },
      { name: "twitter:image", content: imgMignardisesMariage.url },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/evenements/presentations` }],
  }),
  component: Page,
});

const sections: {
  id: string;
  title: string;
  desc: string;
  images: string[];
}[] = [
  {
    id: "mariages",
    title: "Mariages",
    desc: "Tables sucrées, wedding cakes et plateaux d'invités mis en scène pour votre grand jour.",
    images: [imgMignardisesMariage.url, imgPlateauSignature.url, imgCoffretOr.url],
  },
  {
    id: "fiancailles",
    title: "Fiançailles",
    desc: "Plateaux tunisiens somptueux et coffrets d'exception pour l'annonce et la célébration.",
    images: [imgPlateauSignature.url, imgCoffretCitron.url, imgCoffretMignardises.url],
  },
  {
    id: "circoncisions",
    title: "Circoncisions",
    desc: "Une scénographie familiale et élégante, respectueuse des traditions.",
    images: [imgCoffretCroissants.url, imgPlateauSignature.url, imgPastilles.url],
  },
  {
    id: "receptions",
    title: "Réceptions",
    desc: "Buffets sucrés d'entreprise, cocktails, événements privés — présentations sur mesure.",
    images: [imgCoffretMignardises.url, imgCookieDuo.url, imgLogo.url],
  },
  {
    id: "tables-de-douceurs",
    title: "Tables de douceurs",
    desc: "Sweet tables raffinées : verrines, mignardises, coffrets et pièces montées en harmonie.",
    images: [imgPastilles.url, imgCoffretOr.url, imgMignardisesMariage.url],
  },
];

function Page() {
  return (
    <div className="bg-ivory">
      <section className="relative h-[52vh] min-h-[380px] overflow-hidden">
        <img
          src={imgMignardisesMariage.url}
          alt="Présentation événementielle Ö' Sweets"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/80" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold font-medium">
            Galerie — Événementiel
          </div>
          <h1
            className="font-display text-5xl md:text-7xl mt-5 text-white"
            style={{ textShadow: "0 2px 30px rgba(0,0,0,0.5)" }}
          >
            Nos présentations
          </h1>
          <span className="mt-6 inline-block h-px w-16 bg-gold" />
          <p className="mt-6 max-w-2xl text-white/90 font-light leading-relaxed">
            Quelques exemples de nos mises en scène pour mariages, fiançailles,
            circoncisions, réceptions et tables de douceurs. Chaque présentation
            est étudiée sur mesure — les photos ci-dessous sont des références,
            non des produits à commander.
          </p>
          <Link
            to="/devis"
            search={{ type: "Présentation événementielle" }}
            className="btn btn-gold mt-8"
          >
            Demander une présentation pour mon événement →
          </Link>
        </div>
      </section>

      {sections.map((s) => (
        <section key={s.id} id={s.id} className="container-os section-y border-b border-gold/15 last:border-b-0">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-[10px] uppercase tracking-[0.3em] text-gold">
              Exemple de mise en scène
            </div>
            <h2 className="font-display text-3xl md:text-4xl mt-3">{s.title}</h2>
            <span className="mt-4 inline-block h-px w-12 bg-gold" />
            <p className="mt-4 text-charbon/75 leading-relaxed">{s.desc}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {s.images.map((img, i) => (
              <div
                key={i}
                className="relative overflow-hidden bg-sable aspect-[4/5] group"
              >
                <img
                  src={img}
                  alt={`${s.title} — présentation Ö' Sweets`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] group-hover:scale-[1.04]"
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="bg-sable section-y">
        <div className="container-os text-center max-w-2xl mx-auto">
          <div className="text-[10px] uppercase tracking-[0.3em] text-gold">
            Sur mesure
          </div>
          <h2 className="font-display text-3xl md:text-4xl mt-3">
            Votre présentation, à votre image
          </h2>
          <p className="mt-5 text-charbon/75 leading-relaxed">
            Nos présentations sont pensées pour chaque événement : nombre
            d'invités, thème, palette, contraintes du lieu. Décrivez-nous votre
            projet et notre atelier vous répond avec une proposition
            personnalisée.
          </p>
          <Link
            to="/devis"
            search={{ type: "Présentation événementielle" }}
            className="btn btn-gold mt-8"
          >
            Demander une présentation pour mon événement →
          </Link>
        </div>
      </section>
    </div>
  );
}
