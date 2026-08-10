import { createFileRoute } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakeCitron from "@/assets/cake-citron.jpg";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

type Entremets = {
  slug: string;
  name: string;
  flavor: string;
  format: string;
  serves: string;
  price: number;
  conservation: string;
  temperature: string;
  allergens: string[];
  image: string;
};

const ITEMS: Entremets[] = [
  {
    slug: "entremets-chocolat-praline",
    name: "Entremets Chocolat & Praliné",
    flavor: "Chocolat noir 70% & praliné noisette",
    format: "Ø 20 cm",
    serves: "6 à 8 personnes",
    price: 48,
    conservation: "48 h maximum",
    temperature: "0 à 4°C — chaîne du froid impérative",
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
    image: cakeChocolat,
  },
  {
    slug: "entremets-pistache-framboise",
    name: "Entremets Pistache & Framboise",
    flavor: "Pistache de Sicile & framboise fraîche",
    format: "Ø 20 cm",
    serves: "6 à 8 personnes",
    price: 52,
    conservation: "48 h maximum",
    temperature: "0 à 4°C — chaîne du froid impérative",
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
    image: cakePistache,
  },
  {
    slug: "entremets-vanille-caramel",
    name: "Entremets Vanille & Caramel",
    flavor: "Vanille Bourbon & caramel beurre salé",
    format: "Ø 20 cm",
    serves: "6 à 8 personnes",
    price: 48,
    conservation: "48 h maximum",
    temperature: "0 à 4°C — chaîne du froid impérative",
    allergens: ["gluten", "œufs", "lactose"],
    image: cakeVanille,
  },
  {
    slug: "entremets-citron-basilic",
    name: "Entremets Citron & Basilic",
    flavor: "Citron bio & basilic",
    format: "Ø 20 cm",
    serves: "6 à 8 personnes",
    price: 46,
    conservation: "48 h maximum",
    temperature: "0 à 4°C — chaîne du froid impérative",
    allergens: ["gluten", "œufs", "lactose"],
    image: cakeCitron,
  },
];

export const Route = createFileRoute("/gateaux/entremets")({
  head: () => ({
    meta: [
      { title: "Entremets Signature | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Nos entremets signature — chocolat praliné, pistache framboise, vanille caramel. Retrait boutique ou livraison locale uniquement (chaîne du froid).",
      },
      { property: "og:title", content: "Entremets | Ö' Sweets" },
      { property: "og:description", content: "Entremets frais — retrait & livraison locale uniquement." },
      { property: "og:url", content: `${SITE.url}/gateaux/entremets` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/entremets` }],
    scripts: [
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Gâteaux", path: "/gateaux" },
          { name: "Entremets", path: "/gateaux/entremets" },
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
        <img src={catCakes} alt="Entremets" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold">Frais du jour</div>
          <h1 className="font-display text-5xl md:text-6xl mt-4">Entremets</h1>
          <span className="mt-5 inline-block h-px w-16 bg-gold" />
          <p className="mt-5 max-w-xl text-white/90 font-light">
            Créations fraîches à la commande — mousses, biscuits, croustillants. Retrait boutique ou livraison locale.
          </p>
        </div>
      </section>

      <div className="bg-gold/10 border-y border-gold/30 text-center py-3 text-sm text-charbon/85 px-4">
        <span className="text-gold uppercase tracking-[0.25em] text-[10px] mr-2">Info</span>
        Chaîne du froid impérative — <strong>expédition nationale non disponible</strong>. Retrait boutique ou livraison locale uniquement.
      </div>

      <section className="container-os section-y">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {ITEMS.map((it) => (
            <article key={it.slug} className="bg-white border border-border hover:border-gold/50 transition">
              <div className="aspect-[4/3] overflow-hidden bg-beige">
                <img src={it.image} alt={it.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-charbon/55">
                  <span>{it.format}</span>
                  <span className="font-price text-gold text-base normal-case tracking-normal">{it.price}€</span>
                </div>
                <h3 className="font-display text-2xl mt-2 leading-tight">{it.name}</h3>
                <p className="text-sm text-charbon/75 mt-1">{it.flavor}</p>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-charbon/75">
                  <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Portions</dt><dd>{it.serves}</dd></div>
                  <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Conservation</dt><dd>{it.conservation}</dd></div>
                  <div className="col-span-2"><dt className="text-charbon/50 text-xs uppercase tracking-wider">Température</dt><dd>{it.temperature}</dd></div>
                  <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Retrait boutique</dt><dd>Évry-Courcouronnes</dd></div>
                  <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Livraison locale</dt><dd>Île-de-France</dd></div>
                  <div className="col-span-2"><dt className="text-charbon/50 text-xs uppercase tracking-wider">Expédition nationale</dt><dd className="text-charbon/70">Non — produit frais</dd></div>
                  <div className="col-span-2"><dt className="text-charbon/50 text-xs uppercase tracking-wider">Allergènes</dt><dd>{it.allergens.join(", ")}.</dd></div>
                </dl>

                <a
                  href={`https://wa.me/33699466030?text=${encodeURIComponent(`Bonjour, je souhaite réserver : ${it.name} (retrait ou livraison locale).`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-gold w-full justify-center text-xs mt-5"
                >
                  Réserver
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
