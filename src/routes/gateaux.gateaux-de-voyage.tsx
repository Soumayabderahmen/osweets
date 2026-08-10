import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import catCakes from "@/assets/cat-cakes.jpg";
import cakeCitron from "@/assets/cake-citron.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import { breadcrumb, jsonLdScript, SITE } from "@/lib/seo";

type VoyageItem = {
  slug: string;
  name: string;
  format: string;
  flavor: string;
  weight: string;
  serves: string;
  servesMin: number;
  servesMax: number;
  flavorTags: string[];
  price: number;
  ingredients: string[];
  allergens: string[];
  conservation: string;
  shipping: boolean;
  prepTime: string;
  image: string;
  detailTo?: string;
};

const ITEMS: VoyageItem[] = [
  {
    slug: "cake-de-voyage",
    name: "Cake de voyage",
    format: "Cake entier",
    flavor: "5 parfums au choix",
    weight: "450 g",
    serves: "6 à 8 personnes",
    servesMin: 6,
    servesMax: 8,
    flavorTags: ["citron", "orange", "chocolat", "sorgho", "pistache"],
    price: 24,
    ingredients: ["Farine", "Beurre AOP", "Œufs frais", "Sucre", "Parfum au choix"],
    allergens: ["gluten", "œufs", "lactose"],
    conservation: "8 jours à température ambiante, dans son emballage d'origine.",
    shipping: true,
    prepTime: "Préparation sous 48 à 72h après commande.",
    image: cakeCitron,
    detailTo: "/gateaux/cake-de-voyage",
  },
  {
    slug: "quatre-quarts",
    name: "Quatre-quarts",
    format: "Cake entier",
    flavor: "Beurre AOP & vanille",
    weight: "500 g",
    serves: "6 à 8 personnes",
    servesMin: 6,
    servesMax: 8,
    flavorTags: ["vanille"],
    price: 20,
    ingredients: ["Farine", "Beurre AOP", "Œufs frais", "Sucre", "Vanille de Madagascar"],
    allergens: ["gluten", "œufs", "lactose"],
    conservation: "10 jours à température ambiante.",
    shipping: true,
    prepTime: "Préparation sous 48h.",
    image: cakeVanille,
  },
  {
    slug: "brownies",
    name: "Brownies",
    format: "Format carré 12 parts",
    flavor: "Chocolat noir 70% & noix de pécan",
    weight: "600 g",
    serves: "12 parts",
    servesMin: 8,
    servesMax: 12,
    flavorTags: ["chocolat"],
    price: 22,
    ingredients: ["Chocolat noir 70%", "Beurre", "Œufs", "Farine", "Noix de pécan"],
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
    conservation: "6 jours à température ambiante.",
    shipping: true,
    prepTime: "Préparation sous 48h.",
    image: cakeChocolat,
  },
  {
    slug: "russe-pistache",
    name: "Russe pistache",
    format: "Rectangle 6 parts",
    flavor: "Pistache de Sicile & praliné",
    weight: "550 g",
    serves: "6 personnes",
    servesMin: 4,
    servesMax: 6,
    flavorTags: ["pistache"],
    price: 32,
    ingredients: ["Meringue amande", "Crème mousseline pistache", "Praliné pistache"],
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
    conservation: "5 jours à température ambiante, à l'abri de l'humidité.",
    shipping: true,
    prepTime: "Préparation sous 72h.",
    image: cakePistache,
  },
];

export const Route = createFileRoute("/gateaux/gateaux-de-voyage")({
  head: () => ({
    meta: [
      { title: "Gâteaux de voyage | Ö' Sweets Pâtisserie" },
      {
        name: "description",
        content:
          "Cakes, quatre-quarts, brownies et russe pistache — des gâteaux de voyage qui se conservent et se partagent. Expédition possible.",
      },
      { property: "og:title", content: "Gâteaux de voyage | Ö' Sweets" },
      { property: "og:description", content: "Cakes, quatre-quarts, brownies, russe pistache — Ö' Sweets." },
      { property: "og:url", content: `${SITE.url}/gateaux/gateaux-de-voyage` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}/gateaux/gateaux-de-voyage` }],
    scripts: [
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Gâteaux", path: "/gateaux" },
          { name: "Gâteaux de voyage", path: "/gateaux/gateaux-de-voyage" },
        ]),
      ),
    ],
  }),
  component: Page,
});

const FLAVOR_FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "Tous les parfums" },
  { id: "citron", label: "Citron" },
  { id: "orange", label: "Orange" },
  { id: "chocolat", label: "Chocolat" },
  { id: "vanille", label: "Vanille" },
  { id: "pistache", label: "Pistache" },
  { id: "sorgho", label: "Sorgho / Droô" },
];

const GUEST_FILTERS: { id: string; label: string; value: number | null }[] = [
  { id: "all", label: "Toutes tailles", value: null },
  { id: "4", label: "4 personnes", value: 4 },
  { id: "6", label: "6 personnes", value: 6 },
  { id: "8", label: "8 personnes", value: 8 },
  { id: "12", label: "12 personnes", value: 12 },
];

function Page() {
  const [flavor, setFlavor] = useState("all");
  const [guests, setGuests] = useState<number | null>(null);

  const filtered = useMemo(
    () =>
      ITEMS.filter((it) => {
        const okFlavor = flavor === "all" || it.flavorTags.includes(flavor);
        const okGuests = guests === null || guests <= it.servesMax;
        return okFlavor && okGuests;
      }),
    [flavor, guests],
  );

  return (

    <div className="bg-ivory">
      <section className="relative h-[46vh] min-h-[360px] overflow-hidden">
        <img src={catCakes} alt="Gâteaux de voyage" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-black/70" />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center text-white px-6">
          <div className="text-[10px] tracking-[0.35em] uppercase text-gold">Nos gâteaux</div>
          <h1 className="font-display text-5xl md:text-6xl mt-4">Gâteaux de voyage</h1>
          <span className="mt-5 inline-block h-px w-16 bg-gold" />
          <p className="mt-5 max-w-xl text-white/90 font-light">
            Cakes, quatre-quarts, brownies, russe pistache — des douceurs qui se conservent, se transportent et se partagent.
          </p>
        </div>
      </section>

      <section className="container-os section-y">
        <div className="bg-white border border-border p-6 mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-charbon/55">Parfum</span>
            <div className="mt-3 flex flex-wrap gap-2">
              {FLAVOR_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFlavor(f.id)}
                  className={`px-3.5 py-2 text-xs uppercase tracking-wider border transition ${flavor === f.id ? "border-gold bg-gold text-white" : "border-border hover:border-gold/50"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:w-72">
            <label className="block">
              <span className="text-[10px] uppercase tracking-[0.25em] text-charbon/55">Nombre de personnes</span>
              <select
                value={guests === null ? "all" : String(guests)}
                onChange={(e) => setGuests(e.target.value === "all" ? null : Number(e.target.value))}
                className="mt-3 w-full bg-white border border-border px-4 py-2.5 text-sm"
              >
                {GUEST_FILTERS.map((g) => (
                  <option key={g.id} value={g.value === null ? "all" : String(g.value)}>{g.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="text-sm text-charbon/60 mb-6">
          {filtered.length} gâteau{filtered.length > 1 ? "x" : ""} correspond{filtered.length > 1 ? "ent" : ""} à votre sélection.
        </p>

        {filtered.length === 0 && (
          <div className="border border-border bg-white p-10 text-center">
            <p className="text-charbon/70">Aucun gâteau ne correspond à ces critères.</p>
            <button
              type="button"
              onClick={() => { setFlavor("all"); setGuests(null); }}
              className="btn btn-gold mt-5 text-xs"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map((it) => (

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
                  <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Poids</dt><dd>{it.weight}</dd></div>
                  <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Portions</dt><dd>{it.serves}</dd></div>
                  <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Expédition</dt><dd>{it.shipping ? "Oui, France entière" : "Non"}</dd></div>
                  <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Préparation</dt><dd>{it.prepTime}</dd></div>
                </dl>

                <details className="mt-4 group">
                  <summary className="cursor-pointer text-xs uppercase tracking-wider text-charbon/70 hover:text-gold">
                    Voir composition & conservation
                  </summary>
                  <div className="mt-3 space-y-2 text-sm text-charbon/75 border-t border-border pt-3">
                    <div><strong className="text-charbon">Ingrédients :</strong> {it.ingredients.join(", ")}.</div>
                    <div><strong className="text-charbon">Allergènes :</strong> {it.allergens.join(", ")}.</div>
                    <div><strong className="text-charbon">Conservation :</strong> {it.conservation}</div>
                  </div>
                </details>

                <div className="mt-5">
                  {it.detailTo ? (
                    <Link to={it.detailTo} className="btn btn-gold w-full justify-center text-xs">
                      Choisir mon parfum
                    </Link>
                  ) : (
                    <a
                      href={`https://wa.me/33699466030?text=${encodeURIComponent(`Bonjour, je souhaite commander : ${it.name}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-gold w-full justify-center text-xs"
                    >
                      Commander
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
