import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import cakeCitron from "@/assets/cake-citron.jpg";
import cakeChocolat from "@/assets/cake-chocolat.jpg";
import cakePistache from "@/assets/cake-pistache.jpg";
import cakeVanille from "@/assets/cake-vanille.jpg";
import cakeNoisette from "@/assets/cake-noisette.jpg";
import { breadcrumb, jsonLdScript, SITE, absUrl } from "@/lib/seo";

type Flavor = {
  id: string;
  label: string;
  desc: string;
  image: string;
  ingredients: string[];
  allergens: string[];
};

const FLAVORS: Flavor[] = [
  {
    id: "citron",
    label: "Citron",
    desc: "Zestes de citron bio, moelleux acidulé, glaçage citron.",
    image: cakeCitron,
    ingredients: ["Farine", "Beurre AOP", "Œufs", "Sucre", "Citron bio", "Sucre glace"],
    allergens: ["gluten", "œufs", "lactose"],
  },
  {
    id: "orange",
    label: "Orange",
    desc: "Orange confite, notes de fleur d'oranger, texture fondante.",
    image: cakeCitron,
    ingredients: ["Farine", "Beurre AOP", "Œufs", "Sucre", "Orange confite", "Fleur d'oranger"],
    allergens: ["gluten", "œufs", "lactose"],
  },
  {
    id: "chocolat",
    label: "Chocolat",
    desc: "Chocolat noir 70%, intense, cœur fondant.",
    image: cakeChocolat,
    ingredients: ["Chocolat noir 70%", "Beurre AOP", "Œufs", "Farine", "Sucre"],
    allergens: ["gluten", "œufs", "lactose"],
  },
  {
    id: "sorgho",
    label: "Sorgho / Droô",
    desc: "Farine de sorgho torréfié, notes maltées, hommage à la tradition tunisienne.",
    image: cakeVanille,
    ingredients: ["Farine de sorgho (droô)", "Beurre", "Œufs", "Sucre", "Cannelle"],
    allergens: ["gluten", "œufs", "lactose"],
  },
  {
    id: "pistache",
    label: "Pistache",
    desc: "Pistache de Sicile, moelleux généreux, éclats de pistache.",
    image: cakePistache,
    ingredients: ["Pistache de Sicile", "Beurre AOP", "Œufs", "Farine", "Sucre"],
    allergens: ["gluten", "œufs", "lactose", "fruits à coque"],
  },
];

const PATH = "/gateaux/cake-de-voyage";
const PRICE = 24;

export const Route = createFileRoute("/gateaux/cake-de-voyage")({
  head: () => ({
    meta: [
      { title: "Cake de voyage — 5 parfums au choix | Ö' Sweets" },
      {
        name: "description",
        content:
          "Notre cake de voyage signature, décliné en 5 parfums : citron, orange, chocolat, sorgho/droô, pistache. Expédition France entière.",
      },
      { property: "og:title", content: "Cake de voyage | Ö' Sweets" },
      { property: "og:description", content: "5 parfums : citron, orange, chocolat, sorgho/droô, pistache." },
      { property: "og:image", content: absUrl(cakeCitron) },
      { property: "og:type", content: "product" },
      { property: "og:url", content: absUrl(PATH) },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: absUrl(cakeCitron) },
    ],
    links: [{ rel: "canonical", href: `${SITE.url}${PATH}` }],
    scripts: [
      jsonLdScript(
        breadcrumb([
          { name: "Accueil", path: "/" },
          { name: "Gâteaux", path: "/gateaux" },
          { name: "Gâteaux de voyage", path: "/gateaux/gateaux-de-voyage" },
          { name: "Cake de voyage", path: PATH },
        ]),
      ),
    ],
  }),
  component: Page,
});

function Page() {
  const [flavorId, setFlavorId] = useState<string>(FLAVORS[0].id);
  const flavor = FLAVORS.find((f) => f.id === flavorId)!;

  return (
    <div className="bg-ivory">
      <section className="container-os section-y">
        <nav className="text-xs uppercase tracking-[0.22em] text-charbon/55 mb-8">
          <Link to="/gateaux" className="hover:text-gold">Gâteaux</Link>
          <span className="mx-2">/</span>
          <Link to="/gateaux/gateaux-de-voyage" className="hover:text-gold">Gâteaux de voyage</Link>
          <span className="mx-2">/</span>
          <span className="text-charbon">Cake de voyage</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="aspect-square overflow-hidden bg-beige">
            <img src={flavor.image} alt={`Cake de voyage ${flavor.label}`} className="h-full w-full object-cover transition duration-700" />
          </div>

          <div>
            <div className="text-[10px] tracking-[0.35em] uppercase text-gold">Signature</div>
            <h1 className="font-display text-4xl md:text-5xl mt-3">Cake de voyage</h1>
            <p className="mt-4 text-charbon/75 font-light leading-relaxed">
              Notre cake signature façonné à la main, décliné en cinq parfums. Un moelleux généreux qui se conserve et voyage.
            </p>

            <div className="mt-6 font-price text-gold text-3xl">{PRICE}€</div>

            <fieldset className="mt-8">
              <legend className="text-xs uppercase tracking-[0.22em] text-charbon/60 mb-3">Choisir mon parfum</legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {FLAVORS.map((f) => (
                  <label
                    key={f.id}
                    className={`flex items-start gap-3 border p-4 cursor-pointer transition ${
                      flavorId === f.id ? "border-gold bg-gold/5" : "border-border hover:border-gold/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="flavor"
                      value={f.id}
                      checked={flavorId === f.id}
                      onChange={() => setFlavorId(f.id)}
                      className="mt-1 accent-[color:var(--color-gold,#C8943E)]"
                    />
                    <span>
                      <span className="block font-display text-base">{f.label}</span>
                      <span className="block text-xs text-charbon/60 mt-1">{f.desc}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-charbon/80 border-t border-border pt-6">
              <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Format</dt><dd>Cake entier</dd></div>
              <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Poids</dt><dd>450 g</dd></div>
              <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Portions</dt><dd>6 à 8 personnes</dd></div>
              <div><dt className="text-charbon/50 text-xs uppercase tracking-wider">Expédition</dt><dd>Oui, France entière</dd></div>
              <div className="col-span-2"><dt className="text-charbon/50 text-xs uppercase tracking-wider">Préparation</dt><dd>Sous 48 à 72h après validation de commande.</dd></div>
              <div className="col-span-2"><dt className="text-charbon/50 text-xs uppercase tracking-wider">Conservation</dt><dd>8 jours à température ambiante, dans son emballage d'origine.</dd></div>
              <div className="col-span-2"><dt className="text-charbon/50 text-xs uppercase tracking-wider">Ingrédients</dt><dd>{flavor.ingredients.join(", ")}.</dd></div>
              <div className="col-span-2"><dt className="text-charbon/50 text-xs uppercase tracking-wider">Allergènes</dt><dd>{flavor.allergens.join(", ")}.</dd></div>
            </dl>

            <a
              href={`https://wa.me/33699466030?text=${encodeURIComponent(`Bonjour, je souhaite commander un Cake de voyage — parfum ${flavor.label}.`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-gold w-full justify-center mt-8"
            >
              Commander — {flavor.label}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
