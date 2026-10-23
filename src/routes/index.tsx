import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Hand,
  Leaf,
  Lock,
  Package,
  MapPin,
  ChevronRight,
  ArrowRight,
  ArrowUpRight,
  Instagram,
  Send,
} from "lucide-react";
import { FULFILLMENT_LABELS } from "@/lib/fulfillment";
import { useShopSettings } from "@/components/layout/HolidayBanner";
import hero from "@/assets/hero-plateau-signature.jpg";
import catKaak from "@/assets/cat-kaak.jpg";
import catPat from "@/assets/cat-patisserie.jpg";
import catCakes from "@/assets/cat-cakes.jpg";
import catCoff from "@/assets/cat-coffrets.jpg";
import catSale from "@/assets/cat-sale.jpg";
import composerHero from "@/assets/composer-hero.jpg";
import weddingHero from "@/assets/wedding-buffet.jpg";
import { giftCategories } from "@/data/products";
import { useCatalog } from "@/lib/catalog";
import { isPatisserieTunisienne, isPublished } from "@/lib/patisserie";
import { productBlockReason } from "@/lib/product-rules";
import { ProductCard } from "@/components/ProductCard";
import { ImmersiveCard } from "@/components/ImmersiveCard";
import { Reveal } from "@/components/Reveal";
import { bakery, jsonLdScript, SITE } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ö' Sweets Pâtisserie Tunisienne | Évry-Courcouronnes" },
      {
        name: "description",
        content:
          "Pâtisserie tunisienne artisanale, sublimée à la française. Kaak Warka, Baklawa, gâteaux de voyage, coffrets et wedding cakes. Livraison France entière.",
      },
      { property: "og:title", content: "Ö' Sweets Pâtisserie Tunisienne | Évry-Courcouronnes" },
      {
        property: "og:description",
        content:
          "Pâtisserie tunisienne artisanale, sublimée à la française. Kaak Warka, Baklawa, gâteaux de voyage, coffrets et wedding cakes. Livraison France entière.",
      },
      { property: "og:url", content: SITE.url },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE.url }],
    scripts: [jsonLdScript(bakery())],
  }),
  component: Home,
});

/**
 * Les raccourcis de l'accueil.
 *
 * Le premier vise une fiche précise. Une fiche vit en base : si le
 * back-office l'archive, ou si la base ne répond pas, ce raccourci mènerait
 * à une page 404. Il n'est donc affiché que si le produit existe vraiment —
 * voir `raccourcis()` plus bas. Les autres visent des rubriques, qui ne
 * disparaissent pas.
 */
const cats = [
  { img: catKaak, name: "Kaak Warka", to: "/produits/kaak-warka", slug: "kaak-warka" },
  { img: catPat, name: "Pâtisseries", to: "/patisserie" },
  { img: catCakes, name: "Gâteaux", to: "/gateaux" },
  { img: catCoff, name: "Coffrets", to: "/composer" },
  { img: catSale, name: "Salé", to: "/sale" },
  { img: weddingHero, name: "Événements", to: "/evenements" },
];

const igPhotos = [catKaak, catPat, catCakes, catCoff, catSale, hero, composerHero, weddingHero];

function Home() {
  // Les mises en avant se pilotent depuis le back-office : la pastille d'une
  // fiche décide, plus une liste figée dans le code.
  const catalogue = useCatalog();
  const reglages = useShopSettings();
  // Un raccourci vers une fiche ne s'affiche que si la fiche existe.
  const raccourcis = cats.filter((c) => !c.slug || catalogue.some((p) => p.slug === c.slug));
  /*
   * La maison est d'abord une pâtisserie tunisienne : ses meilleures ventes
   * passent devant les cakes et l'épicerie, qui complètent la sélection.
   * Une fiche « Tarif à venir » n'est jamais mise en avant — on ne vante pas
   * ce qu'on ne peut pas commander.
   */
  const misesEnAvant = catalogue.filter(
    (p) =>
      (p.badge === "bestseller" || p.badge === "nouveau") &&
      isPublished(p) &&
      productBlockReason(p) !== "no_price",
  );
  const bestSellers = [
    ...misesEnAvant.filter(isPatisserieTunisienne),
    ...misesEnAvant.filter((p) => !isPatisserieTunisienne(p)),
  ].slice(0, 6);
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "success" | "error">("idle");

  return (
    <div className="fade-in-up">
      {/* HERO — split-screen : texte sur ivoire à gauche, photo plein cadre à droite */}
      <section className="relative grid min-h-[88vh] overflow-hidden lg:grid-cols-2">
        <div className="order-2 flex items-center bg-ivory px-6 py-16 sm:px-10 lg:order-1 lg:px-16 lg:py-0">
          <div className="max-w-lg">
            <div className="mb-6 flex items-center gap-3 text-gold">
              <span className="h-px w-10 bg-gold" />
              <span className="text-[11px] font-medium uppercase tracking-[0.3em]">
                Maison Ö' Sweets · Depuis 2020
              </span>
            </div>
            <h1 className="text-balance font-display text-5xl font-normal leading-[1.02] text-charbon md:text-6xl lg:text-7xl">
              L'art tunisien,
              <br />
              <em className="italic font-light text-gold">sublimé.</em>
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-charbon-soft">
              Une maison parisienne d'inspiration tunisienne. Chaque pièce, façonnée à la main, avec
              des ingrédients d'exception.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link to="/patisserie" className="btn btn-gold">
                Découvrir la boutique
              </Link>
              <Link to="/sur-mesure" className="btn btn-outline-gold">
                Commande sur mesure
              </Link>
            </div>
          </div>
        </div>
        <div className="relative order-1 min-h-[44vh] bg-sable lg:order-2 lg:min-h-full">
          <img
            src={hero}
            alt="Pâtisseries tunisiennes"
            width={1920}
            height={1280}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charbon/20 to-transparent lg:hidden" />
        </div>
        <div className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-charbon-soft/70 lg:flex">
          <span className="text-[10px] uppercase tracking-[0.3em]">Défiler</span>
          <span className="animate-bounce text-lg leading-none">▼</span>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-beige bg-sand/50">
        <div className="container-os grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {[
            /*
             * Cinq promesses lues comme des engagements.
             *
             * « Paiement sécurisé — Stripe · PayPal » n'était tenu par rien :
             * aucun paiement en ligne n'existe, les commandes partent par
             * message. Et « Expédié en 24-48h » contredisait le délai
             * annoncé sur chaque fiche. Les deux lignes de livraison
             * reprennent maintenant les Réglages, mot pour mot.
             */
            { Icon: Hand, t: "Fait main", s: "Façonné à la commande" },
            { Icon: Leaf, t: "Ingrédients frais", s: "Sélection d'exception" },
            { Icon: Lock, t: "Commande confirmée", s: "Avant toute préparation" },
            { Icon: Package, t: "Livraison France", s: reglages.shippingDelay },
            { Icon: MapPin, t: FULFILLMENT_LABELS.pickup, s: reglages.pickupDelay },
          ].map(({ Icon, t, s }, i) => (
            <div
              key={t}
              className={`flex items-center gap-3 px-2 py-6 md:py-7 ${i % 2 === 1 ? "border-l border-beige" : ""} ${i > 0 ? "lg:border-l lg:border-beige" : ""}`}
            >
              <Icon className="h-5 w-5 shrink-0 text-gold" strokeWidth={1.5} />
              <div>
                <div className="text-sm font-medium leading-tight text-charbon">{t}</div>
                <div className="mt-0.5 text-xs text-charbon-soft">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HÉRITAGE — grille asymétrique, sans cadre ni ornements */}
      <section className="section-y-lg bg-ivory">
        <div className="container-os grid gap-10 lg:grid-cols-12 lg:gap-20">
          <Reveal className="lg:col-span-5">
            <div className="eyebrow">Notre héritage</div>
            <h2 className="text-balance mt-5 font-display text-4xl leading-[1.08] text-charbon md:text-5xl">
              La tradition tunisienne,
              <br />
              <span className="italic">rencontrée par l'élégance française.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col justify-end lg:col-span-6 lg:col-start-7">
            <p className="max-w-xl text-lg leading-[1.8] text-charbon-soft">
              Chaque pièce est façonnée à la main dans notre atelier d'Évry-Courcouronnes, inspirée
              des recettes de nos aînées et affinée avec la rigueur du geste pâtissier français.
            </p>
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-beige pt-8">
              {[
                { n: "01", t: "Savoir-faire" },
                { n: "02", t: "Matières nobles" },
                { n: "03", t: "Fait main" },
              ].map(({ n, t }) => (
                <div key={n}>
                  <div className="font-display text-3xl text-gold">{n}</div>
                  <div className="mt-2 text-xs uppercase tracking-[0.15em] text-charbon-soft">
                    {t}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>
      {/* NOS COLLECTIONS */}
      <section className="bg-sand/40 py-24 lg:py-32">
        <div className="container-os mb-14 flex items-end justify-between gap-6">
          <div>
            <div className="eyebrow mb-4">Nos collections</div>
            <h2 className="font-display text-4xl text-charbon md:text-5xl">L'univers Ö' Sweets</h2>
          </div>
          <span className="hidden shrink-0 text-xs tracking-wide text-charbon-soft sm:block">
            {String(cats.length).padStart(2, "0")}
          </span>
        </div>
        <div className="container-os grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {raccourcis.map((c, i) => (
            <Reveal key={c.name} delay={(i % 3) * 0.06}>
              <Link to={c.to} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-beige">
                  {c.img ? (
                    <img
                      src={c.img}
                      alt={c.name}
                      loading="lazy"
                      width={800}
                      height={1000}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full select-none items-center justify-center bg-gradient-to-br from-sand to-beige">
                      <span className="font-display text-8xl text-gold/30">Ö</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-charbon/45 via-transparent to-transparent" />
                  <span className="absolute left-5 top-5 font-display text-lg text-ivory/90">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <ArrowUpRight className="absolute right-5 top-5 h-5 w-5 -translate-y-1 text-ivory opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <h3 className="font-display text-2xl text-ivory">{c.name}</h3>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* BEST SELLERS — fond ivoire : base44 alterne sable / ivoire, jamais deux sable de suite */}
      <section className="section-y bg-ivory">
        <div className="container-os">
          <div className="mb-14 flex items-end justify-between gap-6">
            <div>
              <div className="eyebrow mb-4">Sélection signature</div>
              <h2 className="font-display text-4xl md:text-5xl">Nos meilleures ventes</h2>
            </div>
            <Link
              to="/patisserie"
              className="hidden items-center gap-2 text-xs uppercase tracking-[0.18em] text-charbon transition-colors hover:text-gold sm:inline-flex"
            >
              Voir toute la boutique <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-3">
            {bestSellers.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          <div className="mt-14 text-center sm:hidden">
            <Link to="/patisserie" className="btn btn-outline-gold">
              Voir toute la boutique <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* COFFRETS — presets + composer CTA (fond sombre) */}
      <section className="scroll-mt-32 bg-charbon py-24 text-ivory lg:py-32">
        <div className="container-os">
          <div className="mb-14 max-w-2xl">
            <div className="eyebrow mb-4">L'art du coffret</div>
            <h2 className="font-display text-4xl leading-tight text-ivory md:text-5xl">
              Nos Coffrets Signature
            </h2>
            <p className="mt-5 max-w-xl font-light text-ivory/70">
              Six formats pensés pour chaque occasion — ou composez le vôtre, pièce par pièce.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-6">
            {[
              { name: "Dégustation", pieces: 6, price: 21, tag: "Petit format" },
              { name: "Découverte", pieces: 12, price: 42, tag: "Le plus offert" },
              { name: "Partage", pieces: 18, price: 68, tag: "À partager" },
              { name: "Prestige", pieces: 24, price: 92, tag: "Signature" },
              { name: "Réception", pieces: 36, price: 141, tag: "Réceptions" },
              { name: "Royal", pieces: 48, price: 183, tag: "Grand format" },
            ].map((c, i) => (
              <Reveal key={c.name} delay={(i % 3) * 0.06}>
                <Link
                  to="/composer"
                  search={{ size: String(c.pieces) as "6" | "12" | "18" | "24" | "36" | "48" }}
                  className="group block overflow-hidden rounded-2xl border border-ivory/10 bg-charbon/60 transition-colors hover:border-gold/60"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={composerHero}
                      alt={`Coffret ${c.name}`}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-70 transition-all duration-700 group-hover:scale-105 group-hover:opacity-90"
                    />
                    <div className="absolute inset-0 bg-charbon/40" />
                    <div className="absolute left-4 top-4 text-[10px] uppercase tracking-[0.2em] text-gold">
                      {c.tag}
                    </div>
                    <div className="absolute bottom-4 right-4 font-display text-lg text-ivory">
                      {c.pieces} pièces
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-5">
                    <div>
                      <div className="font-display text-xl text-ivory">Coffret {c.name}</div>
                      <div className="mt-1 text-sm text-gold">dès {c.price} €</div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-ivory/60 transition-all group-hover:translate-x-1 group-hover:text-gold" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/composer" className="btn bg-gold text-charbon hover:bg-ivory">
              Composez votre coffret <ChevronRight className="h-4 w-4" />
            </Link>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ivory/50">
              Sur mesure · 6 à 48 pièces
            </p>
          </div>
        </div>
      </section>

      {/* GIFTS BY OCCASION */}
      <section className="section-y bg-ivory">
        <div className="container-os">
          <div className="mb-14 flex items-end justify-between gap-6">
            <div>
              <div className="eyebrow mb-4">Pour chaque occasion</div>
              <h2 className="font-display text-4xl md:text-5xl">L'Art d'Offrir</h2>
            </div>
            <Link
              to="/cadeaux"
              className="hidden items-center gap-2 text-xs uppercase tracking-[0.18em] text-charbon transition-colors hover:text-gold sm:inline-flex"
            >
              Tous les cadeaux <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3">
            {giftCategories.slice(0, 6).map((g, i) => (
              <Reveal key={g.slug} delay={(i % 3) * 0.06}>
                <ImmersiveCard
                  to="/cadeaux/$slug"
                  params={{ slug: g.slug }}
                  image={g.image}
                  title={g.label}
                  ratio="square"
                  rounded="2xl"
                  overlay="bottom-left"
                />
              </Reveal>
            ))}
          </div>
          <div className="mt-14 text-center sm:hidden">
            <Link to="/cadeaux" className="btn btn-outline-gold">
              Tous les cadeaux <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* MARIAGE */}
      <section className="container-os scroll-mt-32 pb-24 lg:pb-32">
        <Reveal>
          <div className="relative flex min-h-[60vh] items-end overflow-hidden rounded-3xl">
            <img
              src={weddingHero}
              alt="Buffet mariage"
              loading="lazy"
              width={1920}
              height={1024}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charbon/80 via-charbon/20 to-transparent" />
            <div className="relative max-w-2xl p-8 text-white md:p-14 lg:p-20">
              <div className="mb-5 text-[11px] uppercase tracking-[0.3em] text-gold">
                Vos plus beaux jours
              </div>
              <h2 className="text-balance font-display text-4xl leading-[1.05] text-ivory md:text-5xl lg:text-6xl">
                Pour le plus beau jour <span className="italic">de votre vie</span>
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-ivory/80">
                Pièces montées et buffets de pâtisseries orientales sur mesure pour mariages,
                fiançailles et événements d'exception.
              </p>
              <Link
                to="/evenements/mariage"
                className="btn group mt-9 inline-flex bg-gold text-charbon hover:bg-ivory"
              >
                Voir nos packs mariage{" "}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* INSTAGRAM */}
      <section className="bg-sand/40 py-24 lg:py-32">
        <div className="container-os text-center">
          <div className="eyebrow">@osweet_patisserie</div>
          <h2 className="font-display text-4xl md:text-5xl mt-5">Suivez nos créations</h2>
          <p className="mt-5 text-charbon-soft max-w-md mx-auto">
            Les dernières créations sorties de l'atelier, en temps réel.
          </p>
        </div>
        {/* Static grid — ready to be wired to Instagram Basic Display API
            when a long-lived token is provided. Fetch /me/media and map src urls. */}
        <div className="container-os mt-12 grid grid-cols-4 lg:grid-cols-8 gap-2 lg:gap-3">
          {igPhotos.map((img, i) => (
            <Reveal key={i} delay={(i % 8) * 0.04}>
              <a
                href="https://www.instagram.com/osweet_patisserie/"
                target="_blank"
                rel="noreferrer"
                className="group block relative aspect-square overflow-hidden rounded-xl bg-beige"
              >
                <img
                  src={img}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-charbon/0 transition-colors group-hover:bg-charbon/40">
                  <Instagram className="h-5 w-5 text-ivory opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </a>
            </Reveal>
          ))}
        </div>
        <div className="text-center mt-12">
          <a
            href="https://www.instagram.com/osweet_patisserie/"
            target="_blank"
            rel="noreferrer"
            className="btn btn-outline-gold"
          >
            <Instagram className="h-4 w-4" /> Suivre @osweet_patisserie
          </a>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-ivory py-24 lg:py-32">
        <div className="container-os mx-auto max-w-2xl text-center">
          <div className="eyebrow mb-4">Newsletter</div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight text-charbon">
            Recevez nos créations en avant-première
          </h2>
          <p className="mt-5 text-charbon-soft leading-relaxed">
            Nouvelles collections, créations saisonnières, offres exclusives.
          </p>
          {newsletterStatus === "success" ? (
            <p className="mt-8 text-sm text-gold">Merci ! Inscription enregistrée.</p>
          ) : (
            <form
              className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                const email = new FormData(e.currentTarget).get("email");
                if (typeof email !== "string" || !email.includes("@")) {
                  setNewsletterStatus("error");
                  return;
                }
                setNewsletterStatus("success");
              }}
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Adresse email
              </label>
              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                placeholder="Votre email"
                className="h-12 flex-1 rounded-full border border-beige bg-sand px-5 text-sm text-charbon placeholder:text-charbon-soft outline-none focus:border-gold"
              />
              <button
                type="submit"
                className="btn bg-charbon text-ivory hover:bg-gold disabled:opacity-50"
              >
                S'inscrire <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          )}
          {newsletterStatus === "error" && (
            <p className="mt-4 text-xs text-destructive">
              Merci de renseigner une adresse email valide.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
