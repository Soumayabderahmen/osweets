import { createFileRoute, Link } from "@tanstack/react-router";
import { Hand, Leaf, Lock, Package, ChevronRight, Instagram } from "lucide-react";
import hero from "@/assets/hero-platter.jpg";
import catKaak from "@/assets/cat-kaak.jpg";
import catPat from "@/assets/cat-patisserie.jpg";
import catCakes from "@/assets/cat-cakes.jpg";
import catCoff from "@/assets/cat-coffrets.jpg";
import catSale from "@/assets/cat-sale.jpg";
import composerHero from "@/assets/composer-hero.jpg";
import weddingHero from "@/assets/wedding-buffet.jpg";
import { products, giftCategories } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { ImmersiveCard } from "@/components/ImmersiveCard";
import { bakery, jsonLdScript, SITE } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ö' Sweets Pâtisserie Tunisienne | Évry-Courcouronnes" },
      { name: "description", content: "Pâtisserie tunisienne artisanale, sublimée à la française. Kaak Warka, Baklawa, gâteaux de voyage, coffrets et wedding cakes. Livraison France entière." },
      { property: "og:title", content: "Ö' Sweets Pâtisserie Tunisienne | Évry-Courcouronnes" },
      { property: "og:description", content: "Pâtisserie tunisienne artisanale, sublimée à la française. Kaak Warka, Baklawa, gâteaux de voyage, coffrets et wedding cakes. Livraison France entière." },
      { property: "og:url", content: SITE.url },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE.url }],
    scripts: [jsonLdScript(bakery())],
  }),
  component: Home,
});

const cats = [
  { img: catKaak, name: "Kaak Warka", to: "/produits/kaak-warka" },
  { img: catPat, name: "Pâtisseries", to: "/patisserie" },
  { img: catCakes, name: "Gâteaux", to: "/gateaux" },
  { img: catCoff, name: "Coffrets", to: "/composer" },
  { img: catSale, name: "Salé", to: "/sale" },
  { img: weddingHero, name: "Événements", to: "/evenements" },
];

const igPhotos = [catKaak, catPat, catCakes, catCoff, catSale, hero, composerHero, weddingHero];

function Home() {
  const bestSellers = products.filter((p) => p.badge === "bestseller" || p.badge === "nouveau").slice(0, 6);

  return (
    <div className="fade-in-up">
      {/* HERO — fully immersive, minimal */}
      <section className="relative h-screen min-h-[700px] flex items-end overflow-hidden mosaic-bg">
        <img src={hero} alt="Pâtisseries tunisiennes" width={1920} height={1280} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/85" />
        <div className="relative z-10 container-os pb-24 md:pb-32">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 text-gold mb-8">
              <span className="h-px w-12 bg-gold" />
              <span className="text-[10px] tracking-[0.4em] uppercase font-medium">Maison Ö' Sweets · Depuis 2020</span>
            </div>
            <h1
              className="font-display text-white font-normal leading-[0.95] text-[clamp(3rem,9vw,8rem)]"
              style={{ textShadow: "0 4px 40px rgba(0,0,0,0.4)" }}
            >
              L'art tunisien,
              <br />
              <em className="italic text-gold font-light">sublimé.</em>
            </h1>
            <p className="mt-10 text-lg md:text-xl max-w-xl text-white/90 font-light leading-relaxed" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}>
              Une maison parisienne d'inspiration tunisienne. Chaque pièce, façonnée à la main, avec des ingrédients d'exception.
            </p>
            <div className="mt-12 flex flex-col sm:flex-row gap-4">
              <Link to="/patisserie" className="btn btn-gold">Découvrir la boutique</Link>
              <Link to="/sur-mesure" className="btn btn-outline-white">Commande sur mesure</Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 text-[10px] tracking-[0.4em] uppercase animate-pulse">
          ▼ Défiler
        </div>
      </section>

      {/* Trust badges */}
      <section className="bg-ivory border-b border-border">
        <div className="container-os grid grid-cols-2 md:grid-cols-4 gap-6 py-12 text-center">
          {[
            { Icon: Hand, t: "Fait main", s: "Façonné à la commande" },
            { Icon: Leaf, t: "Ingrédients frais", s: "Sélection d'exception" },
            { Icon: Lock, t: "Paiement sécurisé", s: "Stripe · PayPal" },
            { Icon: Package, t: "Livraison France", s: "Expédié en 24-48h" },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="flex flex-col items-center">
              <Icon className="h-7 w-7 text-gold mb-3" />
              <div className="font-display text-base">{t}</div>
              <div className="text-xs text-charbon/60 mt-1">{s}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HÉRITAGE — editorial band, restrained */}
      <section className="relative bg-beige mosaic-bg py-16 md:py-20">
        <div className="container-os">
          <div className="relative mx-auto max-w-3xl bg-ivory p-8 md:p-12 text-center">
            <div aria-hidden className="pointer-events-none absolute inset-2 border border-gold/60" />
            <div aria-hidden className="pointer-events-none absolute inset-[14px] border border-gold/25" />
            {/* 4 corner ornaments */}
            {[
              "top-2 left-2",
              "top-2 right-2 rotate-90",
              "bottom-2 left-2 -rotate-90",
              "bottom-2 right-2 rotate-180",
            ].map((c) => (
              <svg key={c} viewBox="0 0 40 40" aria-hidden className={`absolute h-8 w-8 text-gold ${c}`} fill="none" stroke="currentColor">
                <path d="M2 18 V4 H18" strokeWidth="1.2" />
                <path d="M6 14 V8 H14" strokeWidth="0.7" />
                <path d="M8 8 L13 13" strokeWidth="0.6" />
              </svg>
            ))}
            <div className="relative">
              <div className="eyebrow">Notre héritage</div>
              <h2 className="font-display text-3xl md:text-4xl mt-3 text-charbon">
                La tradition tunisienne,<br />
                <em className="italic text-gold font-light">rencontrée par l'élégance française.</em>
              </h2>
              <div className="mt-5 flex items-center justify-center gap-3 text-gold">
                <span className="h-px w-10 bg-gold/50" />
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden>
                  <rect x="6" y="6" width="12" height="12" />
                  <rect x="6" y="6" width="12" height="12" transform="rotate(45 12 12)" />
                </svg>
                <span className="h-px w-10 bg-gold/50" />
              </div>
              <p className="mt-6 text-charbon/75 leading-relaxed font-light">
                Chaque pièce est façonnée à la main dans notre atelier d'Évry-Courcouronnes,
                inspirée des recettes de nos aînées et affinée avec la rigueur du geste pâtissier français.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="section-y bg-ivory">
        <div className="container-os text-center">
          <div className="eyebrow">Nos collections</div>
          <h2 className="font-display text-3xl md:text-5xl mt-3">L'univers Ö' Sweets</h2>
          <div className="mt-4 mx-auto"><span className="divider-gold" /></div>
        </div>
        <div className="container-os mt-14 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {cats.map((c) => (
            <Link key={c.name} to={c.to} className="group block hover-lift">
              <div className="relative aspect-square overflow-hidden bg-sable">
                <img src={c.img} alt={c.name} loading="lazy" width={800} height={800}
                     className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-charbon/0 group-hover:bg-charbon/30 transition" />
              </div>
              <div className="text-center mt-4 font-display text-sm md:text-base tracking-wide group-hover:text-gold transition uppercase">{c.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="section-y bg-sable">
        <div className="container-os">
          <div className="text-center">
            <div className="eyebrow">Sélection signature</div>
            <h2 className="font-display text-3xl md:text-5xl mt-3">Nos meilleures ventes</h2>
            <div className="mt-4"><span className="divider-gold" /></div>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bestSellers.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
          <div className="text-center mt-12">
            <Link to="/patisserie" className="btn btn-outline-gold">Voir toute la boutique <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* COFFRETS — presets + composer CTA */}
      <section className="section-y bg-beige">
        <div className="container-os">
          <div className="text-center">
            <div className="eyebrow">L'art du coffret</div>
            <h2 className="font-display text-3xl md:text-5xl mt-3">Nos Coffrets Signature</h2>
            <div className="mt-4"><span className="divider-gold" /></div>
            <p className="mt-5 text-charbon/70 max-w-xl mx-auto font-light">
              Six formats pensés pour chaque occasion — ou composez le vôtre, pièce par pièce.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { name: "Dégustation", pieces: 6, price: 21, tag: "Petit format" },
              { name: "Découverte", pieces: 12, price: 42, tag: "Le plus offert" },
              { name: "Partage", pieces: 18, price: 68, tag: "À partager" },
              { name: "Prestige", pieces: 24, price: 92, tag: "Signature" },
              { name: "Réception", pieces: 36, price: 141, tag: "Réceptions" },
              { name: "Royal", pieces: 48, price: 183, tag: "Grand format" },
            ].map((c) => (
              <Link
                key={c.name}
                to="/composer"
                search={{ size: String(c.pieces) as "6" | "12" | "18" | "24" | "36" | "48" }}
                className="group relative aspect-[3/4] overflow-hidden ring-1 ring-gold/20 hover:ring-gold transition"
              >
                <img src={composerHero} alt={`Coffret ${c.name}`} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/85" />
                <div className="absolute top-4 left-4 text-[10px] tracking-[0.3em] uppercase text-gold">{c.tag}</div>
                <div className="relative z-10 h-full flex flex-col justify-end p-6 text-white">
                  <div className="font-display text-3xl md:text-4xl">Coffret {c.name}</div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-[11px] tracking-[0.25em] uppercase text-white/80">{c.pieces} pièces</span>
                    <span className="text-white/40">·</span>
                    <span className="font-price text-lg text-gold">dès {c.price}€</span>
                  </div>
                  <span className="mt-4 inline-block h-px w-8 bg-gold group-hover:w-16 transition-all duration-500" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-12 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link to="/composer" className="btn btn-gold">
              Composez votre coffret <ChevronRight className="h-4 w-4" />
            </Link>
            <span className="text-xs tracking-[0.2em] uppercase text-charbon/50">Sur mesure · 6 à 48 pièces</span>
          </div>
        </div>
      </section>

      {/* GIFTS BY OCCASION */}
      <section className="section-y bg-ivory">
        <div className="container-os">
          <div className="text-center">
            <div className="eyebrow">Pour chaque occasion</div>
            <h2 className="font-display text-4xl md:text-5xl mt-3">L'Art d'Offrir</h2>
            <div className="mt-4"><span className="divider-gold" /></div>
          </div>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {giftCategories.slice(0, 6).map((g) => (
              <ImmersiveCard key={g.slug} to="/cadeaux/$slug" params={{ slug: g.slug }} image={g.image} title={g.label} ratio="landscape" />
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/cadeaux" className="btn btn-outline-gold">Tous les cadeaux <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      {/* MARIAGE */}
      <section className="relative h-[560px] overflow-hidden">
        <img src={weddingHero} alt="Buffet mariage" loading="lazy" width={1920} height={1024} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-charbon/85 via-charbon/55 to-transparent" />
        <div className="relative z-10 container-os h-full flex items-center">
          <div className="max-w-xl text-white">
            <div className="eyebrow text-gold">Vos plus beaux jours</div>
            <h2 className="font-display text-3xl md:text-5xl mt-3 text-white leading-tight">
              Pour le plus beau jour <em className="italic text-gold">de votre vie</em>
            </h2>
            <p className="mt-6 text-white/85 leading-relaxed">
              Pièces montées et buffets de pâtisseries orientales sur mesure pour mariages, fiançailles et événements d'exception.
            </p>
            <Link to="/evenements/mariage" className="btn btn-gold mt-8 inline-flex">Voir nos packs mariage</Link>
          </div>
        </div>
      </section>

      {/* INSTAGRAM */}
      <section className="section-y bg-ivory">
        <div className="container-os text-center">
          <div className="eyebrow">@osweet_patisserie</div>
          <h2 className="font-display text-3xl md:text-5xl mt-3">Suivez nos créations</h2>
          <div className="mt-4"><span className="divider-gold" /></div>
          <p className="mt-5 text-charbon/70 max-w-xl mx-auto font-light">
            Les dernières créations sorties de l'atelier, en temps réel.
          </p>
        </div>
        {/* Static grid — ready to be wired to Instagram Basic Display API
            when a long-lived token is provided. Fetch /me/media and map src urls. */}
        <div className="container-os mt-12 grid grid-cols-2 md:grid-cols-4 gap-3">
          {igPhotos.map((img, i) => (
            <a key={i} href="https://www.instagram.com/osweet_patisserie/" target="_blank" rel="noreferrer" className="block relative aspect-square overflow-hidden group">
              <img src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-110 transition duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-charbon/80 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-4">
                <Instagram className="h-5 w-5 text-white" />
              </div>
            </a>
          ))}
        </div>
        <div className="text-center mt-10">
          <a href="https://www.instagram.com/osweet_patisserie/" target="_blank" rel="noreferrer" className="btn btn-outline-gold">
            <Instagram className="h-4 w-4" /> Suivre @osweet_patisserie
          </a>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="bg-gold text-white">
        <div className="container-os py-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl text-white">Recevez nos créations en avant-première</h2>
          <p className="mt-3 text-white/85 max-w-xl mx-auto font-light">
            Nouvelles collections, créations saisonnières, offres exclusives.
          </p>
          <form className="mt-8 max-w-md mx-auto flex gap-2" onSubmit={(e) => { e.preventDefault(); alert("Merci ! Inscription enregistrée."); }}>
            <input type="email" required placeholder="Votre email" className="flex-1 px-4 py-3 text-charbon placeholder:text-charbon/40 bg-white outline-none focus:ring-2 focus:ring-white/40" />
            <button type="submit" className="btn bg-charbon text-white hover:bg-black border-charbon">S'inscrire</button>
          </form>
        </div>
      </section>
    </div>
  );
}
