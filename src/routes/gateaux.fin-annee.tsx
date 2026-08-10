import { createFileRoute, Link } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

type EndOfYear = {
  slug: string;
  name: string;
  flavor: string;
  serves: string;
  price: number;
  allergens: string[];
  conservation: string;
  delivery: string;
  image: string;
};

const ORDER_DEADLINE_ISO = "2026-12-20T23:59:59+01:00";
const ORDER_DEADLINE = "20 décembre 2026";
const PREORDER_OPEN = Date.now() <= new Date(ORDER_DEADLINE_ISO).getTime();
const PICKUP_DATES = "23, 24 et 31 décembre 2026 (sur créneaux)";
const AVAILABILITY = "Disponibilité limitée — collection saisonnière";

const ITEMS: EndOfYear[] = [
  {
    slug: "buche-chocolat-praline",
    name: "Bûche Chocolat & Praliné",
    flavor: "Chocolat noir 70% & praliné noisette",
    serves: "6 à 8 personnes",
    price: 58,
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
    conservation: "48 h entre 0 et 4°C.",
    delivery: "Retrait boutique ou livraison locale (Île-de-France)",
    image: cakeChocolat,
  },
  {
    slug: "buche-vanille-marron",
    name: "Bûche Vanille & Marron",
    flavor: "Vanille Bourbon & crème de marron",
    serves: "6 à 8 personnes",
    price: 62,
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
    conservation: "48 h entre 0 et 4°C.",
    delivery: "Retrait boutique ou livraison locale (Île-de-France)",
    image: cakeVanille,
  },
  {
    slug: "buche-pistache-framboise",
    name: "Bûche Pistache & Framboise",
    flavor: "Pistache de Sicile & framboise fraîche",
    serves: "6 à 8 personnes",
    price: 64,
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
    conservation: "48 h entre 0 et 4°C.",
    delivery: "Retrait boutique ou livraison locale (Île-de-France)",
    image: cakePistache,
  },
];

export const Route = createFileRoute("/gateaux/fin-annee")({
  head: () => ({
    meta: [
      { title: "Bûches & gâteaux de fin d'année | Ö' Sweets" },
      {
        name: "description",
        content:
          "Collection saisonnière de fin d'année : bûches signature à précommander. Date limite de commande, retraits sur créneaux, disponibilité limitée.",
      },
      { property: "og:title", content: "Gâteaux de fin d'année | Ö' Sweets" },
      { property: "og:description", content: "Bûches signature à précommander pour les fêtes." },
      { property: "og:url", content: `${SITE.url}/gateaux/fin-annee` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/fin-annee` }],
    scripts: [
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Gâteaux", path: "/gateaux" },
          { name: "Fin d'année", path: "/gateaux/fin-annee" },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="bg-ivory">
      <section className="relative h-[46vh] min-h-[360px] overflow-hidden">
        <img src={catCakes} alt="Fin d'année" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold">Édition saisonnière</div>
          <h1 className="font-display text-5xl md:text-6xl mt-4">Gâteaux de fin d'année</h1>
          <span className="mt-5 inline-block h-px w-16 bg-gold" />
          <p className="mt-5 max-w-xl text-white/90 font-light">
            Bûches signature à précommander pour vos fêtes de fin d'année.
          </p>
        </div>
      </section>

      {PREORDER_OPEN ? (
        <div className="bg-gold/10 border-y border-gold/30 text-center py-4 text-sm text-charbon/85 px-4">
          <span className="text-gold uppercase tracking-[0.25em] text-[10px] mr-2">Précommandes ouvertes</span>
          <strong>Précommande uniquement</strong> — date limite : <strong>{ORDER_DEADLINE}</strong> · Retrait : {PICKUP_DATES} · {AVAILABILITY}.
        </div>
      ) : (
        <div className="bg-charbon/5 border-y border-charbon/20 text-center py-4 text-sm text-charbon/85 px-4">
          <span className="uppercase tracking-[0.25em] text-[10px] mr-2 text-charbon/60">Précommandes closes</span>
          <strong>Les précommandes de fin d'année sont terminées</strong> (date limite dépassée le {ORDER_DEADLINE}).
          Cette collection saisonnière n'est plus disponible à la commande — retrouvez-la à la prochaine édition ou{" "}
          <Link to="/devis" search={{ type: "Gâteau sur mesure" }} className="text-gold underline underline-offset-4">
            demandez un gâteau sur mesure
          </Link>
          .
        </div>
      )}


      <section className="container-os section-y">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {ITEMS.map((it) => (
            <article key={it.slug} className="bg-white border border-border hover:border-gold/50 transition">
              <div className="aspect-[4/3] overflow-hidden bg-beige">
                <img src={it.image} alt={it.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-charbon/55">
                  <span>{it.serves}</span>
                  <span className="font-price text-gold text-base normal-case tracking-normal">{it.price}€</span>
                </div>
                <h3 className="font-display text-xl mt-2 leading-tight">{it.name}</h3>
                <p className="text-sm text-charbon/75 mt-1">{it.flavor}</p>

                <dl className="mt-4 space-y-2 text-sm text-charbon/75">
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Allergènes</dt><dd>{it.allergens.join(", ")}.</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Conservation</dt><dd>{it.conservation}</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Date limite de commande</dt><dd>{ORDER_DEADLINE}</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Dates de retrait</dt><dd>{PICKUP_DATES}</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Livraison</dt><dd>{it.delivery}</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Disponibilité</dt><dd>{PREORDER_OPEN ? AVAILABILITY : "Précommandes closes — indisponible pour cette édition"}</dd></div>
                </dl>

                {PREORDER_OPEN ? (
                  <a
                    href={`https://wa.me/33699466030?text=${encodeURIComponent(`Bonjour, je souhaite précommander : ${it.name} pour les fêtes de fin d'année.`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-gold w-full justify-center text-xs mt-5"
                  >
                    Précommander
                  </a>
                ) : (
                  <div className="mt-5">
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      className="btn w-full justify-center text-xs bg-charbon/10 text-charbon/50 cursor-not-allowed"
                    >
                      Précommandes closes
                    </button>
                    <p className="text-[11px] text-charbon/60 mt-2 text-center">
                      Date limite dépassée ({ORDER_DEADLINE}).
                    </p>
                  </div>
                )}

              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
