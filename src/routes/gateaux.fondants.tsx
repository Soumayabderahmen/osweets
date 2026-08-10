import { createFileRoute } from "@tanstack/react-router";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakeCitron from "@/assets/cake-citron.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeNoisette from "@/assets/cake-noisette.jpg";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

type Fondant = {
  slug: string;
  name: string;
  flavor: string;
  weight: string;
  price: number;
  minQty: number;
  conservation: string;
  allergens: string[];
  delivery: string;
  image: string;
};

const ITEMS: Fondant[] = [
  {
    slug: "fondant-chocolat",
    name: "Fondant chocolat individuel",
    flavor: "Chocolat noir 70%, cœur coulant",
    weight: "90 g / pièce",
    price: 5.5,
    minQty: 4,
    conservation: "3 jours à température ambiante — se réchauffe 20 s au four.",
    allergens: ["gluten", "œufs", "lactose"],
    delivery: "Retrait, livraison locale ou expédition France entière",
    image: cakeChocolat,
  },
  {
    slug: "fondant-pistache",
    name: "Fondant pistache individuel",
    flavor: "Pistache de Sicile, cœur pistache",
    weight: "90 g / pièce",
    price: 6,
    minQty: 4,
    conservation: "3 jours à température ambiante.",
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
    delivery: "Retrait, livraison locale ou expédition France entière",
    image: cakePistache,
  },
  {
    slug: "fondant-citron",
    name: "Fondant citron individuel",
    flavor: "Citron bio, cœur curd citron",
    weight: "85 g / pièce",
    price: 5.5,
    minQty: 4,
    conservation: "3 jours à température ambiante.",
    allergens: ["gluten", "œufs", "lactose"],
    delivery: "Retrait, livraison locale ou expédition France entière",
    image: cakeCitron,
  },
  {
    slug: "fondant-noisette",
    name: "Fondant noisette individuel",
    flavor: "Noisette du Piémont, cœur praliné",
    weight: "90 g / pièce",
    price: 6,
    minQty: 4,
    conservation: "4 jours à température ambiante.",
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
    delivery: "Retrait, livraison locale ou expédition France entière",
    image: cakeNoisette,
  },
];

export const Route = createFileRoute("/gateaux/fondants")({
  head: () => ({
    meta: [
      { title: "Fondants individuels | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Fondants individuels chocolat, pistache, citron, noisette. Cœur coulant, à partager. Commande minimum 4 pièces.",
      },
      { property: "og:title", content: "Fondants individuels | Ö' Sweets" },
      { property: "og:description", content: "Fondants individuels — chocolat, pistache, citron, noisette." },
      { property: "og:url", content: `${SITE.url}/gateaux/fondants` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/fondants` }],
    scripts: [
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Gâteaux", path: "/gateaux" },
          { name: "Fondants individuels", path: "/gateaux/fondants" },
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
        <img src={catCakes} alt="Fondants individuels" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold">Format individuel</div>
          <h1 className="font-display text-5xl md:text-6xl mt-4">Fondants individuels</h1>
          <span className="mt-5 inline-block h-px w-16 bg-gold" />
          <p className="mt-5 max-w-xl text-white/90 font-light">
            Cœur coulant, texture fondante — à partager, à emporter.
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
                  <span className="font-price text-gold text-base normal-case tracking-normal">{it.price}€ / pièce</span>
                </div>
                <h3 className="font-display text-xl mt-2 leading-tight">{it.name}</h3>
                <p className="text-sm text-charbon/75 mt-1">{it.flavor}</p>

                <dl className="mt-4 space-y-2 text-sm text-charbon/75">
                  <div className="flex justify-between border-b border-border/60 pb-1"><dt className="text-charbon/60">Quantité minimum</dt><dd>{it.minQty} pièces</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Conservation</dt><dd>{it.conservation}</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Allergènes</dt><dd>{it.allergens.join(", ")}.</dd></div>
                  <div><dt className="text-charbon/60 text-xs uppercase tracking-wider">Livraison</dt><dd>{it.delivery}</dd></div>
                </dl>

                <a
                  href={`https://wa.me/33699466030?text=${encodeURIComponent(`Bonjour, je souhaite commander : ${it.name} (min. ${it.minQty} pièces).`)}`}
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
