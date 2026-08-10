import { createFileRoute } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

type Bento = {
  slug: string;
  name: string;
  flavor: string;
  weight: string;
  serves: string;
  price: number;
  conservation: string;
  allergens: string[];
  delivery: string;
  image: string;
};

const ITEMS: Bento[] = [
  {
    slug: "bento-vanille-fraise",
    name: "Bento Cake Vanille & Fraise",
    flavor: "Vanille Bourbon & confit de fraise",
    weight: "≈ 250 g",
    serves: "1 à 2 personnes",
    price: 18,
    conservation: "24 h maximum entre 0 et 4°C.",
    allergens: ["gluten", "œufs", "lactose"],
    delivery: "Retrait boutique ou livraison locale",
    image: cakeVanille,
  },
  {
    slug: "bento-chocolat",
    name: "Bento Cake Chocolat",
    flavor: "Chocolat noir 70% & ganache",
    weight: "≈ 250 g",
    serves: "1 à 2 personnes",
    price: 18,
    conservation: "24 h maximum entre 0 et 4°C.",
    allergens: ["gluten", "œufs", "lactose"],
    delivery: "Retrait boutique ou livraison locale",
    image: cakeChocolat,
  },
  {
    slug: "bento-pistache",
    name: "Bento Cake Pistache",
    flavor: "Pistache de Sicile & framboise",
    weight: "≈ 260 g",
    serves: "1 à 2 personnes",
    price: 20,
    conservation: "24 h maximum entre 0 et 4°C.",
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
    delivery: "Retrait boutique ou livraison locale",
    image: cakePistache,
  },
];

export const Route = createFileRoute("/gateaux/bento")({
  head: () => ({
    meta: [
      { title: "Bento Cakes | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Bento cakes personnalisables — mini gâteaux à partager à deux, message et couleur au choix. Retrait ou livraison locale.",
      },
      { property: "og:title", content: "Bento Cakes | Ö' Sweets" },
      { property: "og:description", content: "Mini gâteaux personnalisables à partager." },
      { property: "og:url", content: `${SITE.url}/gateaux/bento` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/bento` }],
    scripts: [
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Gâteaux", path: "/gateaux" },
          { name: "Bento Cakes", path: "/gateaux/bento" },
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
        <img src={catCakes} alt="Bento Cakes" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold">Mini format</div>
          <h1 className="font-display text-5xl md:text-6xl mt-4">Bento Cakes</h1>
          <span className="mt-5 inline-block h-px w-16 bg-gold" />
          <p className="mt-5 max-w-xl text-white/90 font-light">
            Le petit gâteau à partager à deux — message et décor personnalisables.
          </p>
        </div>
      </section>

      <section className="container-os section-y">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {ITEMS.map((it) => (
            <article key={it.slug} className="bg-white border border-border hover:border-gold/50 transition">
              <div className="aspect-[4/3] overflow-hidden bg-beige">
                <img src={it.image} alt={it.name} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.22em] text-charbon/55">
                  <span>{it.weight}</span>
                  <span className="font-price text-gold text-base normal-case tracking-normal">{it.price}€</span>
                </div>
                <h3 className="font-display text-xl mt-2 leading-tight">{it.name}</h3>
                <p className="text-sm text-charbon/75 mt-1">{it.flavor}</p>
                <dl className="mt-4 space-y-2 text-sm text-charbon/75">
                  <div className="flex justify-between border-b border-border/60 pb-1"><dt className="text-charbon/60">Portions</dt><dd>{it.serves}</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Conservation</dt><dd>{it.conservation}</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Allergènes</dt><dd>{it.allergens.join(", ")}.</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Livraison</dt><dd>{it.delivery}</dd></div>
                </dl>

                <a
                  href={`https://wa.me/33699466030?text=${encodeURIComponent(`Bonjour, je souhaite commander : ${it.name}.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-gold w-full justify-center text-xs mt-5"
                >
                  Commander
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
